/**
 * SVTR.AI 混合RAG服务
 * 结合多种检索策略，实现成本优化和质量保证
 */

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
  private kvNamespace: any;

  constructor(vectorize: any, ai: any, openaiApiKey?: string, kvNamespace?: any) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    this.kvNamespace = kvNamespace;
    
    // 智能配置：根据可用资源自动选择策略
    this.config = {
      useOpenAI: !!openaiApiKey,
      useCloudflareAI: !!ai,
      useKeywordSearch: true,
      fallbackEnabled: true
    };
  }

  /**
   * 智能检索：多策略并行
   */
  async performIntelligentRAG(query: string, options: any = {}) {
    const strategies = [];
    
    // 策略1: 向量检索（如果可用）
    if (this.config.useOpenAI || this.config.useCloudflareAI) {
      strategies.push(this.vectorSearch(query, options));
    }
    
    // 策略2: 关键词检索（总是可用）
    strategies.push(this.keywordSearch(query, options));
    
    // 策略3: 模糊语义匹配
    strategies.push(this.semanticPatternMatch(query, options));
    
    // 并行执行所有策略
    const results = await Promise.allSettled(strategies);
    
    // 合并和排序结果
    return this.mergeResults(results, query);
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
   * 获取存储的文档（从KV存储读取，带fallback）
   */
  private async getStoredDocuments() {
    try {
      // 优先从KV存储读取（支持自动同步）
      if (this.kvNamespace) {
        const kvData = await this.kvNamespace.get('feishu-knowledge-base', 'json');
        if (kvData && kvData.documents) {
          console.log('✅ 从KV存储读取飞书知识库，文档数量:', kvData.documents.length);
          return kvData.documents;
        }
      }

      // Fallback: 从静态文件读取
      const response = await fetch('/assets/data/rag/improved-feishu-knowledge-base.json');
      if (response.ok) {
        const feishuData = await response.json();
        console.log('✅ 从静态文件读取飞书知识库，文档数量:', feishuData.documents?.length || 0);
        return feishuData.documents || [];
      } else {
        console.log('⚠️ 飞书知识库HTTP响应失败:', response.status);
      }
    } catch (error) {
      console.log('⚠️ 读取飞书知识库失败:', error.message);
    }

    console.log('⚠️ 飞书知识库读取失败，返回空数组');
    return [];
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