/**
 * SVTR.AI Enhanced Chat Client
 * 2025年优化版 - 支持结构化流式响应 + 智能UI
 */

class SVTREnhancedChat {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.messages = [];
    this.isLoading = false;
    this.isThinking = false;
    this.apiEndpoint = '/api/chat';
    this.sessionId = this.getOrCreateSessionId();
    this.streamingStats = { chunks: 0, thinkingSteps: 0, sources: 0 };

    this.init();
  }

  /**
   * 初始化增强聊天界面
   */
  init() {
    this.createEnhancedChatInterface();
    this.bindEvents();
    this.setupTextareaAutoResize();
    this.addWelcomeMessage();
    this.initializeThemes();
  }

  /**
   * 创建增强的聊天界面
   */
  createEnhancedChatInterface() {
    this.container.innerHTML = `
      <div class="svtr-enhanced-chat-container">
        <!-- 思考状态显示区 -->
        <div class="svtr-thinking-overlay" id="svtr-thinking-overlay" style="display: none;">
          <div class="thinking-content">
            <div class="thinking-icon">🧠</div>
            <div class="thinking-text" id="thinking-text">正在思考...</div>
            <div class="thinking-progress">
              <div class="progress-bar" id="thinking-progress"></div>
            </div>
          </div>
        </div>

        <!-- 消息区域 -->
        <div class="svtr-chat-messages" id="svtr-chat-messages">
          <!-- 消息将在这里显示 -->
        </div>
        
        <!-- 输入区域 -->
        <div class="svtr-chat-input-area">
          <div class="svtr-chat-input-container">
            <textarea 
              id="svtr-chat-input" 
              data-testid="chat-input"
              placeholder="问我关于AI创投的任何问题..."
              maxlength="1000"
              rows="1"
            ></textarea>
            <button id="svtr-chat-send" data-testid="chat-send" class="svtr-chat-send-btn">
              <span class="send-icon">↑</span>
            </button>
          </div>
          
          <!-- 增强功能按钮区 -->
          <div class="svtr-chat-actions">
            <button id="svtr-share-btn" class="svtr-action-btn" style="display: none;">
              <span>📤</span> 分享
            </button>
            <button id="svtr-clear-btn" class="svtr-action-btn">
              <span>🗑</span> 清空
            </button>
            <button id="svtr-stats-btn" class="svtr-action-btn" title="查看统计">
              <span>📊</span>
            </button>
          </div>
        </div>

        <!-- 统计面板 -->
        <div class="svtr-stats-panel" id="svtr-stats-panel" style="display: none;">
          <div class="stats-content">
            <h4>📊 对话统计</h4>
            <div id="stats-data"></div>
            <button onclick="document.getElementById('svtr-stats-panel').style.display='none'">关闭</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 增强的流式响应处理器
   */
  async handleEnhancedStreamingResponse(response, loadingElement) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const message = { role: 'assistant', content: '', timestamp: new Date(), sources: [] };

    let messageElement = null;
    let contentElement = null;
    let hasRendered = false;
    // const thinkingShown = false; // 暂时未使用

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
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') {
                break;
              }

              const data = JSON.parse(dataStr);

              // 处理不同类型的流式数据
              switch (data.type) {
              case 'thinking':
                await this.handleThinkingChunk(data);
                break;

              case 'content':
                if (!hasRendered) {
                  this.removeLoadingMessage(loadingElement);
                  this.hideThinking();
                  messageElement = this.renderMessage(message);
                  contentElement = messageElement.querySelector('.message-content');
                  hasRendered = true;
                }
                await this.handleContentChunk(data, message, contentElement);
                break;

              case 'sources':
                await this.handleSourcesChunk(data, message, messageElement);
                break;

              case 'metadata':
                this.handleMetadataChunk(data);
                break;

              default:
                // 兼容旧格式
                if (data.response) {
                  if (!hasRendered) {
                    this.removeLoadingMessage(loadingElement);
                    this.hideThinking();
                    messageElement = this.renderMessage(message);
                    contentElement = messageElement.querySelector('.message-content');
                    hasRendered = true;
                  }
                  message.content += data.response;
                  contentElement.innerHTML = this.formatMessage(message.content);
                  this.scrollToBottom();
                }
              }
            } catch (e) {
              console.debug('解析流式数据失败:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      this.hideThinking();
    }

    // 添加消息到历史
    if (message.content.trim()) {
      this.messages.push(message);
      this.showShareButton();
      this.updateStats();
    }

    this.setLoading(false);
  }

  /**
   * 处理思考阶段数据
   */
  async handleThinkingChunk(data) {
    this.streamingStats.thinkingSteps++;

    const overlay = document.getElementById('svtr-thinking-overlay');
    const textElement = document.getElementById('thinking-text');
    const progressElement = document.getElementById('thinking-progress');

    overlay.style.display = 'flex';
    textElement.textContent = data.data;

    if (data.metadata && data.metadata.progress) {
      progressElement.style.width = (data.metadata.progress * 100) + '%';
    }

    // 添加打字机效果
    await this.typewriterEffect(textElement, data.data, 50);
  }

  /**
   * 处理内容数据
   */
  async handleContentChunk(data, message, contentElement) {
    this.streamingStats.chunks++;

    const response = data.data?.response || data.data;
    message.content += response;

    // 智能格式化内容
    const formattedContent = this.formatMessage(message.content);
    contentElement.innerHTML = formattedContent;

    // 添加置信度指示器
    if (data.metadata?.confidence) {
      this.updateConfidenceIndicator(contentElement, data.metadata.confidence);
    }

    requestAnimationFrame(() => this.scrollToBottom());
  }

  /**
   * 处理源信息数据
   */
  async handleSourcesChunk(data, message, messageElement) {
    this.streamingStats.sources++;
    message.sources = data.data.sources;

    // 在消息末尾添加源信息
    const sourcesElement = document.createElement('div');
    sourcesElement.className = 'message-sources';
    sourcesElement.innerHTML = this.formatSources(data.data);

    messageElement.appendChild(sourcesElement);
    this.scrollToBottom();
  }

  /**
   * 处理元数据
   */
  handleMetadataChunk(data) {
    console.log('📊 元数据:', data);
  }

  /**
   * 隐藏思考覆盖层
   */
  hideThinking() {
    const overlay = document.getElementById('svtr-thinking-overlay');
    overlay.style.display = 'none';
  }

  /**
   * 打字机效果
   */
  async typewriterEffect(element, text, speed = 50) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
      element.textContent += text.charAt(i);
      await this.sleep(speed);
    }
  }

  /**
   * 更新置信度指示器
   */
  updateConfidenceIndicator(element, confidence) {
    let indicator = element.querySelector('.confidence-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'confidence-indicator';
      element.appendChild(indicator);
    }

    const percentage = Math.round(confidence * 100);
    indicator.innerHTML = `<span class="confidence-badge" data-confidence="${confidence}">置信度: ${percentage}%</span>`;
  }

  /**
   * 格式化源信息
   */
  formatSources(sourcesData) {
    if (!sourcesData.sources || sourcesData.sources.length === 0) {
      return '';
    }

    const sourcesList = sourcesData.sources.map(source =>
      `<li><strong>${source.title}</strong> (置信度: ${Math.round((source.confidence || 0.8) * 100)}%)</li>`
    ).join('');

    return `
      <div class="sources-section">
        <h5>📚 数据来源:</h5>
        <ul class="sources-list">${sourcesList}</ul>
        <small class="sources-meta">
          共检索 ${sourcesData.totalMatches} 条记录 | 
          用时 ${sourcesData.searchTime || 0}ms
        </small>
      </div>
    `;
  }

  /**
   * 发送消息 - 增强版
   */
  async sendMessage() {
    const input = document.getElementById('svtr-chat-input');
    const query = input.value.trim();

    if (!query || this.isLoading) {
      return;
    }

    // 添加用户消息
    const userMessage = { role: 'user', content: query, timestamp: new Date };
    this.messages.push(userMessage);
    this.renderMessage(userMessage);

    // 清空输入
    input.value = '';
    input.style.height = '44px';

    this.setLoading(true);

    // 显示加载状态
    const loadingElement = this.showLoadingMessage();

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': this.sessionId
        },
        body: JSON.stringify({
          messages: this.messages.filter(m => m.role !== 'system')
        })
      });

      if (response.ok) {
        await this.handleEnhancedStreamingResponse(response, loadingElement);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      this.removeLoadingMessage(loadingElement);
      this.showErrorMessage('抱歉，服务暂时不可用，请稍后重试。');
      this.setLoading(false);
    }
  }

  /**
   * 更新统计信息
   */
  updateStats() {
    const statsBtn = document.getElementById('svtr-stats-btn');
    const totalMessages = this.messages.filter(m => m.role === 'assistant').length;
    statsBtn.setAttribute('data-badge', totalMessages);
  }

  /**
   * 显示统计面板
   */
  showStats() {
    const panel = document.getElementById('svtr-stats-panel');
    const dataElement = document.getElementById('stats-data');

    const stats = {
      totalMessages: this.messages.length,
      assistantMessages: this.messages.filter(m => m.role === 'assistant').length,
      userMessages: this.messages.filter(m => m.role === 'user').length,
      streamingStats: this.streamingStats,
      sessionDuration: Date.now() - (this.messages[0]?.timestamp?.getTime() || Date.now())
    };

    dataElement.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">总消息数:</span>
          <span class="stat-value">${stats.totalMessages}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">AI回复数:</span>
          <span class="stat-value">${stats.assistantMessages}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">流式块数:</span>
          <span class="stat-value">${stats.streamingStats.chunks}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">思考步骤:</span>
          <span class="stat-value">${stats.streamingStats.thinkingSteps}</span>
        </div>
      </div>
    `;

    panel.style.display = 'block';
  }

  /**
   * 绑定事件 - 增强版
   */
  bindEvents() {
    const input = document.getElementById('svtr-chat-input');
    const sendBtn = document.getElementById('svtr-chat-send');
    const shareBtn = document.getElementById('svtr-share-btn');
    const clearBtn = document.getElementById('svtr-clear-btn');
    const statsBtn = document.getElementById('svtr-stats-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    shareBtn.addEventListener('click', () => this.shareConversation());
    clearBtn.addEventListener('click', () => this.clearChat());
    statsBtn.addEventListener('click', () => this.showStats());

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  /**
   * 工具方法继承和增强
   */
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('svtr_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('svtr_session_id', sessionId);
    }
    return sessionId;
  }

  renderMessage(message) {
    const messagesContainer = document.getElementById('svtr-chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `svtr-message ${message.role} enhanced`;

    const isUser = message.role === 'user';
    const avatar = isUser ? 'U' : 'AI';
    const name = isUser ? '您' : '凯瑞 (Kerry)';

    messageElement.innerHTML = `
      <div class="message-header">
        <div class="message-avatar ${message.role}">${avatar}</div>
        <span class="message-name">${name}</span>
        <span class="message-time">${this.formatTime(message.timestamp)}</span>
      </div>
      <div class="message-content">${this.formatMessage(message.content)}</div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageElement;
  }

  showLoadingMessage() {
    const messagesContainer = document.getElementById('svtr-chat-messages');
    const loadingElement = document.createElement('div');
    loadingElement.className = 'svtr-message assistant loading enhanced';

    loadingElement.innerHTML = `
      <div class="message-header">
        <div class="message-avatar assistant">AI</div>
        <span class="message-name">凯瑞 (Kerry)</span>
        <span class="message-time">${this.formatTime(new Date())}</span>
      </div>
      <div class="message-content">
        <div class="loading-dots enhanced">
          <div class="thinking-animation">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
          <span class="loading-text">正在处理您的请求...</span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(loadingElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return loadingElement;
  }

  removeLoadingMessage(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/•/g, '•');
  }

  formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const sendBtn = document.getElementById('svtr-chat-send');
    const input = document.getElementById('svtr-chat-input');

    sendBtn.disabled = loading;
    input.disabled = loading;

    if (loading) {
      sendBtn.innerHTML = '<div class="loading-spinner"></div>';
    } else {
      sendBtn.innerHTML = '<span class="send-icon">↑</span>';
    }
  }

  setupTextareaAutoResize() {
    const textarea = document.getElementById('svtr-chat-input');
    textarea.addEventListener('input', () => {
      textarea.style.height = '44px';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
  }

  initializeThemes() {
    // 初始化深色模式支持等主题功能
    if (localStorage.getItem('svtr-dark-mode') === 'true') {
      document.body.classList.add('dark-mode');
    }
  }

  addWelcomeMessage() {
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

  showShareButton() {
    const shareBtn = document.getElementById('svtr-share-btn');
    if (this.messages.length > 2) {
      shareBtn.style.display = 'inline-flex';
    }
  }

  shareConversation() {
    const lastUser = this.messages.filter(m => m.role === 'user').pop();
    const lastAssistant = this.messages.filter(m => m.role === 'assistant').pop();

    if (!lastUser || !lastAssistant) {
      return;
    }

    const shareText = `💡 来自SVTR的AI创投洞察：

🔍 问题：${lastUser.content}

🤖 AI分析：${lastAssistant.content.substring(0, 200)}${lastAssistant.content.length > 200 ? '...' : ''}

--
生成于 ${new Date().toLocaleString('zh-CN')}
来源：SVTR (https://svtr.ai)`;

    navigator.clipboard.writeText(shareText).then(() => {
      this.showToast('内容已复制到剪贴板！');
    }).catch(() => {
      console.log('复制失败');
    });
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'svtr-toast enhanced';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  showErrorMessage(error) {
    const errorMessage = { role: 'assistant', content: `❌ ${error}`, timestamp: new Date };
    this.renderMessage(errorMessage);
  }

  clearChat() {
    this.messages = [];
    this.streamingStats = { chunks: 0, thinkingSteps: 0, sources: 0 };
    document.getElementById('svtr-chat-messages').innerHTML = '';
    document.getElementById('svtr-share-btn').style.display = 'none';
    this.addWelcomeMessage();
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('svtr-chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 初始化增强聊天系统
document.addEventListener('DOMContentLoaded', function() {
  if (document.getElementById('svtr-chat-container')) {
    window.svtrEnhancedChat = new SVTREnhancedChat('svtr-chat-container');
  }
});
