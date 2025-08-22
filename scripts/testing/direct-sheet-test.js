#!/usr/bin/env node

/**
 * 直接表格数据测试 - 绕过工作表列表API
 * 权限已开通，测试不同的数据获取方式
 */

require('dotenv').config();

async function directSheetTest() {
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
  
  // 2. 测试不同的表格数据获取方式
  const objToken = 'PERPsZO0ph5nZztjBTSctDAdnYg';
  const title = 'SVTR.AI创投季度观察';
  
  console.log(`\n🔍 测试表格: ${title}`);
  
  // 策略1: 尝试不同的API版本和范围
  const testConfigs = [
    // v3 API
    {
      url: `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${objToken}/values/A1:Z100`,
      desc: 'v3 API 标准范围'
    },
    {
      url: `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${objToken}/values/A1:ZZ1000`,
      desc: 'v3 API 大范围'
    },
    // v2 API
    {
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/A1:Z100`,
      desc: 'v2 API 标准范围'
    },
    {
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/A1:ZZ1000`,
      desc: 'v2 API 大范围'
    },
    // 尝试带工作表名称
    {
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/Sheet1!A1:Z100`,
      desc: 'v2 API Sheet1'
    },
    {
      url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values/0!A1:Z100`,
      desc: 'v2 API Sheet ID 0'
    }
  ];
  
  let successFound = false;
  
  for (const config of testConfigs) {
    console.log(`\n🔍 测试: ${config.desc}`);
    console.log(`   URL: ${config.url}`);
    
    try {
      const response = await fetch(config.url, {
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
          const values = data.data?.values || [];
          console.log(`   数据行数: ${values.length}`);
          
          if (values.length > 0) {
            const cellCount = values.reduce((sum, row) => sum + row.length, 0);
            console.log(`   ✅ 成功！获取 ${cellCount} 个单元格`);
            
            // 显示数据预览
            console.log(`   📋 数据预览 (前3行):`);
            for (let i = 0; i < Math.min(3, values.length); i++) {
              const row = values[i] || [];
              if (row.some(cell => cell && cell.toString().trim())) {
                console.log(`      ${i + 1}. ${row.slice(0, 5).join(' | ')}${row.length > 5 ? ' ...' : ''}`);
              }
            }
            
            successFound = true;
            break;
          } else {
            console.log(`   ⚠️ 返回0行数据`);
          }
        } else {
          console.log(`   ❌ API错误: ${data.msg}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ HTTP错误: ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ❌ 请求异常: ${error.message}`);
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (!successFound) {
    console.log('\n🔍 尝试获取表格元数据以验证访问权限...');
    
    // 获取表格基础信息
    const infoUrl = `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${objToken}`;
    const infoResponse = await fetch(infoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      if (infoData.code === 0) {
        console.log('✅ 表格元数据访问正常');
        console.log(`   标题: ${infoData.data?.spreadsheet?.title}`);
        console.log(`   创建者: ${infoData.data?.spreadsheet?.owner_id}`);
        console.log(`   链接: ${infoData.data?.spreadsheet?.url}`);
        
        // 尝试新的API路径
        console.log('\n🔍 尝试新的数据访问路径...');
        
        const newPaths = [
          // 使用 drive API
          `https://open.feishu.cn/open-apis/drive/v1/files/${objToken}/download`,
          // 使用 bitable API (如果是多维表格)
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${objToken}`,
          // 尝试不同的sheets路径
          `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${objToken}/values_batch?ranges=A1:Z100`
        ];
        
        for (const path of newPaths) {
          console.log(`🔍 测试路径: ${path}`);
          
          try {
            const testResponse = await fetch(path, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`   状态: ${testResponse.status}`);
            
            if (testResponse.ok) {
              const testData = await testResponse.json();
              console.log(`   响应结构: ${Object.keys(testData)}`);
              
              if (testData.data) {
                console.log(`   数据结构: ${Object.keys(testData.data)}`);
              }
            }
          } catch (error) {
            console.log(`   ❌ 异常: ${error.message}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }
  
  if (successFound) {
    console.log('\n🎉 找到可用的数据访问方式！可以进行完整同步。');
  } else {
    console.log('\n⚠️ 所有数据访问方式均返回空数据。可能的原因：');
    console.log('   1. 表格确实为空（请在飞书界面确认）');
    console.log('   2. 数据在其他工作表中');
    console.log('   3. 需要特殊的API参数或权限');
    console.log('   4. 表格类型不是标准电子表格');
  }
}

directSheetTest().catch(console.error);