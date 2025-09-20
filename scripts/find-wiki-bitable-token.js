#!/usr/bin/env node

/**
 * 专门寻找Wiki页面中的Bitable App Token
 * 通过Wiki API直接获取页面内容和结构
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',
  wikiPageId: 'V2JnwfmvtiBUTdkc32rcQrXWn4g',
  spaceId: '7321328173944340484'
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
      console.log('✅ 飞书认证成功');
      return data.tenant_access_token;
    } else {
      console.error('❌ 认证失败:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('❌ 认证请求失败:', error.message);
    return null;
  }
}

async function tryDirectWikiAccess(accessToken) {
  console.log('\n🔍 尝试直接访问Wiki页面...');

  try {
    // 方法1: 尝试作为文档获取
    console.log('📄 尝试作为文档获取...');
    const docResponse = await fetch(`${config.baseUrl}/docx/v1/documents/${config.wikiPageId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const docData = await docResponse.json();
    console.log('文档响应:', JSON.stringify(docData, null, 2));

  } catch (error) {
    console.log('文档方法失败:', error.message);
  }

  try {
    // 方法2: 尝试Wiki节点方法
    console.log('\n📝 尝试Wiki节点方法...');
    const wikiResponse = await fetch(`${config.baseUrl}/wiki/v2/spaces/get_node`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: config.wikiPageId,
        obj_type: 'wiki'
      })
    });
    const wikiData = await wikiResponse.json();
    console.log('Wiki节点响应:', JSON.stringify(wikiData, null, 2));

  } catch (error) {
    console.log('Wiki节点方法失败:', error.message);
  }

  try {
    // 方法3: 尝试获取空间下所有节点
    console.log('\n🌳 尝试获取空间下的所有节点...');
    const spaceResponse = await fetch(`${config.baseUrl}/wiki/v2/spaces/${config.spaceId}/nodes`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const spaceData = await spaceResponse.json();
    console.log('空间节点响应:', JSON.stringify(spaceData, null, 2));

    if (spaceData.code === 0 && spaceData.data?.items) {
      console.log('\n📋 发现的节点:');
      spaceData.data.items.forEach(node => {
        console.log(`  - ${node.title} (${node.obj_type}) - Token: ${node.node_token} - ObjToken: ${node.obj_token}`);

        // 查找我们的目标页面
        if (node.node_token === config.wikiPageId || node.obj_token === config.wikiPageId) {
          console.log(`🎯 找到目标页面: ${node.title}`);
          console.log(`   类型: ${node.obj_type}`);
          console.log(`   NodeToken: ${node.node_token}`);
          console.log(`   ObjToken: ${node.obj_token}`);

          if (node.obj_type === 'bitable') {
            console.log('🔥 这是一个Bitable应用！');
            return node.obj_token;
          }
        }
      });
    }

  } catch (error) {
    console.log('空间节点方法失败:', error.message);
  }

  return null;
}

async function tryKnownBitableTokens(accessToken) {
  console.log('\n🔍 尝试已知的Bitable Token...');

  const knownTokens = [
    'XCNeb9GjNaQaeYsm7WwcZRSJn1f', // 交易精选
    'V2JnwfmvtiBUTdkc32rcQrXWn4g'  // Wiki页面ID
  ];

  for (const token of knownTokens) {
    try {
      console.log(`\n📊 测试Token: ${token}`);

      const appResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${token}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const appData = await appResponse.json();
      if (appData.code === 0) {
        console.log(`✅ 成功访问: ${appData.data.app.name}`);

        // 获取表格
        const tablesResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${token}/tables`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const tablesData = await tablesResponse.json();
        if (tablesData.code === 0) {
          const tables = tablesData.data.items;
          console.log(`📋 表格列表 (${tables.length}个):`);

          tables.forEach(table => {
            console.log(`  - ${table.name} (ID: ${table.table_id})`);

            // 检查是否有startup相关表格
            if (table.name.toLowerCase().includes('startup') ||
                table.name.includes('创业') ||
                table.name.includes('公司') ||
                table.name.includes('融资')) {
              console.log(`🎯 找到startup相关表格: ${table.name}`);
              console.log(`   App Token: ${token}`);
              console.log(`   Table ID: ${table.table_id}`);

              return { appToken: token, tableId: table.table_id, tableName: table.name };
            }
          });
        }
      } else {
        console.log(`❌ 访问失败 (${token}): ${appData.msg}`);
      }

    } catch (error) {
      console.log(`❌ 测试Token ${token} 失败:`, error.message);
    }
  }

  return null;
}

async function main() {
  console.log('🚀 开始寻找Wiki页面中的Bitable Token...\n');

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('❌ 无法获取访问令牌，退出');
    process.exit(1);
  }

  // 尝试直接访问Wiki页面
  const wikiResult = await tryDirectWikiAccess(accessToken);
  if (wikiResult) {
    console.log(`🎉 通过Wiki API找到Bitable Token: ${wikiResult}`);
  }

  // 尝试已知的Token
  const bitableResult = await tryKnownBitableTokens(accessToken);
  if (bitableResult) {
    console.log(`🎉 找到startup表格配置:`);
    console.log(`   App Token: ${bitableResult.appToken}`);
    console.log(`   Table ID: ${bitableResult.tableId}`);
    console.log(`   Table Name: ${bitableResult.tableName}`);
  }

  if (!wikiResult && !bitableResult) {
    console.log('\n❌ 未能找到有效的Bitable配置');
    console.log('建议检查:');
    console.log('1. Wiki页面权限设置');
    console.log('2. Bitable应用共享权限');
    console.log('3. 飞书应用的API权限范围');
  }

  console.log('\n🎉 探索完成！');
}

main().catch(console.error);