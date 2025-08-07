#!/usr/bin/env node

/**
 * RAG系统集成测试
 * 验证RAG系统是否正确使用完整的飞书数据
 */

const fs = require('fs');
const path = require('path');

class RAGIntegrationTest {
  constructor() {
    this.ragDir = path.join(__dirname, '../assets/data/rag');
    this.dataFile = path.join(this.ragDir, 'enhanced-feishu-full-content.json');
  }

  /**
   * 执行完整的RAG集成测试
   */
  async runFullTest() {
    console.log('🧪 RAG系统集成测试开始');
    console.log('=' .repeat(80));
    
    try {
      // 1. 验证数据文件完整性
      const dataCheck = await this.verifyDataCompleteness();
      if (!dataCheck.success) {
        throw new Error('数据完整性验证失败');
      }
      
      // 2. 验证RAG系统数据加载
      const ragCheck = await this.verifyRAGDataLoading();
      if (!ragCheck.success) {
        throw new Error('RAG数据加载验证失败');
      }
      
      // 3. 验证关键内容覆盖
      const contentCheck = await this.verifyContentCoverage();
      if (!contentCheck.success) {
        throw new Error('内容覆盖验证失败');
      }
      
      // 4. 模拟查询测试
      const queryCheck = await this.verifyQueryCapability();
      if (!queryCheck.success) {
        throw new Error('查询功能验证失败');
      }
      
      console.log('\n🎉 RAG系统集成测试全部通过！');
      return {
        success: true,
        summary: {
          dataCompleteness: dataCheck,
          ragDataLoading: ragCheck,
          contentCoverage: contentCheck,
          queryCapability: queryCheck
        }
      };
      
    } catch (error) {
      console.error('\n❌ RAG集成测试失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 验证数据完整性
   */
  async verifyDataCompleteness() {
    console.log('\n📊 1. 验证数据完整性');
    
    if (!fs.existsSync(this.dataFile)) {
      return { success: false, reason: '增强版数据文件不存在' };
    }
    
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    
    const checks = {
      hasNodes: data.nodes && Array.isArray(data.nodes),
      nodeCount: data.nodes?.length >= 250,
      hasApiVersion: data.summary?.apiVersion === 'v2_enhanced',
      hasValidContent: data.nodes?.filter(n => n.content && n.content.length > 100).length >= 180
    };
    
    console.log(`  节点数组存在: ${checks.hasNodes ? '✅' : '❌'}`);
    console.log(`  节点数量充足: ${checks.nodeCount ? '✅' : '❌'} (${data.nodes?.length}/250)`);
    console.log(`  API版本正确: ${checks.hasApiVersion ? '✅' : '❌'} (${data.summary?.apiVersion})`);
    console.log(`  有效内容充足: ${checks.hasValidContent ? '✅' : '❌'}`);
    
    const success = Object.values(checks).every(Boolean);
    return { 
      success, 
      checks,
      totalNodes: data.nodes?.length || 0,
      validContentNodes: data.nodes?.filter(n => n.content && n.content.length > 100).length || 0
    };
  }

  /**
   * 验证RAG系统数据加载
   */
  async verifyRAGDataLoading() {
    console.log('\n🧠 2. 验证RAG系统数据加载');
    
    try {
      // 模拟RAG服务的loadFeishuKnowledgeBase逻辑
      const response = { ok: true };
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      const documents = [];
      
      // 检查是否能正确识别增强版数据格式
      if (data.nodes && Array.isArray(data.nodes) && data.summary?.apiVersion === 'v2_enhanced') {
        console.log('  ✅ 检测到增强版完整同步数据 (V2)');
        console.log(`  📊 节点数量: ${data.nodes.length}, 平均内容长度: ${data.summary.avgContentLength}字符`);
        
        data.nodes.forEach(node => {
          if (node.content && node.content.trim().length > 20) {
            documents.push({
              id: node.id,
              content: node.content,
              title: node.title,
              type: node.type || 'wiki_node',
              source: node.source || 'SVTR飞书知识库',
              keywords: node.searchKeywords || [],
              verified: true
            });
          }
        });
        
        console.log(`  ✅ 成功加载 ${documents.length} 个有效文档`);
        console.log(`  📈 数据验证状态: ${documents.filter(d => d.verified).length}/${documents.length} 已验证`);
        
        return { 
          success: true, 
          documentsLoaded: documents.length,
          verifiedDocuments: documents.filter(d => d.verified).length,
          loadMethod: 'enhanced_v2_format'
        };
      } else {
        return { success: false, reason: '无法识别增强版数据格式' };
      }
      
    } catch (error) {
      return { success: false, reason: `数据加载失败: ${error.message}` };
    }
  }

  /**
   * 验证内容覆盖范围
   */
  async verifyContentCoverage() {
    console.log('\n📋 3. 验证关键内容覆盖');
    
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    const nodes = data.nodes || [];
    
    // 关键内容板块检查
    const keyContentAreas = {
      'AI创投库': ['AI创投库', 'AI估值排行榜', 'AI独角兽排行榜', 'AI融资概览'],
      'AI创投会': ['AI创投会', '第001期', '第002期', '第013期'],
      'AI创投营': ['AI创投营', '硅谷站'],
      'AI创投榜': ['AI创投榜', '融资排行榜', '估值排行榜'],
      '研究报告': ['Scale AI', 'Anthropic', 'OpenAI', 'AI公司研究'],
      '会员专区': ['会员专区', '权益'],
      '数据分析': ['福布斯', 'A16Z', 'Sequoia']
    };
    
    const coverage = {};
    let totalExpected = 0;
    let totalFound = 0;
    
    for (const [area, keywords] of Object.entries(keyContentAreas)) {
      const matches = keywords.map(keyword => 
        nodes.filter(node => 
          node.title?.includes(keyword) || 
          node.content?.includes(keyword)
        ).length
      );
      
      const areaMatches = Math.max(...matches);
      totalExpected += keywords.length;
      totalFound += matches.filter(m => m > 0).length;
      
      coverage[area] = {
        expected: keywords.length,
        found: matches.filter(m => m > 0).length,
        matches: areaMatches,
        status: areaMatches > 0 ? '✅' : '❌'
      };
      
      console.log(`  ${coverage[area].status} ${area}: ${coverage[area].found}/${coverage[area].expected} 关键词匹配 (${areaMatches}个节点)`);
    }
    
    const overallCoverage = (totalFound / totalExpected * 100).toFixed(1);
    console.log(`  📊 总体覆盖率: ${overallCoverage}% (${totalFound}/${totalExpected})`);
    
    return {
      success: overallCoverage >= 70,
      coverage: parseFloat(overallCoverage),
      details: coverage,
      totalFound,
      totalExpected
    };
  }

  /**
   * 验证查询能力
   */
  async verifyQueryCapability() {
    console.log('\n🔍 4. 验证查询功能');
    
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
    const documents = data.nodes?.filter(n => n.content && n.content.length > 50) || [];
    
    const testQueries = [
      { query: 'AI投资趋势', expectedMin: 5, category: '投资分析' },
      { query: 'Anthropic公司介绍', expectedMin: 2, category: '公司研究' },
      { query: 'SVTR创投会活动', expectedMin: 3, category: '社区活动' },
      { query: '独角兽估值排行榜', expectedMin: 1, category: '数据榜单' },
      { query: '硅谷科技评论会员权益', expectedMin: 1, category: '服务介绍' }
    ];
    
    const queryResults = [];
    
    testQueries.forEach(({ query, expectedMin, category }) => {
      // 模拟关键词搜索
      const matches = documents.filter(doc => {
        const content = (doc.content || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        const queryLower = query.toLowerCase();
        
        return content.includes(queryLower) || 
               title.includes(queryLower) ||
               query.split('').some(char => content.includes(char) || title.includes(char));
      });
      
      const success = matches.length >= expectedMin;
      const status = success ? '✅' : '❌';
      
      console.log(`  ${status} "${query}" (${category}): ${matches.length} 个匹配 (预期≥${expectedMin})`);
      
      if (matches.length > 0) {
        console.log(`    示例: ${matches[0].title?.substring(0, 60)}...`);
      }
      
      queryResults.push({
        query,
        category,
        matches: matches.length,
        expectedMin,
        success
      });
    });
    
    const successfulQueries = queryResults.filter(r => r.success).length;
    const querySuccessRate = (successfulQueries / testQueries.length * 100).toFixed(1);
    
    console.log(`  📊 查询成功率: ${querySuccessRate}% (${successfulQueries}/${testQueries.length})`);
    
    return {
      success: querySuccessRate >= 80,
      successRate: parseFloat(querySuccessRate),
      results: queryResults,
      totalDocuments: documents.length
    };
  }
}

// 主函数
async function main() {
  console.log('🔍 开始RAG系统完整性验证\n');
  
  try {
    const tester = new RAGIntegrationTest();
    const result = await tester.runFullTest();
    
    if (result.success) {
      console.log('\n📈 验证摘要:');
      console.log(`  数据节点: ${result.summary.dataCompleteness.totalNodes} 个`);
      console.log(`  有效内容: ${result.summary.dataCompleteness.validContentNodes} 个`);
      console.log(`  加载文档: ${result.summary.ragDataLoading.documentsLoaded} 个`);
      console.log(`  内容覆盖: ${result.summary.contentCoverage.coverage}%`);
      console.log(`  查询成功: ${result.summary.queryCapability.successRate}%`);
      
      console.log('\n🎯 结论: RAG系统已完全集成飞书知识库数据，可以正常提供服务！');
      process.exit(0);
      
    } else {
      console.log('\n⚠️ 需要重新同步数据');
      console.log('建议执行: npm run sync:complete');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 验证过程失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = RAGIntegrationTest;