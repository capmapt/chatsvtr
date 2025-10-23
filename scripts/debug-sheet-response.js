#!/usr/bin/env node

/**
 * 调试Sheet API返回的详细内容
 */

async function debugSheetResponse() {
  console.log('🔍 调试Sheet API返回内容\n');

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

  const sheetToken = 'PERPsZO0ph5nZztjBTSctDAdnYg'; // AI创投季度观察

  // 获取工作表列表
  const sheetsRes = await fetch(`https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}/sheets/query`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const sheetsData = await sheetsRes.json();
  const sheets = sheetsData.data?.sheets || [];
  console.log(`找到 ${sheets.length} 个工作表\n`);

  // 测试第一个工作表
  const firstSheet = sheets[0];
  console.log(`测试工作表: ${firstSheet.title} (ID: ${firstSheet.sheet_id})\n`);

  const dataUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values/${firstSheet.sheet_id}!A1:Z100`;

  const dataRes = await fetch(dataUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await dataRes.json();

  console.log('完整API响应:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n---\n');

  if (data.code === 0) {
    const values = data.data?.values || [];
    console.log(`返回的数据行数: ${values.length}`);

    if (values.length > 0) {
      console.log('\n前5行数据:');
      values.slice(0, 5).forEach((row, i) => {
        console.log(`第${i+1}行:`, row);
      });
    } else {
      console.log('\n⚠️ 返回0行数据！');
      console.log('可能原因:');
      console.log('1. 工作表是空的');
      console.log('2. 工作表被隐藏或受保护');
      console.log('3. 工作表使用公式（如IMPORTRANGE）动态导入数据');
      console.log('4. 需要特殊权限才能读取');
    }
  } else {
    console.log(`API错误: ${data.msg}`);
  }
}

debugSheetResponse().catch(console.error);
