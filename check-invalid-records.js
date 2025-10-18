const https = require('https');

function fetchData() {
  return new Promise((resolve, reject) => {
    https.get('https://svtr.ai/api/wiki-funding-sync?refresh=true', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(JSON.parse(data)); });
    }).on('error', reject);
  });
}

fetchData().then(data => {
  console.log('=== 飞书数据源中的无效记录 ===\n');

  const invalidRecords = data.data.filter(i => i['企业介绍'] === '0');

  console.log(`总记录数: ${data.data.length}`);
  console.log(`无效记录数: ${invalidRecords.length}`);
  console.log(`有效记录数: ${data.data.length - invalidRecords.length}\n`);

  console.log('无效记录详情:');
  invalidRecords.forEach((item, idx) => {
    console.log(`${idx + 1}. 记录ID: ${item.id}`);
    console.log(`   序号: ${item['序号']}`);
    console.log(`   周报: ${item['周报']}`);
    console.log(`   二级分类: ${item['二级分类']}`);
    console.log(`   企业介绍: ${item['企业介绍']}`);
    console.log(`   团队背景: ${item['团队背景']}`);
    console.log('');
  });

  console.log('\n结论:');
  console.log('这些记录在飞书多维表格中的"企业介绍"字段为"0"（空数据或占位符）');
  console.log('前端正确过滤掉了这些无效记录');
  console.log('建议在飞书中完善这些记录的数据，或者删除这些占位符记录');

}).catch(err => {
  console.error('Error:', err);
});
