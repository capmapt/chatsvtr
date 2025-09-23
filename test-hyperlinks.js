console.log('🧪 测试生产环境超链接功能...');

async function testHyperlinks() {
  try {
    // 首先获取数据
    const response = await fetch('https://svtr.ai/api/wiki-funding-sync');
    const data = await response.json();
    const records = data.records || data.data || [];

    if (records.length === 0) {
      console.log('❌ 没有获取到数据记录');
      return;
    }

    console.log(`✅ 获取到 ${records.length} 条记录`);

    // 查找有官网和联系方式的记录
    const recordsWithLinks = records.filter(r => r.companyWebsite || r.contactInfo);
    console.log(`📊 有链接信息的记录: ${recordsWithLinks.length} 条`);

    // 详细显示前3个有链接的记录
    recordsWithLinks.slice(0, 3).forEach((record, index) => {
      console.log(`\\n📋 记录 ${index + 1}: ${record.companyName}`);

      if (record.companyWebsite) {
        console.log(`  🌐 公司官网: ${record.companyWebsite}`);
      }

      if (record.contactInfo) {
        console.log(`  📞 联系方式: ${record.contactInfo}`);
      }

      if (record.teamBackground) {
        console.log(`  👥 团队背景长度: ${record.teamBackground.length} 字符`);

        // 检查是否包含可链接的人名
        const chineseNames = record.teamBackground.match(/([A-Za-z\\u4e00-\\u9fa5]{2,4})\\s*，/g);
        const englishNames = record.teamBackground.match(/([A-Z][a-z]+\\s+[A-Z][a-z]+)/g);

        if (chineseNames || englishNames) {
          console.log(`  🔗 检测到姓名:`, {
            中文姓名: chineseNames?.map(name => name.replace('，', '')) || [],
            英文姓名: englishNames || []
          });
        }
      }
    });

    // 重点测试Upscale AI
    const upscale = records.find(r => r.companyName && r.companyName.includes('Upscale'));
    if (upscale) {
      console.log('\\n🎯 Upscale AI 超链接测试:');
      console.log('- 公司名称:', upscale.companyName);
      console.log('- 公司官网:', upscale.companyWebsite || '无');
      console.log('- 联系方式:', upscale.contactInfo || '无');
      console.log('- 团队背景包含:', upscale.teamBackground ? '是' : '否');

      if (upscale.teamBackground && upscale.contactInfo) {
        console.log('\\n🔍 模拟超链接处理:');

        // 模拟前端超链接处理逻辑
        let enhancedText = upscale.teamBackground;
        const contactInfo = upscale.contactInfo;

        // 匹配英文姓名模式 (First Last)
        const englishNamePattern = /([A-Z][a-z]+\\s+[A-Z][a-z]+)/g;
        enhancedText = enhancedText.replace(englishNamePattern, (match, name) => {
          const cleanName = name.trim();
          return `<a href="${contactInfo}" target="_blank" class="founder-link" title="访问 ${cleanName} 的联系方式">${cleanName}</a>`;
        });

        // 匹配中文或混合姓名模式，但排除已经被链接包围的文本
        const namePattern = /([A-Za-z\\u4e00-\\u9fa5]{2,4})\\s*，/g;
        enhancedText = enhancedText.replace(namePattern, (match, name) => {
          const cleanName = name.trim();
          // 检查这个名字是否已经在链接中
          if (match.includes('<a href') || match.includes('</a>')) {
            return match;
          }
          return `<a href="${contactInfo}" target="_blank" class="founder-link" title="访问 ${cleanName} 的联系方式">${cleanName}</a>，`;
        });

        console.log('✅ 处理后的HTML:');
        console.log(enhancedText.substring(0, 300) + '...');
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testHyperlinks();