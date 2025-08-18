/**
 * 智能侧边栏UX管理器
 * 解决自动收起造成的用户信任问题，提供更好的交互体验
 */

class SmartSidebarUX {
  constructor() {
    this.config = {
      // UX优化后的时间配置
      HINT_DELAY: 3000,           // 3秒后显示提示
      AUTO_CLOSE_DELAY: 8000,     // 8秒后自动收起（给用户更多时间）
      ANIMATION_DURATION: 300,    // 动画时长
      TOUCH_HINT_DURATION: 2000   // 触摸提示显示时长
    };

    this.state = {
      isHintShown: false,
      userInteracted: false,
      autoCloseTimer: null,
      hintTimer: null,
      userPreference: localStorage.getItem('sidebarAutoClose') // 记住用户偏好
    };

    this.isMobile = window.innerWidth <= 768;
    this.init();
  }

  init() {
    if (!this.isMobile) {
      console.log('[SmartSidebarUX] 非移动端，跳过初始化');
      return;
    }

    this.cacheDOMElements();
    this.createUXElements();
    this.setupEventListeners();
    this.initializeMobileSidebar();
    
    console.log('[SmartSidebarUX] 智能侧边栏UX已启用');
  }

  cacheDOMElements() {
    this.elements = {
      sidebar: document.querySelector('.sidebar'),
      overlay: document.querySelector('.overlay'),
      content: document.querySelector('.content'),
      toggle: document.querySelector('.menu-toggle')
    };
  }

  createUXElements() {
    // 创建收起提示元素
    this.createCloseHint();
    // 创建用户控制面板
    this.createControlPanel();
    // 创建触摸提示
    this.createTouchHint();
  }

  createCloseHint() {
    const hint = document.createElement('div');
    hint.className = 'sidebar-close-hint';
    hint.innerHTML = `
      <div class="hint-content">
        <div class="hint-icon">👆</div>
        <div class="hint-text">
          <span data-i18n="sidebar_auto_close_hint">侧边栏将在几秒后自动收起，方便您查看内容</span>
        </div>
        <div class="hint-actions">
          <button class="hint-btn keep-open" data-i18n="keep_open">保持打开</button>
          <button class="hint-btn close-now" data-i18n="close_now">立即收起</button>
        </div>
      </div>
      <div class="hint-progress"></div>
    `;
    
    // 添加样式
    hint.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      left: 10px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(250, 140, 50, 0.3);
      z-index: 1000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease-out;
      pointer-events: none;
    `;

    this.hintElement = hint;
    this.elements.sidebar.appendChild(hint);
  }

  createControlPanel() {
    const panel = document.createElement('div');
    panel.className = 'sidebar-control-panel';
    panel.innerHTML = `
      <div class="control-item">
        <input type="checkbox" id="autoCloseToggle" ${this.state.userPreference === 'disabled' ? '' : 'checked'}>
        <label for="autoCloseToggle" data-i18n="auto_close_setting">智能收起</label>
      </div>
    `;
    
    panel.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 10px;
      right: 10px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      border-radius: 8px;
      padding: 10px;
      font-size: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;

    this.controlPanel = panel;
    this.elements.sidebar.appendChild(panel);
  }

  createTouchHint() {
    const hint = document.createElement('div');
    hint.className = 'touch-hint';
    hint.innerHTML = `
      <div class="touch-hint-content">
        <div class="swipe-icon">👈</div>
        <span data-i18n="swipe_to_close">向左滑动收起</span>
      </div>
    `;
    
    hint.style.cssText = `
      position: absolute;
      bottom: 60px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.3s ease-out;
      pointer-events: none;
      z-index: 999;
    `;

    this.touchHint = hint;
    this.elements.sidebar.appendChild(hint);
  }

  setupEventListeners() {
    // 设置提示按钮事件
    if (this.hintElement) {
      const keepOpenBtn = this.hintElement.querySelector('.keep-open');
      const closeNowBtn = this.hintElement.querySelector('.close-now');
      
      if (keepOpenBtn) {
        keepOpenBtn.addEventListener('click', () => this.handleKeepOpen());
      }
      if (closeNowBtn) {
        closeNowBtn.addEventListener('click', () => this.handleCloseNow());
      }
    }

    // 设置控制面板事件
    if (this.controlPanel) {
      const checkbox = this.controlPanel.querySelector('#autoCloseToggle');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => this.handlePreferenceChange(e.target.checked));
      }
    }

    // 用户交互检测
    this.setupInteractionDetection();
  }

  setupInteractionDetection() {
    const interactionEvents = ['click', 'scroll', 'touchstart'];
    
    interactionEvents.forEach(event => {
      this.elements.sidebar.addEventListener(event, () => {
        this.state.userInteracted = true;
        this.showTouchHint();
      }, { passive: true });
    });
  }

  initializeMobileSidebar() {
    // 监听侧边栏打开事件
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const sidebar = mutation.target;
          if (sidebar.classList.contains('open') && !this.state.autoCloseTimer) {
            this.handleSidebarOpened();
          }
        }
      });
    });

    if (this.elements.sidebar) {
      observer.observe(this.elements.sidebar, { attributes: true });
    }

    // 如果侧边栏已经打开，立即处理
    if (this.elements.sidebar && this.elements.sidebar.classList.contains('open')) {
      this.handleSidebarOpened();
    }
  }

  handleSidebarOpened() {
    // 检查用户偏好
    if (this.state.userPreference === 'disabled') {
      console.log('[SmartSidebarUX] 用户已禁用自动收起');
      return;
    }

    // 重置状态
    this.state.isHintShown = false;
    this.state.userInteracted = false;

    // 开始智能收起流程
    this.startSmartCloseFlow();
  }

  startSmartCloseFlow() {
    // 显示友好提示
    this.state.hintTimer = setTimeout(() => {
      this.showCloseHint();
    }, this.config.HINT_DELAY);

    // 设置自动收起
    this.state.autoCloseTimer = setTimeout(() => {
      if (!this.state.userInteracted) {
        this.autoCloseSidebar();
      }
    }, this.config.AUTO_CLOSE_DELAY);
  }

  showCloseHint() {
    if (this.state.isHintShown || this.state.userInteracted) return;

    this.state.isHintShown = true;
    this.hintElement.style.opacity = '1';
    this.hintElement.style.transform = 'translateY(0)';
    this.hintElement.style.pointerEvents = 'auto';

    // 启动进度条动画
    this.animateProgress();

    // 自动隐藏提示
    setTimeout(() => {
      this.hideCloseHint();
    }, 4000);
  }

  animateProgress() {
    const progressBar = this.hintElement.querySelector('.hint-progress');
    if (!progressBar) return;

    progressBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(90deg, #FA8C32, #FFD600);
      border-radius: 0 0 12px 12px;
      width: 0%;
      transition: width 4s linear;
    `;

    // 触发动画
    setTimeout(() => {
      progressBar.style.width = '100%';
    }, 100);
  }

  hideCloseHint() {
    if (!this.hintElement) return;

    this.hintElement.style.opacity = '0';
    this.hintElement.style.transform = 'translateY(-10px)';
    this.hintElement.style.pointerEvents = 'none';
  }

  showTouchHint() {
    if (!this.touchHint || this.touchHint.style.opacity === '1') return;

    this.touchHint.style.opacity = '1';
    this.touchHint.style.transform = 'translateX(0)';

    setTimeout(() => {
      this.touchHint.style.opacity = '0';
      this.touchHint.style.transform = 'translateX(10px)';
    }, this.config.TOUCH_HINT_DURATION);
  }

  handleKeepOpen() {
    this.cancelAutoClose();
    this.hideCloseHint();
    this.state.userInteracted = true;
    
    // 显示反馈
    this.showFeedback('侧边栏将保持打开状态', 'success');
  }

  handleCloseNow() {
    this.cancelAutoClose();
    this.closeSidebarSmoothly();
    
    // 显示反馈
    this.showFeedback('侧边栏已收起', 'info');
  }

  handlePreferenceChange(enabled) {
    const preference = enabled ? 'enabled' : 'disabled';
    localStorage.setItem('sidebarAutoClose', preference);
    this.state.userPreference = preference;

    if (!enabled) {
      this.cancelAutoClose();
      this.hideCloseHint();
      this.showFeedback('已禁用自动收起功能', 'info');
    } else {
      this.showFeedback('已启用智能收起功能', 'success');
    }
  }

  autoCloseSidebar() {
    this.hideCloseHint();
    this.closeSidebarSmoothly();
    this.showFeedback('侧边栏已自动收起，方便您查看内容', 'info');
  }

  closeSidebarSmoothly() {
    const { sidebar, overlay, content } = this.elements;
    
    if (sidebar && overlay && content) {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
      content.classList.remove('shifted');
    }
  }

  cancelAutoClose() {
    if (this.state.autoCloseTimer) {
      clearTimeout(this.state.autoCloseTimer);
      this.state.autoCloseTimer = null;
    }
    if (this.state.hintTimer) {
      clearTimeout(this.state.hintTimer);
      this.state.hintTimer = null;
    }
  }

  showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `sidebar-feedback ${type}`;
    feedback.textContent = message;
    
    const bgColor = {
      success: 'rgba(40, 167, 69, 0.9)',
      info: 'rgba(23, 162, 184, 0.9)',
      warning: 'rgba(255, 193, 7, 0.9)'
    };
    
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${bgColor[type] || bgColor.info};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease-out;
      max-width: 80%;
      text-align: center;
    `;

    document.body.appendChild(feedback);

    // 显示动画
    setTimeout(() => {
      feedback.style.opacity = '1';
    }, 100);

    // 自动移除
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => {
        if (feedback.parentNode) {
          feedback.parentNode.removeChild(feedback);
        }
      }, 300);
    }, 2500);
  }

  // 公共方法
  disable() {
    this.cancelAutoClose();
    this.hideCloseHint();
    localStorage.setItem('sidebarAutoClose', 'disabled');
  }

  enable() {
    localStorage.setItem('sidebarAutoClose', 'enabled');
    if (this.elements.sidebar.classList.contains('open')) {
      this.startSmartCloseFlow();
    }
  }

  cleanup() {
    this.cancelAutoClose();
    if (this.hintElement && this.hintElement.parentNode) {
      this.hintElement.parentNode.removeChild(this.hintElement);
    }
    if (this.controlPanel && this.controlPanel.parentNode) {
      this.controlPanel.parentNode.removeChild(this.controlPanel);
    }
    if (this.touchHint && this.touchHint.parentNode) {
      this.touchHint.parentNode.removeChild(this.touchHint);
    }
  }
}

// 翻译系统已在translations.js中配置

// 智能初始化
function initializeSmartSidebarUX() {
  // 等待其他组件初始化完成
  setTimeout(() => {
    if (window.smartSidebarUX) {
      console.log('[SmartSidebarUX] 已经初始化');
      return;
    }

    window.smartSidebarUX = new SmartSidebarUX();
  }, 1000);
}

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSmartSidebarUX);
} else {
  initializeSmartSidebarUX();
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SmartSidebarUX;
}