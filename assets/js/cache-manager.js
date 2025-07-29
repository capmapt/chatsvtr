/**
 * SVTR.AI 缓存管理器 - 更激进的缓存策略
 * 提供智能缓存、预测性加载和离线支持
 */

class CacheManager {
  constructor(options = {}) {
    this.options = {
      // 缓存时间配置
      staticAssetCache: 365 * 24 * 60 * 60 * 1000, // 1年
      apiResponseCache: 5 * 60 * 1000, // 5分钟
      htmlCache: 60 * 60 * 1000, // 1小时
      imageCache: 30 * 24 * 60 * 60 * 1000, // 30天
      
      // 预测性加载配置
      prefetchDelay: 50, // 鼠标悬停50ms后开始预取
      maxPrefetchSize: 5 * 1024 * 1024, // 最大预取5MB
      
      // 存储配额管理
      maxStorageSize: 50 * 1024 * 1024, // 最大存储50MB
      cleanupThreshold: 0.9, // 90%时开始清理
      
      ...options
    };

    this.cache = new Map();
    this.prefetchQueue = new Set();
    this.analytics = {
      hits: 0,
      misses: 0,
      prefetches: 0,
      evictions: 0
    };

    this.init();
  }

  async init() {
    // 检查浏览器支持
    this.checkStorageSupport();
    
    // 初始化Service Worker缓存
    await this.initServiceWorker();
    
    // 设置智能预取
    this.setupIntelligentPrefetch();
    
    // 设置定期清理
    this.setupPeriodicCleanup();
    
    // 加载现有缓存
    await this.loadExistingCache();
    
    // 设置存储监控
    this.monitorStorage();
    
    console.log('缓存管理器初始化完成');
  }

  checkStorageSupport() {
    this.supportsLocalStorage = this.testStorage('localStorage');
    this.supportsSessionStorage = this.testStorage('sessionStorage');
    this.supportsIndexedDB = 'indexedDB' in window;
    this.supportsServiceWorker = 'serviceWorker' in navigator;
    
    console.log('存储支持情况:', {
      localStorage: this.supportsLocalStorage,
      sessionStorage: this.supportsSessionStorage,
      indexedDB: this.supportsIndexedDB,
      serviceWorker: this.supportsServiceWorker
    });
  }

  testStorage(type) {
    try {
      const storage = window[type];
      const testKey = '__test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async initServiceWorker() {
    if (!this.supportsServiceWorker) return;

    try {
      // 检查Service Worker文件是否存在
      const swResponse = await fetch('/sw.js', { method: 'HEAD' });
      if (!swResponse.ok) {
        console.log('Service Worker文件不存在，跳过注册');
        return;
      }

      // 注册Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service Worker注册成功:', registration);
      
      // 监听更新
      registration.addEventListener('updatefound', () => {
        console.log('Service Worker有更新');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用
            this.notifyServiceWorkerUpdate();
          }
        });
      });

      // 监听Service Worker控制变化
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker控制权已切换');
        window.location.reload();
      });

    } catch (error) {
      console.log('Service Worker注册失败，继续使用其他缓存策略:', error.message);
    }
  }

  notifyServiceWorkerUpdate() {
    if (window.uxEnhancer) {
      window.uxEnhancer.showToast('网站有更新，刷新页面以获取最新版本', 'info', 5000);
    }
  }

  setupIntelligentPrefetch() {
    let prefetchTimer = null;
    
    // 鼠标悬停预取
    document.addEventListener('mouseover', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      
      clearTimeout(prefetchTimer);
      prefetchTimer = setTimeout(() => {
        this.prefetchResource(link.href);
      }, this.options.prefetchDelay);
    });

    // 鼠标离开取消预取
    document.addEventListener('mouseout', () => {
      clearTimeout(prefetchTimer);
    });

    // 基于用户行为的智能预取
    this.setupBehaviorBasedPrefetch();
  }

  setupBehaviorBasedPrefetch() {
    // 分析用户点击模式
    const clickPatterns = this.getClickPatterns();
    
    // 预取可能访问的页面
    clickPatterns.forEach(pattern => {
      if (pattern.probability > 0.7) {
        this.prefetchResource(pattern.url);
      }
    });

    // 滚动位置预测
    let scrollTimer = null;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        this.predictNextContent();
      }, 100);
    }, { passive: true });
  }

  getClickPatterns() {
    // 从localStorage获取历史点击数据
    try {
      const patterns = JSON.parse(
        localStorage.getItem('svtr_click_patterns') || '[]'
      );
      return patterns.filter(p => p.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000);
    } catch {
      return [];
    }
  }

  recordClick(url) {
    try {
      const patterns = this.getClickPatterns();
      patterns.push({
        url,
        timestamp: Date.now(),
        referrer: document.referrer
      });
      
      // 只保留最近1000条记录
      if (patterns.length > 1000) {
        patterns.splice(0, patterns.length - 1000);
      }
      
      localStorage.setItem('svtr_click_patterns', JSON.stringify(patterns));
    } catch {
      // 存储失败时忽略
    }
  }

  async prefetchResource(url) {
    if (this.prefetchQueue.has(url)) return;
    
    try {
      // 检查是否已缓存
      if (await this.get(url)) {
        return;
      }
      
      // 检查资源大小
      const head = await fetch(url, { method: 'HEAD' });
      const size = parseInt(head.headers.get('content-length') || '0');
      
      if (size > this.options.maxPrefetchSize) {
        console.log('资源太大，跳过预取:', url);
        return;
      }
      
      this.prefetchQueue.add(url);
      
      // 低优先级预取
      const response = await fetch(url, {
        priority: 'low'
      });
      
      if (response.ok) {
        await this.set(url, await response.clone().text(), {
          type: 'prefetch',
          size
        });
        
        this.analytics.prefetches++;
        console.log('预取成功:', url);
      }
      
    } catch (error) {
      console.log('预取失败:', url, error);
    } finally {
      this.prefetchQueue.delete(url);
    }
  }

  predictNextContent() {
    const scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    
    // 接近页面底部时预加载相关内容
    if (scrollPercentage > 0.8) {
      this.prefetchRelatedContent();
    }
  }

  async prefetchRelatedContent() {
    // 根据当前页面内容预取相关资源
    const links = document.querySelectorAll('a[href^="/"], a[href^="./"]');
    const relatedLinks = Array.from(links)
      .slice(0, 3) // 只预取前3个相关链接
      .map(link => link.href);
    
    for (const url of relatedLinks) {
      await this.prefetchResource(url);
    }
  }

  // 核心缓存操作
  async get(key, options = {}) {
    const cacheKey = this.normalizeKey(key);
    
    try {
      // 先检查内存缓存
      const memoryItem = this.cache.get(cacheKey);
      if (memoryItem && !this.isExpired(memoryItem)) {
        this.analytics.hits++;
        return memoryItem.data;
      }
      
      // 检查localStorage
      if (this.supportsLocalStorage) {
        const storageItem = localStorage.getItem(cacheKey);
        if (storageItem) {
          const parsed = JSON.parse(storageItem);
          if (!this.isExpired(parsed)) {
            // 恢复到内存缓存
            this.cache.set(cacheKey, parsed);
            this.analytics.hits++;
            return parsed.data;
          } else {
            // 过期删除
            localStorage.removeItem(cacheKey);
          }
        }
      }
      
      // 检查IndexedDB（大数据）
      if (this.supportsIndexedDB && options.checkIndexedDB !== false) {
        const idbItem = await this.getFromIndexedDB(cacheKey);
        if (idbItem && !this.isExpired(idbItem)) {
          this.analytics.hits++;
          return idbItem.data;
        }
      }
      
      this.analytics.misses++;
      return null;
      
    } catch (error) {
      console.warn('缓存获取失败:', error);
      this.analytics.misses++;
      return null;
    }
  }

  async set(key, data, options = {}) {
    const cacheKey = this.normalizeKey(key);
    const ttl = options.ttl || this.getTTLByType(options.type || 'default');
    
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl,
      type: options.type || 'default',
      size: options.size || this.estimateSize(data),
      accessCount: 0,
      lastAccess: Date.now()
    };

    try {
      // 存储到内存缓存
      this.cache.set(cacheKey, cacheItem);
      
      // 根据大小选择存储位置
      if (cacheItem.size < 1024 * 1024) { // 小于1MB存localStorage
        if (this.supportsLocalStorage) {
          await this.ensureStorageSpace(cacheItem.size);
          localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        }
      } else { // 大于1MB存IndexedDB
        if (this.supportsIndexedDB) {
          await this.setToIndexedDB(cacheKey, cacheItem);
        }
      }
      
      return true;
      
    } catch (error) {
      console.warn('缓存设置失败:', error);
      return false;
    }
  }

  async delete(key) {
    const cacheKey = this.normalizeKey(key);
    
    // 从内存删除
    this.cache.delete(cacheKey);
    
    // 从localStorage删除
    if (this.supportsLocalStorage) {
      localStorage.removeItem(cacheKey);
    }
    
    // 从IndexedDB删除
    if (this.supportsIndexedDB) {
      await this.deleteFromIndexedDB(cacheKey);
    }
  }

  async clear() {
    // 清空内存缓存
    this.cache.clear();
    
    // 清空localStorage中的缓存项
    if (this.supportsLocalStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('svtr_cache_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    // 清空IndexedDB
    if (this.supportsIndexedDB) {
      await this.clearIndexedDB();
    }
  }

  // 工具方法
  normalizeKey(key) {
    return 'svtr_cache_' + btoa(encodeURIComponent(key)).slice(0, 32);
  }

  isExpired(item) {
    return Date.now() - item.timestamp > item.ttl;
  }

  getTTLByType(type) {
    const ttlMap = {
      'static': this.options.staticAssetCache,
      'api': this.options.apiResponseCache,
      'html': this.options.htmlCache,
      'image': this.options.imageCache,
      'prefetch': this.options.htmlCache,
      'default': this.options.htmlCache
    };
    
    return ttlMap[type] || ttlMap.default;
  }

  estimateSize(data) {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return JSON.stringify(data).length * 2; // 估算
  }

  async ensureStorageSpace(requiredSize) {
    if (!this.supportsLocalStorage) return;
    
    try {
      // 检查当前使用量
      const currentSize = this.getStorageSize();
      const available = this.options.maxStorageSize - currentSize;
      
      if (available < requiredSize) {
        await this.performLRUCleanup(requiredSize - available);
      }
      
    } catch (error) {
      console.warn('存储空间管理失败:', error);
    }
  }

  getStorageSize() {
    if (!this.supportsLocalStorage) return 0;
    
    let size = 0;
    for (const key in localStorage) {
      if (key.startsWith('svtr_cache_')) {
        size += localStorage[key].length;
      }
    }
    return size;
  }

  async performLRUCleanup(requiredSpace) {
    const items = [];
    
    // 收集所有缓存项信息
    for (const key in localStorage) {
      if (key.startsWith('svtr_cache_')) {
        try {
          const item = JSON.parse(localStorage[key]);
          items.push({
            key,
            ...item,
            score: this.calculateLRUScore(item)
          });
        } catch {
          localStorage.removeItem(key); // 删除损坏的项
        }
      }
    }
    
    // 按LRU分数排序
    items.sort((a, b) => a.score - b.score);
    
    // 删除项目直到释放足够空间
    let freedSpace = 0;
    for (const item of items) {
      if (freedSpace >= requiredSpace) break;
      
      localStorage.removeItem(item.key);
      this.cache.delete(item.key);
      freedSpace += item.size || 0;
      this.analytics.evictions++;
    }
    
    console.log(`LRU清理完成，释放空间: ${freedSpace} bytes`);
  }

  calculateLRUScore(item) {
    const now = Date.now();
    const age = now - item.timestamp;
    const lastAccess = now - (item.lastAccess || item.timestamp);
    const accessFrequency = (item.accessCount || 0) / Math.max(age / (24 * 60 * 60 * 1000), 1);
    
    // 综合评分：年龄 + 最后访问时间 - 访问频率
    return age * 0.3 + lastAccess * 0.5 - accessFrequency * 1000;
  }

  setupPeriodicCleanup() {
    // 每小时执行一次清理
    setInterval(() => {
      this.performPeriodicCleanup();
    }, 60 * 60 * 1000);
    
    // 页面卸载时清理
    window.addEventListener('beforeunload', () => {
      this.performPeriodicCleanup();
    });
  }

  async performPeriodicCleanup() {
    console.log('执行定期缓存清理');
    
    const now = Date.now();
    const keysToDelete = [];
    
    // 清理过期项
    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    });
    
    // 删除过期项
    for (const key of keysToDelete) {
      await this.delete(key.replace('svtr_cache_', ''));
    }
    
    console.log(`清理了${keysToDelete.length}个过期缓存项`);
  }

  async loadExistingCache() {
    if (!this.supportsLocalStorage) return;
    
    let loadedCount = 0;
    
    for (const key in localStorage) {
      if (key.startsWith('svtr_cache_')) {
        try {
          const item = JSON.parse(localStorage[key]);
          if (!this.isExpired(item)) {
            this.cache.set(key, item);
            loadedCount++;
          } else {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      }
    }
    
    console.log(`加载了${loadedCount}个现有缓存项`);
  }

  monitorStorage() {
    // 监控存储使用情况
    setInterval(() => {
      const stats = this.getStats();
      if (stats.storageUsage > this.options.cleanupThreshold) {
        console.warn('存储使用率过高，执行清理:', stats);
        this.performLRUCleanup(stats.totalSize * 0.2); // 清理20%
      }
    }, 5 * 60 * 1000); // 每5分钟检查一次
  }

  // IndexedDB操作（用于大数据存储）
  async getFromIndexedDB(key) {
    // 简化的IndexedDB实现
    return null; // 暂时返回null，后续可以实现
  }

  async setToIndexedDB(key, item) {
    // 简化的IndexedDB实现
    return false;
  }

  async deleteFromIndexedDB(key) {
    // 简化的IndexedDB实现
    return true;
  }

  async clearIndexedDB() {
    // 简化的IndexedDB实现
    return true;
  }

  // 统计信息
  getStats() {
    const storageSize = this.getStorageSize();
    
    return {
      memoryCache: this.cache.size,
      storageSize,
      storageUsage: storageSize / this.options.maxStorageSize,
      totalSize: storageSize,
      analytics: { ...this.analytics },
      hitRate: this.analytics.hits / (this.analytics.hits + this.analytics.misses) || 0
    };
  }

  // 公共API
  async cacheResponse(url, response) {
    const contentType = response.headers.get('content-type') || '';
    let type = 'default';
    
    if (contentType.includes('image/')) type = 'image';
    else if (contentType.includes('text/html')) type = 'html';
    else if (contentType.includes('application/json')) type = 'api';
    else if (contentType.includes('text/css') || contentType.includes('application/javascript')) type = 'static';
    
    const data = await response.text();
    await this.set(url, data, { type });
    
    return data;
  }

  createCacheMiddleware() {
    return async (url, options = {}) => {
      // 检查缓存
      const cached = await this.get(url);
      if (cached && !options.bypassCache) {
        return new Response(cached);
      }
      
      // 发起请求
      const response = await fetch(url, options);
      
      // 缓存响应
      if (response.ok && response.status < 400) {
        const cachedData = await this.cacheResponse(url, response.clone());
        return response;
      }
      
      return response;
    };
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.cacheManager = new CacheManager();
  
  // 记录页面访问
  window.cacheManager.recordClick(window.location.href);
  
  console.log('缓存管理器已启动');
});

// 导出
window.CacheManager = CacheManager;