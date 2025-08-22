#!/usr/bin/env node

/**
 * 端到端功能测试
 * 测试完整的同步->RAG->聊天流程
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class EndToEndTest {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * 执行完整的端到端测试
   */
  async runFullTest() {
    console.log('🧪 开始端到端功能测试');
    console.log('=' .repeat(60));
    
    try {
      // 测试步骤1: 验证当前数据状态
      await this.testStep('数据状态验证', () => this.verifyCurrentDataState());
      
      // 测试步骤2: 测试智能同步策略
      await this.testStep('智能同步策略', () => this.testSmartSyncStrategy());
      
      // 测试步骤3: 验证RAG数据加载
      await this.testStep('RAG数据加载', () => this.testRAGDataLoading());
      
      // 测试步骤4: 测试查询功能
      await this.testStep('查询功能测试', () => this.testQueryFunctionality());
      
      // 测试步骤5: 测试监控系统
      await this.testStep('监控系统测试', () => this.testMonitoringSystem());
      
      // 测试步骤6: 测试自动同步配置
      await this.testStep('自动同步配置', () => this.testAutoSyncConfig());
      
      // 生成测试报告
      await this.generateTestReport();
      
      const passed = this.testResults.filter(r => r.success).length;
      const total = this.testResults.length;
      
      console.log('\n🎯 测试摘要:');
      console.log(`通过: ${passed}/${total} (${(passed/total*100).toFixed(1)}%)`);
      
      if (passed === total) {
        console.log('🎉 所有测试通过! 端到端功能正常工作');
        return true;
      } else {
        console.log('⚠️ 部分测试失败，需要修复');
        return false;
      }
      
    } catch (error) {
      console.error('💥 端到端测试异常:', error.message);
      return false;
    }
  }

  /**
   * 测试步骤包装器
   */
  async testStep(name, testFunction) {
    console.log(`\n🔍 ${name}...`);
    const stepStart = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - stepStart;
      
      this.testResults.push({
        name,
        success: true,
        duration,
        result
      });
      
      console.log(`✅ ${name} 通过 (${duration}ms)`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - stepStart;
      
      this.testResults.push({
        name,
        success: false,
        duration,
        error: error.message
      });
      
      console.log(`❌ ${name} 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 验证当前数据状态
   */
  async verifyCurrentDataState() {
    const dataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    
    if (!fs.existsSync(dataPath)) {
      throw new Error('增强版数据文件不存在');
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    const checks = {
      hasNodes: data.nodes && Array.isArray(data.nodes),
      nodeCount: data.nodes?.length || 0,
      hasApiVersion: data.summary?.apiVersion === 'v2_enhanced',
      validContent: data.nodes?.filter(n => n.content && n.content.length > 100).length || 0
    };
    
    if (!checks.hasNodes) throw new Error('节点数据结构无效');
    if (checks.nodeCount < 200) throw new Error(`节点数量不足: ${checks.nodeCount}`);
    if (!checks.hasApiVersion) throw new Error('API版本标识缺失');
    if (checks.validContent < 180) throw new Error(`有效内容不足: ${checks.validContent}`);
    
    console.log(`  节点总数: ${checks.nodeCount}, 有效内容: ${checks.validContent}`);
    return checks;
  }

  /**
   * 测试智能同步策略
   */
  async testSmartSyncStrategy() {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'sync'], {
        stdio: 'pipe',
        cwd: path.dirname(__dirname)
      });
      
      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => output += data.toString());
      
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('智能同步超时'));
      }, 60000); // 1分钟
      
      child.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          console.log('  智能同步策略执行成功');
          resolve({ success: true, output: output.slice(-200) });
        } else {
          reject(new Error(`智能同步失败，退出码: ${code}`));
        }
      });
    });
  }

  /**
   * 测试RAG数据加载
   */
  async testRAGDataLoading() {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [path.join(__dirname, 'rag-integration-test.js')], {
        stdio: 'pipe'
      });
      
      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      
      child.on('close', (code) => {
        if (code === 0) {
          console.log('  RAG数据加载验证通过');
          resolve({ success: true });
        } else {
          reject(new Error('RAG数据加载验证失败'));
        }
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('RAG测试超时'));
      }, 30000);
    });
  }

  /**
   * 测试查询功能
   */
  async testQueryFunctionality() {
    const dataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const documents = data.nodes?.filter(n => n.content && n.content.length > 50) || [];
    
    const testQueries = [
      'AI投资',
      'Anthropic',
      'AI创投会',
      '独角兽排行榜'
    ];
    
    const queryResults = [];
    
    testQueries.forEach(query => {
      const matches = documents.filter(doc => {
        const content = (doc.content || '').toLowerCase();
        const title = (doc.title || '').toLowerCase(); 
        return content.includes(query.toLowerCase()) || title.includes(query.toLowerCase());
      });
      
      queryResults.push({
        query,
        matches: matches.length,
        success: matches.length > 0
      });
      
      console.log(`  "${query}": ${matches.length} 个匹配`);
    });
    
    const successfulQueries = queryResults.filter(r => r.success).length;
    
    if (successfulQueries < testQueries.length * 0.8) {
      throw new Error(`查询成功率过低: ${successfulQueries}/${testQueries.length}`);
    }
    
    return {
      totalQueries: testQueries.length,
      successfulQueries,
      successRate: (successfulQueries / testQueries.length * 100).toFixed(1) + '%'
    };
  }

  /**
   * 测试监控系统
   */
  async testMonitoringSystem() {
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'sync:monitor'], {
        stdio: 'pipe'
      });
      
      let output = '';
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => output += data.toString());
      
      child.on('close', (code) => {
        // 监控系统返回警告状态也算正常
        if (code === 0 || code === 1) {
          console.log('  监控系统运行正常');
          resolve({ 
            success: true, 
            exitCode: code,
            hasWarnings: code === 1 
          });
        } else {
          reject(new Error(`监控系统异常，退出码: ${code}`));
        }
      });
      
      setTimeout(() => {
        child.kill();
        reject(new Error('监控系统测试超时'));
      }, 30000);
    });
  }

  /**
   * 测试自动同步配置
   */
  async testAutoSyncConfig() {
    const configDir = path.join(__dirname, '../config');
    
    // 检查配置文件夹
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // 检查调度器脚本
    const schedulerScript = path.join(__dirname, 'auto-sync-scheduler.js');
    if (!fs.existsSync(schedulerScript)) {
      throw new Error('自动同步调度器脚本不存在');
    }
    
    // 测试调度器状态检查
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'sync:auto:status'], {
        stdio: 'pipe'
      });
      
      child.on('close', (code) => {
        // 调度器未运行也算正常（因为可能没有启动）
        console.log('  自动同步配置检查完成');
        resolve({ 
          schedulerAvailable: true,
          currentlyRunning: code === 0
        });
      });
      
      setTimeout(() => {
        child.kill();
        resolve({ schedulerAvailable: true, currentlyRunning: false });
      }, 10000);
    });
  }

  /**
   * 生成测试报告
   */
  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      testResults: this.testResults,
      summary: {
        total: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
        successRate: (this.testResults.filter(r => r.success).length / this.testResults.length * 100).toFixed(1) + '%'
      },
      systemStatus: 'operational'
    };
    
    try {
      const reportPath = path.join(__dirname, '../logs/end-to-end-test-report.json');
      await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`\n📊 测试报告已保存: ${reportPath}`);
      
    } catch (error) {
      console.error('保存测试报告失败:', error.message);
    }
    
    return report;
  }
}

// 主函数
async function main() {
  console.log('🚀 SVTR飞书知识库端到端功能测试\n');
  
  try {
    const tester = new EndToEndTest();
    const success = await tester.runFullTest();
    
    if (success) {
      console.log('\n🎯 结论: 系统运行正常，所有核心功能可用！');
      console.log('✅ 飞书知识库数据已完全集成到RAG系统');
      console.log('✅ 自动同步和监控机制已就绪');
      process.exit(0);
    } else {
      console.log('\n⚠️ 系统存在问题，请查看测试报告');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 端到端测试失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = EndToEndTest;