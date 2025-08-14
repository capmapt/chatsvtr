#!/usr/bin/env node

/**
 * 测试优化版表格数据获取
 * 专门测试少量表格节点，验证数据获取效果
 */

require('dotenv').config();

class TestSheetOptimization {
  constructor() {
    this.config = {
      appId: 'cli_a8e2014cbe7d9013',
      appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
      baseUrl: 'https://open.feishu.cn/open-apis',
      spaceId: '7321328173944340484'
    };
    
    this.accessToken = null;
  }

  async getAccessToken() {
    const url = `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        })
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        this.accessToken = data.tenant_access_token;
        console.log('✅ 飞书认证成功');
        return true;
      } else {
        console.error('❌ 飞书认证失败:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('❌ 飞书认证失败:', error.message);
      return false;
    }
  }

  // 将数字转换为Excel列标识符 (1->A, 26->Z, 27->AA)
  numberToColumn(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result || 'A';
  }

  // 优化版表格数据获取
  async getSheetContentOptimized(objToken, title) {
    console.log(`🔍 测试优化版表格获取: ${title}`);
    
    try {
      // 获取表格基础信息
      const infoUrl = `${this.config.baseUrl}/sheets/v3/spreadsheets/${objToken}`;
      
      const infoResponse = await fetch(infoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!infoResponse.ok) {
        const errorText = await infoResponse.text();
        console.log(`❌ 表格信息获取失败: ${infoResponse.status} - ${errorText.substring(0, 200)}`);
        return null;
      }
      
      const infoData = await infoResponse.json();
      console.log(`✅ 表格信息获取成功: ${title}`);
      
      // 获取工作表列表
      const sheetsUrl = `${this.config.baseUrl}/sheets/v3/spreadsheets/${objToken}/sheets`;
      const sheetsResponse = await fetch(sheetsUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!sheetsResponse.ok) {
        const errorText = await sheetsResponse.text();
        console.log(`❌ 工作表列表获取失败: ${sheetsResponse.status} - ${errorText.substring(0, 200)}`);
        return null;
      }
      
      const sheetsData = await sheetsResponse.json();
      
      if (sheetsData.code !== 0 || !sheetsData.data?.sheets) {
        console.log('❌ 工作表数据解析失败');
        return null;
      }
      
      console.log(`📊 找到 ${sheetsData.data.sheets.length} 个工作表`);
      
      // 获取所有工作表的数据
      const allSheetsData = [];
      let totalProcessedCells = 0;
      
      for (const [index, sheet] of sheetsData.data.sheets.entries()) {
        if (index >= 3) break; // 测试时只处理前3个工作表
        
        try {
          // 动态获取工作表的实际范围
          const sheetProperties = sheet.properties || {};
          const gridProperties = sheetProperties.gridProperties || {};
          
          // 计算实际数据范围，但设置合理上限
          const maxRow = Math.min(gridProperties.rowCount || 500, 1000);
          const maxCol = Math.min(gridProperties.columnCount || 26, 50);
          
          // 将列数转换为字母表示
          const endColumn = this.numberToColumn(maxCol);
          const range = `A1:${endColumn}${maxRow}`;
          
          console.log(`📋 处理工作表 "${sheet.properties.title}" 范围: ${range}`);
          
          const rangeUrl = `${this.config.baseUrl}/sheets/v2/spreadsheets/${objToken}/values/${sheet.sheet_id}!${range}`;
          
          const rangeResponse = await fetch(rangeUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (rangeResponse.ok) {
            const rangeData = await rangeResponse.json();
            const values = rangeData.data?.values || [];
            
            if (values.length > 0) {
              const cellCount = values.reduce((sum, row) => sum + row.length, 0);
              totalProcessedCells += cellCount;
              
              allSheetsData.push({
                sheetName: sheet.properties.title,
                sheetId: sheet.sheet_id,
                data: values,
                rowCount: values.length,
                cellCount: cellCount,
                range: range
              });
              
              console.log(`✅ 工作表 "${sheet.properties.title}": ${values.length}行, ${cellCount}个单元格`);
              
              // 显示前5行数据预览
              console.log(`📝 数据预览 (前5行):`);
              for (let i = 0; i < Math.min(5, values.length); i++) {
                const row = values[i] || [];
                if (row.some(cell => cell && cell.toString().trim())) {
                  console.log(`   ${i + 1}. ${row.slice(0, 10).join(' | ')}${row.length > 10 ? ' ...' : ''}`);
                }
              }
            } else {
              console.log(`⚠️ 工作表 "${sheet.properties.title}" 无数据`);
            }
          } else {
            console.log(`❌ 工作表 "${sheet.properties.title}" 数据获取失败: ${rangeResponse.status}`);
          }
        } catch (sheetError) {
          console.log(`⚠️ 处理工作表 "${sheet.properties.title}" 时出错: ${sheetError.message}`);
        }
      }
      
      if (allSheetsData.length > 0) {
        console.log(`🎉 表格 "${title}" 数据获取完成:`);
        console.log(`   - 工作表数量: ${allSheetsData.length}`);
        console.log(`   - 总单元格数: ${totalProcessedCells}`);
        console.log(`   - 平均行数: ${Math.round(allSheetsData.reduce((sum, s) => sum + s.rowCount, 0) / allSheetsData.length)}`);
        
        return {
          title: title,
          totalSheets: allSheetsData.length,
          totalCells: totalProcessedCells,
          sheetsData: allSheetsData,
          success: true
        };
      } else {
        console.log(`❌ 表格 "${title}" 无有效数据`);
        return null;
      }
      
    } catch (error) {
      console.log(`❌ 表格处理失败: ${error.message}`);
      return null;
    }
  }

  // 测试特定表格节点
  async testSpecificSheets() {
    console.log('🚀 开始测试特定表格数据获取...\n');
    
    if (!await this.getAccessToken()) {
      throw new Error('认证失败');
    }

    // 测试几个关键表格（使用正确的objToken）
    const testSheets = [
      { 
        objToken: 'PERPsZO0ph5nZztjBTSctDAdnYg', 
        title: 'SVTR.AI创投季度观察' 
      },
      { 
        objToken: 'Fz9BszdbFh407stolmucmkISnfg', 
        title: 'SVTR AI估值排行榜' 
      }
    ];
    
    const results = [];
    
    for (const sheet of testSheets) {
      console.log(`\n=== 测试表格: ${sheet.title} ===`);
      const result = await this.getSheetContentOptimized(sheet.objToken, sheet.title);
      
      if (result) {
        results.push(result);
        console.log(`✅ 成功: ${result.totalCells} 个单元格`);
      } else {
        console.log(`❌ 失败`);
      }
      
      // 短暂延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 测试总结:');
    console.log(`- 成功表格: ${results.length}/${testSheets.length}`);
    
    if (results.length > 0) {
      const totalCells = results.reduce((sum, r) => sum + r.totalCells, 0);
      console.log(`- 总获取单元格: ${totalCells} 个`);
      console.log(`- 平均单元格/表格: ${Math.round(totalCells / results.length)} 个`);
      
      // 比较新旧方案
      const oldMethod = testSheets.length * 100; // 旧方案每个表格100字符
      const estimatedNewSize = totalCells * 20; // 估计新方案每个单元格20字符
      
      console.log(`\n📈 数据量对比:`);
      console.log(`- 旧方案 (估计): ${oldMethod} 字符`);
      console.log(`- 新方案 (估计): ${estimatedNewSize} 字符`);
      console.log(`- 提升倍数: ${Math.round(estimatedNewSize / oldMethod)}x`);
    }
    
    return results;
  }
}

// 主函数
async function main() {
  try {
    const tester = new TestSheetOptimization();
    await tester.testSpecificSheets();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  main();
}

module.exports = TestSheetOptimization;