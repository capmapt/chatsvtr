#!/usr/bin/env node

/**
 * 自动同步调度器
 * 设置定期自动同步飞书知识库数据
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class AutoSyncScheduler {
  constructor() {
    this.configFile = path.join(__dirname, '../config/sync-schedule.json');
    this.logFile = path.join(__dirname, '../logs/sync-scheduler.log');
    this.pidFile = path.join(__dirname, '../.sync-scheduler.pid');
  }

  /**
   * 启动定期同步调度器
   */
  async startScheduler(options = {}) {
    const config = {
      enabled: true,
      schedule: {
        daily: '02:00',           // 每天凌晨2点
        hourly: false,           // 不开启每小时同步
        onStartup: true,         // 启动时同步一次
        webhookTrigger: true     // 支持webhook触发
      },
      syncType: 'smart',         // smart | complete | enhanced
      maxRetries: 3,
      timeout: 600000,          // 10分钟超时
      ...options
    };

    console.log('🤖 启动自动同步调度器...');
    
    try {
      // 保存配置
      await this.saveConfig(config);
      
      // 保存PID
      await fs.writeFile(this.pidFile, process.pid.toString());
      
      // 启动时同步
      if (config.schedule.onStartup) {
        console.log('🚀 执行启动时同步...');
        await this.executSync(config.syncType);
      }
      
      // 设置定时任务
      this.setupDailySync(config);
      
      // 设置优雅退出
      this.setupGracefulShutdown();
      
      console.log('✅ 自动同步调度器已启动');
      console.log(`📅 每日同步时间: ${config.schedule.daily}`);
      console.log(`🔧 同步类型: ${config.syncType}`);
      console.log(`📝 日志文件: ${this.logFile}`);
      
      // 保持进程运行
      this.keepAlive();
      
    } catch (error) {
      console.error('❌ 调度器启动失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 设置每日同步
   */
  setupDailySync(config) {
    const [hour, minute] = config.schedule.daily.split(':').map(Number);
    
    const scheduleNextSync = () => {
      const now = new Date();
      const nextSync = new Date();
      nextSync.setHours(hour, minute, 0, 0);
      
      // 如果今天的时间已过，设置为明天
      if (nextSync <= now) {
        nextSync.setDate(nextSync.getDate() + 1);
      }
      
      const timeUntilSync = nextSync.getTime() - now.getTime();
      
      this.log(`⏰ 下次同步时间: ${nextSync.toLocaleString()}`);
      
      setTimeout(async () => {
        try {
          this.log('🔄 执行定时同步...');
          await this.executSync(config.syncType);
          
          // 递归安排下次同步
          scheduleNextSync();
          
        } catch (error) {
          this.log(`❌ 定时同步失败: ${error.message}`);
          
          // 1小时后重试
          setTimeout(() => scheduleNextSync(), 3600000);
        }
      }, timeUntilSync);
    };
    
    scheduleNextSync();
  }

  /**
   * 执行同步
   */
  async executSync(syncType = 'smart', retryCount = 0) {
    const maxRetries = 3;
    
    try {
      this.log(`🔄 开始同步 (类型: ${syncType}, 重试: ${retryCount}/${maxRetries})`);
      
      const scriptMap = {
        'smart': 'smart-sync-strategy.js',
        'complete': 'complete-sync-manager.js', 
        'enhanced': 'enhanced-feishu-sync-v2.js'
      };
      
      const scriptPath = path.join(__dirname, scriptMap[syncType]);
      
      await new Promise((resolve, reject) => {
        const child = spawn('node', [scriptPath], {
          cwd: path.dirname(__dirname),
          stdio: 'pipe'
        });
        
        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
          output += data.toString();
        });
        
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error('同步超时'));
        }, 600000); // 10分钟
        
        child.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            this.log('✅ 同步完成');
            resolve();
          } else {
            reject(new Error(`同步失败，退出码: ${code}`));
          }
        });
        
        child.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      // 验证同步结果
      await this.verifySyncResult();
      
    } catch (error) {
      this.log(`❌ 同步失败: ${error.message}`);
      
      if (retryCount < maxRetries) {
        this.log(`🔄 ${5 * (retryCount + 1)} 分钟后重试...`);
        setTimeout(() => {
          this.executSync(syncType, retryCount + 1);
        }, 5 * 60 * 1000 * (retryCount + 1)); // 递增延迟
      } else {
        this.log('❌ 达到最大重试次数，同步失败');
        // 发送告警（如果配置了）
        await this.sendAlert('同步失败', error.message);
      }
    }
  }

  /**
   * 验证同步结果
   */
  async verifySyncResult() {
    try {
      const { spawn } = require('child_process');
      
      await new Promise((resolve, reject) => {
        const child = spawn('node', [path.join(__dirname, 'quick-sync-test.js')], {
          stdio: 'pipe'
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            this.log('✅ 同步验证通过');
            resolve();
          } else {
            reject(new Error('同步验证失败'));
          }
        });
        
        child.on('error', reject);
      });
      
    } catch (error) {
      throw new Error(`同步验证失败: ${error.message}`);
    }
  }

  /**
   * 停止调度器
   */
  async stopScheduler() {
    console.log('🛑 停止自动同步调度器...');
    
    try {
      // 删除PID文件
      await fs.unlink(this.pidFile).catch(() => {});
      
      this.log('🛑 调度器已停止');
      process.exit(0);
      
    } catch (error) {
      console.error('❌ 停止调度器失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 检查调度器状态
   */
  async checkStatus() {
    try {
      const pidContent = await fs.readFile(this.pidFile, 'utf8');
      const pid = parseInt(pidContent.trim());
      
      // 检查进程是否存在
      try {
        process.kill(pid, 0); // 不发送信号，只检查进程
        console.log(`✅ 调度器运行中 (PID: ${pid})`);
        
        // 读取配置
        const config = await this.loadConfig();
        console.log(`📅 每日同步时间: ${config.schedule?.daily || '未设置'}`);
        
        // 读取最近日志
        try {
          const logContent = await fs.readFile(this.logFile, 'utf8');
          const recentLogs = logContent.split('\n').slice(-5).join('\n');
          console.log('\n📝 最近日志:');
          console.log(recentLogs);
        } catch (e) {
          console.log('📝 暂无日志记录');
        }
        
        return true;
      } catch (e) {
        console.log('❌ 调度器未运行');
        await fs.unlink(this.pidFile).catch(() => {});
        return false;
      }
      
    } catch (error) {
      console.log('❌ 调度器未运行');
      return false;
    }
  }

  /**
   * 手动触发同步
   */
  async triggerSync(syncType = 'smart') {
    console.log(`🔄 手动触发同步 (类型: ${syncType})`);
    
    try {
      await this.executSync(syncType);
      console.log('✅ 手动同步完成');
    } catch (error) {
      console.error('❌ 手动同步失败:', error.message);
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(config) {
    const configDir = path.dirname(this.configFile);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
  }

  /**
   * 加载配置
   */
  async loadConfig() {
    try {
      const content = await fs.readFile(this.configFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  /**
   * 写日志
   */
  async log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    console.log(message);
    
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.appendFile(this.logFile, logMessage);
    } catch (error) {
      console.error('写入日志失败:', error.message);
    }
  }

  /**
   * 发送告警
   */
  async sendAlert(title, message) {
    // 这里可以集成邮件、Slack、钉钉等告警方式
    this.log(`🚨 告警: ${title} - ${message}`);
    
    // TODO: 实现实际的告警发送逻辑
    // 比如发送邮件、调用webhook等
  }

  /**
   * 设置优雅退出
   */
  setupGracefulShutdown() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n收到 ${signal} 信号，优雅退出...`);
        await this.stopScheduler();
      });
    });
  }

  /**
   * 保持进程运行
   */
  keepAlive() {
    setInterval(() => {
      // 每小时检查一次配置文件
      this.loadConfig().then(config => {
        if (!config.enabled) {
          console.log('同步已被禁用，停止调度器');
          this.stopScheduler();
        }
      }).catch(() => {});
    }, 3600000);
  }
}

// 主函数
async function main() {
  const scheduler = new AutoSyncScheduler();
  
  const command = process.argv[2];
  const options = process.argv.slice(3);
  
  switch (command) {
    case 'start':
      await scheduler.startScheduler();
      break;
      
    case 'stop':
      await scheduler.stopScheduler();
      break;
      
    case 'status':
      await scheduler.checkStatus();
      break;
      
    case 'trigger':
      const syncType = options[0] || 'smart';
      await scheduler.triggerSync(syncType);
      break;
      
    case 'restart':
      await scheduler.stopScheduler();
      setTimeout(() => scheduler.startScheduler(), 2000);
      break;
      
    default:
      console.log('用法:');
      console.log('  node auto-sync-scheduler.js start   # 启动调度器');
      console.log('  node auto-sync-scheduler.js stop    # 停止调度器');  
      console.log('  node auto-sync-scheduler.js status  # 查看状态');
      console.log('  node auto-sync-scheduler.js trigger [smart|complete|enhanced] # 手动触发');
      console.log('  node auto-sync-scheduler.js restart # 重启调度器');
      break;
  }
}

// 执行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AutoSyncScheduler;