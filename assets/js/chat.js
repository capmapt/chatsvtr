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
    this.isProduction = this.detectProductionEnvironment();
    
    this.init();
  }

  detectProductionEnvironment() {
    // 检测是否在生产环境（GitHub Pages等静态托管）
    return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
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
    
    // 智能演示响应，基于用户问题生成相关的AI创投分析
    const responses = this.getIntelligentDemoResponses(lang);
    
    // 根据用户问题关键词选择最相关的响应
    const keywords = userMessage.toLowerCase();
    let selectedResponse;
    
    if (keywords.includes('投资') || keywords.includes('investment') || keywords.includes('funding')) {
      selectedResponse = responses.investment;
    } else if (keywords.includes('公司') || keywords.includes('startup') || keywords.includes('company')) {
      selectedResponse = responses.startup;
    } else if (keywords.includes('趋势') || keywords.includes('trend') || keywords.includes('market')) {
      selectedResponse = responses.trend;
    } else if (keywords.includes('技术') || keywords.includes('technology') || keywords.includes('ai') || keywords.includes('人工智能')) {
      selectedResponse = responses.technology;
    } else {
      selectedResponse = responses.general;
    }
    
    return selectedResponse;
  }

  getIntelligentDemoResponses(lang) {
    if (lang === 'en') {
      return {
        investment: `Based on SVTR.AI's latest analysis, AI venture capital is experiencing unprecedented growth:

**Key Investment Trends**:
• **Funding Volume**: $50B+ invested in AI startups in 2024
• **Hot Sectors**: Generative AI, autonomous systems, AI infrastructure
• **Geographic Distribution**: 45% US, 25% China, 15% Europe, 15% Others
• **Stage Focus**: Series A and B rounds showing strongest growth

**Notable Recent Deals**:
• Anthropic: $6B Series D (Amazon, Google participation)  
• Scale AI: $1B Series E (preparing for IPO)
• Perplexity: $250M Series B (enterprise AI search)

The market shows continued investor confidence in AI transformation across industries.`,

        startup: `SVTR.AI tracks 10,761 AI companies globally. Here's the current startup landscape:

**Emerging AI Unicorns**:
• **Enterprise AI**: Companies like Scale AI, Databricks leading
• **Generative AI**: OpenAI, Anthropic, Midjourney dominating
• **AI Infrastructure**: Nvidia, AMD, custom chip makers
• **Vertical AI**: Healthcare, finance, automotive applications

**Success Patterns**:
• Strong technical teams with AI/ML expertise
• Clear path to enterprise revenue
• Defensible data advantages
• Scalable technology platforms

Current valuations reflect both opportunity and market maturity expectations.`,

        trend: `Current AI venture capital trends from SVTR.AI analysis:

**Market Dynamics**:
• **Consolidation Phase**: Fewer but larger funding rounds
• **Enterprise Focus**: B2B AI solutions gaining priority
• **Vertical Specialization**: Industry-specific AI applications
• **Infrastructure Investment**: AI chip and cloud infrastructure

**Emerging Opportunities**:
• AI agents and automation platforms
• Multimodal AI applications  
• Edge AI and mobile implementations
• AI safety and governance tools

**Risk Factors**:
• Regulatory uncertainty
• Talent competition
• Technology commoditization pressure

The market is maturing toward sustainable, revenue-generating AI businesses.`,

        technology: `Technical analysis from SVTR.AI research:

**Core Technology Trends**:
• **Large Language Models**: GPT-5, Claude-3, Gemini advancing capabilities
• **Multimodal AI**: Vision, audio, text integration becoming standard
• **Edge Computing**: On-device AI processing reducing cloud dependency
• **Custom Silicon**: AI-specific chips improving performance/efficiency

**Investment Implications**:
• Companies with proprietary data advantages
• Platforms enabling AI democratization
• Infrastructure supporting AI workloads
• Tools for AI development and deployment

**Technical Competitive Advantages**:
• Training data quality and volume
• Model architecture innovations
• Inference optimization
• Integration capabilities

Technology differentiation remains key for sustainable competitive advantages.`,

        general: `Welcome to SVTR.AI's comprehensive AI venture capital analysis:

**Platform Overview**:
• **Community**: 121,884+ AI professionals and investors
• **Database**: 10,761 tracked AI companies worldwide  
• **Coverage**: Global AI investment ecosystem
• **Focus**: Strategic investment insights and networking

**Our Services**:
• **AI Investment Database**: Company profiles, funding data, market analysis
• **AI Investment Conference**: Industry networking and deal-making
• **AI Investment Camp**: Educational programs for investors

**Recent Market Highlights**:
• Q4 2024: $12B in AI venture funding
• 45+ new AI unicorns this year
• Growing enterprise AI adoption rates
• Increased focus on AI safety and governance

Feel free to ask about specific companies, investment trends, or market analysis!`
      };
    } else {
      return {
        investment: `基于SVTR.AI最新分析，AI创投正经历前所未有的增长：

**核心投资趋势**：
• **资金规模**：2024年AI初创公司融资超过500亿美元
• **热门赛道**：生成式AI、自动驾驶、AI基础设施
• **地理分布**：美国45%，中国25%，欧洲15%，其他15%
• **轮次重点**：A轮和B轮表现最为活跃

**近期重大交易**：
• Anthropic：60亿美元D轮（亚马逊、谷歌参投）
• Scale AI：10亿美元E轮（准备IPO）
• Perplexity：2.5亿美元B轮（企业级AI搜索）

市场显示投资者对AI行业转型持续保持信心。`,

        startup: `SVTR.AI追踪全球10,761家AI公司。当前初创企业格局：

**新兴AI独角兽**：
• **企业级AI**：Scale AI、Databricks等领先
• **生成式AI**：OpenAI、Anthropic、Midjourney主导
• **AI基础设施**：英伟达、AMD、定制芯片制造商
• **垂直AI应用**：医疗、金融、汽车等领域应用

**成功模式**：
• 拥有AI/ML专业技术团队
• 清晰的企业级收入路径
• 可防御的数据优势
• 可扩展的技术平台

当前估值反映了机遇与市场成熟度预期。`,

        trend: `SVTR.AI分析的当前AI创投趋势：

**市场动态**：
• **整合阶段**：融资轮次减少但规模更大
• **企业级重点**：B2B AI解决方案获得优先关注
• **垂直专业化**：行业特定AI应用兴起
• **基础设施投资**：AI芯片和云基础设施

**新兴机会**：
• AI智能体和自动化平台
• 多模态AI应用
• 边缘AI和移动端实现
• AI安全和治理工具

**风险因素**：
• 监管不确定性
• 人才竞争激烈
• 技术商品化压力

市场正向可持续、有收入的AI业务模式成熟。`,

        technology: `SVTR.AI技术研究分析：

**核心技术趋势**：
• **大语言模型**：GPT-5、Claude-3、Gemini能力持续提升
• **多模态AI**：视觉、音频、文本集成成为标准
• **边缘计算**：设备端AI处理减少云依赖
• **定制芯片**：AI专用芯片提升性能效率

**投资影响**：
• 拥有专有数据优势的公司
• 实现AI民主化的平台
• 支持AI工作负载的基础设施
• AI开发和部署工具

**技术竞争优势**：
• 训练数据质量和规模
• 模型架构创新
• 推理优化
• 集成能力

技术差异化仍是可持续竞争优势的关键。`,

        general: `欢迎来到SVTR.AI全面的AI创投分析平台：

**平台概况**：
• **社区规模**：121,884+AI专业人士和投资者
• **数据库**：追踪全球10,761家AI公司
• **覆盖范围**：全球AI投资生态系统
• **专业重点**：战略投资洞察和人脉网络

**我们的服务**：
• **AI创投库**：公司档案、融资数据、市场分析
• **AI创投会**：行业网络和交易撮合
• **AI创投营**：投资者教育项目

**近期市场亮点**：
• 2024年Q4：120亿美元AI创投资金
• 今年新增45+AI独角兽
• 企业级AI采用率增长
• AI安全和治理关注度提升

欢迎询问具体公司、投资趋势或市场分析！`
      };
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
    const welcomeTitle = this.getTranslation('chat_welcome_title');
    const welcomeContent = this.getTranslation('chat_welcome_content');
    
    let content = `${welcomeTitle}\n\n${welcomeContent}`;
    
    // 在生产环境中添加演示说明
    if (this.isProduction) {
      const lang = this.getCurrentLang();
      const demoNote = lang === 'en' 
        ? '\n\n*This is an intelligent demo showcasing SVTR.AI\'s analysis capabilities. Ask me about AI venture capital trends, companies, or investment insights!*'
        : '\n\n*这是SVTR.AI分析能力的智能演示。请询问AI创投趋势、公司信息或投资洞察！*';
      content += demoNote;
    }
    
    const welcomeMessage = {
      role: 'assistant',
      content: content,
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
    
    // 在生产环境中直接使用智能演示响应
    if (this.isProduction) {
      // 模拟AI思考时间
      setTimeout(() => {
        this.removeLoadingMessage(loadingMessage);
        
        const demoMessage = this.getDemoResponse(message);
        const assistantMessage = {
          role: 'assistant',
          content: demoMessage,
          timestamp: new Date()
        };
        
        this.messages.push(assistantMessage);
        this.renderMessage(assistantMessage);
        this.showShareButton();
        this.setLoading(false);
      }, 1000 + Math.random() * 2000); // 1-3秒随机延迟，模拟真实AI响应
      
      return;
    }
    
    try {
      // 调用真实AI API（仅在本地开发环境）
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
      
      let content = `${welcomeTitle}\n\n${welcomeContent}`;
      
      // 在生产环境中添加演示说明
      if (this.isProduction) {
        const lang = this.getCurrentLang();
        const demoNote = lang === 'en' 
          ? '\n\n*This is an intelligent demo showcasing SVTR.AI\'s analysis capabilities. Ask me about AI venture capital trends, companies, or investment insights!*'
          : '\n\n*这是SVTR.AI分析能力的智能演示。请询问AI创投趋势、公司信息或投资洞察！*';
        content += demoNote;
      }
      
      this.messages[0].content = content;
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