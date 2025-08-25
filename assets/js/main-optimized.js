!function(){
  'use strict';const t=3e3,e=2e4,s=500,o=6e4,i={members:{count:121884,growth:25,max:15e4},companies:{count:10761,growth:8,max:2e4},vip:{count:1102,growth:3,max:2e3}};class n{
    constructor(){
      this.stats=this.initializeStats(),this.domElements={},this.timers=[],this.init();
    }init(){
      this.cacheDOMElements(),this.initializeSidebar(),this.startStatsUpdates(),this.setupEventListeners();
    }cacheDOMElements(){
      this.domElements.toggle=document.querySelector('.menu-toggle'),this.domElements.headerLogo=document.querySelector('.header-logo'),this.domElements.sidebar=document.querySelector('.sidebar'),this.domElements.overlay=document.querySelector('.overlay'),this.domElements.content=document.querySelector('.content'),this.domElements.stats={members_count:document.getElementById('members-count'),companies_count:document.getElementById('companies-count'),vip_count:document.getElementById('vip-count'),members_growth:document.getElementById('members-growth'),companies_growth:document.getElementById('companies-growth'),vip_growth:document.getElementById('vip-growth')},this.hasStatsElements=Object.values(this.domElements.stats).every(t=>null!==t);
    }initializeStats(){
      const t={};return Object.keys(i).forEach(e=>{
        t[e]={...i[e],last:Date.now()};
      }),t;
    }setupEventListeners(){
      const t=window.innerWidth<=768,e=window.mobileSidebarFix&&t;!e&&this.domElements.overlay?(this.domElements.headerLogo&&this.domElements.headerLogo.addEventListener('click',t=>{
        t.ctrlKey||t.metaKey?window.open('/pages/admin-center.html','_blank'):this.toggleSidebar();
      }),this.domElements.toggle&&this.domElements.toggle.addEventListener('click',()=>this.toggleSidebar()),this.domElements.overlay.addEventListener('click',()=>this.closeSidebar())):e&&console.log('[SVTRApp] 检测到移动端修复器，跳过事件监听器设置');const s=document.querySelector('.sidebar-collapse-btn');s&&s.addEventListener('click',()=>this.toggleSidebar());const o=document.querySelector('.sidebar-logo');o&&o.addEventListener('click',t=>{
        (t.ctrlKey||t.metaKey)&&window.open('/pages/admin-center.html','_blank');
      }),t||document.addEventListener('keydown',t=>{
        'Escape'===t.key&&this.isSidebarOpen()&&this.closeSidebar();
      }),this.setupSidebarScrollDetection();
    }setupSidebarScrollDetection(){
      const t=this.domElements.sidebar;if(!t){
        return;
      }const e=()=>{
        const e=t.scrollHeight>t.clientHeight;t.classList.toggle('has-scroll',e),e&&t.addEventListener('scroll',this.handleSidebarScroll.bind(this));
      };e(),window.addEventListener('resize',a(e,250));
    }handleSidebarScroll(){
      const t=this.domElements.sidebar;if(!t){
        return;
      }const e=t.scrollTop,s=t.scrollHeight,o=e+t.clientHeight>=s-10;t.classList.toggle('scroll-at-bottom',o);
    }initializeSidebar(){
      const t=window.innerWidth<=768,e=!localStorage.getItem('sidebarAutoClosed');t?e&&localStorage.setItem('sidebarAutoClosed','1'):this.isSidebarOpen()||this.openSidebar();
    }toggleSidebar(){
      this.isSidebarOpen()?this.closeSidebar():this.openSidebar();
    }openSidebar(){
      const{sidebar:t,overlay:e,content:s}=this.domElements;t&&e&&s&&(t.classList.add('open'),e.classList.add('active'),s.classList.add('shifted'));
    }closeSidebar(){
      const{sidebar:t,overlay:e,content:s,toggle:o}=this.domElements;t&&e&&s&&(t.classList.remove('open'),e.classList.remove('active'),s.classList.remove('shifted'),o&&document.activeElement!==o&&o.focus());
    }isSidebarOpen(){
      return this.domElements.sidebar?.classList.contains('open')||!1;
    }startStatsUpdates(){
      this.hasStatsElements&&(this.paintStats(),this.updateProgressBars(),this.timers.push(setInterval(()=>this.stepStats(),t),setInterval(()=>this.randomStatsUpdate(),e)));
    }formatNumber(t){
      return t.toLocaleString();
    }paintStats(){
      if(!this.hasStatsElements){
        return;
      }const{stats:t}=this.domElements;t.members_count.textContent=this.formatNumber(this.stats.members.count),t.companies_count.textContent=this.formatNumber(this.stats.companies.count),t.vip_count.textContent=this.formatNumber(this.stats.vip.count),t.members_growth.textContent=this.stats.members.growth,t.companies_growth.textContent=this.stats.companies.growth,t.vip_growth.textContent=this.stats.vip.growth;
    }flashElement(t){
      const e=document.getElementById(t);e&&(e.classList.add('increase-animation'),setTimeout(()=>{
        e.classList.remove('increase-animation');
      },s));
    }stepStats(){
      const t=Date.now();let e=!1;Object.entries(this.stats).forEach(([s,i])=>{
        if(t-i.last>=o){
          const o=Math.max(1,Math.floor(i.growth*(1+.6*Math.random()-.3)));i.count+=o,i.last=t,e=!0,Math.random()<.2&&(i.growth=Math.max(1,Math.floor(i.growth*(1+.4*Math.random()-.2)))),this.flashElement(`${s}-count`);
        }
      }),e&&(this.paintStats(),this.updateProgressBars());
    }updateProgressBars(){
      Object.entries(this.stats).forEach(([t,e])=>{
        const s=Math.min(e.count/e.max*100,100),o=document.querySelector(`.${t} .progress-fill`);o&&(o.style.width=`${s}%`);
      });
    }randomStatsUpdate(){
      if(Math.random()<.8){
        const t=Object.keys(this.stats),e=t[Math.floor(Math.random()*t.length)],s=Math.floor(5*Math.random()+1);this.stats[e].count+=s,this.flashElement(`${e}-count`),this.paintStats(),this.updateProgressBars();
      }
    }destroy(){
      this.timers.forEach(t=>clearInterval(t)),this.timers=[],this.domElements.toggle&&this.domElements.toggle.removeEventListener('click',this.toggleSidebar),this.domElements.overlay&&this.domElements.overlay.removeEventListener('click',this.closeSidebar);
    }
  }function a(t,e){
    let s;return function(...o){
      clearTimeout(s),s=setTimeout(()=>{
        clearTimeout(s),t(...o);
      },e);
    };
  }function r(){
    window.svtrApp&&window.svtrApp.destroy(),window.svtrApp=new n;
  }document.addEventListener('visibilitychange',()=>{
    window.svtrApp&&(document.hidden||(window.svtrApp.paintStats(),window.svtrApp.updateProgressBars()));
  });const d=a(()=>{
    window.svtrApp&&window.innerWidth<=768&&window.svtrApp.isSidebarOpen()&&window.svtrApp.closeSidebar();
  },250);window.addEventListener('resize',d),'loading'===document.readyState?document.addEventListener('DOMContentLoaded',r):r(),'localhost'!==window.location.hostname&&'127.0.0.1'!==window.location.hostname||(window.SVTRApp=n);
}();
