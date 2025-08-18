/**
 * 移动端侧边栏闪退修复器
 * 解决用户体验问题，提升网站可信度
 */

class MobileSidebarFix {
  constructor() {
    this.isProcessing = false;
    this.errorCount = 0;
    this.maxErrors = 3;
    this.fallbackMode = false;
    this.touchSupported = 'ontouchstart' in window;
    this.isMobile = this.detectMobile();
    
    // 状态管理
    this.state = {
      isOpen: false,
      isAnimating: false,
      lastOperation: null
    };

    this.init();
  }

  detectMobile() {
    const userAgent = navigator.userAgent;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return mobileRegex.test(userAgent) || window.innerWidth <= 768;
  }

  init() {
    try {
      if (!this.isMobile) {
        console.log('[MobileSidebarFix] 非移动端，跳过初始化');
        return;
      }

      this.cacheDOMElements();
      this.setupErrorHandling();
      this.setupSafeEventListeners();
      this.setupPerformanceOptimizations();
      this.setupFallbackMode();

      console.log('[MobileSidebarFix] 移动端侧边栏修复器已启用');
    } catch (error) {
      this.handleError('初始化失败', error);
    }
  }

  cacheDOMElements() {
    this.elements = {
      sidebar: document.querySelector('.sidebar'),
      overlay: document.querySelector('.overlay'),
      content: document.querySelector('.content'),
      toggle: document.querySelector('.menu-toggle')
    };

    // 验证关键元素存在
    const requiredElements = ['sidebar', 'overlay', 'toggle'];
    for (const key of requiredElements) {
      if (!this.elements[key]) {
        throw new Error(`关键元素缺失: ${key}`);
      }
    }

    // 添加状态属性
    this.elements.sidebar.setAttribute('data-mobile-fixed', 'true');
  }

  setupErrorHandling() {
    // 全局错误捕获
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('sidebar')) {
        this.handleError('JavaScript错误', event.error);
      }
    });

    // Promise 错误捕获
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.toString().includes('sidebar')) {
        this.handleError('Promise错误', event.reason);
        event.preventDefault();
      }
    });
  }

  setupSafeEventListeners() {
    try {
      // 使用防抖的事件处理器
      const safeToggle = this.debounce(() => {
        this.safeToggleSidebar();
      }, 150);

      const safeClose = this.debounce(() => {
        this.safeCloseSidebar();
      }, 100);

      // 移除可能存在的其他监听器
      this.removeConflictingListeners();

      // 添加新的安全监听器
      this.elements.toggle.addEventListener('click', safeToggle, { passive: false });
      this.elements.overlay.addEventListener('click', safeClose, { passive: false });

      // 移动端特殊处理
      if (this.touchSupported) {
        this.setupTouchHandlers();
      }

      // ESC键处理
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.state.isOpen) {
          this.safeCloseSidebar();
        }
      });

    } catch (error) {
      this.handleError('事件监听器设置失败', error);
    }
  }

  setupTouchHandlers() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    // 侧边栏滑动关闭
    this.elements.sidebar.addEventListener('touchstart', (e) => {
      if (!this.state.isOpen) return;
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    this.elements.sidebar.addEventListener('touchend', (e) => {
      if (!this.state.isOpen) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const deltaTime = touchEndTime - touchStartTime;

      // 检测向左滑动手势
      if (deltaX < -50 && Math.abs(deltaY) < 100 && deltaTime < 500) {
        this.safeCloseSidebar();
      }
    }, { passive: true });
  }

  setupPerformanceOptimizations() {
    // 禁用动画对于低端设备
    if (this.isLowEndDevice()) {
      this.elements.sidebar.style.transition = 'none';
      this.elements.overlay.style.transition = 'none';
      this.fallbackMode = true;
      console.log('[MobileSidebarFix] 低端设备检测，启用简化模式');
    }

    // 防止内存泄漏
    this.setupMemoryManagement();
  }

  isLowEndDevice() {
    // 检测低端设备的启发式方法
    const memory = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const connection = navigator.connection;

    if (memory && memory < 2) return true;
    if (cores && cores < 2) return true;
    if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) return true;
    
    return false;
  }

  setupMemoryManagement() {
    // 定期清理
    setInterval(() => {
      if (!this.state.isOpen && !this.state.isAnimating) {
        // 清理可能的内存泄漏
        this.cleanupMemory();
      }
    }, 30000); // 每30秒清理一次
  }

  setupFallbackMode() {
    // 如果出现错误过多，启用简化模式
    if (this.errorCount >= this.maxErrors) {
      this.enableFallbackMode();
    }
  }

  // 安全的侧边栏操作方法
  safeToggleSidebar() {
    if (this.isProcessing || this.state.isAnimating) {
      console.log('[MobileSidebarFix] 操作正在进行中，跳过');
      return;
    }

    try {
      this.isProcessing = true;
      
      if (this.state.isOpen) {
        this.safeCloseSidebar();
      } else {
        this.safeOpenSidebar();
      }
    } catch (error) {
      this.handleError('切换侧边栏失败', error);
    } finally {
      this.isProcessing = false;
    }
  }

  safeOpenSidebar() {
    if (this.state.isOpen || this.state.isAnimating) return;

    try {
      this.state.isAnimating = true;
      this.state.lastOperation = 'open';

      // 原子操作：同时设置所有状态
      this.elements.sidebar.classList.add('open');
      this.elements.overlay.classList.add('active');
      if (this.elements.content) {
        this.elements.content.classList.add('shifted');
      }

      this.state.isOpen = true;

      // 动画完成后清理状态
      setTimeout(() => {
        this.state.isAnimating = false;
      }, 300);

      console.log('[MobileSidebarFix] 侧边栏已打开');
    } catch (error) {
      this.handleError('打开侧边栏失败', error);
      this.state.isAnimating = false;
    }
  }

  safeCloseSidebar() {
    if (!this.state.isOpen || this.state.isAnimating) return;

    try {
      this.state.isAnimating = true;
      this.state.lastOperation = 'close';

      // 原子操作：同时移除所有状态
      this.elements.sidebar.classList.remove('open');
      this.elements.overlay.classList.remove('active');
      if (this.elements.content) {
        this.elements.content.classList.remove('shifted');
      }

      this.state.isOpen = false;

      // 动画完成后清理状态
      setTimeout(() => {
        this.state.isAnimating = false;
      }, 300);

      console.log('[MobileSidebarFix] 侧边栏已关闭');
    } catch (error) {
      this.handleError('关闭侧边栏失败', error);
      this.state.isAnimating = false;
    }
  }

  removeConflictingListeners() {
    // 尝试移除可能存在的冲突监听器
    try {
      const newToggle = this.elements.toggle.cloneNode(true);
      this.elements.toggle.parentNode.replaceChild(newToggle, this.elements.toggle);
      this.elements.toggle = newToggle;

      const newOverlay = this.elements.overlay.cloneNode(true);
      this.elements.overlay.parentNode.replaceChild(newOverlay, this.elements.overlay);
      this.elements.overlay = newOverlay;
    } catch (error) {
      console.warn('[MobileSidebarFix] 无法移除冲突监听器:', error);
    }
  }

  enableFallbackMode() {
    console.warn('[MobileSidebarFix] 启用降级模式');
    this.fallbackMode = true;

    // 简化操作，移除所有动画
    this.elements.sidebar.style.transition = 'none';
    this.elements.overlay.style.transition = 'none';
    if (this.elements.content) {
      this.elements.content.style.transition = 'none';
    }

    // 显示用户友好的消息
    this.showUserMessage('为了更好的体验，侧边栏已切换到简化模式');
  }

  showUserMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'mobile-fix-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  handleError(context, error) {
    this.errorCount++;
    console.error(`[MobileSidebarFix] ${context}:`, error);

    // 重置状态
    this.isProcessing = false;
    this.state.isAnimating = false;

    // 如果错误过多，启用降级模式
    if (this.errorCount >= this.maxErrors && !this.fallbackMode) {
      this.enableFallbackMode();
    }

    // 发送错误报告（可选）
    this.reportError(context, error);
  }

  reportError(context, error) {
    // 可以发送到分析服务，但不会影响用户体验
    try {
      if (window.gtag) {
        window.gtag('event', 'mobile_sidebar_error', {
          error_context: context,
          error_message: error.message || 'Unknown error',
          user_agent: navigator.userAgent
        });
      }
    } catch (e) {
      // 静默处理报告错误
    }
  }

  cleanupMemory() {
    // 清理可能的内存泄漏
    try {
      if (window.svtrApp && typeof window.svtrApp.cleanup === 'function') {
        window.svtrApp.cleanup();
      }
    } catch (error) {
      console.warn('[MobileSidebarFix] 内存清理警告:', error);
    }
  }

  // 工具方法
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 状态检查方法
  getState() {
    return { ...this.state };
  }

  isHealthy() {
    return this.errorCount < this.maxErrors && this.elements.sidebar && this.elements.overlay;
  }
}

// 初始化修复器
function initializeMobileSidebarFix() {
  try {
    if (window.mobileSidebarFix) {
      console.log('[MobileSidebarFix] 已经初始化，跳过');
      return;
    }

    window.mobileSidebarFix = new MobileSidebarFix();
    
    // 健康检查
    setInterval(() => {
      if (window.mobileSidebarFix && !window.mobileSidebarFix.isHealthy()) {
        console.warn('[MobileSidebarFix] 健康检查失败，准备重新初始化');
        // 可以选择重新初始化
      }
    }, 60000); // 每分钟检查一次

  } catch (error) {
    console.error('[MobileSidebarFix] 初始化失败:', error);
  }
}

// 智能初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMobileSidebarFix);
} else {
  initializeMobileSidebarFix();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileSidebarFix;
}