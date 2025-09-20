#!/usr/bin/env node

/**
 * 探索SVTR.AI创投季度观察Sheet中的startup数据
 */

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',
  sheetToken: 'PERPsZO0ph5nZztjBTSctDAdnYg' // SVTR.AI创投季度观察
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

async function exploreSheet() {
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ 认证失败');
    return;
  }

  console.log('📊 探索Sheet: SVTR.AI创投季度观察');

  try {
    // 获取工作表列表
    const sheetsResponse = await fetch(`${config.baseUrl}/sheets/v3/spreadsheets/${config.sheetToken}/sheets/query`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const sheetsData = await sheetsResponse.json();

    if (sheetsData.code === 0) {
      console.log('📋 工作表列表:');
      sheetsData.data.sheets.forEach(sheet => {
        console.log(`  - ${sheet.title} (ID: ${sheet.sheet_id})`);
      });

      // 查找startup相关工作表
      const startupSheet = sheetsData.data.sheets.find(sheet =>
        sheet.title.toLowerCase().includes('startup') ||
        sheet.title.includes('创业') ||
        sheet.title.includes('公司') ||
        sheet.title.includes('融资')
      );

      if (startupSheet) {
        console.log(`\n🎯 找到目标工作表: ${startupSheet.title}`);
        console.log(`   Sheet Token: ${config.sheetToken}`);
        console.log(`   Sheet ID: ${startupSheet.sheet_id}`);

        // 获取前10行数据作为样例
        console.log(`\n📄 获取工作表 '${startupSheet.title}' 的数据样例...`);

        // 尝试多种API路径
        const apiPaths = [
          `/sheets/v3/spreadsheets/${config.sheetToken}/values/${startupSheet.sheet_id}!A1:Z10`,
          `/sheets/v2/spreadsheets/${config.sheetToken}/values/${startupSheet.sheet_id}!A1:Z10`,
          `/sheets/v1/spreadsheets/${config.sheetToken}/values/${startupSheet.sheet_id}!A1:Z10`,
          `/drive/v1/files/${config.sheetToken}/content`,
          `/bitable/v1/apps/${config.sheetToken}/tables/${startupSheet.sheet_id}/records?page_size=10`
        ];

        let dataResponse;
        let apiPathUsed;

        for (const apiPath of apiPaths) {
          console.log(`🔍 尝试API路径: ${apiPath}`);
          dataResponse = await fetch(`${config.baseUrl}${apiPath}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          console.log(`响应状态: ${dataResponse.status}`);

          if (dataResponse.status === 200) {
            apiPathUsed = apiPath;
            console.log(`✅ 成功的API路径: ${apiPath}`);
            break;
          } else {
            const errorText = await dataResponse.text();
            console.log(`❌ 失败: ${errorText.substring(0, 100)}`);
          }
        }

        if (!apiPathUsed) {
          console.log('❌ 所有API路径都失败了');
          return;
        }

        const rawText = await dataResponse.text();
        console.log('原始响应前200字符:', rawText.substring(0, 200));

        let dataResult;
        try {
          dataResult = JSON.parse(rawText);
        } catch (parseError) {
          console.error('JSON解析失败:', parseError.message);
          console.log('完整响应:', rawText);
          return;
        }

        if (dataResult.code === 0) {
          console.log('📊 Sheet数据结构分析:');
          console.log('Data结构:', JSON.stringify(dataResult.data, null, 2).substring(0, 500));

          if (dataResult.data.valueRange && dataResult.data.valueRange.values) {
            const values = dataResult.data.valueRange.values;
            console.log(`✅ 获取到 ${values.length} 行数据`);

            // 解析复杂的单元格格式
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

            console.log('\n📋 解析后的数据:');
            values.forEach((row, index) => {
              if (row && row.length > 0) {
                const cleanRow = row.map(extractCellText);
                console.log(`行${index + 1}: ${cleanRow.join(' | ')}`);
              }
            });

            // 尝试获取更多数据
            console.log('\n📋 尝试获取更多数据 (A1:Z50)...');
            const moreDataResponse = await fetch(`${config.baseUrl}/sheets/v2/spreadsheets/${config.sheetToken}/values/${startupSheet.sheet_id}!A1:Z50`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const moreDataResult = await moreDataResponse.json();

            if (moreDataResult.code === 0 && moreDataResult.data.valueRange && moreDataResult.data.valueRange.values) {
              const moreValues = moreDataResult.data.valueRange.values;
              console.log(`✅ 扩展数据获取成功，总共 ${moreValues.length} 行`);

              // 分析列标题
              if (moreValues.length > 0) {
                const headers = moreValues[0].map(extractCellText);
                console.log('\n📋 检测到的列标题:');
                headers.forEach((header, index) => {
                  console.log(`  列${index + 1}: ${header}`);
                });

                // 显示前几行数据示例
                console.log('\n📄 前5行数据示例:');
                moreValues.slice(0, 5).forEach((row, index) => {
                  const cleanRow = row.map(extractCellText);
                  console.log(`行${index + 1}: ${cleanRow.join(' | ')}`);
                });
              }
            }
          } else {
            console.log('❌ 未找到values数据');
            console.log('完整数据结构:', JSON.stringify(dataResult.data, null, 2));
          }

        } else {
          console.log('❌ 获取数据失败:', dataResult.msg);
        }

      } else {
        console.log('\n⚠️ 未找到startup相关的工作表');
        console.log('尝试检查第一个工作表的数据...');

        if (sheetsData.data.sheets.length > 0) {
          const firstSheet = sheetsData.data.sheets[0];
          console.log(`\n📄 检查第一个工作表 '${firstSheet.title}' 的数据...`);

          const dataResponse = await fetch(`${config.baseUrl}/sheets/v3/spreadsheets/${config.sheetToken}/values/${firstSheet.sheet_id}!A1:Z10`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const dataResult = await dataResponse.json();

          if (dataResult.code === 0 && dataResult.data.values) {
            console.log('📊 第一个工作表数据样例:');
            dataResult.data.values.forEach((row, index) => {
              console.log(`第${index + 1}行: ${row.join(' | ')}`);
            });
          }
        }
      }
    } else {
      console.log('❌ 获取工作表失败:', sheetsData.msg);
    }

  } catch (error) {
    console.error('❌ 探索Sheet失败:', error.message);
  }
}

exploreSheet().catch(console.error);