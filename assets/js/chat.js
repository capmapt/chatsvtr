/**
 * SVTR Native Chat Component
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
    this.quotaWarningShown = false; // 配额警告显示标志
    
    this.init();
  }

  detectProductionEnvironment() {
    // 检测是否在生产环境
    // Wrangler开发环境（localhost:3000）也支持真实AI API
    const isWranglerDev = window.location.hostname === 'localhost' && window.location.port === '3000';
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    // Wrangler开发环境或真正的生产环境都使用真实API
    return isProduction || isWranglerDev;
  }

  async tryRealAPIFirst(message, loadingMessage) {
    try {
      // 尝试调用真实AI API
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: this.messages.filter(m => m.role !== 'system')
        }),
      });

      if (response.ok) {
        // API可用，处理流式响应
        this.handleStreamingResponse(response, loadingMessage);
        return true;
      }
    } catch (error) {
      console.log('Real API not available, using smart demo mode');
    }
    return false;
  }

  async handleStreamingResponse(response, loadingMessage) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    
    let messageElement = null;
    let contentElement = null;
    let hasContent = false;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, {stream: true});
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim() && line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') break;
              
              const data = JSON.parse(jsonStr);
              if (data.response && typeof data.response === 'string') {
                // 数字调试日志
                const hasNumbers = /\d/.test(data.response);
                if (hasNumbers) {
                  console.log('🔢 收到包含数字的响应片段:', data.response);
                  console.log('🔢 提取的数字:', data.response.match(/\d+/g));
                }
                
                if (!hasContent) {
                  this.removeLoadingMessage(loadingMessage);
                  messageElement = this.renderMessage(assistantMessage);
                  contentElement = messageElement.querySelector('.message-content');
                  hasContent = true;
                }
                
                assistantMessage.content += data.response;
                const formattedContent = this.formatMessage(assistantMessage.content);
                
                // 格式化后的数字检查
                if (hasNumbers) {
                  console.log('🔢 累积内容:', assistantMessage.content);
                  console.log('🔢 格式化后:', formattedContent);
                  console.log('🔢 格式化后包含数字:', /\d/.test(formattedContent));
                }
                
                contentElement.innerHTML = formattedContent;
                
                requestAnimationFrame(() => {
                  this.scrollToBottom();
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    if (assistantMessage.content.trim()) {
      this.messages.push(assistantMessage);
      this.showShareButton();
    }
    
    this.setLoading(false);
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
        'chat_welcome_title': '您好！我是凯瑞(Kerry)，SVTR的AI助手，专注于AI创投生态系统分析。',
        'chat_welcome_content': `我可以为您提供：
• 最新AI创投市场动态
• 投资机构和初创公司分析  
• 行业趋势和技术评估
• 专业投资建议

请问您想了解什么？`,
        'chat_user_name': '您',
        'chat_ai_name': '凯瑞 (Kerry)',
        'chat_thinking': '正在分析',
        'chat_share_btn': '分享',
        'chat_clear_btn': '清空'
      },
      'en': {
        'chat_input_placeholder': 'Ask me anything about AI venture capital...',
        'chat_welcome_title': 'Hello! I\'m Kerry, SVTR assistant, specializing in AI venture capital ecosystem analysis.',
        'chat_welcome_content': `I can provide you with:
• Latest AI VC market dynamics
• Investment firms and startup analysis
• Industry trends and technology assessments  
• Professional investment insights

What would you like to know?`,
        'chat_user_name': 'You',
        'chat_ai_name': 'Kerry',
        'chat_thinking': 'Analyzing',
        'chat_share_btn': 'Share',
        'chat_clear_btn': 'Clear'
      }
    };
    
    return fallbackTranslations[lang] ? fallbackTranslations[lang][key] : key;
  }

  getSmartDemoResponse(userMessage) {
    const lang = this.getCurrentLang();
    
    // 改进的响应匹配逻辑：基于语义相关性而非简单关键词
    const responseType = this.matchResponseBySemantic(userMessage, lang);
    
    // 获取最相关的演示回复
    return this.getRelevantDemoResponse(userMessage, responseType, lang);
  }

  matchResponseBySemantic(userMessage, lang) {
    const message = userMessage.toLowerCase();
    
    // 特殊处理：数学问题
    const mathPattern = /^\s*\d+\s*[\+\-\*\/\=\(\)]+\s*\d*\s*\=?\s*$/;
    const simpleMathWords = ['加', '减', '乘', '除', '等于', 'plus', 'minus', 'times', 'divided', 'equals'];
    const isMathQuestion = mathPattern.test(userMessage) || 
                          simpleMathWords.some(word => message.includes(word)) ||
                          /\d+\s*[\+\-\*\/]\s*\d+/.test(userMessage);
    
    if (isMathQuestion) {
      return 'math_question';
    }
    
    // 特殊处理：年份相关问题
    const yearPatterns = {
      zh: ['年', '什么年', '哪一年', '哪年', '年份', '今年', '明年', '去年'],
      en: ['year', 'what year', 'which year', 'when', 'annual', 'yearly']
    };
    
    const relevantYearPatterns = lang === 'en' ? yearPatterns.en : [...yearPatterns.zh, ...yearPatterns.en];
    const isYearQuestion = relevantYearPatterns.some(pattern => message.includes(pattern));
    
    if (isYearQuestion) {
      return 'year_question';
    }
    
    // 定义更精确的语义匹配规则
    const semanticPatterns = {
      investment: {
        zh: ['投资', '融资', '资金', '轮次', '估值', '基金', 'vc', '投资人', '投资机构', '资本'],
        en: ['investment', 'funding', 'capital', 'round', 'valuation', 'fund', 'investor', 'vc', 'venture']
      },
      startup: {
        zh: ['公司', '初创', '创业', '企业', '团队', '独角兽', '项目', '商业模式'],
        en: ['startup', 'company', 'business', 'team', 'unicorn', 'entrepreneur', 'venture', 'firm']
      },
      trend: {
        zh: ['趋势', '市场', '发展', '前景', '预测', '未来', '行业', '报告', '分析'],
        en: ['trend', 'market', 'forecast', 'future', 'analysis', 'industry', 'outlook', 'prediction']
      },
      technology: {
        zh: ['技术', '科技', 'ai', '人工智能', '算法', '模型', '数据', '平台', '工具'],
        en: ['technology', 'tech', 'ai', 'artificial intelligence', 'algorithm', 'model', 'data', 'platform']
      }
    };
    
    // 计算每个类型的匹配分数
    let bestMatch = 'general';
    let highestScore = 0;
    
    Object.keys(semanticPatterns).forEach(type => {
      const patterns = semanticPatterns[type];
      const relevantPatterns = lang === 'en' ? patterns.en : [...patterns.zh, ...patterns.en];
      
      let score = 0;
      relevantPatterns.forEach(pattern => {
        if (message.includes(pattern)) {
          // 根据匹配词的重要性给不同权重
          if (pattern.length > 4) score += 3; // 长词匹配权重更高
          else if (pattern.length > 2) score += 2;
          else score += 1;
        }
      });
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = type;
      }
    });
    
    return bestMatch;
  }

  getRelevantDemoResponse(userMessage, responseType, lang) {
    const responses = this.getVariedDemoResponses(lang);
    const responseOptions = responses[responseType] || responses.general;
    
    // 基于消息内容选择最相关的回复（而非轮数）
    let selectedResponse;
    if (responseOptions.length === 1) {
      selectedResponse = responseOptions[0];
    } else {
      // 根据消息的特定特征选择更相关的回复
      const messageHash = this.hashString(userMessage) % responseOptions.length;
      selectedResponse = responseOptions[messageHash];
    }
    
    // 简化个性化处理，只在确实相关时引用用户问题
    if (responseType !== 'general') {
      const intro = lang === 'en' 
        ? `Based on your question about AI venture capital:\n\n`
        : `关于您的AI创投问题：\n\n`;
      return intro + selectedResponse;
    }
    
    return selectedResponse;
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  getVariedDemoResponses(lang) {
    if (lang === 'en') {
      return {
        math_question: [
          "I'm an AI venture capital assistant focused on AI investment analysis. For mathematical calculations, I'd recommend:\n\n• **Simple math**: 1+1=2 ✓\n• **For complex calculations**: Use specialized tools or calculators\n• **For AI-related financial modeling**: I can help with investment valuations and market analysis\n\nWould you like to know about AI venture capital trends, funding rounds, or startup valuations instead? I have comprehensive data on the AI investment ecosystem!"
        ],
        investment: [
          `Based on SVTR's latest analysis, AI venture capital is experiencing unprecedented growth:

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

          `From an investor perspective, the AI venture landscape is rapidly maturing:

**Investment Patterns**:
• **Mega Rounds**: $100M+ funding becoming standard for AI leaders
• **Valuation Metrics**: Revenue multiples reaching 20-50x for growth-stage AI
• **Due Diligence Focus**: Technical moats, data advantages, and go-to-market strategy
• **Exit Opportunities**: IPO pipeline building with 10+ AI unicorns preparing

**Strategic Considerations**:
• Enterprise adoption driving B2B AI valuations
• Infrastructure plays gaining premium valuations
• Regulatory compliance becoming key differentiator
• AI talent acquisition costs impacting unit economics

Current market dynamics favor companies with proven revenue traction and clear paths to profitability.`,

          `SVTR's investment database reveals shifting capital allocation patterns:

**Sector Rotation**:
• **From** Consumer AI → **To** Enterprise Solutions
• **From** Large Models → **To** Application Layer
• **From** Generative AI → **To** Specialized AI Tools
• **Stage Preference**: Growth equity over early-stage speculation

**Risk Assessment**:
• Market saturation in consumer generative AI
• Regulatory headwinds affecting model development
• Talent costs pressuring unit economics
• Competition from Big Tech internal development

Smart money is focusing on defensible AI applications with clear ROI metrics.`
        ],

        startup: [
          `SVTR tracks 10,761 AI companies globally. Here's the current startup landscape:

**Emerging AI Unicorns**:
• **Enterprise AI**: Scale AI, Databricks leading with $1B+ valuations
• **Generative AI**: OpenAI, Anthropic, Midjourney dominating creative markets
• **AI Infrastructure**: Nvidia, AMD, custom chip makers driving hardware innovation
• **Vertical AI**: Healthcare, finance, automotive applications showing strong growth

**Success Patterns**:
• Strong technical teams with AI/ML expertise
• Clear path to enterprise revenue models
• Defensible data advantages and network effects
• Scalable technology platforms with API-first approach

Current valuations reflect both massive opportunity and market maturity expectations.`,

          `Analyzing successful AI startups reveals key differentiation strategies:

**Competitive Positioning**:
• **Data Moats**: Proprietary datasets creating unique training advantages
• **Technical Excellence**: PhD-level talent from top research institutions
• **Go-to-Market**: Enterprise sales teams with domain expertise
• **Capital Efficiency**: Lean operations leveraging cloud infrastructure

**Growth Metrics**:
• ARR growth rates of 300-500% for top performers
• Customer acquisition costs dropping with product maturity
• Net revenue retention exceeding 120% for enterprise-focused companies
• Time to value under 30 days for successful implementations

The winners are building sustainable competitive advantages beyond just AI capabilities.`
        ],

        trend: [
          `Current AI venture capital trends reveal market evolution patterns:

**Market Dynamics**:
• **Consolidation Phase**: Fewer but larger funding rounds ($50M+ becoming standard)
• **Enterprise Focus**: B2B AI solutions commanding premium valuations
• **Vertical Specialization**: Industry-specific AI applications gaining traction
• **Infrastructure Investment**: AI chip and cloud infrastructure seeing massive inflows

**Emerging Opportunities**:
• AI agents and automation platforms
• Multimodal AI applications combining vision, text, audio
• Edge AI and mobile implementations
• AI safety and governance tools

The market is maturing toward sustainable, revenue-generating AI businesses with clear unit economics.`,

          `SVTR's trend analysis highlights shifting investor priorities:

**Investment Evolution**:
• **2023**: Generative AI hype cycle peaks
• **2024**: Enterprise adoption focus emerges
• **2025**: Profitable AI applications prioritized

**Geographic Shifts**:
• US maintaining 45% market share but growth slowing
• Europe gaining ground with regulatory clarity
• Asia focusing on manufacturing and robotics AI
• Emerging markets developing localized AI solutions

**Sector Rotation Patterns**:
• Consumer AI → Enterprise solutions
• General purpose → Specialized applications  
• Model development → Application layer innovation
• Venture capital → Growth equity preference

Smart investors are positioning for the next phase of AI commercialization.`
        ],

        technology: [
          `Technical analysis from SVTR's research team:

**Core Technology Trends**:
• **Large Language Models**: GPT-5, Claude-3, Gemini advancing reasoning capabilities
• **Multimodal AI**: Vision, audio, text integration becoming industry standard
• **Edge Computing**: On-device AI processing reducing cloud dependency and latency
• **Custom Silicon**: AI-specific chips improving performance/efficiency ratios by 10x

**Investment Implications**:
• Companies with proprietary data advantages commanding premium valuations
• Platforms enabling AI democratization seeing massive adoption
• Infrastructure supporting AI workloads experiencing supply constraints
• Developer tools for AI deployment becoming critical bottlenecks

Technology differentiation remains the key driver of sustainable competitive advantages.`,

          `From a technical investment perspective, the AI stack is consolidating:

**Architecture Evolution**:
• **Model Layer**: Foundation models becoming commoditized utilities
• **Application Layer**: Where most value creation and capture occurs
• **Infrastructure Layer**: Critical but capital-intensive with lower margins
• **Data Layer**: Increasingly recognized as the primary moat

**Technical Risk Factors**:
• Model performance plateauing without architectural breakthroughs
• Training costs increasing exponentially with model size
• Inference optimization becoming competitive necessity
• Regulatory constraints on data usage and model deployment

The next wave of AI investing will focus on companies solving real business problems rather than just advancing model capabilities.`
        ],

        year_question: [
          `2024 is a pivotal year for AI venture capital! Based on SVTR's analysis:

**2024 AI VC Characteristics**:
• **Capital Concentration**: Over $50B in total funding, concentrated in leading companies
• **Enterprise Focus**: Shift from consumer AI to enterprise applications and solutions
• **Technology Maturity**: Transition from proof-of-concept to commercialization and profitability
• **Regulatory Clarity**: Global AI governance frameworks taking shape, compliance becoming key

**Key Milestones**:
• OpenAI, Anthropic and other leaders achieving $100B+ valuations
• 45+ new AI unicorns born with total valuation exceeding $100B
• Enterprise AI adoption exceeding 80% among Fortune 500
• AI infrastructure investments reaching historic highs

2024 marks the crucial transition from speculation to value creation in AI venture capital.`,
          
          `From an investment perspective, 2024 is the "maturation year" for AI venture markets:

**Market Evolution**:
• **Investment Rationalization**: From blind hype to focus on actual value and ROI
• **Sector Specialization**: Vertical AI applications receiving more attention and capital
• **Technical Barriers**: Data advantages and expertise becoming core competitive moats
• **Exit Channels**: IPO and M&A markets providing clear exit paths for AI companies

**2024 Key Metrics**:
• Total AI VC funding: $50+B (35% YoY growth)
• New unicorns: 45 AI companies exceeding $1B valuation
• Average round sizes: Series A $25M, Series B $60M
• Exit cases: 12 AI companies successfully IPO'd, total market cap $200+B

This year witnessed the acceleration of AI's commercialization journey from concept to reality.`
        ],

        general: [
          `Welcome to SVTR's comprehensive AI venture capital analysis platform:

**Platform Overview**:
• **Community**: 121,884+ AI professionals and investors globally
• **Database**: 10,761 tracked AI companies with real-time updates
• **Coverage**: Complete global AI investment ecosystem mapping
• **Focus**: Strategic investment insights and professional networking

**Our Services**:
• **AI Investment Database**: Detailed company profiles, funding data, market analysis
• **AI Investment Conference**: Premium industry networking and deal-making events
• **AI Investment Camp**: Executive education programs for sophisticated investors

**Recent Market Highlights**:
• Q4 2024: $12B in AI venture funding across 200+ deals
• 45+ new AI unicorns achieved $1B+ valuations this year
• Enterprise AI adoption rates exceeding 80% among Fortune 500
• Regulatory frameworks driving AI safety and governance investments`,

          `SVTR provides institutional-grade AI investment intelligence:

**Market Intelligence**:
• Real-time funding announcements and valuation data
• Technical due diligence frameworks for AI investments
• Competitive landscape mapping and positioning analysis
• Exit opportunity tracking including IPO and M&A pipelines

**Investment Network**:
• Direct access to 100+ active AI-focused VCs
• LP introductions to top-tier AI investment funds
• Entrepreneur-investor matching based on sector expertise
• Deal syndication opportunities for qualified participants

**Research Products**:
• Weekly AI investment market updates and analysis
• Quarterly deep-dive reports on emerging AI sectors
• Annual AI venture capital market state analysis
• Custom research engagements for institutional clients

Our platform serves as the definitive source for AI investment market intelligence and networking.`
        ],

        supplements: {
          investment: [
            `**Additional Market Context**: Current AI investment concentration shows 80% of funding going to just 20% of companies, indicating a winner-take-all dynamic similar to previous technology cycles.`,
            `**Regulatory Impact**: Recent AI governance frameworks in EU and US are creating compliance costs but also barriers to entry that benefit well-funded incumbents.`,
            `**Global Dynamics**: Chinese AI investments have declined 40% due to export restrictions, while European AI funding has grown 150% year-over-year.`
          ],
          startup: [
            `**Talent Wars**: AI engineer compensation has increased 60% year-over-year, with signing bonuses reaching $500K+ for senior ML engineers at top startups.`,
            `**Technical Moats**: Companies building on proprietary datasets are achieving 3x higher valuations than those relying on public data sources.`,
            `**Customer Concentration**: Most successful AI startups derive 60%+ revenue from enterprise customers with $1B+ annual revenue.`
          ],
          trend: [
            `**Cyclical Patterns**: AI investment cycles are shortening from 18-month to 12-month periods, driven by rapid technology advancement.`,
            `**Sector Maturity**: Enterprise AI categories are reaching Series B/C maturity while consumer AI remains early-stage experimental.`,
            `**Geographic Arbitrage**: Emerging markets offering 70% cost advantages for AI development talent while maintaining comparable quality.`
          ],
          technology: [
            `**Performance Benchmarks**: Latest AI models are achieving human-level performance on 90%+ of standardized cognitive tasks, but real-world deployment remains challenging.`,
            `**Infrastructure Costs**: Training costs for frontier models have increased 10x annually, creating natural barriers to entry for new model developers.`,
            `**Open Source Impact**: Open-source AI models are commoditizing basic capabilities while specialized applications maintain pricing power.`
          ]
        }
      };
    } else {
      return {
        math_question: [
          "我是SVTR的AI创投分析师，专注于AI投资分析。对于数学计算，我建议：\n\n• **简单数学**：1+1=2 ✓\n• **复杂计算**：使用专业计算器工具\n• **AI相关的财务建模**：我可以帮助投资估值和市场分析\n\n您想了解AI创投趋势、融资轮次或初创公司估值吗？我拥有全面的AI投资生态系统数据！"
        ],
        investment: [
          `基于SVTR最新分析，AI创投正经历前所未有的增长：

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

          `从投资人视角看，AI创投生态正快速成熟：

**投资模式变化**：
• **大额融资**：1亿美元以上轮次成为AI头部公司标配
• **估值倍数**：成长期AI公司收入倍数达到20-50倍
• **尽调重点**：技术护城河、数据优势、市场拓展策略
• **退出机会**：10+AI独角兽正准备IPO

**战略考量**：
• 企业级应用推动B2B AI估值上升
• 基础设施投资获得溢价估值
• 合规要求成为关键差异化因素
• AI人才获取成本影响单位经济模型

当前市场动态偏向有proven收入牵引力和明确盈利路径的公司。`
        ],

        startup: [
          `SVTR追踪全球10,761家AI公司。当前初创企业格局：

**新兴AI独角兽**：
• **企业级AI**：Scale AI、Databricks等以10亿美元+估值领先
• **生成式AI**：OpenAI、Anthropic、Midjourney主导创意市场
• **AI基础设施**：英伟达、AMD、定制芯片制造商推动硬件创新
• **垂直AI应用**：医疗、金融、汽车等领域应用增长强劲

**成功模式**：
• 拥有AI/ML专业技术团队
• 清晰的企业级收入模式
• 可防御的数据优势和网络效应
• API优先的可扩展技术平台

当前估值反映了巨大机遇与市场成熟度预期的平衡。`,

          `分析成功AI初创企业揭示关键差异化策略：

**竞争定位**：
• **数据护城河**：专有数据集创造独特训练优势
• **技术卓越**：顶尖研究机构的博士级人才
• **市场开拓**：具备领域专长的企业销售团队
• **资本效率**：利用云基础设施的精益运营

**增长指标**：
• 头部公司ARR增长率300-500%
• 随产品成熟客户获取成本下降
• 企业级公司净收入留存率超过120%
• 成功实施的价值实现时间少于30天

胜出者正在构建超越AI能力本身的可持续竞争优势。`
        ],

        trend: [
          `SVTR分析的当前AI创投趋势揭示市场演进模式：

**市场动态**：
• **整合阶段**：融资轮次减少但规模更大（5000万美元+成为标准）
• **企业级重点**：B2B AI解决方案获得溢价估值
• **垂直专业化**：行业特定AI应用获得牵引力
• **基础设施投资**：AI芯片和云基础设施见证大量资金流入

**新兴机会**：
• AI智能体和自动化平台
• 结合视觉、文本、音频的多模态AI应用
• 边缘AI和移动端实现
• AI安全和治理工具

市场正向具有清晰单位经济模型的可持续、有收入的AI业务成熟。`,

          `SVTR趋势分析突出投资者优先级的转变：

**投资演进**：
• **2023年**：生成式AI炒作周期达到顶峰
• **2024年**：企业级采用焦点出现
• **2025年**：盈利AI应用获得优先考虑

**地理转移**：
• 美国保持45%市场份额但增长放缓
• 欧洲凭借监管明确性获得优势
• 亚洲专注制造业和机器人AI
• 新兴市场开发本地化AI解决方案

**赛道轮换模式**：
• 消费AI → 企业解决方案
• 通用目的 → 专业化应用
• 模型开发 → 应用层创新
• 风险投资 → 成长股权偏好

聪明的投资者正为AI商业化的下一阶段定位。`
        ],

        technology: [
          `SVTR技术研究团队分析：

**核心技术趋势**：
• **大语言模型**：GPT-5、Claude-3、Gemini推进推理能力
• **多模态AI**：视觉、音频、文本集成成为行业标准
• **边缘计算**：设备端AI处理减少云依赖和延迟
• **定制芯片**：AI专用芯片将性能/效率比提升10倍

**投资影响**：
• 拥有专有数据优势的公司获得溢价估值
• 实现AI民主化的平台见证大规模采用
• 支持AI工作负载的基础设施经历供应约束
• AI部署开发工具成为关键瓶颈

技术差异化仍是可持续竞争优势的关键驱动因素。`,

          `从技术投资角度看，AI技术栈正在整合：

**架构演进**：
• **模型层**：基础模型成为商品化公用事业
• **应用层**：大部分价值创造和捕获发生的地方
• **基础设施层**：关键但资本密集，利润率较低
• **数据层**：越来越被认为是主要护城河

**技术风险因素**：
• 模型性能在没有架构突破的情况下趋于平稳
• 训练成本随模型大小指数级增长
• 推理优化成为竞争必需品
• 数据使用和模型部署的监管约束

下一波AI投资将专注于解决真实商业问题的公司，而不仅仅是推进模型能力。`
        ],

        year_question: [
          `2024年是AI创投发展的关键转折年！根据SVTR数据分析：

**2024年AI创投特点**：
• **资本集中**：总融资额超过500亿美元，但集中在头部公司
• **企业聚焦**：从消费级AI转向企业级应用和解决方案
• **技术成熟**：从概念验证转向商业化落地和盈利模式
• **监管明确**：全球AI治理框架逐步完善，合规成为关键

**关键里程碑**：
• OpenAI、Anthropic等头部公司获得百亿美元估值
• 45+家新AI独角兽诞生，总估值超过1000亿美元
• 企业级AI采用率在Fortune 500中超过80%
• AI基础设施投资创历史新高

2024年标志着AI创投从投机转向价值创造的重要转型期。`,
          
          `从投资角度看，2024年是AI创投市场的"成熟元年"：

**市场演变**：
• **投资理性化**：从盲目追热点转向关注实际价值和ROI
• **赛道细分**：垂直领域AI应用获得更多关注和资本
• **技术门槛**：数据优势和专业知识成为核心竞争力
• **退出通道**：IPO和并购市场为AI公司提供明确退出路径

**2024年关键数据**：
• AI创投总额：500+亿美元（同比增长35%）
• 新增独角兽：45家AI公司估值超过10亿美元
• 平均轮次规模：A轮2500万美元，B轮6000万美元
• 退出案例：12家AI公司成功IPO，总市值超过2000亿美元

这一年见证了AI从概念走向现实的商业化进程加速。`
        ],

        general: [
          `欢迎来到SVTR全面的AI创投分析平台：

**平台概况**：
• **社区规模**：121,884+全球AI专业人士和投资者
• **数据库**：追踪10,761家AI公司，实时更新
• **覆盖范围**：完整的全球AI投资生态系统映射
• **专业重点**：战略投资洞察和专业网络

**我们的服务**：
• **AI创投库**：详细公司档案、融资数据、市场分析
• **AI创投会**：高端行业网络和交易撮合活动
• **AI创投营**：面向资深投资者的高管教育项目

**近期市场亮点**：
• 2024年Q4：120亿美元AI创投资金，覆盖200+交易
• 今年新增45+AI独角兽实现10亿美元+估值
• 财富500强企业AI采用率超过80%
• 监管框架推动AI安全和治理投资`,

          `SVTR提供机构级AI投资情报：

**市场情报**：
• 实时融资公告和估值数据
• AI投资技术尽调框架
• 竞争格局映射和定位分析
• 退出机会追踪，包括IPO和M&A管道

**投资网络**：
• 直接接触100+活跃AI专注VC
• 向顶级AI投资基金LP介绍
• 基于行业专长的企业家-投资者匹配
• 合格参与者的交易联合机会

**研究产品**：
• 每周AI投资市场更新和分析
• 新兴AI领域季度深度报告
• 年度AI创投市场状况分析
• 面向机构客户的定制研究服务

我们的平台是AI投资市场情报和网络的权威来源。`
        ],

        supplements: {
          investment: [
            `**附加市场背景**：当前AI投资集中度显示80%资金流向仅20%的公司，表明类似于之前技术周期的赢者通吃动态。`,
            `**监管影响**：欧盟和美国最新AI治理框架正在创造合规成本，但也为资金充足的现有企业创造了进入壁垒。`,
            `**全球动态**：由于出口限制，中国AI投资下降40%，而欧洲AI融资同比增长150%。`
          ],
          startup: [
            `**人才争夺**：AI工程师薪酬同比增长60%，顶级初创企业高级ML工程师签约奖金达到50万美元+。`,
            `**技术护城河**：基于专有数据集构建的公司估值比依赖公共数据源的公司高3倍。`,
            `**客户集中度**：最成功的AI初创企业60%+收入来自年收入10亿美元+的企业客户。`
          ],
          trend: [
            `**周期性模式**：AI投资周期正从18个月缩短到12个月周期，由快速技术进步驱动。`,
            `**行业成熟度**：企业AI类别正达到B/C轮成熟度，而消费AI仍处于早期实验阶段。`,
            `**地理套利**：新兴市场为AI开发人才提供70%成本优势，同时保持可比质量。`
          ],
          technology: [
            `**性能基准**：最新AI模型在90%+标准化认知任务上达到人类水平性能，但现实世界部署仍具挑战性。`,
            `**基础设施成本**：前沿模型训练成本每年增长10倍，为新模型开发者创造自然进入壁垒。`,
            `**开源影响**：开源AI模型正在将基础能力商品化，而专业应用保持定价权。`
          ]
        }
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
        ? '\n\n*This is an intelligent demo showcasing SVTR\'s analysis capabilities. Ask me about AI venture capital trends, companies, or investment insights!*'
        : '\n\n*这是SVTR分析能力的智能演示。请询问AI创投趋势、公司信息或投资洞察！*';
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
    
    // 在生产环境中显示配额状态
    if (this.isProduction) {
      this.updateQuotaStatus();
    }
    
    // 添加用户消息
    const userMessage = {
      role: 'user', 
      content: message,
      timestamp: new Date()
    };
    this.messages.push(userMessage);
    this.renderMessage(userMessage);
    
    // 清空输入框并重置高度
    input.value = '';
    input.style.height = '44px'; // 重置textarea高度
    
    // 显示加载状态
    this.setLoading(true);
    this.isThinking = false; // 重置推理状态
    const loadingMessage = this.showLoadingMessage();
    
    // 在生产环境中先尝试真实API，如果失败再使用智能演示
    if (this.isProduction) {
      // 尝试调用真实API，如果成功就使用，失败则用演示
      this.tryRealAPIFirst(message, loadingMessage).then(success => {
        if (!success) {
          // API不可用，使用改进的演示系统
          setTimeout(() => {
            this.removeLoadingMessage(loadingMessage);
            
            const demoMessage = this.getSmartDemoResponse(message);
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
        }
      });
      
      return;
    }
    
    // 本地开发环境：直接使用演示模式，避免API请求错误
    console.log('本地开发环境，使用演示模式');
    setTimeout(() => {
      this.removeLoadingMessage(loadingMessage);
      
      const demoMessage = this.getSmartDemoResponse(message);
      const assistantMessage = {
        role: 'assistant',
        content: demoMessage,
        timestamp: new Date()
      };
      
      this.messages.push(assistantMessage);
      this.renderMessage(assistantMessage);
      this.showShareButton();
      this.setLoading(false);
    }, 800 + Math.random() * 1200); // 0.8-2秒随机延迟
    
    return;
    
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
      
      // 如果API失败，显示智能演示响应
      const demoMessage = this.getSmartDemoResponse(message);

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
    const name = isUser ? '您' : '凯瑞 (Kerry)';
    
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
      // 加载完成后自动重新聚焦输入框，提升用户体验
      setTimeout(() => {
        if (input && !input.disabled) {
          input.focus();
        }
      }, 100); // 延迟100ms确保DOM完全更新
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
    
    const shareContent = `💡 来自SVTR的AI创投洞察：

🔍 问题：${lastUserMessage.content}

🤖 AI分析：${lastAssistantMessage.content.substring(0, 200)}${lastAssistantMessage.content.length > 200 ? '...' : ''}

--
生成于 ${new Date().toLocaleString('zh-CN')}
来源：SVTR (https://svtr.ai)`;

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
          ? '\n\n*This is an intelligent demo showcasing SVTR\'s analysis capabilities. Ask me about AI venture capital trends, companies, or investment insights!*'
          : '\n\n*这是SVTR分析能力的智能演示。请询问AI创投趋势、公司信息或投资洞察！*';
        content += demoNote;
      }
      
      this.messages[0].content = content;
    }
  }

  async updateQuotaStatus() {
    try {
      const response = await fetch('/api/quota-status');
      if (response.ok) {
        const quotaData = await response.json();
        this.displayQuotaInfo(quotaData);
      }
    } catch (error) {
      console.log('无法获取配额状态:', error);
    }
  }

  displayQuotaInfo(quotaData) {
    // 在聊天界面显示配额信息（如果配额紧张）
    if (quotaData.quotas.daily.percentage > 80 || quotaData.quotas.monthly.percentage > 80) {
      const quotaWarning = {
        role: 'system',
        content: `⚡ **免费额度提醒**：
• 日使用量：${quotaData.quotas.daily.used}/${quotaData.quotas.daily.limit} (${quotaData.quotas.daily.percentage}%)
• 月使用量：${quotaData.quotas.monthly.used}/${quotaData.quotas.monthly.limit} (${quotaData.quotas.monthly.percentage}%)

${quotaData.message}${quotaData.upgradeHint ? '\n\n' + quotaData.upgradeHint : ''}`,
        timestamp: new Date()
      };
      
      // 只显示一次配额警告
      if (!this.quotaWarningShown) {
        this.renderMessage(quotaWarning);
        this.quotaWarningShown = true;
      }
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