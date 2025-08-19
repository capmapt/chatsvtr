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
          <h3>${currentLang === 'zh-CN' ? '👤 会员登录' : '👤 Member Login'}</h3>
          <button class="modal-close" onclick="this.closest('.user-action-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="login-tabs">
            <button class="tab-btn active" data-tab="email">${currentLang === 'zh-CN' ? '邮箱登录' : 'Email Login'}</button>
            <button class="tab-btn" data-tab="wechat">${currentLang === 'zh-CN' ? '微信登录' : 'WeChat Login'}</button>
          </div>
          
          <div class="tab-content active" data-tab="email">
            <form class="login-form">
              <input type="email" placeholder="${currentLang === 'zh-CN' ? '邮箱地址' : 'Email Address'}" required>
              <input type="password" placeholder="${currentLang === 'zh-CN' ? '密码' : 'Password'}" required>
              <button type="submit" class="btn-primary">
                ${currentLang === 'zh-CN' ? '登录' : 'Login'}
              </button>
            </form>
            <div class="login-links">
              <a href="#" class="forgot-password">${currentLang === 'zh-CN' ? '忘记密码？' : 'Forgot Password?'}</a>
              <a href="#" class="register-link">${currentLang === 'zh-CN' ? '还没有账户？立即注册' : 'No account? Register now'}</a>
            </div>
          </div>
          
          <div class="tab-content" data-tab="wechat">
            <div class="wechat-login">
              <div class="qr-placeholder">
                <div class="qr-icon">📱</div>
                <p>${currentLang === 'zh-CN' ? '微信扫码登录' : 'Scan with WeChat'}</p>
                <small>${currentLang === 'zh-CN' ? '功能开发中，敬请期待' : 'Coming Soon'}</small>
              </div>
            </div>
          </div>
          
          <div class="member-benefits">
            <h4>${currentLang === 'zh-CN' ? '会员专享' : 'Member Benefits'}</h4>
            <ul>
              <li>📊 ${currentLang === 'zh-CN' ? '高级数据分析报告' : 'Advanced Data Analytics'}</li>
              <li>🎯 ${currentLang === 'zh-CN' ? '个性化投资机会推送' : 'Personalized Investment Opportunities'}</li>
              <li>🤝 ${currentLang === 'zh-CN' ? '专属社群和活动' : 'Exclusive Community & Events'}</li>
              <li>💼 ${currentLang === 'zh-CN' ? '一对一咨询服务' : '1-on-1 Consultation Services'}</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定标签切换事件
    this.bindTabSwitching(modal);
    
    // 绑定登录表单提交事件
    const form = modal.querySelector('.login-form');
    form.addEventListener('submit', (e) => this.handleLoginSubmit(e, modal));
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