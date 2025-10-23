#!/usr/bin/env node

/**
 * 检查Sheet中的隐藏工作表是否被同步
 */

async function checkHiddenSheets() {
  console.log('🔍 检查Sheet中的隐藏工作表\n');

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

  // AI融资概览的token (从JSON中获取)
  const sheetToken = 'IYOBsHnakh68uytzPxTcAkTvnyg';

  console.log('='.repeat(60));
  console.log('\n📊 Sheet: AI融资概览');
  console.log(`   Token: ${sheetToken}\n`);

  // 获取所有工作表（包括隐藏的）
  const sheetsRes = await fetch(
    `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}/sheets/query`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const sheetsData = await sheetsRes.json();

  if (sheetsData.code === 0) {
    const sheets = sheetsData.data?.sheets || [];
    console.log(`✅ API返回 ${sheets.length} 个工作表:\n`);

    sheets.forEach((sheet, i) => {
      console.log(`${i + 1}. ${sheet.title}`);
      console.log(`   - Sheet ID: ${sheet.sheet_id}`);
      console.log(`   - 隐藏状态: ${sheet.hidden ? '🔒 隐藏' : '👁️ 可见'}`);
      console.log(`   - 行数: ${sheet.row_count || 'N/A'}`);
      console.log(`   - 列数: ${sheet.column_count || 'N/A'}`);
      console.log('');
    });

    // 统计隐藏工作表
    const hiddenSheets = sheets.filter(s => s.hidden);
    const visibleSheets = sheets.filter(s => !s.hidden);

    console.log('='.repeat(60));
    console.log('\n📊 统计:');
    console.log(`   总工作表数: ${sheets.length}`);
    console.log(`   可见工作表: ${visibleSheets.length}`);
    console.log(`   隐藏工作表: ${hiddenSheets.length} ${hiddenSheets.length > 0 ? '⚠️' : '✅'}`);

    if (hiddenSheets.length > 0) {
      console.log('\n🔒 隐藏的工作表列表:');
      hiddenSheets.forEach(sheet => {
        console.log(`   - ${sheet.title} (ID: ${sheet.sheet_id})`);
      });
    }

  } else {
    console.log(`❌ 获取工作表列表失败: ${sheetsData.msg}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 下一步:');
  console.log('   1. 对比同步日志中处理的工作表数量');
  console.log('   2. 检查D1数据库中是否包含隐藏工作表的数据');
  console.log('='.repeat(60));
}

checkHiddenSheets().catch(console.error);
