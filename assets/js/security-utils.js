/**
 * SVTR.AI 安全工具函数
 * 提供XSS防护、输入验证和安全处理
 */

class SecurityUtils {
  /**
   * HTML转义防止XSS攻击
   * @param {string} str - 需要转义的字符串
   * @returns {string} 转义后的安全字符串
   */
  static escapeHtml(str) {
    if (typeof str !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 严格的HTML清理，只允许安全标签
   * @param {string} html - 需要清理的HTML字符串
   * @returns {string} 清理后的安全HTML
   */
  static sanitizeHtml(html) {
    if (typeof html !== 'string') {
      return '';
    }

    // 允许的安全标签和属性
    const allowedTags = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div'];
    const allowedAttributes = ['class'];

    // 创建临时容器
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // 递归清理所有元素
    this.cleanElement(temp, allowedTags, allowedAttributes);

    return temp.innerHTML;
  }

  /**
   * 清理DOM元素，移除不安全的标签和属性
   * @param {Element} element - 要清理的元素
   * @param {Array} allowedTags - 允许的标签列表
   * @param {Array} allowedAttributes - 允许的属性列表
   */
  static cleanElement(element, allowedTags, allowedAttributes) {
    const children = Array.from(element.children);

    children.forEach(child => {
      // 检查标签是否允许
      if (!allowedTags.includes(child.tagName.toLowerCase())) {
        // 不允许的标签，替换为span或移除
        const replacement = document.createElement('span');
        replacement.textContent = child.textContent;
        element.replaceChild(replacement, child);
        return;
      }

      // 清理属性
      const attributes = Array.from(child.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        }
      });

      // 递归清理子元素
      this.cleanElement(child, allowedTags, allowedAttributes);
    });
  }

  /**
   * 验证用户输入
   * @param {string} input - 用户输入
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果 {isValid: boolean, message: string, sanitized: string}
   */
  static validateInput(input, options = {}) {
    const defaults = {
      maxLength: 1000,
      minLength: 1,
      allowEmpty: false,
      type: 'text' // text, email, url
    };

    const opts = { ...defaults, ...options };
    const result = { isValid: true, message: '', sanitized: '' };

    // 基本检查
    if (typeof input !== 'string') {
      result.isValid = false;
      result.message = '输入必须是字符串';
      return result;
    }

    // 长度检查
    if (!opts.allowEmpty && input.trim().length < opts.minLength) {
      result.isValid = false;
      result.message = `输入不能少于${opts.minLength}个字符`;
      return result;
    }

    if (input.length > opts.maxLength) {
      result.isValid = false;
      result.message = `输入不能超过${opts.maxLength}个字符`;
      return result;
    }

    // 类型验证
    switch (opts.type) {
    case 'email': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input)) {
        result.isValid = false;
        result.message = '请输入有效的邮箱地址';
        return result;
      }
      break;
    }

    case 'url':
      try {
        new URL(input);
      } catch {
        result.isValid = false;
        result.message = '请输入有效的URL地址';
        return result;
      }
      break;
    }

    // 恶意脚本检测
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /<form/gi
    ];

    const hasDangerousContent = dangerousPatterns.some(pattern => pattern.test(input));
    if (hasDangerousContent) {
      result.isValid = false;
      result.message = '输入包含不安全的内容';
      return result;
    }

    // 返回清理后的输入
    result.sanitized = this.escapeHtml(input.trim());
    return result;
  }

  /**
   * 生成安全的随机字符串（用于CSRF token等）
   * @param {number} length - 字符串长度
   * @returns {string} 随机字符串
   */
  static generateSecureRandom(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);

      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // 降级到Math.random（不够安全，但总比没有好）
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }

    return result;
  }

  /**
   * 检查URL是否为同源或白名单域名
   * @param {string} url - 要检查的URL
   * @param {Array} whitelist - 白名单域名列表
   * @returns {boolean} 是否安全
   */
  static isSafeUrl(url, whitelist = []) {
    try {
      const parsedUrl = new URL(url, window.location.href);
      const currentOrigin = window.location.origin;

      // 同源检查
      if (parsedUrl.origin === currentOrigin) {
        return true;
      }

      // 白名单检查
      const safeOrigins = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://c0uiiy15npu.feishu.cn',
        ...whitelist
      ];

      return safeOrigins.includes(parsedUrl.origin);
    } catch {
      return false;
    }
  }

  /**
   * 安全的JSON解析
   * @param {string} jsonString - JSON字符串
   * @returns {Object|null} 解析结果或null
   */
  static safeJsonParse(jsonString) {
    try {
      // 基本的JSON格式检查
      if (typeof jsonString !== 'string' || !jsonString.trim()) {
        return null;
      }

      // 检查是否包含函数调用等危险内容
      const dangerousPatterns = [
        /function\s*\(/gi,
        /=>\s*{/gi,
        /eval\s*\(/gi,
        /constructor/gi
      ];

      const hasDangerousContent = dangerousPatterns.some(pattern =>
        pattern.test(jsonString)
      );

      if (hasDangerousContent) {
        console.warn('JSON包含潜在危险内容，解析被阻止');
        return null;
      }

      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('JSON解析失败:', error);
      return null;
    }
  }

  /**
   * 限制函数调用频率（防止暴力攻击）
   * @param {Function} func - 要限制的函数
   * @param {number} limit - 时间窗口内最大调用次数
   * @param {number} window - 时间窗口（毫秒）
   * @returns {Function} 受限制的函数
   */
  static rateLimit(func, limit = 10, window = 60000) {
    const calls = [];

    return function(...args) {
      const now = Date.now();

      // 清理过期的调用记录
      while (calls.length > 0 && calls[0] < now - window) {
        calls.shift();
      }

      // 检查是否超过限制
      if (calls.length >= limit) {
        console.warn('调用频率超过限制');
        return;
      }

      calls.push(now);
      return func.apply(this, args);
    };
  }
}

// 导出到全局作用域
window.SecurityUtils = SecurityUtils;
