/**
 * SVTR性能稳定器
 * 防止浏览器长时间运行崩溃和内存泄漏
 */

class SVTRPerformanceStabilizer {
  constructor() {
    this.timers = new Set();
    this.eventListeners = new Set();
    this.performanceData = {
      memoryWarnings: 0,
      maxMemoryUsage: 0,
      startTime: Date.now()
    };
    
    this.init();
  }

  init() {
    this.setupMemoryMonitoring();
    this.setupTabVisibilityOptimization();
    this.setupPeriodicCleanup();
    this.setupBrowserHangPrevention();
    
    console.log('🛡️ SVTR性能稳定器已启动');
  }

  /**
   * 注册定时器，确保能被正确清理
   */
  registerTimer(timer) {
    this.timers.add(timer);
    return timer;
  }

  /**
   * 清理指定定时器
   */
  clearTimer(timer) {
    if (this.timers.has(timer)) {
      clearInterval(timer);
      clearTimeout(timer);
      this.timers.delete(timer);
    }
  }

  /**
   * 清理所有定时器
   */
  clearAllTimers() {
    this.timers.forEach(timer => {
      clearInterval(timer);
      clearTimeout(timer);
    });
    this.timers.clear();
    console.log('🧹 已清理所有定时器');
  }

  /**
   * 注册事件监听器
   */
  registerEventListener(element, event, handler, options = {}) {
    const listenerInfo = { element, event, handler, options };
    this.eventListeners.add(listenerInfo);
    element.addEventListener(event, handler, options);
    return listenerInfo;
  }

  /**
   * 清理指定事件监听器
   */
  removeEventListener(listenerInfo) {
    if (this.eventListeners.has(listenerInfo)) {
      const { element, event, handler, options } = listenerInfo;
      element.removeEventListener(event, handler, options);
      this.eventListeners.delete(listenerInfo);
    }
  }

  /**
   * 清理所有事件监听器
   */
  removeAllEventListeners() {
    this.eventListeners.forEach(listenerInfo => {
      const { element, event, handler, options } = listenerInfo;
      try {
        element.removeEventListener(event, handler, options);
      } catch (e) {
        console.warn('清理事件监听器失败:', e);
      }
    });
    this.eventListeners.clear();
    console.log('🧹 已清理所有事件监听器');
  }

  /**
   * 内存监控
   */
  setupMemoryMonitoring() {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      
      if (usedMB > this.performanceData.maxMemoryUsage) {
        this.performanceData.maxMemoryUsage = usedMB;
      }

      // 内存使用超过100MB时发出警告
      if (usedMB > 100) {
        this.performanceData.memoryWarnings++;
        
        if (this.performanceData.memoryWarnings % 5 === 0) {
          console.warn(`⚠️ 内存使用量较高: ${usedMB}MB`);
          this.performMemoryCleanup();
        }

        // 超过200MB时强制清理
        if (usedMB > 200) {
          console.error(`🚨 内存使用量过高: ${usedMB}MB，执行强制清理`);
          this.forceMemoryCleanup();
        }
      }
    };

    this.registerTimer(setInterval(checkMemory, 30000)); // 30秒检查一次
  }

  /**
   * 页面可见性优化
   */
  setupTabVisibilityOptimization() {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时暂停非必要的定时器
        this.pauseNonEssentialTimers();
      } else {
        // 页面显示时恢复定时器
        this.resumeNonEssentialTimers();
      }
    };

    this.registerEventListener(document, 'visibilitychange', handleVisibilityChange);
  }

  /**
   * 暂停非必要定时器
   */
  pauseNonEssentialTimers() {
    // 暂停统计更新
    if (window.svtrStats) {
      window.svtrStats.pause?.();
    }
    
    // 暂停用户行为跟踪的非关键功能
    if (window.svtrBehaviorTracker) {
      window.svtrBehaviorTracker.pauseNonEssential?.();
    }

    console.log('⏸️ 页面隐藏，已暂停非必要定时器');
  }

  /**
   * 恢复非必要定时器
   */
  resumeNonEssentialTimers() {
    // 恢复统计更新
    if (window.svtrStats) {
      window.svtrStats.resume?.();
    }
    
    // 恢复用户行为跟踪
    if (window.svtrBehaviorTracker) {
      window.svtrBehaviorTracker.resumeNonEssential?.();
    }

    console.log('▶️ 页面显示，已恢复定时器');
  }

  /**
   * 定期清理
   */
  setupPeriodicCleanup() {
    const cleanup = () => {
      this.performMemoryCleanup();
      this.cleanupDeadReferences();
      this.optimizeEventHandlers();
    };

    // 每5分钟清理一次
    this.registerTimer(setInterval(cleanup, 5 * 60 * 1000));
  }

  /**
   * 防止浏览器挂起
   */
  setupBrowserHangPrevention() {
    let lastActivity = Date.now();
    
    // 监测主线程阻塞
    const checkMainThread = () => {
      const now = Date.now();
      const timeDiff = now - lastActivity;
      
      if (timeDiff > 5000) { // 5秒无响应
        console.warn('🚨 检测到主线程可能阻塞，执行紧急清理');
        this.emergencyCleanup();
      }
      
      lastActivity = now;
    };

    this.registerTimer(setInterval(checkMainThread, 1000));
  }

  /**
   * 常规内存清理
   */
  performMemoryCleanup() {
    // 清理缓存
    if (window.cacheManager) {
      window.cacheManager.performLightCleanup?.();
    }

    // 清理DOM中的无用节点
    this.cleanupDOMNodes();

    // 强制垃圾回收（仅开发环境）
    if (window.gc && typeof window.gc === 'function') {
      window.gc();
    }
  }

  /**
   * 强制内存清理
   */
  forceMemoryCleanup() {
    // 清理所有非必要定时器
    this.clearNonEssentialTimers();
    
    // 清理大型对象
    this.clearLargeObjects();
    
    // 清理事件监听器
    this.cleanupEventListeners();
    
    console.log('🧹 已执行强制内存清理');
  }

  /**
   * 紧急清理（防止挂起）
   */
  emergencyCleanup() {
    try {
      this.clearAllTimers();
      this.removeAllEventListeners();
      this.clearLargeObjects();
      
      console.log('🚨 紧急清理完成');
    } catch (error) {
      console.error('紧急清理失败:', error);
    }
  }

  /**
   * 清理DOM节点
   */
  cleanupDOMNodes() {
    // 移除无用的临时节点
    const tempNodes = document.querySelectorAll('[data-temp="true"]');
    tempNodes.forEach(node => node.remove());
    
    // 清理空的容器
    const emptyContainers = document.querySelectorAll('.temp-container:empty');
    emptyContainers.forEach(container => container.remove());
  }

  /**
   * 清理死引用
   */
  cleanupDeadReferences() {
    // 清理全局对象中的死引用
    Object.keys(window).forEach(key => {
      if (key.startsWith('temp_') || key.startsWith('old_')) {
        delete window[key];
      }
    });
  }

  /**
   * 优化事件处理器
   */
  optimizeEventHandlers() {
    // 合并重复的事件监听器
    const eventMap = new Map();
    
    this.eventListeners.forEach(info => {
      const key = `${info.element}-${info.event}`;
      if (eventMap.has(key)) {
        // 移除重复的监听器
        this.removeEventListener(info);
      } else {
        eventMap.set(key, info);
      }
    });
  }

  /**
   * 清理非必要定时器
   */
  clearNonEssentialTimers() {
    if (window.svtrStats?.timers) {
      window.svtrStats.timers.forEach(timer => clearInterval(timer));
      window.svtrStats.timers = [];
    }
  }

  /**
   * 清理大型对象
   */
  clearLargeObjects() {
    // 清理缓存中的大型数据
    if (localStorage.getItem('large_cache_data')) {
      localStorage.removeItem('large_cache_data');
    }
    
    // 清理全局数组
    if (window.largeDataArray) {
      window.largeDataArray = null;
    }
  }

  /**
   * 清理事件监听器
   */
  cleanupEventListeners() {
    // 只保留必要的事件监听器
    const essentialEvents = ['click', 'resize', 'visibilitychange'];
    
    this.eventListeners.forEach(info => {
      if (!essentialEvents.includes(info.event)) {
        this.removeEventListener(info);
      }
    });
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      ...this.performanceData,
      activeTimers: this.timers.size,
      activeEventListeners: this.eventListeners.size,
      uptime: Date.now() - this.performanceData.startTime
    };
  }

  /**
   * 页面卸载时清理
   */
  destroy() {
    this.clearAllTimers();
    this.removeAllEventListeners();
    console.log('🛡️ 性能稳定器已销毁');
  }
}

// 全局初始化
window.svtrStabilizer = new SVTRPerformanceStabilizer();

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (window.svtrStabilizer) {
    window.svtrStabilizer.destroy();
  }
});

// 页面崩溃检测
window.addEventListener('error', (event) => {
  console.error('页面错误:', event.error);
  if (window.svtrStabilizer) {
    window.svtrStabilizer.emergencyCleanup();
  }
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise拒绝:', event.reason);
});

console.log('🛡️ SVTR性能稳定器模块加载完成');