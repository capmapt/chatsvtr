/**
 * LinkedIn OAuth 认证集成
 * 支持LinkedIn账号登录SVTR平台
 */

interface LinkedInUserInfo {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  profilePicture?: {
    'displayImage~': {
      elements: Array<{
        identifiers: Array<{
          identifier: string;
        }>;
      }>;
    };
  };
}

interface LinkedInEmailInfo {
  elements: Array<{
    'handle~': {
      emailAddress: string;
    };
    handle: string;
    primary: boolean;
    type: string;
  }>;
}

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// 获取LinkedIn用户的邮箱
async function getLinkedInEmail(accessToken: string): Promise<string | null> {
  try {
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddresses?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!emailResponse.ok) {
      console.error('LinkedIn邮箱获取失败:', await emailResponse.text());
      return null;
    }
    
    const emailData: LinkedInEmailInfo = await emailResponse.json();
    const primaryEmail = emailData.elements?.find(email => email.primary);
    
    return primaryEmail?.['handle~']?.emailAddress || null;
  } catch (error) {
    console.error('获取LinkedIn邮箱失败:', error);
    return null;
  }
}

// 创建或更新用户
async function createOrUpdateLinkedInUser(env: any, linkedinUser: LinkedInUserInfo, email: string): Promise<any> {
  const existingUserData = await env.SVTR_CACHE.get(`user_${email}`);
  
  // 获取头像URL
  let avatar = '';
  if (linkedinUser.profilePicture?.['displayImage~']?.elements?.length > 0) {
    const firstElement = linkedinUser.profilePicture['displayImage~'].elements[0];
    if (firstElement.identifiers?.length > 0) {
      avatar = firstElement.identifiers[0].identifier;
    }
  }
  
  const userData = {
    email,
    name: `${linkedinUser.localizedFirstName} ${linkedinUser.localizedLastName}`.trim(),
    avatar: avatar || '',
    provider: 'linkedin' as const,
    linkedinProfile: {
      id: linkedinUser.id,
      firstName: linkedinUser.localizedFirstName,
      lastName: linkedinUser.localizedLastName
    }
  };
  
  if (existingUserData) {
    // 更新现有用户
    const existingUser = JSON.parse(existingUserData);
    const updatedUser = {
      ...existingUser,
      ...userData,
      lastLoginAt: new Date().toISOString()
    };
    
    await env.SVTR_CACHE.put(`user_${email}`, JSON.stringify(updatedUser));
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
    
    await env.SVTR_CACHE.put(`user_${email}`, JSON.stringify(newUser));
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
    'localhost'  // 支持所有本地端口
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
    console.log('LinkedIn OAuth请求:', { code: !!code, error, state, domain: currentDomain });
    
    // 检查是否有错误
    if (error) {
      console.error('LinkedIn OAuth错误:', error);
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
            console.log('LinkedIn OAuth回调，原始域名:', originalDomain);
          } catch (e) {
            console.warn('无法解析state参数:', e);
          }
        }
        
        // 使用统一回调域名进行token交换
        const unifiedCallbackDomain = env.APP_URL || 'https://svtr.ai';
        
        // 步骤1: 用授权码换取访问令牌
        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: env.LINKEDIN_CLIENT_ID,
            client_secret: env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: `${unifiedCallbackDomain}/api/auth/linkedin`
          })
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('LinkedIn token exchange失败:', errorText);
          return Response.redirect(`${originalDomain}?auth_error=token_exchange_failed`);
        }
        
        const tokens: LinkedInTokenResponse = await tokenResponse.json();
        console.log('LinkedIn tokens获取成功');
        
        // 步骤2: 使用访问令牌获取用户信息
        const userResponse = await fetch('https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Accept': 'application/json'
          }
        });
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('LinkedIn用户信息获取失败:', errorText);
          return Response.redirect(`${originalDomain}?auth_error=user_info_failed`);
        }
        
        const linkedinUser: LinkedInUserInfo = await userResponse.json();
        console.log('LinkedIn用户信息:', { id: linkedinUser.id, name: `${linkedinUser.localizedFirstName} ${linkedinUser.localizedLastName}` });
        
        // 步骤3: 获取用户邮箱
        const email = await getLinkedInEmail(tokens.access_token);
        
        if (!email) {
          console.error('无法获取LinkedIn用户邮箱');
          return Response.redirect(`${originalDomain}?auth_error=no_email`);
        }
        
        // 步骤4: 创建或更新本地用户
        const user = await createOrUpdateLinkedInUser(env, linkedinUser, email);
        
        // 步骤5: 创建会话
        const sessionToken = await createUserSession(env, user);
        
        // 步骤6: 重定向到前端，携带会话token
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
        console.error('LinkedIn OAuth回调处理失败:', error);
        return Response.redirect(`${originalDomain}?auth_error=callback_failed`);
      }
    }
    
    // 如果没有授权码，发起OAuth流程
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', env.LINKEDIN_CLIENT_ID);
    
    // 使用统一回调域名策略，与Google和GitHub OAuth保持一致
    const unifiedCallbackDomain = env.APP_URL || 'https://svtr.ai';
    authUrl.searchParams.set('redirect_uri', `${unifiedCallbackDomain}/api/auth/linkedin`);
    authUrl.searchParams.set('scope', 'r_liteprofile r_emailaddress');
    
    // 在state中保存原始域名，用于回调后重定向
    const stateData = {
      csrf: crypto.randomUUID(),
      originalDomain: currentDomain
    };
    authUrl.searchParams.set('state', btoa(JSON.stringify(stateData))); // Base64编码
    
    console.log('重定向到LinkedIn授权页面');
    console.log('- redirect_uri:', `${unifiedCallbackDomain}/api/auth/linkedin`);
    console.log('- 原始域名:', currentDomain);
    return Response.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('LinkedIn OAuth处理失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'LinkedIn登录失败',
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