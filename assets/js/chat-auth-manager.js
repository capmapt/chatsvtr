/**
 * ChatBot Authentication Manager
 * 聊天机器人认证管理器
 */
class ChatAuthManager {
  constructor() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    this.authOverlay = null;
    this.chatContainer = null;
    
    // 初始化
    this.init();
  }

  init() {
    console.log('🔐 初始化聊天认证管理器');
    
    // 等待DOM就绪
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupAuth());
    } else {
      this.setupAuth();
    }
  }

  setupAuth() {
    // 获取聊天容器
    this.chatContainer = document.getElementById('svtr-chat-container');
    if (!this.chatContainer) {
      console.warn('⚠️ 未找到聊天容器，等待重试...');
      setTimeout(() => this.setupAuth(), 1000);
      return;
    }

    // 设置容器样式以支持遮罩
    this.chatContainer.style.position = 'relative';
    this.chatContainer.style.minHeight = '400px';

    // 检查现有登录状态
    this.checkExistingAuth();

    // 监听存储变化（跨标签页同步）
    window.addEventListener('storage', (e) => {
      if (e.key === 'svtr_user' || e.key === 'svtr_token') {
        this.checkExistingAuth();
      }
    });

    // 监听Magic Link登录成功消息
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://svtr.ai') return;
      
      if (event.data.type === 'MAGIC_LINK_LOGIN_SUCCESS') {
        console.log('🎉 收到Magic Link登录成功消息');
        this.handleLoginSuccess(event.data.user, event.data.token);
      }
    });
  }

  checkExistingAuth() {
    try {
      const userData = localStorage.getItem('svtr_user');
      const token = localStorage.getItem('svtr_token');

      if (userData && token) {
        const user = JSON.parse(userData);
        console.log('✅ 发现现有登录状态:', user.name);
        this.handleLoginSuccess(user, token, false);
      } else {
        console.log('❌ 未找到登录状态');
        // 不自动显示登录界面，等用户点击输入框时再提示
      }
    } catch (error) {
      console.error('🚨 检查登录状态失败:', error);
      // 不自动显示登录界面，等用户点击输入框时再提示
    }
  }

  showLoginOverlay() {
    if (this.authOverlay) {
      this.authOverlay.remove();
    }

    this.authOverlay = document.createElement('div');
    this.authOverlay.className = 'chat-login-overlay';
    this.authOverlay.innerHTML = `
      <div class="chat-login-card">
        <span class="chat-login-icon">🔐</span>
        <h3 class="chat-login-title">登录解锁AI助手</h3>
        <p class="chat-login-description">
          请先登录以使用SVTR AI创投智能助手，享受专业的AI创投市场分析和投资洞察服务。
        </p>
        
        <div class="chat-login-buttons">
          <button class="chat-login-btn primary" onclick="chatAuthManager.showEmailLogin()">
            📧 邮箱验证码登录
          </button>
          <button class="chat-login-btn secondary" onclick="chatAuthManager.showMagicLinkLogin()">
            🔗 Magic Link登录
          </button>
        </div>

        <div class="chat-login-features">
          <h4>专属功能</h4>
          <div class="chat-login-feature-list">
            <div class="chat-login-feature-item">
              <span class="chat-login-feature-icon">✨</span>
              个性化AI创投分析
            </div>
            <div class="chat-login-feature-item">
              <span class="chat-login-feature-icon">📊</span>
              实时市场数据查询
            </div>
            <div class="chat-login-feature-item">
              <span class="chat-login-feature-icon">💼</span>
              投资机会挖掘
            </div>
            <div class="chat-login-feature-item">
              <span class="chat-login-feature-icon">🎯</span>
              精准投资建议
            </div>
          </div>
        </div>
      </div>
    `;

    this.chatContainer.appendChild(this.authOverlay);
  }

  showEmailLogin() {
    const email = prompt('请输入您的邮箱地址:');
    if (!email || !this.isValidEmail(email)) {
      alert('请输入有效的邮箱地址');
      return;
    }

    this.sendVerificationCode(email);
  }

  showMagicLinkLogin() {
    const email = prompt('请输入您的邮箱地址，我们将发送登录链接:');
    if (!email || !this.isValidEmail(email)) {
      alert('请输入有效的邮箱地址');
      return;
    }

    this.sendMagicLink(email);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async sendVerificationCode(email) {
    try {
      console.log('📧 发送验证码到:', email);
      
      // 显示加载状态
      this.showLoadingState('正在发送验证码...');

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_code',
          email: email,
          language: 'zh-CN'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 验证码发送成功');
        this.showCodeVerification(email);
      } else {
        alert(result.message || '验证码发送失败');
        // 不显示登录遮罩
      }
    } catch (error) {
      console.error('🚨 发送验证码失败:', error);
      alert('网络错误，请稍后重试');
      // 不显示登录遮罩
    }
  }

  async sendMagicLink(email) {
    try {
      console.log('🔗 发送Magic Link到:', email);
      
      // 显示加载状态
      this.showLoadingState('正在发送登录链接...');

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_magic_link',
          email: email,
          language: 'zh-CN'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Magic Link发送成功');
        this.showMagicLinkSent(email);
      } else {
        alert(result.message || 'Magic Link发送失败');
        // 不显示登录遮罩
      }
    } catch (error) {
      console.error('🚨 发送Magic Link失败:', error);
      alert('网络错误，请稍后重试');
      // 不显示登录遮罩
    }
  }

  showLoadingState(message) {
    if (this.authOverlay) {
      this.authOverlay.innerHTML = `
        <div class="chat-login-card">
          <span class="chat-login-icon">⏳</span>
          <h3 class="chat-login-title">请稍候</h3>
          <p class="chat-login-description">${message}</p>
          <div style="margin: 2rem 0;">
            <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #FA8C32; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          </div>
        </div>
      `;
    }
  }

  showCodeVerification(email) {
    if (this.authOverlay) {
      this.authOverlay.innerHTML = `
        <div class="chat-login-card">
          <span class="chat-login-icon">📧</span>
          <h3 class="chat-login-title">请输入验证码</h3>
          <p class="chat-login-description">
            我们已发送6位验证码到 <strong>${email}</strong><br>
            验证码5分钟内有效
          </p>
          
          <div style="margin: 2rem 0;">
            <input type="text" 
                   id="verification-code" 
                   placeholder="请输入6位验证码"
                   style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1.1rem; text-align: center; letter-spacing: 2px;"
                   maxlength="6">
          </div>
          
          <div class="chat-login-buttons">
            <button class="chat-login-btn primary" onclick="chatAuthManager.verifyCode('${email}')">
              ✅ 验证登录
            </button>
            <button class="chat-login-btn secondary" onclick="chatAuthManager.showLoginOverlay()">
              ← 返回登录选项
            </button>
          </div>
        </div>
      `;

      // 自动聚焦到验证码输入框
      setTimeout(() => {
        const codeInput = document.getElementById('verification-code');
        if (codeInput) {
          codeInput.focus();
          
          // 回车键快速验证
          codeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
              this.verifyCode(email);
            }
          });
        }
      }, 100);
    }
  }

  showMagicLinkSent(email) {
    if (this.authOverlay) {
      this.authOverlay.innerHTML = `
        <div class="chat-login-card">
          <span class="chat-login-icon">📮</span>
          <h3 class="chat-login-title">登录链接已发送</h3>
          <p class="chat-login-description">
            我们已发送登录链接到 <strong>${email}</strong><br>
            请检查您的邮箱并点击链接完成登录<br>
            <small style="color: #888;">链接10分钟内有效</small>
          </p>
          
          <div class="chat-login-buttons" style="margin-top: 2rem;">
            <button class="chat-login-btn secondary" onclick="chatAuthManager.showLoginOverlay()">
              ← 返回登录选项
            </button>
          </div>
          
          <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #f0f0f0; font-size: 0.9rem; color: #666;">
            💡 提示：请检查垃圾邮件文件夹，如果没有收到邮件，请稍后重试
          </div>
        </div>
      `;
    }
  }

  async verifyCode(email) {
    const codeInput = document.getElementById('verification-code');
    const code = codeInput?.value?.trim();

    if (!code) {
      alert('请输入验证码');
      return;
    }

    if (code.length !== 6) {
      alert('请输入6位验证码');
      return;
    }

    try {
      console.log('🔍 验证验证码:', email, code);
      
      // 显示加载状态
      this.showLoadingState('正在验证登录...');

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_code',
          email: email,
          code: code
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('🎉 验证码验证成功');
        this.handleLoginSuccess(result.data.user, result.data.token);
      } else {
        alert(result.message || '验证码错误或已过期');
        this.showCodeVerification(email);
      }
    } catch (error) {
      console.error('🚨 验证失败:', error);
      alert('网络错误，请稍后重试');
      this.showCodeVerification(email);
    }
  }

  handleLoginSuccess(user, token, showNotification = true) {
    console.log('🎉 登录成功:', user);
    
    // 保存用户信息和token
    this.user = user;
    this.token = token;
    this.isAuthenticated = true;

    // 存储到localStorage
    localStorage.setItem('svtr_user', JSON.stringify(user));
    localStorage.setItem('svtr_token', token);

    // 移除登录遮罩
    if (this.authOverlay) {
      this.authOverlay.remove();
      this.authOverlay = null;
    }

    // 显示用户信息
    this.showUserInfo();

    // 显示成功通知
    if (showNotification) {
      this.showToast(`欢迎回来，${user.name.split(' ')[0] || user.name}！`, 'success');
    }

    // 触发自定义事件，通知其他组件用户已登录
    window.dispatchEvent(new CustomEvent('chatAuthLogin', {
      detail: { user, token }
    }));
  }

  showUserInfo() {
    const userInfo = document.createElement('div');
    userInfo.className = 'chat-user-info';
    userInfo.innerHTML = `
      <img src="${this.user.avatar}" alt="用户头像" class="chat-user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(this.user.name)}&background=FA8C32&color=fff'">
      <div class="chat-user-details">
        <p class="chat-user-name">${this.user.name}</p>
        <p class="chat-user-email">${this.user.email}</p>
      </div>
      <button class="chat-logout-btn" onclick="chatAuthManager.logout()">退出</button>
    `;

    // 插入到聊天容器顶部
    this.chatContainer.insertBefore(userInfo, this.chatContainer.firstChild);
  }

  logout() {
    console.log('👋 用户退出登录');
    
    // 清除用户信息
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;

    // 清除localStorage
    localStorage.removeItem('svtr_user');
    localStorage.removeItem('svtr_token');

    // 移除用户信息显示
    const userInfo = this.chatContainer.querySelector('.chat-user-info');
    if (userInfo) {
      userInfo.remove();
    }

    // 不显示登录遮罩

    // 显示退出通知
    this.showToast('已退出登录', 'info');

    // 触发自定义事件，通知其他组件用户已退出
    window.dispatchEvent(new CustomEvent('chatAuthLogout'));
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `chat-toast chat-toast-${type}`;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      z-index: 9999;
      animation: slideInRight 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    // 3秒后自动移除
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // 获取当前用户信息
  getCurrentUser() {
    return this.user;
  }

  // 获取当前token
  getCurrentToken() {
    return this.token;
  }

  // 检查是否已登录
  isLoggedIn() {
    return this.isAuthenticated;
  }

  // 获取认证头部（供API调用使用）
  getAuthHeaders() {
    if (!this.token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.token}`,
      'X-User-ID': this.user?.id || ''
    };
  }
}

// 创建全局实例
window.chatAuthManager = new ChatAuthManager();

// 添加必要的CSS动画
if (!document.querySelector('#chat-auth-animations')) {
  const style = document.createElement('style');
  style.id = 'chat-auth-animations';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

console.log('🚀 聊天认证管理器已加载');