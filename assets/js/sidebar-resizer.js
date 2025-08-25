/**
 * 侧边栏拖拽调整宽度功能
 * 支持用户自定义侧边栏宽度，提升用户体验
 */

class SidebarResizer {
  constructor() {
    this.isResizing = false;
    this.startX = 0;
    this.startWidth = 0;
    this.minWidth = 200;
    this.maxWidth = 500;
    this.defaultWidth = 240;
    this.isMobile = false;
    this.resizeHandle = null;
    this.sidebar = null;
    this.overlay = null;
    this.content = null;

    // 存储键名
    this.storageKey = 'svtr-sidebar-width';

    this.init();
  }

  init() {
    this.detectMobile();
    this.cacheDOMElements();
    this.createResizeHandle();
    this.loadSavedWidth();
    this.setupEventListeners();
    this.setupMediaQueryListener();

    console.log('[SidebarResizer] 侧边栏宽度调整功能已启用');
  }

  detectMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  cacheDOMElements() {
    this.sidebar = document.querySelector('.sidebar');
    this.overlay = document.querySelector('.overlay');
    this.content = document.querySelector('.content');

    if (!this.sidebar) {
      console.error('[SidebarResizer] 未找到侧边栏元素');
      return;
    }
  }

  createResizeHandle() {
    if (this.isMobile || !this.sidebar) {
      return;
    }

    // 创建拖拽手柄
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'sidebar-resize-handle';
    this.resizeHandle.setAttribute('aria-label', '拖拽调整侧边栏宽度');
    this.resizeHandle.setAttribute('title', '拖拽调整侧边栏宽度');

    // 添加手柄图标
    this.resizeHandle.innerHTML = `
      <div class="resize-handle-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3V13M10 3V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="6" cy="8" r="1" fill="currentColor"/>
          <circle cx="10" cy="8" r="1" fill="currentColor"/>
        </svg>
      </div>
    `;

    this.sidebar.appendChild(this.resizeHandle);
  }

  loadSavedWidth() {
    if (this.isMobile) {
      return;
    }

    const savedWidth = localStorage.getItem(this.storageKey);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= this.minWidth && width <= this.maxWidth) {
        this.setSidebarWidth(width);
        return;
      }
    }

    // 设置默认宽度
    this.setSidebarWidth(this.defaultWidth);
  }

  setSidebarWidth(width) {
    if (this.isMobile || !this.sidebar) {
      return;
    }

    // 限制宽度范围
    width = Math.max(this.minWidth, Math.min(this.maxWidth, width));

    // 设置CSS变量来控制侧边栏宽度
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);

    // 同时设置内联样式作为备用（确保优先级）
    this.sidebar.style.width = `${width}px`;

    // 调整内容区域的margin（仅在桌面端且侧边栏打开时）
    if (this.content && this.sidebar.classList.contains('open') && !this.isMobile) {
      this.content.style.marginLeft = `${width}px`;
    }

    // 触发自定义事件
    this.dispatchWidthChangeEvent(width);
  }

  dispatchWidthChangeEvent(width) {
    const event = new CustomEvent('sidebarWidthChange', {
      detail: { width, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  setupEventListeners() {
    if (this.isMobile || !this.resizeHandle) {
      return;
    }

    // 鼠标事件
    this.resizeHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));

    // 触摸事件（平板设备）
    this.resizeHandle.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));

    // 键盘事件（无障碍支持）
    this.resizeHandle.addEventListener('keydown', this.handleKeyDown.bind(this));

    // 双击重置
    this.resizeHandle.addEventListener('dblclick', this.resetToDefault.bind(this));

    // 窗口大小变化
    window.addEventListener('resize', this.handleWindowResize.bind(this));

    // 监听侧边栏开关状态变化，修复宽度调整后的隐藏问题
    this.setupSidebarToggleListener();
  }

  setupSidebarToggleListener() {
    if (!this.sidebar) return;

    // 使用MutationObserver监听侧边栏class变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          this.handleSidebarToggle();
        }
      });
    });

    observer.observe(this.sidebar, {
      attributes: true,
      attributeFilter: ['class']
    });

    // 保存observer引用以便清理
    this.sidebarObserver = observer;

    console.log('[SidebarResizer] 侧边栏开关监听器已设置');
  }

  handleSidebarToggle() {
    if (!this.sidebar || this.isMobile) return;

    const isOpen = this.sidebar.classList.contains('open');
    const currentWidth = parseInt(this.sidebar.style.width) || this.defaultWidth;

    if (!isOpen) {
      // 侧边栏关闭时，确保完全隐藏
      // 使用足够大的负值确保无论宽度多少都完全隐藏
      this.sidebar.style.transform = `translateX(-${Math.max(currentWidth, 600)}px)`;
      console.log(`[SidebarResizer] 侧边栏关闭，使用固定偏移: -${Math.max(currentWidth, 600)}px`);
      
      // 重置内容区域margin
      if (this.content) {
        this.content.style.marginLeft = '0px';
      }
    } else {
      // 侧边栏打开时，移除自定义transform，使用CSS默认值
      this.sidebar.style.transform = '';
      console.log('[SidebarResizer] 侧边栏打开，恢复默认transform');
      
      // 设置内容区域margin
      if (this.content) {
        this.content.style.marginLeft = `${currentWidth}px`;
      }
    }
  }

  setupMediaQueryListener() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    mediaQuery.addListener(this.handleMediaQueryChange.bind(this));
    this.handleMediaQueryChange(mediaQuery);
  }

  handleMediaQueryChange(mq) {
    const wasMobile = this.isMobile;
    this.isMobile = mq.matches;

    if (this.isMobile && !wasMobile) {
      // 切换到移动端：隐藏拖拽手柄，重置样式
      if (this.resizeHandle) {
        this.resizeHandle.style.display = 'none';
      }
      this.resetSidebarStyles();
    } else if (!this.isMobile && wasMobile) {
      // 切换到桌面端：显示拖拽手柄，恢复宽度
      if (!this.resizeHandle) {
        this.createResizeHandle();
      } else {
        this.resizeHandle.style.display = 'block';
      }
      this.loadSavedWidth();
    }
  }

  resetSidebarStyles() {
    if (this.sidebar) {
      this.sidebar.style.width = '';
    }
    if (this.content) {
      this.content.style.marginLeft = '';
    }
  }

  // 鼠标事件处理
  handleMouseDown(e) {
    if (this.isMobile) {
      return;
    }

    e.preventDefault();
    this.startResize(e.clientX);
  }

  handleMouseMove(e) {
    if (!this.isResizing || this.isMobile) {
      return;
    }

    e.preventDefault();
    this.updateResize(e.clientX);
  }

  handleMouseUp(e) {
    if (!this.isResizing || this.isMobile) {
      return;
    }

    e.preventDefault();
    this.endResize();
  }

  // 触摸事件处理
  handleTouchStart(e) {
    if (this.isMobile) {
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    this.startResize(touch.clientX);
  }

  handleTouchMove(e) {
    if (!this.isResizing || this.isMobile) {
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    this.updateResize(touch.clientX);
  }

  handleTouchEnd(e) {
    if (!this.isResizing || this.isMobile) {
      return;
    }

    e.preventDefault();
    this.endResize();
  }

  // 键盘事件处理（无障碍支持）
  handleKeyDown(e) {
    if (this.isMobile || !this.sidebar) {
      return;
    }

    const currentWidth = parseInt(this.sidebar.style.width) || this.defaultWidth;
    let newWidth = currentWidth;

    switch (e.key) {
    case 'ArrowLeft':
      newWidth = Math.max(this.minWidth, currentWidth - 10);
      break;
    case 'ArrowRight':
      newWidth = Math.min(this.maxWidth, currentWidth + 10);
      break;
    case 'Home':
      newWidth = this.minWidth;
      break;
    case 'End':
      newWidth = this.maxWidth;
      break;
    case 'Enter':
    case ' ':
      this.resetToDefault();
      return;
    default:
      return;
    }

    e.preventDefault();
    this.setSidebarWidth(newWidth);
    this.saveWidth(newWidth);
  }

  // 调整逻辑
  startResize(clientX) {
    this.isResizing = true;
    this.startX = clientX;
    this.startWidth = parseInt(this.sidebar.style.width) || this.defaultWidth;

    // 添加调整状态样式
    document.body.classList.add('sidebar-resizing');
    this.resizeHandle.classList.add('active');

    // 禁用文本选择
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }

  updateResize(clientX) {
    if (!this.isResizing) {
      return;
    }

    const deltaX = clientX - this.startX;
    const newWidth = this.startWidth + deltaX;

    this.setSidebarWidth(newWidth);
  }

  endResize() {
    if (!this.isResizing) {
      return;
    }

    this.isResizing = false;

    // 保存新宽度
    const currentWidth = parseInt(this.sidebar.style.width) || this.defaultWidth;
    this.saveWidth(currentWidth);

    // 移除调整状态样式
    document.body.classList.remove('sidebar-resizing');
    this.resizeHandle.classList.remove('active');

    // 恢复文本选择
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // 提供触觉反馈
    this.hapticFeedback();
  }

  resetToDefault() {
    if (this.isMobile) {
      return;
    }

    this.setSidebarWidth(this.defaultWidth);
    this.saveWidth(this.defaultWidth);
    this.hapticFeedback('success');
  }

  saveWidth(width) {
    if (this.isMobile) {
      return;
    }

    localStorage.setItem(this.storageKey, width.toString());
  }

  handleWindowResize() {
    // 防抖处理
    clearTimeout(this.windowResizeTimeout);
    this.windowResizeTimeout = setTimeout(() => {
      this.detectMobile();

      if (!this.isMobile && this.sidebar) {
        // 确保宽度在有效范围内
        const currentWidth = parseInt(this.sidebar.style.width) || this.defaultWidth;
        if (currentWidth < this.minWidth || currentWidth > this.maxWidth) {
          this.setSidebarWidth(this.defaultWidth);
        }
      }
    }, 150);
  }

  hapticFeedback(type = 'light') {
    if (navigator.vibrate) {
      const patterns = {
        light: [10],
        success: [10, 50, 10]
      };
      navigator.vibrate(patterns[type] || patterns.light);
    }
  }

  // 公共API
  getWidth() {
    if (this.isMobile || !this.sidebar) {
      return null;
    }
    return parseInt(this.sidebar.style.width) || this.defaultWidth;
  }

  setWidth(width) {
    if (this.isMobile) {
      return false;
    }

    width = parseInt(width);
    if (isNaN(width) || width < this.minWidth || width > this.maxWidth) {
      return false;
    }

    this.setSidebarWidth(width);
    this.saveWidth(width);
    return true;
  }

  reset() {
    this.resetToDefault();
  }

  destroy() {
    if (this.resizeHandle) {
      this.resizeHandle.remove();
      this.resizeHandle = null;
    }

    // 清理MutationObserver
    if (this.sidebarObserver) {
      this.sidebarObserver.disconnect();
      this.sidebarObserver = null;
    }

    this.resetSidebarStyles();
    document.body.classList.remove('sidebar-resizing');
    document.body.style.userSelect = '';
    document.body.style.cursor = '';

    // 清理定时器
    if (this.windowResizeTimeout) {
      clearTimeout(this.windowResizeTimeout);
    }

    console.log('[SidebarResizer] 资源清理完成');
  }
}

// 添加必要的CSS样式
const sidebarResizerStyles = document.createElement('style');
sidebarResizerStyles.textContent = `
  /* 拖拽手柄样式 */
  .sidebar-resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 6px;
    background: transparent;
    cursor: col-resize;
    z-index: 1060;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    user-select: none;
  }
  
  .sidebar-resize-handle:hover {
    background: rgba(250, 140, 50, 0.1);
    width: 8px;
  }
  
  .sidebar-resize-handle.active {
    background: rgba(250, 140, 50, 0.2);
    width: 8px;
  }
  
  .resize-handle-icon {
    opacity: 0;
    color: var(--primary-color);
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: opacity 0.2s ease;
    pointer-events: none;
  }
  
  .sidebar-resize-handle:hover .resize-handle-icon,
  .sidebar-resize-handle.active .resize-handle-icon {
    opacity: 1;
  }
  
  /* 调整时的全局样式 */
  .sidebar-resizing {
    cursor: col-resize !important;
  }
  
  .sidebar-resizing * {
    cursor: col-resize !important;
    user-select: none !important;
  }
  
  /* 焦点状态 */
  .sidebar-resize-handle:focus {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
    background: rgba(250, 140, 50, 0.15);
  }
  
  .sidebar-resize-handle:focus .resize-handle-icon {
    opacity: 1;
  }
  
  /* 高对比度模式支持 */
  @media (prefers-contrast: high) {
    .sidebar-resize-handle {
      border-right: 2px solid var(--primary-color);
    }
    
    .sidebar-resize-handle:hover,
    .sidebar-resize-handle.active {
      background: var(--primary-color);
    }
    
    .resize-handle-icon {
      background: white;
      border: 1px solid var(--primary-color);
    }
  }
  
  /* 减少动画偏好支持 */
  @media (prefers-reduced-motion: reduce) {
    .sidebar-resize-handle,
    .resize-handle-icon {
      transition: none;
    }
  }
  
  /* 移动端隐藏 */
  @media (max-width: 768px) {
    .sidebar-resize-handle {
      display: none !important;
    }
  }
  
  /* 暗色模式适配 */
  @media (prefers-color-scheme: dark) {
    .sidebar-resize-handle:hover {
      background: rgba(250, 140, 50, 0.15);
    }
    
    .sidebar-resize-handle.active {
      background: rgba(250, 140, 50, 0.25);
    }
    
    .resize-handle-icon {
      background: rgba(30, 30, 30, 0.9);
      color: #fa8c32;
    }
  }
`;

document.head.appendChild(sidebarResizerStyles);

// 初始化侧边栏调整器
let sidebarResizer;

function initSidebarResizer() {
  if (sidebarResizer) {
    sidebarResizer.destroy();
  }

  sidebarResizer = new SidebarResizer();

  // 暴露到全局对象供调试使用
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.sidebarResizer = sidebarResizer;
  }
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebarResizer);
} else {
  initSidebarResizer();
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SidebarResizer;
} else if (typeof window !== 'undefined') {
  window.SidebarResizer = SidebarResizer;
}

// 监听宽度变化事件示例
window.addEventListener('sidebarWidthChange', (event) => {
  console.log(`[SidebarResizer] 侧边栏宽度已更改为: ${event.detail.width}px`);
});
