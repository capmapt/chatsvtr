class I18n{
  constructor(){
    this.currentLang='zh-CN',this.keysForInnerHTML=['chat_header','banner_title'],this.init();
  }init(){
    this.btnZh=document.getElementById('btnZh'),this.btnEn=document.getElementById('btnEn'),this.statsIframe=document.querySelector('.stats-widget-iframe'),this.btnZh&&this.btnEn&&(this.btnZh.addEventListener('click',()=>this.updateLanguage('zh-CN')),this.btnEn.addEventListener('click',()=>this.updateLanguage('en'))),this.updateLanguage('zh-CN');
  }updateLanguage(t){
    if(translations[t]){
      if(this.currentLang=t,document.documentElement.lang=t,this.updateSEOMetaTags(t),document.querySelectorAll('[data-i18n]').forEach(e=>{
        const n=e.getAttribute('data-i18n'),i=translations[t][n]||e.textContent;this.keysForInnerHTML.includes(n)?e.innerHTML=i:e.textContent=i,'banner_title'===n&&e.setAttribute('data-lang',t);
      }),document.querySelectorAll('[data-i18n-placeholder]').forEach(e=>{
        const n=e.getAttribute('data-i18n-placeholder');translations[t][n]&&(e.placeholder=translations[t][n]);
      }),document.querySelectorAll('*').forEach(e=>{
        for(const n of e.attributes){
          if(n.name.startsWith('data-i18n-attr-')){
            const i=n.name.substring(15),a=n.value;translations[t][a]&&e.setAttribute(i,translations[t][a]);
          }
        }
      }),this.btnZh&&this.btnEn&&(this.btnZh.classList.toggle('active','zh-CN'===t),this.btnEn.classList.toggle('active','en'===t)),document.title=translations[t].title,this.updateCommunityEntrance(t),this.statsIframe&&this.statsIframe.contentWindow){
        try{
          this.statsIframe.contentWindow.postMessage({type:'setLang',lang:t},'*');
        }catch(t){
          console.warn('Could not communicate with stats iframe:',t);
        }
      }document.dispatchEvent(new CustomEvent('languageChanged',{detail:{lang:t,language:t,previousLang:this.previousLang||'zh-CN'}})),this.previousLang=t;
    }else {
      console.warn(`Language ${t} not found in translations`);
    }
  }updateSEOMetaTags(t){
    const e=translations[t];if(!e){
      return;
    }if(e.title){
      document.title=e.title;const t=document.querySelector('title[data-i18n="title"]');t&&(t.textContent=e.title);
    }if(e.description){
      const t=document.querySelector('meta[name="description"]');t&&t.setAttribute('content',e.description);
    }if(e.keywords){
      const t=document.querySelector('meta[name="keywords"]');t&&t.setAttribute('content',e.keywords);
    }const n=document.querySelector('meta[property="og:title"]'),i=document.querySelector('meta[property="og:description"]'),a=document.querySelector('meta[name="twitter:title"]'),r=document.querySelector('meta[name="twitter:description"]');n&&e.title&&n.setAttribute('content',e.title),i&&e.description&&i.setAttribute('content',e.description),a&&e.title&&a.setAttribute('content',e.title),r&&e.description&&r.setAttribute('content',e.description);const s=document.querySelector('link[rel="canonical"]');if(s){
      const e='https://svtr.ai/',n='zh-CN'===t?'':'?lang=en';s.setAttribute('href',e+n);
    }
  }updateCommunityEntrance(t){
    const e=document.querySelector('.qr-container');if(!e){
      return;
    }e.setAttribute('data-lang',t);const n=e.querySelector('.qr-image-wrapper'),i=e.querySelector('.qr-overlay'),a=e.querySelector('.discord-join-button');n&&n.setAttribute('data-lang',t),i&&i.setAttribute('data-lang',t),a&&a.setAttribute('data-lang',t);
  }getCurrentLanguage(){
    return this.currentLang;
  }
}function initializeI18n(){
  window.i18n=new I18n;
}'loading'===document.readyState?document.addEventListener('DOMContentLoaded',initializeI18n):initializeI18n();
