const https = require('https');

// 检查D1中所有表的数据
const checkTable = (table, limit = 5) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'b0753c7b.chatsvtr.pages.dev',
      path: `/api/d1/query?table=${table}&limit=${limit}`,
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
  console.log('🔍 检查D1数据库中的表\n');

  const tables = [
    'knowledge_base_nodes',
    'knowledge_base_content',
    'knowledge_base_relations',
    'published_articles',
    'companies',
    'investors',
    'investments'
  ];

  for (const table of tables) {
    console.log(`📊 ${table}:`);
    try {
      const result = await checkTable(table, 3);
      if (result.success) {
        console.log(`   ✅ ${result.data.length} 条记录`);
        if (result.data.length > 0) {
          console.log(`   字段: ${Object.keys(result.data[0]).join(', ')}`);
          console.log(`   示例: ${JSON.stringify(result.data[0]).substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ 查询失败: ${result.error}`);
      }
    } catch (e) {
      console.log(`   ❌ 错误: ${e.message}`);
    }
    console.log('');
  }
})();
