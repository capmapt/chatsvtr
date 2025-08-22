#!/usr/bin/env node

/**
 * 快速同步测试 - 验证增强版同步是否正常工作
 */

const fs = require('fs');
const path = require('path');

async function quickSyncTest() {
  console.log('🔍 快速同步测试...\n');
  
  try {
    // 检查增强版同步数据是否存在
    const dataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    
    if (!fs.existsSync(dataPath)) {
      console.log('❌ 增强版同步数据不存在，需要运行完整同步');
      return false;
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // 验证数据结构
    if (!data.summary || !data.nodes || !Array.isArray(data.nodes)) {
      console.log('❌ 数据结构验证失败');
      return false;
    }
    
    // 验证数据质量
    const nodeCount = data.nodes.length;
    const contentNodes = data.nodes.filter(n => n.content && n.content.length > 20).length;
    const avgContentLength = data.summary.avgContentLength || 0;
    const lastUpdated = data.summary.lastUpdated;
    
    console.log('📊 数据质量检查:');
    console.log(`  总节点数: ${nodeCount}`);
    console.log(`  有效内容节点: ${contentNodes}`);
    console.log(`  内容覆盖率: ${(contentNodes/nodeCount*100).toFixed(1)}%`);
    console.log(`  平均内容长度: ${avgContentLength} 字符`);
    console.log(`  最后更新时间: ${lastUpdated}`);
    
    // 质量阈值检查
    const qualityChecks = [
      { name: '节点数量', value: nodeCount, threshold: 200, pass: nodeCount >= 200 },
      { name: '内容覆盖率', value: contentNodes/nodeCount, threshold: 0.6, pass: contentNodes/nodeCount >= 0.6 },
      { name: '平均内容长度', value: avgContentLength, threshold: 800, pass: avgContentLength >= 800 }
    ];
    
    console.log('\n🎯 质量检查结果:');
    let allPassed = true;
    qualityChecks.forEach(check => {
      const status = check.pass ? '✅' : '❌';
      const valueDisplay = typeof check.value === 'number' && check.value < 1 ? 
        `${(check.value * 100).toFixed(1)}%` : check.value;
      console.log(`  ${status} ${check.name}: ${valueDisplay} (阈值: ${check.threshold})`);
      if (!check.pass) allPassed = false;
    });
    
    // 测试RAG系统访问
    console.log('\n🧠 测试RAG系统数据访问...');
    const testQueries = ['AI投资', 'SVTR', '创业公司', '融资'];
    testQueries.forEach(query => {
      const matches = data.nodes.filter(n => 
        n.content && n.content.toLowerCase().includes(query.toLowerCase())
      ).length;
      console.log(`  "${query}" 匹配: ${matches} 个节点`);
    });
    
    if (allPassed) {
      console.log('\n✅ 快速同步测试通过，数据质量良好！');
      console.log('💡 RAG系统可以使用现有数据，无需重新同步');
      return true;
    } else {
      console.log('\n⚠️ 数据质量未达标，建议重新运行完整同步');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ 快速测试失败:', error.message);
    console.log('💡 建议运行: npm run sync:enhanced');
    return false;
  }
}

// 执行测试
quickSyncTest().then(success => {
  process.exit(success ? 0 : 1);
});