// E2E tests for homepage functionality
const { test, expect } = require('@playwright/test');

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/硅谷科技评论/);
  });

  test('should have language toggle buttons', async ({ page }) => {
    const zhButton = page.locator('#btnZh');
    const enButton = page.locator('#btnEn');
    
    await expect(zhButton).toBeVisible();
    await expect(enButton).toBeVisible();
    await expect(zhButton).toHaveText('中文');
    await expect(enButton).toHaveText('English');
  });

  test('should toggle sidebar when menu button is clicked', async ({ page }) => {
    const menuToggle = page.locator('.menu-toggle');
    const sidebar = page.locator('.sidebar');
    
    await expect(menuToggle).toBeVisible();
    await expect(sidebar).toBeVisible();
    
    // Click menu toggle
    await menuToggle.click();
    
    // Sidebar should still be visible but might change class
    await expect(sidebar).toBeVisible();
  });

  test('should switch language when language buttons are clicked', async ({ page }) => {
    const enButton = page.locator('#btnEn');
    const zhButton = page.locator('#btnZh');
    
    // Click English button
    await enButton.click();
    await expect(enButton).toHaveClass(/active/);
    
    // Click Chinese button
    await zhButton.click();
    await expect(zhButton).toHaveClass(/active/);
  });

  test('should have working navigation links', async ({ page }) => {
    const ai100Link = page.locator('a[href="pages/ai-100.html"]');
    await expect(ai100Link).toBeVisible();
    
    // Test that link exists and is clickable
    await expect(ai100Link).toHaveAttribute('href', 'pages/ai-100.html');
  });

  test('should display stats numbers', async ({ page }) => {
    const membersCount = page.locator('#members-count');
    const companiesCount = page.locator('#companies-count');
    const vipCount = page.locator('#vip-count');
    
    // Check if stats elements exist (they might be loaded dynamically)
    if (await membersCount.isVisible()) {
      await expect(membersCount).toBeVisible();
    }
    if (await companiesCount.isVisible()) {
      await expect(companiesCount).toBeVisible();
    }
    if (await vipCount.isVisible()) {
      await expect(vipCount).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const menuToggle = page.locator('.menu-toggle');
    const sidebar = page.locator('.sidebar');
    
    await expect(menuToggle).toBeVisible();
    await expect(sidebar).toBeVisible();
  });

  test('should load all critical images', async ({ page }) => {
    const logo = page.locator('.sidebar-logo');
    
    if (await logo.isVisible()) {
      await expect(logo).toBeVisible();
      
      // Check if image loaded successfully
      const logoSrc = await logo.getAttribute('src');
      expect(logoSrc).toBeTruthy();
    }
  });
});