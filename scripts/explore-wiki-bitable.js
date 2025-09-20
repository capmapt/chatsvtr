#!/usr/bin/env node

/**
 * 探索Wiki页面中的Bitable表格结构
 * 获取真实的App Token和Table ID
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',

  // Wiki页面配置
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

async function exploreWikiNode(accessToken) {
  console.log('\n🔍 探索Wiki节点结构...');

  try {
    // 方法1: 尝试获取Wiki节点信息
    const nodeResponse = await fetch(`${config.baseUrl}/wiki/v2/spaces/get_node`, {
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

    const nodeData = await nodeResponse.json();
    console.log('📝 Wiki节点响应:', JSON.stringify(nodeData, null, 2));

    if (nodeData.code === 0 && nodeData.data) {
      const node = nodeData.data.node;
      console.log(`✅ Wiki节点信息获取成功:`);
      console.log(`  - 标题: ${node.title}`);
      console.log(`  - 类型: ${node.obj_type}`);
      console.log(`  - Token: ${node.obj_token}`);

      // 如果是Bitable类型，尝试访问表格
      if (node.obj_type === 'bitable') {
        console.log('\n🎯 发现Bitable，尝试获取表格列表...');
        await exploreBitableContent(accessToken, node.obj_token);
      }
    }

  } catch (error) {
    console.error('❌ Wiki节点探索失败:', error.message);
  }
}

async function exploreBitableContent(accessToken, appToken) {
  try {
    console.log(`\n📊 探索Bitable内容 (App Token: ${appToken})`);

    // 获取应用信息
    const appResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const appData = await appResponse.json();
    if (appData.code === 0) {
      console.log(`✅ Bitable应用信息: ${appData.data.app.name}`);

      // 获取表格列表
      const tablesResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const tablesData = await tablesResponse.json();
      if (tablesData.code === 0) {
        const tables = tablesData.data.items;
        console.log(`📋 找到 ${tables.length} 个表格:`);

        for (const table of tables) {
          console.log(`  - ${table.name} (ID: ${table.table_id})`);

          // 查找名为"startup"的表格
          if (table.name.toLowerCase().includes('startup') ||
              table.name.includes('创业') ||
              table.name.includes('公司')) {
            console.log(`🎯 找到目标表格: ${table.name}`);
            await exploreTableContent(accessToken, appToken, table.table_id, table.name);
          }
        }
      } else {
        console.error(`❌ 获取表格列表失败: ${tablesData.msg}`);
      }
    } else {
      console.error(`❌ 获取Bitable应用失败: ${appData.msg}`);
    }

  } catch (error) {
    console.error('❌ Bitable探索失败:', error.message);
  }
}

async function exploreTableContent(accessToken, appToken, tableId, tableName) {
  try {
    console.log(`\n🔍 探索表格内容: ${tableName}`);

    // 获取字段列表
    const fieldsResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const fieldsData = await fieldsResponse.json();
    if (fieldsData.code === 0) {
      const fields = fieldsData.data.items;
      console.log(`📋 字段列表 (${fields.length}个):`);
      fields.forEach(field => {
        console.log(`  - ${field.field_name} (${getFieldTypeName(field.type)})`);
      });

      // 获取前几条记录看看数据结构
      const recordsResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=3`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      const recordsData = await recordsResponse.json();
      if (recordsData.code === 0) {
        const records = recordsData.data.items;
        console.log(`\n📄 示例记录 (${records.length}条):`);

        records.forEach((record, index) => {
          console.log(`\n记录 ${index + 1}:`);
          Object.entries(record.fields).forEach(([fieldId, value]) => {
            const field = fields.find(f => f.field_id === fieldId);
            const fieldName = field?.field_name || fieldId;
            const displayValue = formatFieldValue(value);
            console.log(`  ${fieldName}: ${displayValue}`);
          });
        });

        // 保存配置信息
        console.log(`\n✅ 发现有效配置:`);
        console.log(`App Token: ${appToken}`);
        console.log(`Table ID: ${tableId}`);
        console.log(`Table Name: ${tableName}`);
        console.log(`记录数量: ${recordsData.data.total || '未知'}`);

      } else {
        console.error(`❌ 获取记录失败: ${recordsData.msg}`);
      }
    } else {
      console.error(`❌ 获取字段失败: ${fieldsData.msg}`);
    }

  } catch (error) {
    console.error('❌ 表格内容探索失败:', error.message);
  }
}

function getFieldTypeName(type) {
  const typeMap = {
    1: '单行文本', 2: '数字', 3: '单选', 4: '多选', 5: '日期',
    7: '复选框', 11: '人员', 13: '电话号码', 15: '超链接', 17: '附件',
    18: '关联', 19: '查找引用', 20: '公式', 21: '双向关联'
  };
  return typeMap[type] || `类型${type}`;
}

function formatFieldValue(value) {
  if (value === null || value === undefined) return '空';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(v => {
        if (v.text) return v.text;
        if (v.name) return v.name;
        return JSON.stringify(v);
      }).join(', ');
    }
    if (value.text) return value.text;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value).substring(0, 100);
}

async function main() {
  console.log('🚀 开始探索Wiki页面中的Bitable结构...\n');

  const accessToken = await getAccessToken();
  if (!accessToken) {
    console.error('❌ 无法获取访问令牌，退出');
    process.exit(1);
  }

  await exploreWikiNode(accessToken);

  console.log('\n🎉 探索完成！');
}

main().catch(console.error);