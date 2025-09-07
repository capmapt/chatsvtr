/**
 * SVTR用户行为跟踪系统
 * 监测页面访问时长、用户操作行为、会话数据
 * 为管理中心提供详细的用户行为分析
 */

class SVTRUserBehaviorTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = this.getCurrentUserId();
    this.pageStartTime = Date.now();
    this.isActive = true;
    
    // 行为数据缓存
    this.behaviorCache = [];
    this.scrollData = { maxDepth: 0, milestones: [] };
    this.clickHeatmap = new Map();
    
    // 配置选项
    this.config = {
      batchSize: 10,
      flushInterval: 30000, // 30秒
      trackScrollDepth: true,
      trackClickHeatmap: true,
      trackFormInteractions: true,
      trackPagePerformance: true
    };

    this.init();
  }

  /**
   * 初始化跟踪系统
   */
  init() {
    this.setupPageTracking();
    this.setupUserInteractionTracking();
    this.setupPerformanceTracking();
    this.setupBehaviorDataFlush();
    this.setupVisibilityTracking();
    
    console.log('🔍 SVTR用户行为跟踪系统已启动', {
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 生成唯一会话ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * 获取当前用户ID
   */
  getCurrentUserId() {
    try {
      const userStr = localStorage.getItem('svtr_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 'anonymous';
      }
    } catch (error) {
      console.warn('获取用户ID失败:', error);
    }
    return 'anonymous_' + Date.now();
  }

  /**
   * 设置页面跟踪
   */
  setupPageTracking() {
    // 页面加载完成事件
    window.addEventListener('load', () => {
      this.trackPageLoad();
    });

    // 页面卸载事件 - 记录停留时间
    window.addEventListener('beforeunload', () => {
      this.trackPageUnload();
    });

    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackPageHide();
      } else {
        this.trackPageShow();
      }
    });

    // 记录页面视图
    this.trackPageView();
  }

  /**
   * 设置用户交互跟踪
   */
  setupUserInteractionTracking() {
    // 点击事件跟踪
    if (this.config.trackClickHeatmap) {
      document.addEventListener('click', (e) => {
        this.trackClick(e);
      }, { passive: true });
    }

    // 滚动深度跟踪
    if (this.config.trackScrollDepth) {
      let scrollTimer = null;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          this.trackScrollDepth();
        }, 100);
      }, { passive: true });
    }

    // 表单交互跟踪
    if (this.config.trackFormInteractions) {
      document.addEventListener('submit', (e) => {
        this.trackFormSubmission(e);
      });

      document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea, select')) {
          this.trackFormFieldFocus(e);
        }
      });
    }

    // 链接点击跟踪
    document.addEventListener('click', (e) => {
      if (e.target.matches('a, a *')) {
        const link = e.target.closest('a');
        if (link) {
          this.trackLinkClick(link);
        }
      }
    });
  }

  /**
   * 设置性能跟踪
   */
  setupPerformanceTracking() {
    if (!this.config.trackPagePerformance) return;

    // 页面性能指标
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPagePerformance();
      }, 1000);
    });
  }

  /**
   * 设置数据批量发送
   */
  setupBehaviorDataFlush() {
    // 定时发送数据
    setInterval(() => {
      this.flushBehaviorData();
    }, this.config.flushInterval);

    // 页面卸载时发送剩余数据
    window.addEventListener('beforeunload', () => {
      this.flushBehaviorData(true);
    });
  }

  /**
   * 设置页面可见性跟踪
   */
  setupVisibilityTracking() {
    let activeTime = 0;
    let lastActiveTime = Date.now();

    const updateActiveTime = () => {
      if (this.isActive) {
        const now = Date.now();
        activeTime += now - lastActiveTime;
        lastActiveTime = now;
      }
    };

    // 鼠标移动表示用户活跃
    let mouseTimer = null;
    document.addEventListener('mousemove', () => {
      this.isActive = true;
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(() => {
        updateActiveTime();
        this.isActive = false;
      }, 5000); // 5秒无操作视为不活跃
    }, { passive: true });

    // 定期更新活跃时间
    setInterval(updateActiveTime, 1000);

    // 保存活跃时间到会话数据
    this.getActiveTime = () => activeTime;
  }

  /**
   * 跟踪页面视图
   */
  trackPageView() {
    const pageData = {
      type: 'page_view',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer || 'direct'
      },
      device: {
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.addToBehaviorCache(pageData);
  }

  /**
   * 跟踪页面加载
   */
  trackPageLoad() {
    const loadData = {
      type: 'page_load',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname
      },
      timing: {
        loadComplete: Date.now() - this.pageStartTime
      }
    };

    this.addToBehaviorCache(loadData);
  }

  /**
   * 跟踪页面卸载
   */
  trackPageUnload() {
    const duration = Date.now() - this.pageStartTime;
    const activeTime = this.getActiveTime();
    
    const unloadData = {
      type: 'page_unload',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname
      },
      timing: {
        totalDuration: duration,
        activeDuration: activeTime,
        engagementRate: (activeTime / duration * 100).toFixed(2)
      },
      scrollData: this.scrollData,
      clickCount: Array.from(this.clickHeatmap.values()).reduce((sum, count) => sum + count, 0)
    };

    this.addToBehaviorCache(unloadData);
    this.flushBehaviorData(true); // 强制发送数据
  }

  /**
   * 跟踪点击事件
   */
  trackClick(event) {
    const target = event.target;
    const rect = target.getBoundingClientRect();
    const clickPosition = {
      x: Math.round(event.clientX),
      y: Math.round(event.clientY),
      relativeX: Math.round(event.clientX - rect.left),
      relativeY: Math.round(event.clientY - rect.top)
    };

    // 生成热力图数据
    const heatmapKey = `${Math.floor(clickPosition.x / 50)}_${Math.floor(clickPosition.y / 50)}`;
    this.clickHeatmap.set(heatmapKey, (this.clickHeatmap.get(heatmapKey) || 0) + 1);

    const clickData = {
      type: 'click',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      target: {
        tagName: target.tagName.toLowerCase(),
        id: target.id || null,
        className: target.className || null,
        text: target.textContent?.trim().substring(0, 100) || null,
        href: target.href || null
      },
      position: clickPosition,
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(clickData);
  }

  /**
   * 跟踪滚动深度
   */
  trackScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    const scrollPercent = Math.round((scrollTop + windowHeight) / documentHeight * 100);
    
    if (scrollPercent > this.scrollData.maxDepth) {
      this.scrollData.maxDepth = scrollPercent;
      
      // 记录重要的滚动里程碑
      const milestones = [25, 50, 75, 90, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !this.scrollData.milestones.includes(milestone)) {
          this.scrollData.milestones.push(milestone);
          
          const scrollMilestoneData = {
            type: 'scroll_milestone',
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: Date.now(),
            milestone: milestone,
            page: {
              url: window.location.href,
              path: window.location.pathname
            }
          };
          
          this.addToBehaviorCache(scrollMilestoneData);
        }
      }
    }
  }

  /**
   * 跟踪表单提交
   */
  trackFormSubmission(event) {
    const form = event.target;
    const formData = {
      type: 'form_submit',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      form: {
        id: form.id || null,
        className: form.className || null,
        action: form.action || null,
        method: form.method || 'get',
        fieldCount: form.querySelectorAll('input, textarea, select').length
      },
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(formData);
  }

  /**
   * 跟踪表单字段聚焦
   */
  trackFormFieldFocus(event) {
    const field = event.target;
    const fieldData = {
      type: 'form_field_focus',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      field: {
        tagName: field.tagName.toLowerCase(),
        type: field.type || null,
        id: field.id || null,
        name: field.name || null,
        placeholder: field.placeholder || null
      },
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(fieldData);
  }

  /**
   * 跟踪链接点击
   */
  trackLinkClick(link) {
    const linkData = {
      type: 'link_click',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      link: {
        href: link.href,
        text: link.textContent?.trim().substring(0, 100) || null,
        target: link.target || null,
        isExternal: link.hostname !== window.location.hostname
      },
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(linkData);
  }

  /**
   * 跟踪页面性能
   */
  trackPagePerformance() {
    if (!window.performance || !window.performance.timing) {
      return;
    }

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    const performanceData = {
      type: 'page_performance',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      performance: {
        navigationStart: timing.navigationStart,
        domainLookup: timing.domainLookupEnd - timing.domainLookupStart,
        connect: timing.connectEnd - timing.connectStart,
        request: timing.responseEnd - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        navigationType: navigation.type,
        redirectCount: navigation.redirectCount
      },
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(performanceData);
  }

  /**
   * 跟踪页面隐藏
   */
  trackPageHide() {
    const hideData = {
      type: 'page_hide',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(hideData);
  }

  /**
   * 跟踪页面显示
   */
  trackPageShow() {
    const showData = {
      type: 'page_show',
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      page: {
        url: window.location.href,
        path: window.location.pathname
      }
    };

    this.addToBehaviorCache(showData);
  }

  /**
   * 添加数据到缓存
   */
  addToBehaviorCache(data) {
    this.behaviorCache.push(data);
    
    // 缓存达到批量大小时自动发送
    if (this.behaviorCache.length >= this.config.batchSize) {
      this.flushBehaviorData();
    }
  }

  /**
   * 发送行为数据到服务器
   */
  async flushBehaviorData(force = false) {
    if (this.behaviorCache.length === 0) {
      return;
    }

    const dataToSend = [...this.behaviorCache];
    this.behaviorCache = []; // 清空缓存

    try {
      // 如果是强制发送（页面卸载），使用sendBeacon
      if (force && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(dataToSend)], {
          type: 'application/json'
        });
        navigator.sendBeacon('/api/user-behavior', blob);
        console.log('📊 用户行为数据已通过Beacon发送:', dataToSend.length, '条');
        return;
      }

      // 正常的fetch请求
      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        console.log('📊 用户行为数据发送成功:', dataToSend.length, '条');
      } else {
        throw new Error('服务器响应错误');
      }

    } catch (error) {
      console.warn('📊 用户行为数据发送失败:', error);
      
      // 发送失败时，将数据存储到本地缓存
      this.saveToLocalStorage(dataToSend);
    }
  }

  /**
   * 保存数据到本地存储
   */
  saveToLocalStorage(data) {
    try {
      const existingData = JSON.parse(localStorage.getItem('svtr_behavior_cache') || '[]');
      const combinedData = existingData.concat(data);
      
      // 限制本地缓存大小，只保留最新1000条
      const limitedData = combinedData.slice(-1000);
      
      localStorage.setItem('svtr_behavior_cache', JSON.stringify(limitedData));
      console.log('📊 行为数据已保存到本地缓存');
    } catch (error) {
      console.warn('本地缓存保存失败:', error);
    }
  }

  /**
   * 发送本地缓存的数据
   */
  async sendCachedData() {
    try {
      const cachedData = JSON.parse(localStorage.getItem('svtr_behavior_cache') || '[]');
      if (cachedData.length === 0) {
        return;
      }

      const response = await fetch('/api/user-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cachedData)
      });

      if (response.ok) {
        localStorage.removeItem('svtr_behavior_cache');
        console.log('📊 本地缓存数据发送成功:', cachedData.length, '条');
      }

    } catch (error) {
      console.warn('本地缓存数据发送失败:', error);
    }
  }

  /**
   * 获取当前会话统计
   */
  getSessionStats() {
    const duration = Date.now() - this.pageStartTime;
    const activeTime = this.getActiveTime();
    
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      duration: duration,
      activeTime: activeTime,
      engagementRate: (activeTime / duration * 100).toFixed(2),
      pageViews: this.behaviorCache.filter(item => item.type === 'page_view').length,
      clicks: Array.from(this.clickHeatmap.values()).reduce((sum, count) => sum + count, 0),
      maxScrollDepth: this.scrollData.maxDepth,
      scrollMilestones: this.scrollData.milestones.length
    };
  }

  /**
   * 获取点击热力图数据
   */
  getClickHeatmapData() {
    const heatmapData = [];
    for (const [key, count] of this.clickHeatmap) {
      const [x, y] = key.split('_').map(Number);
      heatmapData.push({
        x: x * 50 + 25, // 恢复到实际坐标
        y: y * 50 + 25,
        count: count
      });
    }
    return heatmapData;
  }
}

// 创建全局实例
let svtrBehaviorTracker = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  svtrBehaviorTracker = new SVTRUserBehaviorTracker();
  
  // 将实例暴露给全局作用域，便于调试和其他模块使用
  window.svtrBehaviorTracker = svtrBehaviorTracker;
  
  // 页面加载完成后尝试发送缓存数据
  window.addEventListener('load', () => {
    setTimeout(() => {
      svtrBehaviorTracker.sendCachedData();
    }, 2000);
  });
});

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SVTRUserBehaviorTracker;
}