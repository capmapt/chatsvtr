const https = require('https');

const options = {
  hostname: '3a3c7361.chatsvtr.pages.dev',
  path: '/api/d1/query?table=published_articles&limit=10&order_by=publish_date&order=desc',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('📊 前10条published_articles记录:\n');
        result.data.forEach((article, idx) => {
          console.log(`${idx + 1}. ${article.meta_title || article.title}`);
          console.log(`   node_token: ${article.node_token}`);
          console.log(`   published_url: ${article.published_url}`);
          console.log(`   slug: ${article.slug}`);
          console.log('');
        });
      } else {
        console.error('❌ 查询失败:', result.error);
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
