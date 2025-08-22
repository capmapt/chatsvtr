#!/usr/bin/env node

/**
 * SVTR.AI RAG系统测试工具
 * 测试知识库检索和回答质量
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class RAGTester {
  constructor() {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY,
      testQueries: [
        "OpenAI最新的估值是多少？",
        "DeepSeek模型有什么特点？",
        "AI创投市场的最新趋势是什么？", 
        "哪些公司在准备IPO？",
        "告诉我关于Scale AI的信息",
        "SVTR平台有多少用户？",
        "AI安全领域有哪些投资机会？"
      ]
    };
    
    this.knowledgeBase = null;
    this.vectors = null;
    this.outputDir = path.join(__dirname, '../assets/data/test-results');
  }

  /**
   * 加载测试数据
   */
  async loadTestData() {
    console.log('📚 加载测试数据...');
    
    try {
      // 加载知识库
      const knowledgeFile = path.join(__dirname, '../assets/data/rag/knowledge-base.json');
      const knowledgeData = await fs.readFile(knowledgeFile, 'utf8');
      this.knowledgeBase = JSON.parse(knowledgeData);
      
      // 加载向量数据
      const vectorsFile = path.join(__dirname, '../assets/data/vectors/vectors.json');
      const vectorsData = await fs.readFile(vectorsFile, 'utf8');
      this.vectors = JSON.parse(vectorsData);
      
      console.log(`✅ 知识库: ${this.knowledgeBase.documents.length} 个文档`);
      console.log(`✅ 向量数据: ${this.vectors.vectors.length} 个向量`);
      
      return true;
    } catch (error) {
      console.error('❌ 无法加载测试数据:', error.message);
      console.log('请先运行: npm run rag:sync && npm run rag:build');
      throw error;
    }
  }

  /**
   * 模拟向量检索 (不依赖Cloudflare Vectorize)
   */
  async simulateVectorSearch(query, topK = 5) {
    if (!this.config.openaiApiKey) {
      console.log('⚠️ 缺少OpenAI API Key，跳过向量检索测试');
      return [];
    }

    try {
      // 获取查询向量
      const queryVector = await this.getQueryEmbedding(query);
      
      // 计算相似度
      const similarities = [];
      
      for (const vectorEntry of this.vectors.vectors) {
        const similarity = this.cosineSimilarity(queryVector, vectorEntry.values);
        similarities.push({
          ...vectorEntry,
          score: similarity
        });
      }
      
      // 排序并返回topK结果
      return similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter(item => item.score > 0.7); // 相似度阈值
        
    } catch (error) {
      console.error('向量检索模拟失败:', error.message);
      return [];
    }
  }

  /**
   * 获取查询向量
   */
  async getQueryEmbedding(query) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        dimensions: 1536
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 测试单个查询
   */
  async testQuery(query) {
    console.log(`\n🔍 测试查询: "${query}"`);
    console.log('-'.repeat(50));
    
    const startTime = Date.now();
    
    try {
      // 1. 执行向量检索
      const matches = await this.simulateVectorSearch(query, 5);
      
      const searchTime = Date.now() - startTime;
      
      console.log(`⏱️ 检索耗时: ${searchTime}ms`);
      console.log(`📊 找到 ${matches.length} 个相关匹配:`);
      
      // 2. 显示检索结果
      matches.forEach((match, index) => {
        console.log(`\n${index + 1}. **${match.metadata.title}** (相似度: ${(match.score * 100).toFixed(1)}%)`);
        console.log(`   来源: ${match.metadata.source}`);
        console.log(`   内容预览: ${match.metadata.content.substring(0, 100)}...`);
      });
      
      // 3. 构建上下文
      const context = matches.map(match => 
        `**${match.metadata.title}**\n${match.metadata.content}`
      ).join('\n\n---\n\n');
      
      const confidence = matches.length > 0 
        ? matches.reduce((sum, match) => sum + match.score, 0) / matches.length
        : 0;
      
      console.log(`\n🎯 上下文质量: ${(confidence * 100).toFixed(1)}%`);
      
      return {
        query,
        matches: matches.length,
        confidence,
        searchTime,
        context: context.substring(0, 500) + '...'
      };
      
    } catch (error) {
      console.error(`❌ 查询测试失败: ${error.message}`);
      return {
        query,
        matches: 0,
        confidence: 0,
        searchTime: 0,
        error: error.message
      };
    }
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🧪 开始RAG系统测试...\n');
    
    const results = [];
    
    for (const [index, query] of this.config.testQueries.entries()) {
      const result = await this.testQuery(query);
      results.push(result);
      
      // 避免API频率限制
      if (index < this.config.testQueries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 生成测试报告
    await this.generateTestReport(results);
    
    return results;
  }

  /**
   * 生成测试报告
   */
  async generateTestReport(results) {
    console.log('\n📊 测试报告');
    console.log('='.repeat(50));
    
    const successCount = results.filter(r => r.matches > 0).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const avgSearchTime = results.reduce((sum, r) => sum + r.searchTime, 0) / results.length;
    const totalMatches = results.reduce((sum, r) => sum + r.matches, 0);
    
    console.log(`✅ 成功查询: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
    console.log(`🎯 平均置信度: ${(avgConfidence * 100).toFixed(1)}%`);
    console.log(`⏱️ 平均检索时间: ${avgSearchTime.toFixed(0)}ms`);
    console.log(`📚 总检索匹配: ${totalMatches} 个`);
    
    // 详细结果
    console.log('\n📋 详细结果:');
    results.forEach((result, index) => {
      const status = result.matches > 0 ? '✅' : '❌';
      console.log(`${index + 1}. ${status} "${result.query}"`);
      console.log(`   匹配: ${result.matches}个, 置信度: ${(result.confidence*100).toFixed(1)}%, 时间: ${result.searchTime}ms`);
    });
    
    // 保存报告到文件
    await this.saveTestReport(results);
  }

  /**
   * 保存测试报告
   */
  async saveTestReport(results) {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: results.length,
        successCount: results.filter(r => r.matches > 0).length,
        avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
        avgSearchTime: results.reduce((sum, r) => sum + r.searchTime, 0) / results.length
      },
      results: results,
      config: this.config
    };
    
    const reportFile = path.join(this.outputDir, `rag-test-${Date.now()}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 测试报告已保存: ${reportFile}`);
  }

  /**
   * 交互式测试模式
   */
  async interactiveTest() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n🎮 进入交互式测试模式');
    console.log('输入查询问题，输入 "exit" 退出\n');
    
    const askQuestion = () => {
      rl.question('🔍 请输入查询: ', async (query) => {
        if (query.toLowerCase() === 'exit') {
          rl.close();
          return;
        }
        
        if (query.trim()) {
          await this.testQuery(query);
        }
        
        askQuestion();
      });
    };
    
    askQuestion();
  }
}

// 主函数
async function main() {
  const tester = new RAGTester();
  
  try {
    await tester.loadTestData();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--interactive') || args.includes('-i')) {
      await tester.interactiveTest();
    } else {
      await tester.runAllTests();
      console.log('\n🎉 RAG测试完成！');
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { RAGTester };