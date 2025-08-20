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

// 处理GET请求 - 发起OAuth流程和处理回调
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');
    
    console.log('Google OAuth请求:', { code: !!code, error, state });
    
    // 检查是否有错误
    if (error) {
      console.error('Google OAuth错误:', error);
      return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=${encodeURIComponent(error)}`);
    }
    
    // 如果有授权码，处理回调
    if (code) {
      try {
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
            redirect_uri: `${env.APP_URL || 'http://localhost:3000'}/api/auth/google`
          })
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Google token exchange失败:', errorText);
          return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=token_exchange_failed`);
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
          return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=user_info_failed`);
        }
        
        const googleUser: GoogleUserInfo = await userResponse.json();
        console.log('Google用户信息:', { email: googleUser.email, name: googleUser.name });
        
        // 步骤3: 创建或更新本地用户
        const user = await createOrUpdateGoogleUser(env, googleUser);
        
        // 步骤4: 创建会话
        const sessionToken = await createUserSession(env, user);
        
        // 步骤5: 重定向到前端，携带会话token
        const redirectUrl = new URL(env.APP_URL || 'http://localhost:3000');
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
        return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=callback_failed`);
      }
    }
    
    // 如果没有授权码，发起OAuth流程
    const authUrl = new URL('https://accounts.google.com/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${env.APP_URL || 'http://localhost:3000'}/api/auth/google`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', crypto.randomUUID()); // CSRF protection
    
    console.log('重定向到Google授权页面');
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