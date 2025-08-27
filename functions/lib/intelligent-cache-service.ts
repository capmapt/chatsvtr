/**
 * SVTR.AI 智能分层缓存服务
 * 2025年优化版 - L1内存 + L2 KV + L3向量预计算
 */

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
  tags: string[];
  confidence: number;
}

interface CacheConfig {
  l1MaxItems: number;
  l2DefaultTtl: number;
  l3VectorCacheTtl: number;
  enablePredictive: boolean;
  enableCompression: boolean;
}

export class IntelligentCacheService {
  private l1Cache = new Map<string, CacheItem>(); // 内存缓存
  private kvNamespace: any; // L2 KV缓存
  private vectorize: any; // L3 向量缓存
  private config: CacheConfig;
  private hitStats = { l1: 0, l2: 0, l3: 0, miss: 0 };

  constructor(kvNamespace: any, vectorize: any, config?: Partial<CacheConfig>) {
    this.kvNamespace = kvNamespace;
    this.vectorize = vectorize;
    this.config = {
      l1MaxItems: 100,
      l2DefaultTtl: 24 * 60 * 60, // 24小时
      l3VectorCacheTtl: 7 * 24 * 60 * 60, // 7天
      enablePredictive: true,
      enableCompression: true,
      ...config
    };
  }

  /**
   * 智能获取 - 三层缓存策略
   */
  async get(key: string, options: any = {}): Promise<any> {
    const startTime = Date.now();
    
    try {
      // L1 内存缓存检查
      const l1Result = this.getFromL1(key);
      if (l1Result) {
        this.hitStats.l1++;
        console.log(`🚀 L1缓存命中: ${key} (${Date.now() - startTime}ms)`);
        return l1Result;
      }

      // L2 KV缓存检查
      const l2Result = await this.getFromL2(key);
      if (l2Result) {
        this.hitStats.l2++;
        // 回写到L1
        this.setToL1(key, l2Result, options.ttl || this.config.l2DefaultTtl);
        console.log(`⚡ L2缓存命中: ${key} (${Date.now() - startTime}ms)`);
        return l2Result;
      }

      // L3 向量缓存检查（预计算结果）
      if (options.enableVectorCache) {
        const l3Result = await this.getFromL3(key, options);
        if (l3Result) {
          this.hitStats.l3++;
          // 回写到L1和L2
          await this.setToL2(key, l3Result, options.ttl || this.config.l2DefaultTtl);
          this.setToL1(key, l3Result, options.ttl || this.config.l2DefaultTtl);
          console.log(`🎯 L3向量缓存命中: ${key} (${Date.now() - startTime}ms)`);
          return l3Result;
        }
      }

      this.hitStats.miss++;
      return null;
    } catch (error) {
      console.error('缓存获取失败:', error);
      return null;
    }
  }

  /**
   * 智能设置 - 多层写入策略
   */
  async set(key: string, value: any, ttl?: number, options: any = {}): Promise<void> {
    const actualTtl = ttl || this.config.l2DefaultTtl;
    
    try {
      // 数据预处理
      const processedValue = this.config.enableCompression 
        ? this.compressData(value) 
        : value;

      // 写入L1（总是写入）
      this.setToL1(key, processedValue, actualTtl);

      // 写入L2（持久化）
      await this.setToL2(key, processedValue, actualTtl);

      // 写入L3（如果是向量数据）
      if (options.isVectorData) {
        await this.setToL3(key, processedValue, this.config.l3VectorCacheTtl);
      }

      // 预测性缓存
      if (this.config.enablePredictive && options.relatedKeys) {
        await this.preloadRelatedData(options.relatedKeys);
      }

    } catch (error) {
      console.error('缓存设置失败:', error);
    }
  }

  /**
   * L1内存缓存操作
   */
  private getFromL1(key: string): any {
    const item = this.l1Cache.get(key);
    if (!item) return null;

    // 检查过期
    if (Date.now() > item.timestamp + item.ttl * 1000) {
      this.l1Cache.delete(key);
      return null;
    }

    // 更新访问统计
    item.hitCount++;
    item.lastAccessed = Date.now();
    return this.config.enableCompression ? this.decompressData(item.data) : item.data;
  }

  private setToL1(key: string, value: any, ttl: number): void {
    // LRU淘汰策略
    if (this.l1Cache.size >= this.config.l1MaxItems) {
      const oldestKey = this.findLRUKey();
      this.l1Cache.delete(oldestKey);
    }

    this.l1Cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
      hitCount: 0,
      lastAccessed: Date.now(),
      tags: [],
      confidence: 1.0
    });
  }

  /**
   * L2 KV缓存操作
   */
  private async getFromL2(key: string): Promise<any> {
    if (!this.kvNamespace) return null;

    try {
      const cached = await this.kvNamespace.get(`cache:${key}`);
      if (!cached) return null;

      const item: CacheItem = JSON.parse(cached);
      
      // 检查过期
      if (Date.now() > item.timestamp + item.ttl * 1000) {
        await this.kvNamespace.delete(`cache:${key}`);
        return null;
      }

      return this.config.enableCompression ? this.decompressData(item.data) : item.data;
    } catch (error) {
      console.error('L2缓存读取失败:', error);
      return null;
    }
  }

  private async setToL2(key: string, value: any, ttl: number): Promise<void> {
    if (!this.kvNamespace) return;

    try {
      const item: CacheItem = {
        data: value,
        timestamp: Date.now(),
        ttl,
        hitCount: 0,
        lastAccessed: Date.now(),
        tags: [],
        confidence: 1.0
      };

      await this.kvNamespace.put(
        `cache:${key}`, 
        JSON.stringify(item),
        { expirationTtl: ttl }
      );
    } catch (error) {
      console.error('L2缓存写入失败:', error);
    }
  }

  /**
   * L3向量缓存操作（预计算向量检索结果）
   */
  private async getFromL3(key: string, options: any): Promise<any> {
    if (!this.vectorize) return null;

    try {
      // 查询预计算的向量检索结果
      const vectorKey = `vector_cache:${this.hashString(key)}`;
      const results = await this.vectorize.query([], {
        filter: { cache_key: vectorKey },
        topK: 1,
        returnMetadata: 'all'
      });

      if (results.matches && results.matches.length > 0) {
        const match = results.matches[0];
        if (match.metadata && match.metadata.cached_data) {
          return JSON.parse(match.metadata.cached_data);
        }
      }

      return null;
    } catch (error) {
      console.error('L3向量缓存读取失败:', error);
      return null;
    }
  }

  private async setToL3(key: string, value: any, ttl: number): Promise<void> {
    if (!this.vectorize) return;

    try {
      const vectorKey = `vector_cache:${this.hashString(key)}`;
      
      // 生成缓存向量（可以是查询的embedding）
      const cacheVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
      
      await this.vectorize.insert([{
        id: vectorKey,
        values: cacheVector,
        metadata: {
          cache_key: vectorKey,
          cached_data: JSON.stringify(value),
          created_at: Date.now(),
          expires_at: Date.now() + ttl * 1000
        }
      }]);
    } catch (error) {
      console.error('L3向量缓存写入失败:', error);
    }
  }

  /**
   * 预测性缓存 - 预加载相关数据
   */
  private async preloadRelatedData(relatedKeys: string[]): Promise<void> {
    if (!this.config.enablePredictive) return;

    for (const relatedKey of relatedKeys.slice(0, 3)) { // 限制预加载数量
      setTimeout(async () => {
        const exists = await this.get(relatedKey);
        if (!exists) {
          console.log(`🔮 预测性缓存: 预加载 ${relatedKey}`);
          // 这里可以触发相关数据的加载
        }
      }, 100);
    }
  }

  /**
   * 缓存统计和清理
   */
  getStats(): any {
    const total = Object.values(this.hitStats).reduce((a, b) => a + b, 0);
    return {
      ...this.hitStats,
      total,
      hitRate: total > 0 ? ((total - this.hitStats.miss) / total * 100).toFixed(2) + '%' : '0%',
      l1Size: this.l1Cache.size,
      l1MaxSize: this.config.l1MaxItems
    };
  }

  /**
   * 智能缓存清理
   */
  async cleanup(): Promise<void> {
    // L1清理过期项
    for (const [key, item] of this.l1Cache.entries()) {
      if (Date.now() > item.timestamp + item.ttl * 1000) {
        this.l1Cache.delete(key);
      }
    }

    // L3向量缓存清理过期项
    if (this.vectorize) {
      try {
        // 查询过期的缓存项并删除
        const expiredResults = await this.vectorize.query([], {
          filter: { expires_at: { $lt: Date.now() } },
          topK: 100,
          returnMetadata: 'all'
        });

        if (expiredResults.matches) {
          for (const match of expiredResults.matches) {
            await this.vectorize.deleteById(match.id);
          }
        }
      } catch (error) {
        console.error('L3缓存清理失败:', error);
      }
    }
  }

  /**
   * 工具方法
   */
  private findLRUKey(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.l1Cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private compressData(data: any): any {
    // 简单的压缩策略 - 生产环境可用更复杂的压缩
    try {
      const jsonString = JSON.stringify(data);
      if (jsonString.length > 1000) {
        // 可以实现gzip压缩
        return { _compressed: true, data: jsonString };
      }
      return data;
    } catch {
      return data;
    }
  }

  private decompressData(data: any): any {
    if (data && data._compressed) {
      try {
        return JSON.parse(data.data);
      } catch {
        return data.data;
      }
    }
    return data;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * 工厂函数：创建智能缓存服务实例
 */
export function createIntelligentCache(kvNamespace: any, vectorize: any, config?: any) {
  return new IntelligentCacheService(kvNamespace, vectorize, config);
}