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
