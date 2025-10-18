const https = require('https');

https.get('https://svtr.ai/api/wiki-funding-sync?refresh=true', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const total = json.data.length;
    const valid = json.data.filter(i => i['企业介绍'] !== '0');
    const invalid = total - valid.length;

    console.log('=== 数据源统计 ===');
    console.log('API返回总记录数:', total);
    console.log('有效记录数:', valid.length);
    console.log('无效占位符记录数:', invalid);
    console.log('');
    console.log('前5条有效记录:');
    valid.slice(0, 5).forEach((i, idx) => {
      const company = i['企业介绍'].split('，')[0];
      console.log(`${idx + 1}. ${company} (序号${i['序号']})`);
    });
    console.log('');
    console.log('无效记录的序号范围:', json.data.filter(i => i['企业介绍'] === '0').map(i => i['序号']).join(', '));
  });
}).on('error', console.error);
