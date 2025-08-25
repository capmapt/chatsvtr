#!/usr/bin/env node

/**
 * RAG同步系统监控脚本
 * 监控同步进程的健康状态、资源使用和错误恢复
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SyncMonitor {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.syncLogFile = path.join(this.logDir, 'cron-sync.log');
    this.monitorLogFile = path.join(this.logDir, 'sync-monitor.log');
    this.pidFile = path.join(this.logDir, 'sync.pid');
    
    // 监控阈值
    this.thresholds = {
      maxMemoryMB: 1024,
      maxDurationMinutes: 15,
      maxConsecutiveFailures: 3
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    console.log(`[${level}] ${message}`);
    
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      fs.appendFileSync(this.monitorLogFile, logMessage);
    } catch (error) {
      console.error('监控日志写入失败:', error.message);
    }
  }

  async getProcessInfo() {
    return new Promise((resolve) => {
      const ps = spawn('ps', ['aux']);
      let output = '';
      
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ps.on('close', () => {
        const processes = output.split('\n')
          .filter(line => line.includes('npm run sync') || line.includes('smart-sync-strategy'))
          .map(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 11) {
              return {
                pid: parts[1],
                cpu: parseFloat(parts[2]),
                memory: parseFloat(parts[3]),
                memoryMB: parseFloat(parts[5]) / 1024,
                command: parts.slice(10).join(' ')
              };
            }
            return null;
          })
          .filter(proc => proc !== null);
        
        resolve(processes);
      });
    });
  }

  async checkSyncHealth() {
    this.log('🔍 开始同步健康检查');
    
    try {
      // 检查运行中的同步进程
      const processes = await this.getProcessInfo();
      
      if (processes.length === 0) {
        this.log('✅ 无运行中的同步进程', 'INFO');
        return { status: 'idle', processes: [] };
      }

      // 检查进程资源使用
      for (const proc of processes) {
        this.log(`📊 进程 ${proc.pid}: CPU ${proc.cpu}%, 内存 ${proc.memoryMB.toFixed(1)}MB`);
        
        if (proc.memoryMB > this.thresholds.maxMemoryMB) {
          this.log(`⚠️ 进程 ${proc.pid} 内存使用超出阈值 (${proc.memoryMB.toFixed(1)}MB > ${this.thresholds.maxMemoryMB}MB)`, 'WARN');
        }
      }

      // 检查PID文件中的进程状态
      if (fs.existsSync(this.pidFile)) {
        const pidContent = fs.readFileSync(this.pidFile, 'utf8').trim();
        const [pid, startTime] = pidContent.split(':');
        
        const runningTime = (Date.now() - parseInt(startTime)) / (1000 * 60);
        
        if (runningTime > this.thresholds.maxDurationMinutes) {
          this.log(`⚠️ 同步进程运行时间过长: ${runningTime.toFixed(1)}分钟 > ${this.thresholds.maxDurationMinutes}分钟`, 'WARN');
          return { 
            status: 'stuck', 
            processes, 
            runningTimeMinutes: runningTime,
            recommendation: 'consider_restart'
          };
        }
      }

      return { status: 'running', processes };
      
    } catch (error) {
      this.log(`❌ 健康检查失败: ${error.message}`, 'ERROR');
      return { status: 'error', error: error.message };
    }
  }

  async checkLogHealth() {
    this.log('📋 检查同步日志');
    
    try {
      if (!fs.existsSync(this.syncLogFile)) {
        this.log('⚠️ 同步日志文件不存在', 'WARN');
        return { status: 'no_log' };
      }

      const logContent = fs.readFileSync(this.syncLogFile, 'utf8');
      const lines = logContent.trim().split('\n');
      const recentLines = lines.slice(-20);

      // 分析最近的错误
      const errors = recentLines.filter(line => 
        line.includes('error') || 
        line.includes('Error') || 
        line.includes('失败') ||
        line.includes('npm error')
      );

      // 检查连续失败次数
      let consecutiveFailures = 0;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes('npm error') || lines[i].includes('失败')) {
          consecutiveFailures++;
        } else if (lines[i].includes('成功') || lines[i].includes('完成')) {
          break;
        }
      }

      this.log(`📊 最近错误数量: ${errors.length}, 连续失败: ${consecutiveFailures}`);

      if (consecutiveFailures >= this.thresholds.maxConsecutiveFailures) {
        this.log(`⚠️ 连续失败次数超出阈值: ${consecutiveFailures} >= ${this.thresholds.maxConsecutiveFailures}`, 'WARN');
        return {
          status: 'frequent_failures',
          consecutiveFailures,
          recentErrors: errors.slice(-5),
          recommendation: 'investigate_errors'
        };
      }

      return {
        status: 'healthy',
        recentErrors: errors.slice(-3),
        consecutiveFailures
      };

    } catch (error) {
      this.log(`❌ 日志检查失败: ${error.message}`, 'ERROR');
      return { status: 'error', error: error.message };
    }
  }

  async generateReport() {
    this.log('📊 生成监控报告');
    
    const processHealth = await this.checkSyncHealth();
    const logHealth = await this.checkLogHealth();
    
    const report = {
      timestamp: new Date().toISOString(),
      process: processHealth,
      logs: logHealth,
      recommendations: []
    };

    // 生成建议
    if (processHealth.status === 'stuck') {
      report.recommendations.push('重启长时间运行的同步进程');
    }
    
    if (logHealth.status === 'frequent_failures') {
      report.recommendations.push('检查飞书API配置和网络连接');
      report.recommendations.push('查看详细错误日志进行调试');
    }

    // 保存报告
    const reportFile = path.join(this.logDir, `sync-health-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`✅ 监控报告已保存: ${reportFile}`);
    
    // 输出摘要
    console.log('\n=== 同步系统健康报告 ===');
    console.log(`进程状态: ${processHealth.status}`);
    console.log(`日志状态: ${logHealth.status}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n建议措施:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    return report;
  }

  async killStuckProcess() {
    this.log('🔄 终止卡住的同步进程');
    
    const processes = await this.getProcessInfo();
    
    for (const proc of processes) {
      try {
        process.kill(parseInt(proc.pid), 'SIGTERM');
        this.log(`✅ 已终止进程 ${proc.pid}`);
        
        // 等待3秒后强制杀死
        setTimeout(() => {
          try {
            process.kill(parseInt(proc.pid), 'SIGKILL');
            this.log(`🔪 强制终止进程 ${proc.pid}`);
          } catch (err) {
            // 进程可能已经退出
          }
        }, 3000);
        
      } catch (error) {
        this.log(`⚠️ 无法终止进程 ${proc.pid}: ${error.message}`, 'WARN');
      }
    }
    
    // 清理PID文件
    if (fs.existsSync(this.pidFile)) {
      fs.unlinkSync(this.pidFile);
      this.log('🧹 已清理PID文件');
    }
  }
}

// 命令行接口
async function main() {
  const monitor = new SyncMonitor();
  const command = process.argv[2];

  switch (command) {
    case 'health':
      await monitor.generateReport();
      break;
      
    case 'kill':
      await monitor.killStuckProcess();
      break;
      
    case 'watch':
      console.log('🔍 启动监控模式 (每30秒检查一次)...');
      setInterval(async () => {
        await monitor.generateReport();
      }, 30000);
      break;
      
    default:
      console.log(`
使用方法: node sync-monitor.js <command>

命令:
  health  - 生成健康检查报告
  kill    - 终止卡住的同步进程
  watch   - 持续监控模式 (每30秒)

示例:
  npm run sync:monitor     # 检查健康状态
  node scripts/sync-monitor.js kill  # 终止卡住的进程
      `);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('监控脚本错误:', error);
    process.exit(1);
  });
}

module.exports = SyncMonitor;