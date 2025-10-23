#!/usr/bin/env node

/**
 * 检查Bitable中的所有表格（包括隐藏表格）
 */

const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('🔍 检查Bitable多维表格中的表格（包括隐藏表格）\n');
console.log('='.repeat(60));

// 过滤出所有Bitable节点
const bitableNodes = data.nodes.filter(node =>
  node.objType === 'bitable' || node.docType === 'bitable'
);

console.log(`\n总Bitable节点数: ${bitableNodes.length}\n`);

bitableNodes.forEach((node, index) => {
  console.log(`\n${index + 1}. ${node.title}`);
  console.log('   '.repeat(0) + '─'.repeat(50));

  const contentStr = node.content;
  console.log(`   内容长度: ${contentStr?.length || 0} 字符`);

  // 检查内容中是否包含表格信息
  if (contentStr && contentStr.includes('数据表')) {
    // 尝试提取表格数量
    const tableMatch = contentStr.match(/(\d+)\s*个数据表/);
    if (tableMatch) {
      console.log(`   📊 包含 ${tableMatch[1]} 个数据表`);
    }

    // 提取表格名称
    const tableNameMatches = contentStr.match(/##\s*数据表\s*\d+:\s*(.+)/g);
    if (tableNameMatches) {
      console.log(`\n   数据表列表:`);
      tableNameMatches.forEach((match, i) => {
        const name = match.replace(/##\s*数据表\s*\d+:\s*/, '').trim();
        console.log(`      ${i + 1}. ${name}`);
      });
    }

    // 检查记录数
    const recordMatches = contentStr.match(/\*\*记录数量：\*\*\s*(\d+)/g);
    if (recordMatches && recordMatches.length > 0) {
      const totalRecords = recordMatches.reduce((sum, match) => {
        const count = parseInt(match.match(/(\d+)/)[1]);
        return sum + count;
      }, 0);
      console.log(`\n   总记录数: ${totalRecords}`);
    }
  } else {
    console.log(`   ⚠️ 内容中未找到表格信息`);
  }

  // 显示内容预览
  if (contentStr && contentStr.length > 100) {
    console.log(`\n   内容预览:`);
    console.log('   ' + contentStr.substring(0, 200).replace(/\n/g, '\n   ') + '...');
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n📈 Bitable同步统计:');

const totalTables = bitableNodes.reduce((sum, node) => {
  const contentStr = node.content;
  if (!contentStr) return sum;

  const tableMatch = contentStr.match(/(\d+)\s*个数据表/);
  return sum + (tableMatch ? parseInt(tableMatch[1]) : 0);
}, 0);

const totalRecords = bitableNodes.reduce((sum, node) => {
  const contentStr = node.content;
  if (!contentStr) return sum;

  const recordMatches = contentStr.match(/\*\*记录数量：\*\*\s*(\d+)/g);
  if (recordMatches) {
    return sum + recordMatches.reduce((s, match) => {
      const count = parseInt(match.match(/(\d+)/)[1]);
      return s + count;
    }, 0);
  }
  return sum;
}, 0);

console.log(`   Bitable节点数: ${bitableNodes.length}`);
console.log(`   总数据表数: ${totalTables}`);
console.log(`   总记录数: ${totalRecords}`);
if (bitableNodes.length > 0) {
  console.log(`   平均每个Bitable包含: ${(totalTables / bitableNodes.length).toFixed(1)} 个表`);
}

console.log('='.repeat(60));
