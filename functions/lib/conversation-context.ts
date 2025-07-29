/**
 * SVTR.AI 会话上下文管理系统
 * 实现智能对话记忆和上下文追踪
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  ragContext?: RAGContext;
  topics?: string[];
  confidence?: number;
}

export interface RAGContext {
  matches: any[];
  searchQuery: string;
  confidence: number;
  sources: string[];
}

export interface ConversationSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  messages: Message[];
  extractedTopics: string[];
  userInterests: string[];
  conversationSummary: string;
  ragHistory: RAGContext[];
}

export class ConversationContextManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private kvNamespace?: any;
  private maxSessionAge = 24 * 60 * 60 * 1000; // 24小时
  private maxMessages = 50; // 每个会话最多50条消息

  constructor(kvNamespace?: any) {
    this.kvNamespace = kvNamespace;
  }

  /**
   * 获取或创建会话
   */
  async getOrCreateSession(sessionId: string, userId?: string): Promise<ConversationSession> {
    let session = this.sessions.get(sessionId);
    
    if (!session) {
      // 尝试从KV存储恢复
      if (this.kvNamespace) {
        try {
          const stored = await this.kvNamespace.get(`session:${sessionId}`);
          if (stored) {
            session = JSON.parse(stored);
            this.sessions.set(sessionId, session!);
          }
        } catch (error) {
          console.log('恢复会话失败:', error);
        }
      }
    }

    if (!session) {
      // 创建新会话
      session = {
        sessionId,
        userId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        messages: [],
        extractedTopics: [],
        userInterests: [],
        conversationSummary: '',
        ragHistory: []
      };
      this.sessions.set(sessionId, session);
    }

    return session;
  }

  /**
   * 添加消息到会话
   */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    const session = await this.getOrCreateSession(sessionId);
    
    // 更新活动时间
    session.lastActivity = Date.now();
    
    // 添加消息
    session.messages.push(message);
    
    // 限制消息数量
    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }

    // 提取话题和兴趣
    if (message.role === 'user') {
      const topics = this.extractTopics(message.content);
      session.extractedTopics = this.mergeTopic(session.extractedTopics, topics);
      session.userInterests = this.updateUserInterests(session.userInterests, topics);
    }

    // 存储RAG上下文
    if (message.ragContext) {
      session.ragHistory.push(message.ragContext);
      if (session.ragHistory.length > 10) {
        session.ragHistory = session.ragHistory.slice(-10);
      }
    }

    // 更新会话摘要
    session.conversationSummary = this.generateSummary(session);

    // 持久化存储
    await this.persistSession(session);
  }

  /**
   * 获取上下文增强的查询 - 多轮对话优化版本
   */
  getContextEnhancedQuery(sessionId: string, currentQuery: string): {
    enhancedQuery: string;
    contextKeywords: string[];
    relatedTopics: string[];
    conversationFlow: string[];
    userIntent: string;
  } {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length === 0) {
      return {
        enhancedQuery: currentQuery,
        contextKeywords: [],
        relatedTopics: [],
        conversationFlow: [],
        userIntent: 'general'
      };
    }

    // 提取上下文关键词和会话流程
    const contextKeywords = this.extractContextKeywords(session);
    const relatedTopics = session.extractedTopics.slice(0, 5);
    const conversationFlow = this.extractConversationFlow(session);
    const userIntent = this.detectUserIntent(currentQuery, session);

    // 构建多轮对话增强查询
    let enhancedQuery = currentQuery;
    
    // 检测指代消解需求
    if (this.needsCoreferenceResolution(currentQuery)) {
      enhancedQuery = this.resolveCoreferences(currentQuery, session);
    }
    
    // 添加上下文信息
    if (currentQuery.length < 30 && contextKeywords.length > 0) {
      const contextClues = this.buildContextClues(session, userIntent);
      enhancedQuery = `${enhancedQuery} ${contextClues}`;
    }

    // 处理后续问题
    if (this.isFollowUpQuestion(currentQuery, session)) {
      const followUpContext = this.buildFollowUpContext(session);
      enhancedQuery = `基于前面的讨论：${followUpContext}，${enhancedQuery}`;
    }

    return {
      enhancedQuery,
      contextKeywords,
      relatedTopics,
      conversationFlow,
      userIntent
    };
  }

  /**
   * 获取智能建议问题
   */
  getSmartSuggestions(sessionId: string): string[] {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.getDefaultSuggestions();
    }

    const suggestions: string[] = [];
    
    // 基于用户兴趣的建议
    const interests = session.userInterests.slice(0, 3);
    interests.forEach(interest => {
      suggestions.push(...this.generateInterestBasedSuggestions(interest));
    });

    // 基于最近话题的建议
    const recentTopics = session.extractedTopics.slice(-3);
    recentTopics.forEach(topic => {
      suggestions.push(...this.generateTopicBasedSuggestions(topic));
    });

    // 基于对话深度的建议
    if (session.messages.length > 5) {
      suggestions.push(...this.generateDeepConversationSuggestions(session));
    }

    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, 6);
  }

  /**
   * 提取消息中的话题
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const text = content.toLowerCase();

    // AI创投相关话题
    const topicPatterns = {
      'AI投资': ['ai投资', 'ai融资', 'ai基金', 'ai创投'],
      'AI公司': ['ai公司', 'ai初创', 'ai企业', 'ai团队'],
      'AI技术': ['ai技术', '人工智能', '机器学习', '深度学习'],
      '投资趋势': ['投资趋势', '市场趋势', '行业趋势', '发展趋势'],
      '融资轮次': ['a轮', 'b轮', 'c轮', '种子轮', '天使轮'],
      '估值分析': ['估值', '市值', '价值评估', '投资回报'],
      'AI应用': ['ai应用', 'ai产品', 'ai解决方案', 'ai平台']
    };

    Object.entries(topicPatterns).forEach(([topic, patterns]) => {
      if (patterns.some(pattern => text.includes(pattern))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  /**
   * 合并话题列表
   */
  private mergeTopic(existing: string[], newTopics: string[]): string[] {
    const merged = [...existing];
    newTopics.forEach(topic => {
      if (!merged.includes(topic)) {
        merged.push(topic);
      }
    });
    return merged.slice(-20); // 保持最近20个话题
  }

  /**
   * 更新用户兴趣
   */
  private updateUserInterests(interests: string[], topics: string[]): string[] {
    const interestMap = new Map<string, number>();
    
    // 统计现有兴趣频次
    interests.forEach(interest => {
      interestMap.set(interest, (interestMap.get(interest) || 0) + 1);
    });

    // 增加新话题权重
    topics.forEach(topic => {
      interestMap.set(topic, (interestMap.get(topic) || 0) + 2);
    });

    // 按频次排序，返回前10个
    return Array.from(interestMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([interest]) => interest);
  }

  /**
   * 提取上下文关键词
   */
  private extractContextKeywords(session: ConversationSession): string[] {
    const keywords: string[] = [];
    
    // 从最近5条消息中提取关键词
    const recentMessages = session.messages.slice(-5);
    recentMessages.forEach(message => {
      if (message.role === 'user') {
        // 简单关键词提取
        const words = message.content
          .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 1);
        keywords.push(...words);
      }
    });

    // 去重并返回高频关键词
    const keywordFreq = new Map<string, number>();
    keywords.forEach(keyword => {
      keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
    });

    return Array.from(keywordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  /**
   * 生成会话摘要
   */
  private generateSummary(session: ConversationSession): string {
    if (session.messages.length === 0) return '';

    const userMessages = session.messages
      .filter(m => m.role === 'user')
      .slice(-3)
      .map(m => m.content);

    const topTopics = session.extractedTopics.slice(0, 3);
    
    return `用户主要关注: ${topTopics.join(', ')}. 最近询问: ${userMessages.join('; ')}`;
  }

  /**
   * 基于兴趣生成建议
   */
  private generateInterestBasedSuggestions(interest: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      'AI投资': [
        '最新的AI投资热点有哪些？',
        '哪些AI赛道最值得关注？'
      ],
      'AI公司': [
        '有哪些值得关注的AI独角兽？',
        '最新获得融资的AI公司有哪些？'
      ],
      'AI技术': [
        '当前最前沿的AI技术趋势？',
        'AI技术商业化的机会在哪里？'
      ],
      '投资趋势': [
        '2025年AI投资趋势预测？',
        'AI投资的风险和机会分析？'
      ]
    };

    return suggestionMap[interest] || [];
  }

  /**
   * 基于话题生成建议
   */
  private generateTopicBasedSuggestions(topic: string): string[] {
    return [
      `关于${topic}的最新动态？`,
      `${topic}领域的投资机会？`
    ];
  }

  /**
   * 深度对话建议
   */
  private generateDeepConversationSuggestions(session: ConversationSession): string[] {
    return [
      '根据我们的对话，还有什么投资建议？',
      '基于当前讨论，有哪些风险需要注意？',
      '结合刚才的分析，给出具体的行动建议？'
    ];
  }

  /**
   * 默认建议
   */
  private getDefaultSuggestions(): string[] {
    return [
      'SVTR.AI追踪哪些AI公司？',
      '最新的AI投资趋势是什么？',
      '如何识别有潜力的AI创业团队？',
      '生成式AI领域的投资机会？',
      'AI基础设施赛道的发展前景？',
      'SVTR平台有哪些独特优势？'
    ];
  }

  /**
   * 持久化会话
   */
  private async persistSession(session: ConversationSession): Promise<void> {
    if (this.kvNamespace) {
      try {
        await this.kvNamespace.put(
          `session:${session.sessionId}`,
          JSON.stringify(session),
          { expirationTtl: this.maxSessionAge / 1000 }
        );
      } catch (error) {
        console.log('会话持久化失败:', error);
      }
    }
  }

  /**
   * 提取会话流程
   */
  private extractConversationFlow(session: ConversationSession): string[] {
    return session.messages
      .slice(-6)
      .filter(m => m.role === 'user')
      .map(m => m.content.slice(0, 50) + (m.content.length > 50 ? '...' : ''));
  }

  /**
   * 检测用户意图
   */
  private detectUserIntent(query: string, session: ConversationSession): string {
    const queryLower = query.toLowerCase();
    
    // 分析查询类型
    if (queryLower.includes('如何') || queryLower.includes('怎么') || queryLower.includes('怎样')) {
      return 'howto';
    }
    if (queryLower.includes('比较') || queryLower.includes('对比') || queryLower.includes('区别')) {
      return 'comparison';
    }
    if (queryLower.includes('什么') || queryLower.includes('哪些') || queryLower.includes('为什么')) {
      return 'question';
    }
    if (queryLower.includes('推荐') || queryLower.includes('建议') || queryLower.includes('选择')) {
      return 'recommendation';
    }
    if (queryLower.includes('更多') || queryLower.includes('还有') || queryLower.includes('继续')) {
      return 'follow_up';
    }

    // 基于会话历史推断意图
    const recentTopics = session.extractedTopics.slice(-3);
    if (recentTopics.includes('AI投资') || recentTopics.includes('投资趋势')) {
      return 'investment_inquiry';
    }
    if (recentTopics.includes('AI公司') || recentTopics.includes('AI技术')) {
      return 'company_analysis';
    }

    return 'general';
  }

  /**
   * 检测是否需要指代消解
   */
  private needsCoreferenceResolution(query: string): boolean {
    const pronouns = ['它', '他们', '这个', '那个', '这些', '那些', '此', '该', '这', '那'];
    return pronouns.some(pronoun => query.includes(pronoun));
  }

  /**
   * 指代消解
   */
  private resolveCoreferences(query: string, session: ConversationSession): string {
    if (session.messages.length < 2) return query;

    const lastAIResponse = session.messages
      .slice()
      .reverse()
      .find(m => m.role === 'assistant');

    if (!lastAIResponse) return query;

    // 简单的指代消解
    let resolvedQuery = query;
    
    // 提取最近提到的实体
    const entities = this.extractEntities(lastAIResponse.content);
    
    if (entities.companies.length > 0 && (query.includes('它') || query.includes('该公司'))) {
      resolvedQuery = resolvedQuery.replace(/它|该公司/g, entities.companies[0]);
    }
    
    if (entities.topics.length > 0 && (query.includes('这个') || query.includes('该领域'))) {
      resolvedQuery = resolvedQuery.replace(/这个|该领域/g, entities.topics[0]);
    }

    return resolvedQuery;
  }

  /**
   * 构建上下文线索
   */
  private buildContextClues(session: ConversationSession, intent: string): string {
    const clues = [];
    
    // 添加话题上下文
    if (session.extractedTopics.length > 0) {
      clues.push(`(讨论背景: ${session.extractedTopics.slice(0, 2).join('、')})`);
    }

    // 添加意图相关的上下文
    if (intent === 'follow_up' && session.messages.length > 2) {
      const lastUserQuery = session.messages
        .slice()
        .reverse()
        .find(m => m.role === 'user');
      if (lastUserQuery) {
        clues.push(`(承接上个问题: ${lastUserQuery.content.slice(0, 30)}...)`);
      }
    }

    return clues.join(' ');
  }

  /**
   * 检测是否为后续问题
   */
  private isFollowUpQuestion(query: string, session: ConversationSession): boolean {
    const followUpIndicators = [
      '还有', '更多', '继续', '另外', '其他', '接下来', '然后', '那么',
      '进一步', '深入', '详细', '具体', '例如'
    ];
    
    return followUpIndicators.some(indicator => query.includes(indicator)) ||
           (query.length < 20 && session.messages.length > 2);
  }

  /**
   * 构建后续问题上下文
   */
  private buildFollowUpContext(session: ConversationSession): string {
    const recentExchange = session.messages.slice(-2);
    if (recentExchange.length < 2) return '';

    const userQuery = recentExchange.find(m => m.role === 'user')?.content || '';
    const aiResponse = recentExchange.find(m => m.role === 'assistant')?.content || '';

    // 提取关键信息
    const userTopic = userQuery.slice(0, 30);
    const aiKeyPoints = this.extractKeyPoints(aiResponse);

    return `用户询问了"${userTopic}"，AI回答涉及${aiKeyPoints.join('、')}`;
  }

  /**
   * 提取关键要点
   */
  private extractKeyPoints(text: string): string[] {
    const points = [];
    
    // 查找列表项
    const listMatches = text.match(/[•·\-\*]\s*(.+?)(?=\n|$)/g);
    if (listMatches) {
      points.push(...listMatches.slice(0, 3).map(match => 
        match.replace(/[•·\-\*]\s*/, '').slice(0, 20)
      ));
    }

    // 查找数字或关键词
    const numberMatches = text.match(/\d+[、。：]/g);
    if (numberMatches) {
      points.push(`${numberMatches.length}个要点`);
    }

    return points.length > 0 ? points : ['相关信息'];
  }

  /**
   * 提取实体
   */
  private extractEntities(text: string): { companies: string[], topics: string[] } {
    const companies = [];
    const topics = [];

    // 简单的实体识别
    const companyPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+AI|Inc\.|LLC))/g,
      /([\u4e00-\u9fa5]+(?:公司|科技|智能|AI))/g
    ];

    companyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        companies.push(...matches.slice(0, 3));
      }
    });

    const topicPatterns = [
      /(AI[^\s，。！？]*)/g,
      /([\u4e00-\u9fa5]*投资[\u4e00-\u9fa5]*)/g,
      /([\u4e00-\u9fa5]*创业[\u4e00-\u9fa5]*)/g
    ];

    topicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        topics.push(...matches.slice(0, 3));
      }
    });

    return { companies, topics };
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.maxSessionAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}