/**
 * SVTR.AI Chat UI Module
 * 聊天界面组件模块
 */

import { CHAT_CONFIG } from './chat-config.js';

export class ChatUI {
  constructor(container) {
    this.container = container;
    this.lastScrollPosition = 0;
    this.scrollThrottle = this.throttle(this.scrollToBottom.bind(this), CHAT_CONFIG.SCROLL_THROTTLE);
  }

  createChatInterface() {
    this.container.innerHTML = `
      <div class="chat-header">
        <h3 data-i18n="chat_title">SVTR.AI 智能助手</h3>
        <div class="chat-status">
          <span class="status-indicator"></span>
          <span class="status-text" data-i18n="chat_status_ready">就绪</span>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages"></div>
      <div class="chat-input-container">
        <div class="input-wrapper">
          <textarea 
            id="chatInput" 
            placeholder="${this.getTranslation('chat_placeholder')}"
            data-i18n-placeholder="chat_placeholder"
            rows="1"
            maxlength="1000"
          ></textarea>
          <div class="input-hint" id="inputHint" style="display: none;"></div>
          <button id="sendButton" data-i18n-title="send_message" aria-label="${this.getTranslation('send_message')}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22,2 15,22 11,13 2,9"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  addMessage(message, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;

    const timestamp = new Date().toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">${this.formatMessageContent(message.content)}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    messagesContainer.appendChild(messageDiv);
    this.scrollThrottle();

    return messageDiv.querySelector('.message-text');
  }

  formatMessageContent(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
  }

  addLoadingMessage() {
    const messagesContainer = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant-message loading-message';
    loadingDiv.innerHTML = `
      <div class="message-content">
        <div class="message-text">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span data-i18n="thinking">思考中...</span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(loadingDiv);
    this.scrollThrottle();
    return loadingDiv;
  }

  removeLoadingMessage(loadingMessage) {
    if (loadingMessage && loadingMessage.parentNode) {
      loadingMessage.parentNode.removeChild(loadingMessage);
    }
  }

  updateMessageContent(contentElement, content) {
    if (contentElement) {
      contentElement.innerHTML = this.formatMessageContent(content);
      this.scrollThrottle();
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      const scrollTop = messagesContainer.scrollHeight - messagesContainer.clientHeight;
      if (Math.abs(scrollTop - this.lastScrollPosition) > 50) {
        messagesContainer.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        this.lastScrollPosition = scrollTop;
      }
    }
  }

  setupTextareaAutoResize() {
    const textarea = document.getElementById('chatInput');
    if (textarea) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      });
    }
  }

  setupInputHints(onHintUpdate) {
    const chatInput = document.getElementById('chatInput');
    const inputHint = document.getElementById('inputHint');

    if (chatInput && inputHint) {
      chatInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value.length > 3) {
          onHintUpdate(value);
        } else {
          inputHint.style.display = 'none';
        }
      });
    }
  }

  showInputHint(text) {
    const inputHint = document.getElementById('inputHint');
    if (inputHint) {
      inputHint.textContent = text;
      inputHint.style.display = 'block';
    }
  }

  hideInputHint() {
    const inputHint = document.getElementById('inputHint');
    if (inputHint) {
      inputHint.style.display = 'none';
    }
  }

  updateChatStatus(status, text) {
    const statusIndicator = this.container.querySelector('.status-indicator');
    const statusText = this.container.querySelector('.status-text');

    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${status}`;
    }

    if (statusText && text) {
      statusText.textContent = text;
    }
  }

  getCurrentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'zh';
  }

  getTranslation(key) {
    const element = document.querySelector(`[data-i18n="${key}"]`);
    return element ? element.textContent : key;
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
