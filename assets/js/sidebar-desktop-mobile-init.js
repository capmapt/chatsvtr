/**
 * 侧边栏桌面端和移动端初始化脚本
 * 确保桌面端默认打开，移动端默认关闭
 */

(function() {
  'use strict';

  function initializeSidebarState() {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    
    if (!sidebar || !content) {
      console.warn('[SidebarInit] 侧边栏或内容区域未找到');
      return;
    }

    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      // 移动端：确保侧边栏默认关闭
      sidebar.classList.remove('open');
      content.classList.remove('shifted');
      console.log('[SidebarInit] 移动端：侧边栏设置为关闭状态');
    } else {
      // 桌面端：默认显示侧边栏
      sidebar.classList.add('open');
      content.classList.add('shifted');
      console.log('[SidebarInit] 桌面端：侧边栏设置为打开状态');
    }
  }

  // 处理窗口大小变化
  function handleResize() {
    const debounceTimeout = 150;
    let resizeTimer;
    
    return function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(initializeSidebarState, debounceTimeout);
    };
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSidebarState);
  } else {
    initializeSidebarState();
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize());

  console.log('[SidebarInit] 侧边栏初始化脚本加载完成');
})();