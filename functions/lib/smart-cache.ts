/**
 * SVTR.AI 智能缓存系统
 * 减少重复RAG检索，提升响应效率
 */

interface CacheEntry {
  query: string;
  queryHash: string;
  ragResults: any;
  response: string;
  confidence: number;
  timestamp: number;
  hitCount: number;
  sources: string[];
}

interface CacheStats {
  hits: number;
  misses: number;
  totalQueries: number;
  hitRate: number;
  avgResponseTime: number;
}

export class SmartCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    totalQueries: 0,
    hitRate: 0,
    avgResponseTime: 0
  };
  
  // 缓存配置
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30分钟
  private readonly SIMILARITY_THRESHOLD = 0.85;
  private readonly HOT_CACHE_TTL = 2 * 60 * 60 * 1000; // 热门问题2小时

  constructor() {
    // Cloudflare Workers 不支持全局作用域的 setInterval
    // 改为在缓存操作时触发清理
  }

  /**
   * 获取缓存的回复
   */
  async getResponse(query: string): Promise<CacheEntry | null> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    // 触发清理过期缓存
    this.cleanupExpiredEntriesIfNeeded();

    // 1. 精确匹配
    const exactMatch = this.findExactMatch(query);
    if (exactMatch) {
      this.recordHit(exactMatch, Date.now() - startTime);
      return exactMatch;
    }

    // 2. 语义相似匹配
    const similarMatch = await this.findSimilarMatch(query);
    if (similarMatch) {
      this.recordHit(similarMatch, Date.now() - startTime);
      return similarMatch;
    }

    // 3. 关键词部分匹配
    const keywordMatch = this.findKeywordMatch(query);
    if (keywordMatch) {
      this.recordHit(keywordMatch, Date.now() - startTime);
      return keywordMatch;
    }

    this.stats.misses++;
    this.updateStats();
    return null;
  }

  /**
   * 缓存新的回复
   */
  async cacheResponse(
    query: string,
    ragResults: any,
    response: string,
    confidence: number,
    sources: string[]
  ): Promise<void> {
    const queryHash = this.generateQueryHash(query);
    
    // 触发清理过期缓存
    this.cleanupExpiredEntriesIfNeeded();
    
    // 检查缓存大小限制
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictLeastUsed();
    }

    const entry: CacheEntry = {
      query: query.trim(),
      queryHash,
      ragResults,
      response,
      confidence,
      timestamp: Date.now(),
      hitCount: 0,
      sources
    };

    this.cache.set(queryHash, entry);
    console.log(`📦 缓存新回复: ${query.substring(0, 50)}...`);
  }

  /**
   * 精确匹配
   */
  private findExactMatch(query: string): CacheEntry | null {
    const queryHash = this.generateQueryHash(query);
    const entry = this.cache.get(queryHash);
    
    if (entry && !this.isExpired(entry)) {
      return entry;
    }
    
    return null;
  }

  /**
   * 语义相似匹配
   */
  private async findSimilarMatch(query: string): Promise<CacheEntry | null> {
    const queryKeywords = this.extractKeywords(query);
    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) continue;

      const similarity = this.calculateSimilarity(queryKeywords, entry.query);
      if (similarity > this.SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
        bestMatch = entry;
        bestSimilarity = similarity;
      }
    }

    return bestMatch;
  }

  /**
   * 关键词部分匹配
   */
  private findKeywordMatch(query: string): CacheEntry | null {
    const queryKeywords = this.extractKeywords(query);
    
    // 只对高质量的缓存条目进行关键词匹配
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry) || entry.confidence < 0.7) continue;

      const entryKeywords = this.extractKeywords(entry.query);
      const overlap = this.calculateKeywordOverlap(queryKeywords, entryKeywords);
      
      // 关键词重叠度超过60%且包含核心业务词汇
      if (overlap > 0.6 && this.hasBusinessKeywords(query, entry.query)) {
        return entry;
      }
    }

    return null;
  }

  /**
   * 计算语义相似度
   */
  private calculateSimilarity(queryKeywords: string[], cachedQuery: string): number {
    const cachedKeywords = this.extractKeywords(cachedQuery);
    
    if (queryKeywords.length === 0 || cachedKeywords.length === 0) return 0;

    // Jaccard相似度
    const intersection = queryKeywords.filter(kw => 
      cachedKeywords.some(ck => ck.toLowerCase().includes(kw.toLowerCase()) || 
                               kw.toLowerCase().includes(ck.toLowerCase()))
    );

    const union = new Set([...queryKeywords, ...cachedKeywords]);
    return intersection.length / union.size;
  }

  /**
   * 计算关键词重叠度
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const matches = keywords1.filter(kw1 => 
      keywords2.some(kw2 => 
        kw1.toLowerCase() === kw2.toLowerCase() ||
        kw1.toLowerCase().includes(kw2.toLowerCase()) ||
        kw2.toLowerCase().includes(kw1.toLowerCase())
      )
    );

    return matches.length / Math.max(keywords1.length, keywords2.length);
  }

  /**
   * 检查是否包含业务关键词
   */
  private hasBusinessKeywords(query1: string, query2: string): boolean {
    const businessKeywords = [
      'svtr', '投资', '创投', 'ai', '公司', '融资', '估值', '市场',
      'startup', 'vc', 'funding', 'valuation', '趋势', '分析'
    ];

    const query1Lower = query1.toLowerCase();
    const query2Lower = query2.toLowerCase();

    return businessKeywords.some(keyword => 
      query1Lower.includes(keyword) && query2Lower.includes(keyword)
    );
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 移除标点符号，保留中英文字符
    const cleaned = text.replace(/[^\w\s\u4e00-\u9fa5]/g, ' ');
    
    // 分词并过滤
    const words = cleaned
      .toLowerCase()
      .split(/\s+/)
      .filter(word => 
        word.length > 1 && 
        !this.isStopWord(word)
      )
      .slice(0, 15); // 限制关键词数量

    return [...new Set(words)]; // 去重
  }

  /**
   * 停用词检查
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      '的', '了', '在', '是', '我', '你', '他', '她', '这', '那', '一个', '我们',
      '什么', '怎么', '为什么', '如何', '哪里', '谁', '当', '如果'
    ]);
    
    return stopWords.has(word.toLowerCase());
  }

  /**
   * 生成查询哈希
   */
  private generateQueryHash(query: string): string {
    // 标准化查询字符串
    const normalized = query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .replace(/\s+/g, ' ');

    // 简单哈希算法
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // 热门问题延长缓存时间
    const ttl = entry.hitCount > 3 ? this.HOT_CACHE_TTL : this.CACHE_TTL;
    
    return age > ttl;
  }

  /**
   * 记录缓存命中
   */
  private recordHit(entry: CacheEntry, responseTime: number): void {
    entry.hitCount++;
    entry.timestamp = Date.now(); // 刷新时间戳
    
    this.stats.hits++;
    this.updateStats();
    
    console.log(`⚡ 缓存命中: ${entry.query.substring(0, 30)}... (第${entry.hitCount}次)`);
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    this.stats.hitRate = this.stats.totalQueries > 0 ? 
      (this.stats.hits / this.stats.totalQueries) * 100 : 0;
  }

  /**
   * 按需清理过期条目（替代定时清理）
   */
  private cleanupExpiredEntriesIfNeeded(): void {
    // 只在缓存较大时进行清理，避免频繁操作
    if (this.cache.size < 100) return;
    
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 按需清理过期缓存: ${cleanedCount} 条目`);
    }
  }

  /**
   * 清理过期条目（保留原方法用于手动调用）
   */
  private cleanupExpiredEntries(): void {
    let cleanedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 清理过期缓存: ${cleanedCount} 条目`);
    }
  }

  /**
   * 驱逐最少使用的条目
   */
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return;

    // 找到使用次数最少且最旧的条目
    let oldestEntry: [string, CacheEntry] | null = null;
    let minScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // 综合考虑使用次数和时间
      const score = entry.hitCount + (Date.now() - entry.timestamp) / 1000000;
      if (score < minScore) {
        minScore = score;
        oldestEntry = [key, entry];
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry[0]);
      console.log(`🗑️ 驱逐缓存条目: ${oldestEntry[1].query.substring(0, 30)}...`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats & { cacheSize: number } {
    return {
      ...this.stats,
      cacheSize: this.cache.size
    };
  }

  /**
   * 预热缓存 - 缓存常见问题
   */
  async warmupCache(): Promise<void> {
    const commonQueries = [
      'SVTR是什么',
      'AI创投库包含哪些内容',
      '如何使用SVTR平台',
      '最新的AI投资趋势',
      'SVTR的核心功能',
      '硅谷科技评论介绍'
    ];

    console.log('🔥 开始缓存预热...');
    
    // 这里应该调用RAG服务为这些问题生成回复并缓存
    // 实际实现时需要与chat.ts集成
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalQueries: 0,
      hitRate: 0,
      avgResponseTime: 0
    };
    console.log('🗑️ 缓存已清空');
  }

  /**
   * 导出缓存数据（用于分析）
   */
  exportCacheData(): any {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      query: entry.query,
      hitCount: entry.hitCount,
      confidence: entry.confidence,
      timestamp: entry.timestamp,
      sources: entry.sources
    }));

    return {
      stats: this.getStats(),
      entries: entries.sort((a, b) => b.hitCount - a.hitCount) // 按使用频率排序
    };
  }
}