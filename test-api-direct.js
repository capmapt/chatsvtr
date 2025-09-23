console.log('🧪 直接测试API端点...');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:8080/api/wiki-funding-sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('✅ API响应成功');
    console.log('📊 记录数量:', data.records?.length || 0);
    console.log('📊 元数据:', data.meta);

    // 查找Upscale AI
    if (data.records && data.records.length > 0) {
      const upscale = data.records.find(r => r.companyName && r.companyName.includes('Upscale'));
      if (upscale) {
        console.log('\n🎯 找到Upscale AI记录:');
        console.log('- 公司名称:', upscale.companyName);
        console.log('- 有团队背景:', upscale.teamBackground ? '是' : '否');
        if (upscale.teamBackground) {
          console.log('- 团队背景长度:', upscale.teamBackground.length, '字符');
          console.log('- 团队背景预览:', upscale.teamBackground.substring(0, 150) + '...');
        } else {
          console.log('- 团队背景: 未定义');
        }
      } else {
        console.log('⚠️ 未找到Upscale AI记录');
        console.log('前5个记录的公司名称:');
        data.records.slice(0, 5).forEach((r, i) => {
          console.log(`  ${i+1}. ${r.companyName || '未知'}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

testAPI();