#!/usr/bin/env node

/**
 * 从飞书数据生成内容社区数据
 * 将飞书知识库数据转换为适合内容社区展示的格式
 */

const fs = require('fs');
const path = require('path');

class CommunityDataGenerator {
  constructor() {
    this.ragDataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    this.outputPath = path.join(__dirname, '../assets/data/community-articles.json');
  }

  /**
   * 生成内容社区数据
   */
  async generate() {
    console.log('📊 开始生成内容社区数据...\n');

    try {
      // 读取飞书数据
      const ragData = JSON.parse(fs.readFileSync(this.ragDataPath, 'utf8'));
      console.log(`✅ 读取到 ${ragData.nodes.length} 个飞书节点`);

      // 转换数据
      const articles = this.transformToArticles(ragData.nodes);
      console.log(`✅ 转换为 ${articles.length} 篇文章`);

      // 分类统计
      const stats = this.generateStats(articles);
      console.log('\n📈 分类统计:');
      console.log(`  初创公司: ${stats.startups}`);
      console.log(`  上市公司: ${stats.public}`);
      console.log(`  行业分析: ${stats.analysis}`);
      console.log(`  投资机构: ${stats.investors}`);

      // 保存数据
      const output = {
        lastUpdated: new Date().toISOString(),
        totalArticles: articles.length,
        categories: stats,
        articles: articles
      };

      fs.writeFileSync(this.outputPath, JSON.stringify(output, null, 2), 'utf8');
      console.log(`\n✅ 数据已保存到: ${this.outputPath}`);

      return true;
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
      throw error;
    }
  }

  /**
   * 转换飞书节点为文章格式
   */
  transformToArticles(nodes) {
    return nodes
      .filter(node => {
        // 过滤条件：
        // 1. 必须有实质内容（>200字符）
        // 2. 必须是文档类型
        // 3. 必须有标题
        return node.content &&
               node.content.length > 200 &&
               node.objType === 'docx' &&
               node.title &&
               !node.title.includes('模版') && // 排除模板
               !node.title.includes('Template'); // 排除模板
      })
      .map(node => this.nodeToArticle(node))
      .filter(article => article !== null);
  }

  /**
   * 将单个节点转换为文章
   */
  nodeToArticle(node) {
    try {
      const category = this.detectCategory(node);
      const tags = this.generateTags(node);
      const excerpt = this.generateExcerpt(node.content);
      const metadata = this.extractMetadata(node);

      return {
        id: node.id,
        title: node.title,
        excerpt: excerpt,
        content: node.content,
        category: category.primary,
        subcategory: category.sub,
        tags: tags,
        stage: metadata.stage,
        layer: metadata.layer,
        investment: metadata.investment,
        author: metadata.author,
        date: this.formatDate(node.lastUpdated),
        source: {
          platform: 'feishu',
          nodeToken: node.nodeToken,
          objToken: node.objToken,
          url: this.generateFeishuUrl(node)
        },
        stats: {
          contentLength: node.contentLength,
          ragScore: node.ragScore
        }
      };
    } catch (error) {
      console.warn(`⚠️  节点转换失败: ${node.title}`, error.message);
      return null;
    }
  }

  /**
   * 检测文章分类
   */
  detectCategory(node) {
    const title = node.title.toLowerCase();
    const content = node.content.toLowerCase();
    const keywords = node.searchKeywords || [];

    // 关键词匹配
    const categoryKeywords = {
      startups: ['初创', '融资', 'startup', '种子轮', 'a轮', 'b轮', 'c轮', '独角兽'],
      public: ['上市', '财报', 'ipo', 'nasdaq', '股价', '市值', '季度业绩'],
      analysis: ['观察', '分析', '趋势', '报告', '洞察', 'analysis', 'report', 'trend'],
      investors: ['投资机构', '基金', 'vc', '红杉', 'sequoia', 'a16z', '投资人', 'investor']
    };

    // 检测主分类
    for (const [category, words] of Object.entries(categoryKeywords)) {
      if (words.some(word => title.includes(word) || content.includes(word))) {
        return {
          primary: category,
          sub: this.detectSubcategory(node, category)
        };
      }
    }

    // 默认为分析类
    return { primary: 'analysis', sub: 'general' };
  }

  /**
   * 检测子分类
   */
  detectSubcategory(node, primaryCategory) {
    const content = (node.title + ' ' + node.content).toLowerCase();

    const subcategories = {
      startups: {
        ai_model: ['模型', 'gpt', 'llm', 'claude', 'gemini'],
        ai_app: ['应用', 'agent', '智能体', 'copilot'],
        infrastructure: ['基础设施', '算力', '芯片', 'gpu', 'nvidia']
      },
      analysis: {
        market: ['市场', '行业', 'market'],
        technology: ['技术', '模型', 'technology'],
        investment: ['投资', '融资', 'funding']
      }
    };

    if (subcategories[primaryCategory]) {
      for (const [sub, keywords] of Object.entries(subcategories[primaryCategory])) {
        if (keywords.some(kw => content.includes(kw))) {
          return sub;
        }
      }
    }

    return 'general';
  }

  /**
   * 生成标签
   */
  generateTags(node) {
    const tags = [];
    const content = (node.title + ' ' + node.content).toLowerCase();

    // 技术标签
    const techTags = {
      '大语言模型': ['gpt', 'llm', '大模型', 'chatgpt'],
      '多模态': ['多模态', 'multimodal', 'vision'],
      'AI芯片': ['芯片', 'gpu', 'nvidia', '算力'],
      '医疗AI': ['医疗', 'healthcare', '诊断'],
      '企业服务': ['企业', 'saas', 'b2b'],
      '教育科技': ['教育', 'education', '学习'],
      '金融科技': ['金融', 'fintech', '支付']
    };

    for (const [tag, keywords] of Object.entries(techTags)) {
      if (keywords.some(kw => content.includes(kw))) {
        tags.push(tag);
      }
    }

    // 阶段标签
    const stageKeywords = {
      '种子轮': ['种子', 'seed'],
      'A轮': ['a轮', 'series a'],
      '独角兽': ['独角兽', 'unicorn'],
      '上市公司': ['上市', 'ipo', 'public']
    };

    for (const [tag, keywords] of Object.entries(stageKeywords)) {
      if (keywords.some(kw => content.includes(kw))) {
        tags.push(tag);
        break; // 只取一个阶段标签
      }
    }

    return tags.slice(0, 4); // 最多4个标签
  }

  /**
   * 提取元数据
   */
  extractMetadata(node) {
    const content = (node.title + ' ' + node.content).toLowerCase();

    // 检测公司阶段
    let stage = null;
    if (content.includes('种子') || content.includes('seed')) stage = 'early';
    else if (content.includes('成长') || content.includes('growth')) stage = 'growth';
    else if (content.includes('独角兽') || content.includes('unicorn')) stage = 'unicorn';
    else if (content.includes('上市') || content.includes('ipo')) stage = 'public';

    // 检测行业层次
    let layer = null;
    if (content.includes('基础') || content.includes('芯片') || content.includes('算力')) layer = 'infrastructure';
    else if (content.includes('模型') || content.includes('gpt') || content.includes('llm')) layer = 'model';
    else if (content.includes('应用') || content.includes('agent') || content.includes('copilot')) layer = 'application';

    // 检测投资类型
    let investment = null;
    if (content.includes('天使')) investment = 'angel';
    else if (content.includes('vc') || content.includes('风投')) investment = 'vc';
    else if (content.includes('pe') || content.includes('私募')) investment = 'pe';
    else if (content.includes('cvc') || content.includes('企业风投')) investment = 'cvc';

    // 提取作者（默认为SVTR编辑部）
    const author = this.extractAuthor(node);

    return { stage, layer, investment, author };
  }

  /**
   * 提取作者信息
   */
  extractAuthor(node) {
    // 从内容中提取作者，或使用默认值
    const defaultAuthors = [
      { name: 'SVTR编辑部', avatar: 'S' },
      { name: 'AI分析师', avatar: 'A' },
      { name: '投资观察', avatar: 'V' },
      { name: '技术评测', avatar: 'T' },
      { name: '创业报道', avatar: 'E' }
    ];

    // 根据内容类型选择作者
    const content = node.content.toLowerCase();
    if (content.includes('投资') || content.includes('融资')) {
      return defaultAuthors[2]; // 投资观察
    } else if (content.includes('技术') || content.includes('模型')) {
      return defaultAuthors[3]; // 技术评测
    } else if (content.includes('初创') || content.includes('startup')) {
      return defaultAuthors[4]; // 创业报道
    } else if (content.includes('财报') || content.includes('业绩')) {
      return defaultAuthors[1]; // AI分析师
    }

    return defaultAuthors[0]; // 默认SVTR编辑部
  }

  /**
   * 生成摘要
   */
  generateExcerpt(content) {
    // 移除markdown标记
    let text = content
      .replace(/^#+\s+/gm, '') // 移除标题
      .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
      .replace(/!\[.*?\]\(.+?\)/g, '') // 移除图片
      .trim();

    // 提取前200-300字符作为摘要
    const sentences = text.split(/[。！？.!?]/);
    let excerpt = '';

    for (const sentence of sentences) {
      if (excerpt.length + sentence.length > 200) break;
      excerpt += sentence + '。';
    }

    return excerpt.trim() || text.substring(0, 200) + '...';
  }

  /**
   * 格式化日期
   */
  formatDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * 生成飞书URL
   */
  generateFeishuUrl(node) {
    if (node.objType === 'docx') {
      return `https://svtrglobal.feishu.cn/docx/${node.objToken}`;
    } else if (node.objType === 'sheet') {
      return `https://svtrglobal.feishu.cn/sheets/${node.objToken}`;
    }
    return `https://svtrglobal.feishu.cn/wiki/${node.nodeToken}`;
  }

  /**
   * 生成统计数据
   */
  generateStats(articles) {
    return {
      startups: articles.filter(a => a.category === 'startups').length,
      public: articles.filter(a => a.category === 'public').length,
      analysis: articles.filter(a => a.category === 'analysis').length,
      investors: articles.filter(a => a.category === 'investors').length
    };
  }
}

// 主函数
async function main() {
  console.log('🚀 SVTR内容社区数据生成器\n');

  try {
    const generator = new CommunityDataGenerator();
    await generator.generate();

    console.log('\n✅ 数据生成完成！');
    console.log('💡 现在可以在内容社区页面中使用这些真实数据\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 生成失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = CommunityDataGenerator;
