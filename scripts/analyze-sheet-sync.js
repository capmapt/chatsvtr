#!/usr/bin/env node

/**
 * 分析Sheet同步结果
 */

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('📊 Sheet同步结果分析\n');
console.log('='.repeat(60));

// 过滤出所有Sheet节点
const sheetNodes = data.nodes.filter(node => node.objType === 'sheet' || node.docType === 'sheet');

console.log(`\n总Sheet节点数: ${sheetNodes.length}\n`);

// 按内容长度分类
const shortContent = [];
const longContent = [];

sheetNodes.forEach(node => {
  const contentLength = node.content?.length || 0;

  if (contentLength > 1000) {
    longContent.push({ title: node.title, length: contentLength });
  } else {
    shortContent.push({ title: node.title, length: contentLength });
  }
});

console.log(`✅ 成功获取数据 (内容 > 1000字符): ${longContent.length}`);
console.log(`❌ 仅有元数据 (内容 <= 1000字符): ${shortContent.length}\n`);

console.log('='.repeat(60));
console.log('\n✅ 成功获取数据的Sheet:\n');
longContent.forEach((item, i) => {
  console.log(`${i + 1}. ${item.title}`);
  console.log(`   内容长度: ${item.length.toLocaleString()} 字符\n`);
});

if (shortContent.length > 0) {
  console.log('='.repeat(60));
  console.log('\n❌ 仅有元数据的Sheet:\n');
  shortContent.forEach((item, i) => {
    console.log(`${i + 1}. ${item.title} (${item.length} 字符)`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('\n📈 Sheet数据同步率:');
console.log(`   成功: ${longContent.length} / ${sheetNodes.length} = ${(longContent.length / sheetNodes.length * 100).toFixed(1)}%`);
console.log('='.repeat(60));
