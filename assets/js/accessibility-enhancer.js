/**
 * 无障碍访问增强器
 */

class AccessibilityEnhancer {
    constructor() {
        this.init();
    }

    init() {
        this.enhanceKeyboardNavigation();
        this.improveScreenReaderSupport();
        this.addFocusManagement();
        this.enhanceColorContrast();
        this.setupSkipLinks();
    }

    enhanceKeyboardNavigation() {
        // 确保所有交互元素可键盘访问
        document.addEventListener('keydown', (e) => {
            // Escape键关闭模态框和侧边栏
            if (e.key === 'Escape') {
                this.closeModals();
                this.closeSidebar();
            }
            
            // Tab键焦点管理
            if (e.key === 'Tab') {
                this.manageFocus(e);
            }
            
            // 回车键激活按钮
            if (e.key === 'Enter' && e.target.matches('button, [role="button"]')) {
                e.target.click();
            }
        });

        // 为所有可点击元素添加keyboard支持
        document.querySelectorAll('[onclick]:not(button):not(a):not(input)').forEach(element => {
            if (!element.hasAttribute('tabindex')) {
                element.setAttribute('tabindex', '0');
            }
            if (!element.hasAttribute('role')) {
                element.setAttribute('role', 'button');
            }
        });
    }

    improveScreenReaderSupport() {
        // 动态内容更新通知
        this.createLiveRegions();
        
        // 为图片添加alt文本
        document.querySelectorAll('img:not([alt])').forEach(img => {
            img.setAttribute('alt', this.generateAltText(img));
        });

        // 为链接添加描述性文本
        document.querySelectorAll('a[href^="http"]:not([aria-label])').forEach(link => {
            link.setAttribute('aria-label', `${link.textContent} (在新窗口打开)`);
        });
    }

    createLiveRegions() {
        // 创建用于动态内容通知的区域
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only live-region';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);

        // 监听聊天消息更新
        const chatContainer = document.querySelector('.svtr-chat-messages');
        if (chatContainer) {
            const observer = new MutationObserver(() => {
                const lastMessage = chatContainer.querySelector('.svtr-message:last-child .message-content');
                if (lastMessage) {
                    this.announceLiveUpdate(`新消息: ${lastMessage.textContent.substring(0, 100)}`);
                }
            });
            
            observer.observe(chatContainer, { childList: true });
        }
    }

    announceLiveUpdate(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }

    addFocusManagement() {
        // 焦点环样式
        const focusStyle = document.createElement('style');
        focusStyle.textContent = `
            .focus-visible {
                outline: 3px solid #4A90E2;
                outline-offset: 2px;
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(focusStyle);

        // 焦点可见性管理
        document.addEventListener('mousedown', () => {
            document.body.classList.add('using-mouse');
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.remove('using-mouse');
            }
        });
    }

    enhanceColorContrast() {
        // 检查颜色对比度
        const checkContrast = (element) => {
            const styles = window.getComputedStyle(element);
            const bgColor = styles.backgroundColor;
            const textColor = styles.color;
            
            // 这里可以添加更复杂的对比度检查逻辑
            if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
                return true; // 跳过透明背景
            }
            
            // 基本的颜色对比度警告
            if (textColor === bgColor) {
                console.warn('可能的颜色对比度问题:', element);
            }
        };

        // 检查所有文本元素
        document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, button, span').forEach(checkContrast);
    }

    setupSkipLinks() {
        // 添加跳转链接
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = '跳转到主要内容';
        skipLink.className = 'skip-link sr-only';
        skipLink.setAttribute('aria-label', '跳过导航，直接到主要内容');
        
        // 焦点时显示
        skipLink.addEventListener('focus', () => {
            skipLink.classList.remove('sr-only');
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.classList.add('sr-only');
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    generateAltText(img) {
        const src = img.src || img.dataset.src || '';
        
        if (src.includes('logo')) return 'SVTR网站标志';
        if (src.includes('banner')) return '网站横幅图片';
        if (src.includes('avatar')) return '用户头像';
        if (src.includes('qr')) return '二维码';
        
        return '图片';
    }

    closeModals() {
        document.querySelectorAll('.modal.active, .dialog.open').forEach(modal => {
            modal.classList.remove('active', 'open');
        });
    }

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    }

    manageFocus(e) {
        // 模态框内焦点陷阱
        const modal = e.target.closest('.modal, .dialog');
        if (modal) {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && e.target === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && e.target === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
}

// 全局初始化
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.accessibilityEnhancer = new AccessibilityEnhancer();
    });
}

export default AccessibilityEnhancer;
