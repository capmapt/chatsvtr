#!/usr/bin/env node

/**
 * 测试已知正常工作的飞书配置
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',

  // 已知工作的交易精选配置
  workingConfig: {
    appToken: 'XCNeb9GjNaQaeYsm7WwcZRSJn1f',
    tableId: 'tblGwQMQ9DXvGgA9'
  },

  // 有问题的融资日报配置
  problemConfig: {
    appToken: 'V2JnwfmvtiBUTdkc32rcQrXWn4g',
    tableId: 'GvCmOW'
  }
};

async function getAccessToken() {
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
    if (data.code === 0) {
      console.log('✅ 认证成功');
      return data.tenant_access_token;
    }
    return null;
  } catch (error) {
    console.error('认证失败:', error.message);
    return null;
  }
}

async function testAppAccess(accessToken, appToken, description) {
  console.log(`\n🧪 测试 ${description}:`);
  console.log(`App Token: ${appToken}`);

  try {
    const response = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();

    if (data.code === 0) {
      console.log(`✅ ${description} - 访问成功`);
      console.log(`  应用名称: ${data.data?.app?.name}`);
      return true;
    } else {
      console.log(`❌ ${description} - 访问失败`);
      console.log(`  错误代码: ${data.code}`);
      console.log(`  错误信息: ${data.msg}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description} - 请求异常:`, error.message);
    return false;
  }
}

async function testTableAccess(accessToken, appToken, tableId, description) {
  console.log(`\n📊 测试 ${description} 的表格访问:`);
  console.log(`Table ID: ${tableId}`);

  try {
    const response = await fetch(
      `${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=1`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    const data = await response.json();

    if (data.code === 0) {
      console.log(`✅ ${description} - 表格访问成功`);
      console.log(`  记录数量: ${data.data?.items?.length || 0}`);
      return true;
    } else {
      console.log(`❌ ${description} - 表格访问失败`);
      console.log(`  错误代码: ${data.code}`);
      console.log(`  错误信息: ${data.msg}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ${description} - 请求异常:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 对比测试正常和异常的飞书配置\n');

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.log('认证失败，无法继续');
    return;
  }

  // 测试工作配置
  const workingApp = await testAppAccess(
    accessToken,
    config.workingConfig.appToken,
    '交易精选配置(已知正常)'
  );

  if (workingApp) {
    await testTableAccess(
      accessToken,
      config.workingConfig.appToken,
      config.workingConfig.tableId,
      '交易精选配置'
    );
  }

  // 测试问题配置
  const problemApp = await testAppAccess(
    accessToken,
    config.problemConfig.appToken,
    '融资日报配置(有问题)'
  );

  if (problemApp) {
    await testTableAccess(
      accessToken,
      config.problemConfig.appToken,
      config.problemConfig.tableId,
      '融资日报配置'
    );
  }

  console.log('\n📋 总结:');
  console.log('- 如果交易精选配置正常，说明API和权限没问题');
  console.log('- 如果融资日报配置失败，说明App Token不正确');
  console.log('- 需要获取正确的多维表格App Token和Table ID');
}

main().catch(console.error);