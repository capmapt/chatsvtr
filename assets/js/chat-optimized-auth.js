/**
 * SVTR Chat System with Authentication
 * 支持用户登录验证的聊天系统
 */

class SVTRChatWithAuth {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.messages = [];
    this.isLoading = false;
    this.apiEndpoint = '/api/chat';
    this.sessionId = this.getOrCreateSessionId();

    // 等待认证管理器加载
    this.waitForAuth();
  }

  waitForAuth() {
    if (window.chatAuthManager) {
      this.authManager = window.chatAuthManager;
      this.init();
    } else {
      // 等待认证管理器加载
      setTimeout(() => this.waitForAuth(), 100);
    }
  }

  init() {
    if (!this.container) {
      console.error('❌ Chat container not found');
      return;
    }

    console.log('🚀 初始化认证聊天系统');
    this.setupUI();
    this.bindEvents();

    // 监听认证状态变化
    window.addEventListener('chatAuthLogin', (event) => {
      console.log('👤 用户登录，更新聊天界面');
      this.onUserLogin(event.detail);
    });

    window.addEventListener('chatAuthLogout', () => {
      console.log('👋 用户退出，重置聊天界面');
      this.onUserLogout();
    });
  }

  setupUI() {
    this.container.innerHTML = `
      <div id="chat-messages" class="chat-messages"></div>
      <div id="chat-input-container" class="chat-input-container">
        <div class="input-wrapper">
          <textarea 
            id="chat-input" 
            class="chat-input" 
            placeholder="问我关于AI创投的任何问题..."
            rows="1"
            disabled></textarea>
          <button id="chat-send-btn" class="chat-send-btn" disabled>
            <span class="send-icon">🚀</span>
            <span class="loading-spinner" style="display: none;">⏳</span>
          </button>
        </div>
        <div class="chat-actions">
          <button id="chat-clear-btn" class="chat-action-btn" disabled>🗑️ 清空对话</button>
          <button id="chat-share-btn" class="chat-action-btn" disabled>📤 分享对话</button>
        </div>
      </div>
    `;

    // 根据当前认证状态启用/禁用输入
    this.updateUIState();
  }

  updateUIState() {
    const isLoggedIn = this.authManager?.isLoggedIn();
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const clearBtn = document.getElementById('chat-clear-btn');
    const shareBtn = document.getElementById('chat-share-btn');

    if (isLoggedIn) {
      // 用户已登录，启用聊天功能
      chatInput.disabled = false;
      chatInput.placeholder = '问我关于AI创投的任何问题...';
      sendBtn.disabled = false;
      clearBtn.disabled = false;
      shareBtn.disabled = false;

      // 显示欢迎消息
      if (this.messages.length === 0) {
        this.showWelcomeMessage();
      }
    } else {
      // 用户未登录，禁用聊天功能
      chatInput.disabled = true;
      chatInput.placeholder = '请先登录以使用AI助手...';
      sendBtn.disabled = true;
      clearBtn.disabled = true;
      shareBtn.disabled = true;
    }
  }

  bindEvents() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const clearBtn = document.getElementById('chat-clear-btn');
    const shareBtn = document.getElementById('chat-share-btn');

    // 发送消息
    sendBtn?.addEventListener('click', () => this.sendMessage());

    // 回车发送（Shift+Enter换行）
    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 自动调整输入框高度
    chatInput?.addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    });

    // 清空对话
    clearBtn?.addEventListener('click', () => this.clearChat());

    // 分享对话
    shareBtn?.addEventListener('click', () => this.shareChat());
  }

  onUserLogin(userInfo) {
    this.updateUIState();
    this.showLoginSuccessMessage(userInfo.user);
  }

  onUserLogout() {
    // 清空消息记录
    this.messages = [];
    this.clearChatUI();
    this.updateUIState();
  }

  showWelcomeMessage() {
    const welcomeMessage = {
      role: 'assistant',
      content: `您好！我是凯瑞(Kerry)，SVTR的AI助手，专注于AI创投生态系统分析。

我可以为您提供：
• 最新AI创投市场动态
• 投资机构和初创公司分析  
• 行业趋势和技术评估
• 专业投资建议

请问您想了解什么？`,
      timestamp: new Date()
    };

    this.messages.push(welcomeMessage);
    this.renderMessage(welcomeMessage);
  }

  showLoginSuccessMessage(user) {
    if (this.messages.length > 0) {
      return;
    } // 避免重复显示

    const loginMessage = {
      role: 'assistant',
      content: `🎉 欢迎回来，${user.name.split(' ')[0] || user.name}！

现在您可以与我进行深度的AI创投讨论了。我已经准备好为您提供：

✨ **个性化分析** - 基于您的兴趣定制内容
📊 **实时数据** - 最新的市场动态和投资信息  
💼 **专业洞察** - 深度的行业分析和投资建议
🎯 **精准推荐** - 匹配的投资机会和合作伙伴

有什么AI创投话题想要讨论的吗？`,
      timestamp: new Date()
    };

    this.messages.push(loginMessage);
    this.renderMessage(loginMessage);
  }

  async sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const content = chatInput?.value?.trim();

    if (!content || this.isLoading) {
      return;
    }

    // 检查登录状态
    if (!this.authManager?.isLoggedIn()) {
      this.showToast('请先登录以使用聊天功能', 'error');
      return;
    }

    const userMessage = {
      role: 'user',
      content: content,
      timestamp: new Date()
    };

    // 添加用户消息
    this.messages.push(userMessage);
    this.renderMessage(userMessage);

    // 清空输入框
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // 显示加载状态
    this.setLoading(true);
    const loadingMessageEl = this.showLoadingMessage();

    try {
      // 发送到API（包含认证头）
      await this.callChatAPI(loadingMessageEl);
    } catch (error) {
      console.error('🚨 发送消息失败:', error);
      this.removeLoadingMessage(loadingMessageEl);
      this.showErrorMessage(error.message);
      this.setLoading(false);
    }
  }

  async callChatAPI(loadingMessageEl) {
    try {
      const authHeaders = this.authManager?.getAuthHeaders() || {};

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          messages: this.messages.filter(msg => msg.role !== 'system')
        })
      });

      // 检查认证错误
      if (response.status === 401) {
        const errorData = await response.json();
        if (errorData.error === 'AUTH_REQUIRED') {
          this.handleAuthError(errorData.message);
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      // 处理流式响应
      await this.handleStreamingResponse(response, loadingMessageEl);

    } catch (error) {
      console.error('🚨 API调用失败:', error);
      throw error;
    }
  }

  handleAuthError(message) {
    console.log('🔐 认证错误，需要重新登录');

    // 清除本地认证信息
    this.authManager?.logout();

    // 显示错误消息
    this.showToast(message || '登录已过期，请重新登录', 'error');

    // 移除加载消息
    const loadingMsg = document.querySelector('.loading-message');
    if (loadingMsg) {
      loadingMsg.remove();
    }

    this.setLoading(false);
  }

  async handleStreamingResponse(response, loadingMessageEl) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    let messageElement = null;
    let contentElement = null;
    let hasStarted = false;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                break;
              }

              const parsed = JSON.parse(data);
              if (parsed.response && typeof parsed.response === 'string') {
                // 首次收到响应，移除加载消息并创建回复消息
                if (!hasStarted) {
                  this.removeLoadingMessage(loadingMessageEl);
                  messageElement = this.renderMessage(assistantMessage);
                  contentElement = messageElement.querySelector('.message-content');
                  hasStarted = true;
                }

                // 累积内容
                assistantMessage.content += parsed.response;

                // 更新显示
                if (contentElement) {
                  contentElement.innerHTML = this.formatMessage(assistantMessage.content);
                  this.scrollToBottom();
                }
              }
            } catch (e) {
              console.warn('解析流数据失败:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // 保存助手回复
    if (assistantMessage.content.trim()) {
      this.messages.push(assistantMessage);
    }

    this.setLoading(false);
  }

  renderMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');

    messageEl.className = `chat-message ${message.role}`;
    messageEl.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">
          ${message.role === 'user' ? '👤' : '🤖'}
        </div>
        <div class="message-info">
          <div class="message-name">
            ${message.role === 'user' ? '您' : '凯瑞 (Kerry)'}
          </div>
          <div class="message-time">
            ${this.formatTime(message.timestamp)}
          </div>
        </div>
      </div>
      <div class="message-content">
        ${this.formatMessage(message.content)}
      </div>
    `;

    messagesContainer.appendChild(messageEl);
    this.scrollToBottom();

    return messageEl;
  }

  showLoadingMessage() {
    const messagesContainer = document.getElementById('chat-messages');
    const loadingEl = document.createElement('div');

    loadingEl.className = 'chat-message assistant loading-message';
    loadingEl.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">🤖</div>
        <div class="message-info">
          <div class="message-name">凯瑞 (Kerry)</div>
          <div class="message-time">正在思考...</div>
        </div>
      </div>
      <div class="message-content">
        <div class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(loadingEl);
    this.scrollToBottom();

    return loadingEl;
  }

  removeLoadingMessage(loadingEl) {
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
  }

  showErrorMessage(error) {
    const errorMessage = {
      role: 'assistant',
      content: `❌ 抱歉，出现了错误：${error}\n\n请稍后重试，或联系技术支持。`,
      timestamp: new Date()
    };

    this.renderMessage(errorMessage);
  }

  formatMessage(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    const sendBtn = document.getElementById('chat-send-btn');
    const sendIcon = sendBtn?.querySelector('.send-icon');
    const loadingSpinner = sendBtn?.querySelector('.loading-spinner');

    if (loading) {
      sendBtn.disabled = true;
      sendIcon.style.display = 'none';
      loadingSpinner.style.display = 'inline';
    } else {
      sendBtn.disabled = !this.authManager?.isLoggedIn();
      sendIcon.style.display = 'inline';
      loadingSpinner.style.display = 'none';
    }
  }

  clearChat() {
    if (!confirm('确定要清空所有对话吗？')) {
      return;
    }

    this.messages = [];
    this.clearChatUI();
    this.showWelcomeMessage();
  }

  clearChatUI() {
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
  }

  shareChat() {
    const chatContent = this.messages
      .map(msg => `${msg.role === 'user' ? '用户' : '凯瑞'}: ${msg.content}`)
      .join('\n\n');

    if (navigator.share) {
      navigator.share({
        title: 'SVTR AI 对话记录',
        text: chatContent
      });
    } else {
      navigator.clipboard.writeText(chatContent).then(() => {
        this.showToast('对话已复制到剪贴板', 'success');
      });
    }
  }

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

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('svtr_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('svtr_session_id', sessionId);
    }
    return sessionId;
  }
}

// 初始化聊天系统
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('svtr-chat-container')) {
    window.svtrChat = new SVTRChatWithAuth('svtr-chat-container');
    console.log('✅ SVTR认证聊天系统已初始化');
  }
});

// 导出到全局
window.SVTRChatWithAuth = SVTRChatWithAuth;
