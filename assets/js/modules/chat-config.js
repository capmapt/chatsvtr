/**
 * SVTR.AI Chat Configuration Module
 * 聊天组件配置模块
 */

import { getConfig } from '../../../config/app.config.js';

export const CHAT_CONFIG = {
  // API配置
  API_ENDPOINT: getConfig('api.chat'),
  MAX_MESSAGES: getConfig('performance.maxMessages'),

  // 性能配置
  UPDATE_INTERVAL: 30,
  SCROLL_THROTTLE: getConfig('performance.scrollThrottle'),
  UPDATE_THROTTLE: getConfig('performance.updateThrottle'),

  // UI配置
  TYPING_DELAY: getConfig('performance.typingDelay'),
  MAX_RETRIES: getConfig('performance.maxRetries'),

  // 智能演示模式配置
  DEMO_RESPONSES: {
    zh: {
      // 中文演示响应
      ai_venture: [
        'AI创投领域正在经历前所未有的增长。据最新数据显示，2024年全球AI创投融资额已突破500亿美元。',
        '在硅谷，AI初创公司的估值普遍较高，主要集中在机器学习、计算机视觉和自然语言处理领域。',
        'AI创投的热门赛道包括：生成式AI、AI基础设施、垂直AI应用、机器人技术等。'
      ],
      svtr_info: [
        '硅谷科技评论(SVTR.AI)专注于AI创投行业生态系统建设。我们提供AI创投库、AI周报、交易精选等专业服务。',
        'SVTR.AI致力于连接全球AI创投从业者，包括投资人、创业者、行业研究人员等。',
        '我们的核心价值是通过专业的数据分析和深度报告，帮助用户把握AI创投机会。'
      ],
      general: [
        '感谢您的问题！我是SVTR.AI的AI助手，专门为AI创投领域提供专业分析和建议。',
        '这是一个很好的问题。基于我们的AI创投知识库，我可以为您提供相关的行业洞察。',
        '让我基于SVTR.AI的专业数据库为您分析这个问题。'
      ]
    },
    en: {
      ai_venture: [
        'The AI venture capital space is experiencing unprecedented growth. Latest data shows global AI VC funding has exceeded $50 billion in 2024.',
        'In Silicon Valley, AI startups are commanding high valuations, primarily in machine learning, computer vision, and natural language processing.',
        'Hot tracks in AI venture capital include: Generative AI, AI infrastructure, vertical AI applications, and robotics technology.'
      ],
      svtr_info: [
        'Silicon Valley Tech Review (SVTR.AI) focuses on building the AI venture capital industry ecosystem. We provide professional services including AI VC database, AI weekly reports, and curated deals.',
        'SVTR.AI is committed to connecting global AI venture capital professionals, including investors, entrepreneurs, and industry researchers.',
        'Our core value is helping users capture AI venture opportunities through professional data analysis and in-depth reports.'
      ],
      general: [
        'Thank you for your question! I\'m SVTR.AI\'s AI assistant, specialized in providing professional analysis and advice for the AI venture capital field.',
        'That\'s a great question. Based on our AI venture capital knowledge base, I can provide relevant industry insights.',
        'Let me analyze this question based on SVTR.AI\'s professional database.'
      ]
    }
  }
};

export const PERFORMANCE_METRICS = {
  responseTime: [],
  errorCount: 0,
  successCount: 0,
  retryCount: 0,
  lastResponseTime: 0
};
