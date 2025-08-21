/**
 * 侧边栏折叠菜单功能
 * 处理一级标题的展开/收起交互
 */

(function() {
  'use strict';

  class SidebarCollapsible {
    constructor() {
      this.init();
    }

    init() {
      // 等待DOM完全加载
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupCollapsible());
      } else {
        this.setupCollapsible();
      }
    }

    setupCollapsible() {
      // 获取所有可折叠的组头
      const collapsibleHeaders = document.querySelectorAll('.group-header.collapsible');
      
      collapsibleHeaders.forEach(header => {
        // 为每个组头添加点击事件
        header.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleGroup(header);
        });

        // 添加键盘支持
        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleGroup(header);
          }
        });

        // 设置初始状态
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList && subList.classList.contains('sub-list')) {
          // 确保初始状态为折叠
          subList.classList.add('collapsed');
          subList.classList.remove('expanded');
          
          if (toggleIcon) {
            toggleIcon.classList.remove('expanded');
          }
        }
      });

      console.log(`[SidebarCollapsible] 已初始化 ${collapsibleHeaders.length} 个可折叠菜单组`);
    }

    toggleGroup(header) {
      const subList = header.nextElementSibling;
      const toggleIcon = header.querySelector('.toggle-icon');
      
      if (!subList || !subList.classList.contains('sub-list')) {
        return;
      }

      // 切换展开/收起状态
      const isCollapsed = subList.classList.contains('collapsed');
      
      if (isCollapsed) {
        // 展开
        subList.classList.remove('collapsed');
        subList.classList.add('expanded');
        
        if (toggleIcon) {
          toggleIcon.classList.add('expanded');
        }
      } else {
        // 收起
        subList.classList.add('collapsed');
        subList.classList.remove('expanded');
        
        if (toggleIcon) {
          toggleIcon.classList.remove('expanded');
        }
      }

      // 触发自定义事件，其他组件可以监听
      const event = new CustomEvent('sidebarGroupToggle', {
        detail: {
          header,
          subList,
          isExpanded: !isCollapsed
        }
      });
      
      window.dispatchEvent(event);
    }

    // 展开指定组
    expandGroup(groupSelector) {
      const header = document.querySelector(groupSelector);
      if (header) {
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList && subList.classList.contains('collapsed')) {
          subList.classList.remove('collapsed');
          subList.classList.add('expanded');
          
          if (toggleIcon) {
            toggleIcon.classList.add('expanded');
          }
        }
      }
    }

    // 收起指定组
    collapseGroup(groupSelector) {
      const header = document.querySelector(groupSelector);
      if (header) {
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList && subList.classList.contains('expanded')) {
          subList.classList.add('collapsed');
          subList.classList.remove('expanded');
          
          if (toggleIcon) {
            toggleIcon.classList.remove('expanded');
          }
        }
      }
    }

    // 收起所有组
    collapseAll() {
      const collapsibleHeaders = document.querySelectorAll('.group-header.collapsible');
      collapsibleHeaders.forEach(header => {
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList) {
          subList.classList.add('collapsed');
          subList.classList.remove('expanded');
          
          if (toggleIcon) {
            toggleIcon.classList.remove('expanded');
          }
        }
      });
    }

    // 展开所有组
    expandAll() {
      const collapsibleHeaders = document.querySelectorAll('.group-header.collapsible');
      collapsibleHeaders.forEach(header => {
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList) {
          subList.classList.remove('collapsed');
          subList.classList.add('expanded');
          
          if (toggleIcon) {
            toggleIcon.classList.add('expanded');
          }
        }
      });
    }
  }

  // 创建全局实例
  window.sidebarCollapsible = new SidebarCollapsible();

})();