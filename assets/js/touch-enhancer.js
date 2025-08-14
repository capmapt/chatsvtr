/**
 * 移动端触摸体验增强器
 * 提供高质量的移动端交互体验
 */

class TouchEnhancer {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isTouch = 'ontouchstart' in window;
    this.gestureStartTime = 0;
    this.gestureStartX = 0;
    this.gestureStartY = 0;
    this.lastTap = 0;

    if (this.isMobile || this.isTouch) {
      this.init();
    }
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
           || window.innerWidth <= 768;
  }

  init() {
    this.setupTouchFeedback();
    this.setupSwipeGestures();
    this.setupDoubleTapPrevention();
    this.setupScrollOptimization();
    this.setupVibrationFeedback();
    this.setupAccessibility();

    console.log('[TouchEnhancer] 移动端触摸优化已启用');
  }

  // 设置触摸反馈
  setupTouchFeedback() {
    const touchElements = document.querySelectorAll(
      '.business-tag, .nav-list a, .lang-toggle button, .menu-toggle, .svtr-action-btn'
    );

    touchElements.forEach(element => {
      // 触摸开始
      element.addEventListener('touchstart', (e) => {
        element.classList.add('touch-active');
        this.createRippleEffect(e, element);
        this.hapticFeedback('light');
      }, { passive: true });

      // 触摸结束
      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.classList.remove('touch-active');
        }, 150);
      }, { passive: true });

      // 触摸取消
      element.addEventListener('touchcancel', () => {
        element.classList.remove('touch-active');
      }, { passive: true });
    });
  }

  // 创建波纹效果
  createRippleEffect(event, element) {
    // 如果用户偏好减少动画，跳过波纹效果
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (event.touches?.[0]?.clientX || event.clientX) - rect.left - size / 2;
    const y = (event.touches?.[0]?.clientY || event.clientY) - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(250, 140, 50, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 0;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // 清理波纹元素
    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  // 设置滑动手势
  setupSwipeGestures() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');

    if (!sidebar || !overlay) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let isSwipe = false;

    // 侧边栏滑动关闭
    sidebar.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isSwipe = false;
    }, { passive: true });

    sidebar.addEventListener('touchmove', (e) => {
      if (!isSwipe) {
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;

        // 判断是否为水平滑动
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 20) {
          isSwipe = true;

          // 向左滑动关闭侧边栏
          if (deltaX < -50 && sidebar.classList.contains('open')) {
            this.closeSidebar();
            this.hapticFeedback('medium');
          }
        }
      }
    }, { passive: true });

    // 主内容区域右滑打开侧边栏
    const content = document.querySelector('.content');
    if (content) {
      content.addEventListener('touchstart', (e) => {
        // 只在屏幕左边缘检测滑动
        if (e.touches[0].clientX < 20) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          isSwipe = false;
        }
      }, { passive: true });

      content.addEventListener('touchmove', (e) => {
        if (startX < 20 && !isSwipe) {
          const deltaX = e.touches[0].clientX - startX;
          const deltaY = e.touches[0].clientY - startY;

          // 右滑打开侧边栏
          if (deltaX > 50 && Math.abs(deltaY) < 100 && !sidebar.classList.contains('open')) {
            this.openSidebar();
            this.hapticFeedback('medium');
            isSwipe = true;
          }
        }
      }, { passive: true });
    }
  }

  // 防止双击缩放
  setupDoubleTapPrevention() {
    const preventElements = document.querySelectorAll(
      '.business-tag, .nav-list a, .menu-toggle, .lang-toggle button'
    );

    preventElements.forEach(element => {
      element.addEventListener('touchend', (e) => {
        const now = Date.now();
        const timeSince = now - this.lastTap;

        if (timeSince < 300 && timeSince > 0) {
          e.preventDefault();
        }

        this.lastTap = now;
      });
    });
  }

  // 滚动优化
  setupScrollOptimization() {
    // 优化iOS滚动
    const scrollElements = document.querySelectorAll('.sidebar, .svtr-chat-messages');

    scrollElements.forEach(element => {
      element.style.webkitOverflowScrolling = 'touch';
      element.style.overscrollBehavior = 'contain';
    });

    // 防止背景滚动
    const overlay = document.querySelector('.overlay');
    if (overlay) {
      overlay.addEventListener('touchmove', (e) => {
        if (overlay.classList.contains('active')) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }

  // 触觉反馈
  hapticFeedback(intensity = 'light') {
    if (!navigator.vibrate) {
      return;
    }

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 50, 50]
    };

    const pattern = patterns[intensity] || patterns.light;
    navigator.vibrate(pattern);
  }

  // 设置无障碍访问
  setupAccessibility() {
    // 增加触摸目标的可访问性
    const interactiveElements = document.querySelectorAll(
      '.business-tag, .nav-list a, .menu-toggle, .lang-toggle button'
    );

    interactiveElements.forEach(element => {
      // 确保有足够的触摸目标尺寸
      const rect = element.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        element.style.minWidth = '44px';
        element.style.minHeight = '44px';
        element.style.display = 'flex';
        element.style.alignItems = 'center';
        element.style.justifyContent = 'center';
      }

      // 添加触摸反馈的ARIA属性
      if (!element.getAttribute('role')) {
        element.setAttribute('role', 'button');
      }

      if (!element.getAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    });
  }

  // 侧边栏控制方法
  openSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const content = document.querySelector('.content');

    if (sidebar && overlay && content) {
      sidebar.classList.add('open');
      overlay.classList.add('active');
      content.classList.add('shifted');
    }
  }

  closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const content = document.querySelector('.content');

    if (sidebar && overlay && content) {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      content.classList.remove('shifted');
    }
  }

  // 设备方向变化处理
  handleOrientationChange() {
    // 延迟处理，等待视窗大小更新
    setTimeout(() => {
      const isMobile = this.detectMobile();

      if (isMobile !== this.isMobile) {
        this.isMobile = isMobile;

        if (this.isMobile) {
          document.body.classList.add('mobile-optimized');
        } else {
          document.body.classList.remove('mobile-optimized');
        }
      }

      // 横屏时自动关闭侧边栏
      if (window.innerHeight < window.innerWidth && this.isMobile) {
        this.closeSidebar();
      }
    }, 100);
  }

  // 网络状态变化处理
  handleNetworkChange() {
    const isOnline = navigator.onLine;

    if (!isOnline) {
      this.hapticFeedback('error');
      this.showNetworkToast('网络连接已断开');
    } else {
      this.hapticFeedback('success');
      this.showNetworkToast('网络连接已恢复');
    }
  }

  // 显示网络状态提示
  showNetworkToast(message) {
    const toast = document.createElement('div');
    toast.className = 'network-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 14px;
      z-index: 10000;
      animation: toast-slide-in 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// 添加必要的CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes toast-slide-in {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .touch-active {
    transform: scale(0.98) !important;
    opacity: 0.8 !important;
  }
  
  .mobile-optimized .business-tag,
  .mobile-optimized .nav-list a {
    min-height: 44px;
    touch-action: manipulation;
  }
`;
document.head.appendChild(style);

// 初始化触摸增强器
let touchEnhancer;

function initTouchEnhancer() {
  touchEnhancer = new TouchEnhancer();

  // 监听设备方向变化
  window.addEventListener('orientationchange', () => {
    touchEnhancer.handleOrientationChange();
  });

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    touchEnhancer.handleOrientationChange();
  });

  // 监听网络状态变化
  window.addEventListener('online', () => {
    touchEnhancer.handleNetworkChange();
  });

  window.addEventListener('offline', () => {
    touchEnhancer.handleNetworkChange();
  });
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTouchEnhancer);
} else {
  initTouchEnhancer();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchEnhancer;
} else if (typeof window !== 'undefined') {
  window.TouchEnhancer = TouchEnhancer;
}
