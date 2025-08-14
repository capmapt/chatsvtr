#!/usr/bin/env node

/**
 * 调试 metainfo API 响应，查看完整数据结构
 */

require('dotenv').config();

async function debugMetainfo() {
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
  
  // 2. 获取完整的 metainfo 数据
  const objToken = 'PERPsZO0ph5nZztjBTSctDAdnYg';
  const metaUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/metainfo`;
  
  console.log(`\n🔍 获取 metainfo: ${objToken}`);
  
  try {
    const response = await fetch(metaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n📊 完整响应数据:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.code === 0 && data.data?.sheets) {
        console.log('\n📋 工作表详细信息:');
        
        data.data.sheets.forEach((sheet, idx) => {
          console.log(`\n工作表 ${idx + 1}:`);
          console.log(`  完整对象:`, JSON.stringify(sheet, null, 2));
          
          // 尝试不同的字段名
          const possibleIds = [
            sheet.sheet_id,
            sheet.sheetId, 
            sheet.id,
            sheet.guid,
            sheet.token
          ];
          
          const possibleTitles = [
            sheet.title,
            sheet.name,
            sheet.properties?.title,
            sheet.properties?.name
          ];
          
          console.log(`  可能的ID: ${possibleIds.filter(id => id).join(', ') || '未找到'}`);
          console.log(`  可能的标题: ${possibleTitles.filter(title => title).join(', ') || '未找到'}`);
        });
        
        // 如果找到了有效的工作表ID，尝试获取数据
        const firstSheet = data.data.sheets[0];
        if (firstSheet) {
          console.log('\n🔍 尝试使用工作表信息获取数据...');
          
          // 尝试所有可能的ID字段
          const idCandidates = [
            firstSheet.sheet_id,
            firstSheet.sheetId,
            firstSheet.id,
            firstSheet.guid,
            firstSheet.token,
            '0', // 默认ID
            'Sheet1' // 默认名称
          ].filter(id => id);
          
          for (const sheetId of idCandidates) {
            console.log(`\n   📊 测试工作表ID: "${sheetId}"`);
            
            const dataUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/${sheetId}!A1:J10`;
            
            try {
              const dataResponse = await fetch(dataUrl, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              console.log(`   状态: ${dataResponse.status}`);
              
              if (dataResponse.ok) {
                const dataResult = await dataResponse.json();
                console.log(`   响应码: ${dataResult.code}`);
                
                if (dataResult.code === 0) {
                  const values = dataResult.data?.values || [];
                  console.log(`   🎉 成功! 数据行数: ${values.length}`);
                  
                  if (values.length > 0) {
                    console.log(`   📋 数据预览:`);
                    for (let i = 0; i < Math.min(3, values.length); i++) {
                      const row = values[i] || [];
                      if (row.some(cell => cell && cell.toString().trim())) {
                        console.log(`      ${i + 1}. ${row.slice(0, 5).join(' | ')}`);
                      }
                    }
                    
                    // 成功找到数据，记录这个ID
                    console.log(`\n✅ 有效的工作表ID: "${sheetId}"`);
                    break;
                  }
                } else {
                  console.log(`   错误: ${dataResult.msg}`);
                }
              }
            } catch (error) {
              console.log(`   异常: ${error.message}`);
            }
          }
        }
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Metainfo获取失败:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ 请求异常:', error.message);
  }
}

debugMetainfo().catch(console.error);