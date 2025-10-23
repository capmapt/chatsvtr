const https = require('https');

// 检查D1同步后的数据状态
const checkContent = (table, nodeToken) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '1b644a13.chatsvtr.pages.dev',
      path: `/api/d1/query?table=${table}&filters=node_token:${nodeToken}`,
      method: 'GET',
      headers: { 'User-Agent': 'Node.js' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

(async () => {
  console.log('🔍 检查D1同步后的数据状态\n');

  const nodeToken = 'StZ4wqMcsipGvikIy0PcV3xUnkS'; // 第一篇文章

  // 1. 检查 knowledge_base_nodes
  console.log('1️⃣ 检查 knowledge_base_nodes 表:');
  try {
    const nodes = await checkContent('knowledge_base_nodes', nodeToken);
    if (nodes.success && nodes.data.length > 0) {
      const node = nodes.data[0];
      console.log(`   ✅ 找到节点: ${node.title}`);
      console.log(`   content_summary长度: ${node.content_summary?.length || 0} 字符`);
    } else {
      console.log('   ❌ 未找到节点');
    }
  } catch (e) {
    console.error('   ❌ 查询失败:', e.message);
  }

  console.log('');

  // 2. 检查 knowledge_base_content
  console.log('2️⃣ 检查 knowledge_base_content 表:');
  try {
    const content = await checkContent('knowledge_base_content', nodeToken);
    if (content.success && content.data.length > 0) {
      const item = content.data[0];
      console.log(`   ✅ 找到完整内容!`);
      console.log(`   full_content长度: ${item.full_content?.length || 0} 字符`);
      console.log(`   content_format: ${item.content_format}`);
      console.log(`   前100字符: ${item.full_content?.substring(0, 100)}...`);
    } else {
      console.log('   ❌ 未找到完整内容');
    }
  } catch (e) {
    console.error('   ❌ 查询失败:', e.message);
  }

  console.log('\n✅ 检查完成！');
})();
