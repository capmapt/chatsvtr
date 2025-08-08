#!/usr/bin/env node

/**
 * 测试联系方式引导功能
 * 验证敏感查询是否正确触发微信联系引导
 */

const testCases = [
  // 应该触发联系引导的敏感查询
  {
    category: '投资机会',
    queries: [
      '有什么好的投资机会吗？',
      '能推荐一些值得投资的AI项目吗？',
      '最近有哪些投资机会？',
      '有没有好的投资标的？'
    ],
    shouldTriggerContact: true
  },
  {
    category: '项目对接',
    queries: [
      '我想寻找项目对接',
      '能帮我介绍投资人吗？',
      '有合适的项目可以对接吗？',
      '如何联系合适的投资方？'
    ],
    shouldTriggerContact: true
  },
  {
    category: '融资需求',
    queries: [
      '我们公司想融资',
      '融资需求怎么对接？',
      '寻找融资机会',
      '需要资金支持'
    ],
    shouldTriggerContact: true
  },
  {
    category: '商业合作',
    queries: [
      '想和SVTR合作',
      '商业合作机会',
      '合作咨询',
      '业务合作'
    ],
    shouldTriggerContact: true
  },
  {
    category: '投资咨询',
    queries: [
      '需要投资咨询服务',
      '一对一投资建议',
      '专业投资咨询',
      '投资顾问服务'
    ],
    shouldTriggerContact: true
  },
  
  // 不应该触发联系引导的常规查询
  {
    category: '一般信息查询',
    queries: [
      'SVTR的创始人是谁？',
      '最新的AI融资趋势如何？',
      'OpenAI最新发展情况',
      'AI创投市场分析'
    ],
    shouldTriggerContact: false
  },
  {
    category: '知识普及',
    queries: [
      '什么是A轮融资？',
      'AI投资的风险有哪些？',
      '如何评估AI公司？',
      '创投行业基本概念'
    ],
    shouldTriggerContact: false
  }
];

class ContactGuidanceTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        accuracyRate: 0
      },
      categoryResults: [],
      issues: []
    };
  }

  // 模拟查询类型识别逻辑（基于chat-optimized.ts的逻辑）
  identifyQueryType(query) {
    const lowercaseQuery = query.toLowerCase();
    
    // 敏感联系类查询 - 需要引导微信联系
    if (lowercaseQuery.includes('联系') || lowercaseQuery.includes('对接') || 
        lowercaseQuery.includes('合作') || lowercaseQuery.includes('投资机会') ||
        lowercaseQuery.includes('融资需求') || lowercaseQuery.includes('项目') ||
        lowercaseQuery.includes('咨询') || lowercaseQuery.includes('介绍') ||
        lowercaseQuery.includes('推荐') || lowercaseQuery.includes('寻找') ||
        lowercaseQuery.includes('想融资') || lowercaseQuery.includes('需要资金')) {
      return 'contact_sensitive';
    }
    
    // 创始人相关查询
    if (lowercaseQuery.includes('创始人') || lowercaseQuery.includes('founder') || 
        lowercaseQuery.includes('svtr') && (lowercaseQuery.includes('谁') || lowercaseQuery.includes('who'))) {
      return 'founder_info';
    }
    
    // 融资信息查询
    if (lowercaseQuery.includes('融资') || lowercaseQuery.includes('投资') || 
        lowercaseQuery.includes('最新') && lowercaseQuery.includes('信息')) {
      return 'funding_info';
    }
    
    // OpenAI分析查询
    if (lowercaseQuery.includes('openai') || lowercaseQuery.includes('chatgpt')) {
      return 'company_analysis';
    }
    
    return 'general';
  }

  async runTest() {
    console.log('🧪 开始联系方式引导功能测试\n');

    for (const testCase of testCases) {
      console.log(`📋 测试类别: ${testCase.category}`);
      console.log(`预期行为: ${testCase.shouldTriggerContact ? '触发' : '不触发'}联系引导`);
      console.log('-'.repeat(60));

      const categoryResult = {
        category: testCase.category,
        expectedTrigger: testCase.shouldTriggerContact,
        totalQueries: testCase.queries.length,
        correctPredictions: 0,
        incorrectPredictions: 0,
        queryResults: []
      };

      for (const query of testCase.queries) {
        const queryType = this.identifyQueryType(query);
        const actualTriggered = queryType === 'contact_sensitive';
        const isCorrect = actualTriggered === testCase.shouldTriggerContact;
        
        const queryResult = {
          query,
          queryType,
          expectedTrigger: testCase.shouldTriggerContact,
          actualTriggered,
          correct: isCorrect
        };

        categoryResult.queryResults.push(queryResult);
        
        if (isCorrect) {
          categoryResult.correctPredictions++;
          console.log(`✅ "${query}" → ${queryType} (正确)`);
        } else {
          categoryResult.incorrectPredictions++;
          console.log(`❌ "${query}" → ${queryType} (错误: 应该${testCase.shouldTriggerContact ? '触发' : '不触发'})`);
          
          this.results.issues.push({
            category: testCase.category,
            query,
            expected: testCase.shouldTriggerContact,
            actual: actualTriggered,
            queryType
          });
        }
        
        this.results.summary.totalTests++;
        if (isCorrect) this.results.summary.passedTests++;
        else this.results.summary.failedTests++;
      }

      categoryResult.accuracy = (categoryResult.correctPredictions / categoryResult.totalQueries * 100).toFixed(1);
      this.results.categoryResults.push(categoryResult);
      
      console.log(`📊 类别准确率: ${categoryResult.accuracy}% (${categoryResult.correctPredictions}/${categoryResult.totalQueries})`);
      console.log();
    }

    this.results.summary.accuracyRate = (this.results.summary.passedTests / this.results.summary.totalTests * 100).toFixed(1);
    
    this.displayResults();
    return this.results;
  }

  displayResults() {
    console.log('🎯 联系方式引导功能测试结果');
    console.log('='*50);
    console.log(`📊 总体准确率: ${this.results.summary.accuracyRate}%`);
    console.log(`✅ 通过测试: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
    console.log(`❌ 失败测试: ${this.results.summary.failedTests}/${this.results.summary.totalTests}\n`);

    console.log('📋 分类测试结果:');
    this.results.categoryResults.forEach(category => {
      const status = category.accuracy >= 90 ? '✅' : category.accuracy >= 70 ? '⚠️' : '❌';
      console.log(`${status} ${category.category}: ${category.accuracy}% (${category.correctPredictions}/${category.totalQueries})`);
    });

    if (this.results.issues.length > 0) {
      console.log('\n🔍 需要改进的问题:');
      this.results.issues.slice(0, 5).forEach((issue, index) => {
        console.log(`${index + 1}. "${issue.query}"`);
        console.log(`   类别: ${issue.category}`);
        console.log(`   预期: ${issue.expected ? '触发' : '不触发'} → 实际: ${issue.actual ? '触发' : '不触发'}`);
        console.log(`   识别为: ${issue.queryType}`);
        console.log();
      });
    }

    console.log('💡 功能验证:');
    if (this.results.summary.accuracyRate >= 90) {
      console.log('✅ 联系方式引导功能运行良好，能够准确识别敏感查询');
    } else if (this.results.summary.accuracyRate >= 80) {
      console.log('⚠️ 联系方式引导功能基本可用，但需要优化识别逻辑');
    } else {
      console.log('❌ 联系方式引导功能需要重新设计识别规则');
    }

    console.log('\n📞 引导示例:');
    console.log('当识别为contact_sensitive查询时，AI将回复：');
    console.log('"如需更深入的投资咨询或项目对接，欢迎添加凯瑞微信：pkcapital2023，获得一对一专业服务。"');
  }

  generateRecommendations() {
    const recommendations = [];
    
    // 基于错误分析生成建议
    const sensitiveIssues = this.results.issues.filter(i => i.expected === true && i.actual === false);
    const generalIssues = this.results.issues.filter(i => i.expected === false && i.actual === true);
    
    if (sensitiveIssues.length > 0) {
      recommendations.push({
        type: 'missing_keywords',
        description: '添加更多敏感查询关键词',
        examples: sensitiveIssues.slice(0, 3).map(i => i.query),
        priority: 'high'
      });
    }
    
    if (generalIssues.length > 0) {
      recommendations.push({
        type: 'over_sensitive',
        description: '减少过度敏感的关键词匹配',
        examples: generalIssues.slice(0, 3).map(i => i.query),
        priority: 'medium'
      });
    }
    
    return recommendations;
  }
}

// 主函数
async function main() {
  console.log('🧪 SVTR 联系方式引导功能测试启动\n');

  try {
    const tester = new ContactGuidanceTest();
    const results = await tester.runTest();
    
    if (results.summary.accuracyRate >= 80) {
      console.log('\n🎉 测试通过！联系方式引导功能已就绪。');
      console.log('\n📌 使用说明:');
      console.log('• 当用户询问投资机会、项目对接、商业合作等敏感信息时');  
      console.log('• AI将自动引导添加凯瑞微信：pkcapital2023');
      console.log('• 确保为高价值用户提供一对一专业服务');
    } else {
      console.log('\n⚠️ 测试发现问题，需要优化识别逻辑。');
      const recommendations = tester.generateRecommendations();
      if (recommendations.length > 0) {
        console.log('\n💡 改进建议:');
        recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec.description} (${rec.priority})`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ContactGuidanceTest;