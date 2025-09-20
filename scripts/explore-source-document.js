#!/usr/bin/env node

/**
 * 探索IMPORTRANGE引用的源文档
 * https://c0uiiy15npu.feishu.cn/wiki/E2Yrwyh0MiraFYkInPSc9Vgknwc
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',
  sourceDocToken: 'E2Yrwyh0MiraFYkInPSc9Vgknwc' // IMPORTRANGE源文档
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

async function exploreSourceDocument() {
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ 认证失败');
    return;
  }

  console.log('📊 探索IMPORTRANGE源文档...');
  console.log(`文档Token: ${config.sourceDocToken}`);

  try {
    // 方法1: 尝试作为Bitable访问
    console.log('\n🔍 方法1: 尝试作为Bitable访问...');
    try {
      const appResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${config.sourceDocToken}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appData = await appResponse.json();

      if (appData.code === 0) {
        console.log(`✅ Bitable应用: ${appData.data.app.name}`);

        // 获取表格列表
        const tablesResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${config.sourceDocToken}/tables`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tablesData = await tablesResponse.json();

        if (tablesData.code === 0) {
          console.log('📋 Bitable表格列表:');
          tablesData.data.items.forEach(table => {
            console.log(`  - ${table.name} (ID: ${table.table_id})`);
          });

          // 查找Startup表格
          const startupTable = tablesData.data.items.find(table =>
            table.name.toLowerCase().includes('startup')
          );

          if (startupTable) {
            console.log(`\n🎯 找到Startup表格: ${startupTable.name}`);
            await exploreBitableStartupData(token, config.sourceDocToken, startupTable.table_id);
          }
        }
      } else {
        console.log('❌ 不是有效的Bitable:', appData.msg);
      }
    } catch (error) {
      console.log('❌ Bitable访问失败:', error.message);
    }

    // 方法2: 尝试作为Sheet访问
    console.log('\n🔍 方法2: 尝试作为Sheet访问...');
    try {
      const sheetsResponse = await fetch(`${config.baseUrl}/sheets/v3/spreadsheets/${config.sourceDocToken}/sheets/query`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sheetsData = await sheetsResponse.json();

      if (sheetsData.code === 0) {
        console.log('✅ Sheet工作表列表:');
        sheetsData.data.sheets.forEach(sheet => {
          console.log(`  - ${sheet.title} (ID: ${sheet.sheet_id})`);
        });

        // 查找Startup工作表
        const startupSheet = sheetsData.data.sheets.find(sheet =>
          sheet.title.toLowerCase().includes('startup')
        );

        if (startupSheet) {
          console.log(`\n🎯 找到Startup工作表: ${startupSheet.title}`);
          await exploreSheetStartupData(token, config.sourceDocToken, startupSheet.sheet_id);
        }
      } else {
        console.log('❌ 不是有效的Sheet:', sheetsData.msg);
      }
    } catch (error) {
      console.log('❌ Sheet访问失败:', error.message);
    }

    // 方法3: 尝试作为Wiki节点访问
    console.log('\n🔍 方法3: 尝试作为Wiki节点访问...');
    try {
      const wikiResponse = await fetch(`${config.baseUrl}/wiki/v2/spaces/get_node`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: config.sourceDocToken,
          obj_type: 'wiki'
        })
      });
      const wikiData = await wikiResponse.json();

      if (wikiData.code === 0) {
        console.log(`✅ Wiki节点: ${wikiData.data.node.title}`);
        console.log(`  类型: ${wikiData.data.node.obj_type}`);
        console.log(`  ObjToken: ${wikiData.data.node.obj_token}`);
      } else {
        console.log('❌ 不是有效的Wiki节点:', wikiData.msg);
      }
    } catch (error) {
      console.log('❌ Wiki访问失败:', error.message);
    }

  } catch (error) {
    console.error('❌ 探索失败:', error.message);
  }
}

async function exploreBitableStartupData(token, appToken, tableId) {
  try {
    console.log('📊 获取Bitable Startup数据...');

    // 获取字段
    const fieldsResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const fieldsData = await fieldsResponse.json();

    if (fieldsData.code === 0) {
      console.log('📋 字段列表:');
      fieldsData.data.items.forEach(field => {
        console.log(`  - ${field.field_name} (${field.type})`);
      });

      // 获取记录
      const recordsResponse = await fetch(`${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recordsData = await recordsResponse.json();

      if (recordsData.code === 0) {
        console.log(`📄 获取到 ${recordsData.data.items.length} 条记录`);
        recordsData.data.items.forEach((record, index) => {
          console.log(`\n记录 ${index + 1}:`);
          Object.entries(record.fields).forEach(([fieldId, value]) => {
            const field = fieldsData.data.items.find(f => f.field_id === fieldId);
            const fieldName = field?.field_name || fieldId;
            console.log(`  ${fieldName}: ${JSON.stringify(value)}`);
          });
        });
      }
    }
  } catch (error) {
    console.log('❌ Bitable数据获取失败:', error.message);
  }
}

async function exploreSheetStartupData(token, sheetToken, sheetId) {
  try {
    console.log('📊 获取Sheet Startup数据...');

    const dataResponse = await fetch(`${config.baseUrl}/sheets/v2/spreadsheets/${sheetToken}/values/${sheetId}!A1:Z20`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (dataResponse.status === 200) {
      const rawText = await dataResponse.text();
      const dataResult = JSON.parse(rawText);

      if (dataResult.code === 0 && dataResult.data.valueRange && dataResult.data.valueRange.values) {
        const values = dataResult.data.valueRange.values;
        console.log(`📄 获取到 ${values.length} 行数据`);

        // 解析单元格内容
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

        // 显示前几行
        values.slice(0, 5).forEach((row, index) => {
          const cleanRow = row.map(extractCellText);
          console.log(`行${index + 1}: ${cleanRow.slice(0, 5).join(' | ')}...`);
        });
      }
    } else {
      console.log(`❌ Sheet数据请求失败: ${dataResponse.status}`);
    }
  } catch (error) {
    console.log('❌ Sheet数据获取失败:', error.message);
  }
}

exploreSourceDocument().catch(console.error);