/**
 * SVTR.AI 高级检索服务
 * 2025年优化版 - 图谱RAG + 自适应检索 + 重排序
 */

import { createRealTimeDataService, createReRankingService } from './realtime-data-service';

interface GraphNode {
  id: string;
  type: 'company' | 'person' | 'investment' | 'trend' | 'technology';
  properties: Record<string, any>;
  relationships: GraphRelation[];
}

interface GraphRelation {
  type: 'invested_in' | 'founded_by' | 'competes_with' | 'related_to' | 'trend_in';
  target: string;
  properties: Record<string, any>;
  weight: number;
}

interface RetrievalResult {
  id: string;
  content: string;
  title: string;
  score: number;
  source: string;
  metadata: any;
  reasoning?: string;
  graphContext?: GraphNode[];
}

export class AdvancedRetrievalService {
  private vectorize: any;
  private ai: any;
  private openaiApiKey?: string;
  private knowledgeGraph: Map<string, GraphNode>;
  private embeddingCache: Map<string, number[]>;
  private realTimeService: any;
  private rerankingService: any;

  constructor(vectorize: any, ai: any, openaiApiKey?: string) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    this.knowledgeGraph = new Map();
    this.embeddingCache = new Map();
    
    // 初始化增强服务
    this.realTimeService = createRealTimeDataService();
    this.rerankingService = createReRankingService(ai);
  }

  /**
   * 自适应智能检索 - 2025年增强版
   */
  async performAdaptiveRetrieval(
    query: string, 
    options: any = {}
  ): Promise<{ matches: RetrievalResult[], metadata: any }> {
    const startTime = Date.now();
    
    try {
      // 1. 查询分析和策略选择
      const queryAnalysis = await this.analyzeQuery(query);
      const strategy = this.selectRetrievalStrategy(queryAnalysis);
      
      console.log(`🎯 检索策略: ${strategy.name}, 复杂度: ${queryAnalysis.complexity}`);

      // 2. 执行多策略检索
      const retrievalTasks = await this.executeMultiStrategyRetrieval(query, strategy, options);
      
      // 3. 获取实时数据
      const realTimeResults = await this.getRealTimeDataIfNeeded(query, queryAnalysis, options);
      
      // 4. 结果融合
      const allResults = [...retrievalTasks.reduce((acc, task) => [...acc, ...task.results], []), ...realTimeResults];
      
      // 5. 智能重排序
      const rerankedResults = await this.rerankingService.rerank(query, allResults, {
        topK: options.topK || 8,
        includeRealTime: true
      });
      
      // 6. 图谱上下文增强
      const enhancedResults = await this.enhanceWithGraphContext(rerankedResults, query);
      
      return {
        matches: enhancedResults,
        metadata: {
          strategy: strategy.name,
          queryAnalysis,
          processingTime: Date.now() - startTime,
          totalCandidates: retrievalTasks.reduce((sum, task) => sum + task.results.length, 0),
          finalCount: enhancedResults.length
        }
      };
    } catch (error) {
      console.error('高级检索失败:', error);
      return { matches: [], metadata: { error: error.message } };
    }
  }

  /**
   * 查询分析 - AI驱动的意图理解
   */
  private async analyzeQuery(query: string): Promise<any> {
    const analysis = {
      intent: this.classifyIntent(query),
      entities: this.extractEntities(query),
      complexity: this.calculateComplexity(query),
      temporality: this.detectTemporality(query),
      specificity: this.measureSpecificity(query)
    };

    // 使用AI进行更深度的查询理解
    if (this.ai) {
      try {
        const aiAnalysis = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [{
            role: 'system',
            content: '你是一个查询分析专家。分析用户查询的意图、实体和检索需求。用JSON格式回答。'
          }, {
            role: 'user',
            content: `分析这个查询: "${query}"`
          }],
          max_tokens: 500
        });

        if (aiAnalysis.response) {
          const aiResult = this.parseAIAnalysis(aiAnalysis.response);
          Object.assign(analysis, aiResult);
        }
      } catch (error) {
        console.log('AI查询分析失败，使用规则分析');
      }
    }

    return analysis;
  }

  /**
   * 选择最优检索策略
   */
  private selectRetrievalStrategy(analysis: any): any {
    const strategies = {
      hybrid_dense_sparse: {
        name: 'hybrid_dense_sparse',
        description: '密集+稀疏混合检索',
        suitable: analysis.complexity > 0.7 || analysis.specificity > 0.8,
        weight: 1.0
      },
      graph_enhanced: {
        name: 'graph_enhanced',
        description: '图谱增强检索',
        suitable: analysis.entities.length > 2 || analysis.intent === 'relationship',
        weight: 0.9
      },
      semantic_search: {
        name: 'semantic_search',
        description: '语义搜索',
        suitable: analysis.intent === 'conceptual' || analysis.complexity > 0.5,
        weight: 0.8
      },
      keyword_boosted: {
        name: 'keyword_boosted',
        description: '关键词增强检索',
        suitable: analysis.specificity > 0.6 || analysis.entities.length > 0,
        weight: 0.7
      },
      temporal_aware: {
        name: 'temporal_aware',
        description: '时间感知检索',
        suitable: analysis.temporality.hasTemporal,
        weight: 0.6
      }
    };

    // 选择最适合的策略
    let bestStrategy = strategies.semantic_search;
    let bestScore = 0;

    for (const [key, strategy] of Object.entries(strategies)) {
      if (strategy.suitable) {
        const score = strategy.weight * (analysis.complexity + analysis.specificity) / 2;
        if (score > bestScore) {
          bestScore = score;
          bestStrategy = strategy;
        }
      }
    }

    return bestStrategy;
  }

  /**
   * 执行多策略检索
   */
  private async executeMultiStrategyRetrieval(
    query: string, 
    strategy: any, 
    options: any
  ): Promise<any[]> {
    const tasks = [];

    switch (strategy.name) {
      case 'hybrid_dense_sparse':
        tasks.push(
          this.denseVectorSearch(query, options),
          this.sparseKeywordSearch(query, options),
          this.semanticPatternMatch(query, options)
        );
        break;
      
      case 'graph_enhanced':
        tasks.push(
          this.graphTraversalSearch(query, options),
          this.entityBasedSearch(query, options),
          this.denseVectorSearch(query, options)
        );
        break;
      
      case 'semantic_search':
        tasks.push(
          this.denseVectorSearch(query, { ...options, topK: 15 }),
          this.conceptualSearch(query, options)
        );
        break;
      
      case 'keyword_boosted':
        tasks.push(
          this.sparseKeywordSearch(query, { ...options, boost: true }),
          this.denseVectorSearch(query, options)
        );
        break;
        
      case 'temporal_aware':
        tasks.push(
          this.temporalSearch(query, options),
          this.denseVectorSearch(query, options)
        );
        break;
    }

    const results = await Promise.allSettled(tasks);
    return results
      .filter(result => result.status === 'fulfilled')
      .map((result: any, index) => ({
        strategy: strategy.name,
        taskIndex: index,
        results: result.value?.matches || result.value || []
      }));
  }

  /**
   * 密集向量搜索 - 改进版
   */
  private async denseVectorSearch(query: string, options: any): Promise<{ matches: any[] }> {
    try {
      // 查询扩展
      const expandedQuery = await this.expandQuery(query);
      const queryEmbedding = await this.getQueryEmbedding(expandedQuery);
      
      const results = await this.vectorize.query(queryEmbedding, {
        topK: options.topK || 10,
        returnMetadata: 'all',
        filter: options.filter
      });

      return {
        matches: (results.matches || []).map(match => ({
          id: match.id,
          content: match.metadata?.content || '',
          title: match.metadata?.title || '',
          score: match.score,
          source: 'dense_vector',
          metadata: match.metadata,
          reasoning: `向量相似度: ${(match.score * 100).toFixed(1)}%`
        }))
      };
    } catch (error) {
      console.error('密集向量搜索失败:', error);
      return { matches: [] };
    }
  }

  /**
   * 稀疏关键词搜索 - BM25风格
   */
  private async sparseKeywordSearch(query: string, options: any): Promise<{ matches: any[] }> {
    const keywords = this.extractKeywords(query);
    const documents = await this.getDocuments();
    
    const scoredDocs = documents.map(doc => {
      const bm25Score = this.calculateBM25Score(keywords, doc, documents);
      return {
        ...doc,
        score: bm25Score,
        source: 'sparse_keyword',
        reasoning: `BM25评分: ${bm25Score.toFixed(3)}`
      };
    }).filter(doc => doc.score > 0.1);

    return {
      matches: scoredDocs
        .sort((a, b) => b.score - a.score)
        .slice(0, options.topK || 10)
    };
  }

  /**
   * 图谱遍历搜索
   */
  private async graphTraversalSearch(query: string, options: any): Promise<{ matches: any[] }> {
    const entities = this.extractEntities(query);
    const matches = [];

    for (const entity of entities) {
      const node = this.knowledgeGraph.get(entity.toLowerCase());
      if (node) {
        // 添加直接匹配
        matches.push({
          id: node.id,
          content: this.nodeToContent(node),
          title: node.properties.name || entity,
          score: 0.9,
          source: 'graph_direct',
          graphContext: [node],
          reasoning: `直接实体匹配: ${entity}`
        });

        // 遍历关系
        for (const relation of node.relationships) {
          const relatedNode = this.knowledgeGraph.get(relation.target);
          if (relatedNode) {
            matches.push({
              id: relatedNode.id,
              content: this.nodeToContent(relatedNode),
              title: relatedNode.properties.name || relation.target,
              score: 0.7 * relation.weight,
              source: 'graph_related',
              graphContext: [node, relatedNode],
              reasoning: `通过${relation.type}关系连接到${entity}`
            });
          }
        }
      }
    }

    return { matches: matches.slice(0, options.topK || 10) };
  }

  /**
   * 根据查询需要获取实时数据
   */
  private async getRealTimeDataIfNeeded(
    query: string, 
    analysis: any, 
    options: any
  ): Promise<RetrievalResult[]> {
    // 判断是否需要实时数据
    const needsRealTime = this.shouldFetchRealTimeData(query, analysis);
    
    if (!needsRealTime) {
      console.log('📚 查询不需要实时数据，使用知识库即可');
      return [];
    }
    
    console.log('🌐 检测到需要实时数据，正在获取...');
    
    try {
      const realTimeData = await this.realTimeService.getRealTimeData(query, {
        maxSources: 2,
        topK: 3
      });
      
      // 转换为标准格式
      return realTimeData.map(item => ({
        id: item.id,
        content: item.content,
        title: item.title,
        score: item.relevanceScore,
        source: `realtime_${item.dataType}`,
        metadata: { ...item.metadata, realTime: true, timestamp: item.timestamp },
        reasoning: `实时数据: ${item.source}`
      }));
      
    } catch (error) {
      console.error('获取实时数据失败:', error);
      return [];
    }
  }

  /**
   * 判断是否需要实时数据
   */
  private shouldFetchRealTimeData(query: string, analysis: any): boolean {
    const lowerQuery = query.toLowerCase();
    
    // 时间相关词汇
    const timeKeywords = ['最新', '今天', '现在', '当前', '实时', '最近', '今年', '2025'];
    const hasTimeKeywords = timeKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // 动态信息关键词
    const dynamicKeywords = ['新闻', '动态', '发布', '公告', '更新', '变化'];
    const hasDynamicKeywords = dynamicKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // 市场相关查询
    const marketKeywords = ['股价', '市值', '融资', '投资', '估值', '轮次'];
    const hasMarketKeywords = marketKeywords.some(keyword => lowerQuery.includes(keyword));
    
    // 满足任一条件就获取实时数据
    return hasTimeKeywords || hasDynamicKeywords || hasMarketKeywords || analysis.temporality.hasTemporal;
  }

  /**
   * 结果融合和重排序 - 学习排序 (已弃用，使用新的重排序服务)
   */
  private async fuseAndRerank(
    retrievalTasks: any[], 
    query: string, 
    analysis: any
  ): Promise<RetrievalResult[]> {
    // 收集所有候选结果
    const allCandidates: RetrievalResult[] = [];
    
    retrievalTasks.forEach(task => {
      task.results.forEach(result => {
        allCandidates.push({
          ...result,
          retrievalStrategy: task.strategy
        });
      });
    });

    // 去重
    const deduplicated = this.deduplicateResults(allCandidates);

    // 重排序 - 多因子评分
    const reranked = deduplicated.map(result => ({
      ...result,
      finalScore: this.calculateFinalScore(result, query, analysis)
    })).sort((a, b) => b.finalScore - a.finalScore);

    return reranked.slice(0, 8);
  }

  /**
   * 图谱上下文增强
   */
  private async enhanceWithGraphContext(
    results: RetrievalResult[], 
    query: string
  ): Promise<RetrievalResult[]> {
    return results.map(result => {
      // 为每个结果添加图谱上下文
      if (!result.graphContext) {
        const relatedEntities = this.findRelatedEntities(result.content);
        result.graphContext = relatedEntities;
      }
      
      return result;
    });
  }

  /**
   * 查询扩展 - 同义词和相关概念
   */
  private async expandQuery(query: string): Promise<string> {
    const expansions = [];
    
    // 同义词扩展
    const synonyms = this.getSynonyms(query);
    expansions.push(...synonyms);
    
    // 相关概念扩展
    const concepts = this.getRelatedConcepts(query);
    expansions.push(...concepts);
    
    return [query, ...expansions.slice(0, 3)].join(' ');
  }

  /**
   * 计算最终评分 - 多因子融合
   */
  private calculateFinalScore(
    result: RetrievalResult, 
    query: string, 
    analysis: any
  ): number {
    let score = result.score || 0.5;
    
    // 策略权重
    const strategyWeights = {
      'dense_vector': 1.0,
      'sparse_keyword': 0.9,
      'graph_direct': 1.1,
      'graph_related': 0.8,
      'semantic_pattern': 0.85
    };
    
    score *= strategyWeights[result.source] || 1.0;
    
    // 内容质量因子
    if (result.content.length > 200) score *= 1.1;
    if (result.title && result.title.length > 0) score *= 1.05;
    
    // 图谱上下文因子
    if (result.graphContext && result.graphContext.length > 0) {
      score *= 1.2;
    }
    
    // 查询匹配因子
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = result.content.toLowerCase().split(/\s+/);
    const overlap = queryWords.filter(w => contentWords.includes(w)).length;
    const overlapRatio = overlap / queryWords.length;
    score *= (0.8 + 0.4 * overlapRatio);
    
    return Math.min(score, 1.0);
  }

  /**
   * 工具方法
   */
  private classifyIntent(query: string): string {
    const patterns = {
      'factual': /什么是|定义|介绍|概念/,
      'comparison': /对比|比较|差异|区别/,
      'trend': /趋势|发展|未来|预测/,
      'relationship': /关系|连接|影响|关联/,
      'investment': /投资|融资|估值|轮次/
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) return intent;
    }
    
    return 'general';
  }

  private extractEntities(query: string): string[] {
    // 简单实体提取 - 生产环境可用NER模型
    const entities = [];
    const words = query.split(/\s+/);
    
    // 识别大写词汇和专有名词
    for (const word of words) {
      if (word.length > 2 && (
        /^[A-Z]/.test(word) || 
        /AI|智能|创投|投资|公司/.test(word)
      )) {
        entities.push(word);
      }
    }
    
    return entities;
  }

  private calculateComplexity(query: string): number {
    let complexity = 0;
    
    if (query.length > 50) complexity += 0.3;
    if (/[？?]/.test(query)) complexity += 0.2;
    if (query.split(/\s+/).length > 10) complexity += 0.3;
    if (/分析|对比|评价|如何|为什么/.test(query)) complexity += 0.4;
    
    return Math.min(complexity, 1.0);
  }

  private detectTemporality(query: string): any {
    const temporalWords = ['最新', '2024', '2025', '今年', '去年', '未来', '趋势'];
    const hasTemporal = temporalWords.some(word => query.includes(word));
    
    return { hasTemporal, temporalWords: temporalWords.filter(w => query.includes(w)) };
  }

  private measureSpecificity(query: string): number {
    const specificWords = ['公司', '投资', '轮次', '估值', '创始人', 'CEO'];
    const matches = specificWords.filter(word => query.includes(word)).length;
    return Math.min(matches / specificWords.length, 1.0);
  }

  private parseAIAnalysis(response: string): any {
    try {
      return JSON.parse(response);
    } catch {
      return {};
    }
  }

  private async getQueryEmbedding(query: string): Promise<number[]> {
    if (this.embeddingCache.has(query)) {
      return this.embeddingCache.get(query)!;
    }

    let embedding: number[];
    
    if (this.openaiApiKey) {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: query
        })
      });
      
      const data = await response.json();
      embedding = data.data[0].embedding;
    } else if (this.ai) {
      const result = await this.ai.run('@cf/baai/bge-base-en-v1.5', { text: query });
      embedding = result.data[0];
    } else {
      throw new Error('No embedding service available');
    }

    this.embeddingCache.set(query, embedding);
    return embedding;
  }

  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  private calculateBM25Score(keywords: string[], doc: any, allDocs: any[]): number {
    const k1 = 1.5;
    const b = 0.75;
    const avgdl = allDocs.reduce((sum, d) => sum + d.content.length, 0) / allDocs.length;
    const dl = doc.content.length;
    
    let score = 0;
    for (const keyword of keywords) {
      const tf = (doc.content.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      const df = allDocs.filter(d => d.content.toLowerCase().includes(keyword)).length;
      const idf = Math.log((allDocs.length - df + 0.5) / (df + 0.5));
      
      score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl)));
    }
    
    return score;
  }

  private deduplicateResults(results: RetrievalResult[]): RetrievalResult[] {
    const seen = new Set();
    return results.filter(result => {
      const key = result.id || result.content.substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private nodeToContent(node: GraphNode): string {
    return `${node.properties.name || node.id}: ${node.properties.description || ''}`;
  }

  private findRelatedEntities(content: string): GraphNode[] {
    // 简单实现 - 基于关键词匹配
    const relatedNodes: GraphNode[] = [];
    for (const [id, node] of this.knowledgeGraph) {
      if (content.toLowerCase().includes(node.properties.name?.toLowerCase() || '')) {
        relatedNodes.push(node);
        if (relatedNodes.length >= 3) break;
      }
    }
    return relatedNodes;
  }

  private getSynonyms(query: string): string[] {
    const synonymMap = {
      '投资': ['融资', '资金', '注资'],
      '公司': ['企业', '初创', '创业公司'],
      'AI': ['人工智能', '智能', '机器学习'],
      '趋势': ['发展', '走向', '前景']
    };
    
    const synonyms = [];
    for (const [word, syns] of Object.entries(synonymMap)) {
      if (query.includes(word)) {
        synonyms.push(...syns);
      }
    }
    
    return synonyms;
  }

  private getRelatedConcepts(query: string): string[] {
    // 简单的概念关联
    if (query.includes('投资')) return ['估值', '轮次', 'VC'];
    if (query.includes('AI')) return ['深度学习', '神经网络', '算法'];
    if (query.includes('创业')) return ['初创', '孵化', '加速器'];
    
    return [];
  }

  private async getDocuments(): Promise<any[]> {
    // 这里应该从实际数据源获取文档
    // 暂时返回空数组，实际实现时需要连接到文档存储
    return [];
  }

  // 其他搜索方法的简单实现
  private async semanticPatternMatch(query: string, options: any) {
    return { matches: [] };
  }

  private async entityBasedSearch(query: string, options: any) {
    return { matches: [] };
  }

  private async conceptualSearch(query: string, options: any) {
    return { matches: [] };
  }

  private async temporalSearch(query: string, options: any) {
    return { matches: [] };
  }
}

/**
 * 创建高级检索服务
 */
export function createAdvancedRetrieval(vectorize: any, ai: any, openaiApiKey?: string) {
  return new AdvancedRetrievalService(vectorize, ai, openaiApiKey);
}