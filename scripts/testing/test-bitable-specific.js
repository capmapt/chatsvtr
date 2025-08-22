#!/usr/bin/env node

/**
 * 专门测试"交易精选"多维表格的脚本
 */

require('dotenv').config();

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis',
  spaceId: '7321328173944340484'
};

let accessToken = null;

async function getAccessToken() {
  const url = `${config.baseUrl}/auth/v3/tenant_access_token/internal`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret
      })
    });
    
    const data = await response.json();
    
    if (data.code === 0) {
      accessToken = data.tenant_access_token;
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

// 测试"交易精选"多维表格
async function testTradingPicksBitable() {
  console.log('\n🎯 开始测试"交易精选"多维表格...');
  
  // 交易精选的 objToken (从数据中获取)
  const appToken = 'XCNeb9GjNaQaeYsm7WwcZRSJn1f';
  const title = '交易精选';
  
  try {
    // 1. 获取应用基本信息
    console.log(`📊 步骤1: 获取应用信息...`);
    const appInfoUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}`;
    
    const appInfoResponse = await fetch(appInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 应用信息API响应状态: ${appInfoResponse.status}`);
    
    if (!appInfoResponse.ok) {
      const errorText = await appInfoResponse.text();
      console.log('❌ 应用信息获取失败:', errorText.substring(0, 500));
      return false;
    }

    const appInfo = await appInfoResponse.json();
    console.log('✅ 应用信息获取成功:', JSON.stringify(appInfo, null, 2).substring(0, 300));

    // 2. 获取所有数据表
    console.log(`\n📋 步骤2: 获取数据表列表...`);
    const tablesUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}/tables`;
    
    const tablesResponse = await fetch(tablesUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📋 数据表API响应状态: ${tablesResponse.status}`);

    if (!tablesResponse.ok) {
      const errorText = await tablesResponse.text();
      console.log('❌ 数据表获取失败:', errorText.substring(0, 500));
      return false;
    }

    const tablesData = await tablesResponse.json();
    const tables = tablesData.data?.items || [];
    
    console.log(`✅ 发现 ${tables.length} 个数据表`);
    
    if (tables.length > 0) {
      console.log('📋 数据表列表:');
      tables.forEach((table, index) => {
        console.log(`  ${index + 1}. ${table.name || table.table_id} (ID: ${table.table_id})`);
      });
    }

    // 3. 尝试获取第一个数据表的数据
    if (tables.length > 0) {
      const firstTable = tables[0];
      console.log(`\n📊 步骤3: 获取数据表"${firstTable.name}"的数据...`);
      
      // 获取字段信息
      const fieldsUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${firstTable.table_id}/fields`;
      const fieldsResponse = await fetch(fieldsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`🏷️ 字段API响应状态: ${fieldsResponse.status}`);

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        const fields = fieldsData.data?.items || [];
        console.log(`✅ 发现 ${fields.length} 个字段`);
        
        if (fields.length > 0) {
          console.log('🏷️ 字段列表:');
          fields.forEach((field, index) => {
            console.log(`  ${index + 1}. ${field.field_name} (${field.type}, ID: ${field.field_id})`);
          });
        }
      }

      // 获取记录数据
      const recordsUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${firstTable.table_id}/records?page_size=10`;
      const recordsResponse = await fetch(recordsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📝 记录API响应状态: ${recordsResponse.status}`);

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        const records = recordsData.data?.items || [];
        
        console.log(`✅ 获取到 ${records.length} 条记录`);
        
        if (records.length > 0) {
          console.log('\n📝 记录示例 (前3条):');
          records.slice(0, 3).forEach((record, index) => {
            console.log(`\n  记录 ${index + 1}:`);
            console.log(`    记录ID: ${record.record_id}`);
            console.log(`    字段数据:`, JSON.stringify(record.fields, null, 4).substring(0, 300));
          });
        }
      } else {
        const errorText = await recordsResponse.text();
        console.log('❌ 记录获取失败:', errorText.substring(0, 500));
      }
    }

    console.log('\n🎉 测试完成！');
    return true;

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🚀 开始测试"交易精选"多维表格...\n');
  
  // 认证
  const authSuccess = await getAccessToken();
  if (!authSuccess) {
    process.exit(1);
  }
  
  // 测试多维表格
  await testTradingPicksBitable();
}

main().catch(console.error);