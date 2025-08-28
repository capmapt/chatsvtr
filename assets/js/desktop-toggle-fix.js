/**
 * 桌面端折叠按钮修复
 * 解决main-optimized.js中事件监听器绑定问题
 */

(function() {
  'use strict';

  // 等待DOM和其他脚本加载完成
  function initDesktopToggleFix() {
    console.log('[DesktopToggleFix] 初始化桌面端折叠按钮修复');

    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    const content = document.querySelector('.content');
    const toggle = document.querySelector('.menu-toggle');

    if (!sidebar || !overlay || !content || !toggle) {
      console.warn('[DesktopToggleFix] 缺少必要元素，跳过修复');
      console.log('[DesktopToggleFix] Elements found:', { sidebar: !!sidebar, overlay: !!overlay, content: !!content, toggle: !!toggle });
      return;
    }

    // 检测是否为桌面端
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      console.log('[DesktopToggleFix] 检测到移动端，跳过桌面修复');
      return;
    }

    // 强制重新绑定事件，不移除DOM元素
    console.log('[DesktopToggleFix] 准备重新绑定事件监听器');

    // 定义切换函数 - 使用left属性绕过transform问题
    function toggleSidebar() {
      const isOpen = sidebar.classList.contains('open');
      console.log(`[DesktopToggleFix] 切换侧边栏 - 当前状态: ${isOpen ? '打开' : '关闭'}`);

      // 标记用户已手动操作过
      sidebar.setAttribute('data-user-toggled', 'true');

      try {
        if (isOpen) {
          // 关闭侧边栏 - 移到屏幕外
          sidebar.classList.remove('open');
          document.body.classList.remove('sidebar-open');
          console.log('[DesktopToggleFix] 移除open类成功');
          sidebar.style.setProperty('left', '-261px', 'important');  // 强制隐藏
          console.log('[DesktopToggleFix] 设置left=-261px成功，当前left:', sidebar.style.left);
          overlay.classList.remove('active');
          content.classList.remove('shifted');
          console.log('[DesktopToggleFix] 侧边栏已关闭 - 强制设置left=-261px');
        } else {
          // 打开侧边栏 - 移到可见位置
          sidebar.classList.add('open');
          document.body.classList.add('sidebar-open');
          console.log('[DesktopToggleFix] 添加open类成功');
          sidebar.style.setProperty('left', '0px', 'important');     // 强制显示
          console.log('[DesktopToggleFix] 设置left=0px成功，当前left:', sidebar.style.left);
          overlay.classList.add('active');
          content.classList.add('shifted');
          console.log('[DesktopToggleFix] 侧边栏已打开 - 强制设置left=0px');
        }
      } catch (error) {
        console.error('[DesktopToggleFix] 切换过程中出现错误:', error);
      }
    }

    // 直接绑定点击事件 (多重绑定以确保生效)
    const handleToggleClick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[DesktopToggleFix] 折叠按钮被点击');
      toggleSidebar();
    };
    
    toggle.addEventListener('click', handleToggleClick);
    
    // 额外的强制绑定，确保事件触发
    toggle.onclick = handleToggleClick;
    
    // 验证事件绑定
    console.log('[DesktopToggleFix] 事件监听器已绑定到按钮');

    // 绑定遮罩层点击关闭事件
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay && sidebar.classList.contains('open')) {
        toggleSidebar();
        console.log('[DesktopToggleFix] 通过遮罩层关闭侧边栏');
      }
    });

    // 绑定ESC键关闭事件
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        toggleSidebar();
        console.log('[DesktopToggleFix] 通过ESC键关闭侧边栏');
      }
    });
    
    // 初始状态检查
    console.log('[DesktopToggleFix] 当前侧边栏状态:', {
      sidebarOpen: sidebar.classList.contains('open'),
      overlayActive: overlay.classList.contains('active'),
      contentShifted: content.classList.contains('shifted')
    });

    console.log('[DesktopToggleFix] 桌面端折叠按钮修复完成');
    
    // 标记已初始化，防止其他脚本干扰
    if (window.desktopToggleFix) {
      window.desktopToggleFix.isInitialized = true;
    }
  }

  // 确保在其他脚本加载完成后执行
  function waitForMainApp() {
    if (window.svtrApp && window.svtrApp.domElements) {
      console.log('[DesktopToggleFix] 检测到主应用，开始修复');
      initDesktopToggleFix();
    } else {
      console.log('[DesktopToggleFix] 等待主应用加载...');
      setTimeout(waitForMainApp, 50);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // 延迟执行以确保其他脚本先加载
      setTimeout(waitForMainApp, 200);
    });
  } else {
    // 如果DOM已经加载完成，延迟执行
    setTimeout(waitForMainApp, 200);
  }

  // 导出供调试使用
  window.desktopToggleFix = {
    isInitialized: false,
    init: initDesktopToggleFix,
    forceToggle: function() {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.overlay');
      const content = document.querySelector('.content');
      if (sidebar && overlay && content) {
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
          sidebar.classList.remove('open');
          document.body.classList.remove('sidebar-open');
          overlay.classList.remove('active');
          content.classList.remove('shifted');
        } else {
          sidebar.classList.add('open');
          document.body.classList.add('sidebar-open');
          overlay.classList.add('active');
          content.classList.add('shifted');
        }
        console.log('[DesktopToggleFix] 强制切换完成:', !isOpen);
      }
    }
  };

})();
