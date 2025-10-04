#!/usr/bin/env node

/**
 * 测试作者名称生成逻辑
 */

const fs = require('fs');
const path = require('path');

// 模拟generateAuthorName函数
function generateAuthorName(article) {
  // 根据contentType生成更合适的作者名
  const contentTypeAuthors = {
    'funding_news': 'SVTR 融资观察',
    'company_profile': 'SVTR 研究团队',
    'analysis': 'SVTR 分析师',
    'ranking': 'SVTR 数据中心',
    'weekly': 'SVTR 编辑部',
    'research_report': 'SVTR 研究院'
  };

  // 优先使用contentType匹配
  if (article.contentType && contentTypeAuthors[article.contentType]) {
    return contentTypeAuthors[article.contentType];
  }

  // 根据标题关键词智能判断
  const title = article.title || '';
  if (title.includes('融资') || title.includes('获投') || title.includes('轮')) {
    return 'SVTR 融资观察';
  }
  if (title.includes('榜单') || title.includes('排行') || title.includes('Top')) {
    return 'SVTR 数据中心';
  }
  if (title.includes('周报') || title.includes('月报') || title.includes('季报')) {
    return 'SVTR 编辑部';
  }
  if (title.includes('分析') || title.includes('观察') || title.includes('趋势')) {
    return 'SVTR 分析师';
  }
  if (title.includes('公司') || title.includes('企业') || title.match(/[A-Z][a-z]+/)) {
    return 'SVTR 研究团队';
  }

  return article.author?.name || 'SVTR 编辑部';
}

// 读取数据文件
const dataPath = path.join(__dirname, 'assets/data/community-articles-v3.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('🧪 测试作者名称生成逻辑\n');

// 统计每种contentType的作者名称
const typeAuthorMap = {};
data.articles.forEach(article => {
  const type = article.contentType || 'unknown';
  const generatedAuthor = generateAuthorName(article);

  if (!typeAuthorMap[type]) {
    typeAuthorMap[type] = {};
  }
  typeAuthorMap[type][generatedAuthor] = (typeAuthorMap[type][generatedAuthor] || 0) + 1;
});

console.log('📊 ContentType -> 作者名称 映射统计:\n');
Object.keys(typeAuthorMap).sort().forEach(type => {
  console.log(`${type}:`);
  Object.entries(typeAuthorMap[type]).forEach(([author, count]) => {
    console.log(`  - ${author}: ${count}篇`);
  });
  console.log('');
});

// 展示一些示例
console.log('📝 示例文章:\n');
const samplesByType = {};
data.articles.forEach(article => {
  const type = article.contentType || 'unknown';
  if (!samplesByType[type]) {
    samplesByType[type] = [];
  }
  if (samplesByType[type].length < 2) {
    samplesByType[type].push(article);
  }
});

Object.keys(samplesByType).sort().forEach(type => {
  console.log(`【${type}】`);
  samplesByType[type].forEach(article => {
    const generatedAuthor = generateAuthorName(article);
    console.log(`  标题: ${article.title}`);
    console.log(`  原作者: ${article.author?.name || '未知'}`);
    console.log(`  生成作者: ${generatedAuthor}`);
    console.log('');
  });
});

console.log('✅ 测试完成！');
