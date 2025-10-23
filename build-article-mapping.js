const fs = require('fs');
const path = require('path');

console.log('📊 构建D1 node_token到静态article文件的映射...\n');

// 读取原始JSON
const jsonPath = path.join(__dirname, 'assets/data/backup/community-articles-v3.json.bak');
const articlesData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`✅ 加载了 ${articlesData.articles.length} 篇文章\n`);

// 提取前10条的映射关系
console.log('前10条文章的映射关系:\n');
articlesData.articles.slice(0, 10).forEach((article, index) => {
  const nodeToken = article.source?.nodeToken || article.id.replace('node_', '');
  const slug = article.source?.url?.split('/').pop()?.replace('.html', '') ||
                `${article.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')}-${nodeToken.substring(nodeToken.length - 8)}`;

  console.log(`${index + 1}. ${article.title.substring(0, 50)}...`);
  console.log(`   node_token: ${nodeToken}`);
  console.log(`   slug: ${slug}`);
  console.log(`   source.url: ${article.source?.url || 'N/A'}`);
  console.log('');
});

// 检查articles目录中的实际文件
console.log('\n📁 检查articles目录中的实际文件:\n');
const articlesDir = path.join(__dirname, 'articles');
const files = fs.readdirSync(articlesDir).slice(0, 10);

files.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log(`\n总共有 ${fs.readdirSync(articlesDir).length} 个HTML文件`);

// 尝试匹配第一篇文章
console.log('\n\n🔍 查找第一篇文章的静态HTML文件:\n');
const firstArticle = articlesData.articles[0];
const firstNodeToken = firstArticle.source?.nodeToken || firstArticle.id.replace('node_', '');

console.log(`文章标题: ${firstArticle.title}`);
console.log(`node_token: ${firstNodeToken}`);
console.log(`source.url: ${firstArticle.source?.url}\n`);

// 搜索包含node_token后缀的文件
const shortToken = firstNodeToken.substring(firstNodeToken.length - 8);
const matchingFiles = fs.readdirSync(articlesDir).filter(file =>
  file.includes(shortToken) || file.includes(firstNodeToken)
);

if (matchingFiles.length > 0) {
  console.log(`✅ 找到匹配的文件:`);
  matchingFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log(`❌ 未找到匹配的文件`);
  console.log(`\n尝试通过source.url查找...`);

  if (firstArticle.source?.url) {
    const urlSlug = firstArticle.source.url.split('/').pop();
    const exactMatch = fs.readdirSync(articlesDir).find(file => file === urlSlug);

    if (exactMatch) {
      console.log(`✅ 通过URL找到文件: ${exactMatch}`);
    } else {
      console.log(`❌ URL也无法匹配: ${urlSlug}`);
    }
  }
}
