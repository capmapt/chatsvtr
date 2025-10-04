/**
 * 分析飞书知识库的分类结构
 */

const fs = require('fs');

// 读取飞书数据
const rawData = fs.readFileSync('assets/data/rag/enhanced-feishu-full-content.json', 'utf-8');
const data = JSON.parse(rawData);

console.log('📊 飞书知识库分类结构分析\n');
console.log(`总节点数: ${data.nodes.length}\n`);

// 按层级统计
const byLevel = {};
data.nodes.forEach(node => {
  if (!byLevel[node.level]) byLevel[node.level] = [];
  byLevel[node.level].push(node.title);
});

console.log('=== 层级结构 ===');
Object.keys(byLevel).sort((a, b) => a - b).forEach(level => {
  console.log(`\nLevel ${level} (${byLevel[level].length}个):`);
  byLevel[level].slice(0, 10).forEach(title => {
    console.log(`  - ${title}`);
  });
  if (byLevel[level].length > 10) {
    console.log(`  ... 还有 ${byLevel[level].length - 10} 个`);
  }
});

// 提取标签和关键词
console.log('\n\n=== 高频标签分析 ===');
const allTags = [];
const allKeywords = [];

data.nodes.forEach(node => {
  if (node.semanticTags) {
    allTags.push(...node.semanticTags);
  }
  if (node.searchKeywords) {
    allKeywords.push(...node.searchKeywords);
  }
});

// 统计频率
const tagFreq = {};
allTags.forEach(tag => {
  tagFreq[tag] = (tagFreq[tag] || 0) + 1;
});

const keywordFreq = {};
allKeywords.forEach(kw => {
  keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
});

// 排序并显示Top标签
const sortedTags = Object.entries(tagFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('\nTop 20 语义标签:');
sortedTags.forEach(([tag, count]) => {
  console.log(`  ${tag}: ${count}次`);
});

// 排序并显示Top关键词
const sortedKeywords = Object.entries(keywordFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('\nTop 20 搜索关键词:');
sortedKeywords.forEach(([kw, count]) => {
  console.log(`  ${kw}: ${count}次`);
});

// 按文档类型统计
console.log('\n\n=== 文档类型分布 ===');
const byType = {};
data.nodes.forEach(node => {
  const type = node.objType || 'unknown';
  byType[type] = (byType[type] || 0) + 1;
});

Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}个`);
});

// 分析顶级分类
console.log('\n\n=== 顶级分类 (Level 0-1) ===');
const topCategories = data.nodes.filter(n => n.level === 0 || n.level === 1);
const categoryTree = {};

topCategories.forEach(node => {
  if (node.level === 0) {
    categoryTree[node.title] = {
      nodeToken: node.nodeToken,
      children: []
    };
  }
});

topCategories.forEach(node => {
  if (node.level === 1 && node.metadata?.parentToken) {
    const parent = data.nodes.find(n => n.nodeToken === node.metadata.parentToken);
    if (parent && categoryTree[parent.title]) {
      categoryTree[parent.title].children.push(node.title);
    }
  }
});

Object.entries(categoryTree).forEach(([category, info]) => {
  console.log(`\n${category}`);
  info.children.slice(0, 10).forEach(child => {
    console.log(`  ├─ ${child}`);
  });
  if (info.children.length > 10) {
    console.log(`  └─ ... 还有 ${info.children.length - 10} 个子分类`);
  }
});
