const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./assets/data/sample-rich-content.json', 'utf-8'));

console.log('📊 块类型统计:');
const typeNames = {
  1: 'Page(页面)',
  2: 'Text(段落)',
  3: 'Heading(标题)',
  5: 'Bullet(列表项)',
  12: 'Ordered(有序列表项)',
  27: 'Image(图片)',
  30: 'Table(表格)',
  999: 'Unknown(未知)'
};

Object.entries(data.blockTypes).forEach(([type, count]) => {
  console.log(`  类型 ${type} [${typeNames[type] || 'Unknown'}]: ${count}个`);
});

console.log('\n🖼️ 查找图片块:');
const imageBlocks = data.blocks.filter(b => b.block_type === 27);
console.log(`找到 ${imageBlocks.length} 个图片块`);

if (imageBlocks.length > 0) {
  console.log('\n第一个图片块结构:');
  console.log(JSON.stringify(imageBlocks[0], null, 2));
}

console.log('\n📝 查找文本段落块:');
const textBlocks = data.blocks.filter(b => b.block_type === 2);
console.log(`找到 ${textBlocks.length} 个文本段落`);
if (textBlocks.length > 0) {
  console.log('\n第一个段落块结构:');
  console.log(JSON.stringify(textBlocks[0], null, 2).substring(0, 500));
}

console.log('\n🏷️ 查找标题块:');
const headingBlocks = data.blocks.filter(b => b.block_type === 3);
console.log(`找到 ${headingBlocks.length} 个标题`);
if (headingBlocks.length > 0) {
  console.log('\n第一个标题块结构:');
  console.log(JSON.stringify(headingBlocks[0], null, 2).substring(0, 500));
}
