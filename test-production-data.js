const https = require('https');

console.log('=== 测试svtr.ai生产环境数据 ===\n');

// 测试API端点
console.log('1. 测试API端点: https://svtr.ai/api/wiki-funding-sync');
https.get('https://svtr.ai/api/wiki-funding-sync?refresh=true', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log(`   ✅ API正常返回`);
      console.log(`   总记录数: ${json.data.length}`);
      console.log(`   有效记录: ${json.data.filter(i => i['企业介绍'] !== '0').length}`);
      console.log(`   第一条公司: ${json.data[0]['企业介绍'].split('，')[0]}`);
      console.log('');

      // 测试前端页面
      console.log('2. 测试前端页面: https://svtr.ai/');
      https.get({
        hostname: 'svtr.ai',
        path: '/',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }, (res2) => {
        let html = '';
        res2.on('data', (chunk) => { html += chunk; });
        res2.on('end', () => {
          const hasMindBridge = html.includes('MindBridge');
          const hasCerebras = html.includes('Cerebras');
          const hasSSR = html.includes('funding-cards-ssr');

          console.log(`   是否包含MindBridge (虚拟数据): ${hasMindBridge ? '❌ 是' : '✅ 否'}`);
          console.log(`   是否包含Cerebras (真实数据): ${hasCerebras ? '✅ 是' : '❌ 否'}`);
          console.log(`   是否包含SSR渲染卡片: ${hasSSR ? '✅ 是' : '❌ 否'}`);
          console.log('');

          if (hasMindBridge) {
            console.log('⚠️  检测到虚拟数据MindBridge！');
            console.log('可能原因:');
            console.log('1. 前端JS在API调用失败时fallback到mockFundingData');
            console.log('2. 浏览器/CDN缓存了旧版本');
            console.log('3. API端点在页面加载时失败');
          } else if (hasCerebras) {
            console.log('✅ 显示真实数据 (Cerebras Systems)');
          } else {
            console.log('⚠️  未检测到任何创投日报数据');
          }
        });
      }).on('error', console.error);

    } catch (e) {
      console.error('   ❌ API返回数据解析失败:', e.message);
    }
  });
}).on('error', (e) => {
  console.error('   ❌ API请求失败:', e.message);
});
