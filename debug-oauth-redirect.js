/**
 * OAuth重定向URI诊断脚本
 * 检查所有SVTR域名的OAuth配置状态
 */

const domains = [
  'https://svtr.ai',
  'https://svtrai.com', 
  'https://svtr.cn',
  'https://svtrglobal.com',
  'https://chatsvtr.pages.dev'
];

const providers = ['google', 'github'];

async function testOAuthRedirect(domain, provider) {
  const url = `${domain}/api/auth/${provider}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual' // 不自动跟随重定向
    });
    
    console.log(`\n📍 测试: ${domain}/api/auth/${provider}`);
    console.log(`   状态: ${response.status} ${response.statusText}`);
    
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      console.log(`   重定向到: ${location}`);
      
      // 检查重定向URL是否包含正确的redirect_uri
      if (location && location.includes('redirect_uri')) {
        const redirectUri = new URL(location).searchParams.get('redirect_uri');
        console.log(`   回调地址: ${redirectUri}`);
        
        // 验证回调地址是否正确
        const expectedCallback = `${domain}/api/auth/${provider}`;
        if (redirectUri === expectedCallback) {
          console.log(`   ✅ 回调地址正确`);
        } else {
          console.log(`   ❌ 回调地址不匹配，期望: ${expectedCallback}`);
        }
      }
    } else if (response.status === 200) {
      console.log(`   ⚠️  返回200而不是重定向，可能存在问题`);
    } else {
      console.log(`   ❌ 状态异常: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`\n📍 测试: ${domain}/api/auth/${provider}`);
    console.log(`   ❌ 请求失败: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 SVTR OAuth 重定向URI 诊断报告');
  console.log('========================================');
  
  for (const domain of domains) {
    for (const provider of providers) {
      await testOAuthRedirect(domain, provider);
      await new Promise(resolve => setTimeout(resolve, 500)); // 防止请求过快
    }
  }
  
  console.log('\n📋 Google OAuth 应用需要配置的重定向URI:');
  console.log('========================================');
  for (const domain of domains) {
    console.log(`${domain}/api/auth/google`);
  }
  
  console.log('\n📋 GitHub OAuth 应用需要配置的重定向URI:');
  console.log('========================================');
  for (const domain of domains) {
    console.log(`${domain}/api/auth/github`);
  }
  
  console.log('\n💡 如果某个域名出现404错误，请检查:');
  console.log('1. Google Console OAuth应用是否配置了该域名的回调地址');
  console.log('2. GitHub OAuth应用是否配置了该域名的回调地址');
  console.log('3. 域名DNS是否正确指向Cloudflare Pages');
}

main().catch(console.error);