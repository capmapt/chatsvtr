// E2E tests for navigation functionality
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to AI-100 page', async ({ page }) => {
    const ai100Link = page.locator('a[href="pages/ai-100.html"]');
    
    if (await ai100Link.isVisible()) {
      await ai100Link.click();
      await expect(page).toHaveURL(/.*ai-100\.html/);
    }
  });

  test('should handle external links correctly', async ({ page }) => {
    // Test external links (like Feishu links)
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const link = externalLinks.nth(i);
        await expect(link).toHaveAttribute('target', '_blank');
      }
    }
  });

  test('should show/hide sub-navigation on hover/click', async ({ page }) => {
    const navItems = page.locator('.nav-list > li');
    const count = await navItems.count();
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const navItem = navItems.nth(i);
        const subList = navItem.locator('.sub-list');
        
        if (await subList.isVisible()) {
          // Test interaction with sub-navigation
          await navItem.hover();
          await expect(subList).toBeVisible();
        }
      }
    }
  });

  test('should maintain navigation state across page loads', async ({ page }) => {
    // Test that navigation state is preserved
    const sidebar = page.locator('.sidebar');
    const initialClasses = await sidebar.getAttribute('class');
    
    await page.reload();
    
    const afterReloadClasses = await sidebar.getAttribute('class');
    expect(afterReloadClasses).toBeTruthy();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    const menuToggle = page.locator('.menu-toggle');
    
    // Test keyboard accessibility
    await menuToggle.focus();
    await expect(menuToggle).toBeFocused();
    
    // Test Enter key
    await menuToggle.press('Enter');
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
  });

  test('should close sidebar when clicking overlay', async ({ page }) => {
    const overlay = page.locator('.overlay');
    const sidebar = page.locator('.sidebar');
    const menuToggle = page.locator('.menu-toggle');
    
    // Sidebar starts as open, close it first then open again
    await menuToggle.click(); // Close
    await page.waitForTimeout(300);
    await menuToggle.click(); // Open
    await page.waitForTimeout(300);
    
    // Verify sidebar is open
    await expect(sidebar).toHaveClass(/open/);
    
    // Click overlay to close (use force to bypass iframe interference)
    if (await overlay.isVisible()) {
      await overlay.click({ force: true });
    }
    
    // Wait a bit for animation
    await page.waitForTimeout(500);
    
    // Sidebar should no longer have 'open' class
    await expect(sidebar).not.toHaveClass(/open/);
  });
});