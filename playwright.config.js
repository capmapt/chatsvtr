// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // 减少重试次数
  workers: process.env.CI ? 2 : undefined, // 增加并行worker
  reporter: process.env.CI ? 'line' : 'html', // CI中使用简化报告
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure', // 只在失败时保留trace
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // 只在失败时保留视频
  },

  projects: [
    // 快速模式：只运行Chrome桌面版
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 完整模式：在main分支或手动触发时运行所有浏览器
    ...(process.env.CI && process.env.GITHUB_REF === 'refs/heads/main' ? [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
    ] : []),
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000, // 30秒超时
  },
});