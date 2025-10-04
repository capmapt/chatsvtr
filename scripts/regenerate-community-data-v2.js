/**
 * 基于飞书真实分类重新生成内容社区数据 V2
 *
 * 改进点:
 * 1. 使用飞书原始分类结构
 * 2. 添加更丰富的标签系统
 * 3. 提取融资金额、轮次等结构化数据
 * 4. 改进分类逻辑
 */

const fs = require('fs');

// 读取飞书RAG数据
const ragData = JSON.parse(
  fs.readFileSync('assets/data/rag/enhanced-feishu-full-content.json', 'utf-8')
);

console.log('📊 开始基于飞书真实分类重新生成内容社区数据...\n');

class CommunityDataGeneratorV2 {
  constructor() {
    this.articles = [];

    // 基于飞书真实分类的内容类型
    this.contentTypes = {
      'funding_news': { name: '融资快讯', icon: '💰', color: '#FF6B6B' },
      'research_report': { name: '研究报告', icon: '📊', color: '#4ECDC4' },
      'ranking': { name: '榜单数据', icon: '📈', color: '#95E1D3' },
      'analysis': { name: '深度分析', icon: '🎓', color: '#F38181' },
      'weekly': { name: 'AI周报', icon: '📰', color: '#FCBAD3' },
      'company_profile': { name: '公司研究', icon: '🏢', color: '#AA96DA' }
    };

    // 细分赛道标签
    this.verticalTags = [
      '大语言模型', 'AI芯片', '云算力', 'AI智能体', 'AI机器人',
      'AI+医疗', 'AI+金融', 'AI+教育', '企业服务', 'AI+营销',
      'AI+法律', 'AI+HR', 'AI音频', 'AI视频', 'AI设计'
    ];
  }

  /**
   * 检测内容类型
   */
  detectContentType(node) {
    const title = node.title.toLowerCase();
    const content = (node.content || '').toLowerCase();

    // 融资快讯
    if (title.includes('融资') || content.includes('完成') && content.includes('融资')) {
      return 'funding_news';
    }

    // 榜单数据
    if (title.includes('榜') || title.includes('排行') || title.includes('top')) {
      return 'ranking';
    }

    // AI周报
    if (title.includes('周报') || title.includes('weekly')) {
      return 'weekly';
    }

    // 季度观察/研究报告
    if (title.includes('观察') || title.includes('q1') || title.includes('q2') ||
        title.includes('q3') || title.includes('q4') || title.includes('报告')) {
      return 'research_report';
    }

    // 公司研究
    if (title.includes('如何') || title.includes('这家') || content.includes('公司') && content.length > 1000) {
      return 'company_profile';
    }

    // 默认为深度分析
    return 'analysis';
  }

  /**
   * 从内容中提取融资信息
   */
  extractFundingInfo(content) {
    if (!content) return null;

    const fundingInfo = {};

    // 提取融资金额
    const amountPatterns = [
      /(\d+(?:\.\d+)?)\s*亿美元/,
      /(\d+(?:\.\d+)?)\s*百万美元/,
      /\$(\d+(?:\.\d+)?)\s*[MB]/i
    ];

    for (const pattern of amountPatterns) {
      const match = content.match(pattern);
      if (match) {
        fundingInfo.amount = match[0];
        break;
      }
    }

    // 提取融资轮次
    const roundPatterns = [
      /([A-E])\s*轮/,
      /(种子|天使)轮/,
      /(Pre-[A-E])\s*轮/i,
      /Series\s*([A-E])/i
    ];

    for (const pattern of roundPatterns) {
      const match = content.match(pattern);
      if (match) {
        fundingInfo.round = match[0];
        break;
      }
    }

    // 提取估值
    const valuationPatterns = [
      /估值.*?(\d+(?:\.\d+)?)\s*亿美元/,
      /valuation.*?\$(\d+(?:\.\d+)?)\s*[MB]/i
    ];

    for (const pattern of valuationPatterns) {
      const match = content.match(pattern);
      if (match) {
        fundingInfo.valuation = match[0];
        break;
      }
    }

    return Object.keys(fundingInfo).length > 0 ? fundingInfo : null;
  }

  /**
   * 提取细分赛道标签
   */
  extractVerticalTags(node) {
    const text = (node.title + ' ' + (node.content || '')).toLowerCase();
    const tags = [];

    this.verticalTags.forEach(tag => {
      if (text.includes(tag.toLowerCase())) {
        tags.push(tag);
      }
    });

    // 从搜索关键词中提取
    if (node.searchKeywords) {
      const keywords = ['llm', 'chip', 'robot', 'agent', 'healthcare', 'finance'];
      keywords.forEach(kw => {
        if (node.searchKeywords.includes(kw)) {
          const mapping = {
            'llm': '大语言模型',
            'chip': 'AI芯片',
            'robot': 'AI机器人',
            'agent': 'AI智能体',
            'healthcare': 'AI+医疗',
            'finance': 'AI+金融'
          };
          if (mapping[kw] && !tags.includes(mapping[kw])) {
            tags.push(mapping[kw]);
          }
        }
      });
    }

    return tags.slice(0, 3); // 最多3个
  }

  /**
   * 转换节点为文章
   */
  nodeToArticle(node) {
    // 过滤条件
    if (!node.content || node.content.length < 200) return null;
    if (node.objType !== 'docx') return null;
    if (node.title.includes('模版') || node.title.includes('副本')) return null;

    // 检测内容类型
    const contentType = this.detectContentType(node);
    const contentTypeInfo = this.contentTypes[contentType];

    // 提取融资信息
    const fundingInfo = this.extractFundingInfo(node.content);

    // 提取细分赛道标签
    const verticalTags = this.extractVerticalTags(node);

    // 组合标签
    const allTags = [
      ...verticalTags,
      ...(node.tags || []).slice(0, 2)
    ].filter((tag, index, self) => self.indexOf(tag) === index).slice(0, 5);

    // 生成摘要
    const excerpt = node.content
      .replace(/image\.png|\.jpg|\.jpeg|\.webp/gi, '')
      .split('\n')
      .filter(line => line.trim().length > 50)
      .slice(0, 3)
      .join('\n')
      .substring(0, 300);

    // 计算阅读时长
    const readingTime = Math.ceil(node.content.length / 300); // 中文约300字/分钟

    const article = {
      id: node.id,
      title: node.title,
      excerpt: excerpt,
      content: node.content,

      // 新增: 内容类型
      contentType: contentType,
      contentTypeInfo: contentTypeInfo,

      // 原有分类(向后兼容)
      category: node.category || 'analysis',
      subcategory: node.subcategory,

      // 标签系统
      tags: allTags,
      verticalTags: verticalTags,

      // 技术层次
      stage: node.stage,
      layer: node.layer,
      investment: node.investment,

      // 新增: 融资信息
      fundingInfo: fundingInfo,

      // 新增: 阅读时长
      readingTime: readingTime,

      // 作者和日期
      author: node.author || { name: '投资观察', avatar: 'V' },
      date: node.date || node.lastUpdated,

      // 来源
      source: {
        platform: 'feishu',
        nodeToken: node.nodeToken,
        objToken: node.objToken,
        url: `https://svtrglobal.feishu.cn/${node.objType}/${node.objToken}`,
        level: node.level
      },

      // 统计
      stats: {
        contentLength: node.contentLength,
        ragScore: node.ragScore
      }
    };

    return article;
  }

  /**
   * 生成所有文章
   */
  generate() {
    console.log(`处理 ${ragData.nodes.length} 个飞书节点...\n`);

    const articles = ragData.nodes
      .map(node => this.nodeToArticle(node))
      .filter(article => article !== null);

    this.articles = articles;

    // 统计信息
    const stats = this.getStatistics();

    console.log('✅ 数据生成完成!\n');
    console.log(`📊 统计信息:`);
    console.log(`  - 总文章数: ${stats.total}`);
    console.log(`  - 内容类型分布:`);
    Object.entries(stats.byContentType).forEach(([type, count]) => {
      const info = this.contentTypes[type];
      console.log(`    ${info.icon} ${info.name}: ${count}篇`);
    });
    console.log(`  - 技术层次分布:`);
    console.log(`    基础层: ${stats.byLayer.infrastructure || 0}篇`);
    console.log(`    模型层: ${stats.byLayer.model || 0}篇`);
    console.log(`    应用层: ${stats.byLayer.application || 0}篇`);
    console.log(`  - 有融资信息: ${stats.withFunding}篇`);
    console.log(`  - 平均阅读时长: ${stats.avgReadingTime}分钟\n`);

    return {
      lastUpdated: new Date().toISOString(),
      totalArticles: articles.length,
      statistics: stats,
      articles: articles
    };
  }

  /**
   * 获取统计数据
   */
  getStatistics() {
    const stats = {
      total: this.articles.length,
      byContentType: {},
      byLayer: {},
      withFunding: 0,
      avgReadingTime: 0
    };

    let totalReadingTime = 0;

    this.articles.forEach(article => {
      // 按内容类型
      stats.byContentType[article.contentType] =
        (stats.byContentType[article.contentType] || 0) + 1;

      // 按技术层次
      if (article.layer) {
        stats.byLayer[article.layer] = (stats.byLayer[article.layer] || 0) + 1;
      }

      // 有融资信息的文章
      if (article.fundingInfo) {
        stats.withFunding++;
      }

      // 累计阅读时长
      totalReadingTime += article.readingTime;
    });

    stats.avgReadingTime = Math.round(totalReadingTime / this.articles.length);

    return stats;
  }

  /**
   * 保存到文件
   */
  save(outputPath = 'assets/data/community-articles-v2.json') {
    const data = this.generate();
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`💾 数据已保存到: ${outputPath}`);
    return data;
  }
}

// 执行
const generator = new CommunityDataGeneratorV2();
generator.save();

console.log('\n✨ 完成!新数据包含更丰富的标签和结构化信息。');
console.log('📝 下一步:');
console.log('  1. 检查 assets/data/community-articles-v2.json');
console.log('  2. 更新前端代码使用新数据格式');
console.log('  3. 添加细分赛道标签筛选');
console.log('  4. 显示融资信息和阅读时长\n');
