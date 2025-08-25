/**
 * 移动端侧边栏交互调试工具
 * 用于验证订阅表单输入框的交互修复
 */

class MobileSidebarInteractionDebug {
  constructor() {
    this.init();
  }

  init() {
    // 仅在移动端启用调试
    if (window.innerWidth <= 768) {
      this.setupDebugTools();
      this.monitorInteractionEvents();
    }
  }

  setupDebugTools() {
    // 添加调试信息面板（仅开发环境）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.createDebugPanel();
    }
  }

  createDebugPanel() {
    const debugPanel = document.createElement('div');
    debugPanel.id = 'mobile-debug-panel';
    debugPanel.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 9999;
      max-width: 200px;
      display: none;
    `;
    
    debugPanel.innerHTML = `
      <div>📱 移动端调试</div>
      <div id="debug-sidebar-status">侧边栏: 关闭</div>
      <div id="debug-input-status">输入框: 正常</div>
      <div id="debug-pointer-events">指针事件: 启用</div>
      <button onclick="this.parentElement.style.display='none'" style="margin-top: 5px; padding: 2px 6px; font-size: 10px;">关闭</button>
    `;

    document.body.appendChild(debugPanel);

    // 添加显示/隐藏调试面板的快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  monitorInteractionEvents() {
    // 监控侧边栏状态变化
    const sidebar = document.querySelector('.sidebar');
    const subscribeInput = document.querySelector('#subscribeEmail');
    
    if (sidebar && subscribeInput) {
      // 使用MutationObserver监听侧边栏class变化
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            this.updateDebugInfo();
            this.testInputInteraction();
          }
        });
      });

      observer.observe(sidebar, {
        attributes: true,
        attributeFilter: ['class']
      });

      // 监听输入框交互事件
      subscribeInput.addEventListener('focus', () => {
        this.logInteraction('输入框获得焦点');
      });

      subscribeInput.addEventListener('blur', () => {
        this.logInteraction('输入框失去焦点');
      });

      subscribeInput.addEventListener('touchstart', () => {
        this.logInteraction('输入框触摸开始');
      });

      subscribeInput.addEventListener('click', () => {
        this.logInteraction('输入框被点击');
      });
    }
  }

  updateDebugInfo() {
    const sidebar = document.querySelector('.sidebar');
    const subscribeInput = document.querySelector('#subscribeEmail');
    const debugPanel = document.querySelector('#mobile-debug-panel');
    
    if (debugPanel) {
      const sidebarStatus = document.querySelector('#debug-sidebar-status');
      const inputStatus = document.querySelector('#debug-input-status');
      const pointerStatus = document.querySelector('#debug-pointer-events');

      if (sidebarStatus) {
        sidebarStatus.textContent = `侧边栏: ${sidebar?.classList.contains('open') ? '打开' : '关闭'}`;
      }

      if (inputStatus && subscribeInput) {
        const computedStyle = window.getComputedStyle(subscribeInput);
        const pointerEvents = computedStyle.pointerEvents;
        inputStatus.textContent = `输入框: ${pointerEvents === 'none' ? '禁用' : '正常'}`;
      }

      if (pointerStatus && subscribeInput) {
        const computedStyle = window.getComputedStyle(subscribeInput);
        pointerStatus.textContent = `指针事件: ${computedStyle.pointerEvents}`;
      }
    }
  }

  testInputInteraction() {
    const subscribeInput = document.querySelector('#subscribeEmail');
    const sidebar = document.querySelector('.sidebar');
    
    if (subscribeInput && sidebar?.classList.contains('open')) {
      // 测试输入框是否可以接收焦点
      setTimeout(() => {
        const canFocus = this.testElementFocus(subscribeInput);
        if (!canFocus) {
          this.logInteraction('⚠️ 输入框无法获得焦点！');
          this.showFixSuggestion();
        } else {
          this.logInteraction('✅ 输入框可以正常获得焦点');
        }
      }, 300); // 等待CSS动画完成
    }
  }

  testElementFocus(element) {
    try {
      const originalActiveElement = document.activeElement;
      element.focus();
      const focused = document.activeElement === element;
      originalActiveElement.focus(); // 恢复原来的焦点
      return focused;
    } catch (error) {
      return false;
    }
  }

  logInteraction(message) {
    console.log(`[移动端侧边栏调试] ${new Date().toLocaleTimeString()}: ${message}`);
    
    // 如果是开发环境，也在调试面板显示
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      this.showToast(message);
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 10000;
      max-width: 80%;
      text-align: center;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  showFixSuggestion() {
    const suggestion = document.createElement('div');
    suggestion.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 10px;
      font-size: 14px;
      z-index: 10001;
      max-width: 90%;
      text-align: center;
    `;
    
    suggestion.innerHTML = `
      <div>⚠️ 输入框交互问题检测到！</div>
      <div style="margin-top: 10px; font-size: 12px;">
        请尝试刷新页面或检查CSS pointer-events 设置
      </div>
      <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px; background: white; color: red; border: none; border-radius: 5px;">
        知道了
      </button>
    `;
    
    document.body.appendChild(suggestion);
    
    setTimeout(() => {
      suggestion.remove();
    }, 8000);
  }
}

// 页面加载完成后初始化调试工具
document.addEventListener('DOMContentLoaded', () => {
  // 仅在移动设备上启用
  if (window.innerWidth <= 768) {
    window.mobileSidebarDebug = new MobileSidebarInteractionDebug();
    console.log('📱 移动端侧边栏交互调试工具已启动');
    console.log('💡 提示：按 Ctrl+Shift+D 显示调试面板');
  }
});