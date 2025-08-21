/**
 * Google OAuth 2.0 认证集成
 * 支持Google账号登录SVTR平台
 */

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token: string;
}

// 创建或更新用户（复用auth.ts的逻辑）
async function createOrUpdateGoogleUser(env: any, googleUser: GoogleUserInfo): Promise<any> {
  const existingUserData = await env.SVTR_CACHE.get(`user_${googleUser.email}`);
  
  const userData = {
    email: googleUser.email,
    name: googleUser.name,
    avatar: googleUser.picture,
    provider: 'google' as const
  };
  
  if (existingUserData) {
    // 更新现有用户
    const existingUser = JSON.parse(existingUserData);
    const updatedUser = {
      ...existingUser,
      ...userData,
      lastLoginAt: new Date().toISOString()
    };
    
    await env.SVTR_CACHE.put(`user_${googleUser.email}`, JSON.stringify(updatedUser));
    await env.SVTR_CACHE.put(`user_id_${updatedUser.id}`, JSON.stringify(updatedUser));
    
    return updatedUser;
  } else {
    // 创建新用户
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true
    };
    
    await env.SVTR_CACHE.put(`user_${googleUser.email}`, JSON.stringify(newUser));
    await env.SVTR_CACHE.put(`user_id_${newUser.id}`, JSON.stringify(newUser));
    
    return newUser;
  }
}

// 创建用户会话
async function createUserSession(env: any, user: any): Promise<string> {
  const sessionToken = crypto.randomUUID() + '_' + Math.random().toString(36).substr(2, 16);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天过期
  
  const session = {
    userId: user.id,
    email: user.email,
    token: sessionToken,
    expiresAt,
    createdAt: new Date().toISOString()
  };
  
  await env.SVTR_CACHE.put(`session_${sessionToken}`, JSON.stringify(session), {
    expirationTtl: 30 * 24 * 60 * 60 // 30天
  });
  
  return sessionToken;
}

// 获取当前域名
function getCurrentDomain(request: Request, env: any): string {
  const requestUrl = new URL(request.url);
  const hostname = requestUrl.hostname;
  
  // 支持的域名列表
  const allowedDomains = [
    'svtr.ai',
    'svtrai.com', 
    'svtr.cn',
    'svtrglobal.com',
    'chatsvtr.pages.dev',
    'localhost:3000'
  ];
  
  // 检查当前域名是否在允许列表中
  for (const domain of allowedDomains) {
    if (hostname.includes(domain.split(':')[0])) {
      return requestUrl.protocol + '//' + requestUrl.host;
    }
  }
  
  // 默认返回配置的主域名
  return env.APP_URL || 'https://svtr.ai';
}

// 处理GET请求 - 发起OAuth流程和处理回调
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');
    
    // 获取当前访问的域名
    const currentDomain = getCurrentDomain(request, env);
    console.log('Google OAuth请求:', { code: !!code, error, state, domain: currentDomain });
    
    // 检查是否有错误
    if (error) {
      console.error('Google OAuth错误:', error);
      return Response.redirect(`${currentDomain}?auth_error=${encodeURIComponent(error)}`);
    }
    
    // 如果有授权码，处理回调
    if (code) {
      try {
        // 解析state中的原始域名
        let originalDomain = currentDomain;
        if (state) {
          try {
            const stateData = JSON.parse(atob(state));
            originalDomain = stateData.originalDomain || currentDomain;
            console.log('Google OAuth回调，原始域名:', originalDomain);
          } catch (e) {
            console.warn('无法解析state参数:', e);
          }
        }
        
        // 使用统一回调域名进行token交换
        const unifiedCallbackDomain = env.APP_URL || 'https://svtr.ai';
        // 步骤1: 用授权码换取访问令牌
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${unifiedCallbackDomain}/api/auth/google`
          })
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Google token exchange失败:', errorText);
          return Response.redirect(`${originalDomain}?auth_error=token_exchange_failed`);
        }
        
        const tokens: GoogleTokenResponse = await tokenResponse.json();
        console.log('Google tokens获取成功');
        
        // 步骤2: 使用访问令牌获取用户信息
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('Google用户信息获取失败:', errorText);
          return Response.redirect(`${originalDomain}?auth_error=user_info_failed`);
        }
        
        const googleUser: GoogleUserInfo = await userResponse.json();
        console.log('Google用户信息:', { email: googleUser.email, name: googleUser.name });
        
        // 步骤3: 创建或更新本地用户
        const user = await createOrUpdateGoogleUser(env, googleUser);
        
        // 步骤4: 创建会话
        const sessionToken = await createUserSession(env, user);
        
        // 步骤5: 重定向到前端，携带会话token
        const redirectUrl = new URL(originalDomain);
        redirectUrl.searchParams.set('auth_success', 'true');
        redirectUrl.searchParams.set('token', sessionToken);
        redirectUrl.searchParams.set('user', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar
        }));
        
        return Response.redirect(redirectUrl.toString());
        
      } catch (error) {
        console.error('Google OAuth回调处理失败:', error);
        return Response.redirect(`${originalDomain}?auth_error=callback_failed`);
      }
    }
    
    // 如果没有授权码，发起OAuth流程
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    
    // 使用统一回调域名策略，与GitHub OAuth保持一致
    const unifiedCallbackDomain = env.APP_URL || 'https://svtr.ai';
    authUrl.searchParams.set('redirect_uri', `${unifiedCallbackDomain}/api/auth/google`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    
    // 在state中保存原始域名，用于回调后重定向
    const stateData = {
      csrf: crypto.randomUUID(),
      originalDomain: currentDomain
    };
    authUrl.searchParams.set('state', btoa(JSON.stringify(stateData))); // Base64编码
    
    console.log('重定向到Google授权页面');
    console.log('- redirect_uri:', `${unifiedCallbackDomain}/api/auth/google`);
    console.log('- 原始域名:', currentDomain);
    return Response.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Google OAuth处理失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Google登录失败',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理OPTIONS请求 - CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}