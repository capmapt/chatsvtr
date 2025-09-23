console.log('🧪 强制刷新生产环境缓存...');

async function forceRefreshProductionCache() {
  try {
    console.log('🔄 正在强制刷新生产环境缓存...');
    const response = await fetch('https://svtr.ai/api/wiki-funding-sync?refresh=true', {
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
    console.log('✅ 缓存刷新成功');
    console.log('📊 记录数量:', data.records?.length || data.data?.length || data.count || 0);
    console.log('📊 数据源:', data.source);
    console.log('📊 元数据:', JSON.stringify(data.meta || {}, null, 2));

    // 查找Upscale AI
    const records = data.records || data.data || [];
    if (records && records.length > 0) {
      const upscale = records.find(r => r.companyName && r.companyName.includes('Upscale'));
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
      } else {
        console.log('⚠️ 未找到Upscale AI记录');
        console.log('前5个记录的公司名称和团队背景状态:');
        records.slice(0, 5).forEach((r, i) => {
          const hasTeamBg = r.teamBackground ? '✅' : '❌';
          console.log(`  ${i+1}. ${r.companyName || '未知'} ${hasTeamBg} 团队背景`);
        });
      }

      // 统计有团队背景的记录数量
      const recordsWithTeamBg = records.filter(r => r.teamBackground && r.teamBackground.trim());
      console.log(`\n📊 统计: ${recordsWithTeamBg.length}/${records.length} 条记录有团队背景信息`);
    }
  } catch (error) {
    console.error('❌ 强制刷新缓存失败:', error.message);
  }
}

forceRefreshProductionCache();