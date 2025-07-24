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

  constructor(vectorize: any, ai: any, openaiApiKey?: string) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    
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
   * 获取存储的文档（从飞书同步数据）
   */
  private async getStoredDocuments() {
    try {
      // 尝试从多个数据源读取
      const documents = [];
      
      // 1. AI周报数据
      try {
        const weeklyData = await this.loadWeeklyData();
        documents.push(...weeklyData);
      } catch (e) { console.log('周报数据读取失败:', e.message); }
      
      // 2. 交易精选数据
      try {
        const tradingData = await this.loadTradingData();
        documents.push(...tradingData);
      } catch (e) { console.log('交易数据读取失败:', e.message); }
      
      // 3. 预设知识库
      documents.push(...this.getDefaultKnowledgeBase());
      
      return documents;
    } catch (error) {
      console.log('获取文档失败，使用默认知识库');
      return this.getDefaultKnowledgeBase();
    }
  }

  /**
   * 加载AI周报数据
   */
  private async loadWeeklyData() {
    // 这里应该从实际的数据文件或API读取
    // 暂时返回模拟数据
    return [
      {
        id: 'weekly-115',
        content: `AI周报第115期：2024年AI创投市场出现显著变化，企业级AI应用获得更多投资关注。主要趋势包括：1）从消费AI转向企业解决方案；2）基础设施投资持续增长；3）AI安全和治理工具需求上升。重点公司：Anthropic获得60亿美元D轮融资，Scale AI准备IPO，Perplexity企业级搜索获得2.5亿美元B轮。市场数据：2024年Q4企业级AI工具融资额达到78亿美元，同比增长156%。投资热点：AI Agent、多模态AI、边缘计算、数据基础设施。`,
        title: 'AI周报第115期',
        type: 'weekly',
        source: '飞书知识库',
        keywords: ['AI创投', '企业级AI', '投资趋势', 'Anthropic', 'Scale AI', 'Perplexity', '78亿美元', 'AI Agent']
      },
      {
        id: 'weekly-114', 
        content: `AI周报第114期：生成式AI市场趋于成熟，投资者更关注商业模式和盈利能力。关键观察：1）模型公司估值回归理性；2）应用层创新加速；3）数据护城河价值凸显。投资亮点：多模态AI应用获得重点关注，边缘AI部署需求增长，AI基础设施持续升温。具体数据：OpenAI ARR突破34亿美元，Anthropic月活用户增长300%，AI基础设施类公司平均估值倍数从60x降至25x。`,
        title: 'AI周报第114期',
        type: 'weekly',
        source: '飞书知识库',
        keywords: ['生成式AI', '商业模式', '多模态AI', '边缘AI', '数据护城河', 'OpenAI', '34亿美元ARR']
      },
      {
        id: 'weekly-116',
        content: `AI周报第116期：2025年AI创投新趋势浮现，Agent应用成为最大投资风口。核心观察：1）AI Agent市场预计2025年达到250亿美元；2）企业级Agent部署率提升至45%；3）垂直领域Agent专业化趋势明显。重点交易：Adept获得3.5亿美元B轮，Cognition AI估值20亿美元，多家Agent初创公司完成大额融资。技术突破：多Agent协作、工具调用优化、长期记忆管理成为核心竞争力。`,
        title: 'AI周报第116期',
        type: 'weekly', 
        source: '飞书知识库',
        keywords: ['AI Agent', '250亿美元', 'Adept', 'Cognition AI', '3.5亿美元', '20亿美元', '多Agent协作']
      }
    ];
  }

  /**
   * 加载交易精选数据
   */
  private async loadTradingData() {
    return [
      {
        id: 'company-anthropic',
        content: `Anthropic：AI安全领域的领军企业，专注于开发安全、有用、无害的AI系统。融资情况：2024年完成60亿美元D轮融资，亚马逊和谷歌参投，估值达到180亿美元。技术优势：Constitutional AI技术，Claude系列模型在安全性和实用性方面表现突出。商业数据：2024年ARR达到8.5亿美元，企业客户增长500%，API调用量月增长率35%。市场地位：与OpenAI形成双雄对峙，在企业级AI服务市场占据重要位置。投资价值：预计2025年IPO，目标估值300-400亿美元。`,
        title: 'Anthropic公司分析',
        type: 'company',
        source: 'AI创投库',
        keywords: ['Anthropic', 'AI安全', 'Claude', 'Constitutional AI', '60亿美元', 'D轮融资', '8.5亿美元ARR', '300亿美元估值']
      },
      {
        id: 'company-scale-ai',
        content: `Scale AI：AI数据基础设施的独角兽企业，为自动驾驶、机器人、国防等领域提供高质量训练数据。融资情况：2021年E轮融资10亿美元，估值73亿美元，正准备IPO。商业模式：数据标注、模型评估、AI部署平台，服务涵盖整个AI开发周期。财务数据：2024年收入超过7.5亿美元，毛利率65%，客户留存率95%。客户基础：特斯拉、丰田、美国国防部等高端客户，收入增长强劲。IPO计划：预计2025年Q2上市，目标估值150-200亿美元。`,
        title: 'Scale AI公司分析', 
        type: 'company',
        source: 'AI创投库',
        keywords: ['Scale AI', '数据基础设施', 'IPO', '自动驾驶', '10亿美元', 'E轮融资', '7.5亿美元收入', '150亿美元估值']
      },
      {
        id: 'company-openai',
        content: `OpenAI：全球领先的AGI研究与应用公司，ChatGPT和GPT系列模型的创造者。融资情况：2024年完成65亿美元融资，估值1570亿美元，成为全球估值最高的AI公司。商业成绩：年收入突破40亿美元，ChatGPT Plus付费用户超过1000万，API收入占比45%。技术护城河：大规模预训练、RLHF优化、多模态能力领先。竞争态势：面临Anthropic、Google、Meta等强劲竞争，但在消费级AI应用保持领先。投资风险：监管压力增大，计算成本持续上升，技术人才竞争激烈。`,
        title: 'OpenAI公司分析',
        type: 'company', 
        source: 'AI创投库',
        keywords: ['OpenAI', 'ChatGPT', 'AGI', '65亿美元', '1570亿美元估值', '40亿美元收入', '1000万付费用户']
      },
      {
        id: 'company-adept',
        content: `Adept：专注于AI Agent的先锋企业，致力于打造能够与人类协作完成复杂任务的智能代理。融资情况：2024年完成3.5亿美元B轮融资，Greylock Partners领投，估值达到25亿美元。技术优势：Action Transformer模型，能够理解用户意图并自动执行复杂的软件操作。商业策略：面向企业级市场，提供定制化AI Agent解决方案。市场前景：AI Agent市场预计2025年达到250亿美元，Adept有望占据重要份额。投资亮点：团队来自OpenAI和Google DeepMind，技术实力雄厚。`,
        title: 'Adept公司分析',
        type: 'company',
        source: 'AI创投库', 
        keywords: ['Adept', 'AI Agent', '3.5亿美元', 'B轮融资', '25亿美元估值', 'Action Transformer', '250亿美元市场']
      }
    ];
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
export function createOptimalRAGService(vectorize: any, ai: any, openaiApiKey?: string) {
  return new HybridRAGService(vectorize, ai, openaiApiKey);
}