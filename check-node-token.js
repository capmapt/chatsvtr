const https = require('https');

// 检查node_token对应的knowledge_base_nodes记录
const nodeToken = 'SYdxw5P8kiYOGzklwXCcBt7mnSe';

const options = {
  hostname: '3a3c7361.chatsvtr.pages.dev',
  path: `/api/d1/query?table=knowledge_base_nodes&filters=node_token:${nodeToken}`,
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js'
  }
};

console.log(`🔍 查询node_token: ${nodeToken}\n`);

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success && result.data.length > 0) {
        const node = result.data[0];
        console.log('📄 knowledge_base_nodes 记录:');
        console.log(`   title: ${node.title}`);
        console.log(`   obj_type: ${node.obj_type}`);
        console.log(`   node_token: ${node.node_token}`);
        console.log(`   parent_node_token: ${node.parent_node_token}`);
        console.log(`   has_child: ${node.has_child}`);
        console.log('');
        console.log('💡 正确的URL应该是:');
        if (node.obj_type === 'docx') {
          console.log(`   /wiki/${node.node_token}`);
        } else {
          console.log(`   未知类型: ${node.obj_type}`);
        }
      } else {
        console.log('❌ 未找到对应记录');
        console.log('响应:', JSON.stringify(result, null, 2));
      }
    } catch (e) {
      console.error('❌ 解析失败:', e.message);
      console.log('原始响应:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ 请求失败:', e.message);
});

req.end();
