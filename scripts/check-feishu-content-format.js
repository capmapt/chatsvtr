const fs = require('fs');

// 读取飞书数据
const feishuData = JSON.parse(fs.readFileSync('./assets/data/rag/enhanced-feishu-full-content.json', 'utf-8'));

// 找一个示例节点
const sampleNode = feishuData.nodes.find(n => n.title && n.title.includes('AI创投观察'));

if (sampleNode) {
  console.log('📄 节点信息:');
  console.log('- 标题:', sampleNode.title);
  console.log('- 字段:', Object.keys(sampleNode).join(', '));
  console.log('\n📝 内容类型:');
  console.log('- content 长度:', (sampleNode.content || '').length);
  console.log('- 是否有 raw_content:', !!sampleNode.raw_content);
  console.log('- 是否有 blocks:', !!sampleNode.blocks);

  if (sampleNode.raw_content) {
    console.log('\n🔍 raw_content 结构:');
    console.log(JSON.stringify(sampleNode.raw_content, null, 2).substring(0, 500));
  }

  console.log('\n📖 content 预览:');
  console.log((sampleNode.content || '').substring(0, 300));
} else {
  console.log('❌ 未找到示例节点');
}

// 检查是否有任何节点包含图片信息
console.log('\n\n🖼️ 检查图片信息:');
const nodesWithImages = feishuData.nodes.filter(n => {
  const content = JSON.stringify(n);
  return content.includes('image') || content.includes('Image') || content.includes('.png') || content.includes('.jpg');
});

console.log(`- 包含图片相关信息的节点数: ${nodesWithImages.length}`);
if (nodesWithImages.length > 0) {
  console.log('- 示例节点:', nodesWithImages[0].title);
}
