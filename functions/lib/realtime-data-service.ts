/**
 * SVTR.AI 实时数据服务
 * 2025年优化版 - 市场数据 + 新闻聚合 + 趋势分析
 */

interface RealTimeDataSource {
  name: string;
  endpoint: string;
  headers?: Record<string, string>;
  rateLimit: number;
  priority: number;
  dataType: 'market' | 'news' | 'social' | 'company';
}

interface RealTimeResult {
  id: string;
  title: string;
  content: string;
  source: string;
  timestamp: number;
  relevanceScore: number;
  dataType: string;
  metadata: any;
}

export class RealTimeDataService {
  private dataSources: RealTimeDataSource[];
  private cache: Map<string, any>;
  private requestCounts: Map<string, number>;
  private lastReset: number;

  constructor() {
    this.cache = new Map();
    this.requestCounts = new Map();
    this.lastReset = Date.now();
    
    // 配置实时数据源
    this.dataSources = [
      {
        name: 'market_data',
        endpoint: 'https://api.example.com/market', // 实际使用时需要真实API
        priority: 1.0,
        rateLimit: 100,
        dataType: 'market'
      },
      {
        name: 'tech_news',
        endpoint: 'https://api.example.com/news', // 实际使用时需要真实API
        priority: 0.9,
        rateLimit: 200,
        dataType: 'news'
      },
      {
        name: 'company_updates',
        endpoint: 'https://api.example.com/companies', // 实际使用时需要真实API
        priority: 0.8,
        rateLimit: 50,
        dataType: 'company'
      }
    ];
  }

  /**
   * 获取实时相关数据
   */
  async getRealTimeData(query: string, options: any = {}): Promise<RealTimeResult[]> {
    const startTime = Date.now();
    
    try {
      // 分析查询以确定需要的数据类型
      const dataTypes = this.analyzeQueryDataTypes(query);
      console.log('🌐 需要的实时数据类型:', dataTypes);
      
      // 并行获取多个数据源
      const fetchTasks = this.dataSources
        .filter(source => dataTypes.includes(source.dataType))
        .slice(0, options.maxSources || 3)
        .map(source => this.fetchFromSource(source, query));
      
      const results = await Promise.allSettled(fetchTasks);
      
      // 合并和处理结果
      const allResults: RealTimeResult[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          allResults.push(...result.value);
        } else {
          console.log(`数据源 ${this.dataSources[index].name} 获取失败:`, result);
        }
      });
      
      // 按相关性排序
      const sortedResults = allResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, options.topK || 5);
      
      console.log(`🌐 实时数据获取完成: ${sortedResults.length}条结果 (${Date.now() - startTime}ms)`);
      return sortedResults;
      
    } catch (error) {
      console.error('实时数据获取失败:', error);
      return [];
    }
  }

  /**
   * 从特定数据源获取数据
   */
  private async fetchFromSource(source: RealTimeDataSource, query: string): Promise<RealTimeResult[]> {
    // 检查速率限制
    if (!this.checkRateLimit(source)) {
      console.log(`数据源 ${source.name} 达到速率限制`);
      return [];
    }
    
    // 检查缓存
    const cacheKey = `${source.name}:${query}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5分钟缓存
      return cached.data;
    }
    
    try {
      // 模拟实时数据获取 - 实际使用时需要真实API调用
      const mockData = await this.getMockRealTimeData(source, query);
      
      // 缓存结果
      this.cache.set(cacheKey, {
        data: mockData,
        timestamp: Date.now()
      });
      
      // 更新请求计数
      this.incrementRequestCount(source);
      
      return mockData;
      
    } catch (error) {
      console.error(`从 ${source.name} 获取数据失败:`, error);
      return [];
    }
  }

  /**
   * 分析查询以确定所需数据类型
   */
  private analyzeQueryDataTypes(query: string): string[] {
    const types = [];
    const lowerQuery = query.toLowerCase();
    
    // 市场数据
    if (/投资|融资|估值|股价|市值|ipo/.test(lowerQuery)) {
      types.push('market');
    }
    
    // 新闻数据
    if (/最新|新闻|动态|发布|公告/.test(lowerQuery)) {
      types.push('news');
    }
    
    // 公司数据
    if (/公司|初创|企业|创始人|ceo/.test(lowerQuery)) {
      types.push('company');
    }
    
    // 如果没有匹配到特定类型，默认获取新闻
    if (types.length === 0) {
      types.push('news');
    }
    
    return types;
  }

  /**
   * 模拟实时数据获取 - 实际环境中需要连接真实API
   */
  private async getMockRealTimeData(source: RealTimeDataSource, query: string): Promise<RealTimeResult[]> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    const results: RealTimeResult[] = [];
    const currentTime = Date.now();
    
    switch (source.dataType) {
      case 'market':
        results.push({
          id: `market_${currentTime}`,
          title: '2025年AI创投市场最新数据',
          content: `根据最新市场数据显示，AI领域投资在${new Date().toISOString().split('T')[0]}持续增长，总投资额达到新高。重点关注企业级AI应用和基础设施建设。`,
          source: 'RealTime Market Data',
          timestamp: currentTime,
          relevanceScore: this.calculateRelevance(query, 'AI创投市场投资数据'),
          dataType: 'market',
          metadata: { api: source.name, fresh: true }
        });
        break;
        
      case 'news':
        results.push({
          id: `news_${currentTime}`,
          title: 'AI创投行业最新动态',
          content: `【实时】多家知名AI公司今日宣布新一轮融资计划，涉及生成式AI、自动驾驶、企业级AI解决方案等多个细分领域。`,
          source: 'RealTime Tech News',
          timestamp: currentTime,
          relevanceScore: this.calculateRelevance(query, 'AI创投新闻动态'),
          dataType: 'news',
          metadata: { api: source.name, fresh: true }
        });
        break;
        
      case 'company':
        results.push({
          id: `company_${currentTime}`,
          title: 'AI企业最新信息',
          content: `实时企业数据显示，多家AI初创公司正在进行新一轮融资，估值预计将创历史新高。重点关注技术突破和商业化进展。`,
          source: 'RealTime Company Data',
          timestamp: currentTime,
          relevanceScore: this.calculateRelevance(query, 'AI企业融资信息'),
          dataType: 'company',
          metadata: { api: source.name, fresh: true }
        });
        break;
    }
    
    return results;
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevance(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const qWord of queryWords) {
      if (contentWords.some(cWord => cWord.includes(qWord) || qWord.includes(cWord))) {
        matches++;
      }
    }
    
    const baseScore = matches / queryWords.length;
    
    // 实时数据有额外加分
    const timeBonus = 0.2;
    
    return Math.min(baseScore + timeBonus, 1.0);
  }

  /**
   * 检查速率限制
   */
  private checkRateLimit(source: RealTimeDataSource): boolean {
    // 每小时重置计数器
    if (Date.now() - this.lastReset > 60 * 60 * 1000) {
      this.requestCounts.clear();
      this.lastReset = Date.now();
    }
    
    const currentCount = this.requestCounts.get(source.name) || 0;
    return currentCount < source.rateLimit;
  }

  /**
   * 增加请求计数
   */
  private incrementRequestCount(source: RealTimeDataSource): void {
    const currentCount = this.requestCounts.get(source.name) || 0;
    this.requestCounts.set(source.name, currentCount + 1);
  }

  /**
   * 清除过期缓存
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 10 * 60 * 1000) { // 10分钟过期
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取服务统计
   */
  getStats(): any {
    return {
      cacheSize: this.cache.size,
      requestCounts: Object.fromEntries(this.requestCounts),
      dataSources: this.dataSources.length,
      lastReset: this.lastReset
    };
  }
}

/**
 * 重排序服务
 */
export class ReRankingService {
  private ai: any;
  
  constructor(ai: any) {
    this.ai = ai;
  }

  /**
   * 基于查询对结果进行重排序
   */
  async rerank(
    query: string, 
    results: any[], 
    options: any = {}
  ): Promise<any[]> {
    if (results.length <= 1) return results;
    
    try {
      console.log(`🔄 重排序 ${results.length} 个结果`);
      
      // 使用多因子评分进行重排序
      const rerankedResults = await Promise.all(
        results.map(async (result, index) => ({
          ...result,
          rerankScore: await this.calculateRerankScore(query, result, results, options),
          originalIndex: index
        }))
      );
      
      // 按重排序分数排序
      const sorted = rerankedResults
        .sort((a, b) => b.rerankScore - a.rerankScore)
        .slice(0, options.topK || results.length);
      
      console.log(`✅ 重排序完成，前3名分数: ${sorted.slice(0, 3).map(r => r.rerankScore.toFixed(3)).join(', ')}`);
      
      return sorted;
      
    } catch (error) {
      console.error('重排序失败:', error);
      return results;
    }
  }

  /**
   * 计算重排序分数
   */
  private async calculateRerankScore(
    query: string,
    result: any,
    allResults: any[],
    options: any
  ): Promise<number> {
    let score = result.score || result.relevanceScore || 0.5;
    
    // 1. 内容相关性 (40%)
    const contentRelevance = this.calculateContentRelevance(query, result.content || '');
    score += contentRelevance * 0.4;
    
    // 2. 标题相关性 (25%)
    const titleRelevance = this.calculateContentRelevance(query, result.title || '');
    score += titleRelevance * 0.25;
    
    // 3. 新鲜度 (15%) - 实时数据优势
    const freshness = this.calculateFreshness(result);
    score += freshness * 0.15;
    
    // 4. 权威性 (10%) - 来源可信度
    const authority = this.calculateAuthority(result);
    score += authority * 0.1;
    
    // 5. 多样性 (10%) - 避免结果重复
    const diversity = this.calculateDiversity(result, allResults);
    score += diversity * 0.1;
    
    return Math.min(score, 1.0);
  }

  private calculateContentRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let relevance = 0;
    let termMatches = 0;
    
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        termMatches++;
        // 精确匹配给更高分
        if (new RegExp(`\\b${term}\\b`).test(contentLower)) {
          relevance += 0.8;
        } else {
          relevance += 0.5;
        }
      }
    }
    
    // 术语覆盖率加成
    const coverage = termMatches / queryTerms.length;
    relevance = relevance * coverage;
    
    return Math.min(relevance / queryTerms.length, 1.0);
  }

  private calculateFreshness(result: any): number {
    if (!result.timestamp) return 0.5; // 默认中等新鲜度
    
    const age = Date.now() - result.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    if (age <= 0) return 1.0; // 最新
    if (age >= maxAge) return 0.1; // 超过24小时，很低的新鲜度
    
    return 1.0 - (age / maxAge) * 0.9;
  }

  private calculateAuthority(result: any): number {
    const authorityScores = {
      'SVTR飞书知识库': 0.9,
      'RealTime Market Data': 0.8,
      'RealTime Tech News': 0.7,
      'RealTime Company Data': 0.8,
      'dense_vector': 0.6,
      'sparse_keyword': 0.5
    };
    
    return authorityScores[result.source] || 0.5;
  }

  private calculateDiversity(result: any, allResults: any[]): number {
    // 计算与其他结果的相似度，相似度越低多样性分数越高
    const similarities = allResults
      .filter(r => r.id !== result.id)
      .map(r => this.calculateSimilarity(result.content || '', r.content || ''));
    
    if (similarities.length === 0) return 1.0;
    
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    return 1.0 - avgSimilarity; // 相似度越低，多样性越高
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

/**
 * 工厂函数
 */
export function createRealTimeDataService() {
  return new RealTimeDataService();
}

export function createReRankingService(ai: any) {
  return new ReRankingService(ai);
}