/**
 * SVTR.AI Application Configuration
 * 应用配置管理
 */

export const APP_CONFIG = {
  // 应用基本信息
  app: {
    name: 'SVTR.AI',
    version: '2.0.0',
    description: '硅谷科技评论 - AI创投行业生态系统平台',
    author: 'SVTR Team',
    homepage: 'https://svtr.ai'
  },

  // 环境配置
  environment: {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
    apiBaseUrl: '/api',
    assetsPath: '/assets'
  },

  // API端点配置
  api: {
    chat: '/api/chat',
    quotaStatus: '/api/quota-status',
    cacheStats: '/api/cache-stats',
    usageMonitor: '/api/usage-monitor',
    syncKnowledgeBase: '/api/sync-knowledge-base',
    resilientChat: '/api/resilient-chat'
  },

  // 性能配置
  performance: {
    maxMessages: 20,
    scrollThrottle: 100,
    updateThrottle: 50,
    typingDelay: 20,
    maxRetries: 3,
    cacheTimeout: 300000, // 5分钟
    requestTimeout: 30000  // 30秒
  },

  // UI配置
  ui: {
    defaultLanguage: 'zh',
    supportedLanguages: ['zh', 'en'],
    themes: ['light', 'dark'],
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    }
  },

  // 功能开关
  features: {
    enableRealTimeChat: true,
    enableSmartDemo: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
    enableAnalytics: false, // 待实施
    enableOfflineMode: false, // 待实施
    enablePushNotifications: false // 待实施
  },

  // 安全配置
  security: {
    maxInputLength: 1000,
    rateLimitPerMinute: 10,
    enableContentFiltering: true,
    allowedDomains: [
      'svtr.ai',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ]
  },

  // 缓存配置
  cache: {
    staticAssetsMaxAge: 31536000, // 1年
    apiResponseMaxAge: 3600,      // 1小时
    userDataMaxAge: 86400,        // 1天
    enableServiceWorker: false    // 待实施
  },

  // 监控和分析
  monitoring: {
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    enableUserBehaviorTracking: false, // 待实施
    sampleRate: 0.1 // 10% 采样率
  }
};

// 根据环境动态调整配置
if (APP_CONFIG.environment.isDevelopment) {
  APP_CONFIG.monitoring.sampleRate = 1.0; // 开发环境100%采样
  APP_CONFIG.features.enableAnalytics = false;
} else {
  APP_CONFIG.performance.typingDelay = 15; // 生产环境更快的打字效果
}

// 导出配置访问器
export function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], APP_CONFIG);
}

export function setConfig(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], APP_CONFIG);
  if (target) {
    target[lastKey] = value;
  }
}

// 配置验证
export function validateConfig() {
  const required = [
    'app.name',
    'api.chat',
    'performance.maxMessages',
    'ui.defaultLanguage'
  ];
  
  const missing = required.filter(path => !getConfig(path));
  if (missing.length > 0) {
    console.warn('Missing required configuration:', missing);
  }
  
  return missing.length === 0;
}

// 在开发环境暴露配置到全局
if (APP_CONFIG.environment.isDevelopment) {
  window.APP_CONFIG = APP_CONFIG;
  window.getConfig = getConfig;
  window.setConfig = setConfig;
}