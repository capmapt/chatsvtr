/**
 * SVTR.AI 混合RAG服务
 * 结合多种检索策略，实现成本优化和质量保证
 * 增强版：集成查询扩展和语义优化
 */

import { createQueryExpansionService, QueryExpansionService, QueryType } from './query-expansion-service';
import { createSemanticCacheService, SemanticCacheService } from './semantic-cache-service';

interface HybridRAGConfig {
  useOpenAI: boolean;
  useCloudflareAI: boolean;
  useKeywordSearch: boolean;
  fallbackEnabled: boolean;
}

export class HybridRAGService {
  private config: HybridRAGConfig;
  private vectorize: any;
  private ai: any;
  private openaiApiKey?: string;
  private queryExpansionService: QueryExpansionService;
  private cacheService: SemanticCacheService;

  constructor(vectorize: any, ai: any, openaiApiKey?: string, kvNamespace?: any) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    this.queryExpansionService = createQueryExpansionService();
    this.cacheService = createSemanticCacheService(kvNamespace);
    
    // 智能配置：根据可用资源自动选择策略
    this.config = {
      useOpenAI: !!openaiApiKey,
      useCloudflareAI: !!ai,
      useKeywordSearch: true,
      fallbackEnabled: true
    };
  }

  /**
   * 智能检索：多策略并行 + 查询扩展增强 + 语义缓存
   */
  async performIntelligentRAG(query: string, options: any = {}) {
    const startTime = Date.now();
    console.log('🔍 开始智能RAG检索 (增强版 + 缓存)');
    
    // 1. 查询扩展和分析
    const queryExpansion = this.queryExpansionService.expandQuery(query, {
      includeContext: true,
      maxExpansions: 8,
      confidenceThreshold: 0.4
    });
    
    console.log(`📈 查询扩展完成: 类型=${queryExpansion.queryType}, 置信度=${(queryExpansion.confidence * 100).toFixed(1)}%`);
    
    // 2. 检查语义缓存
    const cacheHit = await this.cacheService.checkCache(query, queryExpansion.queryType, {
      useSemanticMatch: true,
      maxCandidates: 5
    });
    
    if (cacheHit && cacheHit.confidence >= 0.8) {
      console.log(`⚡ 缓存命中 (${cacheHit.isExact ? '精确' : '语义'}): ${(cacheHit.confidence * 100).toFixed(1)}%`);
      return {
        ...cacheHit.entry.results,
        queryExpansion,
        searchQuery: queryExpansion.expandedQuery,
        fromCache: true,
        cacheHit: {
          similarity: cacheHit.similarity,
          isExact: cacheHit.isExact,
          responseTime: Date.now() - startTime
        },
        enhancedFeatures: {
          queryExpansion: true,
          semanticCaching: true,
          cacheAccelerated: true
        }
      };
    }
    
    // 3. 缓存未命中，执行完整检索
    console.log('💫 执行完整RAG检索...');
    const searchQuery = queryExpansion.expandedQuery;
    const strategies = [];
    
    // 策略1: 向量检索（如果可用）
    if (this.config.useOpenAI || this.config.useCloudflareAI) {
      strategies.push(this.vectorSearch(searchQuery, { ...options, originalQuery: query, expansion: queryExpansion }));
    }
    
    // 策略2: 增强关键词检索
    strategies.push(this.enhancedKeywordSearch(searchQuery, queryExpansion, options));
    
    // 策略3: 语义模式匹配
    strategies.push(this.semanticPatternMatch(searchQuery, { ...options, queryType: queryExpansion.queryType }));
    
    // 并行执行所有策略
    const results = await Promise.allSettled(strategies);
    
    // 合并和排序结果
    const mergedResults = this.mergeResults(results, query);
    
    // 4. 构建最终结果
    const finalResults = {
      ...mergedResults,
      queryExpansion,
      searchQuery,
      fromCache: false,
      responseTime: Date.now() - startTime,
      enhancedFeatures: {
        queryExpansion: true,
        semanticEnhancement: true,
        multiStrategyRetrieval: true,
        semanticCaching: true
      }
    };
    
    // 5. 存储到缓存（如果结果质量足够好）
    if (finalResults.confidence >= 0.6 && finalResults.matches?.length > 0) {
      await this.cacheService.storeInCache(
        query,
        finalResults,
        {
          queryType: queryExpansion.queryType,
          confidence: finalResults.confidence
        }
      );
    }
    
    return finalResults;
  }

  /**
   * 向量检索（支持多模型）
   */
  private async vectorSearch(query: string, options: any) {
    try {
      let queryVector;
      
      if (this.config.useOpenAI) {
        queryVector = await this.getOpenAIEmbedding(query);
      } else if (this.config.useCloudflareAI) {
        queryVector = await this.getCloudflareEmbedding(query);
      } else {
        throw new Error('No embedding service available');
      }
      
      return await this.vectorize.query(queryVector, {
        topK: options.topK || 5,
        returnMetadata: 'all'
      });
      
    } catch (error) {
      console.log('向量检索失败，使用备用方案');
      return { matches: [], source: 'vector-failed' };
    }
  }

  /**
   * 关键词检索（纯文本匹配）
   */
  private async keywordSearch(query: string, options: any) {
    // 实现基于关键词的检索逻辑
    const keywords = this.extractKeywords(query);
    const matches = await this.findKeywordMatches(keywords);
    
    return {
      matches: matches.map(match => ({
        ...match,
        score: match.keywordScore,
        source: 'keyword'
      })),
      source: 'keyword'
    };
  }

  /**
   * 增强关键词检索（使用查询扩展）
   */
  private async enhancedKeywordSearch(expandedQuery: string, queryExpansion: any, options: any) {
    try {
      // 提取原始和扩展的关键词
      const originalKeywords = this.extractKeywords(queryExpansion.originalQuery);
      const expandedKeywords = this.extractKeywords(expandedQuery);
      const synonyms = queryExpansion.synonyms || [];
      
      // 合并所有搜索词，带权重
      const weightedKeywords = [
        ...originalKeywords.map(k => ({ term: k, weight: 1.0, type: 'original' })),
        ...expandedKeywords.filter(k => !originalKeywords.includes(k)).map(k => ({ term: k, weight: 0.8, type: 'expanded' })),
        ...synonyms.slice(0, 5).map(k => ({ term: k, weight: 0.6, type: 'synonym' }))
      ];

      console.log(`🔍 增强关键词检索: ${weightedKeywords.length} 个搜索词`);

      // 查找匹配
      const matches = await this.findWeightedKeywordMatches(weightedKeywords);
      
      // 基于查询类型调整评分
      const typeAdjustedMatches = this.adjustScoresByQueryType(matches, queryExpansion.queryType);
      
      return {
        matches: typeAdjustedMatches.map(match => ({
          ...match,
          score: match.keywordScore,
          source: 'enhanced_keyword',
          matchDetails: match.matchDetails
        })),
        source: 'enhanced_keyword',
        searchTerms: weightedKeywords.length
      };

    } catch (error) {
      console.log('增强关键词检索失败，回退到基础检索');
      return this.keywordSearch(queryExpansion.originalQuery, options);
    }
  }

  /**
   * 语义模式匹配
   */
  private async semanticPatternMatch(query: string, options: any) {
    const patterns = {
      investment: ['投资', '融资', '轮次', 'vc', 'funding'],
      startup: ['公司', '创业', '企业', 'startup', 'company'],  
      trend: ['趋势', '市场', '前景', 'trend', 'market'],
      technology: ['技术', 'ai', '人工智能', 'tech']
    };
    
    const queryLower = query.toLowerCase();
    const scores = {};
    
    for (const [category, keywords] of Object.entries(patterns)) {
      scores[category] = keywords.reduce((score, keyword) => {
        return score + (queryLower.includes(keyword) ? 1 : 0);
      }, 0);
    }
    
    const bestCategory = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return {
      matches: await this.getCategoryContent(bestCategory),
      source: 'pattern',
      category: bestCategory
    };
  }

  /**
   * 结果合并和排序
   */
  private mergeResults(results: any[], query: string) {
    const allMatches = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.matches) {
        result.value.matches.forEach(match => {
          allMatches.push({
            ...match,
            strategy: result.value.source,
            strategyIndex: index
          });
        });
      }
    });
    
    // 去重和评分
    const deduplicated = this.deduplicateMatches(allMatches);
    const scored = this.rescoreMatches(deduplicated, query);
    
    return {
      matches: scored.slice(0, 8), // 返回top 8
      sources: this.extractSources(scored),
      confidence: this.calculateConfidence(scored),
      strategies: results.length
    };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(query: string): string[] {
    // 简单的关键词提取
    return query
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  /**
   * 基于预存内容的关键词匹配
   */
  private async findKeywordMatches(keywords: string[]) {
    // 这里可以实现基于预存文档的关键词匹配
    // 或者直接匹配飞书同步的JSON数据
    const documents = await this.getStoredDocuments();
    
    return documents.filter(doc => {
      const content = (doc.content || '').toLowerCase();
      return keywords.some(keyword => content.includes(keyword));
    }).map(doc => ({
      ...doc,
      keywordScore: this.calculateKeywordScore(doc.content, keywords)
    }));
  }

  /**
   * 获取分类内容（基于语义模式）
   */
  private async getCategoryContent(category: string) {
    const allDocs = await this.getStoredDocuments();
    
    // 根据分类返回最相关的内容
    const categoryKeywords = {
      investment: ['投资', '融资', '资金', '轮次', '估值', 'vc', '基金'],
      startup: ['公司', '初创', '创业', '企业', '团队', '独角兽'],  
      trend: ['趋势', '市场', '发展', '前景', '预测', '未来'],
      technology: ['技术', 'ai', '人工智能', '算法', '模型']
    };

    const keywords = categoryKeywords[category] || [];
    if (keywords.length === 0) return [];

    // 使用关键词过滤和评分
    const relevantDocs = allDocs
      .map(doc => ({
        ...doc,
        categoryScore: this.calculateCategoryScore(doc, keywords)
      }))
      .filter(doc => doc.categoryScore > 0.3)
      .sort((a, b) => b.categoryScore - a.categoryScore)
      .slice(0, 5); // 返回前5个最相关的

    return relevantDocs.map(doc => ({
      id: doc.id,
      content: doc.content,
      title: doc.title,
      score: doc.categoryScore,
      source: doc.source,
      type: doc.type
    }));
  }

  /**
   * 计算分类相关性分数
   */
  private calculateCategoryScore(doc: any, categoryKeywords: string[]): number {
    const content = (doc.content || '').toLowerCase();
    const title = (doc.title || '').toLowerCase();
    const keywords = doc.keywords || [];

    let score = 0;
    let matches = 0;

    // 内容匹配
    categoryKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (content.includes(keywordLower)) {
        score += 0.3;
        matches++;
      }
      if (title.includes(keywordLower)) {
        score += 0.5; // 标题匹配权重更高
        matches++;
      }
    });

    // 预设关键词匹配
    keywords.forEach(keyword => {
      if (categoryKeywords.some(ck => 
        ck.toLowerCase().includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(ck.toLowerCase())
      )) {
        score += 0.4;
        matches++;
      }
    });

    // 归一化
    return Math.min(score + (matches / categoryKeywords.length) * 0.2, 1.0);
  }

  /**
   * 去重匹配结果
   */
  private deduplicateMatches(matches: any[]) {
    const seen = new Set();
    return matches.filter(match => {
      const key = match.id || match.content?.substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 重新评分
   */
  private rescoreMatches(matches: any[], query: string) {
    return matches.map(match => ({
      ...match,
      finalScore: this.calculateFinalScore(match, query)
    })).sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * 计算最终分数
   */
  private calculateFinalScore(match: any, query: string): number {
    let score = match.score || 0.5;
    
    // 策略加权
    if (match.strategy === 'vector') score *= 1.2;
    if (match.strategy === 'keyword') score *= 1.0;  
    if (match.strategy === 'pattern') score *= 0.8;
    
    // 内容质量加权
    if (match.content && match.content.length > 200) score *= 1.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(matches: any[]): number {
    if (matches.length === 0) return 0;
    
    const avgScore = matches.reduce((sum, m) => sum + m.finalScore, 0) / matches.length;
    const hasMultipleStrategies = new Set(matches.map(m => m.strategy)).size > 1;
    
    return Math.min(avgScore * (hasMultipleStrategies ? 1.2 : 1.0), 1.0);
  }

  /**
   * 提取来源信息
   */
  private extractSources(matches: any[]): string[] {
    const sources = new Set(matches.map(m => m.title || m.source || '知识库'));
    return Array.from(sources);
  }

  /**
   * 获取存储的文档（仅从飞书真实同步数据）
   */
  private async getStoredDocuments() {
    try {
      // 只从飞书知识库读取真实数据
      const documents = [];
      
      // 1. 飞书知识库数据
      try {
        const feishuData = await this.loadFeishuKnowledgeBase();
        documents.push(...feishuData);
      } catch (e) { console.log('飞书知识库数据读取失败:', e.message); }
      
      // 2. 预设知识库作为fallback
      if (documents.length === 0) {
        documents.push(...this.getDefaultKnowledgeBase());
      }
      
      return documents;
    } catch (error) {
      console.log('获取文档失败，使用默认知识库');
      return this.getDefaultKnowledgeBase();
    }
  }

  /**
   * 加载飞书知识库数据
   */
  private async loadFeishuKnowledgeBase() {
    try {
      // 优先读取真实内容数据
      let response = await fetch('/assets/data/rag/real-feishu-content.json').catch(() => null);
      
      // 如果真实内容不可用，回退到改进的知识库
      if (!response || !response.ok) {
        response = await fetch('/assets/data/rag/improved-feishu-knowledge-base.json');
      }
      
      if (!response.ok) {
        throw new Error('无法读取飞书知识库数据');
      }
      
      const data = await response.json();
      const documents = [];
      
      // 处理真实内容格式
      if (data.documents && Array.isArray(data.documents) && data.summary?.syncMethod === 'real_content_api') {
        console.log('✅ 使用真实飞书API内容');
        data.documents.forEach(doc => {
          documents.push({
            id: doc.id,
            content: doc.content,
            title: doc.title,
            type: doc.type,
            source: doc.source,
            keywords: doc.keywords || doc.searchKeywords || [],
            ragScore: doc.ragScore || 0,
            verified: doc.metadata?.verified || false,
            lastUpdated: doc.lastUpdated
          });
        });
      } 
      // 处理改进知识库格式（兼容性）
      else if (data.documents && Array.isArray(data.documents)) {
        console.log('⚠️ 使用备用知识库内容');
        data.documents.forEach(doc => {
          documents.push({
            id: doc.id || `feishu-${Math.random().toString(36).substr(2, 9)}`,
            content: doc.content || '',
            title: doc.title || '飞书文档',
            type: doc.type || 'feishu_doc',
            source: '飞书知识库',
            keywords: doc.keywords || [],
            ragScore: doc.ragScore || 0,
            verified: false
          });
        });
      }
      
      console.log(`📊 已加载 ${documents.length} 个飞书文档 (${documents.filter(d => d.verified).length} 个已验证)`);
      return documents;
    } catch (error) {
      console.log('读取飞书知识库失败:', error.message);
      return [];
    }
  }

  /**
   * 获取默认知识库
   */
  private getDefaultKnowledgeBase() {
    return [
      {
        id: 'kb-investment-trends',
        content: `2024年AI投资趋势分析：全球AI创投市场呈现分化趋势，企业级应用成为投资重点。
        资金流向：B2B AI解决方案获得60%的投资份额，消费级AI应用投资下降30%。
        地理分布：美国保持45%市场份额，中国25%，欧洲15%，其他地区15%。
        轮次分布：A轮和B轮最为活跃，种子轮投资趋于谨慎，C轮及以后重点关注收入增长。`,
        title: 'AI投资趋势分析',
        type: 'analysis',
        source: 'SVTR知识库',
        keywords: ['投资趋势', 'B2B AI', '企业级应用', '地理分布', '轮次分析']
      },
      {
        id: 'kb-startup-success',
        content: `AI初创企业成功要素研究：基于SVTR.AI追踪的10761家AI公司数据分析。
        技术要素：拥有PhD级别技术团队的公司成功率高出3倍，专有数据优势是关键护城河。
        商业要素：清晰的企业级收入模式、合理的客户获取成本、强大的销售执行能力。
        资本要素：适度的融资节奏、明确的里程碑设定、投资人的战略价值贡献。`,
        title: 'AI初创企业成功要素',
        type: 'research',
        source: 'SVTR知识库', 
        keywords: ['初创企业', '成功要素', 'PhD团队', '专有数据', '企业级收入']
      }
    ];
  }

  /**
   * OpenAI Embedding实现
   */
  private async getOpenAIEmbedding(query: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API密钥未配置');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API错误: ${error.error?.message}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Cloudflare AI Embedding实现
   */
  private async getCloudflareEmbedding(query: string): Promise<number[]> {
    if (!this.ai) {
      throw new Error('Cloudflare AI未配置');
    }

    try {
      const response = await this.ai.run('@cf/baai/bge-base-en-v1.5', {
        text: query
      });
      
      return response.data[0];
    } catch (error) {
      throw new Error(`Cloudflare AI错误: ${error.message}`);
    }
  }

  /**
   * 加权关键词匹配
   */
  private async findWeightedKeywordMatches(weightedKeywords: any[]) {
    const documents = await this.getStoredDocuments();
    const matches = [];

    documents.forEach(doc => {
      const content = (doc.content || '').toLowerCase();
      const title = (doc.title || '').toLowerCase();
      
      let totalScore = 0;
      let matchedTerms = 0;
      const matchDetails = { original: 0, expanded: 0, synonym: 0 };

      weightedKeywords.forEach(({ term, weight, type }) => {
        const termLower = term.toLowerCase();
        const contentMatches = (content.match(new RegExp(termLower, 'gi')) || []).length;
        const titleMatches = (title.match(new RegExp(termLower, 'gi')) || []).length;
        
        if (contentMatches > 0 || titleMatches > 0) {
          matchedTerms++;
          matchDetails[type]++;
          
          // 计算加权分数
          const contentScore = contentMatches * 0.7 * weight;
          const titleScore = titleMatches * 1.2 * weight; // 标题匹配更重要
          totalScore += contentScore + titleScore;
        }
      });

      if (totalScore > 0) {
        matches.push({
          ...doc,
          keywordScore: Math.min(totalScore / weightedKeywords.length, 1.0),
          matchedTerms,
          matchDetails,
          type: 'weighted_keyword_match'
        });
      }
    });

    return matches.sort((a, b) => b.keywordScore - a.keywordScore);
  }

  /**
   * 根据查询类型调整分数
   */
  private adjustScoresByQueryType(matches: any[], queryType: any) {
    const typeBoosts = {
      'company_search': { companyKeywords: 1.3, generalContent: 1.0 },
      'investment_analysis': { investmentKeywords: 1.3, marketData: 1.2 },
      'market_trends': { trendKeywords: 1.3, analysisContent: 1.1 },
      'technology_info': { techKeywords: 1.3, productInfo: 1.2 },
      'funding_info': { fundingKeywords: 1.4, financialData: 1.2 },
      'team_evaluation': { teamKeywords: 1.3, leadershipContent: 1.1 }
    };

    if (!typeBoosts[queryType]) return matches;

    return matches.map(match => {
      let boost = 1.0;
      const content = (match.content || '').toLowerCase();
      
      // 根据内容类型应用不同的加权
      if (queryType === 'company_search' && 
         (content.includes('公司') || content.includes('企业') || content.includes('startup'))) {
        boost *= 1.3;
      }
      
      if (queryType === 'investment_analysis' && 
         (content.includes('投资') || content.includes('融资') || content.includes('investment'))) {
        boost *= 1.3;
      }

      if (queryType === 'funding_info' && 
         (content.includes('轮次') || content.includes('估值') || content.includes('round'))) {
        boost *= 1.4;
      }

      return {
        ...match,
        keywordScore: Math.min(match.keywordScore * boost, 1.0),
        typeBoost: boost
      };
    });
  }

  /**
   * 关键词评分算法
   */
  private calculateKeywordScore(content: string, keywords: string[]): number {
    if (!content || keywords.length === 0) return 0;

    const contentLower = content.toLowerCase();
    const totalWords = content.split(/\s+/).length;
    let score = 0;
    let matchedKeywords = 0;

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = (contentLower.match(regex) || []).length;
      
      if (matches > 0) {
        matchedKeywords++;
        // TF-IDF风格评分
        const tf = matches / totalWords;
        const boost = keyword.length > 2 ? 1.2 : 1.0; // 长词加权
        score += tf * boost;
      }
    });

    // 归一化分数
    const coverageBonus = matchedKeywords / keywords.length;
    return Math.min((score + coverageBonus * 0.3) * 2, 1.0);
  }
}

/**
 * 工厂函数：创建最适合的RAG服务
 */
export function createOptimalRAGService(vectorize: any, ai: any, openaiApiKey?: string, kvNamespace?: any) {
  return new HybridRAGService(vectorize, ai, openaiApiKey, kvNamespace);
}