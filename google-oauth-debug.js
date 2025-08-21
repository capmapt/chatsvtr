/**
 * Google OAuth 应用状态诊断
 */

async function checkGoogleOAuthApp() {
  const clientId = '369633995349-7apl7m77mpeo4231b1kl2v3nonqi60ga.apps.googleusercontent.com';
  
  console.log('🔍 Google OAuth 应用状态检查');
  console.log('==============================');
  console.log(`Client ID: ${clientId}`);
  
  // 测试Google OAuth发现端点
  console.log('\n1. 测试 Google OAuth 发现端点...');
  try {
    const discoveryResponse = await fetch('https://accounts.google.com/.well-known/openid_configuration');
    const discovery = await discoveryResponse.json();
    console.log(`✅ Google OAuth 服务正常`);
    console.log(`   授权端点: ${discovery.authorization_endpoint}`);
    console.log(`   Token端点: ${discovery.token_endpoint}`);
  } catch (error) {
    console.log(`❌ Google OAuth 服务异常: ${error.message}`);
  }
  
  // 测试Client ID有效性
  console.log('\n2. 测试 Client ID 有效性...');
  const testAuthUrl = new URL('https://accounts.google.com/oauth2/v2/auth');
  testAuthUrl.searchParams.set('client_id', clientId);
  testAuthUrl.searchParams.set('redirect_uri', 'https://svtr.ai/api/auth/google');
  testAuthUrl.searchParams.set('response_type', 'code');
  testAuthUrl.searchParams.set('scope', 'openid email profile');
  testAuthUrl.searchParams.set('state', 'test_state');
  
  console.log(`测试URL: ${testAuthUrl.toString()}`);
  
  try {
    const response = await fetch(testAuthUrl.toString(), {
      method: 'HEAD',
      redirect: 'manual'
    });
    
    console.log(`状态码: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log(`✅ Client ID 有效，OAuth应用正常`);
    } else if (response.status === 400) {
      console.log(`❌ Client ID 无效或应用配置错误`);
    } else if (response.status === 404) {
      console.log(`❌ OAuth应用不存在或已被删除`);
    } else {
      console.log(`⚠️  状态码异常: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }
  
  // 检查可能的配置问题
  console.log('\n3. 配置检查建议...');
  console.log('请在 Google Cloud Console 中验证:');
  console.log('- OAuth 应用是否存在且启用');
  console.log('- Client ID 是否正确');
  console.log('- 授权重定向 URI 是否包含: https://svtr.ai/api/auth/google');
  console.log('- 应用状态是否为"已发布"');
  console.log('- 域名验证是否完成');
  
  console.log('\n4. 临时解决方案...');
  console.log('如果OAuth应用有问题，可以考虑:');
  console.log('- 创建新的Google OAuth应用');
  console.log('- 使用测试模式验证功能');
  console.log('- 检查API配额是否超限');
}

checkGoogleOAuthApp().catch(console.error);