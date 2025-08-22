#!/usr/bin/env node

/**
 * SQLite MCP连接测试脚本
 * 验证数据库连接和基本操作
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SQLiteMCPTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.dbPath = path.join(this.projectRoot, 'database', 'svtr.db');
    this.initSqlPath = path.join(this.projectRoot, 'database', 'init.sql');
  }

  /**
   * 检查MCP连接状态
   */
  async checkMCPConnection() {
    console.log('🔍 检查SQLite MCP连接状态...');
    
    return new Promise((resolve) => {
      exec('claude mcp list | grep sqlite', (error, stdout, stderr) => {
        if (error) {
          console.log('❌ MCP连接检查失败:', error.message);
          resolve(false);
        } else {
          const isConnected = stdout.includes('✓ Connected');
          if (isConnected) {
            console.log('✅ SQLite MCP连接正常');
            console.log(`📋 ${stdout.trim()}`);
          } else {
            console.log('❌ SQLite MCP连接失败');
            console.log(`📋 ${stdout.trim()}`);
          }
          resolve(isConnected);
        }
      });
    });
  }

  /**
   * 检查数据库文件状态
   */
  async checkDatabaseFile() {
    console.log('\n📊 检查数据库文件状态...');
    
    try {
      const stats = await fs.stat(this.dbPath);
      console.log(`✅ 数据库文件存在: ${this.dbPath}`);
      console.log(`📏 文件大小: ${stats.size} 字节`);
      console.log(`📅 最后修改: ${stats.mtime.toISOString()}`);
      
      return true;
    } catch (error) {
      console.log(`❌ 数据库文件不存在: ${this.dbPath}`);
      return false;
    }
  }

  /**
   * 尝试直接连接数据库（如果有sqlite3）
   */
  async testDirectConnection() {
    console.log('\n🔧 尝试直接数据库连接...');
    
    return new Promise((resolve) => {
      exec('which sqlite3', (error) => {
        if (error) {
          console.log('ℹ️ sqlite3命令行工具未安装，跳过直接连接测试');
          resolve(false);
        } else {
          // 测试基本SQL查询
          exec(`sqlite3 "${this.dbPath}" "SELECT 'Database accessible' as status;"`, (queryError, stdout) => {
            if (queryError) {
              console.log('❌ 直接数据库连接失败:', queryError.message);
              resolve(false);
            } else {
              console.log('✅ 直接数据库连接成功');
              console.log(`📋 查询结果: ${stdout.trim()}`);
              resolve(true);
            }
          });
        }
      });
    });
  }

  /**
   * 初始化数据库表结构
   */
  async initializeDatabaseSchema() {
    console.log('\n🏗️ 初始化数据库表结构...');
    
    try {
      // 检查init.sql文件是否存在
      const initSQL = await fs.readFile(this.initSqlPath, 'utf8');
      console.log('✅ 找到初始化SQL脚本');
      console.log(`📏 脚本大小: ${initSQL.length} 字符`);
      
      // 尝试使用sqlite3执行初始化
      return new Promise((resolve) => {
        exec('which sqlite3', async (error) => {
          if (error) {
            console.log('⚠️ 无sqlite3命令，数据库表结构需要通过MCP手动初始化');
            console.log('💡 建议: 安装sqlite3 或使用MCP工具执行SQL');
            resolve(false);
          } else {
            exec(`sqlite3 "${this.dbPath}" < "${this.initSqlPath}"`, (initError, stdout, stderr) => {
              if (initError) {
                console.log('❌ 数据库初始化失败:', initError.message);
                if (stderr) console.log('错误详情:', stderr);
                resolve(false);
              } else {
                console.log('✅ 数据库表结构初始化成功');
                if (stdout) console.log('输出:', stdout);
                resolve(true);
              }
            });
          }
        });
      });
      
    } catch (error) {
      console.log('❌ 读取初始化脚本失败:', error.message);
      return false;
    }
  }

  /**
   * 检查表结构
   */
  async checkTableStructure() {
    console.log('\n📋 检查数据库表结构...');
    
    return new Promise((resolve) => {
      exec('which sqlite3', (error) => {
        if (error) {
          console.log('ℹ️ 跳过表结构检查（需要sqlite3）');
          resolve(false);
        } else {
          const query = `sqlite3 "${this.dbPath}" ".tables"`;
          exec(query, (queryError, stdout) => {
            if (queryError) {
              console.log('❌ 表结构查询失败:', queryError.message);
              resolve(false);
            } else {
              const tables = stdout.trim();
              if (tables) {
                console.log('✅ 发现数据库表:');
                tables.split(/\s+/).forEach(table => {
                  console.log(`  📊 ${table}`);
                });
                resolve(true);
              } else {
                console.log('⚠️ 数据库中没有表，需要运行初始化');
                resolve(false);
              }
            }
          });
        }
      });
    });
  }

  /**
   * 生成故障排除建议
   */
  generateTroubleshootingGuide(results) {
    console.log('\n🛠️ 故障排除指南:');
    
    if (!results.fileExists) {
      console.log('❌ 数据库文件问题:');
      console.log('  解决方案: npm run database:init');
    }
    
    if (!results.mcpConnected) {
      console.log('❌ MCP连接问题:');
      console.log('  1. 检查包名是否正确');
      console.log('  2. 重新配置: claude mcp remove sqlite && claude mcp add sqlite "npx -y mcp-server-sqlite-npx /path/to/db"');
      console.log('  3. 检查npx权限和网络连接');
    }
    
    if (!results.hasSchema) {
      console.log('❌ 数据库表结构问题:');
      console.log('  1. 安装sqlite3: sudo apt-get install sqlite3');
      console.log('  2. 手动初始化: sqlite3 database/svtr.db < database/init.sql');
      console.log('  3. 或通过MCP工具执行SQL脚本');
    }
    
    console.log('\n📞 进一步帮助:');
    console.log('  📁 数据库配置: npm run database:config');
    console.log('  📊 文件状态: npm run database:status');
    console.log('  🔄 重新初始化: npm run database:init');
  }

  /**
   * 生成使用建议
   */
  generateUsageGuide() {
    console.log('\n💡 SQLite MCP使用建议:');
    console.log('');
    console.log('🎯 基本操作:');
    console.log('  • 查询用户: SELECT * FROM users;');
    console.log('  • 插入访问记录: INSERT INTO page_visits (page_path) VALUES ("/");');
    console.log('  • 查看配置: SELECT * FROM system_config;');
    console.log('');
    console.log('📊 预设表结构:');
    console.log('  • users - 用户管理');
    console.log('  • chat_history - 聊天记录');
    console.log('  • page_visits - 访问统计');
    console.log('  • sync_logs - 同步日志');
    console.log('  • ai_venture_cache - AI创投数据');
    console.log('');
    console.log('🔧 管理命令:');
    console.log('  • npm run database:status - 检查状态');
    console.log('  • npm run database:backup - 创建备份');
    console.log('  • npm run database:config - 查看配置');
  }

  /**
   * 执行完整测试
   */
  async runCompleteTest() {
    console.log('🚀 开始SQLite MCP完整测试...\n');
    
    const results = {
      mcpConnected: false,
      fileExists: false,
      directConnection: false,
      schemaInitialized: false,
      hasSchema: false
    };
    
    try {
      // 1. 检查MCP连接
      results.mcpConnected = await this.checkMCPConnection();
      
      // 2. 检查数据库文件
      results.fileExists = await this.checkDatabaseFile();
      
      // 3. 测试直接连接
      results.directConnection = await this.testDirectConnection();
      
      // 4. 初始化数据库（如果需要）
      if (results.fileExists && results.directConnection) {
        results.schemaInitialized = await this.initializeDatabaseSchema();
        results.hasSchema = await this.checkTableStructure();
      }
      
      // 5. 生成报告
      console.log('\n📋 测试结果汇总:');
      console.log(`  🔗 MCP连接: ${results.mcpConnected ? '✅' : '❌'}`);
      console.log(`  📁 数据库文件: ${results.fileExists ? '✅' : '❌'}`);
      console.log(`  🔧 直接连接: ${results.directConnection ? '✅' : '❌'}`);
      console.log(`  🏗️ 表结构: ${results.hasSchema ? '✅' : '❌'}`);
      
      // 6. 生成建议
      if (!results.mcpConnected || !results.fileExists || !results.hasSchema) {
        this.generateTroubleshootingGuide(results);
      } else {
        console.log('\n🎉 SQLite MCP配置完成！');
        this.generateUsageGuide();
      }
      
      return results;
      
    } catch (error) {
      console.error('\n❌ 测试过程中发生错误:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const tester = new SQLiteMCPTester();
  tester.runCompleteTest()
    .then((results) => {
      const success = results.fileExists && (results.mcpConnected || results.directConnection);
      console.log(`\n${success ? '✅' : '❌'} SQLite MCP测试完成`);
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ 测试失败:', error.message);
      process.exit(1);
    });
}

module.exports = SQLiteMCPTester;