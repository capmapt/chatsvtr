#!/usr/bin/env node

/**
 * MCP集成的性能监控和报告系统
 * 使用memory MCP记录长期趋势，playwright进行性能测试
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MCPPerformanceMonitor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.metricsDir = path.join(this.projectRoot, 'metrics');
    this.reportsDir = path.join(this.projectRoot, 'reports');
    this.currentSession = {
      id: `session-${Date.now()}`,
      startTime: Date.now(),
      metrics: {
        build: {},
        runtime: {},
        quality: {},
        mcp: {}
      }
    };
  }

  /**
   * 初始化监控环境
   */
  async initialize() {
    await fs.mkdir(this.metricsDir, { recursive: true });
    await fs.mkdir(this.reportsDir, { recursive: true });
    
    console.log('🔧 性能监控系统初始化完成');
    console.log(`📊 会话ID: ${this.currentSession.id}`);
  }

  /**
   * 执行命令并收集性能指标
   */
  async executeWithMetrics(command, description, category = 'general') {
    const startTime = Date.now();
    console.log(`⏱️ 开始: ${description}`);

    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.projectRoot }, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;
        const metric = {
          command,
          description,
          duration,
          success: !error,
          timestamp: new Date().toISOString(),
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          memoryUsage: process.memoryUsage()
        };

        // 按类别存储指标
        if (!this.currentSession.metrics[category]) {
          this.currentSession.metrics[category] = [];
        }
        this.currentSession.metrics[category].push(metric);

        if (error) {
          console.log(`❌ ${description} 失败 (${duration}ms): ${error.message}`);
          reject(error);
        } else {
          console.log(`✅ ${description} 完成 (${duration}ms)`);
          resolve(stdout);
        }
      });
    });
  }

  /**
   * 收集构建性能指标
   */
  async collectBuildMetrics() {
    console.log('\n📦 收集构建性能指标...');

    try {
      // TypeScript编译性能
      await this.executeWithMetrics(
        'npm run build',
        'TypeScript编译',
        'build'
      );

      // 资源优化性能
      await this.executeWithMetrics(
        'npm run optimize:assets',
        '资源压缩优化',
        'build'
      );

      // Gzip压缩性能
      await this.executeWithMetrics(
        'npm run optimize:gzip',
        'Gzip压缩',
        'build'
      );

      // 计算优化效果
      const optimizationSummary = await this.executeWithMetrics(
        'npm run optimize:summary',
        '优化效果统计',
        'build'
      );

      // 解析优化数据
      const buildMetrics = this.currentSession.metrics.build;
      const totalBuildTime = buildMetrics.reduce((sum, m) => sum + m.duration, 0);
      
      console.log(`📈 构建总耗时: ${(totalBuildTime / 1000).toFixed(2)}秒`);

    } catch (error) {
      console.error('构建性能指标收集失败:', error.message);
    }
  }

  /**
   * 收集运行时性能指标（使用Playwright）
   */
  async collectRuntimeMetrics() {
    console.log('\n🚀 收集运行时性能指标...');

    try {
      // 启动测试服务器
      console.log('启动性能测试服务器...');
      const serverProcess = await this.startTestServer();

      // 等待服务器就绪
      await this.waitForServer('http://localhost:3000');

      try {
        // Lighthouse性能评分（如果可用）
        try {
          await this.executeWithMetrics(
            'npx lighthouse http://localhost:3000 --only-categories=performance --chrome-flags="--headless" --output=json --output-path=./metrics/lighthouse-performance.json',
            'Lighthouse性能评分',
            'runtime'
          );
        } catch (error) {
          console.log('⚠️ Lighthouse不可用，跳过性能评分');
        }

        // Playwright性能测试
        await this.runPlaywrightPerformanceTests();

        // 内存使用情况
        await this.collectMemoryMetrics();

        // 网络性能
        await this.collectNetworkMetrics();

      } finally {
        // 清理测试服务器
        if (serverProcess) {
          process.kill(serverProcess.pid);
          console.log('测试服务器已关闭');
        }
      }

    } catch (error) {
      console.error('运行时性能指标收集失败:', error.message);
    }
  }

  /**
   * 使用Playwright进行性能测试
   */
  async runPlaywrightPerformanceTests() {
    const performanceTestScript = `
      const { chromium } = require('playwright');
      
      (async () => {
        const browser = await chromium.launch();
        const page = await browser.newPage();
        
        // 监听性能指标
        const metrics = [];
        
        page.on('metrics', metric => metrics.push(metric));
        
        // 记录时间
        const startTime = Date.now();
        
        // 导航到页面
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        
        // 获取Web Vitals
        const vitals = await page.evaluate(() => {
          return new Promise((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntries();
              const vitals = {};
              
              entries.forEach(entry => {
                if (entry.entryType === 'largest-contentful-paint') {
                  vitals.LCP = entry.startTime;
                }
                if (entry.entryType === 'first-input') {
                  vitals.FID = entry.processingStart - entry.startTime;
                }
                if (entry.entryType === 'layout-shift') {
                  vitals.CLS = entry.value;
                }
              });
              
              resolve(vitals);
            }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
            
            // 超时保护
            setTimeout(() => resolve({}), 5000);
          });
        });
        
        // 测试聊天功能性能
        const chatStartTime = Date.now();
        await page.fill('#user-input', '性能测试消息');
        await page.click('#send-button');
        await page.waitForSelector('.message.assistant', { timeout: 10000 });
        const chatResponseTime = Date.now() - chatStartTime;
        
        const results = {
          loadTime,
          chatResponseTime,
          vitals,
          timestamp: new Date().toISOString()
        };
        
        console.log(JSON.stringify(results, null, 2));
        
        await browser.close();
      })();
    `;

    // 写入临时测试脚本
    const scriptPath = path.join(this.metricsDir, 'perf-test.js');
    await fs.writeFile(scriptPath, performanceTestScript);

    try {
      const output = await this.executeWithMetrics(
        `node ${scriptPath}`,
        'Playwright性能测试',
        'runtime'
      );

      // 解析性能结果
      const results = JSON.parse(output);
      
      console.log(`📊 页面加载时间: ${results.loadTime}ms`);
      console.log(`💬 聊天响应时间: ${results.chatResponseTime}ms`);
      
      if (results.vitals.LCP) {
        console.log(`🎯 LCP: ${results.vitals.LCP.toFixed(2)}ms`);
      }

      // 存储详细结果
      await fs.writeFile(
        path.join(this.metricsDir, 'runtime-performance.json'),
        JSON.stringify(results, null, 2)
      );

    } finally {
      // 清理临时脚本
      try {
        await fs.unlink(scriptPath);
      } catch (error) {
        // 忽略清理错误
      }
    }
  }

  /**
   * 收集内存使用指标
   */
  async collectMemoryMetrics() {
    const memoryUsage = process.memoryUsage();
    
    this.currentSession.metrics.runtime.push({
      type: 'memory',
      timestamp: new Date().toISOString(),
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    });

    console.log(`💾 内存使用: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * 收集网络性能指标
   */
  async collectNetworkMetrics() {
    try {
      // 测试关键资源加载时间
      const curlTests = [
        { url: 'http://localhost:3000/', description: '首页' },
        { url: 'http://localhost:3000/assets/css/style-optimized.css', description: 'CSS' },
        { url: 'http://localhost:3000/assets/js/main-optimized.js', description: 'JavaScript' }
      ];

      for (const test of curlTests) {
        try {
          await this.executeWithMetrics(
            `curl -o /dev/null -s -w "%{time_total}" ${test.url}`,
            `网络延迟测试: ${test.description}`,
            'runtime'
          );
        } catch (error) {
          console.log(`⚠️ ${test.description} 网络测试失败`);
        }
      }
    } catch (error) {
      console.log('⚠️ 网络性能测试跳过');
    }
  }

  /**
   * 收集代码质量指标
   */
  async collectQualityMetrics() {
    console.log('\n🔍 收集代码质量指标...');

    try {
      // ESLint代码质量检查
      await this.executeWithMetrics(
        'npm run lint',
        'ESLint代码检查',
        'quality'
      );

      // Jest测试覆盖率
      await this.executeWithMetrics(
        'npm run test -- --coverage --silent',
        'Jest测试覆盖率',
        'quality'
      );

      // HTML验证
      await this.executeWithMetrics(
        'npm run validate:html',
        'HTML标准验证',
        'quality'
      );

      // E2E测试
      await this.executeWithMetrics(
        'npm run test:e2e',
        'E2E测试',
        'quality'
      );

    } catch (error) {
      console.error('代码质量指标收集失败:', error.message);
    }
  }

  /**
   * 收集MCP工具性能指标
   */
  async collectMCPMetrics() {
    console.log('\n🔧 收集MCP工具性能指标...');

    try {
      // 检查MCP连接状态
      const mcpStatus = await this.executeWithMetrics(
        'claude mcp list',
        'MCP连接状态检查',
        'mcp'
      );

      // 解析MCP状态
      const connectedMCPs = (mcpStatus.match(/✓ Connected/g) || []).length;
      const failedMCPs = (mcpStatus.match(/✗ Failed/g) || []).length;

      console.log(`🔗 MCP连接: ${connectedMCPs}个成功, ${failedMCPs}个失败`);

      // 测试n8n MCP功能
      if (connectedMCPs > 0) {
        this.currentSession.metrics.mcp.push({
          type: 'connection_status',
          connected: connectedMCPs,
          failed: failedMCPs,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('MCP性能指标收集失败:', error.message);
    }
  }

  /**
   * 生成综合性能报告
   */
  async generateComprehensiveReport() {
    console.log('\n📊 生成综合性能报告...');

    const sessionDuration = Date.now() - this.currentSession.startTime;
    
    // 计算关键指标
    const buildMetrics = this.currentSession.metrics.build || [];
    const runtimeMetrics = this.currentSession.metrics.runtime || [];
    const qualityMetrics = this.currentSession.metrics.quality || [];
    const mcpMetrics = this.currentSession.metrics.mcp || [];

    const report = {
      session: this.currentSession.id,
      timestamp: new Date().toISOString(),
      duration: sessionDuration,
      summary: {
        totalOperations: buildMetrics.length + runtimeMetrics.length + qualityMetrics.length,
        successfulOperations: [...buildMetrics, ...runtimeMetrics, ...qualityMetrics].filter(m => m.success).length,
        averageDuration: [...buildMetrics, ...runtimeMetrics, ...qualityMetrics]
          .reduce((sum, m) => sum + (m.duration || 0), 0) / 
          [...buildMetrics, ...runtimeMetrics, ...qualityMetrics].length
      },
      categories: {
        build: {
          operations: buildMetrics.length,
          totalTime: buildMetrics.reduce((sum, m) => sum + (m.duration || 0), 0),
          successRate: buildMetrics.filter(m => m.success).length / Math.max(buildMetrics.length, 1) * 100
        },
        runtime: {
          operations: runtimeMetrics.length,
          performanceScore: runtimeMetrics.length > 0 ? 'Measured' : 'Not Available'
        },
        quality: {
          operations: qualityMetrics.length,
          passRate: qualityMetrics.filter(m => m.success).length / Math.max(qualityMetrics.length, 1) * 100
        },
        mcp: {
          operations: mcpMetrics.length,
          status: mcpMetrics.length > 0 ? 'Active' : 'Not Tested'
        }
      },
      recommendations: this.generateRecommendations(),
      rawMetrics: this.currentSession.metrics
    };

    // 保存报告
    const reportPath = path.join(this.reportsDir, `performance-report-${this.currentSession.id}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // 生成人类可读的摘要
    const summaryPath = path.join(this.reportsDir, `performance-summary-${this.currentSession.id}.md`);
    const summary = this.generateMarkdownSummary(report);
    await fs.writeFile(summaryPath, summary);

    console.log(`📄 详细报告: ${reportPath}`);
    console.log(`📝 报告摘要: ${summaryPath}`);
    console.log(`⏱️ 总耗时: ${(sessionDuration / 1000).toFixed(2)}秒`);

    return report;
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = [];
    const metrics = this.currentSession.metrics;

    // 构建性能建议
    const buildMetrics = metrics.build || [];
    const slowBuilds = buildMetrics.filter(m => m.duration > 10000);
    if (slowBuilds.length > 0) {
      recommendations.push({
        category: 'build',
        priority: 'medium',
        issue: '构建时间较长',
        suggestion: '考虑并行化构建或优化TypeScript配置'
      });
    }

    // 质量建议
    const qualityMetrics = metrics.quality || [];
    const failedQuality = qualityMetrics.filter(m => !m.success);
    if (failedQuality.length > 0) {
      recommendations.push({
        category: 'quality',
        priority: 'high',
        issue: '代码质量检查失败',
        suggestion: '修复ESLint错误和测试失败问题'
      });
    }

    // MCP建议
    const mcpMetrics = metrics.mcp || [];
    if (mcpMetrics.length === 0) {
      recommendations.push({
        category: 'mcp',
        priority: 'low',
        issue: 'MCP工具未充分利用',
        suggestion: '考虑在工作流中集成更多MCP自动化功能'
      });
    }

    return recommendations;
  }

  /**
   * 生成Markdown格式的报告摘要
   */
  generateMarkdownSummary(report) {
    return `# SVTR性能监控报告

## 会话信息
- **会话ID**: ${report.session}
- **时间**: ${report.timestamp}
- **总耗时**: ${(report.duration / 1000).toFixed(2)}秒

## 性能概览
- **总操作数**: ${report.summary.totalOperations}
- **成功率**: ${((report.summary.successfulOperations / report.summary.totalOperations) * 100).toFixed(1)}%
- **平均耗时**: ${report.summary.averageDuration.toFixed(0)}ms

## 分类详情

### 🔨 构建性能
- 操作数: ${report.categories.build.operations}
- 总耗时: ${(report.categories.build.totalTime / 1000).toFixed(2)}秒
- 成功率: ${report.categories.build.successRate.toFixed(1)}%

### 🚀 运行时性能
- 性能测试: ${report.categories.runtime.performanceScore}
- 操作数: ${report.categories.runtime.operations}

### 🔍 代码质量
- 质量检查: ${report.categories.quality.operations}个
- 通过率: ${report.categories.quality.passRate.toFixed(1)}%

### 🔧 MCP工具
- 状态: ${report.categories.mcp.status}
- 活动数: ${report.categories.mcp.operations}

## 优化建议

${report.recommendations.map(rec => `
### ${rec.category.toUpperCase()} - ${rec.priority.toUpperCase()}
**问题**: ${rec.issue}  
**建议**: ${rec.suggestion}
`).join('\n')}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
  }

  /**
   * 启动测试服务器
   */
  async startTestServer() {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      serverProcess.stdout.on('data', (data) => {
        if (data.toString().includes('localhost:3000')) {
          resolve(serverProcess);
        }
      });

      setTimeout(() => {
        resolve(serverProcess);
      }, 8000);
    });
  }

  /**
   * 等待服务器就绪
   */
  async waitForServer(url, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await this.executeWithMetrics(
          `curl -f ${url} > /dev/null`,
          `服务器连通性检查 (${i + 1}/${maxAttempts})`,
          'runtime'
        );
        console.log('✅ 服务器就绪');
        return;
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error('服务器启动超时');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * 执行完整的性能监控流程
   */
  async execute() {
    await this.initialize();

    try {
      await this.collectBuildMetrics();
      await this.collectRuntimeMetrics();
      await this.collectQualityMetrics();
      await this.collectMCPMetrics();

      const report = await this.generateComprehensiveReport();
      
      console.log('\n🎉 性能监控完成！');
      return report;

    } catch (error) {
      console.error('\n❌ 性能监控失败:', error.message);
      
      // 即使失败也生成部分报告
      const partialReport = await this.generateComprehensiveReport();
      partialReport.error = error.message;
      
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const monitor = new MCPPerformanceMonitor();
  monitor.execute()
    .then((report) => {
      console.log('\n📊 监控报告生成完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 监控执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = MCPPerformanceMonitor;