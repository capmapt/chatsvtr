#!/usr/bin/env node

/**
 * 飞书API调试脚本 - 逐步排查NOTEXIST错误
 */

// 使用Node.js 18+的内置fetch

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',

  // 从用户提供的URL解析的配置
  originalUrl: 'https://svtrglobal.feishu.cn/wiki/V2JnwfmvtiBUTdkc32rcQrXWn4g?from=from_copylink&sheet=GvCmOW',
  appToken: 'V2JnwfmvtiBUTdkc32rcQrXWn4g',
  sheetParam: 'GvCmOW'
};

async function step1_testAuthentication() {
  console.log('🔐 Step 1: 测试飞书API认证...');

  try {
    const response = await fetch(`${config.baseUrl}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret
      })
    });

    const data = await response.json();
    console.log('认证响应:', JSON.stringify(data, null, 2));

    if (data.code === 0) {
      console.log('✅ 认证成功');
      return data.tenant_access_token;
    } else {
      console.log('❌ 认证失败:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('❌ 认证请求异常:', error.message);
    return null;
  }
}

async function step2_testAppAccess(accessToken) {
  console.log('\n📱 Step 2: 测试应用访问权限...');

  try {
    const response = await fetch(`${config.baseUrl}/bitable/v1/apps/${config.appToken}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();
    console.log('应用信息响应:', JSON.stringify(data, null, 2));

    if (data.code === 0) {
      console.log('✅ 应用访问成功');
      console.log(`应用名称: ${data.data?.app?.name}`);
      return true;
    } else {
      console.log('❌ 应用访问失败:', data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 应用访问异常:', error.message);
    return false;
  }
}

async function step3_listTables(accessToken) {
  console.log('\n📊 Step 3: 列出所有数据表...');

  try {
    const response = await fetch(`${config.baseUrl}/bitable/v1/apps/${config.appToken}/tables`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();
    console.log('数据表列表响应:', JSON.stringify(data, null, 2));

    if (data.code === 0) {
      console.log('✅ 获取数据表列表成功');
      const tables = data.data?.items || [];
      console.log(`找到 ${tables.length} 个数据表:`);

      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name} (ID: ${table.table_id})`);
      });

      return tables;
    } else {
      console.log('❌ 获取数据表失败:', data.msg);
      return [];
    }
  } catch (error) {
    console.error('❌ 获取数据表异常:', error.message);
    return [];
  }
}

async function step4_testTableAccess(accessToken, tableId) {
  console.log(`\n🔍 Step 4: 测试表格访问 (${tableId})...`);

  try {
    const response = await fetch(
      `${config.baseUrl}/bitable/v1/apps/${config.appToken}/tables/${tableId}/records?page_size=1`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    const data = await response.json();
    console.log('表格访问响应:', JSON.stringify(data, null, 2));

    if (data.code === 0) {
      console.log('✅ 表格访问成功');
      console.log(`记录数量: ${data.data?.items?.length || 0}`);
      return true;
    } else {
      console.log('❌ 表格访问失败:', data.msg, `(code: ${data.code})`);
      return false;
    }
  } catch (error) {
    console.error('❌ 表格访问异常:', error.message);
    return false;
  }
}

async function step5_analyzeUrlStructure() {
  console.log('\n🔗 Step 5: 分析URL结构...');

  console.log('原始URL:', config.originalUrl);
  console.log('解析结果:');
  console.log(`  - 域名: svtrglobal.feishu.cn`);
  console.log(`  - App Token: ${config.appToken}`);
  console.log(`  - Sheet 参数: ${config.sheetParam}`);

  // 可能的问题分析
  console.log('\n🤔 可能的问题:');
  console.log('1. Sheet参数 "GvCmOW" 可能不是真正的 table_id');
  console.log('2. URL中的参数可能是视图ID而不是表格ID');
  console.log('3. 权限可能限制了API访问，即使网页可以访问');
}

async function main() {
  console.log('🚀 开始飞书API调试...\n');

  // Step 1: 认证
  const accessToken = await step1_testAuthentication();
  if (!accessToken) {
    console.log('\n❌ 认证失败，无法继续');
    return;
  }

  // Step 2: 测试应用访问
  const appAccessible = await step2_testAppAccess(accessToken);
  if (!appAccessible) {
    console.log('\n❌ 应用访问失败，可能是权限问题');
    return;
  }

  // Step 3: 列出所有表格
  const tables = await step3_listTables(accessToken);

  // Step 4: 测试目标表格访问
  if (tables.length > 0) {
    // 测试第一个表格
    await step4_testTableAccess(accessToken, tables[0].table_id);

    // 测试我们配置的表格ID
    console.log(`\n🎯 测试配置的表格ID: ${config.sheetParam}`);
    await step4_testTableAccess(accessToken, config.sheetParam);
  }

  // Step 5: URL结构分析
  await step5_analyzeUrlStructure();

  console.log('\n🎉 调试完成！');
}

main().catch(console.error);