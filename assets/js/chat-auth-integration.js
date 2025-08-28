/**
 * 聊天认证集成脚本
 * 在原有聊天系统上叠加认证功能，保持原始界面不变
 */

(function() {
  'use strict';

  let authIntegration = {
    isInitialized: false,
    originalSendMessage: null,
    originalTryRealAPIFirst: null,
    
    init() {
      if (this.isInitialized) return;
      
      console.log('🔗 初始化聊天认证集成');
      
      // 等待原始聊天系统和认证管理器加载
      this.waitForSystems();
    },

    waitForSystems() {
      if (window.svtrChat) {
        this.integrateAuth();
      } else {
        console.log('⏳ 等待聊天系统加载...');
        setTimeout(() => this.waitForSystems(), 200);
      }
    },

    integrateAuth() {
      console.log('🔐 集成认证功能到现有聊天系统');
      
      // 检查并显示登录状态
      this.checkAuthState();
      
      // 拦截发送消息功能
      this.interceptSendMessage();
      
      // 拦截API调用
      this.interceptAPICall();
      
      // 监听认证状态变化
      this.listenAuthEvents();
      
      this.isInitialized = true;
      console.log('✅ 认证集成完成');
    },

    checkAuthState() {
      const user = this.getCurrentUser();
      if (!user) {
        // 不立即显示登录遮罩，等用户尝试输入时再显示
        this.setupInputTrigger();
      } else {
        this.hideLoginOverlay();
        // 不在聊天区显示用户信息，避免重复
      }
    },

    getCurrentUser() {
      try {
        const userStr = localStorage.getItem('svtr_user');
        const token = localStorage.getItem('svtr_token');
        
        if (userStr && token) {
          return JSON.parse(userStr);
        }
      } catch (error) {
        console.warn('读取用户信息失败:', error);
        // 清理无效数据
        localStorage.removeItem('svtr_user');
        localStorage.removeItem('svtr_token');
      }
      return null;
    },

    getCurrentToken() {
      return localStorage.getItem('svtr_token');
    },

    isLoggedIn() {
      return !!this.getCurrentUser();
    },

    setupInputTrigger() {
      const chatInput = document.getElementById('svtr-chat-input');
      const sendBtn = document.getElementById('svtr-chat-send');
      
      if (chatInput && !chatInput.dataset.authTriggerSetup) {
        chatInput.dataset.authTriggerSetup = 'true';
        
        // 监听输入框的点击和聚焦事件
        const showLoginIfNeeded = (e) => {
          if (!this.isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            this.openSidebarLogin();
          }
        };
        
        chatInput.addEventListener('focus', showLoginIfNeeded);
        chatInput.addEventListener('click', showLoginIfNeeded);
        chatInput.addEventListener('input', showLoginIfNeeded);
      }
      
      if (sendBtn && !sendBtn.dataset.authTriggerSetup) {
        sendBtn.dataset.authTriggerSetup = 'true';
        
        sendBtn.addEventListener('click', (e) => {
          if (!this.isLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
            this.openSidebarLogin();
          }
        });
      }
    },

    getAuthHeaders() {
      const token = this.getCurrentToken();
      const user = this.getCurrentUser();
      
      if (!token || !user) {
        return {};
      }

      return {
        'Authorization': `Bearer ${token}`,
        'X-User-ID': user.id || ''
      };
    },



    hideLoginOverlay() {
      const overlay = document.querySelector('.chat-login-overlay');
      if (overlay) {
        overlay.remove();
      }
      
      // 启用输入
      this.enableChat();
    },

    disableChat() {
      // 不禁用输入框，让用户可以点击触发登录
      const chatInput = document.getElementById('svtr-chat-input');
      
      if (chatInput) {
        chatInput.placeholder = '点击这里登录使用AI助手...';
      }
    },

    enableChat() {
      const chatInput = document.getElementById('svtr-chat-input');
      const sendBtn = document.getElementById('svtr-chat-send');
      
      if (chatInput) {
        chatInput.disabled = false;
        chatInput.placeholder = '问我关于AI创投的任何问题...';
      }
      
      if (sendBtn) {
        sendBtn.disabled = false;
      }
    },

    interceptSendMessage() {
      if (!window.svtrChat) return;

      // 保存原始发送消息方法
      this.originalSendMessage = window.svtrChat.sendMessage;
      
      // 替换为带认证检查的版本
      window.svtrChat.sendMessage = () => {
        if (!this.isLoggedIn()) {
          this.showToast('请先登录以使用聊天功能', 'error');
          return;
        }
        
        // 调用原始方法
        return this.originalSendMessage.call(window.svtrChat);
      };
    },

    interceptAPICall() {
      if (!window.svtrChat) return;

      // 保存原始API调用方法
      this.originalTryRealAPIFirst = window.svtrChat.tryRealAPIFirst;
      
      // 替换为带认证头的版本
      window.svtrChat.tryRealAPIFirst = async (a, b) => {
        try {
          const authHeaders = this.getAuthHeaders();
          
          const response = await fetch(window.svtrChat.apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-session-id': window.svtrChat.sessionId,
              ...authHeaders
            },
            body: JSON.stringify({
              messages: window.svtrChat.messages.filter(e => 'system' !== e.role)
            })
          });

          if (response.status === 401) {
            const errorData = await response.json();
            if (errorData.error === 'AUTH_REQUIRED') {
              this.handleAuthError(errorData.message);
              return false;
            }
          }

          if (response.ok) {
            return window.svtrChat.handleStreamingResponse(response, b), true;
          }
        } catch (e) {
          console.log('Real API not available, using smart demo mode');
        }
        return false;
      };
    },

    handleAuthError(message) {
      console.log('🔐 认证错误，需要重新登录');
      
      // 清除认证信息
      localStorage.removeItem('svtr_user');
      localStorage.removeItem('svtr_token');
      
      // 不显示登录遮罩
      
      // 显示错误
      this.showToast(message || '登录已过期，请重新登录', 'error');
    },

    listenAuthEvents() {
      // 监听localStorage变化（跨标签页同步）
      window.addEventListener('storage', (e) => {
        if (e.key === 'svtr_user' || e.key === 'svtr_token') {
          console.log('🔄 检测到登录状态变化');
          setTimeout(() => this.checkAuthState(), 100);
        }
      });

      // 监听同一页面内的登录状态变化
      const originalSetItem = localStorage.setItem;
      const originalRemoveItem = localStorage.removeItem;
      
      localStorage.setItem = (key, value) => {
        originalSetItem.call(localStorage, key, value);
        if (key === 'svtr_user' || key === 'svtr_token') {
          setTimeout(() => {
            if (key === 'svtr_user' && value) {
              try {
                const user = JSON.parse(value);
                console.log('👤 用户登录:', user.name);
                this.hideLoginOverlay();
                // 不在聊天区显示用户信息，避免重复
                this.showToast(`欢迎回来，${user.name.split(' ')[0] || user.name}！`, 'success');
              } catch (e) {
                console.warn('解析用户信息失败:', e);
              }
            }
          }, 100);
        }
      };
      
      localStorage.removeItem = (key) => {
        originalRemoveItem.call(localStorage, key);
        if (key === 'svtr_user' || key === 'svtr_token') {
          setTimeout(() => {
            if (key === 'svtr_user') {
              console.log('👋 用户退出');
              // 用户退出时设置输入触发器，不立即显示登录遮罩
              this.setupInputTrigger();
            }
          }, 100);
        }
      };
    },

    // 引导用户到左侧登录
    openSidebarLogin() {
      // 尝试点击左侧的会员登录按钮
      const memberLoginBtn = document.querySelector('.btn-member-login');
      if (memberLoginBtn) {
        memberLoginBtn.click();
        this.showToast('已为您打开登录界面', 'info');
      } else {
        // 如果找不到按钮，显示引导信息
        this.showToast('请点击页面左上角或左侧边栏的"登录"按钮', 'info');
        
        // 尝试高亮显示登录按钮
        this.highlightLoginButton();
      }
    },

    highlightLoginButton() {
      const loginButton = document.querySelector('.btn-member-login');
      if (loginButton) {
        loginButton.style.boxShadow = '0 0 20px rgba(250, 140, 50, 0.8)';
        loginButton.style.animation = 'pulse 2s infinite';
        
        // 3秒后移除高亮
        setTimeout(() => {
          loginButton.style.boxShadow = '';
          loginButton.style.animation = '';
        }, 3000);
      }
    },

    logout() {
      // 清除认证信息
      localStorage.removeItem('svtr_user');
      localStorage.removeItem('svtr_token');
      
      // 显示退出通知
      this.showToast('已退出登录', 'info');
    },

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `chat-toast toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 0.9rem;
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      `;

      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);
    }
  };

  // 暴露到全局
  window.authIntegration = authIntegration;

  // DOM加载后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => authIntegration.init());
  } else {
    authIntegration.init();
  }

  console.log('🔗 聊天认证集成脚本已加载');
})();