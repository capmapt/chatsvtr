/**
 * GitHub OAuth 认证集成
 * 支持GitHub账号登录SVTR平台
 */

interface GitHubUserInfo {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

// 获取GitHub用户的主邮箱
async function getGitHubPrimaryEmail(accessToken: string): Promise<string | null> {
  try {
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'User-Agent': 'SVTR-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!emailResponse.ok) {
      console.error('GitHub邮箱获取失败:', await emailResponse.text());
      return null;
    }
    
    const emails: GitHubEmail[] = await emailResponse.json();
    const primaryEmail = emails.find(email => email.primary && email.verified);
    
    return primaryEmail?.email || null;
  } catch (error) {
    console.error('获取GitHub邮箱失败:', error);
    return null;
  }
}

// 创建或更新用户
async function createOrUpdateGitHubUser(env: any, githubUser: GitHubUserInfo, email: string): Promise<any> {
  const existingUserData = await env.SVTR_CACHE.get(`user_${email}`);
  
  const userData = {
    email,
    name: githubUser.name || githubUser.login,
    avatar: githubUser.avatar_url,
    provider: 'github' as const,
    githubProfile: {
      login: githubUser.login,
      company: githubUser.company,
      location: githubUser.location,
      bio: githubUser.bio,
      publicRepos: githubUser.public_repos,
      followers: githubUser.followers
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

// 处理GET请求 - 发起OAuth流程和处理回调
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state');
    
    console.log('GitHub OAuth请求:', { code: !!code, error, state });
    
    // 检查是否有错误
    if (error) {
      console.error('GitHub OAuth错误:', error);
      return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=${encodeURIComponent(error)}`);
    }
    
    // 如果有授权码，处理回调
    if (code) {
      try {
        // 步骤1: 用授权码换取访问令牌
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code
          })
        });
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('GitHub token exchange失败:', errorText);
          return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=token_exchange_failed`);
        }
        
        const tokens: GitHubTokenResponse = await tokenResponse.json();
        console.log('GitHub tokens获取成功');
        
        // 步骤2: 使用访问令牌获取用户信息
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${tokens.access_token}`,
            'User-Agent': 'SVTR-App',
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text();
          console.error('GitHub用户信息获取失败:', errorText);
          return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=user_info_failed`);
        }
        
        const githubUser: GitHubUserInfo = await userResponse.json();
        console.log('GitHub用户信息:', { login: githubUser.login, name: githubUser.name });
        
        // 步骤3: 获取用户邮箱（GitHub用户信息中的email可能为空）
        let email = githubUser.email;
        if (!email) {
          email = await getGitHubPrimaryEmail(tokens.access_token);
        }
        
        if (!email) {
          console.error('无法获取GitHub用户邮箱');
          return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=no_email`);
        }
        
        // 步骤4: 创建或更新本地用户
        const user = await createOrUpdateGitHubUser(env, githubUser, email);
        
        // 步骤5: 创建会话
        const sessionToken = await createUserSession(env, user);
        
        // 步骤6: 重定向到前端，携带会话token
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
        console.error('GitHub OAuth回调处理失败:', error);
        return Response.redirect(`${env.APP_URL || 'http://localhost:3000'}?auth_error=callback_failed`);
      }
    }
    
    // 如果没有授权码，发起OAuth流程
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${env.APP_URL || 'http://localhost:3000'}/api/auth/github`);
    authUrl.searchParams.set('scope', 'user:email read:user');
    authUrl.searchParams.set('state', crypto.randomUUID()); // CSRF protection
    
    console.log('重定向到GitHub授权页面');
    return Response.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('GitHub OAuth处理失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'GitHub登录失败',
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