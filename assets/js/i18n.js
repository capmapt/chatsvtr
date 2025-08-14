// Internationalization module
class I18n {
  constructor() {
    this.currentLang = 'zh-CN';
    this.keysForInnerHTML = ['chat_header', 'banner_title']; // Keys that contain HTML
    this.init();
  }

  init() {
    // Cache DOM elements
    this.btnZh = document.getElementById('btnZh');
    this.btnEn = document.getElementById('btnEn');
    this.statsIframe = document.querySelector('.stats-widget-iframe');

    // Add event listeners
    if (this.btnZh && this.btnEn) {
      this.btnZh.addEventListener('click', () => this.updateLanguage('zh-CN'));
      this.btnEn.addEventListener('click', () => this.updateLanguage('en'));
    }

    // Initialize with default language
    this.updateLanguage('zh-CN');
  }

  updateLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language ${lang} not found in translations`);
      return;
    }

    this.currentLang = lang;
    document.documentElement.lang = lang;

    // 更新SEO meta标签
    this.updateSEOMetaTags(lang);

    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = translations[lang][key] || el.textContent;

      if (this.keysForInnerHTML.includes(key)) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }

      // Add data-lang attribute for banner title to enable responsive styling
      if (key === 'banner_title') {
        el.setAttribute('data-lang', lang);
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[lang][key]) {
        el.placeholder = translations[lang][key];
      }
    });

    // Update translatable attributes
    document.querySelectorAll('*').forEach(el => {
      for (const attr of el.attributes) {
        if (attr.name.startsWith('data-i18n-attr-')) {
          const targetAttr = attr.name.substring('data-i18n-attr-'.length);
          const translationKey = attr.value;
          if (translations[lang][translationKey]) {
            el.setAttribute(targetAttr, translations[lang][translationKey]);
          }
        }
      }
    });

    // Update button states
    if (this.btnZh && this.btnEn) {
      this.btnZh.classList.toggle('active', lang === 'zh-CN');
      this.btnEn.classList.toggle('active', lang === 'en');
    }

    // Update document title
    document.title = translations[lang].title;

    // 🌐 多语言社群入口切换逻辑
    this.updateCommunityEntrance(lang);

    // Notify iframe of language change
    if (this.statsIframe && this.statsIframe.contentWindow) {
      try {
        this.statsIframe.contentWindow.postMessage({ type: 'setLang', lang }, '*');
      } catch (e) {
        console.warn('Could not communicate with stats iframe:', e);
      }
    }

    // Dispatch language change event for other components
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: {
        lang,
        language: lang, // 为QR管理器提供兼容性
        previousLang: this.previousLang || 'zh-CN'
      }
    }));

    // 保存之前的语言供下次切换使用
    this.previousLang = lang;
  }

  updateSEOMetaTags(lang) {
    const t = translations[lang];
    if (!t) {
      return;
    }

    // 更新页面标题
    if (t.title) {
      document.title = t.title;
      const titleMeta = document.querySelector('title[data-i18n="title"]');
      if (titleMeta) {
        titleMeta.textContent = t.title;
      }
    }

    // 更新description
    if (t.description) {
      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) {
        descMeta.setAttribute('content', t.description);
      }
    }

    // 更新keywords
    if (t.keywords) {
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (keywordsMeta) {
        keywordsMeta.setAttribute('content', t.keywords);
      }
    }

    // 更新Open Graph标签
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');

    if (ogTitle && t.title) {
      ogTitle.setAttribute('content', t.title);
    }
    if (ogDesc && t.description) {
      ogDesc.setAttribute('content', t.description);
    }
    if (twitterTitle && t.title) {
      twitterTitle.setAttribute('content', t.title);
    }
    if (twitterDesc && t.description) {
      twitterDesc.setAttribute('content', t.description);
    }

    // 更新hreflang
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      const baseUrl = 'https://svtr.ai/';
      const langParam = lang === 'zh-CN' ? '' : '?lang=en';
      canonicalLink.setAttribute('href', baseUrl + langParam);
    }
  }

  // 🌐 多语言社群入口切换逻辑
  updateCommunityEntrance(lang) {
    const qrContainer = document.querySelector('.qr-container');
    if (!qrContainer) {
      return;
    }

    // 为容器添加语言属性，用于CSS选择器
    qrContainer.setAttribute('data-lang', lang);

    // 确保所有子元素也有正确的语言属性
    const qrImageWrapper = qrContainer.querySelector('.qr-image-wrapper');
    const qrOverlay = qrContainer.querySelector('.qr-overlay');
    const discordButton = qrContainer.querySelector('.discord-join-button');

    if (qrImageWrapper) {
      qrImageWrapper.setAttribute('data-lang', lang);
    }
    if (qrOverlay) {
      qrOverlay.setAttribute('data-lang', lang);
    }
    if (discordButton) {
      discordButton.setAttribute('data-lang', lang);
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.i18n = new I18n();
});
