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
