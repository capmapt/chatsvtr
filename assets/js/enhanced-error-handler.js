/**
 * 增强版错误处理器
 * 提供全面的错误监控、报告和恢复机制
 */

class EnhancedErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 50;
    this.reportEndpoint = '/api/errors';

    this.initializeGlobalHandlers();
  }

  initializeGlobalHandlers() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'unhandledrejection',
        promise: true
      });
    });

    // 捕获JavaScript运行时错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // 捕获网络请求错误
    this.interceptFetchErrors();
  }

  handleError(error, context = {}) {
    // 过滤掉Chrome扩展错误
    if (this.isExtensionError(error, context)) {
      return;
    }

    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    this.queueError(errorReport);

    // 对于关键错误，立即发送
    if (this.isCriticalError(error)) {
      this.sendErrorsImmediately();
    }
  }

  isExtensionError(error, context) {
    const errorText = String(error.message || '');
    const filename = context.filename || '';

    return errorText.includes('all-frames.js') ||
               errorText.includes('Could not establish connection') ||
               filename.includes('chrome-extension://') ||
               filename.includes('all-frames.js');
  }

  isCriticalError(error) {
    const criticalPatterns = [
      /Cannot read propert/i,
      /is not a function/i,
      /Network.*failed/i,
      /API.*error/i
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(error.message)
    );
  }

  queueError(errorReport) {
    this.errorQueue.push(errorReport);

    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift(); // 移除最旧的错误
    }

    // 定期发送错误批次
    this.scheduleErrorSending();
  }

  scheduleErrorSending() {
    if (this.sendTimeout) {
      return;
    }

    this.sendTimeout = setTimeout(() => {
      this.sendErrorBatch();
      this.sendTimeout = null;
    }, 5000); // 5秒后发送批次
  }

  async sendErrorBatch() {
    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors })
      });

      console.log(`📊 错误报告已发送: ${errors.length}个错误`);
    } catch (e) {
      // 发送失败时重新加入队列
      this.errorQueue.unshift(...errors);
      console.warn('错误报告发送失败，已重新加入队列');
    }
  }

  async sendErrorsImmediately() {
    await this.sendErrorBatch();
  }

  interceptFetchErrors() {
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        // 记录网络错误
        window.errorHandler?.handleError(error, {
          type: 'network',
          url: args[0],
          options: args[1]
        });

        throw error;
      }
    };
  }

  getSessionId() {
    let sessionId = localStorage.getItem('error_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('error_session_id', sessionId);
    }
    return sessionId;
  }

  // 公共API
  reportCustomError(message, details = {}) {
    this.handleError(new Error(message), {
      type: 'custom',
      details
    });
  }

  // 性能监控
  reportPerformanceIssue(metric, value, threshold) {
    if (value > threshold) {
      this.reportCustomError(`性能指标超阈值: ${metric}`, {
        metric,
        value,
        threshold,
        type: 'performance'
      });
    }
  }
}

// 全局初始化
if (typeof window !== 'undefined') {
  window.errorHandler = new EnhancedErrorHandler();
}

export default EnhancedErrorHandler;
