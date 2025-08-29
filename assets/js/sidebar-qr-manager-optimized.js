class SidebarQRManager{
  constructor(){
    this.currentLanguage=document.documentElement.lang||'zh-CN',this.isAnimating=!1,this.animationDuration=300,this.init();
  }init(){
    if(!this.cacheDOMElements()) return;
    this.setupEventListeners();
    this.initializeQRDisplay();
  }cacheDOMElements(){
    this.wechatQR=document.querySelector('.wechat-qr');
    this.discordQR=document.querySelector('.discord-qr');
    this.qrContainer=document.querySelector('.qr-container');
    if(!this.wechatQR||!this.discordQR){
      console.debug('QR Manager: QR code elements not found, skipping initialization');
      return false;
    }
    return true;
  }setupEventListeners(){
    document.addEventListener('languageChanged',e=>{
      this.handleLanguageChange(e.detail.language);
    }),this.observeLanguageChanges();
  }observeLanguageChanges(){
    new MutationObserver(e=>{
      e.forEach(e=>{
        if('attributes'===e.type&&'lang'===e.attributeName){
          const e=document.documentElement.lang;e!==this.currentLanguage&&this.handleLanguageChange(e);
        }
      });
    }).observe(document.documentElement,{attributes:!0,attributeFilter:['lang']});
  }initializeQRDisplay(){
    this.setQRVisibility(this.currentLanguage,!1);
  }async handleLanguageChange(e){
    if(this.isAnimating||e===this.currentLanguage){
      return;
    }console.log(`QR Manager: Switching from ${this.currentLanguage} to ${e}`),this.isAnimating=!0;const t=this.currentLanguage;this.currentLanguage=e;try{
      await this.performSmoothQRSwitch(t,e);
    }catch(t){
      console.error('QR Manager: Animation error:',t),this.setQRVisibility(e,!1);
    }finally{
      this.isAnimating=!1;
    }
  }async performSmoothQRSwitch(e,t){
    const i=this.getQRElement(e),n=this.getQRElement(t);i&&n?i!==n&&(await this.fadeOutQR(i),this.setQRVisibility(t,!1),await this.fadeInQR(n)):console.warn('QR Manager: QR elements not found for language switch');
  }fadeOutQR(e){
    return new Promise(t=>{
      if(!e||'none'===getComputedStyle(e).display){
        return void t();
      }const i=e.querySelector('.qr-image-wrapper');if(!i){
        return void t();
      }i.classList.add('qr-switching-out');const n=()=>{
        i.classList.remove('qr-switching-out'),i.removeEventListener('animationend',n),t();
      };i.addEventListener('animationend',n),setTimeout(n,this.animationDuration);
    });
  }fadeInQR(e){
    return new Promise(t=>{
      if(!e){
        return void t();
      }const i=e.querySelector('.qr-image-wrapper');i?(e.style.display='block',requestAnimationFrame(()=>{
        i.classList.add('qr-switching-in');const e=()=>{
          i.classList.remove('qr-switching-in'),i.removeEventListener('animationend',e),t();
        };i.addEventListener('animationend',e),setTimeout(e,this.animationDuration);
      })):t();
    });
  }getQRElement(e){
    switch(e){
    case'zh-CN':default:return this.wechatQR;case'en':return this.discordQR;
    }
  }setQRVisibility(e,t=!0){
    const i=this.getQRElement(e);if(('zh-CN'===e?[this.discordQR]:[this.wechatQR]).forEach(e=>{
      e&&(e.style.display='none');
    }),i&&(i.style.display='block',t&&!this.isAnimating)){
      const e=i.querySelector('.qr-image-wrapper');e&&(e.classList.add('qr-switching-in'),setTimeout(()=>{
        e.classList.remove('qr-switching-in');
      },this.animationDuration));
    }
  }switchToLanguage(e){
    this.currentLanguage!==e&&this.handleLanguageChange(e);
  }getCurrentQRType(){
    return'zh-CN'===this.currentLanguage?'wechat':'discord';
  }destroy(){
    [this.wechatQR,this.discordQR].forEach(e=>{
      if(e){
        const t=e.querySelector('.qr-image-wrapper');t&&t.classList.remove('qr-switching-out','qr-switching-in');
      }
    }),document.removeEventListener('languageChanged',this.handleLanguageChange),console.log('QR Manager: Destroyed');
  }
}let sidebarQRManager=null;function initializeSidebarQRManager(){
  sidebarQRManager&&sidebarQRManager.destroy(),sidebarQRManager=new SidebarQRManager,'localhost'!==window.location.hostname&&'127.0.0.1'!==window.location.hostname||(window.sidebarQRManager=sidebarQRManager,console.log('QR Manager: Available globally as window.sidebarQRManager'));
}function getSidebarQRManager(){
  return sidebarQRManager;
}document.addEventListener('DOMContentLoaded',initializeSidebarQRManager),'loading'===document.readyState?document.addEventListener('DOMContentLoaded',initializeSidebarQRManager):initializeSidebarQRManager(),'undefined'!==typeof module&&module.exports&&(module.exports={SidebarQRManager:SidebarQRManager,initializeSidebarQRManager:initializeSidebarQRManager,getSidebarQRManager:getSidebarQRManager});
