#!/usr/bin/env node

/**
 * 同步监控和告警系统
 * 监控同步状态，发送告警通知
 */

const fs = require('fs').promises;
const path = require('path');

class SyncMonitor {
  constructor() {
    this.ragDir = path.join(__dirname, '../assets/data/rag');
    this.dataFile = path.join(this.ragDir, 'enhanced-feishu-full-content.json');
    this.reportFile = path.join(this.ragDir, 'last-sync-report.json');
    this.configFile = path.join(__dirname, '../config/sync-schedule.json');
    this.alertsFile = path.join(__dirname, '../logs/sync-alerts.json');
  }

  /**
   * 执行完整监控检查
   */
  async runMonitoring() {
    console.log('🔍 开始同步监控检查...\n');

    try {
      const checks = {
        dataFreshness: await this.checkDataFreshness(),
        dataQuality: await this.checkDataQuality(), 
        syncHealth: await this.checkSyncHealth(),
        ragAvailability: await this.checkRAGAvailability()
      };

      const alerts = this.analyzeAndGenerateAlerts(checks);
      
      if (alerts.length > 0) {
        await this.sendAlerts(alerts);
      }

      await this.generateMonitoringReport(checks, alerts);

      console.log('✅ 监控检查完成');
      return { success: true, checks, alerts };

    } catch (error) {
      console.error('❌ 监控检查失败:', error.message);
      await this.sendCriticalAlert('监控系统故障', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 检查数据新鲜度
   */
  async checkDataFreshness() {
    try {
      if (!await this.fileExists(this.dataFile)) {
        return { 
          status: 'critical', 
          message: '数据文件不存在',
          ageHours: Infinity 
        };
      }

      const stats = await fs.stat(this.dataFile);
      const ageMs = Date.now() - stats.mtime.getTime();
      const ageHours = ageMs / (1000 * 60 * 60);

      let status = 'healthy';
      let message = '数据新鲜';

      if (ageHours > 168) { // 7天
        status = 'critical';
        message = '数据严重过期';
      } else if (ageHours > 48) { // 2天
        status = 'warning';
        message = '数据需要更新';
      } else if (ageHours > 24) { // 1天
        status = 'info';
        message = '数据较旧';
      }

      console.log(`📅 数据新鲜度: ${status} - ${message} (${Math.round(ageHours)}小时前)`);

      return {
        status,
        message,
        ageHours: Math.round(ageHours),
        lastModified: stats.mtime.toISOString()
      };

    } catch (error) {
      return {
        status: 'critical',
        message: `检查数据新鲜度失败: ${error.message}`,
        ageHours: Infinity
      };
    }
  }

  /**
   * 检查数据质量
   */
  async checkDataQuality() {
    try {
      if (!await this.fileExists(this.dataFile)) {
        return {
          status: 'critical',
          message: '数据文件不存在',
          metrics: {}
        };
      }

      const data = JSON.parse(await fs.readFile(this.dataFile, 'utf8'));
      
      const totalNodes = data.nodes?.length || 0;
      const validNodes = data.nodes?.filter(n => n.content && n.content.length > 100).length || 0;
      const avgContentLength = data.summary?.avgContentLength || 0;
      const coverage = totalNodes > 0 ? (validNodes / totalNodes * 100) : 0;

      const metrics = {
        totalNodes,
        validNodes,
        coverage: Math.round(coverage * 10) / 10,
        avgContentLength
      };

      let status = 'healthy';
      let message = '数据质量良好';

      if (totalNodes < 200) {
        status = 'critical';
        message = '节点数量严重不足';
      } else if (coverage < 60) {
        status = 'critical'; 
        message = '有效内容覆盖率过低';
      } else if (avgContentLength < 800) {
        status = 'warning';
        message = '平均内容长度偏短';
      } else if (coverage < 80) {
        status = 'warning';
        message = '内容覆盖率需要改善';
      }

      console.log(`📊 数据质量: ${status} - ${message}`);
      console.log(`  节点总数: ${totalNodes}, 有效节点: ${validNodes}`);
      console.log(`  覆盖率: ${metrics.coverage}%, 平均长度: ${avgContentLength}`);

      return { status, message, metrics };

    } catch (error) {
      return {
        status: 'critical',
        message: `检查数据质量失败: ${error.message}`,
        metrics: {}
      };
    }
  }

  /**
   * 检查同步健康状态
   */
  async checkSyncHealth() {
    try {
      // 检查上次同步报告
      if (!await this.fileExists(this.reportFile)) {
        return {
          status: 'warning',
          message: '缺少同步报告',
          lastSync: null
        };
      }

      const report = JSON.parse(await fs.readFile(this.reportFile, 'utf8'));
      const lastSyncTime = new Date(report.syncTime);
      const timeSinceSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60 * 60);

      let status = 'healthy';
      let message = '同步状态正常';

      if (report.syncStatus !== 'success') {
        status = 'critical';
        message = '上次同步失败';
      } else if (timeSinceSync > 72) { // 3天
        status = 'critical';
        message = '同步严重滞后';
      } else if (timeSinceSync > 36) { // 1.5天
        status = 'warning'; 
        message = '同步有所滞后';
      }

      console.log(`💡 同步健康: ${status} - ${message}`);
      console.log(`  上次同步: ${lastSyncTime.toLocaleString()}`);
      console.log(`  同步状态: ${report.syncStatus}`);

      return {
        status,
        message,
        lastSync: lastSyncTime.toISOString(),
        syncStatus: report.syncStatus,
        timeSinceSync: Math.round(timeSinceSync)
      };

    } catch (error) {
      return {
        status: 'warning',
        message: `检查同步健康失败: ${error.message}`,
        lastSync: null
      };
    }
  }

  /**
   * 检查RAG系统可用性
   */
  async checkRAGAvailability() {
    try {
      // 运行RAG集成测试
      const { spawn } = require('child_process');
      
      const testResult = await new Promise((resolve) => {
        const child = spawn('node', [path.join(__dirname, 'rag-integration-test.js')], {
          stdio: 'pipe'
        });

        let output = '';
        child.stdout.on('data', (data) => output += data.toString());
        child.stderr.on('data', (data) => output += data.toString());

        child.on('close', (code) => {
          resolve({
            success: code === 0,
            output: output.substring(output.length - 500) // 最后500字符
          });
        });

        // 30秒超时
        setTimeout(() => {
          child.kill();
          resolve({ success: false, output: 'RAG测试超时' });
        }, 30000);
      });

      let status = testResult.success ? 'healthy' : 'critical';
      let message = testResult.success ? 'RAG系统可用' : 'RAG系统故障';

      console.log(`🧠 RAG可用性: ${status} - ${message}`);

      return {
        status,
        message,
        testResult: testResult.success,
        details: testResult.output
      };

    } catch (error) {
      return {
        status: 'critical',
        message: `RAG可用性检查失败: ${error.message}`,
        testResult: false
      };
    }
  }

  /**
   * 分析并生成告警
   */
  analyzeAndGenerateAlerts(checks) {
    const alerts = [];

    // 检查关键问题
    Object.entries(checks).forEach(([checkName, result]) => {
      if (result.status === 'critical') {
        alerts.push({
          level: 'critical',
          type: checkName,
          message: result.message,
          timestamp: new Date().toISOString(),
          details: result
        });
      } else if (result.status === 'warning') {
        alerts.push({
          level: 'warning', 
          type: checkName,
          message: result.message,
          timestamp: new Date().toISOString(),
          details: result
        });
      }
    });

    // 综合评估
    const criticalCount = alerts.filter(a => a.level === 'critical').length;
    const warningCount = alerts.filter(a => a.level === 'warning').length;

    if (criticalCount > 0) {
      alerts.push({
        level: 'critical',
        type: 'system_health',
        message: `发现${criticalCount}个严重问题，${warningCount}个警告`,
        timestamp: new Date().toISOString(),
        action: 'immediate_attention_required'
      });
    }

    console.log(`\n🚨 告警分析: ${criticalCount}个严重问题, ${warningCount}个警告`);

    return alerts;
  }

  /**
   * 发送告警
   */
  async sendAlerts(alerts) {
    try {
      // 保存告警记录
      await this.saveAlerts(alerts);

      // 发送关键告警通知
      const criticalAlerts = alerts.filter(a => a.level === 'critical');
      
      if (criticalAlerts.length > 0) {
        console.log(`🚨 发送${criticalAlerts.length}个严重告警通知`);
        
        for (const alert of criticalAlerts) {
          await this.sendAlertNotification(alert);
        }
      }

      // 输出告警摘要
      alerts.forEach(alert => {
        const emoji = alert.level === 'critical' ? '🔴' : '🟡';
        console.log(`${emoji} ${alert.type}: ${alert.message}`);
      });

    } catch (error) {
      console.error('❌ 发送告警失败:', error.message);
    }
  }

  /**
   * 发送告警通知
   */
  async sendAlertNotification(alert) {
    // TODO: 实现实际的通知方式
    // 比如：邮件、Slack、钉钉、企业微信等
    
    console.log(`📧 发送告警通知: ${alert.type} - ${alert.message}`);
    
    // 示例：可以调用webhook、发送邮件等
    // await fetch('your-webhook-url', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(alert)
    // });
  }

  /**
   * 发送严重告警
   */
  async sendCriticalAlert(title, message) {
    const alert = {
      level: 'critical',
      type: 'system_failure',
      message: `${title}: ${message}`,
      timestamp: new Date().toISOString()
    };

    await this.sendAlertNotification(alert);
  }

  /**
   * 保存告警记录
   */
  async saveAlerts(alerts) {
    try {
      let existingAlerts = [];
      
      if (await this.fileExists(this.alertsFile)) {
        const content = await fs.readFile(this.alertsFile, 'utf8');
        existingAlerts = JSON.parse(content);
      }

      // 添加新告警，保留最近100条记录
      existingAlerts.push(...alerts);
      existingAlerts = existingAlerts.slice(-100);

      await fs.mkdir(path.dirname(this.alertsFile), { recursive: true });
      await fs.writeFile(this.alertsFile, JSON.stringify(existingAlerts, null, 2));

    } catch (error) {
      console.error('保存告警记录失败:', error.message);
    }
  }

  /**
   * 生成监控报告
   */
  async generateMonitoringReport(checks, alerts) {
    const report = {
      timestamp: new Date().toISOString(),
      overallHealth: this.calculateOverallHealth(checks),
      checks,
      alerts: alerts.length,
      criticalIssues: alerts.filter(a => a.level === 'critical').length,
      warnings: alerts.filter(a => a.level === 'warning').length,
      recommendations: this.generateRecommendations(checks, alerts)
    };

    try {
      const reportPath = path.join(__dirname, '../logs/sync-monitoring-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 监控报告已保存: ${reportPath}`);

    } catch (error) {
      console.error('生成监控报告失败:', error.message);
    }

    return report;
  }

  /**
   * 计算总体健康状态
   */
  calculateOverallHealth(checks) {
    const statuses = Object.values(checks).map(c => c.status);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    if (statuses.includes('info')) return 'info';
    return 'healthy';
  }

  /**
   * 生成建议
   */
  generateRecommendations(checks, alerts) {
    const recommendations = [];

    if (checks.dataFreshness?.status === 'critical') {
      recommendations.push('立即执行数据同步: npm run sync:complete');
    }

    if (checks.dataQuality?.status === 'critical') {
      recommendations.push('检查飞书API权限和数据源完整性');
    }

    if (checks.ragAvailability?.status === 'critical') {
      recommendations.push('检查RAG系统配置和依赖服务');
    }

    if (alerts.filter(a => a.level === 'critical').length > 2) {
      recommendations.push('系统存在多个严重问题，建议进行全面检查');
    }

    return recommendations;
  }

  /**
   * 工具方法：检查文件是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// 主函数
async function main() {
  console.log('🔍 SVTR飞书同步监控系统\n');

  try {
    const monitor = new SyncMonitor();
    const result = await monitor.runMonitoring();

    if (result.success) {
      const health = monitor.calculateOverallHealth(result.checks);
      console.log(`\n🎯 系统总体状态: ${health}`);
      
      if (result.alerts.length === 0) {
        console.log('✅ 所有系统运行正常');
      } else {
        console.log(`⚠️ 发现 ${result.alerts.length} 个问题需要关注`);
      }
      
      process.exit(health === 'critical' ? 1 : 0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 监控系统异常:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = SyncMonitor;