const toggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');
const content = document.querySelector('.content');

toggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  content.classList.toggle('shifted');
});

overlay.addEventListener('click', closeSidebar);

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  content.classList.remove('shifted');
  toggle.focus();
}

const isMobile = window.innerWidth <= 768;
const isFirstVisit = !localStorage.getItem('sidebarAutoClosed');

if (isMobile || isFirstVisit) {
  setTimeout(() => {
    closeSidebar();
    localStorage.setItem('sidebarAutoClosed', '1');
  }, 2000);
}
/* ==== 动态数字脚本 ==== */
let stats = {
  members  : { count: 121884, growth:25, last:Date.now() },
  companies: { count: 10761,  growth:8,  last:Date.now() },
  vip      : { count: 1102,   growth:3,  last:Date.now() }
};
function fmt(n){return n.toLocaleString()}
function paint(){
  members_count.textContent  = fmt(stats.members.count);
  companies_count.textContent= fmt(stats.companies.count);
  vip_count.textContent      = fmt(stats.vip.count);
  members_growth.textContent = stats.members.growth;
  companies_growth.textContent = stats.companies.growth;
  vip_growth.textContent     = stats.vip.growth;
}
function flash(id){
  const el=document.getElementById(id);
  el.classList.add('increase-animation');
  setTimeout(()=>el.classList.remove('increase-animation'),500);
}
function step(){
  const now=Date.now();
  Object.entries(stats).forEach(([k,v])=>{
    if(now-v.last>=60000){                          // 每分钟一次“正式”增长
      const inc=Math.max(1,Math.floor(v.growth*(1+Math.random()*0.6-0.3)));
      v.count+=inc; v.last=now;
      if(Math.random()<0.2) v.growth=Math.max(1,Math.floor(v.growth*(1+Math.random()*0.4-0.2)));
      flash(k+'-count');
    }
  });
  paint(); updateBar();
}
function updateBar(){
  const max={members:150000,companies:20000,vip:2000};
  Object.entries(stats).forEach(([k,v])=>{
    const pct=Math.min(v.count/max[k]*100,100);
    document.querySelector(`.${k} .progress-fill`).style.width=pct+'%';
  });
}
paint(); updateBar();
setInterval(step,3000);
setInterval(()=>{  // 每 20 秒随机小增
  if(Math.random()<.8){
    const keys=Object.keys(stats); const k=keys[Math.random()*keys.length|0];
    stats[k].count+=Math.random()*5+1|0; flash(k+'-count'); paint(); updateBar();
  }
},20000);
