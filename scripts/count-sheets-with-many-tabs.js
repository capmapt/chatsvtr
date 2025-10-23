#!/usr/bin/env node

/**
 * 统计有多少Sheet包含超过3个工作表（可能有数据丢失）
 */

async function countSheetsWithManyTabs() {
  console.log('🔍 统计包含多个工作表的Sheet\n');

  // 获取access token
  const authRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: 'cli_a8e2014cbe7d9013',
      app_secret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0'
    })
  });

  const authData = await authRes.json();
  const token = authData.tenant_access_token;
  console.log('✅ 认证成功\n');

  // 从JSON获取所有Sheet
  const fs = require('fs');
  const path = require('path');
  const dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

  const sheets = data.nodes.filter(n => n.objType === 'sheet');
  console.log(`总Sheet数: ${sheets.length}\n`);

  const sheetsWithManyTabs = [];
  const sheetsWithHiddenTabs = [];

  for (const sheet of sheets.slice(0, 10)) {  // 先检查前10个
    const sheetToken = sheet.objToken;

    try {
      const sheetsRes = await fetch(
        `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}/sheets/query`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const sheetsData = await sheetsRes.json();

      if (sheetsData.code === 0) {
        const tabs = sheetsData.data?.sheets || [];
        const hiddenTabs = tabs.filter(t => t.hidden);

        if (tabs.length > 3) {
          sheetsWithManyTabs.push({
            name: sheet.title,
            totalTabs: tabs.length,
            hiddenTabs: hiddenTabs.length,
            tabs: tabs.map(t => `${t.title}${t.hidden ? '🔒' : ''}`)
          });
        }

        if (hiddenTabs.length > 0) {
          sheetsWithHiddenTabs.push({
            name: sheet.title,
            totalTabs: tabs.length,
            hiddenTabs: hiddenTabs.length,
            hiddenTabNames: hiddenTabs.map(t => t.title)
          });
        }
      }
    } catch (error) {
      console.log(`⚠️ ${sheet.title}: ${error.message}`);
    }
  }

  console.log('='.repeat(60));
  console.log(`\n📊 包含超过3个工作表的Sheet (前10个中):\n`);

  if (sheetsWithManyTabs.length > 0) {
    sheetsWithManyTabs.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   总工作表: ${s.totalTabs} (隐藏: ${s.hiddenTabs})`);
      console.log(`   ⚠️ 可能丢失: ${s.totalTabs - 3} 个工作表的数据`);
      console.log(`   工作表列表: ${s.tabs.slice(0, 6).join(', ')}${s.tabs.length > 6 ? '...' : ''}`);
      console.log('');
    });
  } else {
    console.log('   ✅ 没有找到（前10个中）\n');
  }

  console.log('='.repeat(60));
  console.log(`\n🔒 包含隐藏工作表的Sheet (前10个中):\n`);

  if (sheetsWithHiddenTabs.length > 0) {
    sheetsWithHiddenTabs.forEach((s, i) => {
      console.log(`${i + 1}. ${s.name}`);
      console.log(`   总工作表: ${s.totalTabs} (隐藏: ${s.hiddenTabs})`);
      console.log(`   隐藏工作表: ${s.hiddenTabNames.join(', ')}`);
      console.log('');
    });
  } else {
    console.log('   ✅ 没有找到（前10个中）\n');
  }

  console.log('='.repeat(60));
  console.log('\n💡 结论:');
  console.log(`   - 检查了前10个Sheet`);
  console.log(`   - ${sheetsWithManyTabs.length} 个Sheet包含超过3个工作表`);
  console.log(`   - ${sheetsWithHiddenTabs.length} 个Sheet包含隐藏工作表`);
  console.log(`   - 可能需要修改同步脚本移除3个工作表的限制`);
  console.log('='.repeat(60));
}

countSheetsWithManyTabs().catch(console.error);
