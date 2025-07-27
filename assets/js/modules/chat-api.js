/**
 * SVTR.AI Chat API Module
 * 聊天API处理模块
 */

import { CHAT_CONFIG, PERFORMANCE_METRICS } from './chat-config.js';

export class ChatAPI {
  constructor() {
    this.apiEndpoint = CHAT_CONFIG.API_ENDPOINT;
    this.isProduction = this.detectProductionEnvironment();
  }

  detectProductionEnvironment() {
    return window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  }

  async tryRealAPIFirst(messages, _loadingMessage) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.filter(m => m.role !== 'system')
        }),
      });

      if (response.ok) {
        return { success: true, response };
      }
    } catch (error) {
      console.warn('Real API not available, using smart demo mode', error);
    }
    return { success: false };
  }

  async handleStreamingResponse(response, assistantMessage, onUpdate, onComplete) {
    const responseStartTime = Date.now();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let lastUpdateTime = Date.now();

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            this.processBufferContent(buffer, assistantMessage, onUpdate);
          }
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() && !line.includes('[DONE]')) {
            const now = Date.now();
            if (now - lastUpdateTime >= CHAT_CONFIG.UPDATE_INTERVAL) {
              this.processBufferContent(line, assistantMessage, onUpdate);
              lastUpdateTime = now;
            }
          }
        }
      }

      this.recordResponseTime(responseStartTime);
      this.recordInteractionResult(true);
      onComplete();

    } catch (error) {
      console.error('Streaming error:', error);
      this.recordInteractionResult(false);
      throw error;
    }
  }

  processBufferContent(content, assistantMessage, onUpdate) {
    if (this.shouldFilterContent(content)) {
      return;
    }

    assistantMessage.content += content;
    onUpdate(assistantMessage.content);
  }

  shouldFilterContent(content) {
    const filterPatterns = [
      /正在分析.*?请稍候/g,
      /analyzing.*?please wait/gi,
      /思考中.*?稍等/g,
      /thinking.*?wait/gi
    ];

    return filterPatterns.some(pattern => pattern.test(content));
  }

  recordResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    PERFORMANCE_METRICS.responseTime.push(responseTime);
    PERFORMANCE_METRICS.lastResponseTime = responseTime;

    if (PERFORMANCE_METRICS.responseTime.length > 10) {
      PERFORMANCE_METRICS.responseTime.shift();
    }
  }

  recordInteractionResult(success, isRetry = false) {
    if (success) {
      PERFORMANCE_METRICS.successCount++;
    } else {
      PERFORMANCE_METRICS.errorCount++;
    }

    if (isRetry) {
      PERFORMANCE_METRICS.retryCount++;
    }
  }

  getPerformanceStats() {
    const avgResponseTime = PERFORMANCE_METRICS.responseTime.length > 0
      ? PERFORMANCE_METRICS.responseTime.reduce((a, b) => a + b, 0) / PERFORMANCE_METRICS.responseTime.length
      : 0;

    return {
      averageResponseTime: Math.round(avgResponseTime),
      successRate: PERFORMANCE_METRICS.successCount / (PERFORMANCE_METRICS.successCount + PERFORMANCE_METRICS.errorCount) * 100,
      totalInteractions: PERFORMANCE_METRICS.successCount + PERFORMANCE_METRICS.errorCount,
      retryCount: PERFORMANCE_METRICS.retryCount,
      lastResponseTime: PERFORMANCE_METRICS.lastResponseTime
    };
  }
}
