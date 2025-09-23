console.log('🧪 测试生产环境API...');

async function testProductionAPI() {
  try {
    const response = await fetch('https://svtr.ai/api/wiki-funding-sync', {
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
          console.log('- 团队背景: undefined/null');
        }

        // 检查对象的所有键
        console.log('\n📋 记录包含的字段:', Object.keys(upscale).sort());

        // 检查是否有description字段作为对比
        if (upscale.description) {
          console.log('- 公司描述长度:', upscale.description.length, '字符');
          console.log('- 公司描述预览:', upscale.description.substring(0, 100) + '...');
        }
      } else {
        console.log('⚠️ 未找到Upscale AI记录');
        console.log('前5个记录的公司名称:');
        data.records.slice(0, 5).forEach((r, i) => {
          const hasTeamBg = r.teamBackground ? '✅' : '❌';
          console.log(`  ${i+1}. ${r.companyName || '未知'} ${hasTeamBg} 团队背景`);
        });
      }
    }
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
  }
}

testProductionAPI();