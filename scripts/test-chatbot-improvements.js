#!/usr/bin/env node

/**
 * Chatbot功能改进测试器
 * 测试用户反馈的具体问题：SVTR创始人、最新融资信息、OpenAI分析
 */

const fs = require('fs');
const path = require('path');

class ChatbotImprovementTester {
  constructor() {
    this.logFile = path.join(__dirname, '../logs/chatbot-improvement-test.json');
    this.testCases = [
      // 用户报告的问题场景
      {
        id: 'svtr_founder',
        category: '创始人信息',
        queries: [
          'SVTR的创始人是谁？',
          '谁创立了SVTR？',
          '硅谷科技评论创始人',
          'Who founded SVTR?'
        ],
        expectedKeywords: ['min liu', 'allen', '创始人', 'founder'],
        priority: 'critical'
      },
      {
        id: 'latest_funding',
        category: '最新融资信息',
        queries: [
          '最新的融资信息有哪些？',
          '2024年AI融资情况',
          'Anthropic最近融资多少？',
          '最新投资趋势'
        ],
        expectedKeywords: ['2024', '融资', '40亿', 'anthropic', '投资'],
        priority: 'high'
      },
      {
        id: 'openai_analysis',
        category: 'OpenAI分析',
        queries: [
          'OpenAI的发展分析',
          'ChatGPT公司分析',
          'OpenAI投融资情况',
          'OpenAI最新动态'
        ],
        expectedKeywords: ['openai', 'chatgpt', '1570亿', '估值', '分析'],
        priority: 'high'
      },
      {
        id: 'data_completeness',
        category: '数据完整性',
        queries: [
          'Anthropic融资xx亿元', // 测试是否还有xx问题
          '创始人信息：', // 测试空白问题
          '最新数据更新时间'
        ],
        expectedKeywords: ['完整', '具体', '详细', '2024'],
        priority: 'medium'
      }
    ];
  }

  async runComprehensiveTest() {
    console.log('🧪 开始Chatbot功能改进测试\n');
    console.log('='*60);

    const testResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        improvements: []
      },
      categoryResults: {},
      detailedResults: [],
      recommendations: []
    };

    for (const testCase of this.testCases) {
      console.log(`\n🔍 测试类别: ${testCase.category} (${testCase.priority})`);
      console.log('-'.repeat(50));
      
      const categoryResult = await this.testCategory(testCase);
      testResults.categoryResults[testCase.id] = categoryResult;
      testResults.detailedResults.push(categoryResult);
      
      testResults.summary.totalTests += categoryResult.queries.length;
      testResults.summary.passedTests += categoryResult.passedQueries;
      testResults.summary.failedTests += categoryResult.failedQueries;
    }

    // 生成改进建议
    this.generateImprovementRecommendations(testResults);

    // 保存测试结果
    await this.saveTestResults(testResults);

    // 显示测试摘要
    this.displayTestSummary(testResults);

    return testResults;
  }

  async testCategory(testCase) {
    const categoryResult = {
      category: testCase.category,
      priority: testCase.priority,
      queries: testCase.queries.length,
      passedQueries: 0,
      failedQueries: 0,
      queryResults: [],
      issues: [],
      improvements: []
    };

    for (const query of testCase.queries) {
      console.log(`📝 测试查询: "${query}"`);
      
      const queryResult = await this.testSingleQuery(query, testCase.expectedKeywords);
      categoryResult.queryResults.push(queryResult);
      
      if (queryResult.passed) {
        categoryResult.passedQueries++;
        console.log(`✅ 通过: 找到${queryResult.matches.length}个匹配，包含${queryResult.keywordMatches}个关键词`);
      } else {
        categoryResult.failedQueries++;
        console.log(`❌ 失败: ${queryResult.issues.join(', ')}`);
        categoryResult.issues.push(...queryResult.issues);
      }
      
      // 显示匹配内容示例
      if (queryResult.matches.length > 0) {
        const topMatch = queryResult.matches[0];
        const preview = (topMatch.content || '').substring(0, 100);
        console.log(`   💡 最佳匹配: ${topMatch.title} - ${preview}...`);
      }
      
      console.log(); // 空行分隔
    }

    return categoryResult;
  }

  async testSingleQuery(query, expectedKeywords) {
    const result = {
      query,
      passed: false,
      matches: [],
      keywordMatches: 0,
      relevanceScore: 0,
      issues: []
    };

    try {
      // 模拟RAG检索 - 加载实际数据
      const matches = await this.simulateRAGQuery(query);
      result.matches = matches;

      if (matches.length === 0) {
        result.issues.push('未找到匹配内容');
        return result;
      }

      // 检查关键词匹配
      const combinedContent = matches.map(m => (m.content || '') + ' ' + (m.title || '')).join(' ').toLowerCase();
      
      let keywordCount = 0;
      expectedKeywords.forEach(keyword => {
        if (combinedContent.includes(keyword.toLowerCase())) {
          keywordCount++;
        }
      });

      result.keywordMatches = keywordCount;
      result.relevanceScore = keywordCount / expectedKeywords.length;

      // 判断是否通过测试
      if (keywordCount >= Math.ceil(expectedKeywords.length * 0.5)) {
        result.passed = true;
      } else {
        result.issues.push(`关键词匹配不足 (${keywordCount}/${expectedKeywords.length})`);
      }

      // 检查数据质量问题
      const qualityIssues = this.checkContentQuality(combinedContent);
      if (qualityIssues.length > 0) {
        result.issues.push(...qualityIssues);
        result.passed = false;
      }

    } catch (error) {
      result.issues.push(`查询错误: ${error.message}`);
    }

    return result;
  }

  async simulateRAGQuery(query) {
    try {
      // 加载增强版数据
      const dataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
      
      if (!fs.existsSync(dataPath)) {
        throw new Error('数据文件不存在');
      }

      const rawData = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(rawData);
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('数据格式错误');
      }

      // 简单的文本匹配搜索
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(word => word.length > 1);
      
      const matches = [];
      
      data.nodes.forEach(node => {
        if (!node.content) return;
        
        const contentLower = (node.content + ' ' + (node.title || '')).toLowerCase();
        let score = 0;
        let matchedWords = 0;
        
        queryWords.forEach(word => {
          if (contentLower.includes(word)) {
            score += 1;
            matchedWords++;
          }
        });
        
        if (matchedWords > 0) {
          matches.push({
            ...node,
            score: score / queryWords.length,
            matchedWords
          });
        }
      });

      // 按得分排序，返回前5个
      return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    } catch (error) {
      console.warn(`模拟RAG查询失败: ${error.message}`);
      return [];
    }
  }

  checkContentQuality(content) {
    const issues = [];
    
    // 检查数据缺失问题
    if (content.includes('xx亿') || content.includes('xx万')) {
      issues.push('包含数据缺失标记(xx)');
    }
    
    // 检查空白信息
    if (content.includes('创始人：\n') || content.includes('创始人: ')) {
      const founderMatch = content.match(/创始人[：:]\s*([^\n]*)/);
      if (founderMatch && founderMatch[1].trim().length === 0) {
        issues.push('创始人信息为空');
      }
    }
    
    // 检查过多空格
    if (content.match(/\s{5,}/)) {
      issues.push('包含过多空格');
    }
    
    // 检查重复内容
    if (content.includes('正在分析') || content.includes('分析中')) {
      issues.push('包含无用分析文本');
    }
    
    return issues;
  }

  generateImprovementRecommendations(testResults) {
    const recommendations = [];
    
    // 基于失败率生成建议
    const failureRate = testResults.summary.failedTests / testResults.summary.totalTests;
    
    if (failureRate > 0.5) {
      recommendations.push({
        priority: 'critical',
        action: '立即增强Prompt工程',
        details: '超过50%的测试失败，需要重新设计系统提示词和RAG检索策略',
        effort: 'high'
      });
    }
    
    // 分析具体问题
    Object.values(testResults.categoryResults).forEach(category => {
      if (category.priority === 'critical' && category.passedQueries === 0) {
        recommendations.push({
          priority: 'critical',
          action: `修复${category.category}问题`,
          details: `所有${category.category}相关查询都失败，需要补充相关数据`,
          effort: 'medium'
        });
      }
      
      if (category.issues.includes('关键词匹配不足')) {
        recommendations.push({
          priority: 'high',
          action: '优化关键词匹配策略',
          details: '当前RAG检索无法准确匹配用户查询意图',
          effort: 'medium'
        });
      }
      
      if (category.issues.some(issue => issue.includes('数据缺失'))) {
        recommendations.push({
          priority: 'high',
          action: '继续数据清理',
          details: '仍存在"xx亿元"等数据缺失问题',
          effort: 'low'
        });
      }
    });
    
    testResults.recommendations = recommendations;
  }

  async saveTestResults(testResults) {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(this.logFile, JSON.stringify(testResults, null, 2));
      
      // 生成易读的摘要
      const summaryFile = this.logFile.replace('.json', '-summary.txt');
      const summaryText = this.generateTestSummary(testResults);
      fs.writeFileSync(summaryFile, summaryText);
      
      console.log(`📝 测试结果已保存: ${this.logFile}`);
    } catch (error) {
      console.warn('保存测试结果失败:', error.message);
    }
  }

  generateTestSummary(testResults) {
    const passRate = (testResults.summary.passedTests / testResults.summary.totalTests * 100).toFixed(1);
    
    return `
SVTR Chatbot功能改进测试报告
============================
测试时间: ${testResults.timestamp}
总体通过率: ${passRate}%

测试统计:
- 总测试数: ${testResults.summary.totalTests}
- 通过数: ${testResults.summary.passedTests}
- 失败数: ${testResults.summary.failedTests}

分类结果:
${Object.values(testResults.categoryResults).map(cat => 
  `- ${cat.category}: ${cat.passedQueries}/${cat.queries} 通过 (${cat.priority})`
).join('\n')}

主要问题:
${Object.values(testResults.categoryResults)
  .flatMap(cat => cat.issues)
  .slice(0, 5)
  .map((issue, i) => `${i + 1}. ${issue}`)
  .join('\n')}

优先改进建议:
${testResults.recommendations.map((rec, i) => 
  `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`
).join('\n')}

结论:
${passRate >= 80 ? '✅ Chatbot功能基本满足需求' : 
  passRate >= 60 ? '⚠️ Chatbot功能需要改进' : 
  '❌ Chatbot功能存在严重问题，需要立即优化'}
    `.trim();
  }

  displayTestSummary(testResults) {
    const passRate = (testResults.summary.passedTests / testResults.summary.totalTests * 100).toFixed(1);
    
    console.log('\n🎯 Chatbot功能改进测试总结');
    console.log('='*60);
    console.log(`📊 总体通过率: ${passRate}%`);
    console.log(`✅ 通过测试: ${testResults.summary.passedTests}/${testResults.summary.totalTests}`);
    console.log(`❌ 失败测试: ${testResults.summary.failedTests}/${testResults.summary.totalTests}\n`);

    console.log('📋 分类测试结果:');
    Object.values(testResults.categoryResults).forEach(category => {
      const categoryPassRate = (category.passedQueries / category.queries * 100).toFixed(1);
      const status = categoryPassRate >= 80 ? '✅' : categoryPassRate >= 50 ? '⚠️' : '❌';
      console.log(`${status} ${category.category}: ${categoryPassRate}% (${category.passedQueries}/${category.queries})`);
    });

    if (testResults.recommendations.length > 0) {
      console.log('\n💡 关键改进建议:');
      testResults.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`   ${rec.details}`);
      });
    }

    console.log('\n🎉 测试完成！');
    
    if (passRate >= 80) {
      console.log('✅ 恭喜！Chatbot功能已显著改进，用户体验应该得到提升。');
    } else if (passRate >= 60) {
      console.log('⚠️ Chatbot功能有所改善，但仍有优化空间。');
    } else {
      console.log('❌ Chatbot功能仍需要进一步优化。建议运行推荐的改进操作。');
    }
  }
}

// 主函数
async function main() {
  console.log('🧪 SVTR Chatbot功能改进测试器启动\n');

  try {
    const tester = new ChatbotImprovementTester();
    const results = await tester.runComprehensiveTest();
    
    // 根据测试结果给出下一步建议
    const passRate = (results.summary.passedTests / results.summary.totalTests * 100);
    
    console.log('\n📌 建议的下一步操作:');
    if (passRate < 60) {
      console.log('1. npm run fix:data-gaps  # 继续数据修复');
      console.log('2. 检查enhanced-feishu-full-content.json数据完整性');
      console.log('3. 优化chat-optimized.ts的Prompt工程');
    } else {
      console.log('1. npm run optimize:all  # 优化静态资源');
      console.log('2. npm run deploy:cloudflare  # 部署改进版本');
      console.log('3. 监控用户反馈验证改进效果');
    }
    
  } catch (error) {
    console.error('💥 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChatbotImprovementTester;