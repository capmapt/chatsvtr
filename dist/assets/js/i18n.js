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

    // Notify iframe of language change
    if (this.statsIframe && this.statsIframe.contentWindow) {
      try {
        this.statsIframe.contentWindow.postMessage({ type: 'setLang', lang }, '*');
      } catch (e) {
        console.warn('Could not communicate with stats iframe:', e);
      }
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