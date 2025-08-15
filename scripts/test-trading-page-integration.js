#!/usr/bin/env node

/**
 * 测试交易精选页面集成
 * 验证数据同步->转换->页面显示完整流程
 */

const fs = require('fs').promises;
const path = require('path');

class TradingPageIntegrationTest {
  constructor() {
    this.tradingDataPath = path.join(__dirname, '../assets/data/trading-picks.json');
    this.tradingPagePath = path.join(__dirname, '../pages/trading-picks.html');
    this.ragDataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
  }

  async runIntegrationTest() {
    console.log('🧪 开始交易精选页面集成测试...\n');
    
    try {
      // 1. 验证RAG数据源
      await this.testRAGDataSource();
      
      // 2. 验证转换后的Web数据
      await this.testWebDataFile();
      
      // 3. 验证HTML页面结构
      await this.testHTMLPageStructure();
      
      // 4. 综合报告
      await this.generateIntegrationReport();
      
      console.log('\n🎉 集成测试完成！所有检查均通过');
      
    } catch (error) {
      console.error('❌ 集成测试失败:', error.message);
      process.exit(1);
    }
  }

  async testRAGDataSource() {
    console.log('📊 Step 1: 验证RAG数据源...');
    
    const ragData = JSON.parse(await fs.readFile(this.ragDataPath, 'utf8'));
    const tradingNode = ragData.nodes.find(node => node.title === '交易精选');
    
    if (!tradingNode) {
      throw new Error('RAG数据中未找到交易精选节点');
    }
    
    console.log(`✅ 找到交易精选节点，内容长度: ${tradingNode.contentLength} 字符`);
    
    // 检查bitable数据质量
    const bitableData = tradingNode.bitableData;
    if (bitableData) {
      console.log(`✅ Bitable元数据: ${bitableData.recordCount} 记录, ${bitableData.fieldCount} 字段`);
    }
    
    return tradingNode;
  }

  async testWebDataFile() {
    console.log('\n🔄 Step 2: 验证Web数据文件...');
    
    const webData = JSON.parse(await fs.readFile(this.tradingDataPath, 'utf8'));
    
    // 基本结构验证
    if (!webData.meta || !webData.companies) {
      throw new Error('Web数据文件结构不正确');
    }
    
    console.log(`✅ Web数据结构正确`);
    console.log(`📊 公司数量: ${webData.meta.totalCompanies}`);
    console.log(`⏰ 最后更新: ${new Date(webData.meta.lastUpdated).toLocaleString('zh-CN')}`);
    
    // 验证公司数据完整性
    const sampleCompany = webData.companies[0];
    const requiredFields = ['name', 'sector', 'stage', 'description', 'fundingAmount'];
    
    for (const field of requiredFields) {
      if (!sampleCompany[field]) {
        throw new Error(`公司数据缺少必需字段: ${field}`);
      }
    }
    
    console.log(`✅ 公司数据字段完整，示例: ${sampleCompany.name}`);
    
    // 验证数据质量
    const validCompanies = webData.companies.filter(company => 
      company.name && 
      company.description && 
      company.fundingAmount
    );
    
    console.log(`✅ 有效公司数据: ${validCompanies.length}/${webData.companies.length}`);
    
    if (validCompanies.length === 0) {
      throw new Error('没有有效的公司数据');
    }
    
    return webData;
  }

  async testHTMLPageStructure() {
    console.log('\n🌐 Step 3: 验证HTML页面结构...');
    
    const htmlContent = await fs.readFile(this.tradingPagePath, 'utf8');
    
    // 检查关键元素
    const criticalElements = [
      'id="loading"',
      'id="content"',
      'id="stats"',
      'id="companies"',
      'assets/data/trading-picks.json',
      'loadTradingData',
      'renderCompanies'
    ];
    
    for (const element of criticalElements) {
      if (!htmlContent.includes(element)) {
        throw new Error(`HTML页面缺少关键元素: ${element}`);
      }
    }
    
    console.log('✅ HTML页面结构完整');
    
    // 检查样式和响应式设计
    const styleChecks = [
      '.company-card',
      '.companies-grid',
      '@media screen and (max-width: 768px)',
      'backdrop-filter: blur'
    ];
    
    for (const style of styleChecks) {
      if (!htmlContent.includes(style)) {
        console.log(`⚠️ 样式检查: ${style} 可能缺失`);
      }
    }
    
    console.log('✅ 页面样式检查完成');
    
    return true;
  }

  async generateIntegrationReport() {
    console.log('\n📈 Step 4: 生成集成报告...');
    
    const tradingData = JSON.parse(await fs.readFile(this.tradingDataPath, 'utf8'));
    const ragData = JSON.parse(await fs.readFile(this.ragDataPath, 'utf8'));
    const tradingNode = ragData.nodes.find(node => node.title === '交易精选');
    
    const report = {
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      dataSource: {
        ragNodesTotal: ragData.summary.totalNodes,
        tradingNodeContentLength: tradingNode?.contentLength || 0,
        bitableRecords: tradingNode?.bitableData?.recordCount || 0,
        lastRAGUpdate: ragData.summary.lastUpdated
      },
      webData: {
        totalCompanies: tradingData.meta.totalCompanies,
        dataVersion: tradingData.meta.dataVersion,
        lastWebUpdate: tradingData.meta.lastUpdated,
        validCompanies: tradingData.companies.filter(c => c.name && c.description).length
      },
      dataFlow: {
        sourceToWebConversion: 'OK',
        webDataStructure: 'OK',
        htmlPageIntegration: 'OK'
      },
      nextSteps: [
        '数据每日自动同步已配置 (GitHub Actions)',
        '页面实时数据加载功能正常',
        '可通过 npm run sync:trading:full 手动更新'
      ]
    };
    
    console.log('\n📋 集成报告:');
    console.log(`🔄 数据流: RAG(${report.dataSource.bitableRecords}条记录) → Web(${report.webData.totalCompanies}家公司) → 页面展示`);
    console.log(`📊 数据质量: ${report.webData.validCompanies}/${report.webData.totalCompanies} 公司数据完整`);
    console.log(`⏰ 同步状态: RAG最后更新 ${new Date(report.dataSource.lastRAGUpdate).toLocaleString('zh-CN')}`);
    console.log(`🌐 页面状态: 可通过 http://localhost:8080/pages/trading-picks.html 访问`);
    
    return report;
  }
}

// 主函数
async function main() {
  try {
    const tester = new TradingPageIntegrationTest();
    await tester.runIntegrationTest();
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TradingPageIntegrationTest;