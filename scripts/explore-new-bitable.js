#!/usr/bin/env node

/**
 * 探索新的飞书多维表格数据源
 * https://svtrglobal.feishu.cn/base/ZNRsbFjNZaEEaMs4bWDcwDXZnXg
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',
  newAppToken: 'ZNRsbFjNZaEEaMs4bWDcwDXZnXg' // 新的Bitable App Token
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

async function exploreNewBitable() {
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ 认证失败');
    return;
  }

  console.log('🔍 探索新的多维表格数据源...');
  console.log(`App Token: ${config.newAppToken}`);

  try {
    // 获取应用信息
    console.log('\n📊 获取Bitable应用信息...');
    const appResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${config.newAppToken}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const appData = await appResponse.json();
    if (appData.code === 0) {
      console.log(`✅ 应用名称: ${appData.data.app.name}`);
      console.log(`   应用描述: ${appData.data.app.description || '无描述'}`);
      console.log(`   创建时间: ${new Date(parseInt(appData.data.app.time_zone) * 1000).toLocaleString()}`);
    } else {
      console.error('❌ 获取应用信息失败:', appData.msg);
      return;
    }

    // 获取表格列表
    console.log('\n📋 获取表格列表...');
    const tablesResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${config.newAppToken}/tables`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const tablesData = await tablesResponse.json();
    if (tablesData.code === 0) {
      const tables = tablesData.data.items;
      console.log(`📄 找到 ${tables.length} 个表格:`);

      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name} (ID: ${table.table_id})`);
      });

      // 查找AI创投相关表格
      const startupTables = tables.filter(table =>
        table.name.toLowerCase().includes('startup') ||
        table.name.includes('AI') ||
        table.name.includes('创投') ||
        table.name.includes('融资') ||
        table.name.includes('公司')
      );

      if (startupTables.length > 0) {
        console.log(`\n🎯 找到 ${startupTables.length} 个AI创投相关表格:`);

        for (const table of startupTables) {
          console.log(`\n📊 分析表格: ${table.name}`);
          await analyzeTable(token, config.newAppToken, table.table_id, table.name);
        }
      } else {
        console.log('\n⚠️ 未找到明显的AI创投相关表格，分析第一个表格:');
        if (tables.length > 0) {
          await analyzeTable(token, config.newAppToken, tables[0].table_id, tables[0].name);
        }
      }

    } else {
      console.error('❌ 获取表格列表失败:', tablesData.msg);
    }

  } catch (error) {
    console.error('❌ 探索失败:', error.message);
  }
}

async function analyzeTable(token, appToken, tableId, tableName) {
  try {
    // 获取字段信息
    const fieldsResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const fieldsData = await fieldsResponse.json();
    if (fieldsData.code === 0) {
      const fields = fieldsData.data.items;
      console.log(`  📋 字段列表 (${fields.length}个):`);

      const keyFields = {};
      fields.forEach((field, index) => {
        console.log(`    ${index + 1}. ${field.field_name} (类型: ${getFieldTypeName(field.type)}) - ID: ${field.field_id}`);

        // 识别关键字段
        const fieldName = field.field_name.toLowerCase();
        if (fieldName.includes('公司') || fieldName.includes('company') || fieldName.includes('name')) {
          keyFields.companyName = { id: field.field_id, name: field.field_name };
        }
        if (fieldName.includes('金额') || fieldName.includes('amount') || fieldName.includes('融资')) {
          keyFields.amount = { id: field.field_id, name: field.field_name };
        }
        if (fieldName.includes('轮次') || fieldName.includes('stage') || fieldName.includes('阶段')) {
          keyFields.stage = { id: field.field_id, name: field.field_name };
        }
        if (fieldName.includes('时间') || fieldName.includes('date') || fieldName.includes('日期')) {
          keyFields.time = { id: field.field_id, name: field.field_name };
        }
        if (fieldName.includes('投资方') || fieldName.includes('investor')) {
          keyFields.investor = { id: field.field_id, name: field.field_name };
        }
        if (fieldName.includes('业务') || fieldName.includes('description') || fieldName.includes('描述')) {
          keyFields.business = { id: field.field_id, name: field.field_name };
        }
      });

      console.log(`  🔑 识别到的关键字段:`);
      Object.entries(keyFields).forEach(([key, field]) => {
        console.log(`    ${key}: ${field.name} (${field.id})`);
      });

      // 获取样例记录
      const recordsResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const recordsData = await recordsResponse.json();
      if (recordsData.code === 0) {
        const records = recordsData.data.items;
        console.log(`  📄 样例记录 (${records.length}条):`);

        records.forEach((record, index) => {
          console.log(`\n    记录 ${index + 1}:`);
          Object.entries(record.fields).forEach(([fieldId, value]) => {
            const field = fields.find(f => f.field_id === fieldId);
            const fieldName = field?.field_name || fieldId;
            const displayValue = formatFieldValue(value);
            if (displayValue && displayValue !== 'null' && displayValue !== '[]') {
              console.log(`      ${fieldName}: ${displayValue}`);
            }
          });
        });

        // 输出配置建议
        console.log(`\n  🎯 建议配置:`);
        console.log(`    App Token: ${appToken}`);
        console.log(`    Table ID: ${tableId}`);
        console.log(`    Table Name: ${tableName}`);
        console.log(`    总记录数: ${recordsData.data.total || '未知'}`);

        if (Object.keys(keyFields).length > 0) {
          console.log(`    字段映射配置:`);
          console.log(`    const FIELD_MAPPING = {`);
          Object.entries(keyFields).forEach(([key, field]) => {
            console.log(`      ${key}: '${field.id}', // ${field.name}`);
          });
          console.log(`    };`);
        }

      } else {
        console.error(`❌ 获取记录失败: ${recordsData.msg}`);
      }
    } else {
      console.error(`❌ 获取字段失败: ${fieldsData.msg}`);
    }

  } catch (error) {
    console.error(`❌ 分析表格失败: ${error.message}`);
  }
}

function getFieldTypeName(type) {
  const typeMap = {
    1: '单行文本', 2: '数字', 3: '单选', 4: '多选', 5: '日期',
    7: '复选框', 11: '人员', 13: '电话号码', 15: '超链接', 17: '附件',
    18: '关联', 19: '查找引用', 20: '公式', 21: '双向关联', 22: '地理位置',
    23: '群组', 1001: '创建时间', 1002: '最后更新时间', 1003: '创建人', 1004: '最后更新人', 1005: '自动编号'
  };
  return typeMap[type] || `类型${type}`;
}

function formatFieldValue(value) {
  if (value === null || value === undefined) return 'null';
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

exploreNewBitable().catch(console.error);