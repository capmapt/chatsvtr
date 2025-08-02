/**
 * 侧边栏调整器与主应用集成
 * 确保所有组件协调工作
 */

(function() {
  'use strict';
  
  // 等待所有相关脚本加载完成
  function initSidebarIntegration() {
    // 确保主应用和侧边栏调整器都已加载
    if (!window.svtrApp || !window.sidebarResizer) {
      setTimeout(initSidebarIntegration, 100);
      return;
    }
    
    const app = window.svtrApp;
    const resizer = window.sidebarResizer;
    
    // 监听侧边栏宽度变化
    window.addEventListener('sidebarWidthChange', (event) => {
      const { width } = event.detail;
      
      // 更新CSS自定义属性
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
      
      // 通知其他组件宽度变化
      if (app && typeof app.onSidebarWidthChange === 'function') {
        app.onSidebarWidthChange(width);
      }
      
      // 保存到会话存储用于页面刷新后恢复
      sessionStorage.setItem('svtr-sidebar-last-width', width.toString());
    });
    
    // 监听侧边栏开关状态变化
    const originalOpenSidebar = app.openSidebar;
    const originalCloseSidebar = app.closeSidebar;
    
    if (originalOpenSidebar && originalCloseSidebar) {
      // 扩展开启侧边栏方法
      app.openSidebar = function() {
        originalOpenSidebar.call(this);
        
        // 应用保存的宽度
        const savedWidth = resizer.getWidth();
        if (savedWidth) {
          setTimeout(() => {
            document.documentElement.style.setProperty('--sidebar-width', `${savedWidth}px`);
          }, 50);
        }
      };
      
      // 扩展关闭侧边栏方法
      app.closeSidebar = function() {
        originalCloseSidebar.call(this);
        
        // 清理内联样式
        setTimeout(() => {
          const content = document.querySelector('.content');
          if (content) {
            content.style.marginLeft = '';
          }
        }, 300);
      };
    }
    
    // 页面加载时恢复宽度
    const lastWidth = sessionStorage.getItem('svtr-sidebar-last-width');
    if (lastWidth) {
      const width = parseInt(lastWidth, 10);
      if (width >= 200 && width <= 500) {
        document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
      }
    }
    
    // 键盘快捷键支持
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + [ : 减少宽度
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '[') {
        e.preventDefault();
        const currentWidth = resizer.getWidth() || 240;
        resizer.setWidth(Math.max(200, currentWidth - 20));
      }
      
      // Ctrl/Cmd + Shift + ] : 增加宽度
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
        e.preventDefault();
        const currentWidth = resizer.getWidth() || 240;
        resizer.setWidth(Math.min(500, currentWidth + 20));
      }
      
      // Ctrl/Cmd + Shift + \ : 重置宽度
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '\\') {
        e.preventDefault();
        resizer.reset();
      }
    });
    
    // 添加宽度调整提示（仅桌面端）
    if (window.innerWidth > 768) {
      addWidthHint();
    }
    
    console.log('[SidebarIntegration] 侧边栏集成功能已启用');
  }
  
  // 添加宽度调整提示
  function addWidthHint() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // 创建提示元素
    const hint = document.createElement('div');
    hint.className = 'sidebar-width-hint';
    hint.innerHTML = `
      <div class="hint-content">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>可拖拽调整宽度</span>
      </div>
    `;
    
    // 添加样式
    const hintStyles = document.createElement('style');
    hintStyles.textContent = `
      .sidebar-width-hint {
        position: absolute;
        bottom: 120px;
        right: 12px;
        background: rgba(250, 140, 50, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 1070;
        box-shadow: 0 2px 8px rgba(250, 140, 50, 0.3);
      }
      
      .sidebar:hover .sidebar-width-hint {
        opacity: 1;
        transform: translateX(0);
      }
      
      .hint-content {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .sidebar-resize-handle:hover ~ .sidebar-width-hint,
      .sidebar-resizing .sidebar-width-hint {
        opacity: 0;
      }
      
      @media (max-width: 768px) {
        .sidebar-width-hint {
          display: none;
        }
      }
      
      @media (prefers-reduced-motion: reduce) {
        .sidebar-width-hint {
          transition: none;
        }
      }
    `;
    
    document.head.appendChild(hintStyles);
    sidebar.appendChild(hint);
    
    // 5秒后隐藏提示
    setTimeout(() => {
      hint.style.display = 'none';
    }, 8000);
  }
  
  // 窗口焦点时检查组件状态
  window.addEventListener('focus', () => {
    if (window.sidebarResizer && window.innerWidth > 768) {
      const currentWidth = window.sidebarResizer.getWidth();
      if (currentWidth) {
        document.documentElement.style.setProperty('--sidebar-width', `${currentWidth}px`);
      }
    }
  });
  
  // 页面可见性变化时的处理
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.sidebarResizer && window.innerWidth > 768) {
      // 页面重新可见时，确保宽度设置正确
      setTimeout(() => {
        const currentWidth = window.sidebarResizer.getWidth();
        if (currentWidth) {
          document.documentElement.style.setProperty('--sidebar-width', `${currentWidth}px`);
        }
      }, 100);
    }
  });
  
  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebarIntegration);
  } else {
    initSidebarIntegration();
  }
})();