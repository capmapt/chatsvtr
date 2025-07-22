/**
 * SVTR.AI Native Chat Component
 * 硅谷科技评论原生聊天组件
 */

class SVTRChat {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.messages = [];
    this.isLoading = false;
    this.isThinking = false; // DeepSeek推理状态
    this.apiEndpoint = '/api/chat';
    
    this.init();
  }

  getCurrentLang() {
    // Check if i18n is available, otherwise check button states
    if (window.i18n) {
      return window.i18n.getCurrentLanguage();
    }
    
    // Fallback: check which button is active
    const enBtn = document.getElementById('btnEn');
    if (enBtn && enBtn.classList.contains('active')) {
      return 'en';
    }
    
    return 'zh-CN';
  }

  getTranslation(key) {
    const lang = this.getCurrentLang();
    
    // Fallback translations if translations object is not available
    if (typeof translations === 'undefined') {
      return this.getFallbackTranslation(key, lang);
    }
    
    return translations[lang] ? translations[lang][key] : this.getFallbackTranslation(key, lang);
  }

  getFallbackTranslation(key, lang) {
    const fallbackTranslations = {
      'zh-CN': {
        'chat_input_placeholder': '问我关于AI创投的任何问题...',
        'chat_welcome_title': '您好！我是SVTR.AI助手，专注于AI创投生态系统分析。',
        'chat_welcome_content': `我可以为您提供：
• 最新AI创投市场动态
• 投资机构和初创公司分析  
• 行业趋势和技术评估
• 专业投资建议

请问您想了解什么？`,
        'chat_user_name': '您',
        'chat_ai_name': 'SVTR.AI',
        'chat_thinking': '正在分析',
        'chat_share_btn': '分享',
        'chat_clear_btn': '清空'
      },
      'en': {
        'chat_input_placeholder': 'Ask me anything about AI venture capital...',
        'chat_welcome_title': 'Hello! I\'m SVTR.AI assistant, specializing in AI venture capital ecosystem analysis.',
        'chat_welcome_content': `I can provide you with:
• Latest AI VC market dynamics
• Investment firms and startup analysis
• Industry trends and technology assessments  
• Professional investment insights

What would you like to know?`,
        'chat_user_name': 'You',
        'chat_ai_name': 'SVTR.AI',
        'chat_thinking': 'Analyzing',
        'chat_share_btn': 'Share',
        'chat_clear_btn': 'Clear'
      }
    };
    
    return fallbackTranslations[lang] ? fallbackTranslations[lang][key] : key;
  }

  getDemoResponse(userMessage) {
    const lang = this.getCurrentLang();
    
    if (lang === 'en') {
      return `🤖 **Demo Mode**: AI service is being configured...

Regarding "${userMessage}" - AI VC Analysis:

**Market Insights**:
• AI venture capital sector experiencing rapid growth
• Specialization and vertical applications becoming investment focus  
• Data and algorithmic advantages are core competitive strengths

*💡 Full functionality will be available after deployment!*`;
    } else {
      return `🤖 **演示模式**：AI服务正在配置中...

关于"${userMessage}"的AI创投分析：

**市场洞察**：
• AI创投领域正经历快速发展
• 专业化和垂直应用成为投资重点
• 数据和算法优势是核心竞争力

*💡 完整功能将在部署后可用！*`;
    }
  }

  init() {
    this.createChatInterface();
    this.bindEvents();
    this.setupTextareaAutoResize();
    this.setupLanguageListener();
    this.addWelcomeMessage();
  }

  createChatInterface() {
    this.container.innerHTML = `
      <div class="svtr-chat-container">
        <div class="svtr-chat-messages" id="svtr-chat-messages">
          <!-- 消息将在这里显示 -->
        </div>
        
        <div class="svtr-chat-input-area">
          <div class="svtr-chat-input-container">
            <textarea 
              id="svtr-chat-input" 
              placeholder="${this.getTranslation('chat_input_placeholder')}"
              maxlength="1000"
              rows="1"
            ></textarea>
            <button id="svtr-chat-send" class="svtr-chat-send-btn">
              <span class="send-icon">↑</span>
            </button>
          </div>
          <div class="svtr-chat-actions">
            <button id="svtr-share-btn" class="svtr-action-btn" style="display: none;">
              <span>📤</span> ${this.getTranslation('chat_share_btn')}
            </button>
            <button id="svtr-clear-btn" class="svtr-action-btn">
              <span>🗑</span> ${this.getTranslation('chat_clear_btn')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const input = document.getElementById('svtr-chat-input');
    const sendBtn = document.getElementById('svtr-chat-send');
    const shareBtn = document.getElementById('svtr-share-btn');
    const clearBtn = document.getElementById('svtr-clear-btn');

    // 发送消息事件
    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 分享功能
    shareBtn.addEventListener('click', () => this.shareConversation());
    
    // 清空对话
    clearBtn.addEventListener('click', () => this.clearChat());
  }

  setupTextareaAutoResize() {
    const input = document.getElementById('svtr-chat-input');
    const sendBtn = document.getElementById('svtr-chat-send');
    
    // 自动调整textarea高度
    input.addEventListener('input', () => {
      input.style.height = '44px';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      
      // 显示/隐藏发送按钮透明度
      sendBtn.style.opacity = input.value.trim() ? '1' : '0.5';
    });
    
    // 初始状态
    sendBtn.style.opacity = '0.5';
  }

  setupLanguageListener() {
    // Listen for language change events from the i18n system
    document.addEventListener('languageChanged', () => {
      this.updateInterfaceLanguage();
    });
  }

  updateInterfaceLanguage() {
    // Update placeholder
    const input = document.getElementById('svtr-chat-input');
    if (input) {
      input.placeholder = this.getTranslation('chat_input_placeholder');
    }

    // Recreate interface for full language update
    this.createChatInterface();
    this.bindEvents();
    this.setupTextareaAutoResize();
    
    // Update welcome message content and re-render all messages
    this.updateWelcomeMessage();
    this.rerenderMessages();
  }

  rerenderMessages() {
    const messagesContainer = document.getElementById('svtr-chat-messages');
    messagesContainer.innerHTML = '';
    this.messages.forEach(message => {
      this.renderMessage(message);
    });
  }

  addWelcomeMessage() {
    const welcomeMessage = {
      role: 'assistant',
      content: `您好！我是SVTR.AI助手，专注于AI创投生态系统分析。

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

  async sendMessage() {
    const input = document.getElementById('svtr-chat-input');
    const message = input.value.trim();
    
    if (!message || this.isLoading) return;
    
    // 添加用户消息
    const userMessage = {
      role: 'user', 
      content: message,
      timestamp: new Date()
    };
    this.messages.push(userMessage);
    this.renderMessage(userMessage);
    
    // 清空输入框
    input.value = '';
    
    // 显示加载状态
    this.setLoading(true);
    this.isThinking = false; // 重置推理状态
    const loadingMessage = this.showLoadingMessage();
    
    try {
      // 调用真实AI API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.messages.filter(m => m.role !== 'system')
        }),
      });

      if (!response.ok) {
        const errorMsg = this.getCurrentLang() === 'en' ? 'Network request failed' : '网络请求失败';
        throw new Error(errorMsg);
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      
      // 先保持加载状态，等有内容时再显示消息
      let messageElement = null;
      let contentElement = null;
      let hasContent = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 改善中文处理：累积buffer避免中文字符断裂
          const chunk = decoder.decode(value, {stream: true});
          
          // 分行处理，但保持完整性
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === '[DONE]') break;
                
                const data = JSON.parse(jsonStr);
                if (data.response && typeof data.response === 'string') {
                  // 首次收到内容时创建消息元素
                  if (!hasContent) {
                    this.removeLoadingMessage(loadingMessage);
                    messageElement = this.renderMessage(assistantMessage);
                    contentElement = messageElement.querySelector('.message-content');
                    hasContent = true;
                  }
                  
                  // 累积内容并显示
                  assistantMessage.content += data.response;
                  contentElement.innerHTML = this.formatMessage(assistantMessage.content);
                  
                  // 滚动到底部
                  requestAnimationFrame(() => {
                    this.scrollToBottom();
                  });
                }
              } catch (e) {
                // 只记录关键错误，忽略空行或格式问题
                if (line.length > 10) {
                  console.log('JSON解析错误:', e.message, 'Line:', line.substring(0, 50) + '...');
                }
              }
            }
          }
        }
      } finally {
        // 确保读取器被关闭
        reader.releaseLock();
      }
      
      // 只有当内容不为空时才添加到消息历史
      if (assistantMessage.content.trim()) {
        this.messages.push(assistantMessage);
        this.showShareButton();
      }
      
    } catch (error) {
      this.removeLoadingMessage(loadingMessage);
      
      // 如果API失败，显示演示响应
      const demoMessage = this.getDemoResponse(message);

      const assistantMessage = {
        role: 'assistant',
        content: demoMessage,
        timestamp: new Date()
      };
      
      this.messages.push(assistantMessage);
      this.renderMessage(assistantMessage);
      this.showShareButton();
    } finally {
      // 确保在所有情况下都重置加载状态
      this.setLoading(false);
    }
  }

  renderMessage(message) {
    const messagesContainer = document.getElementById('svtr-chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `svtr-message ${message.role}`;
    
    const isUser = message.role === 'user';
    const avatarText = isUser ? 'U' : 'AI';
    const name = isUser ? '您' : 'SVTR.AI';
    
    messageElement.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">${avatarText}</div>
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
    loadingElement.className = 'svtr-message assistant loading';
    loadingElement.innerHTML = `
      <div class="message-header">
        <div class="message-avatar">AI</div>
        <span class="message-name">${this.getTranslation('chat_ai_name')}</span>
        <span class="message-time">${this.formatTime(new Date())}</span>
      </div>
      <div class="message-content">
        <div class="loading-dots">
          <span class="thinking-emoji">●</span>
          ${this.getTranslation('chat_thinking')}
          <span class="animated-dots">
            <span>.</span><span>.</span><span>.</span>
          </span>
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

  showErrorMessage(error) {
    const errorMessage = {
      role: 'assistant',
      content: `❌ ${error}`,
      timestamp: new Date()
    };
    this.renderMessage(errorMessage);
  }

  formatMessage(content) {
    // 简单的markdown格式化
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/•/g, '•');
  }

  formatTime(timestamp) {
    return timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const sendBtn = document.getElementById('svtr-chat-send');
    const input = document.getElementById('svtr-chat-input');
    
    sendBtn.disabled = loading;
    input.disabled = loading;
    
    if (loading) {
      sendBtn.innerHTML = '<span class="loading-spinner">⟳</span>';
    } else {
      sendBtn.innerHTML = '<span class="send-icon">↑</span>';
    }
  }

  showShareButton() {
    const shareBtn = document.getElementById('svtr-share-btn');
    if (this.messages.length > 2) { // 有实际对话内容时显示
      shareBtn.style.display = 'inline-flex';
    }
  }

  shareConversation() {
    // 生成分享内容
    const lastUserMessage = this.messages.filter(m => m.role === 'user').pop();
    const lastAssistantMessage = this.messages.filter(m => m.role === 'assistant').pop();
    
    if (!lastUserMessage || !lastAssistantMessage) return;
    
    const shareContent = `💡 来自SVTR.AI的AI创投洞察：

🔍 问题：${lastUserMessage.content}

🤖 AI分析：${lastAssistantMessage.content.substring(0, 200)}${lastAssistantMessage.content.length > 200 ? '...' : ''}

--
生成于 ${new Date().toLocaleString('zh-CN')}
来源：SVTR.AI (https://svtr.ai)`;

    // 复制到剪贴板
    navigator.clipboard.writeText(shareContent).then(() => {
      this.showToast('内容已复制到剪贴板，快去AI创投会分享吧！');
    }).catch(() => {
      // 降级方案：显示分享内容
      this.showShareDialog(shareContent);
    });
  }

  showShareDialog(content) {
    const dialog = document.createElement('div');
    dialog.className = 'svtr-share-dialog';
    dialog.innerHTML = `
      <div class="share-dialog-content">
        <h4>分享到AI创投会</h4>
        <textarea readonly>${content}</textarea>
        <div class="share-actions">
          <button onclick="this.parentElement.parentElement.parentElement.remove()">关闭</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'svtr-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('svtr-chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  clearChat() {
    this.messages = [];
    document.getElementById('svtr-chat-messages').innerHTML = '';
    document.getElementById('svtr-share-btn').style.display = 'none';
    this.addWelcomeMessage();
  }

  updateWelcomeMessage() {
    // Update the welcome message if it exists
    if (this.messages.length > 0 && this.messages[0].role === 'assistant') {
      const welcomeTitle = this.getTranslation('chat_welcome_title');
      const welcomeContent = this.getTranslation('chat_welcome_content');
      this.messages[0].content = `${welcomeTitle}\n\n${welcomeContent}`;
    }
  }
}

// 自动初始化聊天组件
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否存在聊天容器
  const chatContainer = document.getElementById('svtr-chat-container');
  if (chatContainer) {
    // 等待翻译文件加载完成
    if (typeof translations !== 'undefined') {
      window.svtrChat = new SVTRChat('svtr-chat-container');
    } else {
      // 如果翻译文件还未加载，稍后重试
      setTimeout(() => {
        window.svtrChat = new SVTRChat('svtr-chat-container');
      }, 100);
    }
  }
});