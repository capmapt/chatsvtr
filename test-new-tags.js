#!/usr/bin/env node

/**
 * 测试新标签逻辑
 */

const fs = require('fs');
const apiData = JSON.parse(fs.readFileSync('c:/Projects/chatsvtr/current-api-data.json', 'utf8'));

console.log('🏷️ 新标签逻辑测试\n');
console.log('格式: 二级分类 + 标签字段(逗号分隔)\n');

// 模拟新的标签构建逻辑
function buildTags(item) {
  const tags = [];

  // 添加二级分类
  if (item['二级分类'] && item['二级分类'].trim()) {
    tags.push(item['二级分类'].trim());
  }

  // 添加标签字段(可能有多个,用逗号分隔)
  if (item['标签'] && item['标签'].trim()) {
    const additionalTags = item['标签'].split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    tags.push(...additionalTags);
  }

  return tags.length > 0 ? tags : ['科技创新'];
}

// 模拟前端过滤逻辑
function filterValidTags(tags) {
  return tags.filter(tag => tag && tag !== '0' && tag !== 'AI创投日报');
}

console.log('📊 前10条数据标签对比:\n');

apiData.data.slice(0, 10).forEach((item, i) => {
  const newTags = buildTags(item);
  const validTags = filterValidTags(newTags);
  const displayTags = validTags.slice(0, 3);

  console.log(`[${i + 1}] ${item['企业介绍']?.substring(0, 30) || '无介绍'}...`);
  console.log(`    原始-二级分类: ${item['二级分类'] || '无'}`);
  console.log(`    原始-标签: ${item['标签'] || '无'}`);
  console.log(`    ❌ 旧逻辑: [细分领域=${item['细分领域'] || 'AI'}, 二级分类=${item['二级分类'] || '科技创新'}]`);
  console.log(`    ✅ 新逻辑: [${displayTags.join(', ')}]`);
  console.log('');
});

// 统计标签类型分布
console.log('📈 标签类型统计:\n');
const tagStats = {};

apiData.data.forEach(item => {
  const tags = buildTags(item);
  const validTags = filterValidTags(tags);
  validTags.forEach(tag => {
    tagStats[tag] = (tagStats[tag] || 0) + 1;
  });
});

const sortedTags = Object.entries(tagStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15);

sortedTags.forEach(([tag, count]) => {
  const bar = '█'.repeat(Math.min(count, 20));
  console.log(`${tag.padEnd(20)} ${bar} ${count}`);
});

console.log('\n✅ 标签逻辑测试完成!');
