const http = require('http');

// 获取API数据
http.get('http://127.0.0.1:3000/api/wiki-funding-sync', (res) => {
  let rawData = '';
  res.on('data', (chunk) => { rawData += chunk; });
  res.on('end', () => {
    const data = JSON.parse(rawData);
    const validRecords = data.data.filter(r => r['企业介绍'] !== '0');

    console.log('=== 融资轮次提取分析 ===\n');

    const issues = [];
    const stageStats = {};

    validRecords.slice(0, 30).forEach((record, idx) => {
      const intro = record['企业介绍'] || '';
      const companyName = record['公司名称'];

      // 提取文本中的轮次信息
      let textStage = '未找到';

      if (/种子轮/.test(intro)) textStage = '种子轮';
      else if (/Seed(?!轮)/.test(intro)) textStage = 'Seed (英文)';
      else if (/天使轮/.test(intro)) textStage = '天使轮';
      else if (/Angel(?!轮)/.test(intro)) textStage = 'Angel (英文)';
      else if (/pre-IPO|Pre IPO/i.test(intro)) textStage = 'pre-IPO';
      else if (/IPO/.test(intro)) textStage = 'IPO';
      else if (/战略融资/.test(intro)) textStage = '战略融资';
      else if (/([A-H])\+?轮/.test(intro)) {
        const m = intro.match(/([A-H])\+?轮/);
        textStage = m[0];
      }
      else if (/Pre-Series\s*([A-Z])\s*SAFE/i.test(intro)) {
        textStage = 'Pre-Series SAFE';
      }
      else if (/SAFE/.test(intro)) textStage = 'SAFE';

      // 统计
      if (!stageStats[textStage]) stageStats[textStage] = [];
      stageStats[textStage].push(companyName);

      // 检查是否是英文标签
      if (textStage.includes('英文') || textStage === 'SAFE' || textStage === 'Seed (英文)' || textStage === 'Angel (英文)') {
        issues.push({
          index: idx + 1,
          company: companyName,
          found: textStage,
          excerpt: intro.substring(0, 100)
        });
      }

      console.log(`${idx + 1}. ${companyName}: ${textStage}`);
    });

    console.log('\n=== 问题记录(英文标签或未映射) ===');
    if (issues.length === 0) {
      console.log('✅ 所有轮次标签都已正确映射为中文');
    } else {
      issues.forEach(issue => {
        console.log(`\n${issue.index}. ${issue.company}`);
        console.log(`   发现: ${issue.found}`);
        console.log(`   摘要: ${issue.excerpt}...`);
      });
    }

    console.log('\n=== 轮次统计 ===');
    Object.entries(stageStats).sort((a, b) => b[1].length - a[1].length).forEach(([stage, companies]) => {
      console.log(`${stage}: ${companies.length}条`);
      if (stage.includes('英文') || stage === 'SAFE') {
        console.log(`  → 包括: ${companies.slice(0, 3).join(', ')}${companies.length > 3 ? '...' : ''}`);
      }
    });
  });
});
