console.log('🔍 测试完整API数据结构...');

fetch('https://svtr.ai/api/wiki-funding-sync')
.then(response => response.json())
.then(data => {
  console.log('\n📊 API响应结构:');
  console.log('- success:', data.success);
  console.log('- count:', data.count);
  console.log('- source:', data.source);
  console.log('- lastUpdate:', data.lastUpdate);

  if (data.data && data.data.length > 0) {
    console.log('\n📝 第一条记录的完整字段:');
    const firstRecord = data.data[0];
    Object.keys(firstRecord).forEach(key => {
      const value = firstRecord[key];
      if (typeof value === 'string' && value.length > 100) {
        console.log(`- ${key}: "${value.substring(0, 100)}..."`);
      } else {
        console.log(`- ${key}:`, value);
      }
    });

    console.log('\n🧪 关键字段检查:');
    console.log('- teamBackground:', firstRecord.teamBackground ? '✅ 存在' : '❌ 缺失');
    console.log('- companyWebsite:', firstRecord.companyWebsite ? '✅ 存在' : '❌ 缺失');
    console.log('- contactInfo:', firstRecord.contactInfo ? '✅ 存在' : '❌ 缺失');
    console.log('- companyName:', firstRecord.companyName ? '✅ 存在' : '❌ 缺失');
    console.log('- tags:', firstRecord.tags ? '✅ 存在' : '❌ 缺失');
  }
}).catch(console.error);