// Last sync: 2025-09-28T21:53:55.783Z
// Last sync: 2025-09-22T23:29:19.763Z
/**
 * 创投日报功能模块
 * 负责加载、显示和管理融资信息
 */

(function() {
  'use strict';

  // 🏗️ 模拟融资数据 - 实际项目中应从API获取
  const mockFundingData = [
    {
      id: 'fd001',
      companyName: 'MindBridge AI',
      stage: 'Series A',
      amount: 25000000,
      currency: 'USD',
      description: '专注医疗AI诊断的创新公司，其AI影像识别技术已在多家三甲医院部署使用，准确率达95%以上。',
      tags: ['医疗AI', '影像识别', '诊断'],
      investedAt: '2025-01-17T15:30:00Z',
      investors: ['红杉资本中国', 'IDG资本'],
      website: 'https://mindbridge-ai.com',
      category: '医疗科技',
      subCategory: 'AI诊断',
      teamInfo: '团队核心成员来自斯坦福医学院、MIT计算机科学系，拥有15年+医疗AI研发经验。',
      founders: [
        {
          name: '张明华',
          title: 'CEO',
          background: '前Google Health技术总监',
          linkedin: 'https://linkedin.com/in/zhang-minghua',
          email: 'minghua@mindbridge-ai.com'
        },
        {
          name: 'Dr. Sarah Chen',
          title: 'CTO',
          background: '斯坦福医学院AI实验室主任',
          linkedin: 'https://linkedin.com/in/sarah-chen-md',
          email: 'sarah@mindbridge-ai.com'
        }
      ]
    },
    {
      id: 'fd002',
      companyName: 'QuantumSecure',
      stage: 'Seed',
      amount: 8000000,
      currency: 'USD',
      description: '量子加密通信技术领军企业，为金融机构提供下一代安全通信解决方案。',
      tags: ['量子技术', '网络安全', '金融科技'],
      investedAt: '2025-01-17T11:20:00Z',
      investors: ['经纬中国', '真格基金'],
      website: 'https://quantumsecure.tech',
      category: '网络安全',
      subCategory: '量子加密',
      teamInfo: '创始团队来自中科院量子信息重点实验室，在量子通信领域有10年+研究经验。',
      founders: [
        {
          name: '李量子',
          title: 'CEO',
          background: '中科院量子信息实验室研究员',
          linkedin: 'https://linkedin.com/in/li-quantum',
          email: 'quantum@quantumsecure.tech'
        },
        {
          name: '王安全',
          title: 'CTO',
          background: '前华为网络安全首席架构师',
          linkedin: 'https://linkedin.com/in/wang-anquan',
          email: 'anquan@quantumsecure.tech'
        }
      ]
    },
    {
      id: 'fd003',
      companyName: 'EcoLogistics Pro',
      stage: 'Series B',
      amount: 45000000,
      currency: 'USD',
      description: '智能物流平台，通过AI优化配送路线，已帮助客户降低30%物流成本，覆盖全国200+城市。',
      tags: ['智能物流', 'AI优化', '绿色配送'],
      investedAt: '2025-01-17T09:45:00Z',
      investors: ['高瓴资本', '顺为资本', '小米集团'],
      website: 'https://ecologistics.pro',
      category: '物流科技',
      subCategory: '智能配送',
      teamInfo: '团队拥有丰富的物流和AI算法经验，核心成员来自菜鸟网络、美团配送等知名企业。',
      founders: [
        {
          name: '陈物流',
          title: 'CEO',
          background: '前菜鸟网络技术VP',
          linkedin: 'https://linkedin.com/in/chen-wuliu',
          email: 'wuliu@ecologistics.pro'
        },
        {
          name: '赵配送',
          title: 'COO',
          background: '前美团配送运营总监',
          linkedin: 'https://linkedin.com/in/zhao-peisong',
          email: 'peisong@ecologistics.pro'
        }
      ]
    },
    {
      id: 'fd004',
      companyName: 'BrainFlow Analytics',
      stage: 'Pre-A',
      amount: 12000000,
      currency: 'USD',
      description: '专业数据分析平台，为企业提供实时商业智能解决方案，客户包括多家Fortune 500公司。',
      tags: ['数据分析', '商业智能', '企业服务'],
      investedAt: '2025-01-16T16:15:00Z',
      investors: ['启明创投', '华创资本']
    },
    {
      id: 'fd005',
      companyName: 'NeuralCloud',
      stage: 'Series A',
      amount: 18000000,
      currency: 'USD',
      description: '云端AI推理平台，为中小企业提供低成本AI计算服务，已服务超过1000家企业客户。',
      tags: ['云计算', 'AI推理', '企业服务'],
      investedAt: '2025-01-16T14:20:00Z',
      investors: ['GGV纪源资本', '蓝驰创投']
    },
    {
      id: 'fd006',
      companyName: 'RoboFarm Tech',
      stage: 'Seed',
      amount: 6000000,
      currency: 'USD',
      description: '农业机器人技术公司，开发智能农业设备，提高农业生产效率，已在多个农业基地试点。',
      tags: ['农业科技', '机器人', '智能农业'],
      investedAt: '2025-01-16T10:30:00Z',
      investors: ['创新工场', '险峰长青']
    },
    {
      id: 'fd007',
      companyName: 'VoiceAI Pro',
      stage: 'Pre-A',
      amount: 9000000,
      currency: 'USD',
      description: '语音AI技术公司，专注多语言语音识别和合成，为客服、教育等行业提供解决方案。',
      tags: ['语音AI', '多语言', '客服'],
      investedAt: '2025-01-15T16:45:00Z',
      investors: ['五源资本', '源码资本']
    }
  ];

  // 🌊 瀑布流相关变量
  let currentDisplayCount = 3; // 当前显示的数量
  let isLoadingMore = false; // 是否正在加载更多

  // 🎨 融资阶段标签映射
  const stageLabels = {
    'Pre-Seed': '种子前',
    'Pre-seed': '种子前',
    'Seed': '种子轮',
    'Pre-A': 'Pre-A轮',
    'A轮': 'A轮',
    'B轮': 'B轮',
    'C轮': 'C轮',
    'D轮': 'D轮',
    'E轮': 'E轮',
    'F轮': 'F轮',
    'G轮': 'G轮',
    'H轮': 'H轮',
    'A+': 'A+轮',
    'B+': 'B+轮',
    'C+': 'C+轮',
    'D+': 'D+轮',
    'E+': 'E+轮',
    'F+': 'F+轮',
    'Series A': 'A轮',
    'Series B': 'B轮',
    'Series C': 'C轮',
    'Series D': 'D轮',
    'Series E': 'E轮',
    'Series F': 'F轮',
    'IPO': 'IPO',
    'Strategic': '战略投资',
    'SAFE': 'SAFE',
    'M&A': '并购',
    '可转债': '可转债',
    'Unknown': '未知',
    '未知': '未知'
  };

  // 💰 格式化金额显示
  function formatAmount(amount, currency = 'USD') {
    const amountInM = amount / 1000000;
    const symbol = currency === 'USD' ? '$' : '¥';

    if (amountInM >= 1000) {
      return `${symbol}${(amountInM / 1000).toFixed(1)}B`;
    } else if (amountInM >= 1) {
      return `${symbol}${amountInM.toFixed(1)}M`;
    } else {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
  }

  // ⏰ 格式化时间显示
  function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}天前`;
    }
  }

  // 🎯 从描述中提取网站链接
  function extractWebsiteFromDescription(description) {
    // 匹配各种网站链接格式
    const websitePatterns = [
      /https?:\/\/[\w\.-]+\.\w+/g,
      /www\.[\w\.-]+\.\w+/g,
      /[\w\.-]+\.com|\.ai|\.io|\.tech|\.org|\.net/g
    ];

    for (const pattern of websitePatterns) {
      const matches = description.match(pattern);
      if (matches) {
        const url = matches[0];
        return url.startsWith('http') ? url : `https://${url}`;
      }
    }
    return null;
  }

  // 🚫 检查是否是无效的团队背景数据
  function isInvalidTeamBackground(teamBackground) {
    if (!teamBackground || typeof teamBackground !== 'string') return true;

    const trimmed = teamBackground.trim();

    // 过滤明显无效的数据
    const invalidPatterns = [
      /^\d+月\d+日$/,        // 纯日期格式: "12月30日"
      /^20\d{2}年\d+月\d+日$/, // 完整日期: "2025年12月30日"
      /^[\d月日年]+$/,        // 纯日期字符
      /^无$|^暂无$|^待补充$/,  // 明确表示无数据
      /^[\s\-_]+$/,           // 纯空格或分隔符
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`⚠️ 过滤无效团队背景: "${trimmed}"`);
        return true;
      }
    }

    // 长度过短（少于5个字符）也视为无效
    if (trimmed.length < 5) {
      console.log(`⚠️ 团队背景过短: "${trimmed}"`);
      return true;
    }

    return false;
  }

  // 🔗 为团队背景中的创始人姓名添加超链接
  function addLinksToTeamBackground(teamBackground, contactInfo) {
    if (!teamBackground || !contactInfo) return teamBackground;

    let enhancedText = teamBackground;

    // 只为句首的人名（通常是创始人）添加超链接
    // 匹配句首的中英文姓名，后面跟着职位描述
    const founderPattern = /^([A-Za-z\u4e00-\u9fa5\s]{2,20})，(?=.{0,50}?(创始人|CEO|CTO|总裁|首席|联合创始人))/;
    const founderMatch = enhancedText.match(founderPattern);

    if (founderMatch) {
      const founderName = founderMatch[1].trim();
      enhancedText = enhancedText.replace(founderPattern,
        `<a href="${contactInfo}" target="_blank" class="founder-link" title="访问 ${founderName} 的联系方式">${founderName}</a>，`
      );
    }

    return enhancedText;
  }

  // 🏢 生成基于投资信息的团队背景
  function generateTeamInfo(item) {
    const topInvestors = ['红杉资本', 'IDG资本', 'Sequoia Capital', 'Andreessen Horowitz', 'Benchmark', 'Accel', 'Khosla Ventures', '真格基金', '经纬中国', '华创资本', 'GGV纪源资本'];
    const hasTopInvestor = item.investors?.some(investor =>
      topInvestors.some(top => investor.includes(top.replace(/\s+/g, '')))
    );

    // 根据融资金额和投资方判断团队规模和背景
    let teamLevel = '';
    let teamDescription = '';

    if (item.amount >= 100000000) {
      teamLevel = '成熟企业团队';
      teamDescription = '拥有丰富的行业经验和成功的商业化记录，团队成员多数来自知名科技公司或有成功创业经历';
    } else if (item.amount >= 50000000) {
      teamLevel = '经验丰富的核心团队';
      teamDescription = '团队在相关领域深耕多年，具备强大的技术实力和市场洞察力';
    } else if (item.amount >= 10000000) {
      teamLevel = '专业团队';
      teamDescription = '拥有扎实的技术基础和清晰的产品愿景，在垂直领域有独特优势';
    } else if (hasTopInvestor) {
      teamLevel = '潜力团队';
      teamDescription = '虽处早期阶段，但获得了顶级投资机构的认可，展现出强大的发展潜力';
    } else {
      teamLevel = '初创团队';
      teamDescription = '在创新领域积极探索，具备敏锐的市场嗅觉和执行能力';
    }

    // 基于行业标签补充专业描述
    const primaryTag = item.tags?.[0] || 'AI';
    let industryExpertise = '';
    switch(primaryTag) {
      case 'AI':
      case '人工智能':
        industryExpertise = '在人工智能算法研发、模型训练和应用落地方面具备深厚的技术积累';
        break;
      case '大模型':
      case 'LLM':
        industryExpertise = '专注于大语言模型技术，在NLP和生成式AI领域有重要贡献';
        break;
      case '自动驾驶':
        industryExpertise = '在自动驾驶技术栈、感知算法和车路协同方面有丰富的研发经验';
        break;
      case '机器人':
        industryExpertise = '结合AI技术与机械工程，在智能机器人控制和应用场景拓展上有独特见解';
        break;
      case '医疗AI':
        industryExpertise = '将人工智能技术与医疗健康结合，在疾病诊断和精准医疗方面有专业背景';
        break;
      default:
        industryExpertise = `在${primaryTag}领域有深入的技术研究和产业化经验`;
    }

    return `${teamLevel}，${teamDescription}。${industryExpertise}，致力于推动行业创新发展。`;
  }

  // 📏 根据文本长度计算合适的字体大小
  function calculateFontSize(textLength) {
    // 基础字体大小：短文本用大字体，长文本用小字体
    if (textLength <= 80) return '0.9rem';        // 短文本
    else if (textLength <= 150) return '0.85rem'; // 中等文本
    else if (textLength <= 250) return '0.8rem';  // 较长文本
    else if (textLength <= 350) return '0.75rem'; // 长文本
    else return '0.7rem';                          // 超长文本
  }

  // 📐 计算合适的行高
  function calculateLineHeight(textLength) {
    // 长文本使用较小的行高以容纳更多内容
    if (textLength <= 150) return '1.4';
    else if (textLength <= 300) return '1.3';
    else return '1.2';
  }

  // 🏢 从企业介绍中提取公司名称
  function extractCompanyName(description) {
    const patterns = [
      /^([A-Za-z][\w\s&.-]*[A-Za-z\d])，/, // 英文公司名（最优先）
      /^([^，。,\s]{2,30})，\d{4}年/, // 中文公司名+年份模式
      /^([^，。,\s]{2,20})，/, // 句首到第一个逗号的部分
      /^([A-Za-z\u4e00-\u9fa5\s]+?)（/, // 括号前的部分
      /([A-Za-z\u4e00-\u9fa5]+)\s*，.*?成立/, // "xxx，成立"模式
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // 过滤掉明显不是公司名的结果
        if (name.length > 1 && name.length < 50 && !name.includes('年')) {
          return name;
        }
      }
    }
    return null;
  }

  // 💰 从企业介绍中提取融资金额 - 优先提取本轮融资，避免累计融资
  function extractAmount(description) {
    // 先尝试提取本轮融资金额（通常在"完成"后面，"累计"前面）
    // 注意：支持带逗号的数字格式，如 6,400万、1,234.5万
    const currentRoundPatterns = [
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*亿美元[^，。]*?融资/,
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*亿元[^，。]*?融资/,
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*千万美元[^，。]*?融资/,
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*千万元[^，。]*?融资/,
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*万美元[^，。]*?融资/,
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*万元[^，。]*?融资/,
      /完成[^，。]*?\$(\d+(?:,\d+)?(?:\.\d+)?)\s*[MB][^，。]*?融资/,
      /完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*[MB][^，。]*?融资/,
    ];

    // 检查本轮融资模式
    for (const pattern of currentRoundPatterns) {
      const match = description.match(pattern);
      if (match) {
        // 移除逗号后再转换为数字
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const text = match[0];

        if (text.includes('亿美元')) return amount * 100000000;
        if (text.includes('亿元')) return amount * 100000000 / 7;
        if (text.includes('千万美元')) return amount * 10000000;
        if (text.includes('千万元')) return amount * 10000000 / 7;
        if (text.includes('万美元')) return amount * 10000;
        if (text.includes('万元')) return amount * 10000 / 7;
        if (text.includes('$') && text.includes('M')) return amount * 1000000;
        if (text.includes('$') && text.includes('B')) return amount * 1000000000;
        if (text.includes('M')) return amount * 1000000;
        if (text.includes('B')) return amount * 1000000000;
      }
    }

    // 如果没有找到明确的本轮融资，尝试通用模式（但排除累计相关文本）
    const generalPatterns = [
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*亿美元/g,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*亿元/g,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*千万美元/g,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*千万元/g,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*万美元/g,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*万元/g,
      /\$(\d+(?:,\d+)?(?:\.\d+)?)\s*[MB]/g,
      /(\d+(?:,\d+)?(?:\.\d+)?)\s*[MB]/g,
    ];

    for (const pattern of generalPatterns) {
      let match;
      while ((match = pattern.exec(description)) !== null) {
        // 移除逗号后再转换为数字
        const amount = parseFloat(match[1].replace(/,/g, ''));
        const text = match[0];
        const beforeText = description.substring(Math.max(0, match.index - 20), match.index);
        const afterText = description.substring(match.index, Math.min(description.length, match.index + 50));

        // 跳过包含"累计"的融资金额
        if (beforeText.includes('累计') || afterText.includes('累计')) {
          continue;
        }

        if (text.includes('亿美元')) return amount * 100000000;
        if (text.includes('亿元')) return amount * 100000000 / 7;
        if (text.includes('千万美元')) return amount * 10000000;
        if (text.includes('千万元')) return amount * 10000000 / 7;
        if (text.includes('万美元')) return amount * 10000;
        if (text.includes('万元')) return amount * 10000 / 7;
        if (text.includes('$') && text.includes('M')) return amount * 1000000;
        if (text.includes('$') && text.includes('B')) return amount * 1000000000;
        if (text.includes('M')) return amount * 1000000;
        if (text.includes('B')) return amount * 1000000000;
      }
    }

    return 10000000; // 默认1000万美元
  }

  // 🎯 从企业介绍中提取融资轮次 (增强版)
  function extractStage(description) {
    // 📌 优先提取"完成XX轮"格式（最近融资轮次）
    const currentRoundPatterns = [
      // Pre系列 + SAFE组合（最高优先级）
      { pattern: /完成[^。]*?Pre-seed\s*SAFE/i, stage: 'Pre-seed SAFE' },
      { pattern: /完成[^。]*?pre-Series\s*([A-Z])\s*SAFE/i, stage: (match) => {
        const letterMatch = match[0].match(/pre-Series\s*([A-Z])/i);
        if (!letterMatch || !letterMatch[1]) return 'SAFE';
        const letter = letterMatch[1].toUpperCase();
        return `Pre-${letter} SAFE`;
      }},

      // Pre系列轮次
      { pattern: /完成[^。]*?Pre-seed|完成[^。]*?种子前/i, stage: 'Pre-seed' },
      { pattern: /完成[^。]*?Pre-Series\s*([A-Z])|完成[^。]*?pre-Series\s*([A-Z])/i, stage: (match) => {
        const letterMatch = match[0].match(/Pre-Series\s*([A-Z])|pre-Series\s*([A-Z])/i);
        if (!letterMatch) return 'Pre-A';
        const letter = letterMatch[1] || letterMatch[2];
        return letter ? `Pre-${letter.toUpperCase()}` : 'Pre-A';
      }},
      { pattern: /完成[^。]*?Pre-[A-Z]\+?轮|完成[^。]*?PreA/i, stage: 'Pre-A' },

      // 早期轮次
      { pattern: /完成[^。]*?天使轮|完成[^。]*?天使/, stage: 'Seed' },
      { pattern: /完成[^。]*?种子轮/, stage: 'Seed' },

      // 标准轮次 (A-Z轮，支持+ ++号) - 增强版：支持"完成2,300万美元A轮融资"、"A++轮"、"B+ 轮"(带空格)
      { pattern: /完成[^。]*?([A-Z])\s*\+{1,2}\s*轮\s*融资/i, stage: (matchedString) => {
        const letterMatch = matchedString.match(/([A-Z])\s*(\+{1,2})\s*轮/i);
        if (letterMatch) {
          const letter = letterMatch[1];
          const plusCount = (letterMatch[2] || '').length;
          if (plusCount === 2) return `${letter.toUpperCase()}++`;
          if (plusCount === 1) return `${letter.toUpperCase()}+`;
          return `${letter.toUpperCase()}轮`;
        }
        return 'Unknown';
      }},

      // 无加号的标准轮次 (支持"D 轮 融资"这种带空格的格式)
      { pattern: /完成[^。]*?([A-Z])\s*轮\s*融资/i, stage: (matchedString) => {
        const letterMatch = matchedString.match(/([A-Z])\s*轮/i);
        if (letterMatch) {
          return `${letterMatch[1].toUpperCase()}轮`;
        }
        return 'Unknown';
      }},

      // 特殊融资类型
      { pattern: /完成[^。]*?SAFE轮/i, stage: 'SAFE' },
      { pattern: /完成[^。]*?可转债|完成[^。]*?可转换债券/, stage: '可转债' },
      { pattern: /完成[^。]*?战略投资|完成[^。]*?战略融资/, stage: 'Strategic' },
      { pattern: /完成[^。]*?IPO|完成[^。]*?上市/, stage: 'IPO' },
      { pattern: /完成[^。]*?并购|完成[^。]*?收购/, stage: 'M&A' },
    ];

    // 🔍 先尝试匹配"完成XX轮"格式
    for (const { pattern, stage } of currentRoundPatterns) {
      const match = description.match(pattern);
      if (match) {
        const extractedStage = typeof stage === 'function' ? stage(match[0]) : stage;
        console.log(`✅ [完成模式] 成功识别轮次: ${extractedStage}`);
        return stageLabels[extractedStage] || extractedStage;
      }
    }

    // 🆕 新增: 支持"获得"、"宣布"、"筹集"等同义词
    const expandedPatterns = [
      // 获得XX轮
      { pattern: /获得[^。]*?([A-Z])\+?轮融资/i, stage: (match) => {
        const letterMatch = match[0].match(/([A-Z])\+?轮/i);
        if (letterMatch) {
          const letter = letterMatch[1].toUpperCase();
          const hasPlus = match[0].includes('+');
          return hasPlus ? `${letter}+` : `${letter}轮`;
        }
        return 'Unknown';
      }},
      // 宣布XX轮
      { pattern: /宣布[^。]*?([A-Z])\+?轮融资/i, stage: (match) => {
        const letterMatch = match[0].match(/([A-Z])\+?轮/i);
        if (letterMatch) {
          const letter = letterMatch[1].toUpperCase();
          const hasPlus = match[0].includes('+');
          return hasPlus ? `${letter}+` : `${letter}轮`;
        }
        return 'Unknown';
      }},
      // 轮次在前: "A轮融资已完成"
      { pattern: /([A-Z])\+?轮融资[^。]*?完成/i, stage: (match) => {
        const letterMatch = match[0].match(/([A-Z])\+?轮/i);
        if (letterMatch) {
          const letter = letterMatch[1].toUpperCase();
          const hasPlus = match[0].includes('+');
          return hasPlus ? `${letter}+` : `${letter}轮`;
        }
        return 'Unknown';
      }},
    ];

    // 尝试扩展模式
    for (const { pattern, stage } of expandedPatterns) {
      const match = description.match(pattern);
      if (match) {
        const extractedStage = typeof stage === 'function' ? stage(match[0]) : stage;
        console.log(`✅ [扩展模式] 成功识别轮次: ${extractedStage}`);
        return stageLabels[extractedStage] || extractedStage;
      }
    }

    // 🔄 如果没有"完成"关键词，使用通用模式（保留原逻辑）
    const generalPatterns = [
      // Pre系列 + SAFE组合
      { pattern: /Pre-seed\s*SAFE/i, stage: 'Pre-seed SAFE' },
      { pattern: /pre-Series\s*([A-Z])\s*SAFE/i, stage: (match) => {
        const letterMatch = match[0].match(/pre-Series\s*([A-Z])/i);
        if (!letterMatch || !letterMatch[1]) return 'SAFE';
        const letter = letterMatch[1].toUpperCase();
        return `Pre-${letter} SAFE`;
      }},

      // Pre系列
      { pattern: /Pre-seed|种子前/i, stage: 'Pre-seed' },
      { pattern: /Pre-Series\s*([A-Z])|pre-Series\s*([A-Z])/i, stage: (match) => {
        const letterMatch = match[0].match(/Pre-Series\s*([A-Z])|pre-Series\s*([A-Z])/i);
        if (!letterMatch) return 'Pre-A';
        const letter = letterMatch[1] || letterMatch[2];
        return letter ? `Pre-${letter.toUpperCase()}` : 'Pre-A';
      }},
      { pattern: /Pre-[A-Z]\+?轮|PreA/i, stage: 'Pre-A' },

      // 早期轮次
      { pattern: /天使轮|天使/, stage: 'Seed' },
      { pattern: /种子轮/, stage: 'Seed' },

      // 标准轮次
      { pattern: /([A-Z])\+?轮融资|([A-Z])\+?轮/i, stage: (match) => {
        const letterMatch = match[0].match(/([A-Z])\+?轮/i);
        if (letterMatch) {
          const letter = letterMatch[1];
          const hasPlus = match[0].includes('+');
          return hasPlus ? `${letter.toUpperCase()}+` : `${letter.toUpperCase()}轮`;
        }
        return 'Unknown';
      }},

      // 特殊类型
      { pattern: /SAFE轮/i, stage: 'SAFE' },
      { pattern: /可转债|可转换债券/, stage: '可转债' },
      { pattern: /战略投资|战略融资/, stage: 'Strategic' },
      { pattern: /IPO|上市/, stage: 'IPO' },
      { pattern: /并购|收购/, stage: 'M&A' },
    ];

    for (const { pattern, stage } of generalPatterns) {
      const match = description.match(pattern);
      if (match) {
        const extractedStage = typeof stage === 'function' ? stage(match[0]) : stage;
        console.log(`✅ [通用模式] 成功识别轮次: ${extractedStage}`);
        return stageLabels[extractedStage] || extractedStage;
      }
    }

    // 🆕 智能推断: 如果所有模式都失败,根据融资金额推断轮次
    console.log(`⚠️ 所有模式匹配失败，尝试根据金额推断轮次...`);
    const amount = extractAmount(description);

    if (amount && amount >= 10000000) { // 至少$10M才推断
      let inferredStage = '';
      if (amount >= 500000000) {
        inferredStage = 'D轮以上';
      } else if (amount >= 100000000) {
        inferredStage = 'C轮';
      } else if (amount >= 50000000) {
        inferredStage = 'B轮';
      } else if (amount >= 20000000) {
        inferredStage = 'A轮';
      } else if (amount >= 5000000) {
        inferredStage = 'Pre-A';
      } else {
        inferredStage = 'Seed';
      }

      console.log(`💡 [金额推断] 融资金额$${(amount/1000000).toFixed(1)}M → 推断轮次: ${inferredStage}`);
      return inferredStage;
    }

    console.log(`❌ 轮次识别失败，返回"未知"`);
    return '未知';
  }

  // 🏛️ 从企业介绍中提取投资方
  function extractInvestors(description) {
    const patterns = [
      /投资方为\s*([^。，]+)/,
      /投资人包括\s*([^。，]+)/,
      /由\s*([^。，]*资本[^。，]*)\s*领投/,
      /([^。，]*资本|[^。，]*投资|[^。，]*基金)/g,
    ];

    let investors = [];
    for (const pattern of patterns) {
      const matches = description.match(pattern);
      if (matches) {
        if (pattern.global) {
          investors = investors.concat(matches);
        } else {
          investors.push(matches[1]);
        }
      }
    }

    // 清理和去重
    investors = investors
      .map(inv => inv.replace(/、|等|投资方为|由|领投/g, '').trim())
      .filter(inv => inv.length > 1 && inv.length < 30)
      .slice(0, 3); // 最多取3个

    return investors.length > 0 ? investors : ['知名投资机构'];
  }

  // 👤 从团队背景中提取创始人信息
  function extractFounder(teamBackground) {
    const patterns = [
      /([A-Za-z\u4e00-\u9fa5\s]{2,20})，.*?创始人/,
      /([A-Za-z\u4e00-\u9fa5\s]{2,20}).*?CEO/,
      /([A-Za-z\u4e00-\u9fa5\s]{2,20}).*?首席执行官/,
    ];

    for (const pattern of patterns) {
      const match = teamBackground.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  // 👨‍💼 生成创始人信息
  function generateFoundersInfo(item) {
    // 如果有现成的创始人信息
    if (item.founders && item.founders.length > 0) {
      return item.founders.map(founder => `
        <div class="founder-item">
          <div class="founder-info">
            <div class="founder-name clickable" onclick="window.open('${founder.linkedin || `mailto:${founder.email}`}', '_blank')" title="点击联系">${founder.name}</div>
            <div style="font-size: 0.75rem; color: #6c757d;">${founder.title} | ${founder.background}</div>
          </div>
        </div>
      `).join('');
    }

    // 基于公司规模和投资信息生成推断信息
    let companyStage = '初创期';
    let teamSize = '10-50人';
    let expertise = item.tags?.[0] || 'AI技术';

    if (item.amount >= 100000000) {
      companyStage = '成长期';
      teamSize = '100+人';
    } else if (item.amount >= 30000000) {
      companyStage = '扩张期';
      teamSize = '50-100人';
    }

    return `
      <div class="company-insights">
        <p><strong>发展阶段：</strong>${companyStage}</p>
        <p><strong>团队规模：</strong>约${teamSize}</p>
        <p><strong>核心技术：</strong>${expertise}</p>
        <p><strong>市场定位：</strong>${item.tags?.[1] || '技术创新'}领域</p>
        <div class="contact-note">
          <small>💡 具体团队信息请访问官网获取最新信息</small>
        </div>
      </div>
    `;
  }

  // 🏷️ 规范化公司名称显示
  function normalizeCompanyName(companyName) {
    const nameRules = {
      'Upscaleai': 'Upscale AI',
      'upscaleai': 'Upscale AI',
      'UPSCALEAI': 'Upscale AI',
      'OpenAI': 'OpenAI',
      'DeepMind': 'DeepMind',
      'ChatGPT': 'ChatGPT',
      'TikTok': 'TikTok',
      'YouTube': 'YouTube',
      'LinkedIn': 'LinkedIn',
      'GitHub': 'GitHub'
    };

    // 检查是否需要规范化
    for (const [oldName, newName] of Object.entries(nameRules)) {
      if (companyName === oldName) {
        return newName;
      }
    }

    return companyName;
  }

  // 🏗️ 生成融资信息卡片HTML
  function createFundingItemHTML(item) {
    const formattedAmount = formatAmount(item.amount, item.currency);
    const stageLabel = stageLabels[item.stage] || item.stage;
    const timeAgo = formatTimeAgo(item.investedAt);

    // 规范化公司名称
    const normalizedCompanyName = normalizeCompanyName(item.companyName);

    // 过滤并显示前3个有效标签 - 排除无效日期和其他无效标签
    const validTags = item.tags?.filter(tag => {
      if (!tag || typeof tag !== 'string') return false;
      const trimmed = tag.trim();

      // 排除无效标签
      if (trimmed === '0' || trimmed === 'AI创投日报') return false;

      // 排除日期格式标签（如 1899/12/30, 2024/01/01, 12月30日 等）
      const invalidDatePatterns = [
        /^\d{4}\/\d{1,2}\/\d{1,2}$/,    // YYYY/MM/DD 或 YYYY/M/D
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,    // MM/DD/YYYY 或 M/D/YYYY
        /^\d{4}-\d{1,2}-\d{1,2}$/,      // YYYY-MM-DD
        /^\d{1,2}月\d{1,2}日$/,         // MM月DD日
        /^20\d{2}年\d{1,2}月\d{1,2}日$/, // YYYY年MM月DD日
      ];

      for (const pattern of invalidDatePatterns) {
        if (pattern.test(trimmed)) return false;
      }

      return true;
    }) || [];
    const tagsHTML = validTags.slice(0, 3).map(tag => `<span class="funding-tag">${tag}</span>`).join('');

    // 提取网站链接 - 优先使用API提供的companyWebsite字段
    const websiteUrl = item.companyWebsite || item.website || extractWebsiteFromDescription(item.description || '');

    // 生成公司名称（带官网链接）
    const companyNameHTML = websiteUrl
      ? `<h3 class="company-name clickable" onclick="window.open('${websiteUrl}', '_blank')" title="点击访问官网">${normalizedCompanyName}</h3>`
      : `<h3 class="company-name">${normalizedCompanyName}</h3>`;

    // 保持完整描述信息，并计算合适的字体样式
    const fullDescription = item.description || '暂无描述信息';
    const fontSize = calculateFontSize(fullDescription.length);
    const lineHeight = calculateLineHeight(fullDescription.length);

    // 直接使用源数据中的团队信息，不再生成描述

    // 生成团队信息背面内容（仅显示源数据中的团队背景信息）
    const teamBackContent = `
      <div class="team-info-content">
        <div class="team-header">
          <h3>👥 ${normalizedCompanyName} 团队</h3>
        </div>

        <div class="team-section">
          ${item.teamBackground && !isInvalidTeamBackground(item.teamBackground) ? `
            <p>${addLinksToTeamBackground(item.teamBackground, item.contactInfo)}</p>
          ` : ''}

          ${item.workExperience ? `
            <p><strong>💼 工作经历：</strong>${item.workExperience}</p>
          ` : ''}

          ${item.education ? `
            <p><strong>🎓 教育背景：</strong>${item.education}</p>
          ` : ''}

          ${!item.founder && !item.founders && !item.workExperience && !item.education && (!item.teamBackground || isInvalidTeamBackground(item.teamBackground)) && item.description ? `
            <p><strong>📋 公司信息：</strong>${item.description}</p>
          ` : ''}

          ${!item.founder && !item.founders && !item.workExperience && !item.education && (!item.teamBackground || isInvalidTeamBackground(item.teamBackground)) && !item.description ? `
            <p class="no-team-info">团队背景信息待补充</p>
          ` : ''}
        </div>

        <div class="card-back-footer">
          ${websiteUrl ? `
            <a href="${websiteUrl}" target="_blank" class="company-link">
              🌐 访问官网
            </a>
          ` : '<div></div>'}

          <button class="flip-back-button" onclick="flipCard(this)">
            ← 返回融资信息
          </button>
        </div>
      </div>
    `;

    return `
      <div class="funding-item funding-card" data-funding-id="${item.id}" onclick="flipCard(this)">
        <div class="card-inner">
          <!-- 卡片正面 -->
          <div class="card-front">
            <div class="funding-company">
              ${companyNameHTML}
              <span class="company-stage">${stageLabel}</span>
            </div>

            <div class="funding-amount">
              ${formattedAmount}
            </div>

            <p class="funding-description" style="font-size: ${fontSize}; line-height: ${lineHeight};">${fullDescription}</p>

            <div class="funding-meta">
              <div class="funding-tags">${tagsHTML}</div>
              <button class="flip-back-button" onclick="flipCard(this); event.stopPropagation();">
                点击查看团队 →
              </button>
            </div>
          </div>

          <!-- 卡片背面 -->
          <div class="card-back">
            ${teamBackContent}
          </div>
        </div>
      </div>
    `;
  }

  // 📊 加载融资数据
  async function loadFundingData(reset = true) {
    const container = document.getElementById('fundingHighlights');

    if (!container) {
      console.warn('创投日报容器未找到');
      return;
    }

    try {
      // 如果是重置，显示加载状态
      if (reset) {
        container.innerHTML = `
          <div class="funding-loading">
            <span class="loading-icon">⏳</span>
            <span data-i18n="funding_loading">正在加载最新融资信息...</span>
          </div>
        `;

        // 重置显示数量
        currentDisplayCount = 3;
      }

      // 从飞书API获取真实数据
      let fundingData = [];

      try {
        // 🔒 防御性请求：禁用压缩，添加超时和重试机制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

        const response = await fetch('/api/wiki-funding-sync?refresh=true', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Encoding': 'identity' // 禁用压缩，避免解析问题
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // 检查响应是否正常
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('🔍 响应Headers:', Object.fromEntries(response.headers.entries()));

        // 🛡️ 强化数据解析：自动检测和修复常见问题
        let result;
        try {
          const responseText = await response.text();
          console.log('📄 响应长度:', responseText.length, 'bytes');

          // 检测压缩数据（Gzip magic number: 0x1f8b）
          if (responseText.charCodeAt(0) === 0x1f && responseText.charCodeAt(1) === 0x8b) {
            console.error('❌ 检测到未解压的Gzip数据！这是middleware配置错误');
            throw new Error('服务器返回压缩数据但未正确解压，请检查middleware配置');
          }

          // 检测空响应
          if (!responseText || responseText.trim().length === 0) {
            console.error('❌ API返回空响应');
            throw new Error('服务器返回空内容');
          }

          // 检测非JSON内容
          const firstChar = responseText.trim()[0];
          if (firstChar !== '{' && firstChar !== '[') {
            console.error('❌ 响应不是JSON格式，前100字符:', responseText.substring(0, 100));
            throw new Error('服务器返回非JSON数据');
          }

          // 尝试解析JSON
          result = JSON.parse(responseText);
          console.log('✅ JSON解析成功，数据量:', result.count || 0);

        } catch (parseError) {
          console.error('❌ 数据解析失败:', parseError.message);
          throw new Error(`数据解析失败: ${parseError.message}`);
        }

        if (result && result.success && result.data) {
          // 转换飞书API数据格式为前端期望的格式
          fundingData = result.data
            .map((item, index) => {
              // 从企业介绍中提取融资信息
              const description = item['企业介绍'] || '';
              const companyName = extractCompanyName(description);
              const amount = extractAmount(description);
              const stage = extractStage(description);
              const investors = extractInvestors(description);

              // 构建标签数组: 二级分类 + 标签字段(拆分)
              const tags = [];

              // 添加二级分类
              if (item['二级分类'] && item['二级分类'].trim()) {
                tags.push(item['二级分类'].trim());
              }

              // 添加标签字段(可能有多个,用逗号分隔)
              if (item['标签'] && item['标签'].trim()) {
                const additionalTags = item['标签'].split(',')
                  .map(tag => tag.trim())
                  .filter(tag => tag.length > 0);
                tags.push(...additionalTags);
              }

              return {
                id: item.id || `feishu_${index + 1}`,
                companyName: companyName,
                stage: stage || 'Unknown',
                amount: amount || 10000000,
                currency: 'USD',
                description: description,
                tags: tags.length > 0 ? tags : ['科技创新'], // 如果没有任何标签,使用默认值
                investedAt: new Date().toISOString(),
                investors: investors,
                website: item['公司官网'] || '',
                companyWebsite: item['公司官网'] || '',
                contactInfo: item['联系方式'] || '',
                teamBackground: item['团队背景'] || '',
                category: item['细分领域'] || item['二级分类'] || '',
                subCategory: item['二级分类'] || '',
                founder: extractFounder(item['团队背景'] || ''),
                sourceUrl: item.sourceUrl || ''
              };
            })
            .filter(item => {
              // 过滤掉公司名为空、为"0"或无效的记录
              const companyName = item.companyName;
              const isValidCompanyName = companyName &&
                                         typeof companyName === 'string' &&
                                         companyName.trim() !== '' &&
                                         companyName.trim() !== '0' &&
                                         companyName !== 'null' &&
                                         companyName !== 'undefined';

              if (!isValidCompanyName) {
                console.log(`⚠️ 跳过无效公司名记录: companyName="${companyName}"`);
              }

              return isValidCompanyName;
            });

          console.log(`✅ 从${result.source}获取到 ${result.count} 条融资数据，过滤后剩余 ${fundingData.length} 条有效数据`);

          // 更新时间显示
          updateFundingTimestamp(result.lastUpdate);
        } else {
          console.warn('⚠️ API返回格式不正确:', result);
          throw new Error(result?.message || '数据获取失败');
        }
      } catch (apiError) {
        console.warn('⚠️ API数据获取失败，使用备用数据:', apiError);
        // 如果API失败，fallback到模拟数据
        fundingData = mockFundingData;

        // 设置默认更新时间
        updateFundingTimestamp(null);
      }

      // 按时间排序并截取当前显示数量
      const recentFunding = fundingData.slice(0, currentDisplayCount);

      if (recentFunding.length === 0) {
        container.innerHTML = `
          <div class="funding-empty">
            <span>📋</span>
            <p>暂无最新融资信息</p>
          </div>
        `;
        return;
      }

      // 生成HTML
      const fundingHTML = recentFunding.map(createFundingItemHTML).join('');

      // 添加加载更多按钮（如果还有更多数据）
      const loadMoreHTML = currentDisplayCount < fundingData.length ? `
        <div class="funding-load-more">
          <button class="load-more-btn" onclick="window.fundingDaily.loadMoreFunding()">
            <span class="load-more-icon">➕</span>
            <span data-i18n="funding_load_more">查看更多融资信息</span>
          </button>
        </div>
      ` : '';

      // 将当前数据存储到全局变量，供loadMoreFunding使用
      window.currentFundingData = fundingData;

      // 保存当前翻转状态（在刷新数据时保持状态）
      const flippedCards = Array.from(container.querySelectorAll('.funding-card.flipped')).map(card => {
        const companyName = card.querySelector('.company-name')?.textContent?.trim();
        return companyName;
      }).filter(Boolean);

      container.innerHTML = fundingHTML + loadMoreHTML;

      // 恢复翻转状态（仅在有需要恢复的状态时）
      if (flippedCards.length > 0) {
        setTimeout(() => {
          flippedCards.forEach(companyName => {
            const card = Array.from(container.querySelectorAll('.funding-card')).find(c => {
              const cardCompanyName = c.querySelector('.company-name')?.textContent?.trim();
              return cardCompanyName === companyName;
            });
            if (card) {
              card.classList.add('flipped');
            }
          });
        }, 100); // 延迟确保DOM更新完成
      }

      // 添加点击事件
      addFundingItemClickHandlers();

      // 初始化筛选功能（仅在重置时）
      if (reset) {
        setTimeout(() => {
          initializeFilters();
        }, 100);
      }

      console.log(`✅ 创投日报加载完成，显示 ${recentFunding.length} 条融资信息`);

    } catch (error) {
      console.error('❌ 创投日报加载失败:', error);
      container.innerHTML = `
        <div class="funding-error">
          <span>⚠️</span>
          <p>加载失败，请稍后重试</p>
          <button onclick="window.fundingDaily.loadFundingData()" class="retry-btn">重新加载</button>
        </div>
      `;
    }
  }

  // 🌊 加载更多融资信息
  async function loadMoreFunding() {
    // 防止重复点击
    if (isLoadingMore) return;

    isLoadingMore = true;

    try {
      // 使用当前存储的数据或fallback到模拟数据
      const availableData = window.currentFundingData || mockFundingData;

      // 增加显示数量
      currentDisplayCount = Math.min(currentDisplayCount + 3, availableData.length);

      // 重新渲染（不重置）
      await loadFundingData(false);

    } catch (error) {
      console.error('❌ 加载更多融资信息失败:', error);
    } finally {
      isLoadingMore = false;
    }
  }

  // 🔄 卡片翻转功能
  function flipCard(element) {
    // 阻止事件冒泡，避免嵌套点击
    if (event) {
      event.stopPropagation();
    }

    // 找到最近的卡片容器
    const card = element.closest('.funding-card');
    if (card) {
      card.classList.toggle('flipped');

      // 更新可访问性
      const isFlipped = card.classList.contains('flipped');
      card.setAttribute('aria-label', isFlipped ? '团队信息视图，点击返回融资信息' : '融资信息视图，点击查看团队');
    }
  }

  // 🖱️ 添加融资卡片点击事件
  function addFundingItemClickHandlers() {
    const fundingCards = document.querySelectorAll('.funding-card');

    fundingCards.forEach(card => {
      // 移除旧的点击事件，使用新的翻转逻辑
      card.removeEventListener('click', handleFundingItemClick);

      // 增强可访问性
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `${card.querySelector('.company-name').textContent} 融资信息，点击查看团队详情`);

      // 键盘支持
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flipCard(this);
        }
      });
    });

    // 阻止内部链接点击时触发翻转
    document.querySelectorAll('.funding-card .company-name, .funding-card .contact-link, .funding-card .company-link').forEach(link => {
      link.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    });
  }

  // 📱 融资卡片点击处理
  function handleFundingItemClick(fundingId) {
    // 使用当前存储的数据或fallback到模拟数据
    const availableData = window.currentFundingData || mockFundingData;
    const fundingItem = availableData.find(item => item.id === fundingId);

    if (!fundingItem) {
      console.error('未找到融资信息:', fundingId);
      return;
    }

    // 简单的详情显示 - 实际项目中可能跳转到详情页
    const message = `
🏢 ${fundingItem.companyName}
💰 ${formatAmount(fundingItem.amount, fundingItem.currency)} (${stageLabels[fundingItem.stage] || fundingItem.stage})
📝 ${fundingItem.description}
💼 投资方: ${fundingItem.investors.join(', ')}
    `.trim();

    // 显示详情（可以改为模态框或跳转页面）
    if (confirm(`${message}\n\n是否查看完整日报？`)) {
      // 跳转到SVTR官网
      window.open('https://svtr.ai', '_blank');
    }
  }

  // 🔄 刷新数据
  function refreshFundingData() {
    console.log('🔄 刷新创投日报数据...');
    // 不重置currentDisplayCount，保持用户当前查看状态
    // currentDisplayCount = 3; // 注释掉，避免重置用户加载更多的状态
    loadFundingData(false); // 使用false避免显示加载状态，保持翻转状态
  }

  // 🚀 初始化函数
  function initializeFundingDaily() {
    console.log('🚀 初始化创投日报模块...');

    // 检查必要元素是否存在
    const container = document.getElementById('fundingHighlights');
    if (!container) {
      console.warn('⚠️ 创投日报容器未找到，跳过初始化');
      return;
    }

    // 立即加载数据
    loadFundingData(true);

    // 🧠 智能刷新策略
    setupIntelligentRefresh();

    console.log('✅ 创投日报初始化完成');
  }

  // 🧠 智能刷新策略
  function setupIntelligentRefresh() {
    // 主同步时间：每天北京时间6:00 (UTC 22:00前一天)
    const MAIN_SYNC_HOUR = 6; // 北京时间6点

    function getNextRefreshInterval() {
      const now = new Date();
      const beijingHour = (now.getUTCHours() + 8) % 24; // 转换为北京时间

      // 计算距离下次主同步的小时数
      let hoursUntilSync = MAIN_SYNC_HOUR - beijingHour;
      if (hoursUntilSync <= 0) {
        hoursUntilSync += 24; // 明天的同步时间
      }

      console.log(`🕐 当前北京时间: ${beijingHour}:${now.getMinutes()}, 距离下次主同步: ${hoursUntilSync}小时`);

      // 智能间隔策略
      if (hoursUntilSync <= 2) {
        // 主同步后2小时内：30分钟刷新一次（捕获新数据）
        return 30 * 60 * 1000;
      } else if (hoursUntilSync <= 6) {
        // 主同步后2-6小时：2小时刷新一次（维护状态）
        return 2 * 60 * 60 * 1000;
      } else {
        // 主同步前18小时：6小时刷新一次（减少无效请求）
        return 6 * 60 * 60 * 1000;
      }
    }

    function scheduleNextRefresh() {
      const interval = getNextRefreshInterval();
      const hours = Math.round(interval / (1000 * 60 * 60) * 10) / 10;

      console.log(`⏰ 设置下次刷新间隔: ${hours}小时`);

      setTimeout(() => {
        console.log('🔄 执行智能刷新...');
        refreshFundingData();
        scheduleNextRefresh(); // 递归调度下次刷新
      }, interval);
    }

    // 启动智能调度
    scheduleNextRefresh();
  }

  // 🔍 筛选功能相关
  let activeFilters = {
    stage: 'all',
    amount: 'all',
    tags: []
  };

  // 初始化筛选栏
  function initializeFilters() {
    console.log('🔍 初始化筛选功能...');

    const filterBar = document.getElementById('fundingFilterBar');
    if (!filterBar) {
      console.warn('⚠️ 筛选栏未找到');
      return;
    }

    // 获取所有融资数据用于生成筛选选项
    const allData = window.currentFundingData || mockFundingData;

    // 生成数据可视化图表
    generateCharts(allData);

    // 生成融资轮次选项
    generateStageFilters(allData);

    // 生成标签选项
    generateTagFilters(allData);

    // 绑定筛选事件
    bindFilterEvents();

    console.log('✅ 筛选功能初始化完成');
  }

  // 生成数据可视化图表(增强版 - 支持点击筛选)
  function generateCharts(data) {
    // 生成轮次分布图
    const stageChart = document.getElementById('stageChart');
    if (stageChart) {
      const stageCounts = {};
      data.forEach(item => {
        const stage = stageLabels[item.stage] || item.stage;
        if (stage && stage !== '未知') {
          stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
      });

      const sortedStages = Object.entries(stageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6); // 显示前6个
      const maxCount = Math.max(...sortedStages.map(([, count]) => count));

      const stageHTML = sortedStages.map(([stage, count]) => {
        const percentage = Math.round((count / data.length) * 100);
        const barWidth = (count / maxCount) * 100;
        // 添加点击属性和样式类
        const isActive = activeFilters.stage === stage;
        return `
          <div class="chart-bar clickable-chart-bar ${isActive ? 'chart-bar-active' : ''}"
               data-filter-type="stage"
               data-filter-value="${stage}"
               onclick="window.fundingDaily.filterByChart('stage', '${stage}')"
               title="点击筛选 ${stage}">
            <div class="chart-bar-label">${stage}</div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width: ${barWidth}%">
                <span class="chart-bar-value">${count} (${percentage}%)</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      stageChart.innerHTML = stageHTML || '<p style="text-align: center; color: #999;">暂无数据</p>';
    }

    // 生成金额区间占比图
    const amountChart = document.getElementById('amountChart');
    if (amountChart) {
      const amountRanges = {
        '<$10M': '<10M',
        '$10M-50M': '10M-50M',
        '$50M-100M': '50M-100M',
        '>$100M': '>100M'
      };

      const amountCounts = {
        '<$10M': 0,
        '$10M-50M': 0,
        '$50M-100M': 0,
        '>$100M': 0
      };

      data.forEach(item => {
        const amountInM = item.amount / 1000000;
        if (amountInM < 10) {
          amountCounts['<$10M']++;
        } else if (amountInM < 50) {
          amountCounts['$10M-50M']++;
        } else if (amountInM < 100) {
          amountCounts['$50M-100M']++;
        } else {
          amountCounts['>$100M']++;
        }
      });

      const maxCount = Math.max(...Object.values(amountCounts));

      const amountHTML = Object.entries(amountCounts).map(([range, count]) => {
        const percentage = Math.round((count / data.length) * 100);
        const barWidth = count > 0 ? (count / maxCount) * 100 : 0;
        const filterValue = amountRanges[range];
        const isActive = activeFilters.amount === filterValue;
        return `
          <div class="chart-bar clickable-chart-bar ${isActive ? 'chart-bar-active' : ''}"
               data-filter-type="amount"
               data-filter-value="${filterValue}"
               onclick="window.fundingDaily.filterByChart('amount', '${filterValue}')"
               title="点击筛选 ${range}">
            <div class="chart-bar-label">${range}</div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width: ${barWidth}%">
                <span class="chart-bar-value">${count} (${percentage}%)</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      amountChart.innerHTML = amountHTML || '<p style="text-align: center; color: #999;">暂无数据</p>';
    }
  }

  // 图表点击筛选函数
  function filterByChart(filterType, filterValue) {
    console.log('📊 图表筛选:', filterType, filterValue);

    // 如果点击的是已激活的筛选,则重置该筛选
    if (
      (filterType === 'stage' && activeFilters.stage === filterValue) ||
      (filterType === 'amount' && activeFilters.amount === filterValue)
    ) {
      // 重置为"全部"
      if (filterType === 'stage') {
        activeFilters.stage = 'all';
      } else if (filterType === 'amount') {
        activeFilters.amount = 'all';
      }
    } else {
      // 应用新筛选
      if (filterType === 'stage') {
        activeFilters.stage = filterValue;
      } else if (filterType === 'amount') {
        activeFilters.amount = filterValue;
      }
    }

    // 同步按钮状态
    updateFilterButtonStates();

    // 应用筛选
    applyFilters();

    // 重新生成图表以更新激活状态
    const allData = window.currentFundingData || mockFundingData;
    generateCharts(allData);
  }

  // 生成融资轮次筛选选项
  function generateStageFilters(data) {
    const stageFilter = document.getElementById('stageFilter');
    if (!stageFilter) return;

    // 收集所有轮次
    const stages = new Set();
    data.forEach(item => {
      const stage = stageLabels[item.stage] || item.stage;
      if (stage && stage !== '未知') {
        stages.add(stage);
      }
    });

    // 排序轮次（按投资阶段顺序）
    const sortedStages = ['Seed', '种子轮', 'Pre-A', 'A轮', 'B轮', 'C轮', 'D轮', 'E轮', 'F轮', 'IPO'];
    const filteredStages = sortedStages.filter(stage => stages.has(stage));

    // 生成HTML
    const stageHTML = [
      '<button class="filter-btn active" data-filter="stage" data-value="all">全部</button>',
      ...filteredStages.map(stage =>
        `<button class="filter-btn" data-filter="stage" data-value="${stage}">${stage}</button>`
      )
    ].join('');

    stageFilter.innerHTML = stageHTML;
  }

  // 生成标签筛选选项
  function generateTagFilters(data) {
    const tagFilter = document.getElementById('tagFilter');
    if (!tagFilter) return;

    // 收集所有标签及其出现次数
    const tagCounts = {};
    data.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          if (tag && tag.trim()) {
            const trimmed = tag.trim();
            // 过滤无效标签（'0' 和 'AI创投日报'）
            if (trimmed === '0' || trimmed === 'AI创投日报') return;
            tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1;
          }
        });
      }
    });

    // 按出现次数排序，取前10个
    const sortedTagsWithCounts = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // 计算热门标签阈值（出现次数大于等于前3个标签的平均值）
    const topThreeAverage = sortedTagsWithCounts.length >= 3
      ? (sortedTagsWithCounts[0][1] + sortedTagsWithCounts[1][1] + sortedTagsWithCounts[2][1]) / 3
      : sortedTagsWithCounts[0]?.[1] || 0;

    // 生成HTML，为热门标签添加⭐标识
    const tagHTML = [
      '<button class="filter-btn active" data-filter="tag" data-value="all">全部</button>',
      ...sortedTagsWithCounts.map(([tag, count]) => {
        const isHot = count >= topThreeAverage;
        const hotBadge = isHot ? '<span class="hot-tag-badge">⭐</span>' : '';
        return `<button class="filter-btn ${isHot ? 'hot-tag' : ''}" data-filter="tag" data-value="${tag}" title="${count}个项目">${tag}${hotBadge}</button>`;
      })
    ].join('');

    tagFilter.innerHTML = tagHTML;
  }

  // 绑定筛选事件
  function bindFilterEvents() {
    // 快捷预设按钮点击事件
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const preset = this.dataset.preset;
        applyPreset(preset);

        // 更新预设按钮状态
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // 筛选按钮点击事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const filterType = this.dataset.filter;
        const filterValue = this.dataset.value;

        // 更新按钮状态
        if (filterType === 'tag' && filterValue !== 'all') {
          // 标签支持多选
          this.classList.toggle('active');
          if (this.classList.contains('active')) {
            if (!activeFilters.tags.includes(filterValue)) {
              activeFilters.tags.push(filterValue);
            }
          } else {
            activeFilters.tags = activeFilters.tags.filter(t => t !== filterValue);
          }
          // 取消"全部"标签的选中
          const allTagBtn = document.querySelector('[data-filter="tag"][data-value="all"]');
          if (allTagBtn && activeFilters.tags.length > 0) {
            allTagBtn.classList.remove('active');
          }
        } else {
          // 单选筛选（轮次和金额）
          const filterGroup = this.closest('.filter-options');
          filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          if (filterType === 'stage') {
            activeFilters.stage = filterValue;
          } else if (filterType === 'amount') {
            activeFilters.amount = filterValue;
          } else if (filterType === 'tag' && filterValue === 'all') {
            activeFilters.tags = [];
            // 取消所有标签选择
            document.querySelectorAll('[data-filter="tag"]').forEach(b => {
              if (b.dataset.value !== 'all') {
                b.classList.remove('active');
              }
            });
          }
        }

        // 应用筛选
        applyFilters();
      });
    });

    // 重置筛选按钮
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }
  }

  // 应用预设筛选
  function applyPreset(presetName) {
    console.log('🎯 应用预设筛选:', presetName);

    // 重置所有筛选
    activeFilters = {
      stage: 'all',
      amount: 'all',
      tags: []
    };

    // 根据预设设置筛选条件
    switch(presetName) {
      case 'early-stage':
        // 早期项目: Seed + Pre-A + 小于$10M
        activeFilters.amount = '<10M';
        // 更新按钮状态
        updateFilterButtonStates();
        // 如果有这些轮次,也激活它们(可选,这里我们主要通过金额筛选)
        break;

      case 'large-funding':
        // 大额融资: 大于$50M
        activeFilters.amount = '>100M'; // 使用最大金额区间
        updateFilterButtonStates();
        break;

      case 'healthcare-ai':
        // 医疗AI: 查找医疗相关标签
        const healthcareTags = ['医疗AI', '医疗', '健康', '诊断', '生物医药'];
        // 从当前数据中找到存在的医疗标签
        const allData = window.currentFundingData || mockFundingData;
        const availableTags = new Set();
        allData.forEach(item => {
          item.tags?.forEach(tag => {
            if (healthcareTags.some(ht => tag.includes(ht))) {
              availableTags.add(tag);
            }
          });
        });
        activeFilters.tags = Array.from(availableTags).slice(0, 3); // 最多3个标签
        updateFilterButtonStates();
        break;
    }

    // 应用筛选
    applyFilters();
  }

  // 更新筛选按钮状态
  function updateFilterButtonStates() {
    // 更新轮次按钮
    document.querySelectorAll('[data-filter="stage"]').forEach(btn => {
      if (btn.dataset.value === activeFilters.stage) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 更新金额按钮
    document.querySelectorAll('[data-filter="amount"]').forEach(btn => {
      if (btn.dataset.value === activeFilters.amount) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 更新标签按钮
    document.querySelectorAll('[data-filter="tag"]').forEach(btn => {
      if (btn.dataset.value === 'all') {
        btn.classList.toggle('active', activeFilters.tags.length === 0);
      } else {
        btn.classList.toggle('active', activeFilters.tags.includes(btn.dataset.value));
      }
    });
  }

  // 应用筛选
  function applyFilters() {
    console.log('🔍 应用筛选:', activeFilters);

    const allData = window.currentFundingData || mockFundingData;

    // 筛选数据
    let filteredData = allData.filter(item => {
      // 轮次筛选
      if (activeFilters.stage !== 'all') {
        const itemStage = stageLabels[item.stage] || item.stage;
        if (itemStage !== activeFilters.stage) {
          return false;
        }
      }

      // 金额筛选
      if (activeFilters.amount !== 'all') {
        const amount = item.amount / 1000000; // 转换为百万美元
        if (activeFilters.amount === '<10M' && amount >= 10) return false;
        if (activeFilters.amount === '10M-50M' && (amount < 10 || amount >= 50)) return false;
        if (activeFilters.amount === '50M-100M' && (amount < 50 || amount >= 100)) return false;
        if (activeFilters.amount === '>100M' && amount < 100) return false;
      }

      // 标签筛选（任意匹配）
      if (activeFilters.tags.length > 0) {
        const hasMatchingTag = item.tags?.some(tag =>
          activeFilters.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });

    console.log(`✅ 筛选完成: ${filteredData.length} / ${allData.length} 条数据`);

    // 更新筛选状态显示
    updateFilterSummary();

    // 显示筛选结果
    displayFilteredData(filteredData);
  }

  // 🎯 更新筛选状态汇总
  function updateFilterSummary() {
    // 检查是否有筛选容器插入点
    let summaryEl = document.getElementById('activeFiltersSummary');

    // 如果不存在,创建并插入到筛选栏后面
    if (!summaryEl) {
      const filterBar = document.getElementById('fundingFilterBar');
      if (!filterBar) return;

      summaryEl = document.createElement('div');
      summaryEl.id = 'activeFiltersSummary';
      summaryEl.className = 'active-filters-summary';
      summaryEl.style.display = 'none';

      // 插入到筛选栏之后
      filterBar.parentNode.insertBefore(summaryEl, filterBar.nextSibling);
    }

    const activeTags = [];

    // 添加轮次筛选
    if (activeFilters.stage !== 'all') {
      activeTags.push(`<span class="filter-tag-pill">${activeFilters.stage}</span>`);
    }

    // 添加金额筛选
    if (activeFilters.amount !== 'all') {
      activeTags.push(`<span class="filter-tag-pill">${activeFilters.amount}</span>`);
    }

    // 添加标签筛选
    activeFilters.tags.forEach(tag => {
      activeTags.push(`<span class="filter-tag-pill">${tag}</span>`);
    });

    if (activeTags.length > 0) {
      summaryEl.innerHTML = '当前筛选: ' + activeTags.join('');
      summaryEl.style.display = 'flex';
    } else {
      summaryEl.style.display = 'none';
    }
  }

  // 显示筛选后的数据
  function displayFilteredData(data) {
    const container = document.getElementById('fundingHighlights');
    if (!container) return;

    if (data.length === 0) {
      container.innerHTML = `
        <div class="funding-empty">
          <span>📋</span>
          <p>没有符合筛选条件的融资信息</p>
          <button onclick="window.fundingDaily.resetFilters()" class="retry-btn">重置筛选</button>
        </div>
      `;
      return;
    }

    // 显示筛选结果信息
    const resultInfo = `
      <div class="filter-result-info">
        找到 <strong>${data.length}</strong> 条符合条件的融资信息
      </div>
    `;

    // 生成卡片HTML
    const fundingHTML = data.map(createFundingItemHTML).join('');

    container.innerHTML = resultInfo + fundingHTML;

    // 添加点击事件
    addFundingItemClickHandlers();
  }

  // 重置筛选
  function resetFilters() {
    console.log('🔄 重置筛选');

    // 重置筛选状态
    activeFilters = {
      stage: 'all',
      amount: 'all',
      tags: []
    };

    // 重置按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.value === 'all') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 隐藏筛选状态汇总
    const summaryEl = document.getElementById('activeFiltersSummary');
    if (summaryEl) {
      summaryEl.style.display = 'none';
    }

    // 重新加载数据
    loadFundingData(false);
  }

  // 🌐 暴露公共接口
  window.fundingDaily = {
    loadFundingData,
    loadMoreFunding,
    refreshFundingData,
    initialize: initializeFundingDaily,
    initializeFilters,
    applyFilters,
    resetFilters,
    filterByChart
  };

  // 🔄 暴露翻转函数到全局作用域（用于HTML onclick）
  window.flipCard = flipCard;

  // ⏰ 更新时间显示函数
  function updateFundingTimestamp(lastUpdate) {
    const timestampElement = document.getElementById('fundingUpdateTime');
    if (!timestampElement) return;

    try {
      let formattedTime;
      if (lastUpdate) {
        const updateDate = new Date(lastUpdate);
        const now = new Date();
        const diffHours = Math.floor((now - updateDate) / (1000 * 60 * 60));

        if (diffHours < 1) {
          formattedTime = '刚刚更新';
        } else if (diffHours < 24) {
          formattedTime = `${diffHours}小时前更新`;
        } else {
          const options = {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          };
          formattedTime = updateDate.toLocaleString('zh-CN', options);
        }
      } else {
        // 显示当前精确时间和时区
        const now = new Date();
        const options = {
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        };
        formattedTime = now.toLocaleString('zh-CN', options);
      }

      timestampElement.textContent = `⏰ 更新：${formattedTime}`;
    } catch (error) {
      console.warn('更新时间格式化失败:', error);
      timestampElement.textContent = '⏰ 更新：今日更新';
    }
  }


  // 📱 DOM就绪时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFundingDaily);
  } else {
    // DOM已经加载完成
    initializeFundingDaily();
  }

})();