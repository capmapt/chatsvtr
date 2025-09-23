console.log('🧪 测试Wrangler API端点...');

async function testWranglerAPI() {
  try {
    const response = await fetch('http://127.0.0.1:3000/api/wiki-funding-sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 API响应状态:', response.status);

    if (!response.ok) {
      console.error('❌ API请求失败:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log('✅ API响应成功');
    console.log('📊 记录数量:', data.records?.length || 0);
    console.log('📊 元数据:', JSON.stringify(data.meta, null, 2));

    // 查找Upscale AI
    if (data.records && data.records.length > 0) {
      const upscale = data.records.find(r => r.companyName && r.companyName.includes('Upscale'));
      if (upscale) {
        console.log('\n🎯 找到Upscale AI记录:');
        console.log('- 公司名称:', upscale.companyName);
        console.log('- 有团队背景:', upscale.teamBackground ? '是' : '否');
        console.log('- teamBackground字段类型:', typeof upscale.teamBackground);
        if (upscale.teamBackground) {
          console.log('- 团队背景长度:', upscale.teamBackground.length, '字符');
          console.log('- 团队背景预览:', upscale.teamBackground.substring(0, 200) + '...');
        } else {
          console.log('- 团队背景: 未定义');
        }

        // 打印整个对象的结构
        console.log('\n📋 完整记录结构:');
        console.log(JSON.stringify(upscale, null, 2));
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

testWranglerAPI();