#!/usr/bin/env node

/**
 * 测试飞书Sheet API访问权限
 */

async function testSheetAccess() {
  console.log('🧪 测试飞书Sheet API访问权限\n');

  // 获取access token
  console.log('1️⃣ 获取访问令牌...');
  const authRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: 'cli_a8e2014cbe7d9013',
      app_secret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0'
    })
  });

  const authData = await authRes.json();
  if (authData.code !== 0) {
    console.log('❌ 认证失败:', authData);
    return;
  }

  const token = authData.tenant_access_token;
  console.log('✅ 认证成功\n');

  // 测试获取Sheet信息
  const sheetToken = 'PERPsZO0ph5nZztjBTSctDAdnYg'; // AI创投季度观察
  console.log(`2️⃣ 测试获取Sheet信息...`);
  console.log(`   Sheet Token: ${sheetToken}`);

  const infoRes = await fetch(`https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log(`   响应状态: ${infoRes.status} ${infoRes.statusText}`);

  const infoData = await infoRes.json();
  console.log('   响应内容:', JSON.stringify(infoData, null, 2).substring(0, 300));

  if (infoData.code !== 0) {
    console.log('\n❌ 获取Sheet信息失败!');
    console.log('错误码:', infoData.code);
    console.log('错误信息:', infoData.msg);
    return;
  }

  console.log('✅ 成功获取Sheet信息\n');

  // 先获取Sheet列表（工作表列表）
  console.log('3️⃣ 获取工作表列表...');
  const sheetsRes = await fetch(`https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}/sheets/query`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const sheetsData = await sheetsRes.json();
  console.log(`   响应状态: ${sheetsRes.status}`);

  if (sheetsData.code !== 0) {
    console.log('❌ 获取工作表列表失败:', sheetsData.msg);
    return;
  }

  const sheets = sheetsData.data?.sheets || [];
  console.log(`✅ 找到 ${sheets.length} 个工作表:`);
  sheets.forEach((sheet, i) => {
    console.log(`   ${i + 1}. ${sheet.title} (ID: ${sheet.sheet_id})`);
  });

  if (sheets.length === 0) {
    console.log('⚠️ 没有找到工作表');
    return;
  }

  const firstSheetId = sheets[0].sheet_id;
  console.log(`\n使用第一个工作表: ${sheets[0].title} (${firstSheetId})\n`);

  // 测试获取Sheet数据 - 尝试多种方法
  console.log('4️⃣ 测试获取Sheet数据...\n');

  const methods = [
    {
      name: '方法1: 使用sheetId查询',
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values/${firstSheetId}!A1:Z100`
    },
    {
      name: '方法1: 直接范围查询',
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values/A1:Z100`
    },
    {
      name: '方法2: 批量范围查询',
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values_batch_get?ranges=A1:Z100`
    },
    {
      name: '方法3: 指定工作表查询',
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values/Sheet1!A1:Z100`
    }
  ];

  for (const method of methods) {
    console.log(`   ${method.name}`);
    console.log(`   URL: ${method.url}`);

    try {
      const dataRes = await fetch(method.url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`   状态: ${dataRes.status} ${dataRes.statusText}`);

      const dataData = await dataRes.json();

      if (dataData.code === 0) {
        const values = dataData.data?.valueRange?.values || dataData.data?.values || [];
        console.log(`   ✅ 成功! 获取到 ${values.length} 行数据`);

        if (values.length > 0) {
          console.log(`   前3行示例:`, JSON.stringify(values.slice(0, 3), null, 2));
          return; // 成功了就返回
        }
      } else {
        console.log(`   ❌ 失败: ${dataData.msg || '未知错误'}`);
        console.log(`   错误码: ${dataData.code}`);
      }
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
    }

    console.log('');
  }

  console.log('\n⚠️ 所有方法都未能获取到Sheet数据');
}

testSheetAccess().catch(error => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
