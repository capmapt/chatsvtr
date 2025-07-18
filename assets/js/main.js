// Main application module
(function() {
  'use strict';

  // Application state and configuration
  const CONFIG = {
    SIDEBAR_AUTO_CLOSE_DELAY: 2000,
    STATS_UPDATE_INTERVAL: 3000,
    RANDOM_STATS_INTERVAL: 20000,
    STATS_ANIMATION_DURATION: 500,
    STATS_UPDATE_INTERVAL_MS: 60000
  };

  const STATS_CONFIG = {
    members: { count: 121884, growth: 25, max: 150000 },
    companies: { count: 10761, growth: 8, max: 20000 },
    vip: { count: 1102, growth: 3, max: 2000 }
  };

  class SVTRApp {
    constructor() {
      this.stats = this.initializeStats();
      this.domElements = {};
      this.timers = [];
      this.init();
    }

    init() {
      this.cacheDOMElements();
      this.initializeSidebar();
      this.startStatsUpdates();
      this.setupEventListeners();
    }

    cacheDOMElements() {
      // Sidebar elements
      this.domElements.toggle = document.querySelector('.menu-toggle');
      this.domElements.sidebar = document.querySelector('.sidebar');
      this.domElements.overlay = document.querySelector('.overlay');
      this.domElements.content = document.querySelector('.content');

      // Stats elements
      this.domElements.stats = {
        members_count: document.getElementById('members-count'),
        companies_count: document.getElementById('companies-count'),
        vip_count: document.getElementById('vip-count'),
        members_growth: document.getElementById('members-growth'),
        companies_growth: document.getElementById('companies-growth'),
        vip_growth: document.getElementById('vip-growth')
      };

      // Check if all stats elements exist
      this.hasStatsElements = Object.values(this.domElements.stats).every(el => el !== null);
    }

    initializeStats() {
      const stats = {};
      Object.keys(STATS_CONFIG).forEach(key => {
        stats[key] = {
          ...STATS_CONFIG[key],
          last: Date.now()
        };
      });
      return stats;
    }

    setupEventListeners() {
      if (this.domElements.toggle && this.domElements.overlay) {
        this.domElements.toggle.addEventListener('click', () => this.toggleSidebar());
        this.domElements.overlay.addEventListener('click', () => this.closeSidebar());
      }

      // Handle escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isSidebarOpen()) {
          this.closeSidebar();
        }
      });
    }

    initializeSidebar() {
      const isMobile = window.innerWidth <= 768;
      const isFirstVisit = !localStorage.getItem('sidebarAutoClosed');

      if (this.isSidebarOpen() && (isMobile || isFirstVisit)) {
        setTimeout(() => {
          this.closeSidebar();
          if (isFirstVisit) {
            localStorage.setItem('sidebarAutoClosed', '1');
          }
        }, CONFIG.SIDEBAR_AUTO_CLOSE_DELAY);
      }
    }

    toggleSidebar() {
      if (this.isSidebarOpen()) {
        this.closeSidebar();
      } else {
        this.openSidebar();
      }
    }

    openSidebar() {
      const { sidebar, overlay, content } = this.domElements;
      if (sidebar && overlay && content) {
        sidebar.classList.add('open');
        overlay.classList.add('active');
        content.classList.add('shifted');
      }
    }

    closeSidebar() {
      const { sidebar, overlay, content, toggle } = this.domElements;
      if (sidebar && overlay && content) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        content.classList.remove('shifted');

        // Return focus to toggle button if it's not already focused
        if (toggle && document.activeElement !== toggle) {
          toggle.focus();
        }
      }
    }

    isSidebarOpen() {
      return this.domElements.sidebar?.classList.contains('open') || false;
    }

    startStatsUpdates() {
      if (!this.hasStatsElements) {
        return;
      }

      this.paintStats();
      this.updateProgressBars();

      // Start update intervals
      this.timers.push(
        setInterval(() => this.stepStats(), CONFIG.STATS_UPDATE_INTERVAL),
        setInterval(() => this.randomStatsUpdate(), CONFIG.RANDOM_STATS_INTERVAL)
      );
    }

    formatNumber(num) {
      return num.toLocaleString();
    }

    paintStats() {
      if (!this.hasStatsElements) {
        return;
      }

      const { stats } = this.domElements;
      stats.members_count.textContent = this.formatNumber(this.stats.members.count);
      stats.companies_count.textContent = this.formatNumber(this.stats.companies.count);
      stats.vip_count.textContent = this.formatNumber(this.stats.vip.count);
      stats.members_growth.textContent = this.stats.members.growth;
      stats.companies_growth.textContent = this.stats.companies.growth;
      stats.vip_growth.textContent = this.stats.vip.growth;
    }

    flashElement(elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.classList.add('increase-animation');
        setTimeout(() => {
          element.classList.remove('increase-animation');
        }, CONFIG.STATS_ANIMATION_DURATION);
      }
    }

    stepStats() {
      const now = Date.now();
      let hasUpdates = false;

      Object.entries(this.stats).forEach(([key, stat]) => {
        if (now - stat.last >= CONFIG.STATS_UPDATE_INTERVAL_MS) {
          const increment = Math.max(
            1,
            Math.floor(stat.growth * (1 + Math.random() * 0.6 - 0.3))
          );

          stat.count += increment;
          stat.last = now;
          hasUpdates = true;

          // Occasionally update growth rate
          if (Math.random() < 0.2) {
            stat.growth = Math.max(
              1,
              Math.floor(stat.growth * (1 + Math.random() * 0.4 - 0.2))
            );
          }

          this.flashElement(`${key}-count`);
        }
      });

      if (hasUpdates) {
        this.paintStats();
        this.updateProgressBars();
      }
    }

    updateProgressBars() {
      Object.entries(this.stats).forEach(([key, stat]) => {
        const percentage = Math.min((stat.count / stat.max) * 100, 100);
        const progressBarFill = document.querySelector(`.${key} .progress-fill`);

        if (progressBarFill) {
          progressBarFill.style.width = `${percentage}%`;
        }
      });
    }

    randomStatsUpdate() {
      if (Math.random() < 0.8) {
        const keys = Object.keys(this.stats);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const increment = Math.floor(Math.random() * 5 + 1);

        this.stats[randomKey].count += increment;
        this.flashElement(`${randomKey}-count`);
        this.paintStats();
        this.updateProgressBars();
      }
    }

    // Cleanup method
    destroy() {
      // Clear all timers
      this.timers.forEach(timer => clearInterval(timer));
      this.timers = [];

      // Remove event listeners
      if (this.domElements.toggle) {
        this.domElements.toggle.removeEventListener('click', this.toggleSidebar);
      }
      if (this.domElements.overlay) {
        this.domElements.overlay.removeEventListener('click', this.closeSidebar);
      }
    }
  }

  // Utility functions
  function debounce(func, wait) {
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

  // Initialize app when DOM is ready
  function init() {
    if (window.svtrApp) {
      window.svtrApp.destroy();
    }
    window.svtrApp = new SVTRApp();
  }

  // Handle page visibility changes to pause/resume timers
  document.addEventListener('visibilitychange', () => {
    if (window.svtrApp) {
      if (document.hidden) {
        // Page is hidden, could pause timers here if needed
      } else {
        // Page is visible again
        window.svtrApp.paintStats();
        window.svtrApp.updateProgressBars();
      }
    }
  });

  // Handle window resize
  const handleResize = debounce(() => {
    if (window.svtrApp && window.innerWidth <= 768 && window.svtrApp.isSidebarOpen()) {
      window.svtrApp.closeSidebar();
    }
  }, 250);

  window.addEventListener('resize', handleResize);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose app instance for debugging (only in development)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.SVTRApp = SVTRApp;
  }

})();

// === 用户登录系统 ===
(function() {
  'use strict';

  class AuthSystem {
    constructor() {
      this.currentUser = null;
      this.isLoggedIn = false;
      this.init();
    }

    init() {
      this.bindEvents();
      this.checkAuthState();
      this.initChatbox();
    }

    bindEvents() {
      // 登录按钮事件
      const loginBtn = document.getElementById('loginBtn');
      const startChatBtn = document.getElementById('startChatBtn');
      if (loginBtn) loginBtn.addEventListener('click', () => this.showLoginModal());
      if (startChatBtn) startChatBtn.addEventListener('click', () => this.showLoginModal());

      // 注销按钮事件
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

      // 模态框事件
      const closeBtn = document.getElementById('closeLoginModal');
      const overlay = document.getElementById('loginOverlay');
      if (closeBtn) closeBtn.addEventListener('click', () => this.hideLoginModal());
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.hideLoginModal();
        });
      }

      // 社交登录事件
      const wechatBtn = document.getElementById('wechatLogin');
      const githubBtn = document.getElementById('githubLogin');
      if (wechatBtn) wechatBtn.addEventListener('click', () => this.socialLogin('wechat'));
      if (githubBtn) githubBtn.addEventListener('click', () => this.socialLogin('github'));

      // 邮箱登录表单
      const emailForm = document.getElementById('emailLoginForm');
      if (emailForm) {
        emailForm.addEventListener('submit', (e) => {
          e.preventDefault();
          this.emailLogin();
        });
      }

      // ESC键关闭模态框
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.hideLoginModal();
      });
    }

    checkAuthState() {
      // 检查localStorage中的登录状态
      const savedUser = localStorage.getItem('svtr_user');
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
          this.isLoggedIn = true;
          this.updateUI();
        } catch (e) {
          localStorage.removeItem('svtr_user');
        }
      }
    }

    showLoginModal() {
      const overlay = document.getElementById('loginOverlay');
      if (overlay) {
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        // 聚焦到第一个输入框
        setTimeout(() => {
          const firstInput = overlay.querySelector('input');
          if (firstInput) firstInput.focus();
        }, 300);
      }
    }

    hideLoginModal() {
      const overlay = document.getElementById('loginOverlay');
      if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
      }
    }

    async socialLogin(provider) {
      // 显示加载状态
      this.showLoading(`正在连接${provider === 'wechat' ? '微信' : 'GitHub'}...`);

      try {
        // 模拟社交登录流程
        await this.mockSocialAuth(provider);
      } catch (error) {
        this.showError('登录失败，请重试');
      }
    }

    async mockSocialAuth(provider) {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟成功登录
      const mockUsers = {
        wechat: {
          id: 'wx_' + Date.now(),
          name: 'AI创投爱好者',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat',
          provider: 'wechat',
          badge: '社区成员'
        },
        github: {
          id: 'gh_' + Date.now(),
          name: 'TechInvestor',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=github',
          provider: 'github',
          badge: '开发者会员'
        }
      };

      this.currentUser = mockUsers[provider];
      this.isLoggedIn = true;
      
      // 保存到localStorage
      localStorage.setItem('svtr_user', JSON.stringify(this.currentUser));
      
      this.hideLoginModal();
      this.updateUI();
      this.showSuccess(`欢迎回来，${this.currentUser.name}！`);
    }

    async emailLogin() {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        this.showError('请填写完整的登录信息');
        return;
      }

      this.showLoading('正在验证账户...');

      try {
        // 模拟邮箱登录
        await this.mockEmailAuth(email, password);
      } catch (error) {
        this.showError('邮箱或密码错误，请重试');
      }
    }

    async mockEmailAuth(email, password) {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 简单的验证逻辑（生产环境中应该调用真实API）
      if (email.includes('@') && password.length >= 6) {
        this.currentUser = {
          id: 'email_' + Date.now(),
          name: email.split('@')[0],
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          provider: 'email',
          badge: '注册会员'
        };
        this.isLoggedIn = true;
        
        localStorage.setItem('svtr_user', JSON.stringify(this.currentUser));
        
        this.hideLoginModal();
        this.updateUI();
        this.showSuccess(`欢迎回来，${this.currentUser.name}！`);
      } else {
        throw new Error('Invalid credentials');
      }
    }

    logout() {
      this.currentUser = null;
      this.isLoggedIn = false;
      localStorage.removeItem('svtr_user');
      
      this.updateUI();
      this.showSuccess('已安全注销');
    }

    updateUI() {
      const loginPrompt = document.getElementById('loginPrompt');
      const userLoggedIn = document.getElementById('userLoggedIn');
      const chatFrame = document.getElementById('svtrChatFrame');
      const chatPlaceholder = document.getElementById('chatPlaceholder');

      if (this.isLoggedIn && this.currentUser) {
        // 显示已登录状态
        if (loginPrompt) loginPrompt.style.display = 'none';
        if (userLoggedIn) userLoggedIn.style.display = 'flex';

        // 更新用户信息
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const userBadge = document.getElementById('userBadge');
        
        if (userName) userName.textContent = this.currentUser.name;
        if (userAvatar) userAvatar.src = this.currentUser.avatar;
        if (userBadge) userBadge.textContent = this.currentUser.badge;

        // 显示聊天界面
        if (chatFrame) {
          chatFrame.src = 'https://chat.svtrglobal.com';
          chatFrame.style.display = 'block';
        }
        if (chatPlaceholder) chatPlaceholder.style.display = 'none';
      } else {
        // 显示未登录状态
        if (loginPrompt) loginPrompt.style.display = 'flex';
        if (userLoggedIn) userLoggedIn.style.display = 'none';

        // 隐藏聊天界面
        if (chatFrame) {
          chatFrame.src = 'about:blank';
          chatFrame.style.display = 'none';
        }
        if (chatPlaceholder) chatPlaceholder.style.display = 'flex';
      }
    }

    initChatbox() {
      // 初始化聊天界面状态
      this.updateUI();
    }

    showLoading(message) {
      // 简单的加载提示（可以用更精美的组件替换）
      this.showNotification(message, 'loading');
    }

    showSuccess(message) {
      this.showNotification(message, 'success');
    }

    showError(message) {
      this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
      // 创建通知元素
      const notification = document.createElement('div');
      notification.className = `auth-notification auth-notification--${type}`;
      notification.textContent = message;
      
      // 添加样式
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: '10000',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '300px',
        wordWrap: 'break-word',
        animation: 'slideInRight 0.3s ease-out'
      });

      document.body.appendChild(notification);

      // 自动移除
      setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, type === 'loading' ? 5000 : 3000);
    }
  }

  // 初始化认证系统
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.authSystem = new AuthSystem();
    });
  } else {
    window.authSystem = new AuthSystem();
  }

  // 添加通知动画CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

})();
