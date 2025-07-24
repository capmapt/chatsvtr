/**
 * SVTR.AI RAG服务
 * 实现语义检索和上下文增强功能
 */

interface VectorizeMatch {
  id: string;
  score: number;
  metadata: {
    content: string;
    title: string;
    documentId: string;
    type: string;
    source: string;
    chunkIndex?: number;
    [key: string]: any;
  };
}

interface RAGContext {
  query: string;
  matches: VectorizeMatch[];
  enhancedContent: string;
  sources: string[];
  confidence: number;
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
  }>;
}

export class SVTRRAGService {
  private vectorize: any;
  private openaiApiKey: string;
  
  constructor(vectorize: any, openaiApiKey: string) {
    this.vectorize = vectorize;
    this.openaiApiKey = openaiApiKey;
  }

  /**
   * 获取查询的向量表示
   */
  async getQueryEmbedding(query: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('缺少OpenAI API密钥');
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
      throw new Error(`OpenAI Embedding API错误: ${error.error?.message}`);
    }

    const data: EmbeddingResponse = await response.json();
    return data.data[0].embedding;
  }

  /**
   * 执行语义检索
   */
  async semanticSearch(
    query: string, 
    options: {
      topK?: number;
      threshold?: number;
      filter?: Record<string, any>;
    } = {}
  ): Promise<VectorizeMatch[]> {
    try {
      // 获取查询向量
      const queryVector = await this.getQueryEmbedding(query);
      
      // 执行向量搜索
      const results = await this.vectorize.query(queryVector, {
        topK: options.topK || 8,
        returnMetadata: 'all',
        filter: options.filter
      });

      // 过滤低相关性结果
      const threshold = options.threshold || 0.7;
      const filteredMatches = results.matches.filter(
        (match: VectorizeMatch) => match.score >= threshold
      );

      console.log(`🔍 检索结果: ${filteredMatches.length}/${results.matches.length} 个相关匹配`);
      
      return filteredMatches;
      
    } catch (error) {
      console.error('语义检索失败:', error);
      return [];
    }
  }

  /**
   * 构建增强上下文
   */
  buildEnhancedContext(matches: VectorizeMatch[]): RAGContext {
    if (matches.length === 0) {
      return {
        query: '',
        matches: [],
        enhancedContent: '',
        sources: [],
        confidence: 0
      };
    }

    // 去重和排序
    const uniqueMatches = this.deduplicateMatches(matches);
    const sortedMatches = uniqueMatches.sort((a, b) => b.score - a.score);
    
    // 构建上下文内容
    const contextParts = [];
    const sources = new Set<string>();
    
    for (const match of sortedMatches.slice(0, 5)) { // 取前5个最相关的结果
      // 添加文档信息
      contextParts.push(`**${match.metadata.title}**`);
      contextParts.push(match.metadata.content);
      contextParts.push('---');
      
      // 记录来源
      sources.add(`${match.metadata.title} (${match.metadata.source})`);
    }
    
    // 计算整体置信度
    const confidence = sortedMatches.length > 0 
      ? sortedMatches.reduce((sum, match) => sum + match.score, 0) / sortedMatches.length
      : 0;

    return {
      query: '',
      matches: sortedMatches,
      enhancedContent: contextParts.join('\n'),
      sources: Array.from(sources),
      confidence: confidence
    };
  }

  /**
   * 去除重复内容
   */
  private deduplicateMatches(matches: VectorizeMatch[]): VectorizeMatch[] {
    const seen = new Set<string>();
    const deduplicated = [];
    
    for (const match of matches) {
      // 基于内容的前100个字符创建指纹
      const fingerprint = match.metadata.content.substring(0, 100);
      
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        deduplicated.push(match);
      }
    }
    
    return deduplicated;
  }

  /**
   * 智能查询扩展
   */
  expandQuery(query: string): string[] {
    const queries = [query];
    
    // 添加同义词和相关术语
    const expandedTerms = this.generateSynonyms(query);
    
    for (const term of expandedTerms) {
      if (term !== query) {
        queries.push(term);
      }
    }
    
    return queries.slice(0, 3); // 最多3个变体
  }

  /**
   * 生成同义词和相关术语
   */
  private generateSynonyms(query: string): string[] {
    const synonyms = [];
    
    // AI创投领域术语映射
    const termMap: Record<string, string[]> = {
      '创业公司': ['初创企业', '创业团队', 'startup'],
      '投资机构': ['VC', '风投', '投资基金', 'venture capital'],
      '人工智能': ['AI', '机器学习', 'ML', '深度学习'],
      '估值': ['valuation', '公司价值', '市场价值'],
      '融资': ['投资', 'funding', '资金'],
      '轮次': ['round', '融资轮次', '投资轮次']
    };
    
    for (const [key, values] of Object.entries(termMap)) {
      if (query.includes(key)) {
        synonyms.push(...values);
      }
    }
    
    return [query, ...synonyms];
  }

  /**
   * 执行完整的RAG流程
   */
  async performRAG(
    query: string,
    options: {
      topK?: number;
      threshold?: number;
      includeAlternatives?: boolean;
    } = {}
  ): Promise<RAGContext> {
    console.log(`🤖 执行RAG检索: "${query}"`);
    
    try {
      // 1. 语义检索
      const matches = await this.semanticSearch(query, {
        topK: options.topK || 8,
        threshold: options.threshold || 0.7
      });
      
      // 2. 如果结果不足，尝试查询扩展
      let allMatches = matches;
      if (matches.length < 3 && options.includeAlternatives) {
        console.log('🔄 结果不足，尝试查询扩展...');
        
        const expandedQueries = this.expandQuery(query);
        for (const expandedQuery of expandedQueries.slice(1)) {
          const additionalMatches = await this.semanticSearch(expandedQuery, {
            topK: 3,
            threshold: 0.6 // 稍低的阈值
          });
          allMatches.push(...additionalMatches);
        }
      }
      
      // 3. 构建增强上下文
      const ragContext = this.buildEnhancedContext(allMatches);
      ragContext.query = query;
      
      console.log(`✅ RAG检索完成: ${ragContext.matches.length} 个匹配，置信度 ${(ragContext.confidence * 100).toFixed(1)}%`);
      
      return ragContext;
      
    } catch (error) {
      console.error('RAG流程失败:', error);
      
      // 返回空上下文
      return {
        query: query,
        matches: [],
        enhancedContent: '',
        sources: [],
        confidence: 0
      };
    }
  }

  /**
   * 生成增强的系统提示词
   */
  generateEnhancedPrompt(basePrompt: string, ragContext: RAGContext): string {
    if (!ragContext.enhancedContent || ragContext.confidence < 0.3) {
      console.log('⚠️ RAG内容质量不足，使用基础提示词');
      return basePrompt;
    }
    
    const enhancedPrompt = `${basePrompt}

**SVTR专业知识库内容** (置信度: ${(ragContext.confidence * 100).toFixed(1)}%):

${ragContext.enhancedContent}

**回答要求**:
- 优先基于以上SVTR专业知识库内容回答
- 确保信息的准确性和专业性
- 如果知识库中没有相关信息，请基于你的通用知识回答，但要明确标注
- 在回答末尾提供相关来源信息

**相关来源**: ${ragContext.sources.join(', ')}

请基于以上增强信息回答用户问题。`;

    return enhancedPrompt;
  }

  /**
   * 格式化回答，添加来源引用
   */
  formatResponseWithSources(response: string, ragContext: RAGContext): string {
    if (ragContext.sources.length === 0) {
      return response;
    }
    
    const sourceSection = `\n\n---\n**参考资料**:\n${ragContext.sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}`;
    
    return response + sourceSection;
  }
}

/**
 * 创建RAG服务实例的工厂函数
 */
export function createRAGService(vectorize: any, openaiApiKey: string): SVTRRAGService {
  return new SVTRRAGService(vectorize, openaiApiKey);
}