#!/usr/bin/env node

/**
 * 完整同步管理器
 * 确保每次都进行完整的飞书知识库同步
 * 自动处理数据验证、备份和部署
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class CompleteSyncManager {
  constructor() {
    this.timestamp = new Date().toISOString().replace(/[:]/g, '-').slice(0, 19);
    this.backupDir = path.join(__dirname, '../backups/sync');
    this.ragDir = path.join(__dirname, '../assets/data/rag');
  }

  /**
   * 执行完整同步流程
   */
  async executeCompleteSync() {
    console.log('🚀 开始完整同步流程...\n');
    
    try {
      // 步骤1: 创建备份
      await this.createBackup();
      
      // 步骤2: 运行增强版同步
      await this.runEnhancedSync();
      
      // 步骤3: 验证数据质量
      await this.validateSyncResults();
      
      // 步骤4: 更新RAG系统
      await this.updateRAGSystem();
      
      // 步骤5: 生成同步报告
      await this.generateSyncReport();
      
      console.log('\n🎉 完整同步流程成功完成！');
      
    } catch (error) {
      console.error('\n❌ 完整同步失败:', error.message);
      await this.restoreFromBackup();
      throw error;
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup() {
    console.log('📦 创建数据备份...');
    
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // 备份现有RAG数据
      const ragFiles = [
        'enhanced-feishu-full-content.json',
        'real-feishu-content.json', 
        'improved-feishu-knowledge-base.json'
      ];
      
      for (const fileName of ragFiles) {
        try {
          const sourcePath = path.join(this.ragDir, fileName);
          const backupPath = path.join(this.backupDir, `${this.timestamp}-${fileName}`);
          
          await fs.copyFile(sourcePath, backupPath);
          console.log(`✅ 已备份: ${fileName}`);
        } catch (e) {
          console.log(`⚠️ 备份跳过: ${fileName} (文件不存在)`);
        }
      }
      
    } catch (error) {
      console.error('❌ 备份失败:', error.message);
      throw error;
    }
  }

  /**
   * 运行增强版同步
   */
  async runEnhancedSync() {
    console.log('\n🔄 运行增强版飞书同步...');
    
    return new Promise((resolve, reject) => {
      const syncScript = path.join(__dirname, 'enhanced-feishu-sync-v2.js');
      const child = spawn('node', [syncScript], {
        stdio: 'inherit',
        cwd: path.dirname(__dirname)
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ 增强版同步完成');
          resolve();
        } else {
          reject(new Error(`同步进程退出码: ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(new Error(`同步进程错误: ${error.message}`));
      });
    });
  }

  /**
   * 验证同步结果
   */
  async validateSyncResults() {
    console.log('\n🔍 验证同步数据质量...');
    
    try {
      const dataPath = path.join(this.ragDir, 'enhanced-feishu-full-content.json');
      const dataContent = await fs.readFile(dataPath, 'utf8');
      const data = JSON.parse(dataContent);
      
      // 基本结构验证
      if (!data.summary || !data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('数据结构验证失败');
      }
      
      // 数据质量验证
      const nodeCount = data.nodes.length;
      const contentNodes = data.nodes.filter(n => n.content && n.content.length > 50).length;
      const avgContentLength = data.summary.avgContentLength || 0;
      
      console.log(`📊 数据质量检查:`);
      console.log(`  总节点数: ${nodeCount}`);
      console.log(`  有效内容节点: ${contentNodes}`);
      console.log(`  平均内容长度: ${avgContentLength} 字符`);
      
      // 质量阈值检查
      if (nodeCount < 200) {
        throw new Error(`节点数量不足: ${nodeCount} < 200`);
      }
      
      if (contentNodes / nodeCount < 0.7) {
        throw new Error(`有效内容比例过低: ${(contentNodes/nodeCount*100).toFixed(1)}%`);
      }
      
      if (avgContentLength < 1000) {
        throw new Error(`平均内容长度过短: ${avgContentLength} < 1000`);
      }
      
      console.log('✅ 数据质量验证通过');
      
    } catch (error) {
      console.error('❌ 数据验证失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新RAG系统
   */
  async updateRAGSystem() {
    console.log('\n🧠 更新RAG系统配置...');
    
    try {
      // 检查RAG系统是否能正确读取新数据
      const testScript = path.join(__dirname, 'test-rag-data-access.js');
      
      // 如果测试脚本不存在，创建一个简单的测试
      if (!await fs.access(testScript).then(() => true).catch(() => false)) {
        await this.createRAGTestScript(testScript);
      }
      
      // 运行RAG测试
      await new Promise((resolve, reject) => {
        const child = spawn('node', [testScript], {
          stdio: 'pipe',
          cwd: path.dirname(__dirname)
        });
        
        let output = '';
        child.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            console.log('✅ RAG系统更新成功');
            console.log(`📄 测试输出: ${output.trim().substring(0, 200)}...`);
            resolve();
          } else {
            reject(new Error(`RAG测试失败，退出码: ${code}`));
          }
        });
      });
      
    } catch (error) {
      console.error('❌ RAG系统更新失败:', error.message);
      throw error;
    }
  }

  /**
   * 生成同步报告
   */
  async generateSyncReport() {
    console.log('\n📄 生成同步报告...');
    
    try {
      const dataPath = path.join(this.ragDir, 'enhanced-feishu-full-content.json');
      const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
      
      const report = {
        syncTime: new Date().toISOString(),
        syncStatus: 'success',
        dataSource: 'enhanced-feishu-sync-v2',
        quality: {
          totalNodes: data.nodes.length,
          validContentNodes: data.nodes.filter(n => n.content && n.content.length > 50).length,
          avgContentLength: data.summary.avgContentLength,
          maxLevel: Math.max(...data.nodes.map(n => n.level || 0)),
          ragScore: data.summary.avgRagScore
        },
        coverage: {
          byLevel: data.summary.nodesByLevel,
          byType: data.summary.nodesByType
        },
        nextSyncRecommendation: this.getNextSyncTime()
      };
      
      const reportPath = path.join(this.ragDir, 'last-sync-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log('✅ 同步报告已生成');
      console.log(`📊 质量评分: ${report.quality.ragScore}/100`);
      console.log(`📈 覆盖层级: ${report.quality.maxLevel + 1} 级`);
      console.log(`⏰ 建议下次同步: ${report.nextSyncRecommendation}`);
      
    } catch (error) {
      console.error('❌ 报告生成失败:', error.message);
    }
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup() {
    console.log('\n🔄 从备份恢复数据...');
    
    try {
      const backupFiles = await fs.readdir(this.backupDir);
      const latestBackup = backupFiles
        .filter(f => f.includes(this.timestamp))
        .sort()
        .reverse()[0];
      
      if (latestBackup) {
        const backupPath = path.join(this.backupDir, latestBackup);
        const restorePath = path.join(this.ragDir, latestBackup.replace(`${this.timestamp}-`, ''));
        
        await fs.copyFile(backupPath, restorePath);
        console.log(`✅ 已恢复: ${latestBackup}`);
      }
      
    } catch (error) {
      console.error('❌ 恢复失败:', error.message);
    }
  }

  /**
   * 创建RAG测试脚本
   */
  async createRAGTestScript(testPath) {
    const testCode = `
const fs = require('fs');
const path = require('path');

async function testRAGDataAccess() {
  try {
    const dataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('✅ RAG数据读取成功');
    console.log(\`节点数量: \${data.nodes.length}\`);
    console.log(\`平均内容长度: \${data.summary.avgContentLength}\`);
    
    // 测试几个关键查询
    const testQueries = ['AI投资', '创业公司', 'SVTR'];
    testQueries.forEach(query => {
      const matches = data.nodes.filter(n => 
        n.content && n.content.toLowerCase().includes(query.toLowerCase())
      ).length;
      console.log(\`"\${query}" 匹配数: \${matches}\`);
    });
    
    return 0;
  } catch (error) {
    console.error('RAG数据测试失败:', error.message);
    return 1;
  }
}

testRAGDataAccess().then(code => process.exit(code));
`;
    
    await fs.writeFile(testPath, testCode.trim());
  }

  /**
   * 计算下次同步建议时间
   */
  getNextSyncTime() {
    const now = new Date();
    const nextSync = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时后
    return nextSync.toISOString().slice(0, 16).replace('T', ' ');
  }
}

// 主函数
async function main() {
  console.log('🔄 SVTR飞书知识库完整同步管理器\n');
  
  try {
    const manager = new CompleteSyncManager();
    await manager.executeCompleteSync();
    
    console.log('\n🎯 同步任务完成！现在RAG系统将使用最新的完整飞书数据。');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 同步管理器失败:', error.message);
    console.log('\n建议操作:');
    console.log('1. 检查网络连接');
    console.log('2. 验证飞书API权限');
    console.log('3. 查看详细错误日志');
    console.log('4. 如有必要，手动运行: npm run sync');
    
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = CompleteSyncManager;