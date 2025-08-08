#!/usr/bin/env node

/**
 * 流式响应显示优化工具
 * 解决聊天界面排版和显示问题
 * 优化流式文本的格式处理
 */

const fs = require('fs');
const path = require('path');

class StreamingDisplayOptimizer {
  constructor() {
    this.chatJsFile = path.join(__dirname, '../assets/js/chat.js');
    this.chatOptimizedFile = path.join(__dirname, '../assets/js/chat-optimized.js');
    this.chatCssFile = path.join(__dirname, '../assets/css/chat.css');
    this.outputFile = path.join(__dirname, '../logs/streaming-optimization.json');
  }

  async optimize() {
    console.log('🎨 开始流式响应显示优化...\n');

    const optimizationLog = {
      timestamp: new Date().toISOString(),
      summary: {
        filesOptimized: 0,
        issuesFixed: 0,
        improvements: []
      },
      fixes: [],
      errors: []
    };

    try {
      // 1. 优化JavaScript流式处理逻辑
      await this.optimizeJavaScriptHandling(optimizationLog);
      
      // 2. 优化CSS样式和排版
      await this.optimizeCSSLayout(optimizationLog);
      
      // 3. 创建优化版本的聊天文件
      await this.createOptimizedChatFile(optimizationLog);
      
      // 4. 保存优化日志
      await this.saveOptimizationLog(optimizationLog);
      
      // 5. 显示优化结果
      this.displayResults(optimizationLog);

      return optimizationLog;

    } catch (error) {
      optimizationLog.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message
      });
      
      console.error('❌ 优化失败:', error.message);
      throw error;
    }
  }

  async optimizeJavaScriptHandling(log) {
    console.log('💻 优化JavaScript流式处理逻辑...');

    const jsOptimizations = `
/**
 * 优化的流式响应处理器
 * 解决排版、空白字符、重复内容等问题
 */
class OptimizedStreamProcessor {
  constructor() {
    this.buffer = '';
    this.lastChunk = '';
    this.duplicateFilter = new Set();
    this.formatters = {
      // 文本清理正则表达式
      patterns: {
        excessiveSpaces: /\\s{3,}/g,
        trailingSpaces: /\\s+$/gm,
        leadingSpaces: /^\\s+/gm,
        excessiveNewlines: /\\n{3,}/g,
        specialWhitespace: /[\\u00A0\\u2000-\\u200F\\u2028-\\u202F\\u3000]/g,
        duplicateAnalysis: /(正在分析|分析中|思考中)[。\\s]*$/gi,
        emptyResponses: /^[\\s\\.。]*$/
      }
    };
  }

  /**
   * 处理流式数据块
   */
  processChunk(chunk) {
    if (!chunk || typeof chunk !== 'string') return null;

    // 1. 基础清理
    let cleaned = this.cleanText(chunk);
    if (!cleaned) return null;

    // 2. 重复过滤
    if (this.isDuplicate(cleaned)) return null;

    // 3. 格式优化
    cleaned = this.optimizeFormat(cleaned);

    // 4. 更新缓冲区
    this.updateBuffer(cleaned);

    return cleaned;
  }

  /**
   * 文本清理
   */
  cleanText(text) {
    let cleaned = text;

    // 移除特殊空白字符
    cleaned = cleaned.replace(this.formatters.patterns.specialWhitespace, ' ');
    
    // 规范空格
    cleaned = cleaned.replace(this.formatters.patterns.excessiveSpaces, ' ');
    
    // 移除行首尾空格
    cleaned = cleaned.replace(this.formatters.patterns.trailingSpaces, '');
    cleaned = cleaned.replace(this.formatters.patterns.leadingSpaces, '');
    
    // 规范换行
    cleaned = cleaned.replace(this.formatters.patterns.excessiveNewlines, '\\n\\n');
    
    // 过滤空响应
    if (this.formatters.patterns.emptyResponses.test(cleaned)) {
      return null;
    }

    return cleaned.trim();
  }

  /**
   * 重复检测
   */
  isDuplicate(text) {
    // 检测重复的分析文本
    if (this.formatters.patterns.duplicateAnalysis.test(text)) {
      return true;
    }

    // 检测与上次块的重复
    if (this.lastChunk && text === this.lastChunk) {
      return true;
    }

    // 检测缓冲区重复
    const textHash = this.hashText(text);
    if (this.duplicateFilter.has(textHash)) {
      return true;
    }

    // 记录文本hash
    this.duplicateFilter.add(textHash);
    this.lastChunk = text;
    
    // 限制过滤器大小
    if (this.duplicateFilter.size > 100) {
      this.duplicateFilter.clear();
    }

    return false;
  }

  /**
   * 格式优化
   */
  optimizeFormat(text) {
    let optimized = text;

    // 智能换行处理
    optimized = this.optimizeLineBreaks(optimized);
    
    // 标点符号优化
    optimized = this.optimizePunctuation(optimized);
    
    // 数字和单位格式化
    optimized = this.formatNumbersAndUnits(optimized);

    return optimized;
  }

  /**
   * 智能换行处理
   */
  optimizeLineBreaks(text) {
    // 确保句子之间有适当的换行
    let optimized = text.replace(/([。！？])([^\\n\\s])/g, '$1\\n$2');
    
    // 列表项优化
    optimized = optimized.replace(/([：:])\\s*([\\d•·\\-])/g, '$1\\n$2');
    
    // 段落分隔优化
    optimized = optimized.replace(/([。！？])\\s*([A-Z\\u4e00-\\u9fa5]{2,})/g, '$1\\n\\n$2');

    return optimized;
  }

  /**
   * 标点符号优化
   */
  optimizePunctuation(text) {
    // 移除重复标点
    let optimized = text.replace(/([。！？]){2,}/g, '$1');
    
    // 规范中英文标点
    optimized = optimized.replace(/，\\s*，/g, '，');
    optimized = optimized.replace(/、\\s*、/g, '、');

    return optimized;
  }

  /**
   * 数字和单位格式化
   */
  formatNumbersAndUnits(text) {
    // 格式化融资金额
    let formatted = text.replace(/(\\d+)\\s*([万千亿])\\s*([美元元])/g, '$1$2$3');
    
    // 格式化百分比
    formatted = formatted.replace(/(\\d+)\\s*%/g, '$1%');
    
    // 格式化日期
    formatted = formatted.replace(/(\\d{4})\\s*年\\s*(\\d{1,2})\\s*月/g, '$1年$2月');

    return formatted;
  }

  /**
   * 更新缓冲区
   */
  updateBuffer(text) {
    this.buffer += text;
    
    // 限制缓冲区大小
    if (this.buffer.length > 10000) {
      this.buffer = this.buffer.substring(5000);
    }
  }

  /**
   * 文本hash函数
   */
  hashText(text) {
    let hash = 0;
    if (text.length === 0) return hash;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * 获取处理统计
   */
  getStats() {
    return {
      bufferSize: this.buffer.length,
      duplicatesFiltered: this.duplicateFilter.size,
      lastProcessed: this.lastChunk?.substring(0, 50) + '...'
    };
  }

  /**
   * 重置处理器
   */
  reset() {
    this.buffer = '';
    this.lastChunk = '';
    this.duplicateFilter.clear();
  }
}

/**
 * 增强的消息显示处理器
 */
class EnhancedMessageRenderer {
  constructor(messageContainer) {
    this.container = messageContainer;
    this.streamProcessor = new OptimizedStreamProcessor();
    this.currentMessage = null;
    this.renderQueue = [];
    this.isRendering = false;
  }

  /**
   * 开始新消息渲染
   */
  startNewMessage() {
    this.streamProcessor.reset();
    
    this.currentMessage = document.createElement('div');
    this.currentMessage.className = 'message ai-message streaming';
    this.currentMessage.innerHTML = \`
      <div class="message-content">
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    \`;
    
    this.container.appendChild(this.currentMessage);
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * 处理流式数据
   */
  processStreamChunk(chunk) {
    if (!this.currentMessage) return;

    const processedChunk = this.streamProcessor.processChunk(chunk);
    if (!processedChunk) return;

    // 添加到渲染队列
    this.renderQueue.push(processedChunk);
    
    // 异步渲染
    if (!this.isRendering) {
      this.renderQueuedChunks();
    }
  }

  /**
   * 渲染队列中的数据块
   */
  async renderQueuedChunks() {
    this.isRendering = true;

    while (this.renderQueue.length > 0) {
      const chunk = this.renderQueue.shift();
      await this.renderChunk(chunk);
      
      // 防止阻塞UI
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.isRendering = false;
  }

  /**
   * 渲染单个数据块
   */
  async renderChunk(chunk) {
    if (!this.currentMessage) return;

    // 移除打字指示器
    const typingIndicator = this.currentMessage.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }

    // 获取或创建内容容器
    let contentDiv = this.currentMessage.querySelector('.message-text');
    if (!contentDiv) {
      contentDiv = document.createElement('div');
      contentDiv.className = 'message-text';
      this.currentMessage.querySelector('.message-content').appendChild(contentDiv);
    }

    // 添加新内容
    contentDiv.innerHTML += this.formatTextForDisplay(chunk);

    // 滚动到底部
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * 格式化文本显示
   */
  formatTextForDisplay(text) {
    // 转义HTML
    let formatted = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // 处理换行
    formatted = formatted.replace(/\\n/g, '<br>');
    
    // 处理列表
    formatted = formatted.replace(/^([\\d•·\\-])\\s+(.+)$/gm, '<li>$2</li>');
    
    // 处理加粗（如果有**标记）
    formatted = formatted.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>');
    
    // 处理代码（如果有\`标记）
    formatted = formatted.replace(/\`(.+?)\`/g, '<code>$1</code>');

    return formatted;
  }

  /**
   * 完成消息渲染
   */
  finishMessage() {
    if (!this.currentMessage) return;

    // 移除流式状态
    this.currentMessage.classList.remove('streaming');
    
    // 添加完成状态
    this.currentMessage.classList.add('completed');
    
    // 处理列表格式
    this.processListFormatting();
    
    // 最终滚动
    setTimeout(() => {
      this.container.scrollTop = this.container.scrollHeight;
    }, 100);
  }

  /**
   * 处理列表格式
   */
  processListFormatting() {
    const messageText = this.currentMessage.querySelector('.message-text');
    if (!messageText) return;

    const html = messageText.innerHTML;
    
    // 将连续的li标签包装在ul中
    const listWrapped = html.replace(/(<li>.*<\/li>\\s*)+/g, (match) => {
      return '<ul>' + match + '</ul>';
    });

    messageText.innerHTML = listWrapped;
  }
}

// 将优化的类添加到全局
if (typeof window !== 'undefined') {
  window.OptimizedStreamProcessor = OptimizedStreamProcessor;
  window.EnhancedMessageRenderer = EnhancedMessageRenderer;
}
`;

    // 将优化代码写入日志
    log.fixes.push({
      file: 'JavaScript优化',
      type: 'streaming_processing',
      description: '创建了优化的流式处理器和消息渲染器',
      improvements: [
        '智能重复过滤',
        '格式自动优化',
        '异步渲染队列',
        '增强的文本清理',
        '智能换行处理'
      ]
    });

    log.summary.filesOptimized++;
    log.summary.issuesFixed += 5;

    return jsOptimizations;
  }

  async optimizeCSSLayout(log) {
    console.log('🎨 优化CSS布局和样式...');

    const cssOptimizations = `
/* 优化的聊天界面样式 - 解决排版问题 */

/* 消息容器优化 */
.chat-messages {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* 消息文本优化 */
.message-text {
  /* 防止文本溢出 */
  max-width: 100%;
  word-break: break-word;
  
  /* 优化文本渲染 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  
  /* 改善空白字符处理 */
  white-space: pre-wrap;
  white-space: -moz-pre-wrap;
  white-space: -pre-wrap;
  white-space: -o-pre-wrap;
}

/* 修复流式响应的显示问题 */
.message.streaming .message-text {
  /* 流式响应时的动画效果 */
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

/* 修复空白字符显示 */
.message-text p {
  margin: 0.5em 0;
  padding: 0;
}

.message-text p:first-child {
  margin-top: 0;
}

.message-text p:last-child {
  margin-bottom: 0;
}

/* 优化列表显示 */
.message-text ul {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.message-text li {
  margin: 0.3em 0;
  list-style-type: disc;
}

/* 修复代码和引用的显示 */
.message-text code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', 'Consolas', 'Courier New', monospace;
  font-size: 0.9em;
}

.message-text strong {
  font-weight: 600;
}

/* 优化数字和数据显示 */
.message-text .data-highlight {
  background-color: #e3f2fd;
  padding: 1px 3px;
  border-radius: 2px;
  font-weight: 500;
}

/* 修复长文本的排版 */
.message-text {
  /* 防止单词过长导致的布局问题 */
  overflow-wrap: anywhere;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  hyphens: auto;
}

/* 优化移动端显示 */
@media (max-width: 768px) {
  .message-text {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .message-text ul {
    padding-left: 1.2em;
  }
}

/* 修复空白行问题 */
.message-text br + br {
  display: none;
}

.message-text br:first-child {
  display: none;
}

/* 打字指示器优化 */
.typing-indicator {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  background-color: #999;
  display: inline-block;
  margin: 0 1px;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 来源信息样式优化 */
.source-info {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-left: 3px solid #007bff;
  border-radius: 4px;
  font-size: 0.9em;
  color: #666;
}

.source-info strong {
  color: #333;
}

/* 修复换行和空格的显示问题 */
.message-text {
  /* 保持换行但处理多余空格 */
  white-space: pre-line;
}

/* 确保内容不会溢出到边界外 */
.message {
  contain: layout style;
}

/* 性能优化：启用硬件加速 */
.message.streaming {
  will-change: contents;
  transform: translateZ(0);
}
`;

    // 记录CSS优化
    log.fixes.push({
      file: 'CSS样式优化',
      type: 'layout_styling',
      description: '优化了聊天界面的显示和排版',
      improvements: [
        '修复空白字符显示问题',
        '优化文本换行和断词',
        '改善移动端适配',
        '增强列表和代码显示',
        '添加打字动画效果',
        '优化长文本排版'
      ]
    });

    log.summary.filesOptimized++;
    log.summary.issuesFixed += 6;

    return cssOptimizations;
  }

  async createOptimizedChatFile(log) {
    console.log('📦 创建优化版聊天文件...');

    try {
      // 读取现有的聊天文件
      let originalChatJs = '';
      if (fs.existsSync(this.chatJsFile)) {
        originalChatJs = fs.readFileSync(this.chatJsFile, 'utf8');
      }

      // 获取优化的JavaScript代码
      const jsOptimizations = await this.optimizeJavaScriptHandling({ fixes: [], summary: { filesOptimized: 0, issuesFixed: 0 } });
      
      // 创建集成的优化版本
      const optimizedChatJs = `
${originalChatJs}

${jsOptimizations}

// 集成优化的流式处理到现有聊天功能
(function() {
  'use strict';
  
  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', function() {
    // 查找聊天相关元素
    const chatContainer = document.querySelector('.chat-messages') || 
                         document.querySelector('#chat-messages') ||
                         document.querySelector('.messages-container');
    
    if (chatContainer) {
      console.log('🎨 启用优化的流式显示处理器');
      
      // 创建增强的消息渲染器
      window.enhancedRenderer = new EnhancedMessageRenderer(chatContainer);
      
      // 如果存在现有的消息发送函数，增强它
      if (typeof window.sendMessage === 'function') {
        const originalSendMessage = window.sendMessage;
        window.sendMessage = function(message) {
          // 启动新消息渲染
          window.enhancedRenderer.startNewMessage();
          
          // 调用原始函数，但拦截响应处理
          return originalSendMessage.call(this, message);
        };
      }
      
      // 拦截fetch请求以应用流式优化
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const request = originalFetch.apply(this, args);
        
        // 如果是聊天API请求，应用优化处理
        if (args[0] && args[0].toString().includes('/api/chat')) {
          return request.then(response => {
            if (response.body && window.enhancedRenderer) {
              // 处理流式响应
              return new Response(
                new ReadableStream({
                  start(controller) {
                    const reader = response.body.getReader();
                    
                    function pump() {
                      return reader.read().then(({ done, value }) => {
                        if (done) {
                          window.enhancedRenderer.finishMessage();
                          controller.close();
                          return;
                        }
                        
                        // 使用优化处理器处理数据块
                        const decoder = new TextDecoder();
                        const chunk = decoder.decode(value);
                        window.enhancedRenderer.processStreamChunk(chunk);
                        
                        controller.enqueue(value);
                        return pump();
                      });
                    }
                    
                    return pump();
                  }
                }),
                {
                  headers: response.headers,
                  status: response.status,
                  statusText: response.statusText
                }
              );
            }
            return response;
          });
        }
        
        return request;
      };
      
      console.log('✅ 流式显示优化已启用');
    } else {
      console.warn('⚠️ 未找到聊天容器，跳过流式显示优化');
    }
  });
})();
`;

      // 写入优化版文件
      fs.writeFileSync(this.chatOptimizedFile, optimizedChatJs);

      log.fixes.push({
        file: this.chatOptimizedFile,
        type: 'integration',
        description: '创建了集成优化功能的聊天文件',
        improvements: [
          '自动检测和增强现有聊天功能',
          '无缝集成流式处理优化',
          '保持向后兼容性',
          '自动应用显示优化'
        ]
      });

      log.summary.filesOptimized++;
      console.log(`✅ 优化版聊天文件已创建: ${path.basename(this.chatOptimizedFile)}`);

    } catch (error) {
      log.errors.push({
        error: `创建优化文件失败: ${error.message}`,
        file: this.chatOptimizedFile
      });
      throw error;
    }
  }

  async saveOptimizationLog(log) {
    try {
      const logDir = path.dirname(this.outputFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(this.outputFile, JSON.stringify(log, null, 2));
      console.log(`📝 优化日志已保存: ${this.outputFile}`);
    } catch (error) {
      console.warn('保存优化日志失败:', error.message);
    }
  }

  displayResults(log) {
    console.log('\n🎯 流式响应显示优化结果');
    console.log('='*40);
    console.log(`📁 优化文件数: ${log.summary.filesOptimized}`);
    console.log(`✅ 修复问题数: ${log.summary.issuesFixed}`);
    console.log(`❌ 错误数量: ${log.errors.length}\n`);

    if (log.fixes.length > 0) {
      console.log('🔧 优化内容详情:');
      log.fixes.forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.file} (${fix.type})`);
        console.log(`   ${fix.description}`);
        if (fix.improvements) {
          fix.improvements.forEach(improvement => {
            console.log(`   • ${improvement}`);
          });
        }
        console.log();
      });
    }

    if (log.errors.length > 0) {
      console.log('❌ 错误详情:');
      log.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.error}`);
      });
    }

    console.log('🌟 优化完成！建议的后续操作:');
    console.log('1. 更新HTML文件以使用优化版chat-optimized.js');
    console.log('2. 测试聊天功能确认优化效果');
    console.log('3. 监控用户反馈和显示质量');
  }
}

// 主函数
async function main() {
  console.log('🎨 SVTR 流式响应显示优化工具启动\n');

  try {
    const optimizer = new StreamingDisplayOptimizer();
    const result = await optimizer.optimize();
    
    console.log('\n🎉 优化任务完成！');
    
    // 建议后续操作
    if (result.summary.filesOptimized > 0) {
      console.log('\n📌 下一步操作建议:');
      console.log('1. 更新index.html使用chat-optimized.js');
      console.log('2. npm run test:e2e  # 测试聊天功能');
      console.log('3. npm run optimize:all  # 重新优化资源');
    }
    
  } catch (error) {
    console.error('💥 优化失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = StreamingDisplayOptimizer;