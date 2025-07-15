(function() {
  function init() {
    const toggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const content = document.querySelector('.content');

    if (toggle && sidebar && overlay && content) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
        content.classList.toggle('shifted');
      });

      overlay.addEventListener('click', closeSidebar);
    }

    function closeSidebar() {
      if (sidebar && overlay && content && toggle) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        content.classList.remove('shifted');
        if (document.activeElement !== toggle) {
          toggle.focus();
        }
      }
    }

    const isMobile = window.innerWidth <= 768;
    let isFirstVisit = !localStorage.getItem('sidebarAutoClosed');

    // For testing: uncomment to simulate first visit
    // localStorage.removeItem('sidebarAutoClosed'); isFirstVisit = true;
    // console.log('Initial check: isMobile:', isMobile, 'isFirstVisit:', isFirstVisit);

    if (sidebar && sidebar.classList.contains('open')) {
      if (isMobile || isFirstVisit) {
        setTimeout(() => {
          closeSidebar();
          if (isFirstVisit) {
            localStorage.setItem('sidebarAutoClosed', '1');
          }
        }, 2000);
      }
    }

    const members_count = document.getElementById('members-count');
    const companies_count = document.getElementById('companies-count');
    const vip_count = document.getElementById('vip-count');
    const members_growth = document.getElementById('members-growth');
    const companies_growth = document.getElementById('companies-growth');
    const vip_growth = document.getElementById('vip-growth');

    const statsElementsPresent =
      members_count && companies_count && vip_count &&
      members_growth && companies_growth && vip_growth;

    if (statsElementsPresent) {
      let stats = {
        members: { count: 121884, growth: 25, last: Date.now() },
        companies: { count: 10761, growth: 8, last: Date.now() },
        vip: { count: 1102, growth: 3, last: Date.now() }
      };

      function fmt(n) { return n.toLocaleString(); }

      function paint() {
        members_count.textContent = fmt(stats.members.count);
        companies_count.textContent = fmt(stats.companies.count);
        vip_count.textContent = fmt(stats.vip.count);
        members_growth.textContent = stats.members.growth;
        companies_growth.textContent = stats.companies.growth;
        vip_growth.textContent = stats.vip.growth;
      }

      function flash(id) {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('increase-animation');
          setTimeout(() => el.classList.remove('increase-animation'), 500);
        }
      }

      function step() {
        const now = Date.now();
        Object.entries(stats).forEach(([k, v]) => {
          if (now - v.last >= 60000) {
            const inc = Math.max(
              1,
              Math.floor(v.growth * (1 + Math.random() * 0.6 - 0.3))
            );
            v.count += inc;
            v.last = now;
            if (Math.random() < 0.2)
              v.growth = Math.max(
                1,
                Math.floor(v.growth * (1 + Math.random() * 0.4 - 0.2))
              );
            flash(k + '-count');
          }
        });
        paint();
        updateBar();
      }

      function updateBar() {
        const max = { members: 150000, companies: 20000, vip: 2000 };
        Object.entries(stats).forEach(([k, v]) => {
          const pct = Math.min((v.count / max[k]) * 100, 100);
          const progressBarFill = document.querySelector(`.${k} .progress-fill`);
          if (progressBarFill) {
            progressBarFill.style.width = pct + '%';
          }
        });
      }

      paint();
      updateBar();
      setInterval(step, 3000);
      setInterval(() => {
        if (Math.random() < 0.8) {
          const keys = Object.keys(stats);
          const k = keys[(Math.random() * keys.length) | 0];
          stats[k].count += (Math.random() * 5 + 1) | 0;
          flash(k + '-count');
          paint();
          updateBar();
        }
      }, 20000);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
