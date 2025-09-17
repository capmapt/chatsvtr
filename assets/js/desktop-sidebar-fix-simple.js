/**
 * 简化的桌面端侧边栏修复
 * 直接绑定事件，无依赖
 */

(function() {
  'use strict';

  console.log('[DesktopSidebarFix] 初始化简化版桌面端修复');

  function initSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    const overlay = document.querySelector('.overlay');
    const content = document.querySelector('.content');

    if (!sidebar || !toggle) {
      console.warn('[DesktopSidebarFix] 找不到必要元素');
      return;
    }

    // 检测设备类型
    const isMobile = () => window.innerWidth <= 768;

    function toggleSidebar(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      console.log('[DesktopSidebarFix] 切换侧边栏');

      const isCurrentlyOpen = sidebar.classList.contains('open');

      if (isCurrentlyOpen) {
        // 关闭侧边栏
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
        if (overlay) overlay.classList.remove('active');
        if (content) content.classList.remove('shifted');

        // 在桌面端强制设置位置
        if (!isMobile()) {
          sidebar.style.transform = 'translateX(-100%)';
        }

        console.log('[DesktopSidebarFix] 侧边栏已关闭');
      } else {
        // 打开侧边栏
        sidebar.classList.add('open');
        document.body.classList.add('sidebar-open');
        if (overlay) overlay.classList.add('active');
        if (content) content.classList.add('shifted');

        // 在桌面端强制设置位置
        if (!isMobile()) {
          sidebar.style.transform = 'translateX(0)';
        }

        console.log('[DesktopSidebarFix] 侧边栏已打开');
      }
    }

    // 移除所有现有的事件监听器（如果有的话）
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);

    // 绑定新的事件监听器
    newToggle.addEventListener('click', toggleSidebar);

    // 确保在桌面端默认显示
    if (!isMobile() && !sidebar.hasAttribute('data-user-toggled')) {
      sidebar.classList.add('open');
      sidebar.style.transform = 'translateX(0)';
    }

    // 绑定遮罩层点击关闭
    if (overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          toggleSidebar();
        }
      });
    }

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        toggleSidebar();
      }
    });

    // 响应式处理
    window.addEventListener('resize', function() {
      if (isMobile()) {
        // 移动端：移除内联样式，使用CSS控制
        sidebar.style.transform = '';
      } else {
        // 桌面端：根据状态设置位置
        if (sidebar.classList.contains('open')) {
          sidebar.style.transform = 'translateX(0)';
        } else {
          sidebar.style.transform = 'translateX(-100%)';
        }
      }
    });

    console.log('[DesktopSidebarFix] 简化版修复完成');
  }

  // 立即执行或等待DOM加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarToggle);
  } else {
    initSidebarToggle();
  }

})();