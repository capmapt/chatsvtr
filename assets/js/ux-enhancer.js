/**
 * SVTR.AI 用户体验增强器
 * 优化移动端交互、错误处理和无障碍访问
 */

class UXEnhancer {
  constructor(options = {}) {
    this.options = {
      // 触摸交互配置
      touchDelay: 300,
      swipeThreshold: 50,
      longPressDelay: 500,
      
      // 错误处理配置
      errorDisplayTime: 5000,
      maxRetries: 3,
      retryDelay: 1000,
      
      // 性能配置
      throttleDelay: 16,
      debounceDelay: 250,
      
      // 无障碍配置
      enableFocusManagement: true,
      enableKeyboardNavigation: true,
      enableScreenReader: true,
      
      ...options
    };

    this.isMobile = this.detectMobile();
    this.isTouch = 'ontouchstart' in window;
    this.currentFocus = null;
    this.errorQueue = [];
    this.retryCount = new Map();
    
    this.init();
  }

  init() {
    // 移动端优化
    this.setupMobileOptimizations();
    
    // 触摸交互
    this.setupTouchInteractions();
    
    // 错误处理
    this.setupErrorHandling();
    
    // 无障碍访问
    this.setupAccessibility();
    
    // 性能优化
    this.setupPerformanceOptimizations();
    
    // 网络状态监听
    this.setupNetworkMonitoring();
    
    console.log('用户体验增强器已启动', {
      mobile: this.isMobile,
      touch: this.isTouch
    });
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  setupMobileOptimizations() {
    if (!this.isMobile) return;

    // 禁用双击缩放延迟
    this.eliminateTouchDelay();
    
    // 优化滚动性能
    this.optimizeScrolling();
    
    // 改善点击反馈
    this.enhanceClickFeedback();
    
    // 防止意外缩放
    this.preventAccidentalZoom();
    
    // 优化虚拟键盘
    this.handleVirtualKeyboard();
  }

  eliminateTouchDelay() {
    // 添加快速点击类
    document.documentElement.classList.add('touch-action-manipulation');
    
    // 添加全局CSS
    if (!document.getElementById('mobile-optimizations')) {
      const style = document.createElement('style');
      style.id = 'mobile-optimizations';
      style.textContent = `
        .touch-action-manipulation * {
          touch-action: manipulation;
        }
        
        .fast-click {
          cursor: pointer;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .fast-click:active {
          background-color: rgba(0,0,0,0.1);
        }
        
        .prevent-zoom {
          touch-action: pan-x pan-y;
        }
        
        .smooth-scroll {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }
      `;
      document.head.appendChild(style);
    }
  }

  optimizeScrolling() {
    // 为滚动容器添加优化类
    const scrollContainers = document.querySelectorAll('.scroll-container, .chat-messages, .sidebar');
    scrollContainers.forEach(container => {
      container.classList.add('smooth-scroll');
    });

    // 优化惯性滚动
    let isScrolling = false;
    window.addEventListener('scroll', this.throttle(() => {
      if (!isScrolling) {
        document.body.classList.add('is-scrolling');
        isScrolling = true;
      }
      
      clearTimeout(window.scrollEndTimer);
      window.scrollEndTimer = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
        isScrolling = false;
      }, 150);
    }, this.options.throttleDelay), { passive: true });
  }

  enhanceClickFeedback() {
    // 为交互元素添加视觉反馈
    const interactiveElements = document.querySelectorAll('button, a, .clickable, [role="button"]');
    
    interactiveElements.forEach(element => {
      element.classList.add('fast-click');
      
      // 添加涟漪效果
      element.addEventListener('touchstart', this.createRippleEffect.bind(this), { passive: true });
    });
  }

  createRippleEffect(event) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.touches[0].clientX - rect.left - size / 2;
    const y = event.touches[0].clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      z-index: 1000;
    `;
    
    // 添加动画样式
    if (!document.getElementById('ripple-animation')) {
      const style = document.createElement('style');
      style.id = 'ripple-animation';
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        .ripple-container {
          position: relative;
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);
    }
    
    element.style.position = element.style.position || 'relative';
    element.appendChild(ripple);
    
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  preventAccidentalZoom() {
    // 防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // 防止捏合缩放（在某些情况下）
    document.addEventListener('gesturestart', (event) => {
      event.preventDefault();
    }, { passive: false });
  }

  handleVirtualKeyboard() {
    let initialViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', this.debounce(() => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) { // 虚拟键盘打开
        document.body.classList.add('keyboard-open');
        this.adjustForKeyboard(heightDifference);
      } else { // 虚拟键盘关闭
        document.body.classList.remove('keyboard-open');
        this.resetKeyboardAdjustment();
      }
    }, this.options.debounceDelay));
  }

  adjustForKeyboard(keyboardHeight) {
    // 调整聊天输入框位置
    const chatInput = document.querySelector('.svtr-chat-input-area');
    if (chatInput) {
      chatInput.style.position = 'fixed';
      chatInput.style.bottom = '10px';
    }
    
    // 滚动到输入焦点
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      setTimeout(() => {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  resetKeyboardAdjustment() {
    const chatInput = document.querySelector('.svtr-chat-input-area');
    if (chatInput) {
      chatInput.style.position = '';
      chatInput.style.bottom = '';
    }
  }

  setupTouchInteractions() {
    if (!this.isTouch) return;

    // 长按手势
    this.setupLongPress();
    
    // 滑动手势
    this.setupSwipeGestures();
    
    // 拉拽刷新
    this.setupPullToRefresh();
  }

  setupLongPress() {
    let longPressTimer = null;
    let startX, startY;
    
    document.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      
      longPressTimer = setTimeout(() => {
        const element = document.elementFromPoint(startX, startY);
        this.handleLongPress(element, { x: startX, y: startY });
      }, this.options.longPressDelay);
    }, { passive: true });
    
    document.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);
      
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(longPressTimer);
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    }, { passive: true });
  }

  handleLongPress(element, position) {
    // 长按分享功能
    if (element.closest('.svtr-message')) {
      this.showContextMenu(element, position);
    }
    
    // 长按复制文本
    if (element.textContent && element.textContent.length > 10) {
      this.showTextActions(element, position);
    }
  }

  showContextMenu(element, position) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 8px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      min-width: 120px;
    `;
    
    const actions = [
      { text: '复制', action: () => this.copyText(element.textContent) },
      { text: '分享', action: () => this.shareText(element.textContent) },
      { text: '取消', action: () => menu.remove() }
    ];
    
    actions.forEach(({ text, action }) => {
      const item = document.createElement('div');
      item.textContent = text;
      item.style.cssText = `
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      item.addEventListener('click', () => {
        action();
        menu.remove();
      });
      menu.appendChild(item);
    });
    
    document.body.appendChild(menu);
    
    // 自动关闭
    setTimeout(() => {
      if (menu.parentNode) {
        menu.remove();
      }
    }, 5000);
  }

  setupSwipeGestures() {
    let startX, startY, startTime;
    
    document.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    }, { passive: true });
    
    document.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;
      const endTime = Date.now();
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const deltaTime = endTime - startTime;
      
      // 检查是否为有效滑动
      if (Math.abs(deltaX) > this.options.swipeThreshold && 
          Math.abs(deltaY) < Math.abs(deltaX) * 0.5 && 
          deltaTime < 500) {
        
        if (deltaX > 0) {
          this.handleSwipeRight(event.target);
        } else {
          this.handleSwipeLeft(event.target);
        }
      }
    }, { passive: true });
  }

  handleSwipeRight(element) {
    // 右滑打开侧边栏
    if (element.closest('.content') && !document.body.classList.contains('sidebar-open')) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        this.openSidebar();
      }
    }
  }

  handleSwipeLeft(element) {
    // 左滑关闭侧边栏
    if (document.body.classList.contains('sidebar-open')) {
      this.closeSidebar();
    }
  }

  openSidebar() {
    document.body.classList.add('sidebar-open');
    document.querySelector('.overlay')?.classList.add('active');
  }

  closeSidebar() {
    document.body.classList.remove('sidebar-open');
    document.querySelector('.overlay')?.classList.remove('active');
  }

  setupPullToRefresh() {
    let pullStartY = 0;
    let isPulling = false;
    const refreshThreshold = 80;
    
    document.addEventListener('touchstart', (event) => {
      if (window.scrollY === 0) {
        pullStartY = event.touches[0].clientY;
        isPulling = true;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (event) => {
      if (!isPulling) return;
      
      const pullDistance = event.touches[0].clientY - pullStartY;
      
      if (pullDistance > 10 && window.scrollY === 0) {
        this.showPullToRefreshIndicator(pullDistance);
        
        if (pullDistance > refreshThreshold) {
          this.triggerRefresh();
          isPulling = false;
        }
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      isPulling = false;
      this.hidePullToRefreshIndicator();
    }, { passive: true });
  }

  showPullToRefreshIndicator(distance) {
    let indicator = document.getElementById('pull-refresh-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'pull-refresh-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: -50px;
        left: 50%;
        transform: translateX(-50%);
        background: #007bff;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 10000;
        transition: top 0.3s ease;
      `;
      indicator.textContent = '下拉刷新';
      document.body.appendChild(indicator);
    }
    
    const progress = Math.min(distance / 80, 1);
    indicator.style.top = `${-50 + progress * 70}px`;
  }

  hidePullToRefreshIndicator() {
    const indicator = document.getElementById('pull-refresh-indicator');
    if (indicator) {
      indicator.style.top = '-50px';
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.remove();
        }
      }, 300);
    }
  }

  triggerRefresh() {
    this.showToast('正在刷新页面...', 'info');
    
    // 刷新页面内容
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  setupErrorHandling() {
    // 全局错误捕获
    this.setupGlobalErrorHandling();
    
    // 网络错误处理
    this.setupNetworkErrorHandling();
    
    // 用户友好的错误显示
    this.setupErrorDisplay();
    
    // 自动重试机制
    this.setupAutoRetry();
  }

  setupGlobalErrorHandling() {
    // JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError('JavaScript错误', event.error || event.message, 'error');
    });
    
    // Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError('异步操作失败', event.reason, 'warning');
    });
    
    // 资源加载错误
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleResourceError(event.target);
      }
    }, true);
  }

  setupNetworkErrorHandling() {
    // 拦截fetch请求
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        // 检查是否为本地开发环境的API请求
        const url = args[0];
        if (typeof url === 'string' && url.includes('/api/') && this.isLocalDevelopment()) {
          console.log('本地开发环境，跳过API错误处理:', url);
          throw error; // 直接抛出错误，不进行重试
        }
        
        this.handleNetworkError(args[0], error);
        throw error;
      }
    };
  }

  isLocalDevelopment() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname === '0.0.0.0';
  }

  handleError(title, message, type = 'error') {
    // 过滤外部资源的网络错误
    if (this.shouldIgnoreNetworkError(message)) {
      return;
    }
    
    // 只在开发环境显示错误详情
    if (!window.SVTRErrorHandler?.isProduction()) {
      console.error(`${title}:`, message);
    }
    
    // 添加到错误队列
    this.errorQueue.push({
      title,
      message: this.formatErrorMessage(message),
      type,
      timestamp: Date.now()
    });
    
    // 显示错误
    this.displayNextError();
  }

  // 检查是否应该忽略网络错误
  shouldIgnoreNetworkError(message) {
    const messageStr = String(message);
    const ignoredPatterns = [
      'feishu.cn',
      'lark.com',
      'discord.com',
      'Failed to fetch',
      'CORS policy',
      'Access-Control-Allow-Origin',
      'net::ERR_FAILED'
    ];
    
    return ignoredPatterns.some(pattern => messageStr.includes(pattern));
  }

  handleResourceError(element) {
    const resourceType = element.tagName.toLowerCase();
    const src = element.src || element.href;
    
    switch (resourceType) {
      case 'img':
        this.handleImageError(element);
        break;
      case 'script':
        this.handleScriptError(element);
        break;
      case 'link':
        this.handleStyleError(element);
        break;
      default:
        this.handleError('资源加载失败', `无法加载 ${resourceType}: ${src}`, 'warning');
    }
  }

  handleImageError(img) {
    // 尝试加载备用图片
    const fallbackSrc = img.dataset.fallback || this.generateErrorPlaceholder();
    
    if (img.src !== fallbackSrc) {
      img.src = fallbackSrc;
      img.alt = img.alt || '图片加载失败';
    }
  }

  handleScriptError(script) {
    const src = script.src;
    this.handleError('脚本加载失败', `无法加载脚本: ${src}`, 'error');
    
    // 尝试从备用CDN加载
    if (src.includes('googleapis.com')) {
      this.loadFallbackScript(src);
    }
  }

  handleStyleError(link) {
    const href = link.href;
    this.handleError('样式加载失败', `无法加载样式: ${href}`, 'warning');
  }

  handleNetworkError(url, error) {
    const retryKey = url.toString();
    const retryCount = this.retryCount.get(retryKey) || 0;
    
    if (retryCount < this.options.maxRetries) {
      // 自动重试
      this.scheduleRetry(url, retryKey, retryCount);
    } else {
      this.handleError('网络请求失败', `${url}: ${error.message}`, 'error');
    }
  }

  scheduleRetry(url, retryKey, currentCount) {
    const delay = this.options.retryDelay * Math.pow(2, currentCount); // 指数退避
    
    setTimeout(async () => {
      try {
        this.retryCount.set(retryKey, currentCount + 1);
        await fetch(url);
        this.retryCount.delete(retryKey); // 成功后清除重试计数
      } catch (error) {
        this.handleNetworkError(url, error);
      }
    }, delay);
    
    this.showToast(`网络请求失败，${delay/1000}秒后重试...`, 'info');
  }

  formatErrorMessage(message) {
    if (typeof message === 'string') {
      return message.length > 100 ? message.substring(0, 100) + '...' : message;
    }
    
    if (message instanceof Error) {
      return message.message;
    }
    
    return JSON.stringify(message).substring(0, 100);
  }

  setupErrorDisplay() {
    // 创建错误显示容器
    if (!document.getElementById('error-container')) {
      const container = document.createElement('div');
      container.id = 'error-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
  }

  displayNextError() {
    if (this.errorQueue.length === 0) return;
    
    const error = this.errorQueue.shift();
    const errorElement = this.createErrorElement(error);
    
    const container = document.getElementById('error-container');
    container.appendChild(errorElement);
    
    // 自动移除
    setTimeout(() => {
      if (errorElement.parentNode) {
        this.removeErrorElement(errorElement);
      }
    }, this.options.errorDisplayTime);
  }

  createErrorElement(error) {
    const element = document.createElement('div');
    element.className = `error-toast error-${error.type}`;
    element.style.cssText = `
      background: ${this.getErrorColor(error.type)};
      color: white;
      padding: 16px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      cursor: pointer;
    `;
    
    element.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${error.title}</div>
      <div style="font-size: 14px; opacity: 0.9;">${error.message}</div>
      <div style="font-size: 12px; opacity: 0.7; margin-top: 8px;">
        ${new Date(error.timestamp).toLocaleTimeString()}
      </div>
    `;
    
    // 点击关闭
    element.addEventListener('click', () => {
      this.removeErrorElement(element);
    });
    
    // 显示动画
    setTimeout(() => {
      element.style.transform = 'translateX(0)';
    }, 10);
    
    return element;
  }

  removeErrorElement(element) {
    element.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  getErrorColor(type) {
    const colors = {
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8',
      success: '#28a745'
    };
    return colors[type] || colors.error;
  }

  setupAutoRetry() {
    // 自动重试失败的API调用
    this.retryFailedRequests();
  }

  retryFailedRequests() {
    // 这里可以实现更复杂的重试逻辑
    // 例如：重试失败的聊天请求、图片加载等
  }

  setupAccessibility() {
    if (!this.options.enableAccessibility) return;
    
    // 焦点管理
    this.setupFocusManagement();
    
    // 键盘导航
    this.setupKeyboardNavigation();
    
    // 屏幕阅读器支持
    this.setupScreenReaderSupport();
    
    // 高对比度模式
    this.setupHighContrastMode();
  }

  setupFocusManagement() {
    // 跟踪焦点变化
    document.addEventListener('focusin', (event) => {
      this.currentFocus = event.target;
      this.announceToScreenReader(`焦点移至 ${this.getFocusDescription(event.target)}`);
    });
    
    // 焦点丢失处理
    document.addEventListener('focusout', (event) => {
      if (!event.relatedTarget) {
        // 焦点丢失，返回到合适的元素
        setTimeout(() => {
          if (!document.activeElement || document.activeElement === document.body) {
            this.restoreFocus();
          }
        }, 100);
      }
    });
  }

  getFocusDescription(element) {
    return element.getAttribute('aria-label') || 
           element.getAttribute('title') || 
           element.textContent?.trim().substring(0, 50) || 
           element.tagName.toLowerCase();
  }

  restoreFocus() {
    // 优先级：主要内容区 > 导航 > 页面顶部
    const focusTargets = [
      '#main-content',
      '.sidebar a',
      'h1, h2',
      'button, input, textarea',
      'a[href]'
    ];
    
    for (const selector of focusTargets) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        element.focus();
        break;
      }
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'Escape':
          this.handleEscapeKey(event);
          break;
        case 'Tab':
          this.handleTabNavigation(event);
          break;
        case 'Enter':
        case ' ':
          this.handleActivation(event);
          break;
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          this.handleArrowNavigation(event);
          break;
      }
    });
  }

  handleEscapeKey(event) {
    // 关闭模态框、菜单等
    const modal = document.querySelector('.modal:not([style*="display: none"])');
    if (modal) {
      modal.style.display = 'none';
      event.preventDefault();
      return;
    }
    
    // 关闭侧边栏
    if (document.body.classList.contains('sidebar-open')) {
      this.closeSidebar();
      event.preventDefault();
    }
  }

  handleTabNavigation(event) {
    // 确保Tab导航在可见元素间循环
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement);
    
    if (event.shiftKey) {
      // Shift+Tab 向前
      if (currentIndex === 0) {
        focusableElements[focusableElements.length - 1].focus();
        event.preventDefault();
      }
    } else {
      // Tab 向后
      if (currentIndex === focusableElements.length - 1) {
        focusableElements[0].focus();
        event.preventDefault();
      }
    }
  }

  getFocusableElements() {
    const selectors = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return Array.from(document.querySelectorAll(selectors.join(',')))
      .filter(element => this.isElementVisible(element));
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' && 
           style.display !== 'none' &&
           element.offsetParent !== null;
  }

  setupScreenReaderSupport() {
    // 创建屏幕阅读器通知区域
    if (!document.getElementById('sr-announcements')) {
      const announcer = document.createElement('div');
      announcer.id = 'sr-announcements';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.style.cssText = `
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      document.body.appendChild(announcer);
    }
  }

  announceToScreenReader(message, priority = 'polite') {
    const announcer = document.getElementById('sr-announcements');
    if (!announcer) return;
    
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // 清除消息避免重复宣布
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }

  setupHighContrastMode() {
    // 检测系统高对比度设置
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      document.body.classList.add('high-contrast');
    }
    
    // 监听高对比度设置变化
    window.matchMedia('(prefers-contrast: high)').addListener((event) => {
      if (event.matches) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    });
  }

  setupPerformanceOptimizations() {
    // 节流和防抖工具
    this.setupThrottleDebounce();
    
    // 延迟加载非关键功能
    this.setupLazyFeatures();
    
    // 内存清理
    this.setupMemoryCleanup();
  }

  setupThrottleDebounce() {
    // 已在类中实现throttle和debounce方法
  }

  setupLazyFeatures() {
    // 延迟加载复杂功能
    setTimeout(() => {
      this.initializeComplexFeatures();
    }, 1000);
  }

  initializeComplexFeatures() {
    // 初始化非关键的复杂功能
    if (!window.SVTRErrorHandler?.isProduction()) {
      console.log('初始化延迟加载的功能');
    }
  }

  setupMemoryCleanup() {
    // 页面卸载时清理内存
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // 定期清理
    setInterval(() => {
      this.performMemoryCleanup();
    }, 5 * 60 * 1000); // 5分钟
  }

  performMemoryCleanup() {
    // 清理过期的错误消息
    this.errorQueue = this.errorQueue.filter(error => 
      Date.now() - error.timestamp < 60000
    );
    
    // 清理过期的重试计数
    for (const [key, count] of this.retryCount.entries()) {
      if (count >= this.options.maxRetries) {
        this.retryCount.delete(key);
      }
    }
  }

  setupNetworkMonitoring() {
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.showToast('网络连接已恢复', 'success');
      this.handleNetworkReconnect();
    });
    
    window.addEventListener('offline', () => {
      this.showToast('网络连接已断开，部分功能可能不可用', 'warning');
      this.handleNetworkDisconnect();
    });
    
    // 检查网络质量
    this.monitorNetworkQuality();
  }

  handleNetworkReconnect() {
    // 重新尝试失败的请求
    this.retryCount.clear();
    
    // 重新初始化需要网络的功能
    this.reinitializeNetworkFeatures();
  }

  handleNetworkDisconnect() {
    // 启用离线模式
    document.body.classList.add('offline-mode');
    
    // 显示离线提示
    this.showOfflineMessage();
  }

  showOfflineMessage() {
    if (document.getElementById('offline-message')) return;
    
    const message = document.createElement('div');
    message.id = 'offline-message';
    message.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ffc107;
      color: #212529;
      padding: 12px;
      text-align: center;
      z-index: 10001;
      font-weight: bold;
    `;
    message.textContent = '当前处于离线状态，部分功能不可用';
    
    document.body.appendChild(message);
  }

  monitorNetworkQuality() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const updateNetworkInfo = () => {
        const effectiveType = connection.effectiveType;
        document.body.setAttribute('data-network-type', effectiveType);
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          this.enableLowBandwidthMode();
        } else {
          this.disableLowBandwidthMode();
        }
      };
      
      connection.addEventListener('change', updateNetworkInfo);
      updateNetworkInfo();
    }
  }

  enableLowBandwidthMode() {
    document.body.classList.add('low-bandwidth');
    this.showToast('检测到慢速网络，已启用省流量模式', 'info');
  }

  disableLowBandwidthMode() {
    document.body.classList.remove('low-bandwidth');
  }

  reinitializeNetworkFeatures() {
    // 重新初始化依赖网络的功能
    if (window.svtrChat) {
      window.svtrChat.reconnect?.();
    }
  }

  // 工具方法
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: ${this.getErrorColor(type)};
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      z-index: 10000;
      transition: transform 0.3s ease;
      max-width: 90%;
      text-align: center;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // 辅助方法
  copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('已复制到剪贴板', 'success');
      });
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showToast('已复制到剪贴板', 'success');
    }
  }

  shareText(text) {
    if (navigator.share) {
      navigator.share({
        title: 'SVTR.AI 分享',
        text: text,
        url: window.location.href
      });
    } else {
      this.copyText(text);
    }
  }

  generateErrorPlaceholder() {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-size="14">加载失败</text>
      </svg>
    `);
  }

  loadFallbackScript(originalSrc) {
    // 实现备用脚本加载逻辑
    console.log('尝试加载备用脚本:', originalSrc);
  }

  cleanup() {
    // 清理事件监听器和定时器
    this.errorQueue = [];
    this.retryCount.clear();
  }

  // 公共API
  getStats() {
    return {
      isMobile: this.isMobile,
      isTouch: this.isTouch,
      errorCount: this.errorQueue.length,
      retryCount: this.retryCount.size,
      currentFocus: this.currentFocus?.tagName
    };
  }
}

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  window.uxEnhancer = new UXEnhancer();
  console.log('用户体验增强器已启动:', window.uxEnhancer.getStats());
});

// 导出
window.UXEnhancer = UXEnhancer;