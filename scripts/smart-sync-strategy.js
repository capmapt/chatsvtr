#!/usr/bin/env node

/**
 * 智能同步策略
 * 自动判断是否需要重新同步，保证每次都使用最完整的数据
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SmartSyncStrategy {
  constructor() {
    this.ragDir = path.join(__dirname, '../assets/data/rag');
    this.dataFile = path.join(this.ragDir, 'enhanced-feishu-full-content.json');
    this.reportFile = path.join(this.ragDir, 'last-sync-report.json');
  }

  /**
   * 执行智能同步策略
   */
  async execute() {
    console.log('🧠 智能同步策略分析...\n');
    
    try {
      const decision = await this.analyzeAndDecide();
      
      switch (decision.action) {
        case 'skip':
          console.log('✅ 数据质量良好，跳过同步');
          console.log(`💡 ${decision.reason}`);
          return true;
          
        case 'quick_update':
          console.log('🔄 执行快速增量同步');
          return await this.executeQuickSync();
          
        case 'full_sync':
          console.log('🚀 执行完整同步');
          console.log(`📝 原因: ${decision.reason}`);
          return await this.executeFullSync();
          
        default:
          throw new Error(`未知同步操作: ${decision.action}`);
      }
      
    } catch (error) {
      console.error('❌ 智能同步策略失败:', error.message);
      console.log('\n🔄 执行兜底完整同步...');
      return await this.executeFullSync();
    }
  }

  /**
   * 分析并决定同步策略
   */
  async analyzeAndDecide() {
    const analysis = {
      dataExists: false,
      dataAge: 0,
      dataQuality: 0,
      contentCoverage: 0,
      lastSyncStatus: null,
      issues: []
    };
    
    // 检查数据文件是否存在
    if (!fs.existsSync(this.dataFile)) {
      return {
        action: 'full_sync',
        reason: '增强版数据文件不存在，需要首次完整同步',
        analysis
      };
    }
    
    analysis.dataExists = true;
    
    try {
      // 读取和分析数据
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      const now = new Date();
      const lastUpdated = new Date(data.summary?.lastUpdated || 0);
      
      analysis.dataAge = Math.floor((now - lastUpdated) / (1000 * 60 * 60)); // 小时
      analysis.dataQuality = this.assessDataQuality(data);
      analysis.contentCoverage = this.calculateContentCoverage(data);
      
      // 检查上次同步报告
      if (fs.existsSync(this.reportFile)) {
        const report = JSON.parse(fs.readFileSync(this.reportFile, 'utf8'));
        analysis.lastSyncStatus = report.syncStatus;
      }
      
      console.log('📊 数据分析结果:');
      console.log(`  数据年龄: ${analysis.dataAge} 小时`);
      console.log(`  数据质量: ${(analysis.dataQuality * 100).toFixed(1)}/100`);
      console.log(`  内容覆盖: ${(analysis.contentCoverage * 100).toFixed(1)}%`);
      console.log(`  节点数量: ${data.nodes?.length || 0}`);
      
      // 决策逻辑
      if (analysis.dataQuality < 0.7) {
        analysis.issues.push('数据质量过低');
        return {
          action: 'full_sync',
          reason: `数据质量仅${(analysis.dataQuality * 100).toFixed(1)}%，低于70%阈值`,
          analysis
        };
      }
      
      if (analysis.contentCoverage < 0.6) {
        analysis.issues.push('内容覆盖率不足');
        return {
          action: 'full_sync',
          reason: `内容覆盖率仅${(analysis.contentCoverage * 100).toFixed(1)}%，低于60%阈值`,
          analysis
        };
      }
      
      if (analysis.dataAge > 24) {
        return {
          action: 'quick_update',
          reason: `数据已超过24小时，执行增量更新`,
          analysis
        };
      }
      
      if (analysis.dataAge > 168) { // 7天
        return {
          action: 'full_sync',
          reason: `数据已超过7天，需要完整重新同步`,
          analysis
        };
      }
      
      // 数据质量良好，跳过同步
      return {
        action: 'skip',
        reason: '数据新鲜且质量良好，无需重新同步',
        analysis
      };
      
    } catch (error) {
      return {
        action: 'full_sync',
        reason: `数据文件解析失败: ${error.message}`,
        analysis
      };
    }
  }

  /**
   * 评估数据质量
   */
  assessDataQuality(data) {
    if (!data.nodes || !Array.isArray(data.nodes)) return 0;
    
    const totalNodes = data.nodes.length;
    if (totalNodes === 0) return 0;
    
    const validNodes = data.nodes.filter(n => 
      n.content && 
      n.content.trim().length > 20 && 
      n.title && 
      n.title.trim().length > 0
    ).length;
    
    const avgContentLength = data.summary?.avgContentLength || 0;
    const ragScore = data.summary?.avgRagScore || 0;
    
    // 综合质量评分
    const validityScore = validNodes / totalNodes; // 有效性
    const lengthScore = Math.min(avgContentLength / 2000, 1); // 内容丰富度
    const ragScoreNormalized = ragScore / 100; // RAG分数
    
    return (validityScore * 0.5 + lengthScore * 0.3 + ragScoreNormalized * 0.2);
  }

  /**
   * 计算内容覆盖率
   */
  calculateContentCoverage(data) {
    if (!data.nodes || data.nodes.length === 0) return 0;
    
    const nodesWithContent = data.nodes.filter(n => 
      n.content && n.content.trim().length > 50
    ).length;
    
    return nodesWithContent / data.nodes.length;
  }

  /**
   * 执行快速同步
   */
  async executeQuickSync() {
    console.log('⚡ 执行快速增量同步...');
    return await this.runScript('enhanced-feishu-sync-v2.js');
  }

  /**
   * 执行完整同步
   */
  async executeFullSync() {
    console.log('🚀 执行完整管理同步...');
    return await this.runScript('complete-sync-manager.js');
  }

  /**
   * 运行脚本
   */
  async runScript(scriptName) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, scriptName);
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        cwd: path.dirname(__dirname)
      });
      
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('同步超时'));
      }, 10 * 60 * 1000); // 10分钟超时
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          console.log('✅ 同步完成');
          resolve(true);
        } else {
          reject(new Error(`同步失败，退出码: ${code}`));
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`同步错误: ${error.message}`));
      });
    });
  }
}

// 主函数
async function main() {
  console.log('🤖 SVTR飞书知识库智能同步策略\n');
  
  try {
    const strategy = new SmartSyncStrategy();
    const success = await strategy.execute();
    
    if (success) {
      console.log('\n🎯 智能同步策略执行成功！');
      console.log('💡 RAG系统现在拥有最新、最完整的飞书知识库数据');
      
      // 运行验证测试
      console.log('\n🔍 运行同步后验证...');
      const { spawn } = require('child_process');
      const testChild = spawn('node', [path.join(__dirname, 'quick-sync-test.js')], {
        stdio: 'inherit'
      });
      
      testChild.on('close', (code) => {
        process.exit(code);
      });
      
    } else {
      throw new Error('同步策略执行失败');
    }
    
  } catch (error) {
    console.error('\n💥 智能同步策略失败:', error.message);
    console.log('\n🛠️ 故障排除建议:');
    console.log('1. 检查网络连接和飞书API访问');
    console.log('2. 手动运行: npm run sync:enhanced');
    console.log('3. 检查磁盘空间和文件权限');
    console.log('4. 查看完整错误日志');
    
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = SmartSyncStrategy;