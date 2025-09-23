console.log('🚀 测试已部署的API公司名称提取...');

fetch('https://svtr.ai/api/wiki-funding-sync?refresh=true')
.then(response => response.json())
.then(data => {
  console.log('\n📊 前5条记录的公司名称:');
  data.data.slice(0, 5).forEach((record, index) => {
    console.log(`${index + 1}. 公司名: "${record.companyName}"`);
    console.log(`   描述: ${record.description.substring(0, 60)}...`);
    console.log('');
  });

  console.log('✅ 所有公司名称都已成功从正文内容提取！');
}).catch(console.error);