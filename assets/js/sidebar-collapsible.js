/**
 * 侧边栏手风琴式折叠菜单功能
 * 同时只能有一个菜单组展开，具有流畅的动画效果
 */

(function() {
  'use strict';

  class SidebarAccordion {
    constructor() {
      this.accordionMode = true; // 启用手风琴模式，同时只能有一个展开
      this.animationDuration = 300; // 动画持续时间
      this.currentOpenGroup = null; // 当前打开的组
      this.init();
    }

    init() {
      // 等待DOM完全加载
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupAccordion());
      } else {
        this.setupAccordion();
      }
    }

    setupAccordion() {
      // 获取所有可折叠的组头
      const collapsibleHeaders = document.querySelectorAll('.group-header.collapsible');
      
      collapsibleHeaders.forEach((header, index) => {
        // 为每个组头添加点击事件
        header.addEventListener('click', (e) => {
          e.preventDefault();
          this.toggleAccordionGroup(header);
        });

        // 添加键盘支持
        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleAccordionGroup(header);
          }
        });

        // 设置初始状态和aria属性
        this.setupInitialState(header, index);
      });

      // 设置嵌套子菜单的显示/隐藏行为
      this.setupNestedMenus();

      console.log(`[SidebarAccordion] 已初始化手风琴式菜单，共 ${collapsibleHeaders.length} 个菜单组`);
    }

    setupNestedMenus() {
      // 当父级菜单折叠时，确保所有嵌套子菜单也被隐藏
      const allSubLists = document.querySelectorAll('.sub-list');
      
      allSubLists.forEach(subList => {
        // 使用MutationObserver监听class变化
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              const target = mutation.target;
              const nestedSubLists = target.querySelectorAll('.sub-list');
              
              if (target.classList.contains('collapsed')) {
                // 如果父级折叠，确保所有嵌套子菜单也被隐藏
                nestedSubLists.forEach(nested => {
                  nested.style.maxHeight = '0';
                  nested.style.opacity = '0';
                  nested.style.marginTop = '0';
                });
              } else if (target.classList.contains('expanded')) {
                // 如果父级展开，允许嵌套子菜单显示
                nestedSubLists.forEach(nested => {
                  nested.style.maxHeight = 'none';
                  nested.style.opacity = '1';
                  nested.style.marginTop = '4px';
                });
              }
            }
          });
        });

        observer.observe(subList, { attributes: true, attributeFilter: ['class'] });
      });
    }

    setupInitialState(header, index) {
      const subList = header.nextElementSibling;
      const toggleIcon = header.querySelector('.toggle-icon');
      const groupId = `accordion-group-${index}`;
      
      if (subList && subList.classList.contains('sub-list')) {
        // 设置ARIA属性以提升可访问性
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('aria-controls', groupId);
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        
        subList.setAttribute('id', groupId);
        subList.setAttribute('role', 'region');
        subList.setAttribute('aria-labelledby', header.id || `accordion-header-${index}`);
        
        if (!header.id) {
          header.id = `accordion-header-${index}`;
        }
        
        // 确保初始状态为折叠，设置正确的高度
        this.collapseGroup(subList, toggleIcon, false);
      }
    }

    toggleAccordionGroup(header) {
      const subList = header.nextElementSibling;
      const toggleIcon = header.querySelector('.toggle-icon');
      
      if (!subList || !subList.classList.contains('sub-list')) {
        return;
      }

      const isCurrentlyExpanded = subList.classList.contains('expanded');
      
      if (this.accordionMode && !isCurrentlyExpanded) {
        // 手风琴模式：先关闭其他所有组
        this.collapseAllGroups(header);
      }
      
      if (isCurrentlyExpanded) {
        // 如果当前是展开的，则折叠
        this.collapseGroup(subList, toggleIcon, true);
        this.currentOpenGroup = null;
        header.setAttribute('aria-expanded', 'false');
      } else {
        // 如果当前是折叠的，则展开
        this.expandGroup(subList, toggleIcon);
        this.currentOpenGroup = header;
        header.setAttribute('aria-expanded', 'true');
      }

      // 触发自定义事件
      this.dispatchToggleEvent(header, subList, !isCurrentlyExpanded);
    }

    expandGroup(subList, toggleIcon) {
      if (!subList) return;
      
      // 移除折叠状态
      subList.classList.remove('collapsed');
      subList.classList.add('expanding');
      
      // 计算目标高度
      const scrollHeight = subList.scrollHeight;
      
      // 设置起始高度为0，然后动画到目标高度
      subList.style.height = '0px';
      subList.style.overflow = 'hidden';
      
      // 使用requestAnimationFrame确保样式应用
      requestAnimationFrame(() => {
        subList.style.transition = `height ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        subList.style.height = scrollHeight + 'px';
      });
      
      // 动画完成后清理样式
      setTimeout(() => {
        subList.classList.remove('expanding');
        subList.classList.add('expanded');
        subList.style.height = '';
        subList.style.overflow = '';
        subList.style.transition = '';
      }, this.animationDuration);
      
      // 切换图标状态
      if (toggleIcon) {
        toggleIcon.classList.add('expanded');
      }
    }

    collapseGroup(subList, toggleIcon, animate = true) {
      if (!subList) return;
      
      if (animate) {
        // 获取当前高度
        const currentHeight = subList.scrollHeight;
        
        subList.classList.remove('expanded');
        subList.classList.add('collapsing');
        
        // 设置当前高度，然后动画到0
        subList.style.height = currentHeight + 'px';
        subList.style.overflow = 'hidden';
        
        requestAnimationFrame(() => {
          subList.style.transition = `height ${this.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          subList.style.height = '0px';
        });
        
        // 动画完成后设置最终状态
        setTimeout(() => {
          subList.classList.remove('collapsing');
          subList.classList.add('collapsed');
          subList.style.height = '';
          subList.style.overflow = '';
          subList.style.transition = '';
        }, this.animationDuration);
      } else {
        // 无动画直接设置
        subList.classList.remove('expanded', 'expanding', 'collapsing');
        subList.classList.add('collapsed');
        subList.style.height = '';
        subList.style.overflow = '';
        subList.style.transition = '';
      }
      
      // 切换图标状态
      if (toggleIcon) {
        toggleIcon.classList.remove('expanded');
      }
    }

    collapseAllGroups(exceptHeader = null) {
      const collapsibleHeaders = document.querySelectorAll('.group-header.collapsible');
      
      collapsibleHeaders.forEach(header => {
        if (header === exceptHeader) return;
        
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList && subList.classList.contains('expanded')) {
          this.collapseGroup(subList, toggleIcon, true);
          header.setAttribute('aria-expanded', 'false');
        }
      });
    }

    dispatchToggleEvent(header, subList, isExpanded) {
      const event = new CustomEvent('sidebarAccordionToggle', {
        detail: {
          header,
          subList,
          isExpanded,
          accordionMode: this.accordionMode
        }
      });
      
      window.dispatchEvent(event);
    }

    // 公共API方法：展开指定组
    expandSpecificGroup(groupSelector) {
      const header = document.querySelector(groupSelector);
      if (header) {
        // 如果是手风琴模式，先关闭其他组
        if (this.accordionMode) {
          this.collapseAllGroups(header);
        }
        
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList && subList.classList.contains('collapsed')) {
          this.expandGroup(subList, toggleIcon);
          this.currentOpenGroup = header;
          header.setAttribute('aria-expanded', 'true');
        }
      }
    }

    // 公共API方法：收起指定组
    collapseSpecificGroup(groupSelector) {
      const header = document.querySelector(groupSelector);
      if (header) {
        const subList = header.nextElementSibling;
        const toggleIcon = header.querySelector('.toggle-icon');
        
        if (subList && subList.classList.contains('expanded')) {
          this.collapseGroup(subList, toggleIcon, true);
          if (this.currentOpenGroup === header) {
            this.currentOpenGroup = null;
          }
          header.setAttribute('aria-expanded', 'false');
        }
      }
    }

    // 收起所有组
    collapseAll() {
      this.collapseAllGroups();
      this.currentOpenGroup = null;
    }

    // 设置手风琴模式
    setAccordionMode(enabled) {
      this.accordionMode = enabled;
      console.log(`[SidebarAccordion] 手风琴模式 ${enabled ? '已启用' : '已禁用'}`);
      
      if (!enabled && this.currentOpenGroup) {
        // 如果禁用手风琴模式，清除当前打开组的跟踪
        this.currentOpenGroup = null;
      }
    }

    // 获取当前打开的组
    getCurrentOpenGroup() {
      return this.currentOpenGroup;
    }

    // 获取所有组的状态
    getGroupStates() {
      const states = {};
      const collapsibleHeaders = document.querySelectorAll('.group-header.collapsible');
      
      collapsibleHeaders.forEach((header, index) => {
        const subList = header.nextElementSibling;
        const groupId = header.id || `accordion-header-${index}`;
        
        states[groupId] = {
          isExpanded: subList ? subList.classList.contains('expanded') : false,
          header,
          subList
        };
      });
      
      return states;
    }
  }

  // 创建全局实例
  window.sidebarAccordion = new SidebarAccordion();

  // 保持向后兼容性
  window.sidebarCollapsible = window.sidebarAccordion;

})();