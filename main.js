// 选择相关元素
const toggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');
const content = document.querySelector('.content');

// 侧边栏开关按钮
toggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
  content.classList.toggle('shifted');
});

// 点击遮罩关闭侧边栏
overlay.addEventListener('click', closeSidebar);

// 关闭侧边栏并把焦点回到菜单按钮
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  content.classList.remove('shifted');
  toggle.focus();
}

// 判断是否移动端
const isMobile = window.innerWidth <= 768;
// 判断是否首次访问（用 localStorage 标记）
const isFirstVisit = !localStorage.getItem('sidebarAutoClosed');

// 只在移动端或首次访问时自动关闭
if (isMobile || isFirstVisit) {
  setTimeout(() => {
    closeSidebar();
    localStorage.setItem('sidebarAutoClosed', '1');
  }, 2000);
}
