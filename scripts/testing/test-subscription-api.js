#!/usr/bin/env node

/**
 * 测试订阅API的完整功能
 * 验证邮箱订阅、数据存储和查询功能
 */

const https = require('https');
const http = require('http');

// 测试配置
const config = {
  // 本地测试使用Wrangler dev服务器
  baseUrl: 'http://localhost:3000',
  // 生产环境使用: https://chatsvtr.pages.dev
  testEmails: [
    'test1@example.com',
    'test2@gmail.com',
    'admin@svtr.ai'
  ]
};

// HTTP请求工具
function makeRequest(url, options = {}) {
  const isHttps = url.startsWith('https');
  const client = isHttps ? https : http;
  
  return new Promise((resolve, reject) => {
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          };
          resolve(result);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 测试邮箱订阅
async function testEmailSubscription(email, preferences = ['AI周报', '市场洞察']) {
  console.log(`\n📧 测试邮箱订阅: ${email}`);
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        preferences,
        language: 'zh-CN'
      })
    });
    
    console.log(`   状态码: ${response.statusCode}`);
    console.log(`   响应: ${JSON.stringify(response.body, null, 2)}`);
    
    return response.statusCode === 200 && response.body?.success;
    
  } catch (error) {
    console.error(`   错误: ${error.message}`);
    return false;
  }
}

// 测试获取统计数据
async function testGetStats() {
  console.log('\n📊 测试获取统计数据');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/subscribe?action=stats`);
    
    console.log(`   状态码: ${response.statusCode}`);
    console.log(`   统计数据: ${JSON.stringify(response.body, null, 2)}`);
    
    return response.statusCode === 200;
    
  } catch (error) {
    console.error(`   错误: ${error.message}`);
    return false;
  }
}

// 测试获取订阅者列表
async function testGetSubscribersList() {
  console.log('\n📋 测试获取订阅者列表');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/subscribe?action=list`);
    
    console.log(`   状态码: ${response.statusCode}`);
    console.log(`   订阅者数量: ${Array.isArray(response.body) ? response.body.length : 0}`);
    
    if (Array.isArray(response.body) && response.body.length > 0) {
      console.log(`   示例订阅者: ${JSON.stringify(response.body[0], null, 2)}`);
    }
    
    return response.statusCode === 200;
    
  } catch (error) {
    console.error(`   错误: ${error.message}`);
    return false;
  }
}

// 测试取消订阅
async function testUnsubscribe(email) {
  console.log(`\n❌ 测试取消订阅: ${email}`);
  
  try {
    const response = await makeRequest(`${config.baseUrl}/api/subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    console.log(`   状态码: ${response.statusCode}`);
    console.log(`   响应: ${JSON.stringify(response.body, null, 2)}`);
    
    return response.statusCode === 200 && response.body?.success;
    
  } catch (error) {
    console.error(`   错误: ${error.message}`);
    return false;
  }
}

// 检查服务器状态
async function checkServerHealth() {
  console.log('🔍 检查服务器状态...');
  
  try {
    const response = await makeRequest(`${config.baseUrl}/`);
    console.log(`   状态码: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('   ✅ 服务器运行正常');
      return true;
    } else {
      console.log('   ❌ 服务器状态异常');
      return false;
    }
  } catch (error) {
    console.error(`   ❌ 服务器连接失败: ${error.message}`);
    console.log('\n提示：请确保已启动开发服务器：');
    console.log('   npm run dev  # 或者');
    console.log('   wrangler pages dev . --port 8787');
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🧪 SVTR 订阅API功能测试');
  console.log('==========================');
  
  const results = {
    serverHealth: false,
    subscriptions: [],
    stats: false,
    list: false,
    unsubscribe: false
  };
  
  // 1. 检查服务器状态
  results.serverHealth = await checkServerHealth();
  if (!results.serverHealth) {
    console.log('\n❌ 服务器未运行，测试终止');
    return;
  }
  
  // 2. 测试订阅功能
  for (const email of config.testEmails) {
    const success = await testEmailSubscription(email);
    results.subscriptions.push({ email, success });
  }
  
  // 3. 测试统计数据
  results.stats = await testGetStats();
  
  // 4. 测试订阅者列表
  results.list = await testGetSubscribersList();
  
  // 5. 测试取消订阅
  if (results.subscriptions.length > 0) {
    results.unsubscribe = await testUnsubscribe(config.testEmails[0]);
  }
  
  // 输出测试结果摘要
  console.log('\n📋 测试结果摘要');
  console.log('================');
  console.log(`服务器健康检查: ${results.serverHealth ? '✅ 通过' : '❌ 失败'}`);
  console.log(`邮箱订阅功能: ${results.subscriptions.filter(s => s.success).length}/${results.subscriptions.length} 通过`);
  console.log(`统计数据API: ${results.stats ? '✅ 通过' : '❌ 失败'}`);
  console.log(`订阅者列表API: ${results.list ? '✅ 通过' : '❌ 失败'}`);
  console.log(`取消订阅API: ${results.unsubscribe ? '✅ 通过' : '❌ 失败'}`);
  
  const allTestsPassed = results.serverHealth && 
                        results.subscriptions.every(s => s.success) &&
                        results.stats && 
                        results.list && 
                        results.unsubscribe;
  
  console.log(`\n${allTestsPassed ? '🎉' : '⚠️'} 总体结果: ${allTestsPassed ? '所有测试通过' : '部分测试失败'}`);
  
  if (allTestsPassed) {
    console.log('\n✨ 订阅功能已成功实现！');
    console.log(`\n📱 管理面板访问地址: ${config.baseUrl}/pages/admin-dashboard.html`);
    console.log('   可以在管理面板中查看所有订阅数据');
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };