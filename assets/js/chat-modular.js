/**
 * SVTR.AI Modular Chat Component
 * 硅谷科技评论模块化聊天组件
 */

import { CHAT_CONFIG, PERFORMANCE_METRICS } from './modules/chat-config.js';
import { ChatAPI } from './modules/chat-api.js';
import { ChatDemo } from './modules/chat-demo.js';
import { ChatUI } from './modules/chat-ui.js';

class SVTRChat {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.messages = [];
    this.isLoading = false;
    this.quotaWarningShown = false;
    this.maxMessages = CHAT_CONFIG.MAX_MESSAGES;
    
    // 初始化模块
    this.api = new ChatAPI();
    this.demo = new ChatDemo();
    this.ui = new ChatUI(this.container);
    
    this.init();
  }

  async init() {
    this.ui.createChatInterface();
    this.bindEvents();
    this.ui.setupTextareaAutoResize();
    this.setupLanguageListener();
    this.addWelcomeMessage();
    this.ui.setupInputHints(this.handleSmartInputHints.bind(this));
  }

  bindEvents() {
    const sendButton = document.getElementById('sendButton');
    const chatInput = document.getElementById('chatInput');
    
    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
    }
    
    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }
  }

  handleSmartInputHints(inputValue) {
    const lang = this.ui.getCurrentLang();
    const hints = {
      zh: {
        'ai': '试试问："最新的AI创投趋势是什么？"',
        '投资': '试试问："2024年有哪些值得关注的AI投资机会？"',
        'svtr': '试试问："SVTR.AI提供哪些服务？"',
        '创业': '试试问："AI创业公司如何获得投资？"'
      },
      en: {
        'ai': 'Try asking: "What are the latest AI venture trends?"',
        'investment': 'Try asking: "What AI investment opportunities are worth watching in 2024?"',
        'svtr': 'Try asking: "What services does SVTR.AI provide?"',
        'startup': 'Try asking: "How do AI startups get funding?"'
      }
    };
    
    const currentHints = hints[lang];
    const matchedKey = Object.keys(currentHints).find(key => 
      inputValue.toLowerCase().includes(key)
    );
    
    if (matchedKey) {
      this.ui.showInputHint(currentHints[matchedKey]);
    } else {
      this.ui.hideInputHint();
    }
  }

  setupLanguageListener() {
    document.addEventListener('languageChanged', () => {
      this.ui.updateInterfaceLanguage();
      this.rerenderMessages();
    });
  }

  addWelcomeMessage() {
    const lang = this.ui.getCurrentLang();
    const welcomeMessage = {
      role: 'assistant',
      content: lang === 'zh' 
        ? '您好！我是SVTR.AI的智能助手，专注于AI创投领域。我可以帮您了解最新的AI投资趋势、创业机会和行业洞察。请问有什么我可以帮助您的吗？' 
        : 'Hello! I\'m SVTR.AI\'s intelligent assistant, focused on the AI venture capital field. I can help you understand the latest AI investment trends, startup opportunities, and industry insights. How can I assist you today?',
      timestamp: new Date()
    };
    
    this.messages.push(welcomeMessage);
    this.ui.addMessage(welcomeMessage);
  }

  async sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message || this.isLoading) return;
    
    // 清空输入框
    chatInput.value = '';
    chatInput.style.height = 'auto';
    this.ui.hideInputHint();
    
    // 添加用户消息
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    this.messages.push(userMessage);
    this.ui.addMessage(userMessage, true);
    
    // 限制消息历史长度
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    
    this.isLoading = true;
    this.ui.updateChatStatus('loading', this.ui.getTranslation('thinking'));
    
    // 显示加载消息
    const loadingMessage = this.ui.addLoadingMessage();
    
    try {
      // 尝试真实API
      const apiResult = await this.api.tryRealAPIFirst(this.messages, loadingMessage);
      
      if (apiResult.success) {
        // 使用真实API响应
        await this.handleAPIResponse(apiResult.response, loadingMessage);
      } else {
        // 使用智能演示模式
        await this.handleDemoResponse(message, loadingMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.handleError(loadingMessage);
    } finally {
      this.isLoading = false;
      this.ui.updateChatStatus('ready', this.ui.getTranslation('chat_status_ready'));
    }
  }

  async handleAPIResponse(response, loadingMessage) {
    this.ui.removeLoadingMessage(loadingMessage);
    
    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    const messageElement = this.ui.addMessage(assistantMessage);
    
    await this.api.handleStreamingResponse(
      response,
      assistantMessage,
      (content) => this.ui.updateMessageContent(messageElement, content),
      () => {
        this.messages.push(assistantMessage);
        console.log('API Response completed');
      }
    );
  }

  async handleDemoResponse(userMessage, loadingMessage) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    this.ui.removeLoadingMessage(loadingMessage);
    
    const demoContent = this.demo.getSmartDemoResponse(userMessage);
    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    const messageElement = this.ui.addMessage(assistantMessage);
    this.messages.push(assistantMessage);
    
    // 模拟打字效果
    await this.demo.simulateTyping(
      demoContent,
      (content) => {
        assistantMessage.content = content;
        this.ui.updateMessageContent(messageElement, content);
      }
    );
  }

  handleError(loadingMessage) {
    this.ui.removeLoadingMessage(loadingMessage);
    
    const lang = this.ui.getCurrentLang();
    const errorMessage = {
      role: 'assistant',
      content: lang === 'zh' 
        ? '抱歉，处理您的请求时出现了错误。请稍后再试。' 
        : 'Sorry, there was an error processing your request. Please try again later.',
      timestamp: new Date()
    };
    
    this.messages.push(errorMessage);
    this.ui.addMessage(errorMessage);
  }

  rerenderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
      this.messages.forEach(message => {
        this.ui.addMessage(message, message.role === 'user');
      });
    }
  }

  // 公开API方法
  getPerformanceStats() {
    return this.api.getPerformanceStats();
  }

  clearMessages() {
    this.messages = [];
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
      messagesContainer.innerHTML = '';
    }
    this.addWelcomeMessage();
  }
}

// 全局初始化
window.SVTRChat = SVTRChat;

// DOM加载完成后自动初始化
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chat-container')) {
    window.svtrChat = new SVTRChat('chat-container');
  }
});