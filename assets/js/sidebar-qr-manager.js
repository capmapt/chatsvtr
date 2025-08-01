/**
 * 🎨 SVTR.AI QR码切换管理器
 * 提供流畅的多语言QR码切换动画体验
 */

class SidebarQRManager {
  constructor() {
    this.currentLanguage = document.documentElement.lang || 'zh-CN';
    this.isAnimating = false;
    this.animationDuration = 300; // 动画持续时间
    
    this.init();
  }

  init() {
    this.cacheDOMElements();
    this.setupEventListeners();
    this.initializeQRDisplay();
  }

  cacheDOMElements() {
    this.wechatQR = document.querySelector('.wechat-qr');
    this.discordQR = document.querySelector('.discord-qr');
    this.qrContainer = document.querySelector('.qr-container');
    
    // 验证必要元素存在
    if (!this.wechatQR || !this.discordQR) {
      console.warn('QR Manager: QR code elements not found');
      return false;
    }
    
    return true;
  }

  setupEventListeners() {
    // 监听语言切换事件
    document.addEventListener('languageChanged', (e) => {
      this.handleLanguageChange(e.detail.language);
    });

    // 监听HTML lang属性变化（通过MutationObserver）
    this.observeLanguageChanges();
  }

  observeLanguageChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'lang') {
          const newLang = document.documentElement.lang;
          if (newLang !== this.currentLanguage) {
            this.handleLanguageChange(newLang);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  }

  initializeQRDisplay() {
    // 根据当前语言初始化QR码显示状态
    this.setQRVisibility(this.currentLanguage, false); // 不使用动画
  }

  /**
   * 处理语言切换
   * @param {string} newLanguage - 新的语言代码
   */
  async handleLanguageChange(newLanguage) {
    if (this.isAnimating || newLanguage === this.currentLanguage) {
      return;
    }

    console.log(`QR Manager: Switching from ${this.currentLanguage} to ${newLanguage}`);
    
    this.isAnimating = true;
    const oldLanguage = this.currentLanguage;
    this.currentLanguage = newLanguage;

    try {
      await this.performSmoothQRSwitch(oldLanguage, newLanguage);
    } catch (error) {
      console.error('QR Manager: Animation error:', error);
      // 降级到即时切换
      this.setQRVisibility(newLanguage, false);
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * 执行流畅的QR码切换动画
   * @param {string} oldLanguage - 旧语言
   * @param {string} newLanguage - 新语言
   */
  async performSmoothQRSwitch(oldLanguage, newLanguage) {
    const currentQR = this.getQRElement(oldLanguage);
    const targetQR = this.getQRElement(newLanguage);

    if (!currentQR || !targetQR) {
      console.warn('QR Manager: QR elements not found for language switch');
      return;
    }

    // 如果是相同的QR码，不需要切换
    if (currentQR === targetQR) {
      return;
    }

    // 第一阶段：淡出当前QR码
    await this.fadeOutQR(currentQR);

    // 第二阶段：切换显示状态
    this.setQRVisibility(newLanguage, false);

    // 第三阶段：淡入新QR码
    await this.fadeInQR(targetQR);
  }

  /**
   * 淡出QR码动画
   * @param {HTMLElement} qrElement - QR码元素
   */
  fadeOutQR(qrElement) {
    return new Promise((resolve) => {
      if (!qrElement || getComputedStyle(qrElement).display === 'none') {
        resolve();
        return;
      }

      const wrapper = qrElement.querySelector('.qr-image-wrapper');
      if (!wrapper) {
        resolve();
        return;
      }

      // 添加淡出动画类
      wrapper.classList.add('qr-switching-out');

      // 动画完成后的清理
      const cleanup = () => {
        wrapper.classList.remove('qr-switching-out');
        wrapper.removeEventListener('animationend', cleanup);
        resolve();
      };

      wrapper.addEventListener('animationend', cleanup);

      // 备用定时器，防止动画事件不触发
      setTimeout(cleanup, this.animationDuration);
    });
  }

  /**
   * 淡入QR码动画
   * @param {HTMLElement} qrElement - QR码元素
   */
  fadeInQR(qrElement) {
    return new Promise((resolve) => {
      if (!qrElement) {
        resolve();
        return;
      }

      const wrapper = qrElement.querySelector('.qr-image-wrapper');
      if (!wrapper) {
        resolve();
        return;
      }

      // 确保元素可见
      qrElement.style.display = 'block';

      // 使用requestAnimationFrame确保DOM更新
      requestAnimationFrame(() => {
        wrapper.classList.add('qr-switching-in');

        const cleanup = () => {
          wrapper.classList.remove('qr-switching-in');
          wrapper.removeEventListener('animationend', cleanup);
          resolve();
        };

        wrapper.addEventListener('animationend', cleanup);
        setTimeout(cleanup, this.animationDuration);
      });
    });
  }

  /**
   * 根据语言获取对应的QR码元素
   * @param {string} language - 语言代码
   * @returns {HTMLElement|null} QR码元素
   */
  getQRElement(language) {
    switch (language) {
      case 'zh-CN':
        return this.wechatQR;
      case 'en':
        return this.discordQR;
      default:
        return this.wechatQR; // 默认返回微信QR码
    }
  }

  /**
   * 设置QR码可见性
   * @param {string} language - 目标语言
   * @param {boolean} useAnimation - 是否使用动画
   */
  setQRVisibility(language, useAnimation = true) {
    const targetQR = this.getQRElement(language);
    const otherQRs = language === 'zh-CN' ? [this.discordQR] : [this.wechatQR];

    // 隐藏其他QR码
    otherQRs.forEach(qr => {
      if (qr) {
        qr.style.display = 'none';
      }
    });

    // 显示目标QR码
    if (targetQR) {
      targetQR.style.display = 'block';
      
      if (useAnimation && !this.isAnimating) {
        // 如果需要动画且当前不在动画中，触发淡入动画
        const wrapper = targetQR.querySelector('.qr-image-wrapper');
        if (wrapper) {
          wrapper.classList.add('qr-switching-in');
          setTimeout(() => {
            wrapper.classList.remove('qr-switching-in');
          }, this.animationDuration);
        }
      }
    }
  }

  /**
   * 手动切换QR码（用于调试）
   * @param {string} language - 目标语言
   */
  switchToLanguage(language) {
    if (this.currentLanguage !== language) {
      this.handleLanguageChange(language);
    }
  }

  /**
   * 获取当前显示的QR码类型
   * @returns {string} 当前QR码类型
   */
  getCurrentQRType() {
    return this.currentLanguage === 'zh-CN' ? 'wechat' : 'discord';
  }

  /**
   * 销毁管理器，清理事件监听器
   */
  destroy() {
    // 清理动画类
    [this.wechatQR, this.discordQR].forEach(qr => {
      if (qr) {
        const wrapper = qr.querySelector('.qr-image-wrapper');
        if (wrapper) {
          wrapper.classList.remove('qr-switching-out', 'qr-switching-in');
        }
      }
    });

    // 移除事件监听器
    document.removeEventListener('languageChanged', this.handleLanguageChange);

    console.log('QR Manager: Destroyed');
  }
}

// 全局实例管理
let sidebarQRManager = null;

/**
 * 初始化QR管理器
 */
function initializeSidebarQRManager() {
  if (sidebarQRManager) {
    sidebarQRManager.destroy();
  }
  
  sidebarQRManager = new SidebarQRManager();
  
  // 开发环境下添加到全局对象方便调试
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.sidebarQRManager = sidebarQRManager;
    console.log('QR Manager: Available globally as window.sidebarQRManager');
  }
}

/**
 * 获取QR管理器实例
 * @returns {SidebarQRManager|null} QR管理器实例
 */
function getSidebarQRManager() {
  return sidebarQRManager;
}

// 自动初始化
document.addEventListener('DOMContentLoaded', initializeSidebarQRManager);

// 如果DOM已经加载完成，立即初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSidebarQRManager);
} else {
  initializeSidebarQRManager();
}

// 导出（如果支持模块化）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SidebarQRManager, initializeSidebarQRManager, getSidebarQRManager };
}