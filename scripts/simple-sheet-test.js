#!/usr/bin/env node

require('dotenv').config();

async function testSheetAPI() {
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
  
  // 2. 测试表格信息获取
  const objToken = 'PERPsZO0ph5nZztjBTSctDAdnYg';
  const infoUrl = `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${objToken}`;
  
  console.log('🔍 测试URL:', infoUrl);
  
  const infoResponse = await fetch(infoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('📊 响应状态:', infoResponse.status);
  
  if (infoResponse.ok) {
    const infoData = await infoResponse.json();
    console.log('✅ 表格信息获取成功');
    console.log('📋 表格标题:', infoData.data?.spreadsheet?.title);
    
    // 3. 尝试多种API版本获取工作表列表
    console.log('\n🔍 尝试不同API版本获取工作表...');
    
    const sheetsUrls = [
      `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${objToken}/sheets`,
      `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/sheets`, 
      `https://open.feishu.cn/open-apis/drive/v1/files/${objToken}/spreadsheets`
    ];
    
    let sheetsData = null;
    let workingUrl = null;
    
    for (const url of sheetsUrls) {
      console.log('🔍 尝试URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 工作表API调用成功');
        console.log('📋 响应数据结构:', Object.keys(data));
        
        if (data.data?.sheets) {
          sheetsData = data;
          workingUrl = url;
          console.log('🎉 找到工作表数据!');
          break;
        }
      } else {
        const errorText = await response.text();
        console.log('❌ 失败:', response.status, errorText.substring(0, 100));
      }
    }
    
    // 4. 如果没有找到工作表API，直接尝试数据获取
    if (!sheetsData) {
      console.log('\n🔍 直接尝试获取默认工作表数据...');
      
      // 尝试一些常见的工作表ID格式
      const defaultSheetIds = ['', '0', 'Sheet1', 'sheet1'];
      
      for (const sheetId of defaultSheetIds) {
        const range = 'A1:J20'; // 中等范围测试
        const dataUrl = sheetId ? 
          `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/${sheetId}!${range}` :
          `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/${range}`;
        
        console.log('🔍 尝试数据URL:', dataUrl);
        
        const dataResponse = await fetch(dataUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 数据响应状态:', dataResponse.status);
        
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          const values = data.data?.values || [];
          console.log('✅ 数据获取成功!');
          console.log('📊 数据行数:', values.length);
          
          if (values.length > 0) {
            console.log('📋 数据预览:');
            for (let i = 0; i < Math.min(5, values.length); i++) {
              const row = values[i] || [];
              if (row.some(cell => cell && cell.toString().trim())) {
                console.log(`   ${i + 1}. ${row.slice(0, 8).join(' | ')}${row.length > 8 ? ' ...' : ''}`);
              }
            }
            
            const cellCount = values.reduce((sum, row) => sum + row.length, 0);
            console.log(`📊 总单元格数: ${cellCount}`);
            console.log(`📊 预估内容长度: ${cellCount * 15} 字符`);
            
            // 找到了工作数据，退出
            break;
          }
        } else {
          const errorText = await dataResponse.text();
          console.log('❌ 数据获取失败:', dataResponse.status, errorText.substring(0, 100));
        }
      }
    } else {
      // 使用找到的工作表数据
      console.log('\n📋 工作表数量:', sheetsData.data.sheets.length);
      
      if (sheetsData.data.sheets.length > 0) {
        const firstSheet = sheetsData.data.sheets[0];
        console.log('📋 第一个工作表:', firstSheet.properties?.title);
        console.log('📊 工作表ID:', firstSheet.sheet_id);
        
        // 获取数据
        const range = 'A1:J20';
        const dataUrl = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/${firstSheet.sheet_id}!${range}`;
        
        console.log('🔍 数据URL:', dataUrl);
        
        const dataResponse = await fetch(dataUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 数据响应状态:', dataResponse.status);
        
        if (dataResponse.ok) {
          const data = await dataResponse.json();
          const values = data.data?.values || [];
          console.log('✅ 数据获取成功');
          console.log('📊 数据行数:', values.length);
          
          if (values.length > 0) {
            console.log('📋 数据预览:');
            for (let i = 0; i < Math.min(5, values.length); i++) {
              const row = values[i] || [];
              if (row.some(cell => cell && cell.toString().trim())) {
                console.log(`   ${i + 1}. ${row.slice(0, 8).join(' | ')}${row.length > 8 ? ' ...' : ''}`);
              }
            }
            
            const cellCount = values.reduce((sum, row) => sum + row.length, 0);
            console.log(`📊 总单元格数: ${cellCount}`);
            console.log(`📊 预估内容长度: ${cellCount * 15} 字符`);
          }
        } else {
          const errorText = await dataResponse.text();
          console.error('❌ 数据获取失败:', dataResponse.status, errorText.substring(0, 200));
        }
      }
    }
  } else {
    const errorText = await infoResponse.text();
    console.error('❌ 表格信息获取失败:', infoResponse.status, errorText.substring(0, 200));
  }
}

testSheetAPI().catch(console.error);