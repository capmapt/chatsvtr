/**
 * SVTR用户操作管理器
 * 处理邮件订阅和会员登录功能
 */

class SVTRUserActions {
  constructor() {
    this.emailSubscribeBtn = null;
    this.memberLoginBtn = null;
    this.init();
  }

  init() {
    this.bindElements();
    this.bindEvents();
    this.checkAuthCallback();
    this.checkExistingLogin();
  }

  bindElements() {
    this.emailSubscribeBtn = document.querySelector('.btn-email-subscribe');
    this.memberLoginBtn = document.querySelector('.btn-member-login');
  }

  bindEvents() {
    if (this.emailSubscribeBtn) {
      this.emailSubscribeBtn.addEventListener('click', (e) => this.handleEmailSubscribe(e));
    }
    
    if (this.memberLoginBtn) {
      this.memberLoginBtn.addEventListener('click', (e) => this.handleMemberLogin(e));
    }
  }

  /**
   * 处理邮件订阅
   */
  async handleEmailSubscribe(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    try {
      // 添加加载状态
      this.setButtonLoading(button, true);
      
      // 显示邮件订阅弹窗
      this.showEmailSubscribeModal();
      
    } catch (error) {
      console.error('邮件订阅处理失败:', error);
      this.showToast('订阅服务暂时不可用，请稍后重试', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  /**
   * 处理会员登录
   */
  async handleMemberLogin(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    try {
      // 添加加载状态
      this.setButtonLoading(button, true);
      
      // 显示会员登录弹窗
      this.showMemberLoginModal();
      
    } catch (error) {
      console.error('会员登录处理失败:', error);
      this.showToast('登录服务暂时不可用，请稍后重试', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  /**
   * 显示邮件订阅弹窗
   */
  showEmailSubscribeModal() {
    const currentLang = this.getCurrentLang();
    
    const modal = document.createElement('div');
    modal.className = 'user-action-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>${currentLang === 'zh-CN' ? '📧 订阅AI周报' : '📧 Subscribe to AI Weekly'}</h3>
          <button class="modal-close" onclick="this.closest('.user-action-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <p>${currentLang === 'zh-CN' 
            ? '订阅SVTR AI周报，获取最新AI创投动态、市场分析和投资机会洞察。' 
            : 'Subscribe to SVTR AI Weekly for latest AI VC trends, market analysis and investment insights.'}</p>
          <form class="subscribe-form">
            <input type="email" 
                   placeholder="${currentLang === 'zh-CN' ? '请输入您的邮箱地址' : 'Enter your email address'}" 
                   required>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" checked>
                <span>${currentLang === 'zh-CN' ? 'AI周报（每周一期）' : 'AI Weekly Report'}</span>
              </label>
              <label>
                <input type="checkbox" checked>
                <span>${currentLang === 'zh-CN' ? '市场洞察（重要事件推送）' : 'Market Insights'}</span>
              </label>
              <label>
                <input type="checkbox">
                <span>${currentLang === 'zh-CN' ? '产品更新（新功能通知）' : 'Product Updates'}</span>
              </label>
            </div>
            <button type="submit" class="btn-primary">
              ${currentLang === 'zh-CN' ? '立即订阅' : 'Subscribe Now'}
            </button>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定表单提交事件
    const form = modal.querySelector('.subscribe-form');
    form.addEventListener('submit', (e) => this.handleSubscribeSubmit(e, modal));
  }

  /**
   * 显示会员登录弹窗
   */
  showMemberLoginModal() {
    const currentLang = this.getCurrentLang();
    
    const modal = document.createElement('div');
    modal.className = 'user-action-modal';
    modal.innerHTML = `
      <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>${currentLang === 'zh-CN' ? '🚀 登录 SVTR' : '🚀 Login to SVTR'}</h3>
          <button class="modal-close" onclick="this.closest('.user-action-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <!-- 社交登录按钮 -->
          <div class="social-login-section">
            <div class="social-login-buttons">
              <button class="btn-oauth btn-google" onclick="window.open('/api/auth/google', '_self')">
                <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 8px;">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                ${currentLang === 'zh-CN' ? '使用 Google 登录' : 'Continue with Google'}
              </button>
              
              <button class="btn-oauth btn-github" onclick="window.open('/api/auth/github', '_self')">
                <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right: 8px;">
                  <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                ${currentLang === 'zh-CN' ? '使用 GitHub 登录' : 'Continue with GitHub'}
              </button>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="login-divider">
            <span>${currentLang === 'zh-CN' ? '或' : 'or'}</span>
          </div>

          <!-- 邮箱验证码登录 -->
          <div class="email-login-section">
            <div class="login-method-tabs">
              <button class="method-tab active" data-method="code">
                📧 ${currentLang === 'zh-CN' ? '验证码登录' : 'Email Code'}
              </button>
              <button class="method-tab" data-method="magic">
                🔗 ${currentLang === 'zh-CN' ? 'Magic Link' : 'Magic Link'}
              </button>
            </div>

            <!-- 验证码登录 -->
            <div class="login-method-content active" data-method="code">
              <form class="email-code-form">
                <div class="input-group">
                  <input type="email" placeholder="${currentLang === 'zh-CN' ? '输入邮箱地址' : 'Enter email address'}" required>
                  <button type="button" class="btn-send-code">
                    ${currentLang === 'zh-CN' ? '发送验证码' : 'Send Code'}
                  </button>
                </div>
                <div class="verification-input" style="display: none;">
                  <input type="text" placeholder="${currentLang === 'zh-CN' ? '输入6位验证码' : 'Enter 6-digit code'}" maxlength="6" class="code-input">
                  <button type="submit" class="btn-primary btn-verify">
                    ${currentLang === 'zh-CN' ? '验证登录' : 'Verify & Login'}
                  </button>
                </div>
              </form>
            </div>

            <!-- Magic Link登录 -->
            <div class="login-method-content" data-method="magic">
              <form class="magic-link-form">
                <div class="input-group">
                  <input type="email" placeholder="${currentLang === 'zh-CN' ? '输入邮箱地址' : 'Enter email address'}" required>
                  <button type="submit" class="btn-send-magic">
                    ${currentLang === 'zh-CN' ? '发送登录链接' : 'Send Magic Link'}
                  </button>
                </div>
                <div class="magic-link-sent" style="display: none;">
                  <div class="success-message">
                    <div class="success-icon">✅</div>
                    <p>${currentLang === 'zh-CN' ? '登录链接已发送到您的邮箱' : 'Magic link sent to your email'}</p>
                    <small>${currentLang === 'zh-CN' ? '请查看邮箱并点击链接登录' : 'Check your email and click the link to login'}</small>
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <!-- 会员权益说明 -->
          <div class="member-benefits">
            <h4>${currentLang === 'zh-CN' ? '🎯 会员专享权益' : '🎯 Member Benefits'}</h4>
            <ul>
              <li>📊 ${currentLang === 'zh-CN' ? '高级数据分析报告' : 'Advanced Analytics Reports'}</li>
              <li>🎯 ${currentLang === 'zh-CN' ? '个性化投资机会推送' : 'Personalized Investment Opportunities'}</li>
              <li>🤝 ${currentLang === 'zh-CN' ? '专属社群和活动' : 'Exclusive Community & Events'}</li>
              <li>💼 ${currentLang === 'zh-CN' ? '一对一咨询服务' : '1-on-1 Consultation Services'}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定新的登录事件
    this.bindNewLoginEvents(modal);
  }

  /**
   * 绑定新登录界面的事件
   */
  bindNewLoginEvents(modal) {
    // 绑定登录方式切换
    const methodTabs = modal.querySelectorAll('.method-tab');
    const methodContents = modal.querySelectorAll('.login-method-content');
    
    methodTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const method = tab.dataset.method;
        
        // 更新标签状态
        methodTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // 更新内容显示
        methodContents.forEach(content => {
          content.classList.remove('active');
          if (content.dataset.method === method) {
            content.classList.add('active');
          }
        });
      });
    });
    
    // 绑定邮箱验证码登录
    const emailCodeForm = modal.querySelector('.email-code-form');
    const sendCodeBtn = modal.querySelector('.btn-send-code');
    const verificationInput = modal.querySelector('.verification-input');
    const codeInput = modal.querySelector('.code-input');
    
    sendCodeBtn.addEventListener('click', async () => {
      const emailInput = emailCodeForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!email || !this.isValidEmail(email)) {
        this.showToast('请输入有效的邮箱地址', 'error');
        return;
      }
      
      try {
        this.setButtonLoading(sendCodeBtn, true);
        
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_code',
            email: email
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.showToast('验证码已发送到您的邮箱', 'success');
          emailInput.disabled = true;
          verificationInput.style.display = 'block';
          sendCodeBtn.textContent = '已发送';
          sendCodeBtn.disabled = true;
          
          // 60秒倒计时
          this.startCountdown(sendCodeBtn, 60);
        } else {
          this.showToast(result.message || '验证码发送失败', 'error');
        }
        
      } catch (error) {
        console.error('发送验证码失败:', error);
        this.showToast('发送失败，请重试', 'error');
      } finally {
        this.setButtonLoading(sendCodeBtn, false);
      }
    });
    
    // 验证码输入自动格式化
    codeInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, ''); // 只允许数字
      if (e.target.value.length === 6) {
        // 自动验证
        emailCodeForm.dispatchEvent(new Event('submit'));
      }
    });
    
    // 绑定验证码验证
    emailCodeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = emailCodeForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      const code = codeInput.value.trim();
      
      if (!code || code.length !== 6) {
        this.showToast('请输入6位验证码', 'error');
        return;
      }
      
      try {
        const verifyBtn = modal.querySelector('.btn-verify');
        this.setButtonLoading(verifyBtn, true);
        
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'verify_code',
            email: email,
            code: code
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.handleLoginSuccess(result.data, modal);
        } else {
          this.showToast(result.message || '验证码错误', 'error');
        }
        
      } catch (error) {
        console.error('验证登录失败:', error);
        this.showToast('登录失败，请重试', 'error');
      }
    });
    
    // 绑定Magic Link发送
    const magicLinkForm = modal.querySelector('.magic-link-form');
    magicLinkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const emailInput = magicLinkForm.querySelector('input[type="email"]');
      const email = emailInput.value.trim();
      
      if (!email || !this.isValidEmail(email)) {
        this.showToast('请输入有效的邮箱地址', 'error');
        return;
      }
      
      try {
        const sendMagicBtn = modal.querySelector('.btn-send-magic');
        this.setButtonLoading(sendMagicBtn, true);
        
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_magic_link',
            email: email
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.showToast('登录链接已发送', 'success');
          
          // 显示发送成功状态
          const inputGroup = magicLinkForm.querySelector('.input-group');
          const sentMessage = magicLinkForm.querySelector('.magic-link-sent');
          
          inputGroup.style.display = 'none';
          sentMessage.style.display = 'block';
        } else {
          this.showToast(result.message || 'Magic Link发送失败', 'error');
        }
        
      } catch (error) {
        console.error('发送Magic Link失败:', error);
        this.showToast('发送失败，请重试', 'error');
      } finally {
        this.setButtonLoading(sendMagicBtn, false);
      }
    });
  }
  
  /**
   * 处理登录成功
   */
  handleLoginSuccess(data, modal) {
    const { user, token } = data;
    
    // 保存用户信息和token
    localStorage.setItem('svtr_user', JSON.stringify(user));
    localStorage.setItem('svtr_token', token);
    
    // 显示成功消息
    this.showToast(`欢迎回来，${user.name}！`, 'success');
    
    // 关闭模态框
    modal.remove();
    
    // 更新按钮状态
    this.setButtonSuccess(this.memberLoginBtn);
    this.memberLoginBtn.innerHTML = `
      <img src="${user.avatar}" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;">
      ${user.name}
    `;
    
    // 触发登录成功事件
    this.trackLoginEvent('login_success', user.email, user.provider);
    
    // 检查页面URL中是否有认证回调参数
    this.checkAuthCallback();
  }
  
  /**
   * 检查OAuth认证回调
   */
  checkAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('auth_success') === 'true') {
      const token = urlParams.get('token');
      const userStr = urlParams.get('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          
          // 保存用户信息
          localStorage.setItem('svtr_user', JSON.stringify(user));
          localStorage.setItem('svtr_token', token);
          
          // 显示成功消息
          this.showToast(`欢迎，${user.name}！`, 'success');
          
          // 更新UI
          this.updateLoginUI(user);
          
          // 清理URL参数
          window.history.replaceState({}, '', window.location.pathname);
          
        } catch (error) {
          console.error('解析OAuth回调数据失败:', error);
        }
      }
    }
    
    if (urlParams.get('auth_error')) {
      const error = urlParams.get('auth_error');
      this.showToast('登录失败: ' + error, 'error');
      
      // 清理URL参数
      window.history.replaceState({}, '', window.location.pathname);
    }
  }
  
  /**
   * 更新登录UI状态
   */
  updateLoginUI(user) {
    if (this.memberLoginBtn) {
      this.setButtonSuccess(this.memberLoginBtn);
      this.memberLoginBtn.innerHTML = `
        <img src="${user.avatar}" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;">
        ${user.name}
      `;
    }
  }
  
  /**
   * 验证邮箱格式
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * 开始倒计时
   */
  startCountdown(button, seconds) {
    let remaining = seconds;
    const originalText = button.textContent;
    
    const timer = setInterval(() => {
      button.textContent = `重新发送 (${remaining}s)`;
      remaining--;
      
      if (remaining < 0) {
        clearInterval(timer);
        button.textContent = originalText;
        button.disabled = false;
      }
    }, 1000);
  }
  
  /**
   * 检查现有登录状态
   */
  checkExistingLogin() {
    const userStr = localStorage.getItem('svtr_user');
    const token = localStorage.getItem('svtr_token');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        this.updateLoginUI(user);
        console.log('检测到已登录用户:', user.name);
      } catch (error) {
        console.error('解析已登录用户信息失败:', error);
        // 清理无效数据
        localStorage.removeItem('svtr_user');
        localStorage.removeItem('svtr_token');
      }
    }
  }
  
  /**
   * 跟踪登录事件
   */
  trackLoginEvent(event, email, provider) {
    try {
      // 可以集成Google Analytics或其他分析工具
      console.log('登录事件:', { event, email, provider, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('事件跟踪失败:', error);
    }
  }
  
  /**
   * 处理订阅表单提交
   */
  async handleSubscribeSubmit(event, modal) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const checkboxes = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.nextElementSibling.textContent);
    
    try {
      // 调用真实的订阅API
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          preferences: checkboxes,
          language: this.getCurrentLang()
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        const currentLang = this.getCurrentLang();
        const successMessage = currentLang === 'zh-CN' 
          ? '订阅成功！欢迎加入SVTR社区' 
          : 'Successfully subscribed! Welcome to SVTR community';
        
        this.showToast(successMessage, 'success');
        modal.remove();
        
        // 标记按钮为成功状态
        this.setButtonSuccess(this.emailSubscribeBtn);
        
        // 记录成功事件
        this.trackSubscriptionEvent('subscribe_success', email);
      } else {
        throw new Error(result.message || '订阅失败');
      }
      
    } catch (error) {
      console.error('订阅失败:', error);
      const currentLang = this.getCurrentLang();
      const errorMessage = currentLang === 'zh-CN' 
        ? '订阅失败，请稍后重试' 
        : 'Subscription failed, please try again later';
      
      this.showToast(errorMessage, 'error');
      
      // 记录失败事件
      this.trackSubscriptionEvent('subscribe_error', email, error.message);
    }
  }

  /**
   * 处理登录表单提交
   */
  async handleLoginSubmit(event, modal) {
    event.preventDefault();
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;
    
    try {
      // 模拟API调用
      await this.simulateAPICall();
      
      this.showToast('登录成功！', 'success');
      modal.remove();
      
      // 标记按钮为成功状态并更新文本
      this.setButtonSuccess(this.memberLoginBtn);
      
    } catch (error) {
      this.showToast('登录失败，请检查邮箱和密码', 'error');
    }
  }

  /**
   * 绑定标签切换功能
   */
  bindTabSwitching(modal) {
    const tabBtns = modal.querySelectorAll('.tab-btn');
    const tabContents = modal.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // 更新按钮状态
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // 更新内容显示
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.dataset.tab === targetTab) {
            content.classList.add('active');
          }
        });
      });
    });
  }

  /**
   * 设置按钮加载状态
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  /**
   * 设置按钮成功状态
   */
  setButtonSuccess(button) {
    button.classList.add('success');
    setTimeout(() => {
      button.classList.remove('success');
    }, 2000);
  }

  /**
   * 显示提示消息
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 订阅事件追踪
   */
  trackSubscriptionEvent(eventType, email, error = null) {
    try {
      // 简单的事件追踪，不记录敏感信息
      const eventData = {
        type: eventType,
        timestamp: new Date().toISOString(),
        emailDomain: email ? email.split('@')[1] : null,
        language: this.getCurrentLang(),
        userAgent: navigator.userAgent.substring(0, 100),
        error: error
      };
      
      // 可以发送到分析服务或记录到本地存储
      console.log('订阅事件:', eventData);
      
      // 未来可以集成Google Analytics、Mixpanel等
      if (typeof gtag !== 'undefined') {
        gtag('event', eventType, {
          event_category: 'subscription',
          event_label: eventData.emailDomain
        });
      }
    } catch (error) {
      console.warn('事件追踪失败:', error);
    }
  }

  /**
   * 获取当前语言
   */
  getCurrentLang() {
    if (window.i18n && window.i18n.getCurrentLanguage) {
      return window.i18n.getCurrentLanguage();
    }
    
    const btnZh = document.getElementById('btnZh');
    if (btnZh && btnZh.classList.contains('active')) {
      return 'zh-CN';
    }
    
    return 'en';
  }
}

// 初始化用户操作管理器
document.addEventListener('DOMContentLoaded', () => {
  window.svtrUserActions = new SVTRUserActions();
});