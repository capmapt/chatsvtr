#!/usr/bin/env node

/**
 * SVTR.AI RAG Performance Testing Suite
 * 综合测试RAG系统性能和准确性
 */

const fs = require('fs');
const path = require('path');

// 测试查询集 - 涵盖不同类型的AI创投问题
const testQueries = [
  {
    query: "SVTR平台追踪多少家AI公司？",
    category: "platform_info",
    expectedKeywords: ["svtr", "ai公司", "追踪", "10761"],
    difficulty: "easy"
  },
  {
    query: "2024年AI投资趋势如何？",
    category: "investment_analysis",
    expectedKeywords: ["投资趋势", "2024", "ai投资", "市场"],
    difficulty: "medium"
  },
  {
    query: "如何识别有潜力的AI初创团队？",
    category: "evaluation_criteria",
    expectedKeywords: ["初创团队", "识别", "潜力", "ai"],
    difficulty: "hard"
  },
  {
    query: "生成式AI领域的投资机会？",
    category: "sector_analysis",
    expectedKeywords: ["生成式ai", "投资机会", "领域"],
    difficulty: "medium"
  },
  {
    query: "AI基础设施赛道发展前景？",
    category: "sector_analysis", 
    expectedKeywords: ["ai基础设施", "赛道", "发展前景"],
    difficulty: "hard"
  }
];

// 评分标准
const scoringCriteria = {
  relevance: 0.4,        // 相关性权重
  coverage: 0.3,         // 覆盖度权重
  accuracy: 0.2,         // 准确性权重
  completeness: 0.1      // 完整性权重
};

class RAGPerformanceTester {
  constructor() {
    this.results = [];
    this.knowledgeBase = null;
    this.startTime = Date.now();
  }

  async loadKnowledgeBase() {
    console.log('📚 Loading knowledge base...');
    
    try {
      // 优先加载真实飞书内容
      const realContentPath = path.join(__dirname, '../assets/data/rag/real-feishu-content.json');
      if (fs.existsSync(realContentPath)) {
        this.knowledgeBase = JSON.parse(fs.readFileSync(realContentPath, 'utf8'));
        console.log('✅ Loaded real Feishu content:', {
          documents: this.knowledgeBase.documents?.length || 0,
          characters: this.knowledgeBase.summary?.contentStats?.totalCharacters || 0
        });
        return;
      }

      // 备用：加载改进的知识库
      const improvedPath = path.join(__dirname, '../assets/data/rag/improved-feishu-knowledge-base.json');
      if (fs.existsSync(improvedPath)) {
        this.knowledgeBase = JSON.parse(fs.readFileSync(improvedPath, 'utf8'));
        console.log('⚠️ Loaded backup knowledge base:', {
          documents: this.knowledgeBase.documents?.length || 0
        });
        return;
      }

      throw new Error('No knowledge base found');
    } catch (error) {
      console.error('❌ Failed to load knowledge base:', error.message);
      process.exit(1);
    }
  }

  /**
   * 模拟RAG检索（基于现有逻辑）
   */
  simulateRAGRetrieval(query, options = {}) {
    const results = {
      vectorMatches: [],
      keywordMatches: [],
      patternMatches: [],
      finalScore: 0,
      responseTime: 0
    };

    const startTime = Date.now();

    try {
      // 1. 关键词检索模拟
      results.keywordMatches = this.performKeywordSearch(query);
      
      // 2. 语义模式匹配模拟
      results.patternMatches = this.performPatternMatching(query);
      
      // 3. 合并结果
      const allMatches = [
        ...results.keywordMatches.map(m => ({...m, source: 'keyword'})),
        ...results.patternMatches.map(m => ({...m, source: 'pattern'}))
      ];

      // 4. 评分和排序
      const scoredMatches = this.scoreMatches(allMatches, query);
      results.finalMatches = scoredMatches.slice(0, 5);
      results.finalScore = this.calculateOverallScore(results.finalMatches, query);

      results.responseTime = Date.now() - startTime;
      return results;

    } catch (error) {
      console.error('RAG retrieval error:', error.message);
      results.error = error.message;
      results.responseTime = Date.now() - startTime;
      return results;
    }
  }

  performKeywordSearch(query) {
    if (!this.knowledgeBase?.documents) return [];

    const keywords = this.extractKeywords(query);
    const matches = [];

    this.knowledgeBase.documents.forEach(doc => {
      const content = (doc.content || '').toLowerCase();
      const title = (doc.title || '').toLowerCase();
      
      let score = 0;
      let matchedKeywords = 0;

      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        if (content.includes(keywordLower) || title.includes(keywordLower)) {
          score += 0.5;
          matchedKeywords++;
        }
      });

      if (score > 0) {
        matches.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          score: score / keywords.length,
          matchedKeywords,
          type: 'keyword_match'
        });
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  }

  performPatternMatching(query) {
    const patterns = {
      platform_info: ['svtr', 'platform', '平台', '追踪', '公司'],
      investment_analysis: ['投资', '趋势', '分析', '市场', '资金'],
      evaluation_criteria: ['识别', '评估', '团队', '潜力', '标准'],
      sector_analysis: ['赛道', '领域', '前景', '机会', '发展']
    };

    const queryLower = query.toLowerCase();
    const matches = [];

    Object.entries(patterns).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (queryLower.includes(keyword)) {
          score += 1;
        }
      });

      if (score > 0) {
        matches.push({
          category,
          score: score / keywords.length,
          type: 'pattern_match',
          content: this.getPatternContent(category),
          title: `${category} 相关内容`
        });
      }
    });

    return matches.sort((a, b) => b.score - a.score);
  }

  getPatternContent(category) {
    const content = {
      platform_info: 'SVTR.AI平台追踪10,761+家全球AI公司，覆盖121,884+专业投资人和创业者。',
      investment_analysis: '2024年AI投资呈现分化趋势，企业级应用成为重点，B2B AI解决方案占60%投资份额。',
      evaluation_criteria: '识别AI初创团队需要关注技术实力、团队背景、市场定位、商业模式和执行能力等关键要素。',
      sector_analysis: 'AI基础设施、生成式AI、企业级AI应用是当前最具潜力的投资赛道。'
    };

    return content[category] || '相关AI创投内容';
  }

  extractKeywords(query) {
    return query
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  scoreMatches(matches, query) {
    const keywords = this.extractKeywords(query);
    
    return matches.map(match => {
      let relevanceScore = match.score || 0;
      
      // 内容长度加权
      if (match.content && match.content.length > 100) {
        relevanceScore *= 1.1;
      }

      // 标题匹配加权
      if (match.title && keywords.some(k => match.title.toLowerCase().includes(k))) {
        relevanceScore *= 1.2;
      }

      return {
        ...match,
        finalScore: Math.min(relevanceScore, 1.0)
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }

  calculateOverallScore(matches, query) {
    if (matches.length === 0) return 0;

    const avgScore = matches.reduce((sum, m) => sum + m.finalScore, 0) / matches.length;
    const coverageBonus = matches.length >= 3 ? 0.1 : 0;
    
    return Math.min(avgScore + coverageBonus, 1.0);
  }

  /**
   * 评估单个查询结果
   */
  evaluateQuery(testCase, ragResults) {
    const evaluation = {
      query: testCase.query,
      category: testCase.category,
      difficulty: testCase.difficulty,
      ragResults,
      scores: {}
    };

    // 相关性评分
    evaluation.scores.relevance = this.scoreRelevance(testCase, ragResults);
    
    // 覆盖度评分
    evaluation.scores.coverage = this.scoreCoverage(testCase, ragResults);
    
    // 准确性评分
    evaluation.scores.accuracy = this.scoreAccuracy(testCase, ragResults);
    
    // 完整性评分
    evaluation.scores.completeness = this.scoreCompleteness(testCase, ragResults);

    // 计算加权总分
    evaluation.totalScore = Object.entries(evaluation.scores).reduce((total, [criterion, score]) => {
      return total + (score * scoringCriteria[criterion]);
    }, 0);

    // 性能指标
    evaluation.performance = {
      responseTime: ragResults.responseTime,
      matchCount: ragResults.finalMatches?.length || 0,
      hasError: !!ragResults.error
    };

    return evaluation;
  }

  scoreRelevance(testCase, ragResults) {
    if (!ragResults.finalMatches || ragResults.finalMatches.length === 0) return 0;

    const expectedKeywords = testCase.expectedKeywords || [];
    let relevantMatches = 0;

    ragResults.finalMatches.forEach(match => {
      const content = (match.content || '').toLowerCase();
      const matchedKeywords = expectedKeywords.filter(keyword => 
        content.includes(keyword.toLowerCase())
      );
      
      if (matchedKeywords.length > 0) {
        relevantMatches++;
      }
    });

    return relevantMatches / ragResults.finalMatches.length;
  }

  scoreCoverage(testCase, ragResults) {
    const expectedKeywords = testCase.expectedKeywords || [];
    if (expectedKeywords.length === 0) return 1;

    let coveredKeywords = 0;
    const allContent = ragResults.finalMatches
      ?.map(m => m.content || '').join(' ').toLowerCase() || '';

    expectedKeywords.forEach(keyword => {
      if (allContent.includes(keyword.toLowerCase())) {
        coveredKeywords++;
      }
    });

    return coveredKeywords / expectedKeywords.length;
  }

  scoreAccuracy(testCase, ragResults) {
    // 基于难度调整准确性要求
    const difficultyMultiplier = {
      'easy': 1.0,
      'medium': 0.8,
      'hard': 0.6
    };

    const baseScore = ragResults.finalScore || 0;
    return baseScore * (difficultyMultiplier[testCase.difficulty] || 0.8);
  }

  scoreCompleteness(testCase, ragResults) {
    const expectedMatches = {
      'easy': 2,
      'medium': 3,
      'hard': 4
    };

    const expected = expectedMatches[testCase.difficulty] || 3;
    const actual = ragResults.finalMatches?.length || 0;
    
    return Math.min(actual / expected, 1.0);
  }

  /**
   * 运行完整测试套件
   */
  async runTestSuite() {
    console.log('🚀 Starting RAG Performance Test Suite...');
    console.log('📊 Test queries:', testQueries.length);

    for (const testCase of testQueries) {
      console.log(`\n🔍 Testing: "${testCase.query}"`);
      
      // 执行RAG检索
      const ragResults = this.simulateRAGRetrieval(testCase.query);
      
      // 评估结果
      const evaluation = this.evaluateQuery(testCase, ragResults);
      this.results.push(evaluation);

      console.log(`   📈 Score: ${(evaluation.totalScore * 100).toFixed(1)}% (${ragResults.responseTime}ms)`);
      console.log(`   🎯 Matches: ${ragResults.finalMatches?.length || 0}`);
    }

    this.generateReport();
  }

  /**
   * 生成性能报告
   */
  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const avgScore = this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.performance.responseTime, 0) / this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RAG PERFORMANCE REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Overall Performance:`);
    console.log(`   Average Score: ${(avgScore * 100).toFixed(1)}%`);
    console.log(`   Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`   Total Test Time: ${totalTime}ms`);

    console.log(`\n📋 Score Breakdown:`);
    const scoreBreakdown = this.results.reduce((acc, result) => {
      Object.entries(result.scores).forEach(([criterion, score]) => {
        acc[criterion] = (acc[criterion] || 0) + score;
      });
      return acc;
    }, {});

    Object.entries(scoreBreakdown).forEach(([criterion, totalScore]) => {
      const avgScore = totalScore / this.results.length;
      console.log(`   ${criterion}: ${(avgScore * 100).toFixed(1)}%`);
    });

    console.log(`\n🎯 Category Performance:`);
    const categoryStats = {};
    this.results.forEach(result => {
      if (!categoryStats[result.category]) {
        categoryStats[result.category] = { scores: [], count: 0 };
      }
      categoryStats[result.category].scores.push(result.totalScore);
      categoryStats[result.category].count++;
    });

    Object.entries(categoryStats).forEach(([category, stats]) => {
      const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.count;
      console.log(`   ${category}: ${(avgScore * 100).toFixed(1)}% (${stats.count} queries)`);
    });

    console.log(`\n⚡ Performance Issues:`);
    const issues = this.identifyIssues();
    if (issues.length === 0) {
      console.log(`   ✅ No major issues detected`);
    } else {
      issues.forEach(issue => console.log(`   ⚠️ ${issue}`));
    }

    console.log(`\n🚀 Recommendations:`);
    const recommendations = this.generateRecommendations();
    recommendations.forEach(rec => console.log(`   💡 ${rec}`));

    // 保存详细报告
    this.saveDetailedReport();
  }

  identifyIssues() {
    const issues = [];
    const avgScore = this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.performance.responseTime, 0) / this.results.length;

    if (avgScore < 0.6) {
      issues.push('Overall performance below 60% - knowledge base may need expansion');
    }

    if (avgResponseTime > 1000) {
      issues.push('Average response time exceeds 1s - consider caching optimizations');
    }

    const lowScoreQueries = this.results.filter(r => r.totalScore < 0.4);
    if (lowScoreQueries.length > 0) {
      issues.push(`${lowScoreQueries.length} queries scored below 40% - check knowledge gaps`);
    }

    const errorCount = this.results.filter(r => r.performance.hasError).length;
    if (errorCount > 0) {
      issues.push(`${errorCount} queries encountered errors - check system stability`);
    }

    return issues;
  }

  generateRecommendations() {
    const recommendations = [];
    const avgScore = this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length;
    
    if (avgScore < 0.7) {
      recommendations.push('Expand knowledge base with more comprehensive AI startup and investment data');
    }

    const hardQueries = this.results.filter(r => r.difficulty === 'hard');
    const hardQueriesAvg = hardQueries.reduce((sum, r) => sum + r.totalScore, 0) / hardQueries.length;
    if (hardQueriesAvg < 0.5) {
      recommendations.push('Improve semantic understanding for complex analytical queries');
    }

    const coverageScores = this.results.map(r => r.scores.coverage);
    const avgCoverage = coverageScores.reduce((a, b) => a + b, 0) / coverageScores.length;
    if (avgCoverage < 0.6) {
      recommendations.push('Enhance keyword extraction and content indexing');
    }

    recommendations.push('Consider implementing vector embeddings for better semantic search');
    recommendations.push('Add real-time knowledge base updates from Feishu');
    recommendations.push('Implement query intent classification for better results');

    return recommendations;
  }

  saveDetailedReport() {
    const reportPath = path.join(__dirname, '../tests/rag-performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: this.results.length,
        avgScore: this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length,
        avgResponseTime: this.results.reduce((sum, r) => sum + r.performance.responseTime, 0) / this.results.length,
        totalTestTime: Date.now() - this.startTime
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
  }
}

// 运行测试
async function main() {
  const tester = new RAGPerformanceTester();
  await tester.loadKnowledgeBase();
  await tester.runTestSuite();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RAGPerformanceTester, testQueries };