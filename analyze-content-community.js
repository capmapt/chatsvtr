/**
 * 分析内容社区数据来源
 */

const fs = require('fs');
const path = require('path');

async function analyzeData() {
  console.log('🔍 分析内容社区数据来源...\n');

  // 1. 分析JSON文件
  const jsonPath = path.join(__dirname, 'assets/data/community-articles-v3.json');

  console.log('📄 JSON文件信息:');
  const stats = fs.statSync(jsonPath);
  console.log(`   路径: ${jsonPath}`);
  console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   修改时间: ${stats.mtime.toISOString().split('T')[0]}\n`);

  // 读取JSON数据
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const articles = jsonData.articles || [];

  console.log('📊 JSON数据统计:');
  console.log(`   文章总数: ${articles.length}`);

  // 分类统计
  const categories = {};
  const contentTypes = {};
  const hasRichBlocks = articles.filter(a => a.richBlocks && a.richBlocks.length > 0).length;

  articles.forEach(article => {
    const cat = article.category || 'unknown';
    categories[cat] = (categories[cat] || 0) + 1;

    const type = article.contentType || 'unknown';
    contentTypes[type] = (contentTypes[type] || 0) + 1;
  });

  console.log(`   分类分布:`);
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`     - ${cat}: ${count}篇`);
  });

  console.log(`   内容类型:`);
  Object.entries(contentTypes).slice(0, 5).forEach(([type, count]) => {
    console.log(`     - ${type}: ${count}篇`);
  });

  console.log(`   富文本blocks: ${hasRichBlocks}篇 (${(hasRichBlocks/articles.length*100).toFixed(1)}%)`);

  // 样本文章
  if (articles.length > 0) {
    const sample = articles[0];
    console.log(`\n📝 样本文章:`);
    console.log(`   标题: ${sample.title}`);
    console.log(`   分类: ${sample.category}`);
    console.log(`   日期: ${sample.date}`);
    console.log(`   来源: ${sample.source?.platform || '未知'}`);
    console.log(`   ID: ${sample.id}`);
    console.log(`   richBlocks: ${sample.richBlocks?.length || 0}个`);
  }

  // 2. 查询D1 API
  console.log('\n\n🔍 查询D1数据库...\n');

  try {
    const d1Response = await fetch('https://443fd29c.chatsvtr.pages.dev/api/d1/query?table=published_articles&limit=500');
    const d1Data = await d1Response.json();

    if (d1Data.success) {
      const d1Articles = d1Data.data;
      console.log('📊 D1数据统计:');
      console.log(`   published_articles表: ${d1Articles.length}条记录`);

      if (d1Articles.length > 0) {
        const d1Sample = d1Articles[0];
        console.log(`\n📝 D1样本记录:`);
        console.log(`   标题: ${d1Sample.meta_title || d1Sample.title || '未知'}`);
        console.log(`   URL: ${d1Sample.published_url}`);
        console.log(`   状态: ${d1Sample.status}`);
        console.log(`   分类: ${d1Sample.category || '未设置'}`);
        console.log(`   字段: ${Object.keys(d1Sample).slice(0, 10).join(', ')}...`);
      }
    }

    // 3. 查询knowledge_base_nodes
    const kbResponse = await fetch('https://443fd29c.chatsvtr.pages.dev/api/d1/query?table=knowledge_base_nodes&limit=500');
    const kbData = await kbResponse.json();

    if (kbData.success) {
      const kbNodes = kbData.data;
      console.log(`\n   knowledge_base_nodes表: ${kbNodes.length}条记录`);

      // obj_type统计
      const objTypes = {};
      kbNodes.forEach(node => {
        const type = node.obj_type || 'unknown';
        objTypes[type] = (objTypes[type] || 0) + 1;
      });

      console.log(`   obj_type分布:`);
      Object.entries(objTypes).forEach(([type, count]) => {
        console.log(`     - ${type}: ${count}个`);
      });

      if (kbNodes.length > 0) {
        const kbSample = kbNodes[0];
        console.log(`\n📝 知识库样本节点:`);
        console.log(`   标题: ${kbSample.title || '未知'}`);
        console.log(`   类型: ${kbSample.obj_type}`);
        console.log(`   token: ${kbSample.node_token}`);
        console.log(`   字段: ${Object.keys(kbSample).slice(0, 10).join(', ')}...`);
      }
    }

  } catch (error) {
    console.error('❌ D1查询失败:', error.message);
  }

  // 4. 对比分析
  console.log('\n\n📊 对比分析:\n');
  console.log('═'.repeat(60));
  console.log('数据源对比');
  console.log('═'.repeat(60));
  console.log(`JSON文件 (community-articles-v3.json):`);
  console.log(`  - 文章数: ${articles.length}篇`);
  console.log(`  - 大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - 富文本: ${hasRichBlocks}篇 (${(hasRichBlocks/articles.length*100).toFixed(1)}%)`);
  console.log(`  - 来源: 飞书知识库 + 静态JSON`);
  console.log(`  - 更新: 手动同步脚本`);
  console.log('');
  console.log(`D1数据库:`);
  console.log(`  - published_articles: 180+条`);
  console.log(`  - knowledge_base_nodes: 263条`);
  console.log(`  - 来源: 飞书Wiki实时同步`);
  console.log(`  - 更新: 自动同步`);

  console.log('\n' + '═'.repeat(60));
  console.log('建议');
  console.log('═'.repeat(60));
  console.log('✅ 推荐: 使用D1 API替换静态JSON');
  console.log('');
  console.log('理由:');
  console.log('1. 数据实时性: D1数据来自自动同步，比静态JSON更新');
  console.log('2. 统一数据源: 与RAG聊天使用相同的数据');
  console.log('3. 减少文件大小: 不需要部署14MB的JSON文件');
  console.log('4. API灵活性: 支持筛选、排序、分页');
  console.log('5. 性能优化: 可以按需加载，不需要一次加载全部');
  console.log('');
  console.log('实施方案:');
  console.log('1. 修改 community-data-loader.js');
  console.log('2. 从 /api/d1/query?table=published_articles 获取数据');
  console.log('3. 或使用 knowledge_base_nodes 表（更全面）');
  console.log('4. 删除或归档 community-articles-v3.json');
}

analyzeData();
