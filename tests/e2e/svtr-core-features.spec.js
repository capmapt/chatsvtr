const { test, expect } = require('@playwright/test');

/**
 * SVTR核心功能E2E测试套件
 * 覆盖：聊天系统、数据同步、性能监控
 */

test.describe('SVTR Core Features', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('AI聊天系统测试', () => {
    
    test('聊天界面加载和基本交互', async ({ page }) => {
      // 检查聊天组件是否正确加载
      await expect(page.locator('.svtr-chat-container')).toBeVisible();
      await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="chat-send"]')).toBeVisible();
      
      // 测试输入框功能
      await page.fill('[data-testid="chat-input"]', '测试消息');
      await expect(page.locator('[data-testid="chat-input"]')).toHaveValue('测试消息');
    });

    test('RAG系统响应质量检查', async ({ page }) => {
      // 发送AI创投相关问题
      const testQuestions = [
        '什么是AI独角兽公司？',
        '硅谷最新的AI投资趋势',
        '创投行业的投资轮次有哪些？'
      ];

      for (const question of testQuestions) {
        await page.fill('[data-testid="chat-input"]', question);
        await page.click('[data-testid="chat-send"]');
        
        // 等待响应
        await page.waitForSelector('.message.assistant', { timeout: 10000 });
        
        // 检查响应质量
        const response = await page.locator('.message.assistant').last().textContent();
        expect(response.length).toBeGreaterThan(50); // 响应应该有实质内容
        expect(response).not.toContain('Error'); // 不应该有错误信息
        
        // 检查是否包含相关关键词
        const keywords = ['AI', '创投', '投资', '公司', '技术'];
        const hasRelevantKeyword = keywords.some(keyword => response.includes(keyword));
        expect(hasRelevantKeyword).toBeTruthy();
      }
    });

    test('流式响应和打字机效果', async ({ page }) => {
      await page.fill('[data-testid="chat-input"]', '请介绍一下SVTR的服务');
      await page.click('[data-testid="chat-send"]');
      
      // 检查打字机效果
      await page.waitForSelector('.message.assistant .typing-cursor', { timeout: 3000 });
      
      // 等待响应完成
      await page.waitForFunction(() => {
        const messages = document.querySelectorAll('.message.assistant');
        const lastMessage = messages[messages.length - 1];
        return !lastMessage.querySelector('.typing-cursor');
      }, { timeout: 15000 });
    });

    test('聊天历史记录管理', async ({ page }) => {
      // 发送多条消息
      const messages = ['第一条消息', '第二条消息', '第三条消息'];
      
      for (const message of messages) {
        await page.fill('[data-testid="chat-input"]', message);
        await page.click('[data-testid="chat-send"]');
        await page.waitForSelector('.message.user', { timeout: 5000 });
      }
      
      // 检查消息数量
      const userMessages = await page.locator('.message.user').count();
      expect(userMessages).toBe(messages.length);
      
      // 检查清除按钮功能
      if (await page.locator('#clear-chat').isVisible()) {
        await page.click('#clear-chat');
        await expect(page.locator('.message')).toHaveCount(0);
      }
    });
  });

  test.describe('数据同步功能测试', () => {
    
    test('AI周报数据加载', async ({ page }) => {
      await page.goto('/pages/ai-weekly.html');
      await page.waitForLoadState('networkidle');
      
      // 检查周报列表是否加载
      await expect(page.locator('.weekly-item')).toHaveCount.toBeGreaterThan(0);
      
      // 检查数据完整性
      const firstItem = page.locator('.weekly-item').first();
      await expect(firstItem.locator('.weekly-title')).toBeVisible();
      await expect(firstItem.locator('.weekly-date')).toBeVisible();
    });

    test('交易精选数据展示', async ({ page }) => {
      await page.goto('/pages/trading-picks.html');
      await page.waitForLoadState('networkidle');
      
      // 检查交易数据是否正确加载
      await expect(page.locator('.trading-item')).toHaveCount.toBeGreaterThan(0);
      
      // 检查数据格式
      const firstTrade = page.locator('.trading-item').first();
      await expect(firstTrade.locator('.company-name')).toBeVisible();
      await expect(firstTrade.locator('.trade-amount')).toBeVisible();
    });

    test('数据实时更新检查', async ({ page }) => {
      // 记录初始数据时间戳
      const initialTimestamp = await page.evaluate(() => {
        return window.localStorage.getItem('lastDataUpdate');
      });
      
      // 模拟数据更新（如果有相关功能）
      if (await page.locator('[data-testid="refresh-data"]').isVisible()) {
        await page.click('[data-testid="refresh-data"]');
        await page.waitForTimeout(2000);
        
        const newTimestamp = await page.evaluate(() => {
          return window.localStorage.getItem('lastDataUpdate');
        });
        
        expect(newTimestamp).not.toBe(initialTimestamp);
      }
    });
  });

  test.describe('性能和用户体验测试', () => {
    
    test('页面加载性能检查', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // 页面应该在3秒内加载完成
      expect(loadTime).toBeLessThan(3000);
      
      // 检查关键资源是否正确加载
      await expect(page.locator('link[href*="style-optimized.css"]')).toHaveCount(1);
      await expect(page.locator('script[src*="main-optimized.js"]')).toHaveCount(1);
    });

    test('移动端响应式设计', async ({ page }) => {
      // 模拟移动设备
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // 检查移动端布局
      await expect(page.locator('.sidebar')).toHaveCSS('display', /none|flex/);
      await expect(page.locator('.svtr-chat-container')).toBeVisible();
      
      // 检查触摸友好的按钮尺寸
      const sendButton = page.locator('[data-testid="chat-send"]');
      const buttonBox = await sendButton.boundingBox();
      expect(buttonBox.height).toBeGreaterThan(44); // iOS推荐最小触摸目标
    });

    test('无障碍性检查', async ({ page }) => {
      await page.goto('/');
      
      // 检查关键元素的无障碍属性
      await expect(page.locator('[data-testid="chat-input"]')).toHaveAttribute('aria-label');
      await expect(page.locator('[data-testid="chat-send"]')).toHaveAttribute('aria-label');
      
      // 检查语义化标签
      await expect(page.locator('main')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      
      // 检查键盘导航
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement);
    });

    test('缓存和资源优化验证', async ({ page }) => {
      // 检查Gzip压缩资源是否正确加载
      const response = await page.goto('/');
      expect(response.status()).toBe(200);
      
      // 检查关键CSS是否内联
      const inlineStyles = await page.locator('style').count();
      expect(inlineStyles).toBeGreaterThan(0);
      
      // 检查WebP图片支持
      const images = await page.locator('img').all();
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && src.includes('.webp')) {
          await expect(img).toBeVisible();
        }
      }
    });
  });

  test.describe('错误处理和恢复', () => {
    
    test('网络错误处理', async ({ page }) => {
      // 模拟网络离线
      await page.context().setOffline(true);
      
      await page.fill('[data-testid="chat-input"]', '测试离线消息');
      await page.click('[data-testid="chat-send"]');
      
      // 应该显示错误提示
      await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
      
      // 恢复网络
      await page.context().setOffline(false);
    });

    test('API故障降级处理', async ({ page }) => {
      // 拦截API请求，模拟失败
      await page.route('/functions/api/chat', route => {
        route.fulfill({
          status: 500,
          body: 'Server Error'
        });
      });
      
      await page.fill('[data-testid="chat-input"]', '测试API故障');
      await page.click('[data-testid="chat-send"]');
      
      // 应该显示友好的错误信息或启用演示模式
      await page.waitForSelector('.message.assistant', { timeout: 10000 });
      const response = await page.locator('.message.assistant').last().textContent();
      expect(response).toContain(['演示模式', '暂时无法', '稍后重试'].some(text => 
        response.includes(text)
      ));
    });

    test('数据加载失败恢复', async ({ page }) => {
      // 拦截数据文件请求
      await page.route('**/assets/data/**', route => {
        route.fulfill({
          status: 404,
          body: 'Not Found'
        });
      });
      
      await page.goto('/pages/ai-weekly.html');
      
      // 应该显示加载错误信息
      await expect(page.locator('.loading-error, .no-data')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('AI功能增强测试', () => {
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
  });
});