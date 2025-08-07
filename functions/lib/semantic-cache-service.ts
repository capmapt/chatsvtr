/**
 * SVTR.AI Semantic Caching Service
 * 语义缓存服务 - 提升RAG系统性能和响应速度
 */

export interface CacheEntry {
  key: string;
  query: string;
  queryVector?: number[];
  results: any;
  metadata: {
    timestamp: number;
    hitCount: number;
    queryType: string;
    confidence: number;
    userAgent?: string;
  };
  expiresAt: number;
}

export interface CacheHit {
  entry: CacheEntry;
  similarity: number;
  isExact: boolean;
  confidence: number;
}

export class SemanticCacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private kvNamespace?: any;
  private maxCacheSize = 1000;
  private defaultTTL = 6 * 60 * 60 * 1000; // 6小时
  private semanticThreshold = 0.85; // 语义相似度阈值

  constructor(kvNamespace?: any) {
    this.kvNamespace = kvNamespace;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(query: string, queryType?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    const hash = this.simpleHash(normalizedQuery + (queryType || ''));
    return `rag_cache_${hash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * 计算查询相似度
   */
  private calculateQuerySimilarity(query1: string, query2: string): number {
    // 简单的文本相似度计算
    const words1 = new Set(query1.toLowerCase().split(/\s+/));
    const words2 = new Set(query2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard相似度
    const jaccard = intersection.size / union.size;
    
    // 长度相似度
    const lengthSim = 1 - Math.abs(query1.length - query2.length) / Math.max(query1.length, query2.length);
    
    // 组合相似度
    return (jaccard * 0.7 + lengthSim * 0.3);
  }

  /**
   * 检查缓存命中
   */
  async checkCache(query: string, queryType?: string, options: {
    useSemanticMatch?: boolean;
    maxCandidates?: number;
  } = {}): Promise<CacheHit | null> {
    const {
      useSemanticMatch = true,
      maxCandidates = 5
    } = options;

    try {
      // 1. 精确匹配检查
      const exactKey = this.generateCacheKey(query, queryType);
      const exactMatch = this.cache.get(exactKey);
      
      if (exactMatch && exactMatch.expiresAt > Date.now()) {
        exactMatch.metadata.hitCount++;
        console.log('✅ 缓存精确命中');
        return {
          entry: exactMatch,
          similarity: 1.0,
          isExact: true,
          confidence: 1.0
        };
      }

      // 2. 语义相似匹配（如果启用）
      if (useSemanticMatch) {
        const candidates: { entry: CacheEntry, similarity: number }[] = [];
        
        for (const [key, entry] of this.cache.entries()) {
          if (entry.expiresAt <= Date.now()) {
            this.cache.delete(key);
            continue;
          }

          // 查询类型匹配优先
          if (queryType && entry.metadata.queryType !== queryType) {
            continue;
          }

          const similarity = this.calculateQuerySimilarity(query, entry.query);
          if (similarity >= this.semanticThreshold) {
            candidates.push({ entry, similarity });
          }
        }

        // 找到最相似的结果
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.similarity - a.similarity);
          const bestMatch = candidates[0];
          
          bestMatch.entry.metadata.hitCount++;
          console.log(`🎯 语义缓存命中: 相似度=${(bestMatch.similarity * 100).toFixed(1)}%`);
          
          return {
            entry: bestMatch.entry,
            similarity: bestMatch.similarity,
            isExact: false,
            confidence: bestMatch.similarity
          };
        }
      }

      console.log('❌ 缓存未命中');
      return null;

    } catch (error) {
      console.error('缓存检查失败:', error);
      return null;
    }
  }

  /**
   * 存储到缓存
   */
  async storeInCache(
    query: string,
    results: any,
    metadata: {
      queryType?: string;
      confidence?: number;
      userAgent?: string;
    } = {},
    ttl?: number
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(query, metadata.queryType);
      const expiresAt = Date.now() + (ttl || this.defaultTTL);
      
      const entry: CacheEntry = {
        key: cacheKey,
        query: query.trim(),
        results,
        metadata: {
          timestamp: Date.now(),
          hitCount: 0,
          queryType: metadata.queryType || 'general',
          confidence: metadata.confidence || 0.5,
          userAgent: metadata.userAgent
        },
        expiresAt
      };

      // 内存缓存
      this.cache.set(cacheKey, entry);

      // 持久化到KV（如果可用）
      if (this.kvNamespace) {
        try {
          await this.kvNamespace.put(
            `cache:${cacheKey}`,
            JSON.stringify(entry),
            { expirationTtl: ttl ? Math.floor(ttl / 1000) : Math.floor(this.defaultTTL / 1000) }
          );
        } catch (kvError) {
          console.log('KV缓存写入失败:', kvError);
        }
      }

      // 检查缓存大小并清理
      await this.cleanupCache();

      console.log(`💾 查询已缓存: ${cacheKey}`);

    } catch (error) {
      console.error('缓存存储失败:', error);
    }
  }

  /**
   * 清理过期和低价值缓存
   */
  private async cleanupCache(): Promise<void> {
    try {
      const now = Date.now();
      
      // 删除过期条目
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt <= now) {
          this.cache.delete(key);
        }
      }

      // 如果缓存仍然过大，删除最少使用的条目
      if (this.cache.size > this.maxCacheSize) {
        const entries = Array.from(this.cache.entries());
        
        // 按使用频次和时间排序
        entries.sort((a, b) => {
          const scoreA = a[1].metadata.hitCount * 0.7 + (now - a[1].metadata.timestamp) * 0.3;
          const scoreB = b[1].metadata.hitCount * 0.7 + (now - b[1].metadata.timestamp) * 0.3;
          return scoreA - scoreB;
        });

        // 删除最少使用的条目
        const toDelete = entries.slice(0, this.cache.size - this.maxCacheSize + 100);
        toDelete.forEach(([key]) => this.cache.delete(key));

        console.log(`🧹 缓存清理完成，删除${toDelete.length}个条目`);
      }

    } catch (error) {
      console.error('缓存清理失败:', error);
    }
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    totalEntries: number;
    totalHits: number;
    avgConfidence: number;
    typeDistribution: Record<string, number>;
    hitRateByType: Record<string, { hits: number; queries: number }>;
  } {
    const stats = {
      totalEntries: this.cache.size,
      totalHits: 0,
      avgConfidence: 0,
      typeDistribution: {} as Record<string, number>,
      hitRateByType: {} as Record<string, { hits: number; queries: number }>
    };

    let totalConfidence = 0;

    for (const entry of this.cache.values()) {
      stats.totalHits += entry.metadata.hitCount;
      totalConfidence += entry.metadata.confidence;
      
      const type = entry.metadata.queryType;
      stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
      
      if (!stats.hitRateByType[type]) {
        stats.hitRateByType[type] = { hits: 0, queries: 0 };
      }
      stats.hitRateByType[type].hits += entry.metadata.hitCount;
      stats.hitRateByType[type].queries += 1;
    }

    stats.avgConfidence = stats.totalEntries > 0 ? totalConfidence / stats.totalEntries : 0;

    return stats;
  }

  /**
   * 预热缓存 - 使用常见查询
   */
  async warmupCache(commonQueries: Array<{ query: string; queryType?: string }>): Promise<void> {
    console.log(`🔥 开始缓存预热，${commonQueries.length} 个查询`);
    
    // 这里应该调用实际的RAG服务来填充缓存
    // 但为了演示，我们创建一些模拟结果
    for (const { query, queryType } of commonQueries) {
      const mockResults = {
        matches: [
          {
            id: `warmup_${Date.now()}`,
            content: `预热缓存结果: ${query}`,
            score: 0.8,
            source: 'warmup'
          }
        ],
        confidence: 0.7,
        source: 'warmup'
      };

      await this.storeInCache(query, mockResults, { queryType, confidence: 0.7 });
    }

    console.log('✅ 缓存预热完成');
  }

  /**
   * 强制清除所有缓存
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 缓存已清空');
  }

  /**
   * 获取热门查询
   */
  getPopularQueries(limit = 10): Array<{ query: string; hitCount: number; queryType: string }> {
    const entries = Array.from(this.cache.values())
      .filter(entry => entry.metadata.hitCount > 0)
      .sort((a, b) => b.metadata.hitCount - a.metadata.hitCount)
      .slice(0, limit)
      .map(entry => ({
        query: entry.query,
        hitCount: entry.metadata.hitCount,
        queryType: entry.metadata.queryType
      }));

    return entries;
  }

  /**
   * 批量预加载缓存项
   */
  async batchPreload(entries: Array<{
    query: string;
    results: any;
    queryType?: string;
    confidence?: number;
  }>): Promise<void> {
    console.log(`📦 批量预加载${entries.length}个缓存项`);
    
    for (const entry of entries) {
      await this.storeInCache(
        entry.query,
        entry.results,
        { queryType: entry.queryType, confidence: entry.confidence }
      );
    }

    console.log('✅ 批量预加载完成');
  }

  /**
   * 从KV存储恢复缓存
   */
  async restoreFromKV(): Promise<number> {
    if (!this.kvNamespace) return 0;

    try {
      // 这里需要实现从KV批量读取的逻辑
      // Cloudflare KV没有直接的列出所有键的功能
      // 所以这里只是一个占位符实现
      console.log('⚠️ KV缓存恢复功能需要额外实现');
      return 0;
    } catch (error) {
      console.error('KV缓存恢复失败:', error);
      return 0;
    }
  }
}

/**
 * 工厂函数
 */
export function createSemanticCacheService(kvNamespace?: any): SemanticCacheService {
  return new SemanticCacheService(kvNamespace);
}