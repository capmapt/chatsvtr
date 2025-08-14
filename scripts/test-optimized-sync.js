#!/usr/bin/env node

/**
 * 测试优化版同步脚本 - 只处理少量节点验证效果
 */

require('dotenv').config();
const EnhancedFeishuSyncV2 = require('./enhanced-feishu-sync-v2.js');

class TestOptimizedSync extends EnhancedFeishuSyncV2 {
  constructor() {
    super();
    this.testResults = {
      processedNodes: 0,
      optimizedSheets: 0,
      totalCellsOld: 0,
      totalCellsNew: 0,
      contentLengthOld: 0,
      contentLengthNew: 0
    };
  }

  // 重写节点处理，只处理特定的几个节点
  async processNodeRecursively(node, level = 0) {
    const indent = '  '.repeat(level);
    console.log(`${indent}🔍 处理节点: ${node.title} (${node.obj_type})`);
    
    // 只处理表格类型的节点
    if (node.obj_type !== 'sheet') {
      console.log(`${indent}⏭️ 跳过非表格节点`);
      return null;
    }
    
    // 限制处理数量
    if (this.testResults.processedNodes >= 3) {
      console.log(`${indent}⏭️ 已达到测试限制，跳过`);
      return null;
    }

    const processedNode = {
      id: `node_${node.node_token}`,
      title: node.title,
      nodeToken: node.node_token,
      objToken: node.obj_token,
      objType: node.obj_type,
      level: level,
      type: 'wiki_node',
      source: 'SVTR飞书知识库',
      lastUpdated: new Date().toISOString().split('T')[0],
      metadata: {
        nodeToken: node.node_token,
        objToken: node.obj_token,
        objType: node.obj_type,
        hasChild: node.has_child,
        createTime: node.node_create_time,
        parentToken: node.parent_node_token || '',
        level: level
      }
    };

    // 获取文档内容
    const docContent = await this.getDocumentContent(node.obj_token, node.obj_type, node.title);
    if (docContent) {
      processedNode.content = docContent.content;
      processedNode.contentLength = docContent.length;
      processedNode.docType = docContent.type;
      
      // 统计优化效果
      this.testResults.processedNodes++;
      
      if (docContent.optimized) {
        this.testResults.optimizedSheets++;
        this.testResults.totalCellsNew += docContent.totalCells || 0;
        this.testResults.contentLengthNew += docContent.length;
        console.log(`${indent}🎉 优化成功: ${docContent.totalCells || 0} 个单元格`);
      } else {
        this.testResults.totalCellsOld += 1; // 假设原方法每个表格1个单元格
        this.testResults.contentLengthOld += docContent.length;
        console.log(`${indent}⚠️ 使用降级方案`);
      }
      
      if (docContent.sheetInfo) {
        processedNode.metadata.sheetInfo = docContent.sheetInfo;
      }
      if (docContent.allSheetsData) {
        processedNode.metadata.allSheetsData = docContent.allSheetsData;
      }
    } else {
      processedNode.content = `节点: ${node.title}\\n类型: ${node.obj_type}\\n创建时间: ${new Date(parseInt(node.node_create_time) * 1000).toLocaleDateString()}`;
      processedNode.contentLength = processedNode.content.length;
    }

    // 生成搜索关键词
    processedNode.searchKeywords = this.generateKeywords(processedNode.title, processedNode.content);
    processedNode.semanticTags = this.generateSemanticTags(processedNode.title, processedNode.content);
    processedNode.ragScore = this.calculateRAGScore(processedNode.title, processedNode.content);

    this.knowledgeBase.push(processedNode);
    
    return processedNode;
  }

  // 测试入口
  async runTest() {
    console.log('🚀 开始优化版同步测试...\n');
    
    if (!await this.getAccessToken()) {
      throw new Error('认证失败');
    }

    try {
      // 直接测试已知的表格节点
      const testSheets = [
        {
          node_token: 'E7wbw3r5Mi0ctEk6Q3acXBzCntg',
          obj_token: 'PERPsZO0ph5nZztjBTSctDAdnYg',
          title: 'SVTR.AI创投季度观察',
          obj_type: 'sheet'
        },
        {
          node_token: 'BXxIwfJNgi4d6GkajoHcA4QYnOd',
          obj_token: 'Fz9BszdbFh407stolmucmkISnfg', 
          title: 'SVTR AI估值排行榜',
          obj_type: 'sheet'
        }
      ];
      
      console.log(`📚 测试 ${testSheets.length} 个已知表格节点`);
      
      for (const sheet of testSheets) {
        console.log(`\n--- 测试表格: ${sheet.title} ---`);
        await this.processNodeRecursively(sheet, 1);
        
        // 短暂延迟避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 输出测试结果
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
      throw error;
    }
  }

  printTestResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 优化效果测试结果');
    console.log('='.repeat(60));
    
    const results = this.testResults;
    
    console.log(`\n📋 基础统计:`);
    console.log(`- 总处理节点: ${results.processedNodes}`);
    console.log(`- 优化成功: ${results.optimizedSheets}`);
    console.log(`- 优化失败: ${results.processedNodes - results.optimizedSheets}`);
    console.log(`- 成功率: ${Math.round((results.optimizedSheets / results.processedNodes) * 100)}%`);
    
    console.log(`\n📊 数据量对比:`);
    console.log(`- 新方案单元格: ${results.totalCellsNew.toLocaleString()}`);
    console.log(`- 新方案内容长度: ${results.contentLengthNew.toLocaleString()} 字符`);
    console.log(`- 旧方案内容长度: ${results.contentLengthOld.toLocaleString()} 字符`);
    
    if (results.contentLengthOld > 0) {
      const improvement = Math.round(results.contentLengthNew / results.contentLengthOld);
      console.log(`- 内容量提升: ${improvement}x`);
    }
    
    if (results.optimizedSheets > 0) {
      const avgCells = Math.round(results.totalCellsNew / results.optimizedSheets);
      const avgLength = Math.round(results.contentLengthNew / results.optimizedSheets);
      console.log(`\n📈 优化表格平均:`);
      console.log(`- 平均单元格数: ${avgCells.toLocaleString()}`);
      console.log(`- 平均内容长度: ${avgLength.toLocaleString()} 字符`);
    }
    
    console.log(`\n🎯 预估全量同步效果:`);
    if (results.optimizedSheets > 0) {
      const totalSheets = 66; // 根据之前分析，总共66个表格节点
      const estimatedCells = (results.totalCellsNew / results.optimizedSheets) * totalSheets;
      const estimatedLength = (results.contentLengthNew / results.optimizedSheets) * totalSheets;
      
      console.log(`- 预估总单元格数: ${Math.round(estimatedCells).toLocaleString()}`);
      console.log(`- 预估总内容长度: ${Math.round(estimatedLength / 1024 / 1024)} MB`);
      console.log(`- 相比当前1.7MB的提升: ${Math.round(estimatedLength / 1024 / 1024 / 1.7)}x`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// 主函数
async function main() {
  try {
    const tester = new TestOptimizedSync();
    await tester.runTest();
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  main();
}

module.exports = TestOptimizedSync;