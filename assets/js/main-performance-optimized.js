/**
 * SVTR主页性能优化版本
 * 解决定时器过多导致的浏览器崩溃问题
 */

class SVTRStatsManager {
  constructor() {
    this.stats = {
      members: { count: 15420, growth: '+12%' },
      companies: { count: 2847, growth: '+8%' }, 
      vip: { count: 1256, growth: '+15%' }
    };
    
    this.domElements = this.initializeDOMElements();
    this.hasStatsElements = this.checkStatsElements();
    this.timers = [];
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.hasStatsElements) {
      this.init();
    }
  }

  initializeDOMElements() {
    return {
      sidebar: document.querySelector('.sidebar'),
      stats: {
        members_count: document.getElementById('members_count'),
        companies_count: document.getElementById('companies_count'), 
        vip_count: document.getElementById('vip_count'),
        members_growth: document.getElementById('members_growth'),
        companies_growth: document.getElementById('companies_growth'),
        vip_growth: document.getElementById('vip_growth')
      }
    };
  }

  checkStatsElements() {
    const { stats } = this.domElements;
    return stats.members_count && stats.companies_count && stats.vip_count;
  }

  init() {
    this.paintInitialStats();
    this.startOptimizedUpdates();
    
    console.log('📊 SVTR统计管理器已启动（性能优化版）');
  }

  paintInitialStats() {
    if (!this.hasStatsElements) return;
    
    const { stats } = this.domElements;
    stats.members_count.textContent = this.formatNumber(this.stats.members.count);
    stats.companies_count.textContent = this.formatNumber(this.stats.companies.count);
    stats.vip_count.textContent = this.formatNumber(this.stats.vip.count);
    stats.members_growth.textContent = this.stats.members.growth;
    stats.companies_growth.textContent = this.stats.companies.growth;
    stats.vip_growth.textContent = this.stats.vip.growth;
  }

  startOptimizedUpdates() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // 使用单一定时器处理所有更新，降低频率
    const updateTimer = setInterval(() => {
      if (!this.isPaused) {
        this.performLightUpdate();
      }
    }, 5000); // 5秒更新一次，而不是原来的高频更新
    
    // 注册到性能稳定器
    if (window.svtrStabilizer) {
      window.svtrStabilizer.registerTimer(updateTimer);
    }
    
    this.timers.push(updateTimer);
  }

  performLightUpdate() {
    if (!this.hasStatsElements) return;
    
    // 轻微随机变化，模拟真实数据
    const variance = Math.random() < 0.1; // 10%概率更新
    
    if (variance) {
      this.stats.members.count += Math.floor(Math.random() * 3);
      this.stats.companies.count += Math.floor(Math.random() * 2);
      this.stats.vip.count += Math.floor(Math.random() * 2);
      
      this.paintInitialStats();
      this.flashGrowthIndicator();
    }
  }

  flashGrowthIndicator() {
    const indicators = [
      this.domElements.stats.members_growth,
      this.domElements.stats.companies_growth,
      this.domElements.stats.vip_growth
    ];
    
    const randomIndicator = indicators[Math.floor(Math.random() * indicators.length)];
    if (randomIndicator) {
      randomIndicator.style.color = '#00d4aa';
      setTimeout(() => {
        randomIndicator.style.color = '';
      }, 1000);
    }
  }

  formatNumber(num) {
    return num.toLocaleString();
  }

  // 性能优化方法
  pause() {
    this.isPaused = true;
    console.log('⏸️ 统计更新已暂停');
  }

  resume() {
    this.isPaused = false;
    console.log('▶️ 统计更新已恢复');
  }

  destroy() {
    this.timers.forEach(timer => {
      clearInterval(timer);
      if (window.svtrStabilizer) {
        window.svtrStabilizer.clearTimer(timer);
      }
    });
    this.timers = [];
    this.isRunning = false;
    console.log('🧹 统计管理器已销毁');
  }
}

class SVTRSidebarManager {
  constructor() {
    this.sidebar = document.querySelector('.sidebar');
    this.toggleButton = document.querySelector('.sidebar-toggle');
    this.overlay = document.querySelector('.sidebar-overlay');
    this.sidebarLogo = document.querySelector('.sidebar-logo');
    this.headerLogo = document.querySelector('.header-logo');
    
    if (this.sidebar && this.toggleButton) {
      this.init();
    }
  }

  init() {
    this.setupEventListeners();
    console.log('📱 侧边栏管理器已初始化');
  }

  setupEventListeners() {
    // 使用性能稳定器管理事件监听器
    if (window.svtrStabilizer) {
      window.svtrStabilizer.registerEventListener(
        this.toggleButton, 'click', this.toggle.bind(this)
      );
      
      if (this.overlay) {
        window.svtrStabilizer.registerEventListener(
          this.overlay, 'click', this.close.bind(this)
        );
      }
      
      // Logo点击事件处理
      if (this.sidebarLogo) {
        window.svtrStabilizer.registerEventListener(
          this.sidebarLogo, 'click', this.handleLogoClick.bind(this)
        );
      }
      
      if (this.headerLogo) {
        window.svtrStabilizer.registerEventListener(
          this.headerLogo, 'click', this.handleLogoClick.bind(this)
        );
      }
    } else {
      this.toggleButton.addEventListener('click', this.toggle.bind(this));
      if (this.overlay) {
        this.overlay.addEventListener('click', this.close.bind(this));
      }
      
      // Logo点击事件处理
      if (this.sidebarLogo) {
        this.sidebarLogo.addEventListener('click', this.handleLogoClick.bind(this));
      }
      
      if (this.headerLogo) {
        this.headerLogo.addEventListener('click', this.handleLogoClick.bind(this));
      }
    }
  }

  handleLogoClick(event) {
    // Ctrl+点击或Cmd+点击打开管理中心
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      window.open('/pages/admin-center.html', '_blank');
    } else {
      // 普通点击切换侧边栏
      this.toggle();
    }
  }

  toggle() {
    if (this.sidebar.classList.contains('open')) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.sidebar.classList.add('open');
    if (this.overlay) {
      this.overlay.classList.add('active');
    }
  }

  close() {
    this.sidebar.classList.remove('open');
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
  }

  isOpen() {
    return this.sidebar?.classList.contains('open') || false;
  }
}

class SVTRMainController {
  constructor() {
    this.statsManager = null;
    this.sidebarManager = null;
    
    this.init();
  }

  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    // 初始化统计管理器
    this.statsManager = new SVTRStatsManager();
    
    // 初始化侧边栏管理器
    this.sidebarManager = new SVTRSidebarManager();
    
    // 设置页面可见性优化
    this.setupVisibilityOptimization();
    
    console.log('🚀 SVTR主控制器初始化完成');
  }

  setupVisibilityOptimization() {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    };

    if (window.svtrStabilizer) {
      window.svtrStabilizer.registerEventListener(
        document, 'visibilitychange', handleVisibilityChange
      );
    } else {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  }

  pause() {
    if (this.statsManager) {
      this.statsManager.pause();
    }
  }

  resume() {
    if (this.statsManager) {
      this.statsManager.resume();
    }
  }

  destroy() {
    if (this.statsManager) {
      this.statsManager.destroy();
    }
    console.log('🧹 主控制器已销毁');
  }
}

// 全局初始化
const mainController = new SVTRMainController();
window.svtrStats = mainController;
// 为兼容性保持旧的命名
window.svtrApp = {
  ...mainController,
  domElements: {
    sidebar: mainController.sidebarManager?.sidebar,
    overlay: mainController.sidebarManager?.overlay,
    toggle: mainController.sidebarManager?.toggleButton,
    content: document.querySelector('.content')
  },
  // 保持向后兼容的方法
  openSidebar: () => mainController.sidebarManager?.open(),
  closeSidebar: () => mainController.sidebarManager?.close(),
  toggleSidebar: () => mainController.sidebarManager?.toggle(),
  isSidebarOpen: () => mainController.sidebarManager?.isOpen(),
  paintStats: () => mainController.statsManager?.paintInitialStats(),
  updateProgressBars: () => {}, // 占位符方法
  cleanup: () => mainController.destroy()
};

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (mainController) {
    mainController.destroy();
  }
});

console.log('📊 SVTR主页性能优化模块加载完成');