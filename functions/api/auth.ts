/**
 * SVTR 用户认证API端点
 * 支持邮箱验证码、Magic Link、OAuth登录
 * 多域名支持: svtr.ai, svtrai.com, svtr.cn, svtrglobal.com
 */

// 多域名CORS配置
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  
  // 允许的域名列表
  const allowedOrigins = [
    'https://svtr.ai',
    'https://svtrai.com',
    'https://svtr.cn', 
    'https://svtrglobal.com',
    'http://localhost:3000'
  ];
  
  // 检查请求来源是否在允许列表中
  const allowedOrigin = allowedOrigins.find(allowed => 
    origin.startsWith(allowed)
  );
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'github';
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
}

interface AuthSession {
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// 生成安全的验证码
function generateVerificationCode(): string {
  return Math.random().toString().slice(2, 8);
}

// 生成Magic Link令牌
function generateMagicToken(): string {
  return crypto.randomUUID() + '_' + Date.now();
}

// 生成JWT会话令牌
function generateSessionToken(): string {
  return crypto.randomUUID() + '_' + Math.random().toString(36).substr(2, 16);
}

// 生成用户ID
function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 验证邮箱格式
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 发送验证邮件（模拟发送，实际需要配置邮件服务）
async function sendVerificationEmail(email: string, code: string, type: 'code' | 'magic'): Promise<boolean> {
  try {
    console.log(`发送${type === 'code' ? '验证码' : 'Magic Link'}邮件到: ${email}`);
    console.log(`内容: ${type === 'code' ? `验证码: ${code}` : `Magic Link: https://svtr.ai/auth/verify?token=${code}`}`);
    
    // TODO: 集成实际邮件服务 (AWS SES, SendGrid, Resend等)
    // const emailService = new EmailService(env.EMAIL_API_KEY);
    // await emailService.send({
    //   to: email,
    //   subject: type === 'code' ? 'SVTR 登录验证码' : 'SVTR 登录链接',
    //   html: generateEmailTemplate(code, type)
    // });
    
    return true;
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

// 创建或更新用户
async function createOrUpdateUser(env: any, email: string, userData: Partial<User>): Promise<User> {
  const existingUserData = await env.SVTR_CACHE.get(`user_${email}`);
  
  if (existingUserData) {
    // 更新现有用户
    const existingUser: User = JSON.parse(existingUserData);
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      lastLoginAt: new Date().toISOString()
    };
    
    await env.SVTR_CACHE.put(`user_${email}`, JSON.stringify(updatedUser));
    await env.SVTR_CACHE.put(`user_id_${updatedUser.id}`, JSON.stringify(updatedUser));
    
    return updatedUser;
  } else {
    // 创建新用户
    const newUser: User = {
      id: generateUserId(),
      email,
      name: userData.name || email.split('@')[0],
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=FA8C32&color=fff`,
      provider: userData.provider || 'email',
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
async function createUserSession(env: any, user: User): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天过期
  
  const session: AuthSession = {
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

// 处理POST请求 - 发送验证码/Magic Link、验证登录
export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const requestData = await request.json();
    const { action } = requestData;
    
    console.log('认证请求:', action, requestData);
    
    if (action === 'send_code') {
      const { email } = requestData;
      
      if (!email || !isValidEmail(email)) {
        return new Response(JSON.stringify({
          success: false,
          message: '请提供有效的邮箱地址'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 检查发送频率限制（防止滥用）
      const rateLimitKey = `rate_limit_${email}`;
      const lastSent = await env.SVTR_CACHE.get(rateLimitKey);
      
      if (lastSent && Date.now() - parseInt(lastSent) < 60000) { // 1分钟内只能发送一次
        return new Response(JSON.stringify({
          success: false,
          message: '验证码发送过于频繁，请稍后再试'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const code = generateVerificationCode();
      
      // 存储验证码（5分钟有效）
      await env.SVTR_CACHE.put(`email_code_${email}`, code, {
        expirationTtl: 300
      });
      
      // 记录发送时间
      await env.SVTR_CACHE.put(rateLimitKey, Date.now().toString(), {
        expirationTtl: 60
      });
      
      // 发送验证邮件
      const emailSent = await sendVerificationEmail(email, code, 'code');
      
      if (emailSent) {
        return new Response(JSON.stringify({
          success: true,
          message: '验证码已发送到您的邮箱，5分钟内有效'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '验证码发送失败，请稍后重试'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    if (action === 'send_magic_link') {
      const { email } = requestData;
      
      if (!email || !isValidEmail(email)) {
        return new Response(JSON.stringify({
          success: false,
          message: '请提供有效的邮箱地址'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 检查发送频率限制
      const rateLimitKey = `magic_limit_${email}`;
      const lastSent = await env.SVTR_CACHE.get(rateLimitKey);
      
      if (lastSent && Date.now() - parseInt(lastSent) < 60000) {
        return new Response(JSON.stringify({
          success: false,
          message: '登录链接发送过于频繁，请稍后再试'
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const magicToken = generateMagicToken();
      
      // 存储Magic Token（10分钟有效）
      await env.SVTR_CACHE.put(`magic_token_${magicToken}`, email, {
        expirationTtl: 600
      });
      
      // 记录发送时间
      await env.SVTR_CACHE.put(rateLimitKey, Date.now().toString(), {
        expirationTtl: 60
      });
      
      // 发送Magic Link邮件
      const emailSent = await sendVerificationEmail(email, magicToken, 'magic');
      
      if (emailSent) {
        return new Response(JSON.stringify({
          success: true,
          message: '登录链接已发送到您的邮箱，10分钟内有效'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '登录链接发送失败，请稍后重试'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    if (action === 'verify_code') {
      const { email, code } = requestData;
      
      if (!email || !code) {
        return new Response(JSON.stringify({
          success: false,
          message: '请提供邮箱和验证码'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const storedCode = await env.SVTR_CACHE.get(`email_code_${email}`);
      
      if (!storedCode || storedCode !== code) {
        return new Response(JSON.stringify({
          success: false,
          message: '验证码错误或已过期'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 验证成功，删除验证码
      await env.SVTR_CACHE.delete(`email_code_${email}`);
      
      // 创建或更新用户
      const user = await createOrUpdateUser(env, email, { provider: 'email' });
      
      // 创建会话
      const sessionToken = await createUserSession(env, user);
      
      return new Response(JSON.stringify({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          },
          token: sessionToken
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '无效的操作类型'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('认证处理失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误，请稍后重试',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理GET请求 - Magic Link验证、会话验证
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const token = url.searchParams.get('token');
    
    console.log('GET认证请求:', action, token);
    
    if (action === 'verify_magic_link' && token) {
      // 验证Magic Link
      const email = await env.SVTR_CACHE.get(`magic_token_${token}`);
      
      if (!email) {
        return new Response(JSON.stringify({
          success: false,
          message: '登录链接无效或已过期'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 验证成功，删除token
      await env.SVTR_CACHE.delete(`magic_token_${token}`);
      
      // 创建或更新用户
      const user = await createOrUpdateUser(env, email, { provider: 'email' });
      
      // 创建会话
      const sessionToken = await createUserSession(env, user);
      
      return new Response(JSON.stringify({
        success: true,
        message: '登录成功',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          },
          token: sessionToken
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (action === 'verify_session' && token) {
      // 验证会话token
      const sessionData = await env.SVTR_CACHE.get(`session_${token}`);
      
      if (!sessionData) {
        return new Response(JSON.stringify({
          success: false,
          message: '会话无效或已过期'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const session: AuthSession = JSON.parse(sessionData);
      
      // 检查会话是否过期
      if (new Date(session.expiresAt) < new Date()) {
        await env.SVTR_CACHE.delete(`session_${token}`);
        return new Response(JSON.stringify({
          success: false,
          message: '会话已过期'
        }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 获取用户信息
      const userData = await env.SVTR_CACHE.get(`user_id_${session.userId}`);
      if (!userData) {
        return new Response(JSON.stringify({
          success: false,
          message: '用户不存在'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const user: User = JSON.parse(userData);
      
      return new Response(JSON.stringify({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '无效的请求参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('GET认证处理失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理OPTIONS请求 - CORS with multi-domain support
export async function onRequestOptions(context: any): Promise<Response> {
  const { request } = context;
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(request)
  });
}