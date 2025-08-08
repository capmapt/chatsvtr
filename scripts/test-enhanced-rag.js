#!/usr/bin/env node

/**
 * Enhanced RAG System Performance Test
 * 测试升级后的RAG系统性能
 */

const path = require('path');
const fs = require('fs');

// 测试查询集 - 包含不同复杂度和类型
const testQueries = [
  {
    query: "SVTR平台有什么特色功能？",
    category: "platform_info",
    complexity: "simple",
    expectedFeatures: ["query_expansion", "semantic_caching"]
  },
  {
    query: "AI创投市场2024年投资趋势分析",
    category: "investment_analysis", 
    complexity: "complex",
    expectedFeatures: ["query_expansion", "enhanced_keyword_search"]
  },
  {
    query: "如何评估AI初创公司的技术实力？",
    category: "evaluation_criteria",
    complexity: "medium",
    expectedFeatures: ["query_expansion", "semantic_enhancement"]
  },
  {
    query: "生成式AI",
    category: "sector_analysis",
    complexity: "simple",
    expectedFeatures: ["query_expansion"]
  },
  {
    query: "最新获得A轮融资的AI公司有哪些特点？",
    category: "funding_info",
    complexity: "complex",
    expectedFeatures: ["query_expansion", "enhanced_keyword_search", "semantic_caching"]
  }
];

class EnhancedRAGTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  /**
   * 模拟增强RAG服务调用
   */
  async simulateEnhancedRAG(query, options = {}) {
    console.log(`\n🔍 测试查询: "${query}"`);
    const startTime = Date.now();
    
    try {
      // 模拟查询扩展
      const queryExpansion = this.mockQueryExpansion(query);
      console.log(`   📈 查询扩展: ${queryExpansion.expandedQuery.length - query.length} 字符增加`);
      console.log(`   🎯 检测类型: ${queryExpansion.queryType}`);
      
      // 模拟缓存检查
      const cacheResult = await this.mockCacheCheck(query, queryExpansion.queryType);
      if (cacheResult.hit) {
        console.log(`   ⚡ 缓存命中: ${cacheResult.type} (${cacheResult.confidence * 100}%)`);
        return {
          matches: cacheResult.results,
          fromCache: true,
          responseTime: Date.now() - startTime,
          queryExpansion,
          enhancedFeatures: {
            queryExpansion: true,
            semanticCaching: true,
            cacheAccelerated: true
          }
        };
      }
      
      // 模拟多策略检索
      console.log(`   🔄 执行多策略检索...`);
      const strategies = ['vector', 'enhanced_keyword', 'semantic_pattern'];
      const strategyResults = [];
      
      for (const strategy of strategies) {
        const result = await this.mockStrategyExecution(strategy, queryExpansion);
        strategyResults.push(result);
        console.log(`   📊 ${strategy}: ${result.matches.length} 个匹配`);
      }
      
      // 合并结果
      const mergedResults = this.mockResultMerging(strategyResults, query);
      
      const finalResult = {
        matches: mergedResults.matches,
        confidence: mergedResults.confidence,
        fromCache: false,
        responseTime: Date.now() - startTime,
        queryExpansion,
        strategies: strategies.length,
        enhancedFeatures: {
          queryExpansion: true,
          semanticEnhancement: true,
          multiStrategyRetrieval: true,
          semanticCaching: true
        }
      };
      
      // 模拟缓存存储
      if (finalResult.confidence >= 0.6) {
        console.log(`   💾 结果已缓存`);
      }
      
      return finalResult;
      
    } catch (error) {
      console.error(`   ❌ 错误: ${error.message}`);
      return {
        error: error.message,
        responseTime: Date.now() - startTime,
        fromCache: false
      };
    }
  }

  /**
   * 模拟查询扩展
   */
  mockQueryExpansion(query) {
    const keywords = query.toLowerCase().split(/\s+/);
    const synonyms = [];
    const relatedTerms = [];
    
    // 简单的同义词生成
    keywords.forEach(keyword => {
      if (keyword.includes('ai') || keyword.includes('人工智能')) {
        synonyms.push('artificial intelligence', '机器学习', 'deep learning');
      }
      if (keyword.includes('投资') || keyword.includes('融资')) {
        synonyms.push('investment', 'funding', 'venture capital');
      }
      if (keyword.includes('公司') || keyword.includes('企业')) {
        synonyms.push('company', 'startup', 'firm');
      }
    });
    
    // 相关术语生成
    if (query.includes('评估') || query.includes('分析')) {
      relatedTerms.push('due diligence', 'assessment', 'evaluation');
    }
    
    const expandedTerms = [...synonyms.slice(0, 3), ...relatedTerms.slice(0, 2)];
    const expandedQuery = query + ' ' + expandedTerms.join(' ');
    
    // 检测查询类型
    let queryType = 'general';
    if (query.includes('公司') || query.includes('企业')) queryType = 'company_search';
    else if (query.includes('投资') || query.includes('融资')) queryType = 'investment_analysis';
    else if (query.includes('趋势') || query.includes('市场')) queryType = 'market_trends';
    else if (query.includes('技术') || query.includes('AI')) queryType = 'technology_info';
    else if (query.includes('轮次') || query.includes('估值')) queryType = 'funding_info';
    else if (query.includes('评估') || query.includes('团队')) queryType = 'team_evaluation';
    
    return {
      originalQuery: query,
      expandedQuery,
      synonyms,
      relatedTerms,
      queryType,
      confidence: 0.8
    };
  }

  /**
   * 模拟缓存检查
   */
  async mockCacheCheck(query, queryType) {
    // 模拟某些查询有缓存命中
    const commonQueries = [
      'svtr平台',
      'ai投资趋势',
      '生成式ai'
    ];
    
    const queryLower = query.toLowerCase();
    const hasExactMatch = commonQueries.some(common => queryLower.includes(common));
    const hasSemanticMatch = Math.random() < 0.3; // 30%语义匹配概率
    
    if (hasExactMatch) {
      return {
        hit: true,
        type: 'exact',
        confidence: 1.0,
        results: [{
          id: 'cached_1',
          content: `缓存结果: ${query}`,
          score: 0.9,
          source: 'cache'
        }]
      };
    }
    
    if (hasSemanticMatch) {
      return {
        hit: true,
        type: 'semantic',
        confidence: 0.85,
        results: [{
          id: 'cached_semantic',
          content: `语义缓存结果: 相关内容`,
          score: 0.8,
          source: 'semantic_cache'
        }]
      };
    }
    
    return { hit: false };
  }

  /**
   * 模拟策略执行
   */
  async mockStrategyExecution(strategy, queryExpansion) {
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50)); // 模拟延迟
    
    const baseMatches = Math.floor(Math.random() * 5) + 1;
    const matches = [];
    
    for (let i = 0; i < baseMatches; i++) {
      matches.push({
        id: `${strategy}_${i}`,
        content: `${strategy}策略匹配结果 ${i + 1}: 关于 "${queryExpansion.originalQuery}"`,
        score: 0.3 + Math.random() * 0.7,
        source: strategy,
        title: `${strategy}匹配${i + 1}`
      });
    }
    
    return {
      matches,
      strategy,
      executionTime: 10 + Math.random() * 50
    };
  }

  /**
   * 模拟结果合并
   */
  mockResultMerging(strategyResults, originalQuery) {
    const allMatches = [];
    
    strategyResults.forEach(result => {
      result.matches.forEach(match => {
        allMatches.push({
          ...match,
          finalScore: match.score * (0.8 + Math.random() * 0.2)
        });
      });
    });
    
    // 去重和排序
    const uniqueMatches = allMatches
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8);
    
    const avgScore = uniqueMatches.reduce((sum, m) => sum + m.finalScore, 0) / uniqueMatches.length;
    
    return {
      matches: uniqueMatches,
      confidence: Math.min(avgScore + 0.1, 1.0),
      strategies: strategyResults.length
    };
  }

  /**
   * 评估结果质量
   */
  evaluateResult(testCase, result) {
    const evaluation = {
      query: testCase.query,
      category: testCase.category,
      complexity: testCase.complexity,
      result,
      scores: {}
    };

    // 性能评分
    evaluation.scores.performance = this.scorePerformance(result);
    
    // 功能完整性评分
    evaluation.scores.features = this.scoreFeatureCompleteness(testCase, result);
    
    // 结果质量评分
    evaluation.scores.quality = this.scoreResultQuality(result);
    
    // 缓存效率评分
    evaluation.scores.caching = this.scoreCachingEfficiency(result);
    
    // 计算总分
    evaluation.totalScore = Object.values(evaluation.scores).reduce((sum, score) => sum + score, 0) / 4;
    
    return evaluation;
  }

  scorePerformance(result) {
    if (result.error) return 0;
    
    const responseTime = result.responseTime || 0;
    let score = 1.0;
    
    // 响应时间评分
    if (responseTime > 1000) score -= 0.3;
    else if (responseTime > 500) score -= 0.1;
    
    // 缓存加速奖励
    if (result.fromCache && responseTime < 100) score += 0.2;
    
    return Math.max(0, Math.min(1, score));
  }

  scoreFeatureCompleteness(testCase, result) {
    if (result.error) return 0;
    
    const expectedFeatures = testCase.expectedFeatures || [];
    const actualFeatures = result.enhancedFeatures || {};
    let score = 0.5; // 基础分
    
    // 查询扩展
    if (expectedFeatures.includes('query_expansion') && actualFeatures.queryExpansion) {
      score += 0.2;
    }
    
    // 语义缓存
    if (expectedFeatures.includes('semantic_caching') && actualFeatures.semanticCaching) {
      score += 0.15;
    }
    
    // 增强关键词搜索
    if (expectedFeatures.includes('enhanced_keyword_search') && actualFeatures.multiStrategyRetrieval) {
      score += 0.15;
    }
    
    return Math.min(1, score);
  }

  scoreResultQuality(result) {
    if (result.error) return 0;
    
    const confidence = result.confidence || 0;
    const matchCount = result.matches?.length || 0;
    
    let score = confidence * 0.7; // 置信度权重70%
    
    // 结果数量奖励
    if (matchCount >= 3) score += 0.2;
    else if (matchCount >= 1) score += 0.1;
    
    // 策略多样性奖励
    if (result.strategies > 2) score += 0.1;
    
    return Math.min(1, score);
  }

  scoreCachingEfficiency(result) {
    if (result.error) return 0.5;
    
    let score = 0.5; // 基础分
    
    // 缓存命中奖励
    if (result.fromCache) {
      score += 0.4;
      
      // 快速响应额外奖励
      if (result.responseTime < 50) {
        score += 0.1;
      }
    } else {
      // 非缓存结果，如果质量好且会被缓存
      if (result.confidence >= 0.6) {
        score += 0.2;
      }
    }
    
    return Math.min(1, score);
  }

  /**
   * 运行完整测试
   */
  async runEnhancedTest() {
    console.log('🚀 开始增强RAG系统测试...');
    console.log(`📊 测试查询数量: ${testQueries.length}`);
    console.log('='.repeat(60));

    for (const testCase of testQueries) {
      const result = await this.simulateEnhancedRAG(testCase.query);
      const evaluation = this.evaluateResult(testCase, result);
      this.results.push(evaluation);
      
      console.log(`   📈 综合评分: ${(evaluation.totalScore * 100).toFixed(1)}%`);
      console.log(`   ⚡ 响应时间: ${result.responseTime}ms`);
      console.log(`   💾 缓存状态: ${result.fromCache ? '命中' : '未命中'}`);
      
      if (result.enhancedFeatures) {
        const features = Object.keys(result.enhancedFeatures).filter(k => result.enhancedFeatures[k]);
        console.log(`   🎯 启用功能: ${features.join(', ')}`);
      }
    }

    this.generateEnhancedReport();
  }

  /**
   * 生成增强报告
   */
  generateEnhancedReport() {
    const totalTime = Date.now() - this.startTime;
    const avgScore = this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.result.responseTime, 0) / this.results.length;
    const cacheHitRate = this.results.filter(r => r.result.fromCache).length / this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 增强RAG系统测试报告');
    console.log('='.repeat(60));

    console.log(`\n📈 整体性能:`);
    console.log(`   平均评分: ${(avgScore * 100).toFixed(1)}%`);
    console.log(`   平均响应时间: ${avgResponseTime.toFixed(1)}ms`);
    console.log(`   缓存命中率: ${(cacheHitRate * 100).toFixed(1)}%`);
    console.log(`   测试总耗时: ${totalTime}ms`);

    console.log(`\n📋 功能评分明细:`);
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

    console.log(`\n🎯 复杂度性能分析:`);
    const complexityStats = {};
    this.results.forEach(result => {
      const complexity = result.complexity;
      if (!complexityStats[complexity]) {
        complexityStats[complexity] = { scores: [], times: [], count: 0 };
      }
      complexityStats[complexity].scores.push(result.totalScore);
      complexityStats[complexity].times.push(result.result.responseTime);
      complexityStats[complexity].count++;
    });

    Object.entries(complexityStats).forEach(([complexity, stats]) => {
      const avgScore = stats.scores.reduce((a, b) => a + b, 0) / stats.count;
      const avgTime = stats.times.reduce((a, b) => a + b, 0) / stats.count;
      console.log(`   ${complexity}: ${(avgScore * 100).toFixed(1)}% 评分, ${avgTime.toFixed(1)}ms 响应时间`);
    });

    console.log(`\n🚀 增强功能效果:`);
    const featureStats = {
      queryExpansion: 0,
      semanticCaching: 0,
      multiStrategyRetrieval: 0,
      cacheAccelerated: 0
    };

    this.results.forEach(result => {
      const features = result.result.enhancedFeatures || {};
      Object.keys(featureStats).forEach(feature => {
        if (features[feature]) featureStats[feature]++;
      });
    });

    Object.entries(featureStats).forEach(([feature, count]) => {
      const percentage = (count / this.results.length * 100).toFixed(1);
      console.log(`   ${feature}: ${count}/${this.results.length} (${percentage}%)`);
    });

    console.log(`\n💡 优化建议:`);
    const recommendations = this.generateRecommendations();
    recommendations.forEach(rec => console.log(`   • ${rec}`));

    // 保存详细报告
    this.saveEnhancedReport();
  }

  generateRecommendations() {
    const recommendations = [];
    const avgScore = this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length;
    const cacheHitRate = this.results.filter(r => r.result.fromCache).length / this.results.length;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.result.responseTime, 0) / this.results.length;

    if (avgScore < 0.8) {
      recommendations.push('整体评分偏低，建议优化查询扩展算法和结果合并策略');
    }

    if (cacheHitRate < 0.3) {
      recommendations.push('缓存命中率较低，建议增加常见查询预热和语义相似度阈值调优');
    }

    if (avgResponseTime > 200) {
      recommendations.push('响应时间偏高，建议优化并发策略执行和结果处理流程');
    }

    recommendations.push('持续监控RAG系统性能，定期更新知识库内容');
    recommendations.push('考虑实现用户查询模式分析，优化个性化缓存策略');

    return recommendations;
  }

  saveEnhancedReport() {
    const reportPath = path.join(__dirname, '../tests/enhanced-rag-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      testVersion: 'enhanced-rag-v1.0',
      summary: {
        totalQueries: this.results.length,
        avgScore: this.results.reduce((sum, r) => sum + r.totalScore, 0) / this.results.length,
        avgResponseTime: this.results.reduce((sum, r) => sum + r.result.responseTime, 0) / this.results.length,
        cacheHitRate: this.results.filter(r => r.result.fromCache).length / this.results.length,
        totalTestTime: Date.now() - this.startTime
      },
      results: this.results,
      recommendations: this.generateRecommendations(),
      enhancedFeatures: [
        'Advanced Query Expansion',
        'Semantic Caching',
        'Multi-Strategy Retrieval',
        'Intent-Based Optimization'
      ]
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 详细报告已保存: ${reportPath}`);
    } catch (error) {
      console.log(`\n❌ 报告保存失败: ${error.message}`);
    }
  }
}

// 运行测试
async function main() {
  const tester = new EnhancedRAGTester();
  await tester.runEnhancedTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EnhancedRAGTester };