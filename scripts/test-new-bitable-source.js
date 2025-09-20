/**
 * 测试新的Feishu Bitable数据源
 * 探索表格结构和字段映射
 */

require('dotenv').config();

const NEW_BITABLE_CONFIG = {
  APP_TOKEN: 'DsQHbrYrLab84NspgnWcmj44nYe',
  BASE_URL: 'https://open.feishu.cn/open-apis'
};

async function getAccessToken() {
  const response = await fetch(`${NEW_BITABLE_CONFIG.BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET
    })
  });

  const result = await response.json();
  if (result.code === 0) {
    return result.tenant_access_token;
  }
  throw new Error(`获取访问令牌失败: ${result.msg}`);
}

async function listTables(accessToken) {
  console.log('🔍 探索新数据源的表格列表...');

  const response = await fetch(
    `${NEW_BITABLE_CONFIG.BASE_URL}/bitable/v1/apps/${NEW_BITABLE_CONFIG.APP_TOKEN}/tables`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json();

  if (result.code === 0) {
    console.log(`📊 找到 ${result.data.items.length} 个表格:`);
    result.data.items.forEach((table, index) => {
      console.log(`${index + 1}. ${table.name} (ID: ${table.table_id})`);
    });
    return result.data.items;
  } else {
    throw new Error(`获取表格列表失败: ${result.msg}`);
  }
}

async function exploreTableFields(accessToken, tableId, tableName) {
  console.log(`\n🔍 探索表格 "${tableName}" 的字段结构...`);

  const response = await fetch(
    `${NEW_BITABLE_CONFIG.BASE_URL}/bitable/v1/apps/${NEW_BITABLE_CONFIG.APP_TOKEN}/tables/${tableId}/fields`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json();

  if (result.code === 0) {
    console.log(`📋 字段列表 (${result.data.items.length} 个字段):`);
    result.data.items.forEach((field, index) => {
      console.log(`${index + 1}. ${field.field_name} (${field.type}) - ID: ${field.field_id}`);
    });
    return result.data.items;
  } else {
    throw new Error(`获取字段列表失败: ${result.msg}`);
  }
}

async function sampleTableData(accessToken, tableId, tableName) {
  console.log(`\n📝 获取表格 "${tableName}" 的示例数据...`);

  const response = await fetch(
    `${NEW_BITABLE_CONFIG.BASE_URL}/bitable/v1/apps/${NEW_BITABLE_CONFIG.APP_TOKEN}/tables/${tableId}/records?page_size=5`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json();

  if (result.code === 0) {
    console.log(`📄 示例记录 (${result.data.items.length} 条):`);
    result.data.items.forEach((record, index) => {
      console.log(`\n记录 ${index + 1}:`);
      console.log(JSON.stringify(record.fields, null, 2));
    });
    return result.data.items;
  } else {
    throw new Error(`获取示例数据失败: ${result.msg}`);
  }
}

async function main() {
  try {
    console.log('🚀 开始探索新的Feishu Bitable数据源...');
    console.log(`📦 App Token: ${NEW_BITABLE_CONFIG.APP_TOKEN}`);

    // 获取访问令牌
    const accessToken = await getAccessToken();
    console.log('✅ 成功获取访问令牌');

    // 列出所有表格
    const tables = await listTables(accessToken);

    // 对每个表格进行探索
    for (const table of tables) {
      await exploreTableFields(accessToken, table.table_id, table.name);
      await sampleTableData(accessToken, table.table_id, table.name);
      console.log('\n' + '='.repeat(80));
    }

    console.log('✅ 数据源探索完成！');

  } catch (error) {
    console.error('❌ 探索失败:', error);
    process.exit(1);
  }
}

main();