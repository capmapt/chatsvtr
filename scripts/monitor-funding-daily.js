#!/usr/bin/env node
/**
 * AI创投日报监控脚本
 * 实时监控创投日报功能状态，及时发现和报告问题
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class FundingDailyMonitor {
  constructor() {
    this.baseUrl = 'https://svtr.ai';
    this.backupUrl = 'https://c1e7b62c.chatsvtr.pages.dev';
    this.monitorData = {
      lastCheck: null,
      issues: [],
      history: []
    };
    this.monitorFile = path.join(__dirname, '../.monitor/funding-daily-status.json');
  }

  /**
   * 开始监控
   */
  async startMonitoring() {
    console.log('🔍 开始监控AI创投日报功能状态...\n');

    try {
      // 创建监控目录
      const monitorDir = path.dirname(this.monitorFile);
      if (!fs.existsSync(monitorDir)) {
        fs.mkdirSync(monitorDir, { recursive: true });
      }

      // 加载历史监控数据
      this.loadMonitorData();

      // 执行全面检查
      const results = await this.performFullCheck();

      // 保存监控结果
      this.saveMonitorData(results);

      // 生成监控报告
      this.generateReport(results);

      // GitHub Actions 环境下的容错处理
      if (process.env.GITHUB_ACTIONS === 'true') {
        if (results.overall === 'critical') {
          console.log('\n🚨 发现严重问题，但在GitHub Actions环境下继续执行修复流程');
          return false; // 触发修复
        } else if (results.overall === 'degraded' || results.overall === 'warning') {
          console.log('\n⚠️  发现部分问题，但系统基本可用');
          return false; // 触发修复，但不阻止流程
        } else {
          return true; // 系统健康
        }
      }

      return results.overall === 'healthy';

    } catch (error) {
      console.error('❌ 监控过程出错:', error.message);

      // GitHub Actions 环境下提供详细错误信息
      if (process.env.GITHUB_ACTIONS === 'true') {
        console.log('🔍 监控错误详情:');
        console.log(`   错误类型: ${error.name || 'Unknown'}`);
        console.log(`   错误消息: ${error.message}`);
        if (error.stack) {
          console.log(`   调用栈: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
        }
        console.log('🔄 将继续执行自动修复流程...');
      }

      return false;
    }
  }

  /**
   * 执行全面检查
   */
  async performFullCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      checks: {},
      issues: [],
      recommendations: []
    };

    console.log('📋 执行功能检查清单:\n');

    // 1. 页面加载检查
    console.log('1. 📄 检查页面基本加载...');
    results.checks.pageLoad = await this.checkPageLoad();

    // 2. API数据检查
    console.log('2. 🔗 检查API数据接口...');
    results.checks.apiData = await this.checkApiData();

    // 3. 关键功能检查
    console.log('3. ⚙️ 检查关键功能完整性...');
    results.checks.features = await this.checkCriticalFeatures();

    // 4. 样式完整性检查
    console.log('4. 🎨 检查样式文件完整性...');
    results.checks.styles = await this.checkStyleIntegrity();

    // 5. 性能指标检查
    console.log('5. ⚡ 检查性能指标...');
    results.checks.performance = await this.checkPerformance();

    // 综合评估
    this.evaluateOverallHealth(results);

    return results;
  }

  /**
   * 检查页面加载
   */
  async checkPageLoad() {
    try {
      const startTime = Date.now();

      const content = await this.fetchContent('/');
      const loadTime = Date.now() - startTime;

      if (!content) {
        return { status: 'failed', error: '页面无法加载', loadTime };
      }

      // 检查关键元素
      const hasTitle = content.includes('AI创投日报');
      const hasFundingCards = content.includes('funding-item') || content.includes('funding-card');
      const hasScripts = content.includes('funding-daily.js');

      return {
        status: hasTitle && hasFundingCards && hasScripts ? 'healthy' : 'degraded',
        loadTime,
        elements: { hasTitle, hasFundingCards, hasScripts },
        contentLength: content.length
      };

    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * 检查API数据
   */
  async checkApiData() {
    try {
      const response = await this.fetchJson('/api/wiki-funding-sync');

      if (!response || !response.success) {
        return { status: 'failed', error: 'API返回失败' };
      }

      const dataCount = response.count || 0;
      const hasTeamBackground = response.data && response.data.some(item => item.teamBackground);
      const hasHyperlinks = response.data && response.data.some(item =>
        item.companyWebsite || item.contactInfo
      );

      return {
        status: dataCount > 0 ? 'healthy' : 'degraded',
        dataCount,
        features: { hasTeamBackground, hasHyperlinks },
        lastUpdate: response.lastUpdate
      };

    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * 检查关键功能
   */
  async checkCriticalFeatures() {
    try {
      // 检查funding-daily.js脚本
      const scriptContent = await this.fetchContent('/assets/js/funding-daily.js');

      if (!scriptContent) {
        return { status: 'failed', error: '核心脚本文件缺失' };
      }

      // 检查关键功能标识
      const features = {
        cardFlip: scriptContent.includes('flipCard') && scriptContent.includes('rotateY'),
        teamBackground: scriptContent.includes('teamBackground') && scriptContent.includes('团队背景'),
        hyperlinks: scriptContent.includes('addLinksToTeamBackground'),
        companyNames: scriptContent.includes('companyName'),
        founderLinks: scriptContent.includes('founder')
      };

      const healthyFeatures = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;

      return {
        status: healthyFeatures >= totalFeatures * 0.8 ? 'healthy' : 'degraded',
        features,
        coverage: `${healthyFeatures}/${totalFeatures}`
      };

    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * 检查样式完整性
   */
  async checkStyleIntegrity() {
    try {
      const cssContent = await this.fetchContent('/assets/css/funding-cards.css');

      if (!cssContent) {
        return { status: 'failed', error: 'CSS文件缺失' };
      }

      // 检查关键CSS特征
      const features = {
        cardHeight360: cssContent.includes('height: 360px'),
        flipAnimation: cssContent.includes('transform: rotateY(180deg)'),
        transition: cssContent.includes('transition: transform 0.6s'),
        perspective: cssContent.includes('perspective: 1000px'),
        backfaceVisibility: cssContent.includes('backface-visibility: hidden')
      };

      const healthyFeatures = Object.values(features).filter(Boolean).length;
      const totalFeatures = Object.keys(features).length;

      return {
        status: healthyFeatures >= totalFeatures * 0.8 ? 'healthy' : 'degraded',
        features,
        coverage: `${healthyFeatures}/${totalFeatures}`,
        fileSize: cssContent.length
      };

    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  /**
   * 检查性能指标
   */
  async checkPerformance() {
    const metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      resourceLoadTime: 0
    };

    try {
      // 页面加载性能
      const pageStart = Date.now();
      await this.fetchContent('/');
      metrics.pageLoadTime = Date.now() - pageStart;

      // API响应性能
      const apiStart = Date.now();
      await this.fetchJson('/api/wiki-funding-sync');
      metrics.apiResponseTime = Date.now() - apiStart;

      // 资源加载性能
      const resourceStart = Date.now();
      await this.fetchContent('/assets/js/funding-daily.js');
      metrics.resourceLoadTime = Date.now() - resourceStart;

      const status = (
        metrics.pageLoadTime < 3000 &&
        metrics.apiResponseTime < 2000 &&
        metrics.resourceLoadTime < 1000
      ) ? 'healthy' : 'degraded';

      return { status, metrics };

    } catch (error) {
      return { status: 'failed', error: error.message, metrics };
    }
  }

  /**
   * 获取内容
   */
  fetchContent(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;

      const request = https.get(url, {
        timeout: 15000, // 15秒超时
        headers: {
          'User-Agent': 'GitHub-Actions-Health-Check/1.0',
          'Accept': '*/*',
          'Cache-Control': 'no-cache'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            console.log(`⚠️  主URL ${url} 返回 ${res.statusCode}，尝试备用URL...`);

            // 尝试备用URL
            const backupRequest = https.get(`${this.backupUrl}${path}`, {
              timeout: 10000,
              headers: {
                'User-Agent': 'GitHub-Actions-Health-Check-Backup/1.0',
                'Accept': '*/*'
              }
            }, (backupRes) => {
              let backupData = '';
              backupRes.on('data', chunk => backupData += chunk);
              backupRes.on('end', () => {
                if (backupRes.statusCode === 200) {
                  console.log(`✅ 备用URL成功响应`);
                  resolve(backupData);
                } else {
                  reject(new Error(`HTTP ${res.statusCode} (备用: ${backupRes.statusCode}): ${url}`));
                }
              });
            });

            backupRequest.on('error', (backupError) => {
              reject(new Error(`主URL: ${res.statusCode}, 备用URL错误: ${backupError.message}`));
            });

            backupRequest.on('timeout', () => {
              backupRequest.destroy();
              reject(new Error(`主URL: ${res.statusCode}, 备用URL超时`));
            });
          }
        });
      });

      request.on('error', (error) => {
        reject(new Error(`网络错误: ${error.message}`));
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error(`请求超时: ${url}`));
      });
    });
  }

  /**
   * 获取JSON数据
   */
  async fetchJson(path) {
    try {
      const content = await this.fetchContent(path);
      return JSON.parse(content);
    } catch (error) {
      if (error.message.includes('JSON')) {
        throw new Error(`JSON解析失败: ${path} - ${error.message}`);
      } else {
        throw error; // 重新抛出网络错误
      }
    }
  }

  /**
   * 评估整体健康状态
   */
  evaluateOverallHealth(results) {
    const checks = Object.values(results.checks);
    const failedChecks = checks.filter(check => check.status === 'failed');
    const degradedChecks = checks.filter(check => check.status === 'degraded');

    if (failedChecks.length > 0) {
      results.overall = 'critical';
      results.issues.push(`${failedChecks.length} 项关键功能失败`);
      results.recommendations.push('立即执行紧急修复流程');
    } else if (degradedChecks.length > 1) {
      results.overall = 'degraded';
      results.issues.push(`${degradedChecks.length} 项功能降级`);
      results.recommendations.push('建议执行完整重新部署');
    } else if (degradedChecks.length === 1) {
      results.overall = 'warning';
      results.issues.push('1 项功能降级');
      results.recommendations.push('监控功能状态，考虑主动修复');
    }

    // 添加具体建议
    if (results.checks.styles && results.checks.styles.status !== 'healthy') {
      results.recommendations.push('运行: npm run deploy:force');
    }
    if (results.checks.apiData && results.checks.apiData.status !== 'healthy') {
      results.recommendations.push('运行: npm run safe:sync');
    }
  }

  /**
   * 生成监控报告
   */
  generateReport(results) {
    console.log('\n📊 AI创投日报监控报告');
    console.log('='.repeat(60));

    // 总体状态
    const statusIcon = {
      'healthy': '🟢',
      'warning': '🟡',
      'degraded': '🟠',
      'critical': '🔴'
    }[results.overall] || '❓';

    console.log(`整体状态: ${statusIcon} ${results.overall.toUpperCase()}`);
    console.log(`检查时间: ${new Date(results.timestamp).toLocaleString()}`);

    // 各项检查结果
    console.log('\n📋 详细检查结果:');
    Object.entries(results.checks).forEach(([name, result]) => {
      const icon = {
        'healthy': '✅',
        'degraded': '⚠️',
        'failed': '❌'
      }[result.status] || '❓';

      console.log(`  ${icon} ${name}: ${result.status}`);

      if (result.error) {
        console.log(`     错误: ${result.error}`);
      }
    });

    // 问题和建议
    if (results.issues.length > 0) {
      console.log('\n⚠️ 发现的问题:');
      results.issues.forEach(issue => console.log(`  • ${issue}`));
    }

    if (results.recommendations.length > 0) {
      console.log('\n🔧 修复建议:');
      results.recommendations.forEach(rec => console.log(`  • ${rec}`));
    }

    console.log('\n' + '='.repeat(60));

    // 紧急情况处理
    if (results.overall === 'critical') {
      console.log('🚨 检测到关键问题，建议立即处理！');
      console.log('\n🆘 紧急修复流程:');
      console.log('1. npm run emergency:restore');
      console.log('2. npm run health:check');
      console.log('3. 如问题持续，请联系技术团队');
    }
  }

  /**
   * 加载监控数据
   */
  loadMonitorData() {
    if (fs.existsSync(this.monitorFile)) {
      try {
        this.monitorData = JSON.parse(fs.readFileSync(this.monitorFile, 'utf8'));
      } catch (error) {
        console.warn('⚠️ 无法加载监控历史数据:', error.message);
      }
    }
  }

  /**
   * 保存监控数据
   */
  saveMonitorData(results) {
    try {
      this.monitorData.lastCheck = results.timestamp;
      this.monitorData.history.unshift({
        timestamp: results.timestamp,
        overall: results.overall,
        issues: results.issues.length
      });

      // 只保留最近50条记录
      this.monitorData.history = this.monitorData.history.slice(0, 50);

      fs.writeFileSync(this.monitorFile, JSON.stringify(this.monitorData, null, 2));
    } catch (error) {
      console.warn('⚠️ 无法保存监控数据:', error.message);
    }
  }
}

// 主函数
async function main() {
  console.log('🔍 AI创投日报功能监控系统\n');

  try {
    const monitor = new FundingDailyMonitor();
    const isHealthy = await monitor.startMonitoring();

    if (isHealthy) {
      console.log('\n🎉 AI创投日报功能状态正常！');
      process.exit(0);
    } else {
      console.log('\n⚠️ AI创投日报功能存在问题，需要关注！');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 监控系统出错:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = FundingDailyMonitor;