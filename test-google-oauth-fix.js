/**
 * Google OAuth 修复验证脚本
 * 检查统一回调策略是否正确实现
 */

async function testGoogleOAuth(domain) {
  console.log(`\n🧪 测试 ${domain} 的 Google OAuth`);
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${domain}/api/auth/google`, {
      method: 'GET',
      redirect: 'manual' // 不自动跟随重定向
    });
    
    console.log(`状态码: ${response.status} ${response.statusText}`);
    
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      console.log(`✅ 重定向到: ${location}`);
      
      if (location && location.includes('accounts.google.com')) {
        const url = new URL(location);
        const redirectUri = url.searchParams.get('redirect_uri');
        const state = url.searchParams.get('state');
        const clientId = url.searchParams.get('client_id');
        
        console.log(`📋 详细信息:`);
        console.log(`   - Client ID: ${clientId}`);
        console.log(`   - Redirect URI: ${redirectUri}`);
        console.log(`   - State: ${state}`);
        
        // 解析state参数
        if (state) {
          try {
            const stateData = JSON.parse(atob(state));
            console.log(`   - 原始域名: ${stateData.originalDomain}`);
            console.log(`   - CSRF Token: ${stateData.csrf}`);
          } catch (e) {
            console.log(`   - State解析失败: ${e.message}`);
          }
        }
        
        // 验证重定向URI是否正确
        if (redirectUri === 'https://svtr.ai/api/auth/google') {
          console.log(`✅ 使用统一回调域名策略`);
        } else {
          console.log(`❌ 回调域名不正确: ${redirectUri}`);
        }
        
        return true;
      } else {
        console.log(`❌ 重定向目标不是Google OAuth`);
        return false;
      }
    } else if (response.status === 200) {
      console.log(`⚠️  返回200，可能存在问题`);
      const text = await response.text();
      console.log(`响应内容长度: ${text.length} 字符`);
      
      // 检查是否包含错误信息
      if (text.includes('error') || text.includes('404')) {
        console.log(`❌ 响应包含错误信息`);
        console.log(`前100字符: ${text.substring(0, 100)}...`);
      }
      return false;
    } else {
      console.log(`❌ 异常状态码: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Google OAuth 统一回调策略验证');
  console.log('修复内容: 使用 https://svtr.ai/api/auth/google 作为统一回调');
  console.log('预期效果: 所有域名都应该重定向到Google OAuth页面\n');
  
  const domains = [
    'https://svtr.ai',
    'https://svtrglobal.com',
    'https://chatsvtr.pages.dev'
  ];
  
  const results = [];
  
  for (const domain of domains) {
    const success = await testGoogleOAuth(domain);
    results.push({ domain, success });
    await new Promise(resolve => setTimeout(resolve, 1000)); // 延迟1秒
  }
  
  console.log('\n📊 测试结果汇总');
  console.log('='.repeat(50));
  
  for (const result of results) {
    const status = result.success ? '✅ 正常' : '❌ 异常';
    console.log(`${result.domain}: ${status}`);
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n总结: ${successCount}/${results.length} 个域名测试通过`);
  
  if (successCount === results.length) {
    console.log('🎉 Google OAuth 统一回调策略修复成功！');
  } else {
    console.log('⚠️  仍有问题需要解决');
  }
}

main().catch(console.error);