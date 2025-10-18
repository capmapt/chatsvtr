const fs = require('fs');
const https = require('https');

// Fetch data from API
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

console.log('=== API数据分析 ===');
console.log('总数据量:', data.data.length, '条\n');

console.log('前10条公司详情:');
data.data.slice(0, 10).forEach((item, i) => {
  const desc = item['企业介绍'] || '';
  const company = desc.split('，')[0] || '(无企业介绍)';
  const stage = item['二级分类'] || '';

  // 提取融资轮次
  let round = '';
  if (desc.includes('完成') && desc.includes('轮')) {
    const match = desc.match(/完成[^。]*?轮/);
    if (match) round = match[0];
  }

  console.log(`${i+1}. 公司: ${company}`);
  console.log(`   二级分类: ${stage}`);
  console.log(`   融资: ${round}`);
  console.log('');
});

// 检查数据过滤逻辑
console.log('\n=== 数据过滤检查 ===');
console.log('被过滤掉的记录:\n');

const filteredData = data.data.filter(item => {
  const desc = item['企业介绍'] || '';
  const companyName = desc.split('，')[0];
  const isValid = companyName &&
                  companyName.trim() !== '' &&
                  companyName.trim() !== '0' &&
                  companyName !== 'null';

  if (!isValid) {
    console.log(`❌ 公司名: "${companyName}"`);
    console.log(`   企业介绍: ${desc.substring(0, 100)}...`);
    console.log(`   二级分类: ${item['二级分类']}`);
    console.log('');
  }
  return isValid;
});

console.log(`\n过滤前: ${data.data.length}条`);
console.log(`过滤后: ${filteredData.length}条`);
console.log(`被过滤: ${data.data.length - filteredData.length}条`);

}).catch(err => {
  console.error('Error fetching data:', err);
});
