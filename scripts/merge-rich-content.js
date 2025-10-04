/**
 * 合并富文本blocks数据到文章数据中
 * 生成community-articles-v3.json
 */

const fs = require('fs');

function main() {
  console.log('📖 读取数据文件...');

  // 读取v2文章数据
  const v2Data = JSON.parse(
    fs.readFileSync('./assets/data/community-articles-v2.json', 'utf-8')
  );

  // 读取富文本blocks数据
  const richBlocks = JSON.parse(
    fs.readFileSync('./assets/data/articles-rich-blocks.json', 'utf-8')
  );

  console.log(`✅ v2文章数据: ${v2Data.articles.length}篇`);
  console.log(`✅ 富文本数据: ${richBlocks.articles.length}篇\n`);

  // 创建blocks映射(按id)
  const blocksMap = {};
  richBlocks.articles.forEach(article => {
    blocksMap[article.id] = article;
  });

  // 合并数据
  console.log('🔄 合并数据...');
  let mergedCount = 0;
  let skippedCount = 0;

  v2Data.articles.forEach(article => {
    const richData = blocksMap[article.id];

    if (richData && richData.blocks) {
      // 添加富文本blocks
      article.richBlocks = richData.blocks;
      article.richMeta = {
        blocksCount: richData.blocksCount,
        blockTypes: richData.blockTypes,
        hasImages: richData.hasImages,
        hasTables: richData.hasTables
      };
      mergedCount++;
    } else {
      // 没有富文本数据,保持原样
      article.richBlocks = [];
      article.richMeta = {
        blocksCount: 0,
        blockTypes: {},
        hasImages: false,
        hasTables: false
      };
      skippedCount++;
    }
  });

  console.log(`✅ 成功合并: ${mergedCount}篇`);
  console.log(`⚠️  未找到富文本: ${skippedCount}篇\n`);

  // 更新统计信息
  const output = {
    ...v2Data,
    version: '3.0',
    lastUpdated: new Date().toISOString(),
    richContentEnabled: true,
    note: 'v3版本包含完整的飞书富文本blocks数据,支持专业排版、图片、表格等'
  };

  // 保存v3数据
  const outputPath = './assets/data/community-articles-v3.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('💾 保存成功!');
  console.log(`   文件: ${outputPath}`);

  // 统计信息
  const totalImages = output.articles.reduce((sum, a) => sum + (a.richMeta.blockTypes[27] || 0), 0);
  const totalTables = output.articles.reduce((sum, a) => sum + (a.richMeta.blockTypes[30] || 0), 0);
  const articlesWithImages = output.articles.filter(a => a.richMeta.hasImages).length;
  const articlesWithTables = output.articles.filter(a => a.richMeta.hasTables).length;

  console.log('\n📊 内容统计:');
  console.log(`   📦 总文章数: ${output.articles.length}`);
  console.log(`   🖼️  总图片数: ${totalImages}`);
  console.log(`   📊 总表格数: ${totalTables}`);
  console.log(`   📷 包含图片的文章: ${articlesWithImages}篇`);
  console.log(`   📋 包含表格的文章: ${articlesWithTables}篇`);

  console.log('\n✨ 完成! 下一步:');
  console.log('   1. 修改前端使用 community-articles-v3.json');
  console.log('   2. 使用 RichContentRenderer 渲染富文本');
  console.log('   3. 测试显示效果');
}

main();
