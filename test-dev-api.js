console.log('🧪 测试开发环境API...');

fetch('http://127.0.0.1:3000/api/wiki-funding-sync')
.then(response => response.json())
.then(data => {
  console.log('\n✅ 开发环境API工作正常！');
  console.log('- success:', data.success);
  console.log('- count:', data.count);
  console.log('- source:', data.source);

  if (data.data && data.data.length > 0) {
    const firstRecord = data.data[0];
    console.log('\n📝 第一条记录:');
    console.log('- 公司名:', firstRecord.companyName);
    console.log('- 团队背景:', firstRecord.teamBackground ? '✅ 存在' : '❌ 缺失');
    console.log('- 公司官网:', firstRecord.companyWebsite ? '✅ 存在' : '❌ 缺失');
    console.log('- 联系方式:', firstRecord.contactInfo ? '✅ 存在' : '❌ 缺失');
  }
})
.catch(error => {
  console.error('❌ 开发环境API测试失败:', error);
});