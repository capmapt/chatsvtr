#!/usr/bin/env node

/**
 * 探索投资组合表格中的真实startup数据
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

async function explorePortfolioSheet() {
  const token = await getAccessToken();
  if (!token) {
    console.error('❌ 认证失败');
    return;
  }

  console.log('📊 探索投资组合表格...');

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

      // 查找投资组合工作表
      const portfolioSheet = sheetsData.data.sheets.find(sheet =>
        sheet.title.includes('投资组合')
      );

      if (portfolioSheet) {
        console.log(`\n🎯 找到投资组合工作表: ${portfolioSheet.title}`);
        console.log(`   Sheet ID: ${portfolioSheet.sheet_id}`);

        // 获取投资组合数据
        console.log(`\n📄 获取投资组合数据...`);

        const dataResponse = await fetch(`${config.baseUrl}/sheets/v2/spreadsheets/${config.sheetToken}/values/${portfolioSheet.sheet_id}!A1:AB100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const rawText = await dataResponse.text();
        console.log('API响应状态:', dataResponse.status);

        if (dataResponse.status === 200) {
          const dataResult = JSON.parse(rawText);

          if (dataResult.code === 0 && dataResult.data.valueRange && dataResult.data.valueRange.values) {
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

            // 分析列标题 (第一行)
            if (values.length > 0) {
              const headers = values[0].map(extractCellText);
              console.log('\n📋 检测到的列标题:');
              headers.forEach((header, index) => {
                console.log(`  列${String.fromCharCode(65 + index)}: ${header}`);
              });

              // 查找重要列的索引
              const companyNameIndex = headers.findIndex(h => h.includes('公司') || h.includes('名称'));
              const amountIndex = headers.findIndex(h => h.includes('金额') || h.includes('万美元'));
              const timeIndex = headers.findIndex(h => h.includes('时间') || h.includes('日期'));
              const businessIndex = headers.findIndex(h => h.includes('业务') || h.includes('主要'));

              console.log(`\n🔍 关键列索引:`);
              console.log(`  公司名称: 列${companyNameIndex >= 0 ? String.fromCharCode(65 + companyNameIndex) : '未找到'} (索引${companyNameIndex})`);
              console.log(`  融资金额: 列${amountIndex >= 0 ? String.fromCharCode(65 + amountIndex) : '未找到'} (索引${amountIndex})`);
              console.log(`  时间: 列${timeIndex >= 0 ? String.fromCharCode(65 + timeIndex) : '未找到'} (索引${timeIndex})`);
              console.log(`  主要业务: 列${businessIndex >= 0 ? String.fromCharCode(65 + businessIndex) : '未找到'} (索引${businessIndex})`);

              // 显示实际数据行 (跳过标题)
              console.log('\n📄 前10行实际数据:');
              for (let i = 1; i < Math.min(11, values.length); i++) {
                const row = values[i];
                if (row && row.length > 0) {
                  const cleanRow = row.map(extractCellText);

                  // 检查是否有公司名称
                  const companyName = companyNameIndex >= 0 ? cleanRow[companyNameIndex] : '';
                  const amount = amountIndex >= 0 ? cleanRow[amountIndex] : '';

                  if (companyName && companyName.trim()) {
                    console.log(`\n行${i + 1}:`);
                    console.log(`  公司: ${companyName}`);
                    console.log(`  金额: ${amount}`);
                    console.log(`  完整行: ${cleanRow.slice(0, 10).join(' | ')}...`);
                  }
                }
              }

              // 统计有效数据行数
              let validDataRows = 0;
              for (let i = 1; i < values.length; i++) {
                const row = values[i];
                if (row && row.length > 0) {
                  const companyName = companyNameIndex >= 0 ? extractCellText(row[companyNameIndex]) : '';
                  if (companyName && companyName.trim()) {
                    validDataRows++;
                  }
                }
              }

              console.log(`\n📊 数据统计:`);
              console.log(`  总行数: ${values.length}`);
              console.log(`  有效数据行: ${validDataRows}`);

            }
          } else {
            console.log('❌ 未找到values数据');
            console.log('完整数据结构:', JSON.stringify(dataResult.data, null, 2).substring(0, 500));
          }
        } else {
          console.log('❌ API请求失败:', rawText);
        }

      } else {
        console.log('⚠️ 未找到投资组合工作表');
      }
    }

  } catch (error) {
    console.error('❌ 探索失败:', error.message);
  }
}

explorePortfolioSheet().catch(console.error);