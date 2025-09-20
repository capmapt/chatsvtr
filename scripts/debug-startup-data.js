#!/usr/bin/env node

/**
 * 调试Startup表格的实际数据内容
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',
  sheetToken: 'PERPsZO0ph5nZztjBTSctDAdnYg',
  startupSheetId: 'GvCmOW'
};

async function getAccessToken() {
  const response = await fetch(`${config.baseUrl}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret
    })
  });
  const data = await response.json();
  return data.code === 0 ? data.tenant_access_token : null;
}

async function debugStartupData() {
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ 认证失败');
    return;
  }

  console.log('🔍 调试Startup表格实际数据...');

  try {
    // 获取第2行标题
    console.log('\n📋 获取标题行...');
    const headersResponse = await fetch(`${config.baseUrl}/sheets/v2/spreadsheets/${config.sheetToken}/values/${config.startupSheetId}!A2:Z2`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const headersData = await headersResponse.json();

    if (headersData.code === 0 && headersData.data.valueRange?.values?.[0]) {
      const headers = headersData.data.valueRange.values[0];
      console.log('标题行内容:');
      headers.forEach((header, index) => {
        const text = extractCellText(header);
        console.log(`  列${String.fromCharCode(65 + index)} (${index}): "${text}"`);
      });

      // 找到关键列
      const companyNameIndex = headers.findIndex(h => {
        const text = extractCellText(h);
        return text.includes('公司名称') || text.includes('公司');
      });

      console.log(`\n🎯 公司名称列索引: ${companyNameIndex}`);
    }

    // 获取第3-10行的实际数据
    console.log('\n📄 获取数据行 (第3-10行)...');
    const dataResponse = await fetch(`${config.baseUrl}/sheets/v2/spreadsheets/${config.sheetToken}/values/${config.startupSheetId}!A3:Z10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dataResult = await dataResponse.json();

    if (dataResult.code === 0 && dataResult.data.valueRange?.values) {
      const rows = dataResult.data.valueRange.values;
      console.log(`获取到 ${rows.length} 行数据:`);

      rows.forEach((row, index) => {
        console.log(`\n第${index + 3}行 (${row.length}列):`);
        row.forEach((cell, cellIndex) => {
          const text = extractCellText(cell);
          if (text && text.trim() !== '') {
            console.log(`  列${String.fromCharCode(65 + cellIndex)}: "${text}"`);
          }
        });
      });
    }

    // 检查第3行是否有公式
    console.log('\n🔍 检查第3行是否有公式...');
    const formulaResponse = await fetch(`${config.baseUrl}/sheets/v2/spreadsheets/${config.sheetToken}/values/${config.startupSheetId}!A3:A3`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const formulaResult = await formulaResponse.json();

    if (formulaResult.code === 0) {
      console.log('第3行A列内容:', JSON.stringify(formulaResult.data, null, 2));
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

function extractCellText(cell) {
  if (!cell) return '';
  if (typeof cell === 'string') return cell;
  if (Array.isArray(cell)) {
    return cell.map(segment => {
      if (typeof segment === 'string') return segment;
      if (segment.text) return segment.text;
      return JSON.stringify(segment);
    }).join('');
  }
  if (cell.text) return cell.text;
  return String(cell);
}

debugStartupData().catch(console.error);