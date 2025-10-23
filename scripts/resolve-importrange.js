#!/usr/bin/env node

/**
 * 解决IMPORTRANGE问题：追踪公式并获取源数据
 */

async function resolveImportRange() {
  console.log('🔍 解析IMPORTRANGE公式并获取源数据\n');

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

  // 测试Sheet Token
  const sheetToken = 'PERPsZO0ph5nZztjBTSctDAdnYg'; // AI创投季度观察

  // 获取工作表列表
  const sheetsRes = await fetch(`https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheetToken}/sheets/query`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const sheetsData = await sheetsRes.json();
  const sheets = sheetsData.data?.sheets || [];
  console.log(`找到 ${sheets.length} 个工作表\n`);

  // 获取第一个工作表数据
  const firstSheet = sheets[0];
  console.log(`📊 工作表: ${firstSheet.title} (ID: ${firstSheet.sheet_id})`);

  const dataUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheetToken}/values/${firstSheet.sheet_id}!A1:A1`;

  const dataRes = await fetch(dataUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await dataRes.json();
  const firstCell = data.data?.valueRange?.values?.[0]?.[0];

  console.log(`第一个单元格内容: ${firstCell}\n`);

  // 解析IMPORTRANGE公式
  if (firstCell && firstCell.startsWith('IMPORTRANGE')) {
    const importRangeRegex = /IMPORTRANGE\("([^"]+)","([^"]+)"\)/;
    const match = firstCell.match(importRangeRegex);

    if (match) {
      const sourceUrl = match[1];
      const sourceRange = match[2];

      console.log('🎯 检测到IMPORTRANGE公式:');
      console.log(`   源URL: ${sourceUrl}`);
      console.log(`   源范围: ${sourceRange}\n`);

      // 从URL提取Token
      // URL格式: https://c0uiiy15npu.feishu.cn/wiki/E2Yrwyh0MiraFYkInPSc9Vgknwc
      const urlMatch = sourceUrl.match(/\/wiki\/([a-zA-Z0-9]+)/);

      if (urlMatch) {
        const sourceToken = urlMatch[1];
        console.log(`📝 源文档Token: ${sourceToken}`);
        console.log(`📝 源数据范围: ${sourceRange}\n`);

        // 尝试从源Wiki获取节点信息
        console.log('🔍 查询源Wiki节点信息...\n');

        const wikiNodeRes = await fetch(`https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${sourceToken}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const wikiNodeData = await wikiNodeRes.json();

        if (wikiNodeData.code === 0) {
          const node = wikiNodeData.data.node;
          console.log('✅ Wiki节点信息:');
          console.log(`   标题: ${node.title}`);
          console.log(`   类型: ${node.obj_type}`);
          console.log(`   Token: ${node.obj_token}\n`);

          // 根据源文档类型处理
          if (node.obj_type === 'sheet') {
            console.log('📋 源文档是Sheet电子表格，尝试获取数据...\n');

            const sourceSheetToken = node.obj_token;

            // 从sourceRange中提取表名
            // 格式: "Startup!A:AC"
            const rangeMatch = sourceRange.match(/^([^!]+)!(.+)$/);
            let targetSheetName = '';
            let targetRange = 'A1:AZ500';

            if (rangeMatch) {
              targetSheetName = rangeMatch[1];
              targetRange = rangeMatch[2];
              console.log(`🎯 目标工作表: ${targetSheetName}`);
              console.log(`🎯 数据范围: ${targetRange}\n`);
            }

            // 获取源Sheet的工作表列表
            const sourceSheetsRes = await fetch(`https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sourceSheetToken}/sheets/query`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            const sourceSheetsData = await sourceSheetsRes.json();

            if (sourceSheetsData.code === 0) {
              const sourceSheets = sourceSheetsData.data?.sheets || [];
              console.log(`✅ 源Sheet包含 ${sourceSheets.length} 个工作表:`);
              sourceSheets.forEach((sheet, i) => {
                console.log(`   ${i + 1}. ${sheet.title} (ID: ${sheet.sheet_id})`);
              });

              // 查找匹配的工作表
              const targetSheet = sourceSheets.find(s => s.title === targetSheetName) || sourceSheets[0];

              console.log(`\n📊 读取工作表: ${targetSheet.title} (ID: ${targetSheet.sheet_id})\n`);

              // 获取数据
              const sourceDataUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sourceSheetToken}/values/${targetSheet.sheet_id}!${targetRange}`;

              const sourceDataRes = await fetch(sourceDataUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
              });

              const sourceData = await sourceDataRes.json();

              if (sourceData.code === 0) {
                const values = sourceData.data?.valueRange?.values || [];
                console.log(`✅ 成功获取 ${values.length} 行数据!\n`);

                if (values.length > 0) {
                  // 统计非空单元格
                  let nonEmptyCells = 0;
                  values.forEach(row => {
                    row.forEach(cell => {
                      if (cell !== null && cell !== '') nonEmptyCells++;
                    });
                  });

                  console.log(`📊 数据统计:`);
                  console.log(`   总行数: ${values.length}`);
                  console.log(`   非空单元格: ${nonEmptyCells}\n`);

                  console.log('📋 前3行数据示例:');
                  values.slice(0, 3).forEach((row, i) => {
                    const nonEmptyValues = row.filter(cell => cell !== null && cell !== '');
                    console.log(`\n第${i + 1}行 (${nonEmptyValues.length}个非空单元格):`);
                    console.log(nonEmptyValues.slice(0, 5).join(' | '));
                    if (nonEmptyValues.length > 5) {
                      console.log(`   ... 还有 ${nonEmptyValues.length - 5} 个单元格`);
                    }
                  });

                  console.log('\n' + '='.repeat(60));
                  console.log('🎉 结论: 源Sheet中有实际数据！');
                  console.log('='.repeat(60));
                  console.log('\n💡 解决方案:');
                  console.log('1. 识别Sheet中的IMPORTRANGE公式');
                  console.log('2. 提取源Sheet Token和工作表名');
                  console.log('3. 从源Sheet获取实际数据');
                  console.log('4. 将源数据作为引用Sheet的内容同步到D1\n');
                }
              }
            }

          } else if (node.obj_type === 'bitable') {
            console.log('🎯 源文档是Bitable多维表，尝试获取数据...\n');

            const bitableToken = node.obj_token;

            // 获取Bitable的表格列表
            const tablesRes = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${bitableToken}/tables`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            const tablesData = await tablesRes.json();

            if (tablesData.code === 0) {
              const tables = tablesData.data?.items || [];
              console.log(`✅ 找到 ${tables.length} 个数据表:`);
              tables.forEach((table, i) => {
                console.log(`   ${i + 1}. ${table.name} (ID: ${table.table_id})`);
              });

              // 从sourceRange中提取表名
              // 格式: "Startup!A:AC"
              const rangeMatch = sourceRange.match(/^([^!]+)!/);
              const targetTableName = rangeMatch ? rangeMatch[1] : tables[0].name;

              console.log(`\n🎯 目标数据表: ${targetTableName}\n`);

              // 查找匹配的表
              const targetTable = tables.find(t => t.name === targetTableName) || tables[0];

              console.log(`📊 读取数据表: ${targetTable.name}\n`);

              // 获取记录
              const recordsRes = await fetch(
                `https://open.feishu.cn/open-apis/bitable/v1/apps/${bitableToken}/tables/${targetTable.table_id}/records?page_size=500`,
                {
                  headers: { 'Authorization': `Bearer ${token}` }
                }
              );

              const recordsData = await recordsRes.json();

              if (recordsData.code === 0) {
                const records = recordsData.data?.items || [];
                console.log(`✅ 成功获取 ${records.length} 条记录!\n`);

                if (records.length > 0) {
                  console.log('📋 前3条记录示例:');
                  records.slice(0, 3).forEach((record, i) => {
                    console.log(`\n记录 ${i + 1}:`);
                    console.log(JSON.stringify(record.fields, null, 2));
                  });

                  console.log('\n' + '='.repeat(60));
                  console.log('🎉 结论: 数据存在于源Bitable中！');
                  console.log('='.repeat(60));
                  console.log('\n💡 解决方案:');
                  console.log('1. 识别Sheet中的IMPORTRANGE公式');
                  console.log('2. 提取源文档Token和表名');
                  console.log('3. 从源Bitable获取实际数据');
                  console.log('4. 将源数据作为Sheet的内容同步到D1\n');
                }
              }
            }
          }
        } else {
          console.log(`❌ 获取Wiki节点失败: ${wikiNodeData.msg}`);
        }
      }
    }
  } else {
    console.log('❌ 未检测到IMPORTRANGE公式');
  }
}

resolveImportRange().catch(console.error);
