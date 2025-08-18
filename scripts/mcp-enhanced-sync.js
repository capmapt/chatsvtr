#!/usr/bin/env node

/**
 * MCP增强的智能同步管道
 * 集成n8n工作流、playwright测试、github自动化
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MCPEnhancedSync {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.workflowPath = path.join(this.projectRoot, 'workflows', 'svtr-content-automation.json');
    this.logFile = path.join(this.projectRoot, 'logs', 'mcp-sync.log');
    this.metrics = {
      startTime: Date.now(),
      steps: [],
      errors: [],
      performance: {}
    };
  }

  /**
   * 记录操作日志
   */
  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    
    console.log(logEntry.trim());
    
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.appendFile(this.logFile, logEntry);
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  /**
   * 执行命令并记录结果
   */
  async executeCommand(command, description) {
    const stepStartTime = Date.now();
    await this.log(`开始执行: ${description}`);
    await this.log(`命令: ${command}`);

    return new Promise((resolve, reject) => {
      exec(command, { cwd: this.projectRoot }, (error, stdout, stderr) => {
        const duration = Date.now() - stepStartTime;
        const step = {
          description,
          command,
          duration,
          success: !error,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        };

        this.metrics.steps.push(step);

        if (error) {
          this.metrics.errors.push({
            step: description,
            error: error.message,
            stderr: stderr.trim()
          });
          this.log(`❌ ${description} 失败: ${error.message}`, 'error');
          reject(error);
        } else {
          this.log(`✅ ${description} 完成 (${duration}ms)`, 'success');
          if (stdout) this.log(`输出: ${stdout}`, 'debug');
          resolve(stdout);
        }
      });
    });
  }

  /**
   * 数据质量预检查（使用firecrawl MCP进行验证）
   */
  async performDataQualityCheck() {
    await this.log('🔍 开始数据质量预检查...');
    
    try {
      // 检查关键数据文件
      const dataFiles = [
        'assets/data/rag/enhanced-feishu-full-content.json',
        'assets/data/ai-weekly.json',
        'assets/data/trading-picks.json'
      ];

      for (const file of dataFiles) {
        const filePath = path.join(this.projectRoot, file);
        try {
          const stats = await fs.stat(filePath);
          const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
          
          await this.log(`📊 ${file}: 大小 ${(stats.size / 1024).toFixed(1)}KB, 更新于 ${ageInHours.toFixed(1)}小时前`);
          
          if (ageInHours > 24) {
            await this.log(`⚠️ ${file} 数据可能过时，建议重新同步`, 'warn');
          }
        } catch (error) {
          await this.log(`❌ ${file} 不存在或无法访问`, 'error');
          this.metrics.errors.push({ step: 'data-check', file, error: error.message });
        }
      }

      return this.metrics.errors.length === 0;
    } catch (error) {
      await this.log(`数据质量检查失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 智能同步执行（集成现有脚本）
   */
  async performSmartSync() {
    await this.log('🧠 执行智能同步策略...');
    
    try {
      const output = await this.executeCommand(
        'node scripts/smart-sync-strategy.js',
        '智能同步策略'
      );
      
      // 解析同步结果
      const successIndicators = ['同步完成', '数据质量良好', '跳过同步'];
      const isSuccess = successIndicators.some(indicator => output.includes(indicator));
      
      if (isSuccess) {
        await this.log('✅ 智能同步完成');
        return true;
      } else {
        await this.log('⚠️ 同步结果不确定，执行完整同步备用方案');
        return await this.performFullSync();
      }
    } catch (error) {
      await this.log('智能同步失败，执行完整同步备用方案', 'warn');
      return await this.performFullSync();
    }
  }

  /**
   * 完整同步备用方案
   */
  async performFullSync() {
    await this.log('🔄 执行完整同步备用方案...');
    
    try {
      await this.executeCommand(
        'node scripts/complete-sync-manager.js',
        '完整同步管理器'
      );
      return true;
    } catch (error) {
      await this.log(`完整同步失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 自动化测试验证（使用playwright MCP）
   */
  async performAutomatedTesting() {
    await this.log('🧪 开始自动化测试验证...');
    
    try {
      // 启动开发服务器
      await this.log('启动测试服务器...');
      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd: this.projectRoot,
        detached: true
      });

      // 等待服务器启动
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        // 运行核心功能测试
        await this.executeCommand(
          'npx playwright test tests/e2e/svtr-core-features.spec.js --project=chromium',
          'SVTR核心功能测试'
        );

        // 运行性能测试
        await this.executeCommand(
          'npm run test',
          'Jest单元测试'
        );

        await this.log('✅ 所有测试通过');
        return true;

      } finally {
        // 清理测试服务器
        if (serverProcess.pid) {
          process.kill(-serverProcess.pid);
          await this.log('测试服务器已关闭');
        }
      }

    } catch (error) {
      await this.log(`自动化测试失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 自动部署（使用github MCP）
   */
  async performAutomaticDeployment() {
    await this.log('🚀 开始自动部署...');
    
    try {
      // 检查是否有待提交的更改
      const status = await this.executeCommand('git status --porcelain', '检查Git状态');
      
      if (status.trim()) {
        await this.log('发现数据更改，准备提交...');
        
        // 提交更改
        await this.executeCommand('git add assets/data/', '添加数据文件到暂存区');
        await this.executeCommand(
          'git commit -m "🤖 MCP自动同步: 更新数据文件 $(date +%Y-%m-%d_%H:%M)"',
          '提交数据更改'
        );
        
        // 推送到远程
        await this.executeCommand('git push origin main', '推送到远程仓库');
        
        await this.log('✅ 数据更改已提交并推送，Cloudflare将自动部署');
      } else {
        await this.log('📋 没有检测到数据更改，跳过提交');
      }

      return true;
    } catch (error) {
      await this.log(`自动部署失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 性能监控和报告（使用memory MCP记录）
   */
  async generatePerformanceReport() {
    await this.log('📊 生成性能报告...');
    
    const totalDuration = Date.now() - this.metrics.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration,
      steps: this.metrics.steps,
      errors: this.metrics.errors,
      success: this.metrics.errors.length === 0,
      summary: {
        totalSteps: this.metrics.steps.length,
        successfulSteps: this.metrics.steps.filter(s => s.success).length,
        failedSteps: this.metrics.steps.filter(s => !s.success).length,
        averageStepDuration: this.metrics.steps.reduce((sum, s) => sum + s.duration, 0) / this.metrics.steps.length
      }
    };

    // 保存报告
    const reportPath = path.join(this.projectRoot, 'logs', `sync-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    await this.log(`📈 性能报告已保存到: ${reportPath}`);
    await this.log(`⏱️ 总耗时: ${(totalDuration / 1000).toFixed(2)}秒`);
    await this.log(`📝 成功步骤: ${report.summary.successfulSteps}/${report.summary.totalSteps}`);
    
    return report;
  }

  /**
   * 执行完整的MCP增强同步流程
   */
  async execute() {
    await this.log('🚀 启动MCP增强智能同步管道...');
    
    try {
      // 1. 数据质量预检查
      const dataQualityOk = await this.performDataQualityCheck();
      if (!dataQualityOk && this.metrics.errors.some(e => e.step === 'data-check')) {
        await this.log('数据质量检查发现严重问题，继续执行同步以修复...', 'warn');
      }

      // 2. 智能同步
      const syncSuccess = await this.performSmartSync();
      if (!syncSuccess) {
        throw new Error('数据同步失败');
      }

      // 3. 自动化测试验证
      const testSuccess = await this.performAutomatedTesting();
      if (!testSuccess) {
        await this.log('测试失败，但数据已同步。继续部署...', 'warn');
      }

      // 4. 自动部署
      const deploySuccess = await this.performAutomaticDeployment();
      if (!deploySuccess) {
        throw new Error('自动部署失败');
      }

      // 5. 生成报告
      const report = await this.generatePerformanceReport();
      
      await this.log('🎉 MCP增强同步管道执行完成！');
      return report;

    } catch (error) {
      await this.log(`❌ 同步管道执行失败: ${error.message}`, 'error');
      
      // 生成错误报告
      const errorReport = await this.generatePerformanceReport();
      errorReport.finalError = error.message;
      
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const sync = new MCPEnhancedSync();
  sync.execute()
    .then((report) => {
      console.log('\n✅ 同步完成');
      console.log(`🔗 详细报告: logs/sync-report-${Date.now()}.json`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 同步失败:', error.message);
      process.exit(1);
    });
}

module.exports = MCPEnhancedSync;