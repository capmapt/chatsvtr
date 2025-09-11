/**
 * 统一侧边栏控制器
 * 解决多个脚本冲突导致的侧边栏开关按钮失灵问题
 */

class UnifiedSidebarController {
  constructor() {
    this.isInitialized = false;
    this.isProcessing = false;
    this.debugMode = true;

    // DOM元素缓存
    this.elements = {
      sidebar: null,
      toggle: null,
      overlay: null,
      content: null,
      sidebarLogo: null
    };

    // 状态管理
    this.state = {
      isOpen: false,
      isMobile: this.detectMobile()
    };

    this.init();
  }

  detectMobile() {
    return window.innerWidth <= 768;
  }

  log(message, ...args) {
    if (this.debugMode) {
      console.log(`[UnifiedSidebar] ${message}`, ...args);
    }
  }

  init() {
    // 等待DOM完全加载
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.log('开始初始化统一侧边栏控制器');

    // 获取DOM元素
    this.elements = {
      sidebar: document.querySelector('.sidebar'),
      toggle: document.querySelector('.menu-toggle'),
      overlay: document.querySelector('.overlay'),
      content: document.querySelector('.content'),
      sidebarLogo: document.querySelector('.sidebar-logo')
    };

    // 验证必要元素存在
    if (!this.validateElements()) {
      this.log('缺少必要的DOM元素，初始化失败');
      return;
    }

    // 清理可能存在的其他事件监听器
    this.cleanupExistingListeners();

    // 绑定事件
    this.bindEvents();

    // 设置初始状态
    this.setInitialState();

    this.isInitialized = true;
    this.log('统一侧边栏控制器初始化完成');
  }

  validateElements() {
    const missing = [];
    const required = ['sidebar', 'toggle', 'overlay']; // sidebarLogo和content是可选的
    
    required.forEach(key => {
      if (!this.elements[key]) {
        missing.push(key);
      }
    });

    if (missing.length > 0) {
      this.log('缺少必要的DOM元素:', missing);
      return false;
    }

    return true;
  }

  cleanupExistingListeners() {
    // 移除可能存在的onclick绑定
    if (this.elements.toggle.onclick) {
      this.elements.toggle.onclick = null;
      this.log('已清理onclick绑定');
    }

    // 克隆节点来移除所有事件监听器
    const newToggle = this.elements.toggle.cloneNode(true);
    this.elements.toggle.parentNode.replaceChild(newToggle, this.elements.toggle);
    this.elements.toggle = newToggle;

    this.log('已清理所有现有事件监听器');
  }

  bindEvents() {
    // 绑定切换按钮点击事件
    this.elements.toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });

    // 绑定遮罩层点击关闭
    this.elements.overlay.addEventListener('click', (e) => {
      if (e.target === this.elements.overlay && this.state.isOpen) {
        this.close();
      }
    });

    // 绑定ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.close();
      }
    });

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
      this.state.isMobile = this.detectMobile();
      if (!this.state.isMobile && this.state.isOpen) {
        // 桌面端自动打开侧边栏
        this.open();
      }
    });

    // 绑定侧边栏logo的Ctrl+点击功能
    if (this.elements.sidebarLogo) {
      this.elements.sidebarLogo.addEventListener('click', (e) => {
        this.handleLogoClick(e);
      });
      this.log('侧边栏logo事件监听器绑定完成');
    }

    this.log('事件监听器绑定完成');
  }

  setInitialState() {
    // 根据设备类型设置初始状态
    this.state.isOpen = !this.state.isMobile;

    if (this.state.isOpen) {
      this.open(false); // 不播放动画
    } else {
      this.close(false); // 不播放动画
    }

    this.log('初始状态设置完成:', { isOpen: this.state.isOpen, isMobile: this.state.isMobile });
  }

  toggle() {
    if (this.isProcessing) {
      this.log('正在处理中，忽略切换请求');
      return;
    }

    this.log('切换侧边栏状态');

    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open(animate = true) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    this.log('打开侧边栏');

    this.state.isOpen = true;

    // 添加CSS类
    this.elements.sidebar.classList.add('open');
    this.elements.overlay.classList.add('active');
    if (this.elements.content) {
      this.elements.content.classList.add('shifted');
    }
    document.body.classList.add('sidebar-open');

    // 确保侧边栏可见
    this.elements.sidebar.style.removeProperty('left');

    // 更新按钮aria-label
    this.elements.toggle.setAttribute('aria-label', '关闭侧边栏');

    setTimeout(() => {
      this.isProcessing = false;
    }, animate ? 300 : 0);
  }

  close(animate = true) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    this.log('关闭侧边栏');

    this.state.isOpen = false;

    // 移除CSS类
    this.elements.sidebar.classList.remove('open');
    this.elements.overlay.classList.remove('active');
    if (this.elements.content) {
      this.elements.content.classList.remove('shifted');
    }
    document.body.classList.remove('sidebar-open');

    // 移动端隐藏侧边栏
    if (this.state.isMobile) {
      this.elements.sidebar.style.left = '-280px';
    }

    // 更新按钮aria-label
    this.elements.toggle.setAttribute('aria-label', '打开侧边栏');

    setTimeout(() => {
      this.isProcessing = false;
    }, animate ? 300 : 0);
  }

  handleLogoClick(event) {
    // Ctrl+点击或Cmd+点击打开管理中心
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      this.log('Ctrl+点击logo，打开管理中心');
      window.open('/pages/admin-center.html', '_blank');
    } else {
      // 普通点击切换侧边栏
      this.log('普通点击logo，切换侧边栏');
      this.toggle();
    }
  }

  // 公共API
  forceOpen() {
    this.open();
  }

  forceClose() {
    this.close();
  }

  getState() {
    return { ...this.state };
  }

  destroy() {
    // 清理事件监听器和状态
    this.isInitialized = false;
    this.log('统一侧边栏控制器已销毁');
  }
}

// 自动初始化
let unifiedSidebar = null;

// 确保在其他脚本之后执行
function initUnifiedSidebar() {
  // 清理可能存在的其他侧边栏控制器
  if (window.desktopToggleFix) {
    window.desktopToggleFix.isInitialized = false;
  }

  // 初始化统一控制器
  unifiedSidebar = new UnifiedSidebarController();

  // 导出到全局作用域供调试使用
  window.unifiedSidebar = unifiedSidebar;
}

// 延迟初始化以确保在其他脚本之后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initUnifiedSidebar, 500);
  });
} else {
  setTimeout(initUnifiedSidebar, 500);
}
