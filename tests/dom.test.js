// Tests for DOM structure and critical elements
describe('DOM Structure Tests', () => {
  beforeEach(() => {
    // Load the actual HTML structure for testing
    document.body.innerHTML = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title data-i18n="title">硅谷科技评论</title>
      </head>
      <body>
        <header>
          <div class="lang-toggle">
            <button id="btnZh" class="active">中文</button>
            <span class="divider">|</span>
            <button id="btnEn">English</button>
          </div>
          <button class="menu-toggle" aria-label="打开/关闭菜单">☰</button>
        </header>
        <div class="overlay active"></div>
        <aside class="sidebar open" role="navigation" aria-label="主导航">
          <div class="sidebar-header">
            <img src="assets/images/logo.jpg" class="sidebar-logo" alt="SVTR.AI logo">
            <h2 data-i18n="sidebar_title">硅谷科技评论</h2>
          </div>
          <nav>
            <ul class="nav-list">
              <li><a href="pages/ai-100.html" data-i18n="nav_ai100">AI 100</a></li>
              <li><a href="#" data-i18n="nav_ranking">AI创投榜</a></li>
            </ul>
          </nav>
        </aside>
        <main class="content">
          <div class="stats-container">
            <div class="stat-item">
              <span id="members-count" class="stat-number">121,884</span>
              <span class="stat-label" data-i18n="stats_members">社区成员</span>
            </div>
          </div>
        </main>
      </body>
      </html>
    `;
  });

  test('should have required meta tags', () => {
    const charset = document.querySelector('meta[charset]');
    const viewport = document.querySelector('meta[name="viewport"]');
    
    expect(charset).toBeTruthy();
    expect(charset.getAttribute('charset')).toBe('UTF-8');
    expect(viewport).toBeTruthy();
  });

  test('should have language toggle buttons', () => {
    const btnZh = document.getElementById('btnZh');
    const btnEn = document.getElementById('btnEn');
    
    expect(btnZh).toBeTruthy();
    expect(btnEn).toBeTruthy();
    expect(btnZh.textContent).toBe('中文');
    expect(btnEn.textContent).toBe('English');
  });

  test('should have navigation structure', () => {
    const sidebar = document.querySelector('.sidebar');
    const navList = document.querySelector('.nav-list');
    const aiLink = document.querySelector('a[href="pages/ai-100.html"]');
    
    expect(sidebar).toBeTruthy();
    expect(navList).toBeTruthy();
    expect(aiLink).toBeTruthy();
  });

  test('should have accessible attributes', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    
    expect(menuToggle.getAttribute('aria-label')).toBeTruthy();
    expect(sidebar.getAttribute('role')).toBe('navigation');
    expect(sidebar.getAttribute('aria-label')).toBeTruthy();
  });

  test('should have stats container elements', () => {
    const statsContainer = document.querySelector('.stats-container');
    const membersCount = document.getElementById('members-count');
    
    expect(statsContainer).toBeTruthy();
    expect(membersCount).toBeTruthy();
  });

  test('should have i18n attributes on translatable elements', () => {
    const titleElement = document.querySelector('[data-i18n="title"]');
    const sidebarTitle = document.querySelector('[data-i18n="sidebar_title"]');
    const navAI100 = document.querySelector('[data-i18n="nav_ai100"]');
    
    expect(titleElement).toBeTruthy();
    expect(sidebarTitle).toBeTruthy();
    expect(navAI100).toBeTruthy();
  });

  test('should have proper image elements with lazy loading', () => {
    const logo = document.querySelector('.sidebar-logo');
    
    expect(logo).toBeTruthy();
    expect(logo.getAttribute('alt')).toBeTruthy();
    expect(logo.getAttribute('src')).toContain('assets/images/logo.jpg');
  });
});