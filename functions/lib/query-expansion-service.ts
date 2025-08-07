/**
 * SVTR.AI Advanced Query Expansion Service
 * 智能查询扩展和语义增强服务
 */

export interface QueryExpansionResult {
  originalQuery: string;
  expandedQuery: string;
  synonyms: string[];
  relatedTerms: string[];
  queryType: QueryType;
  domainContext: string[];
  confidence: number;
}

export enum QueryType {
  COMPANY_SEARCH = 'company_search',
  INVESTMENT_ANALYSIS = 'investment_analysis', 
  MARKET_TRENDS = 'market_trends',
  TECHNOLOGY_INFO = 'technology_info',
  FUNDING_INFO = 'funding_info',
  TEAM_EVALUATION = 'team_evaluation',
  GENERAL = 'general'
}

export class QueryExpansionService {
  private synonymMap: Map<string, string[]>;
  private domainTerms: Map<string, string[]>;
  private queryPatterns: Map<QueryType, RegExp[]>;

  constructor() {
    this.initializeMaps();
  }

  private initializeMaps() {
    // 同义词映射 - AI创投领域专业术语
    this.synonymMap = new Map([
      ['ai', ['人工智能', 'artificial intelligence', '机器学习', 'ml', 'deep learning', '深度学习']],
      ['投资', ['funding', 'investment', '融资', '资金', 'capital', 'venture', '风投']],
      ['公司', ['company', 'startup', '初创企业', '企业', 'firm', '团队', 'team']],
      ['趋势', ['trend', 'direction', '方向', '发展', '走势', 'outlook', '前景']],
      ['估值', ['valuation', '价值', 'value', '市值', 'worth', '评估']],
      ['轮次', ['round', '阶段', 'stage', 'series', '融资轮']],
      ['独角兽', ['unicorn', '十亿美元', 'billion-dollar', '高估值']],
      ['赛道', ['sector', '领域', 'domain', 'field', 'industry', '行业']],
      ['平台', ['platform', '系统', 'system', '服务', 'service']]
    ]);

    // 领域相关术语
    this.domainTerms = new Map([
      ['investment', ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'ipo', 'exit', 'portfolio', 'due-diligence']],
      ['ai-technology', ['llm', 'gpt', 'transformer', 'neural-network', 'computer-vision', 'nlp', 'robotics', 'autonomous']],
      ['market-analysis', ['market-size', 'competition', 'moat', 'growth-rate', 'tam', 'sam', 'som', 'market-share']],
      ['startup-evaluation', ['product-market-fit', 'mvp', 'traction', 'revenue', 'burn-rate', 'runway', 'kpi', 'metrics']]
    ]);

    // 查询类型识别模式
    this.queryPatterns = new Map([
      [QueryType.COMPANY_SEARCH, [
        /(.+)公司|(.+)企业|(.+)团队/,
        /search.+company|find.+startup/i,
        /哪些公司|什么企业|哪家公司/
      ]],
      [QueryType.INVESTMENT_ANALYSIS, [
        /投资.+分析|投资.+趋势|投资.+机会/,
        /investment.+analysis|investment.+trend/i,
        /融资.+情况|融资.+数据/
      ]],
      [QueryType.MARKET_TRENDS, [
        /市场趋势|行业趋势|发展趋势/,
        /market.+trend|industry.+trend/i,
        /未来.+发展|前景.+如何/
      ]],
      [QueryType.TECHNOLOGY_INFO, [
        /技术.+介绍|技术.+分析|ai.+技术/,
        /technology|technical|ai.+capability/i,
        /算法|模型|架构/
      ]],
      [QueryType.FUNDING_INFO, [
        /融资.+轮次|融资.+金额|投资.+轮次/,
        /funding.+round|series.+[abc]/i,
        /获得.+投资|完成.+融资/
      ]],
      [QueryType.TEAM_EVALUATION, [
        /团队.+评估|如何.+识别|怎么.+判断/,
        /evaluate.+team|assess.+founder/i,
        /创始人|团队背景|管理层/
      ]]
    ]);
  }

  /**
   * 执行查询扩展
   */
  expandQuery(originalQuery: string, options: {
    includeContext?: boolean;
    maxExpansions?: number;
    confidenceThreshold?: number;
  } = {}): QueryExpansionResult {
    const {
      includeContext = true,
      maxExpansions = 10,
      confidenceThreshold = 0.3
    } = options;

    // 1. 分析查询类型
    const queryType = this.detectQueryType(originalQuery);

    // 2. 提取关键词
    const keywords = this.extractKeywords(originalQuery);

    // 3. 生成同义词和相关词汇
    const synonyms = this.generateSynonyms(keywords);
    const relatedTerms = this.generateRelatedTerms(keywords, queryType);

    // 4. 构建领域上下文
    const domainContext = includeContext ? this.buildDomainContext(queryType, keywords) : [];

    // 5. 生成扩展查询
    const expandedQuery = this.buildExpandedQuery(
      originalQuery,
      synonyms,
      relatedTerms,
      domainContext,
      maxExpansions
    );

    // 6. 计算置信度
    const confidence = this.calculateExpansionConfidence(
      originalQuery,
      expandedQuery,
      synonyms.length,
      relatedTerms.length
    );

    return {
      originalQuery,
      expandedQuery,
      synonyms,
      relatedTerms,
      queryType,
      domainContext,
      confidence
    };
  }

  /**
   * 检测查询类型
   */
  private detectQueryType(query: string): QueryType {
    const queryLower = query.toLowerCase();

    for (const [type, patterns] of this.queryPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          return type;
        }
      }
    }

    return QueryType.GENERAL;
  }

  /**
   * 提取关键词
   */
  private extractKeywords(query: string): string[] {
    // 清理查询并分词
    const cleanQuery = query
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .trim();

    const words = cleanQuery.split(/\s+/).filter(word => word.length > 1);

    // 过滤停用词
    const stopWords = new Set([
      '的', '了', '在', '是', '有', '和', '与', '或', '如何', '什么', '哪些', '怎么', '为什么',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'how', 'what', 'which', 'where', 'when', 'who', 'why'
    ]);

    return words.filter(word => !stopWords.has(word) && word.length > 1);
  }

  /**
   * 生成同义词
   */
  private generateSynonyms(keywords: string[]): string[] {
    const synonyms = new Set<string>();

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // 直接匹配
      if (this.synonymMap.has(keywordLower)) {
        this.synonymMap.get(keywordLower)!.forEach(syn => synonyms.add(syn));
      }

      // 部分匹配
      for (const [term, syns] of this.synonymMap.entries()) {
        if (keywordLower.includes(term) || term.includes(keywordLower)) {
          syns.forEach(syn => synonyms.add(syn));
        }
      }
    });

    return Array.from(synonyms);
  }

  /**
   * 生成相关术语
   */
  private generateRelatedTerms(keywords: string[], queryType: QueryType): string[] {
    const relatedTerms = new Set<string>();

    // 基于查询类型添加相关术语
    const typeMapping = {
      [QueryType.COMPANY_SEARCH]: ['investment', 'startup-evaluation'],
      [QueryType.INVESTMENT_ANALYSIS]: ['investment', 'market-analysis'],
      [QueryType.MARKET_TRENDS]: ['market-analysis', 'ai-technology'],
      [QueryType.TECHNOLOGY_INFO]: ['ai-technology', 'startup-evaluation'],
      [QueryType.FUNDING_INFO]: ['investment', 'startup-evaluation'],
      [QueryType.TEAM_EVALUATION]: ['startup-evaluation', 'investment'],
      [QueryType.GENERAL]: ['investment', 'ai-technology']
    };

    const domains = typeMapping[queryType] || ['investment'];
    domains.forEach(domain => {
      const terms = this.domainTerms.get(domain) || [];
      terms.slice(0, 5).forEach(term => relatedTerms.add(term)); // 限制数量
    });

    // 基于关键词添加相关术语
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      if (keywordLower.includes('ai') || keywordLower.includes('人工智能')) {
        this.domainTerms.get('ai-technology')?.slice(0, 3).forEach(term => relatedTerms.add(term));
      }
      
      if (keywordLower.includes('投资') || keywordLower.includes('investment')) {
        this.domainTerms.get('investment')?.slice(0, 3).forEach(term => relatedTerms.add(term));
      }
    });

    return Array.from(relatedTerms);
  }

  /**
   * 构建领域上下文
   */
  private buildDomainContext(queryType: QueryType, keywords: string[]): string[] {
    const context: string[] = [];

    // 基于查询类型的上下文
    const contextMap = {
      [QueryType.COMPANY_SEARCH]: ['AI创投生态系统', '初创企业数据库', '投资组合分析'],
      [QueryType.INVESTMENT_ANALYSIS]: ['投资趋势分析', '市场数据', '风险评估'],
      [QueryType.MARKET_TRENDS]: ['行业洞察', '技术发展', '竞争分析'],
      [QueryType.TECHNOLOGY_INFO]: ['技术评估', 'AI能力分析', '产品技术栈'],
      [QueryType.FUNDING_INFO]: ['融资数据', '投资轮次', '估值分析'],
      [QueryType.TEAM_EVALUATION]: ['团队背景', '创始人经历', '管理能力'],
      [QueryType.GENERAL]: ['AI创投知识库', 'SVTR平台数据']
    };

    context.push(...(contextMap[queryType] || contextMap[QueryType.GENERAL]));

    // 基于关键词的上下文增强
    if (keywords.some(k => k.includes('svtr') || k.includes('SVTR'))) {
      context.push('SVTR平台特色功能', 'AI创投数据追踪');
    }

    return context.slice(0, 5); // 限制上下文数量
  }

  /**
   * 构建扩展查询
   */
  private buildExpandedQuery(
    originalQuery: string,
    synonyms: string[],
    relatedTerms: string[],
    domainContext: string[],
    maxExpansions: number
  ): string {
    const expansions: string[] = [];

    // 添加同义词扩展
    synonyms.slice(0, Math.floor(maxExpansions * 0.4)).forEach(syn => {
      expansions.push(syn);
    });

    // 添加相关术语扩展
    relatedTerms.slice(0, Math.floor(maxExpansions * 0.4)).forEach(term => {
      expansions.push(term);
    });

    // 添加领域上下文
    domainContext.slice(0, Math.floor(maxExpansions * 0.2)).forEach(context => {
      expansions.push(context);
    });

    // 构建最终扩展查询
    if (expansions.length === 0) {
      return originalQuery;
    }

    // 智能组合：保持原查询主体，添加扩展词汇
    const expandedQuery = originalQuery + ' ' + expansions.join(' ');
    
    // 去重和优化
    const words = expandedQuery.split(/\s+/);
    const uniqueWords = [...new Set(words.filter(word => word.trim().length > 0))];
    
    return uniqueWords.join(' ');
  }

  /**
   * 计算扩展置信度
   */
  private calculateExpansionConfidence(
    originalQuery: string,
    expandedQuery: string,
    synonymCount: number,
    relatedTermsCount: number
  ): number {
    let confidence = 0.5; // 基础置信度

    // 扩展词汇数量加权
    const expansionRatio = expandedQuery.length / originalQuery.length;
    if (expansionRatio > 1.2 && expansionRatio < 3) {
      confidence += 0.2; // 合理的扩展比例
    }

    // 同义词和相关术语质量加权
    if (synonymCount > 2) confidence += 0.2;
    if (relatedTermsCount > 3) confidence += 0.2;

    // 原始查询长度影响
    if (originalQuery.length < 20) {
      confidence += 0.1; // 短查询更需要扩展
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 获取查询建议
   */
  generateQuerySuggestions(queryType: QueryType, keywords: string[]): string[] {
    const suggestions: string[] = [];

    const suggestionTemplates = {
      [QueryType.COMPANY_SEARCH]: [
        '{keyword}领域的独角兽公司有哪些？',
        '最新获得融资的{keyword}公司',
        '{keyword}赛道的头部企业分析'
      ],
      [QueryType.INVESTMENT_ANALYSIS]: [
        '2024年{keyword}投资趋势分析',
        '{keyword}领域的投资机会和风险',
        '{keyword}市场的资金流向'
      ],
      [QueryType.MARKET_TRENDS]: [
        '{keyword}行业未来发展趋势',
        '{keyword}市场竞争格局分析',
        '{keyword}技术发展前景'
      ]
    };

    const templates = suggestionTemplates[queryType] || [];
    const topKeywords = keywords.slice(0, 2);

    templates.forEach(template => {
      topKeywords.forEach(keyword => {
        suggestions.push(template.replace('{keyword}', keyword));
      });
    });

    return suggestions.slice(0, 6);
  }

  /**
   * 分析查询复杂度
   */
  analyzeQueryComplexity(query: string): {
    complexity: 'simple' | 'medium' | 'complex';
    factors: string[];
    score: number;
  } {
    const factors: string[] = [];
    let score = 0;

    // 长度因子
    if (query.length > 50) {
      factors.push('长查询');
      score += 2;
    }

    // 问号数量
    const questionMarks = (query.match(/[？?]/g) || []).length;
    if (questionMarks > 1) {
      factors.push('多重问题');
      score += questionMarks;
    }

    // 专业术语
    const professionalTerms = ['估值', '轮次', 'valuation', 'series', 'due diligence'];
    const termCount = professionalTerms.filter(term => 
      query.toLowerCase().includes(term.toLowerCase())
    ).length;
    
    if (termCount > 1) {
      factors.push('专业术语');
      score += termCount;
    }

    // 比较性查询
    if (query.includes('比较') || query.includes('对比') || query.includes('vs')) {
      factors.push('比较分析');
      score += 2;
    }

    // 时间相关
    if (/\d{4}年|\d+月|最近|未来|趋势/.test(query)) {
      factors.push('时间维度');
      score += 1;
    }

    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (score >= 5) complexity = 'complex';
    else if (score >= 2) complexity = 'medium';

    return { complexity, factors, score };
  }
}

/**
 * 工厂函数
 */
export function createQueryExpansionService(): QueryExpansionService {
  return new QueryExpansionService();
}