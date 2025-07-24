#!/usr/bin/env node

/**
 * 混合RAG系统测试脚本
 * 验证不同检索策略的效果
 */

require('dotenv').config();

// 模拟测试环境
class MockEnvironment {
  constructor() {
    this.documents = [
      {
        id: 'weekly-115',
        content: `AI周报第115期：2024年AI创投市场出现显著变化，企业级AI应用获得更多投资关注。
        主要趋势包括：1）从消费AI转向企业解决方案；2）基础设施投资持续增长；3）AI安全和治理工具需求上升。
        重点公司：Anthropic获得60亿美元D轮融资，Scale AI准备IPO，Perplexity企业级搜索获得2.5亿美元B轮。`,
        title: 'AI周报第115期',
        type: 'weekly',
        source: '飞书知识库',
        keywords: ['AI创投', '企业级AI', '投资趋势', 'Anthropic', 'Scale AI', 'Perplexity']
      },
      {
        id: 'company-anthropic',
        content: `Anthropic：AI安全领域的领军企业，专注于开发安全、有用、无害的AI系统。
        融资情况：2024年完成60亿美元D轮融资，亚马逊和谷歌参投，估值达到180亿美元。
        技术优势：Constitutional AI技术，Claude系列模型在安全性和实用性方面表现突出。`,
        title: 'Anthropic公司分析',
        type: 'company',
        source: 'AI创投库',
        keywords: ['Anthropic', 'AI安全', 'Claude', '60亿美元', 'D轮融资']
      }
    ];
  }

  // 模拟关键词检索
  async keywordSearch(query, keywords) {
    console.log(`🔍 关键词检索: "${query}"`);
    console.log(`📝 提取关键词: [${keywords.join(', ')}]`);

    const results = this.documents.filter(doc => {
      const content = doc.content.toLowerCase();
      const title = doc.title.toLowerCase();
      
      return keywords.some(keyword => 
        content.includes(keyword.toLowerCase()) || 
        title.includes(keyword.toLowerCase())
      );
    });

    console.log(`✅ 找到 ${results.length} 个匹配文档`);
    return results.map(doc => ({
      ...doc,
      score: 0.8,
      strategy: 'keyword'
    }));
  }

  // 模拟语义模式匹配
  async semanticPatternMatch(query) {
    console.log(`🎯 语义模式匹配: "${query}"`);
    
    const patterns = {
      investment: ['投资', '融资', '轮次', 'vc', 'funding'],
      startup: ['公司', '创业', '企业', 'startup', 'company'],  
      trend: ['趋势', '市场', '前景', 'trend', 'market'],
      technology: ['技术', 'ai', '人工智能', 'tech']
    };

    const queryLower = query.toLowerCase();
    const scores = {};
    
    for (const [category, keywords] of Object.entries(patterns)) {
      scores[category] = keywords.reduce((score, keyword) => {
        return score + (queryLower.includes(keyword) ? 1 : 0);
      }, 0);
    }
    
    const bestCategory = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0][0];

    console.log(`📊 模式分析结果: ${bestCategory} (${scores[bestCategory]} 个匹配关键词)`);

    // 根据分类返回相关文档
    const categoryDocs = this.documents.filter(doc => {
      if (bestCategory === 'investment') {
        return doc.keywords.some(k => ['投资', '融资', 'D轮', 'IPO'].includes(k));
      }
      if (bestCategory === 'startup') {
        return doc.type === 'company';
      }
      return true;
    });

    return categoryDocs.map(doc => ({
      ...doc,
      score: 0.75,
      strategy: 'pattern',
      category: bestCategory
    }));
  }

  // 模拟向量检索（如果有API Key）
  async vectorSearch(query) {
    console.log(`🧠 向量检索: "${query}"`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OpenAI API Key未配置，跳过向量检索');
      return [];
    }

    // 这里可以调用真实的OpenAI API
    console.log('✅ 模拟向量检索成功');
    return this.documents.slice(0, 2).map(doc => ({
      ...doc,
      score: 0.9,
      strategy: 'vector'
    }));
  }

  // 混合检索测试
  async testHybridRAG(query) {
    console.log(`\n🚀 开始混合RAG测试`);
    console.log(`📝 查询: "${query}"`);
    console.log('=' .repeat(60));

    const results = [];
    
    // 1. 关键词检索
    try {
      const keywords = this.extractKeywords(query);
      const keywordResults = await this.keywordSearch(query, keywords);
      results.push(...keywordResults);
    } catch (error) {
      console.log('❌ 关键词检索失败:', error.message);
    }

    // 2. 语义模式匹配
    try {
      const patternResults = await this.semanticPatternMatch(query);
      results.push(...patternResults);
    } catch (error) {
      console.log('❌ 模式匹配失败:', error.message);
    }

    // 3. 向量检索
    try {
      const vectorResults = await this.vectorSearch(query);
      results.push(...vectorResults);
    } catch (error) {
      console.log('❌ 向量检索失败:', error.message);
    }

    // 去重和排序
    const deduplicated = this.deduplicateResults(results);
    const final = deduplicated
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log('\n📊 最终结果:');
    final.forEach((result, index) => {
      console.log(`${index + 1}. ${result.title} (${result.strategy}, 分数: ${result.score})`);
    });

    return final;
  }

  // 提取关键词（改进版）
  extractKeywords(query) {
    // 中英文混合关键词提取
    const cleaned = query.toLowerCase().replace(/[？？！。，,\s]+/g, ' ');
    
    // 分词：中文按字符分，英文按空格分
    const words = [];
    const chineseWords = cleaned.match(/[\u4e00-\u9fa5]+/g) || [];
    const englishWords = cleaned.match(/[a-zA-Z]+/g) || [];
    
    // 中文词汇处理
    chineseWords.forEach(word => {
      if (word.length >= 2) {
        words.push(word);
        // 拆分长词
        for (let i = 0; i <= word.length - 2; i++) {
          words.push(word.substr(i, 2));
        }
      }
    });
    
    // 英文词汇处理
    englishWords.forEach(word => {
      if (word.length > 1) {
        words.push(word.toLowerCase());
      }
    });
    
    // 去重并返回
    return [...new Set(words)];
  }

  // 去重结果
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
      if (seen.has(result.id)) return false;
      seen.add(result.id);
      return true;
    });
  }
}

// 测试用例
async function runTests() {
  const env = new MockEnvironment();
  
  const testQueries = [
    'Anthropic投资情况如何？',
    'AI创投市场有什么趋势？', 
    'Scale AI公司分析',
    '企业级AI应用投资',
    '2024年融资轮次分布'
  ];

  console.log('🧪 混合RAG系统测试开始');
  console.log('=' .repeat(80));

  for (const query of testQueries) {
    await env.testHybridRAG(query);
    console.log('\n' + '-'.repeat(80) + '\n');
  }

  console.log('✅ 所有测试完成');
  
  // 输出配置建议
  console.log('\n💡 配置建议:');
  console.log('1. 配置 OPENAI_API_KEY 启用向量检索');
  console.log('2. 使用 npm run dev 启动开发服务器测试');
  console.log('3. 检查 wrangler.toml 中的 Vectorize 配置');
}

// 执行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { MockEnvironment };