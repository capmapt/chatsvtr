#!/usr/bin/env node

/**
 * ChatSVTR代码质量优化器
 * 自动化代码重构、性能优化、测试修复
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodeQualityOptimizer {
    constructor() {
        this.projectRoot = process.cwd();
        this.optimizationTasks = [
            'analyzeCSSRedundancy',
            'refactorCompressedJS', 
            'updateTestSelectors',
            'enhanceErrorHandling',
            'optimizeImageLoading',
            'improveAccessibility'
        ];
        
        this.report = {
            startTime: new Date(),
            tasks: [],
            metrics: {}
        };
    }

    /**
     * 主要优化流程
     */
    async runOptimization() {
        console.log('🚀 ChatSVTR代码质量优化开始');
        console.log('====================================');
        
        try {
            // 执行所有优化任务
            for (const task of this.optimizationTasks) {
                console.log(`\n📋 执行任务: ${task}`);
                const result = await this[task]();
                this.report.tasks.push({
                    name: task,
                    status: 'completed',
                    result,
                    timestamp: new Date()
                });
            }
            
            // 生成优化报告
            await this.generateOptimizationReport();
            
            console.log('\n🎉 代码质量优化完成！');
            console.log(`📊 总耗时: ${(new Date() - this.report.startTime) / 1000}秒`);
            
        } catch (error) {
            console.error('❌ 优化过程失败:', error);
            throw error;
        }
    }

    /**
     * 分析CSS冗余并优化
     */
    async analyzeCSSRedundancy() {
        console.log('🔍 分析CSS文件冗余...');
        
        const cssFiles = [
            'assets/css/style.css',
            'assets/css/style-optimized.css',
            'assets/css/chat.css', 
            'assets/css/chat-optimized.css',
            'assets/css/sidebar.css',
            'assets/css/sidebar-optimized.css'
        ];
        
        const analysis = {
            totalFiles: cssFiles.length,
            duplicateRules: 0,
            unusedClasses: [],
            optimizationSuggestions: []
        };
        
        // 检查文件重复内容
        const cssContents = {};
        for (const file of cssFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (fs.existsSync(filePath)) {
                cssContents[file] = fs.readFileSync(filePath, 'utf8');
            }
        }
        
        // 识别重复规则
        const rulePatterns = {};
        Object.entries(cssContents).forEach(([file, content]) => {
            const rules = content.match(/\.[a-zA-Z0-9-_]+\s*{[^}]*}/g) || [];
            rules.forEach(rule => {
                const selector = rule.split('{')[0].trim();
                if (!rulePatterns[selector]) {
                    rulePatterns[selector] = [];
                }
                rulePatterns[selector].push(file);
            });
        });
        
        // 统计重复
        Object.entries(rulePatterns).forEach(([selector, files]) => {
            if (files.length > 1) {
                analysis.duplicateRules++;
                analysis.optimizationSuggestions.push(
                    `CSS选择器 "${selector}" 在 ${files.length} 个文件中重复`
                );
            }
        });
        
        // 生成优化建议
        if (analysis.duplicateRules > 0) {
            analysis.optimizationSuggestions.push(
                '建议: 创建统一的CSS模块架构',
                '建议: 使用CSS变量减少重复',
                '建议: 实施CSS-in-JS或CSS模块化方案'
            );
        }
        
        console.log(`✅ CSS分析完成: 发现${analysis.duplicateRules}个重复规则`);
        return analysis;
    }

    /**
     * 重构压缩的JavaScript文件
     */
    async refactorCompressedJS() {
        console.log('🔧 重构压缩的JavaScript文件...');
        
        const compressedFiles = [
            'assets/js/chat-optimized.js',
            'assets/js/main-optimized.js',
            'assets/js/i18n-optimized.js'
        ];
        
        const refactorResults = {
            processedFiles: 0,
            totalSizeReduction: 0,
            readabilityImproved: 0
        };
        
        for (const file of compressedFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (!fs.existsSync(filePath)) continue;
            
            const originalContent = fs.readFileSync(filePath, 'utf8');
            const originalSize = originalContent.length;
            
            // 创建可读版本 (如果不存在源文件)
            const sourceFile = file.replace('-optimized', '');
            const sourcePath = path.join(this.projectRoot, sourceFile);
            
            if (!fs.existsSync(sourcePath)) {
                console.log(`⚠️ 为 ${file} 创建可读源文件...`);
                
                // 基本的代码格式化
                let formattedContent = originalContent
                    .replace(/;/g, ';\n')
                    .replace(/{/g, '{\n  ')
                    .replace(/}/g, '\n}')
                    .replace(/,/g, ',\n  ');
                
                // 添加注释和文档
                formattedContent = `/**\n * ${sourceFile} - 可维护版本\n * 自动从压缩版本重构\n * 请修改此文件，然后运行构建脚本\n */\n\n${formattedContent}`;
                
                fs.writeFileSync(sourcePath, formattedContent);
                refactorResults.readabilityImproved++;
            }
            
            refactorResults.processedFiles++;
        }
        
        // 创建构建脚本
        const buildScript = `#!/bin/bash
# 自动构建脚本 - 从源文件生成优化版本

echo "🔨 构建优化版本..."

# JavaScript压缩
if command -v terser &> /dev/null; then
    terser assets/js/chat.js --compress --mangle -o assets/js/chat-optimized.js --source-map
    terser assets/js/main.js --compress --mangle -o assets/js/main-optimized.js --source-map  
    terser assets/js/i18n.js --compress --mangle -o assets/js/i18n-optimized.js --source-map
    echo "✅ JavaScript压缩完成"
else
    echo "⚠️ terser未安装，跳过JS压缩"
fi

# CSS压缩  
if command -v cleancss &> /dev/null; then
    cleancss -o assets/css/style-optimized.css assets/css/style.css
    cleancss -o assets/css/chat-optimized.css assets/css/chat.css
    echo "✅ CSS压缩完成"
else
    echo "⚠️ clean-css未安装，跳过CSS压缩"  
fi

echo "🎉 构建完成！请运行测试验证功能正常"
`;
        
        fs.writeFileSync(path.join(this.projectRoot, 'scripts/build-optimized.sh'), buildScript);
        execSync('chmod +x scripts/build-optimized.sh');
        
        console.log(`✅ JavaScript重构完成: 处理${refactorResults.processedFiles}个文件`);
        return refactorResults;
    }

    /**
     * 更新E2E测试选择器
     */
    async updateTestSelectors() {
        console.log('🧪 更新E2E测试选择器...');
        
        const testFile = 'tests/e2e/svtr-core-features.spec.js';
        const testPath = path.join(this.projectRoot, testFile);
        
        if (!fs.existsSync(testPath)) {
            console.log('⚠️ 测试文件不存在，跳过');
            return { updated: false, reason: 'file_not_found' };
        }
        
        let testContent = fs.readFileSync(testPath, 'utf8');
        
        // 更新过时的选择器
        const selectorUpdates = [
            // 聊天组件选择器
            { old: '.chat-container', new: '.svtr-chat-container' },
            { old: '#user-input', new: '#svtr-chat-input' },
            { old: '#send-button', new: '#svtr-chat-send' },
            { old: '.message-content', new: '.svtr-message .message-content' },
            
            // 导航选择器
            { old: '.sidebar', new: '.sidebar' },
            { old: '.menu-toggle', new: '.menu-toggle' },
            { old: '.lang-toggle', new: '.lang-toggle' },
            
            // 新增可靠的测试属性
            { old: '#svtr-chat-input', new: '[data-testid="chat-input"]' },
            { old: '#svtr-chat-send', new: '[data-testid="chat-send"]' },
        ];
        
        let updatesCount = 0;
        selectorUpdates.forEach(({ old, new: newSelector }) => {
            if (testContent.includes(old)) {
                testContent = testContent.replace(new RegExp(old, 'g'), newSelector);
                updatesCount++;
            }
        });
        
        // 添加新的测试用例
        const newTestCases = `
    test('RAG系统响应质量验证', async ({ page }) => {
      // 测试AI创投专业问题
      await page.fill('[data-testid="chat-input"]', 'OpenAI最新估值是多少');
      await page.click('[data-testid="chat-send"]');
      
      // 等待响应
      await page.waitForSelector('.message-content', { timeout: 10000 });
      
      // 验证响应包含专业内容指示器
      const response = await page.textContent('.svtr-message:last-child .message-content');
      expect(response).toMatch(/(SVTR|知识库|数据显示|据.*分析)/);
    });

    test('多语言切换功能', async ({ page }) => {
      // 测试语言切换
      await page.click('#btnEn');
      await page.waitForTimeout(500);
      
      // 验证界面语言变化
      const inputPlaceholder = await page.getAttribute('[data-testid="chat-input"]', 'placeholder');
      expect(inputPlaceholder).toContain('Ask me anything');
      
      // 切换回中文
      await page.click('#btnZh');
      await page.waitForTimeout(500);
      
      const inputPlaceholderZh = await page.getAttribute('[data-testid="chat-input"]', 'placeholder');
      expect(inputPlaceholderZh).toContain('问我关于');
    });
`;
        
        // 在测试文件末尾添加新测试
        testContent = testContent.replace(
            /}\s*\)\s*;\s*$/,
            `${newTestCases}\n  });\n});`
        );
        
        fs.writeFileSync(testPath, testContent);
        
        console.log(`✅ 测试选择器更新完成: ${updatesCount}个选择器已更新`);
        return { updated: true, updatesCount, newTests: 2 };
    }

    /**
     * 增强错误处理
     */
    async enhanceErrorHandling() {
        console.log('🛡️ 增强错误处理机制...');
        
        const errorHandlerCode = `/**
 * 增强版错误处理器
 * 提供全面的错误监控、报告和恢复机制
 */

class EnhancedErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 50;
        this.reportEndpoint = '/api/errors';
        
        this.initializeGlobalHandlers();
    }

    initializeGlobalHandlers() {
        // 捕获未处理的Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(new Error(event.reason), {
                type: 'unhandledrejection',
                promise: true
            });
        });

        // 捕获JavaScript运行时错误
        window.addEventListener('error', (event) => {
            this.handleError(event.error || new Error(event.message), {
                type: 'javascript',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // 捕获网络请求错误
        this.interceptFetchErrors();
    }

    handleError(error, context = {}) {
        // 过滤掉Chrome扩展错误
        if (this.isExtensionError(error, context)) {
            return;
        }

        const errorReport = {
            message: error.message,
            stack: error.stack,
            context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        this.queueError(errorReport);
        
        // 对于关键错误，立即发送
        if (this.isCriticalError(error)) {
            this.sendErrorsImmediately();
        }
    }

    isExtensionError(error, context) {
        const errorText = String(error.message || '');
        const filename = context.filename || '';
        
        return errorText.includes('all-frames.js') ||
               errorText.includes('Could not establish connection') ||
               filename.includes('chrome-extension://') ||
               filename.includes('all-frames.js');
    }

    isCriticalError(error) {
        const criticalPatterns = [
            /Cannot read propert/i,
            /is not a function/i,
            /Network.*failed/i,
            /API.*error/i
        ];
        
        return criticalPatterns.some(pattern => 
            pattern.test(error.message)
        );
    }

    queueError(errorReport) {
        this.errorQueue.push(errorReport);
        
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift(); // 移除最旧的错误
        }
        
        // 定期发送错误批次
        this.scheduleErrorSending();
    }

    scheduleErrorSending() {
        if (this.sendTimeout) return;
        
        this.sendTimeout = setTimeout(() => {
            this.sendErrorBatch();
            this.sendTimeout = null;
        }, 5000); // 5秒后发送批次
    }

    async sendErrorBatch() {
        if (this.errorQueue.length === 0) return;
        
        const errors = [...this.errorQueue];
        this.errorQueue = [];
        
        try {
            await fetch(this.reportEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ errors })
            });
            
            console.log(\`📊 错误报告已发送: \${errors.length}个错误\`);
        } catch (e) {
            // 发送失败时重新加入队列
            this.errorQueue.unshift(...errors);
            console.warn('错误报告发送失败，已重新加入队列');
        }
    }

    async sendErrorsImmediately() {
        await this.sendErrorBatch();
    }

    interceptFetchErrors() {
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
            try {
                const response = await originalFetch.apply(this, args);
                
                if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                }
                
                return response;
            } catch (error) {
                // 记录网络错误
                window.errorHandler?.handleError(error, {
                    type: 'network',
                    url: args[0],
                    options: args[1]
                });
                
                throw error;
            }
        };
    }

    getSessionId() {
        let sessionId = localStorage.getItem('error_session_id');
        if (!sessionId) {
            sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
            localStorage.setItem('error_session_id', sessionId);
        }
        return sessionId;
    }

    // 公共API
    reportCustomError(message, details = {}) {
        this.handleError(new Error(message), {
            type: 'custom',
            details
        });
    }

    // 性能监控
    reportPerformanceIssue(metric, value, threshold) {
        if (value > threshold) {
            this.reportCustomError(\`性能指标超阈值: \${metric}\`, {
                metric,
                value,
                threshold,
                type: 'performance'
            });
        }
    }
}

// 全局初始化
if (typeof window !== 'undefined') {
    window.errorHandler = new EnhancedErrorHandler();
}

export default EnhancedErrorHandler;
`;
        
        const errorHandlerPath = 'assets/js/enhanced-error-handler.js';
        fs.writeFileSync(path.join(this.projectRoot, errorHandlerPath), errorHandlerCode);
        
        console.log('✅ 增强错误处理器创建完成');
        return { created: true, file: errorHandlerPath };
    }

    /**
     * 优化图片加载
     */
    async optimizeImageLoading() {
        console.log('🖼️ 优化图片加载策略...');
        
        const lazyLoadingCode = `/**
 * 智能图片懒加载和优化
 */

class ImageOptimizer {
    constructor() {
        this.observer = null;
        this.loadedImages = new Set();
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            // 降级处理
            this.loadAllImages();
        }
        
        this.setupImageErrorHandling();
        this.preloadCriticalImages();
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });

        // 观察所有懒加载图片
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.observer.observe(img);
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.loadedImages.has(src)) return;

        img.src = src;
        img.classList.add('loading');
        
        img.onload = () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            this.loadedImages.add(src);
        };

        img.onerror = () => {
            img.classList.remove('loading');
            img.classList.add('error');
            this.handleImageError(img);
        };
    }

    handleImageError(img) {
        // WebP降级到原格式
        if (img.src.includes('.webp')) {
            const fallbackSrc = img.src.replace('.webp', '.jpg');
            img.src = fallbackSrc;
            return;
        }
        
        // AVIF降级到WebP
        if (img.src.includes('.avif')) {
            const fallbackSrc = img.src.replace('.avif', '.webp');
            img.src = fallbackSrc;
            return;
        }
        
        // 最终降级到占位符
        img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">图片加载失败</text></svg>';
    }

    setupImageErrorHandling() {
        // 全局图片错误处理
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    preloadCriticalImages() {
        // 预加载关键图片
        const criticalImages = [
            'assets/images/logo.avif',
            'assets/images/logo.webp', 
            'assets/images/banner.avif',
            'assets/images/banner.webp'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // 动态添加图片时调用
    observeNewImages() {
        if (this.observer) {
            document.querySelectorAll('img[data-src]:not(.observed)').forEach(img => {
                img.classList.add('observed');
                this.observer.observe(img);
            });
        }
    }
}

// 全局初始化
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        window.imageOptimizer = new ImageOptimizer();
    });
}

export default ImageOptimizer;
`;
        
        const imagePath = 'assets/js/image-optimizer-enhanced.js';
        fs.writeFileSync(path.join(this.projectRoot, imagePath), lazyLoadingCode);
        
        console.log('✅ 图片加载优化完成');
        return { created: true, file: imagePath };
    }

    /**
     * 改善无障碍访问
     */
    async improveAccessibility() {
        console.log('♿ 改善无障碍访问...');
        
        const accessibilityEnhancer = `/**
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
            link.setAttribute('aria-label', \`\${link.textContent} (在新窗口打开)\`);
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
                    this.announceLiveUpdate(\`新消息: \${lastMessage.textContent.substring(0, 100)}\`);
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
        focusStyle.textContent = \`
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
        \`;
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
`;
        
        const a11yPath = 'assets/js/accessibility-enhancer.js';
        fs.writeFileSync(path.join(this.projectRoot, a11yPath), accessibilityEnhancer);
        
        console.log('✅ 无障碍访问改善完成');
        return { created: true, file: a11yPath };
    }

    /**
     * 生成优化报告
     */
    async generateOptimizationReport() {
        const report = {
            ...this.report,
            endTime: new Date(),
            summary: {
                totalTasks: this.report.tasks.length,
                completedTasks: this.report.tasks.filter(t => t.status === 'completed').length,
                failedTasks: this.report.tasks.filter(t => t.status === 'failed').length,
                duration: (new Date() - this.report.startTime) / 1000
            },
            recommendations: [
                '运行新创建的构建脚本: ./scripts/build-optimized.sh',
                '执行更新后的E2E测试: npm run test:e2e',
                '验证无障碍访问: 使用屏幕阅读器测试',
                '检查性能改进: 运行Lighthouse审计',
                '更新HTML引用新的增强脚本'
            ]
        };

        const reportPath = 'logs/code-quality-optimization-report.json';
        const reportDir = path.dirname(reportPath);
        
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 优化报告已生成: ${reportPath}`);
        console.log('\n🎯 下一步行动:');
        report.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        
        return report;
    }
}

// 执行优化
if (require.main === module) {
    const optimizer = new CodeQualityOptimizer();
    optimizer.runOptimization().catch(console.error);
}

module.exports = CodeQualityOptimizer;