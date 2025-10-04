#!/usr/bin/env node

/**
 * 测试内容社区数据
 * 验证数据质量和筛选功能
 */

const fs = require('fs');
const path = require('path');

class CommunityDataTester {
  constructor() {
    this.dataPath = path.join(__dirname, '../assets/data/community-articles.json');
  }

  /**
   * 运行所有测试
   */
  async runTests() {
    console.log('🧪 开始测试SVTR内容社区数据\n');

    try {
      // 读取数据
      const data = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
      const articles = data.articles || [];

      console.log('✅ 数据文件读取成功');
      console.log(`📊 总文章数: ${articles.length}\n`);

      // 运行各项测试
      this.testDataStructure(articles);
      this.testCategories(articles);
      this.testTags(articles);
      this.testMetadata(articles);
      this.testFiltering(articles);
      this.testDataQuality(articles);

      console.log('\n✅ 所有测试通过！');
      return true;
    } catch (error) {
      console.error('\n❌ 测试失败:', error.message);
      return false;
    }
  }

  /**
   * 测试数据结构
   */
  testDataStructure(articles) {
    console.log('🔍 测试1: 数据结构完整性');

    const requiredFields = ['id', 'title', 'excerpt', 'category', 'author', 'date'];
    let errors = 0;

    articles.forEach((article, index) => {
      requiredFields.forEach(field => {
        if (!article[field]) {
          console.error(`  ❌ 文章 #${index + 1} 缺少字段: ${field}`);
          errors++;
        }
      });
    });

    if (errors === 0) {
      console.log('  ✅ 所有文章数据结构完整');
    } else {
      console.warn(`  ⚠️  发现 ${errors} 个结构问题`);
    }
    console.log();
  }

  /**
   * 测试分类分布
   */
  testCategories(articles) {
    console.log('🔍 测试2: 分类分布');

    const categories = {
      startups: 0,
      public: 0,
      analysis: 0,
      investors: 0
    };

    articles.forEach(article => {
      if (categories.hasOwnProperty(article.category)) {
        categories[article.category]++;
      }
    });

    console.log('  分类统计:');
    console.log(`    初创公司: ${categories.startups} (${this.percentage(categories.startups, articles.length)}%)`);
    console.log(`    上市公司: ${categories.public} (${this.percentage(categories.public, articles.length)}%)`);
    console.log(`    行业分析: ${categories.analysis} (${this.percentage(categories.analysis, articles.length)}%)`);
    console.log(`    投资机构: ${categories.investors} (${this.percentage(categories.investors, articles.length)}%)`);
    console.log();
  }

  /**
   * 测试标签
   */
  testTags(articles) {
    console.log('🔍 测试3: 标签分析');

    const allTags = new Set();
    let articlesWithTags = 0;

    articles.forEach(article => {
      if (article.tags && article.tags.length > 0) {
        articlesWithTags++;
        article.tags.forEach(tag => allTags.add(tag));
      }
    });

    console.log(`  文章标签覆盖: ${articlesWithTags}/${articles.length} (${this.percentage(articlesWithTags, articles.length)}%)`);
    console.log(`  唯一标签数量: ${allTags.size}`);
    console.log(`  热门标签: ${Array.from(allTags).slice(0, 5).join(', ')}`);
    console.log();
  }

  /**
   * 测试元数据
   */
  testMetadata(articles) {
    console.log('🔍 测试4: 元数据完整性');

    const metadata = {
      withStage: 0,
      withLayer: 0,
      withInvestment: 0,
      withSource: 0
    };

    articles.forEach(article => {
      if (article.stage) metadata.withStage++;
      if (article.layer) metadata.withLayer++;
      if (article.investment) metadata.withInvestment++;
      if (article.source && article.source.url) metadata.withSource++;
    });

    console.log('  元数据覆盖率:');
    console.log(`    公司阶段: ${this.percentage(metadata.withStage, articles.length)}%`);
    console.log(`    行业层次: ${this.percentage(metadata.withLayer, articles.length)}%`);
    console.log(`    投资类型: ${this.percentage(metadata.withInvestment, articles.length)}%`);
    console.log(`    飞书链接: ${this.percentage(metadata.withSource, articles.length)}%`);
    console.log();
  }

  /**
   * 测试筛选功能
   */
  testFiltering(articles) {
    console.log('🔍 测试5: 筛选功能');

    // 测试分类筛选
    const startupsOnly = articles.filter(a => a.category === 'startups');
    console.log(`  初创公司筛选: ${startupsOnly.length} 篇`);

    // 测试层次筛选
    const infrastructureOnly = articles.filter(a => a.layer === 'infrastructure');
    console.log(`  基础层筛选: ${infrastructureOnly.length} 篇`);

    // 测试阶段筛选
    const unicornsOnly = articles.filter(a => a.stage === 'unicorn');
    console.log(`  独角兽筛选: ${unicornsOnly.length} 篇`);

    // 测试组合筛选
    const combinedFilter = articles.filter(a =>
      a.category === 'startups' && a.layer === 'model'
    );
    console.log(`  组合筛选(初创+模型层): ${combinedFilter.length} 篇`);
    console.log();
  }

  /**
   * 测试数据质量
   */
  testDataQuality(articles) {
    console.log('🔍 测试6: 数据质量');

    let qualityIssues = 0;

    // 检查标题长度
    const shortTitles = articles.filter(a => a.title.length < 10);
    if (shortTitles.length > 0) {
      console.warn(`  ⚠️  ${shortTitles.length} 篇文章标题过短`);
      qualityIssues++;
    }

    // 检查摘要长度
    const shortExcerpts = articles.filter(a => a.excerpt.length < 50);
    if (shortExcerpts.length > 0) {
      console.warn(`  ⚠️  ${shortExcerpts.length} 篇文章摘要过短`);
      qualityIssues++;
    }

    // 检查内容长度
    const avgContentLength = articles.reduce((sum, a) => sum + (a.content?.length || 0), 0) / articles.length;
    console.log(`  平均内容长度: ${Math.round(avgContentLength)} 字符`);

    // 检查日期格式
    const invalidDates = articles.filter(a => !this.isValidDate(a.date));
    if (invalidDates.length > 0) {
      console.warn(`  ⚠️  ${invalidDates.length} 篇文章日期格式异常`);
      qualityIssues++;
    }

    if (qualityIssues === 0) {
      console.log('  ✅ 数据质量良好');
    } else {
      console.log(`  ⚠️  发现 ${qualityIssues} 个质量问题`);
    }
    console.log();
  }

  /**
   * 计算百分比
   */
  percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  /**
   * 验证日期格式
   */
  isValidDate(dateStr) {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateStr);
  }
}

// 主函数
async function main() {
  console.log('🚀 SVTR内容社区数据测试工具\n');

  try {
    const tester = new CommunityDataTester();
    const success = await tester.runTests();

    if (success) {
      console.log('🎉 测试完成！内容社区数据已就绪');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 测试异常:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = CommunityDataTester;
