#!/usr/bin/env node

/**
 * 获取飞书表格的工作表ID
 * 解决 "not found sheetId" 问题
 */

require('dotenv').config();

async function getSheetIds() {
  // 1. 获取access token
  const tokenUrl = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';
  
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: 'cli_a8e2014cbe7d9013',
      app_secret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0'
    })
  });
  
  const tokenData = await tokenResponse.json();
  
  if (tokenData.code !== 0) {
    console.error('❌ Token获取失败:', tokenData.msg);
    return;
  }
  
  const accessToken = tokenData.tenant_access_token;
  console.log('✅ Token获取成功');
  
  // 2. 测试多个表格的工作表ID获取
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
  
  for (const sheet of testSheets) {
    console.log(`\n=== 分析表格: ${sheet.title} ===`);
    
    // 尝试不同的工作表列表API
    const sheetListApis = [
      // 官方文档中的API
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheet.objToken}/sheets`,
      `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheet.objToken}/sheets`,
      // 尝试其他可能的路径
      `https://open.feishu.cn/open-apis/drive/v1/files/${sheet.objToken}/sheets`,
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheet.objToken}/metainfo`,
      `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${sheet.objToken}/properties`
    ];
    
    let foundSheets = false;
    
    for (const apiUrl of sheetListApis) {
      console.log(`🔍 尝试API: ${apiUrl.split('/').slice(-2).join('/')}`);
      
      try {
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   状态: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   响应码: ${data.code}`);
          
          if (data.code === 0) {
            console.log(`   数据结构: ${Object.keys(data.data || {})}`);
            
            if (data.data?.sheets) {
              console.log(`   ✅ 找到工作表列表! 数量: ${data.data.sheets.length}`);
              
              data.data.sheets.forEach((s, idx) => {
                console.log(`      ${idx + 1}. ID: ${s.sheet_id}, 标题: ${s.properties?.title || '未知'}`);
              });
              
              foundSheets = true;
              
              // 使用找到的工作表ID测试数据获取
              const firstSheet = data.data.sheets[0];
              if (firstSheet.sheet_id) {
                console.log(`\n   📊 测试工作表数据获取...`);
                
                const dataUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheet.objToken}/values/${firstSheet.sheet_id}!A1:J10`;
                
                const dataResponse = await fetch(dataUrl, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                console.log(`   数据获取状态: ${dataResponse.status}`);
                
                if (dataResponse.ok) {
                  const dataResult = await dataResponse.json();
                  const values = dataResult.data?.values || [];
                  console.log(`   🎉 成功获取数据! 行数: ${values.length}`);
                  
                  if (values.length > 0) {
                    console.log(`   📋 数据预览:`);
                    for (let i = 0; i < Math.min(3, values.length); i++) {
                      const row = values[i] || [];
                      if (row.some(cell => cell && cell.toString().trim())) {
                        console.log(`      ${i + 1}. ${row.slice(0, 5).join(' | ')}`);
                      }
                    }
                  }
                }
              }
              
              break;
            }
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ 失败: ${errorText.substring(0, 100)}`);
        }
      } catch (error) {
        console.log(`   ❌ 异常: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (!foundSheets) {
      console.log('   ⚠️ 无法获取工作表列表');
      
      // 尝试直接使用可能的工作表ID
      console.log('   🔍 尝试常见工作表ID...');
      
      const commonSheetIds = [
        // 常见的默认ID
        'Sheet1', 'sheet1', 'Sheet_1', 'sheet_1',
        // 数字ID
        '0', '1', '2',
        // GUID格式
        'shtxxxxxxx'
      ];
      
      for (const sheetId of commonSheetIds.slice(0, 5)) { // 只测试前5个
        const testUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${sheet.objToken}/values/${sheetId}!A1:E5`;
        
        try {
          const testResponse = await fetch(testUrl, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (testResponse.ok) {
            const testData = await testResponse.json();
            if (testData.code === 0 && testData.data?.values?.length > 0) {
              console.log(`   ✅ 工作表ID "${sheetId}" 有效! 数据行数: ${testData.data.values.length}`);
              foundSheets = true;
              break;
            }
          }
        } catch (error) {
          // 忽略错误，继续尝试
        }
      }
    }
  }
}

getSheetIds().catch(console.error);