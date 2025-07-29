/**
 * SVTR.AI 错误处理和日志管理
 * 统一处理前端错误，避免控制台警告
 */

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    // 捕获Promise拒绝错误
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        reason: event.reason
      });
      
      // 防止控制台显示错误
      event.preventDefault();
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: 'resource',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href
        });
      }
    }, true);

    this.isInitialized = true;
  }

  handleError(errorInfo) {
    // 过滤已知的Chrome扩展错误
    if (this.isKnownExtensionError(errorInfo)) {
      return;
    }

    // 过滤CSS预加载警告
    if (this.isCSSPreloadWarning(errorInfo)) {
      return;
    }

    // 记录有效错误
    this.logError(errorInfo);
  }

  isKnownExtensionError(errorInfo) {
    const knownExtensionErrors = [
      'all-frames.js',
      'Could not establish connection',
      'Receiving end does not exist',
      'Extension context invalidated',
      'chrome-extension://'
    ];

    const message = errorInfo.message || '';
    const filename = errorInfo.filename || '';
    
    return knownExtensionErrors.some(pattern => 
      message.includes(pattern) || filename.includes(pattern)
    );
  }

  isCSSPreloadWarning(errorInfo) {
    const message = errorInfo.message || '';
    return message.includes('preloaded using link preload but not used');
  }

  logError(errorInfo) {
    // 只在开发环境记录错误
    if (!this.isProduction()) {
      console.group('🚨 SVTR.AI Error Handler');
      console.error('Error Type:', errorInfo.type);
      console.error('Message:', errorInfo.message);
      if (errorInfo.filename) console.error('File:', errorInfo.filename);
      if (errorInfo.lineno) console.error('Line:', errorInfo.lineno);
      console.groupEnd();
    }

    // 存储错误用于分析
    this.errorQueue.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // 限制错误队列大小
    if (this.errorQueue.length > 50) {
      this.errorQueue.shift();
    }
  }

  isProduction() {
    return window.location.hostname !== 'localhost' && 
           !window.location.hostname.includes('127.0.0.1') &&
           !window.location.hostname.includes('preview');
  }

  getErrorReport() {
    return {
      errors: this.errorQueue,
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      },
      page: {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      }
    };
  }

  clearErrors() {
    this.errorQueue = [];
  }
}

// 全局初始化错误处理器
if (typeof window !== 'undefined') {
  window.SVTRErrorHandler = new ErrorHandler();
}