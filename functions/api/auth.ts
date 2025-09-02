/**
 * SVTR 用户认证API端点
 * 支持邮箱验证码、Magic Link、OAuth登录
 * 多域名支持: svtr.ai, svtrai.com, svtr.cn, svtrglobal.com
 */

import { getGeoLocationFromIP } from '../lib/geolocation-service';

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
  provider: 'email' | 'google' | 'github' | 'linkedin';
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  geoLocation?: {
    city: string;
    region: string;
    country: string;
    timezone: string;
  };
  ipAddress?: string;
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

// 发送验证邮件 - AWS SES集成
async function sendVerificationEmail(env: any, email: string, code: string, type: 'code' | 'magic', language: 'zh-CN' | 'en' = 'zh-CN'): Promise<boolean> {
  try {
    // 检查是否配置了AWS SES
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION && env.FROM_EMAIL) {
      const { SimpleSES } = await import('../lib/simple-ses');
      
      const emailService = new SimpleSES({
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        region: env.AWS_REGION,
        fromEmail: env.FROM_EMAIL
      });
      
      if (type === 'code') {
        // 发送验证码邮件
        const subject = language === 'zh-CN' 
          ? `[SVTR] 您的登录验证码: ${code}`
          : `[SVTR] Your Login Verification Code: ${code}`;
        
        const body = language === 'zh-CN'
          ? `您好！\n\n您的登录验证码是: ${code}\n\n验证码5分钟内有效，请及时使用。\n\n如果您没有请求此验证码，请忽略此邮件。\n\n——SVTR团队`
          : `Hello!\n\nYour login verification code is: ${code}\n\nThe code is valid for 5 minutes, please use it promptly.\n\nIf you didn't request this code, please ignore this email.\n\n——SVTR Team`;
        
        const success = await emailService.sendEmail(email, subject, body);
        
        if (success) {
          console.log(`AWS SES验证码邮件发送成功: ${email}`);
        } else {
          console.error(`AWS SES验证码邮件发送失败: ${email}`);
        }
        
        return success;
      } else {
        // 发送Magic Link邮件
        const magicLink = `https://svtr.ai/api/auth?action=verify_magic_link&token=${code}`;
        const subject = language === 'zh-CN' 
          ? `[SVTR] 您的登录链接`
          : `[SVTR] Your Login Link`;
        
        const body = language === 'zh-CN'
          ? `您好！\n\n点击以下链接即可登录SVTR:\n${magicLink}\n\n此链接10分钟内有效，请及时使用。\n\n如果您没有请求此登录链接，请忽略此邮件。\n\n——SVTR团队`
          : `Hello!\n\nClick the following link to log in to SVTR:\n${magicLink}\n\nThis link is valid for 10 minutes, please use it promptly.\n\nIf you didn't request this login link, please ignore this email.\n\n——SVTR Team`;
        
        const success = await emailService.sendEmail(email, subject, body);
        
        if (success) {
          console.log(`AWS SES Magic Link邮件发送成功: ${email}`);
        } else {
          console.error(`AWS SES Magic Link邮件发送失败: ${email}`);
        }
        
        return success;
      }
    } else {
      // 模拟发送（开发环境）
      console.log(`[模拟发送] ${type === 'code' ? '验证码' : 'Magic Link'}邮件到: ${email}`);
      console.log(`[模拟内容] ${type === 'code' ? `验证码: ${code}` : `Magic Link: https://svtr.ai/api/auth?action=verify_magic_link&token=${code}`}`);
      
      // 开发环境：将验证码存储到特殊key用于调试
      if (type === 'code') {
        await env.SVTR_CACHE.put(`dev_code_${email}`, code, {
          expirationTtl: 300 // 5分钟
        });
      } else {
        await env.SVTR_CACHE.put(`dev_magic_${email}`, code, {
          expirationTtl: 300 // 5分钟
        });
      }
      
      return true;
    }
  } catch (error) {
    console.error('邮件发送失败:', error);
    return false;
  }
}

// 创建或更新用户
async function createOrUpdateUser(env: any, email: string, userData: Partial<User>, request?: Request): Promise<User> {
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
    // 获取用户IP地址和地理位置信息
    const ipAddress = request?.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const cfCountry = request?.headers.get('CF-IPCountry') || undefined;
    
    let geoLocation: {
      city: string;
      region: string;
      country: string;
      timezone: string;
    };
    try {
      geoLocation = await getGeoLocationFromIP(ipAddress, cfCountry);
      console.log(`[Auth] 新用户地理位置获取成功: ${email}`, geoLocation);
    } catch (error) {
      console.warn(`[Auth] 地理位置获取失败: ${email}`, error);
      geoLocation = {
        city: '未知',
        region: '未知',
        country: '未知',
        timezone: '未知'
      };
    }
    
    // 创建新用户
    const newUser: User = {
      id: generateUserId(),
      email,
      name: userData.name || email.split('@')[0],
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=FA8C32&color=fff`,
      provider: userData.provider || 'email',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      geoLocation,
      ipAddress
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
      const language = requestData.language || 'zh-CN';
      const emailSent = await sendVerificationEmail(env, email, code, 'code', language);
      
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
      const language = requestData.language || 'zh-CN';
      const emailSent = await sendVerificationEmail(env, email, magicToken, 'magic', language);
      
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
      const user = await createOrUpdateUser(env, email, { provider: 'email' }, request);
      
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
    
    // 开发环境调试端点 - 查看验证码
    if (action === 'debug_codes') {
      const email = url.searchParams.get('email');
      if (!email) {
        return new Response(JSON.stringify({
          success: false,
          message: '请提供邮箱参数'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 获取开发环境验证码和magic link
      const verificationCode = await env.SVTR_CACHE.get(`dev_code_${email}`);
      const magicToken = await env.SVTR_CACHE.get(`dev_magic_${email}`);
      const storedCode = await env.SVTR_CACHE.get(`email_code_${email}`);
      const storedMagic = await env.SVTR_CACHE.get(`magic_token_${magicToken || ''}`);
      
      return new Response(JSON.stringify({
        success: true,
        debug: true,
        message: '开发环境调试信息',
        data: {
          email,
          verificationCode: verificationCode || '无验证码',
          magicToken: magicToken || '无Magic Link',
          storedCode: storedCode || '缓存中无验证码',
          storedMagic: storedMagic || '缓存中无Magic Link',
          magicLink: magicToken ? `https://svtr.ai/api/auth?action=verify_magic_link&token=${magicToken}` : '无'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (action === 'verify_magic_link' && token) {
      // 验证Magic Link
      const email = await env.SVTR_CACHE.get(`magic_token_${token}`);
      
      if (!email) {
        return new Response(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>登录失败 - SVTR</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; text-align: center; padding: 50px; background: #f8f9fa; }
    .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .error { color: #dc3545; font-size: 48px; margin-bottom: 20px; }
    .message { font-size: 18px; margin-bottom: 30px; color: #666; }
    .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error">❌</div>
    <h1>登录链接无效</h1>
    <p class="message">此登录链接已过期或已被使用</p>
    <a href="https://svtr.ai/" class="btn">返回首页</a>
  </div>
</body>
</html>`, {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
      
      // 验证成功，删除token
      await env.SVTR_CACHE.delete(`magic_token_${token}`);
      
      // 创建或更新用户
      const user = await createOrUpdateUser(env, email, { provider: 'email' }, request);
      
      // 创建会话
      const sessionToken = await createUserSession(env, user);
      
      // Magic Link登录成功，返回用户友好的HTML页面并自动设置登录状态
      const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>登录成功 - SVTR</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui; text-align: center; padding: 50px; background: #f8f9fa; }
    .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .success { color: #28a745; font-size: 48px; margin-bottom: 20px; }
    .message { font-size: 18px; margin-bottom: 30px; color: #333; }
    .user-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #007bff; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success">✅</div>
    <h1>登录成功！</h1>
    <p class="message">欢迎回来，${user.name.split(' ')[0] || user.name}！</p>
    <div class="user-info">
      <div><strong>${user.name}</strong></div>
      <div>${user.email}</div>
    </div>
    <div class="spinner"></div>
    <p>正在跳转到主页...</p>
    <a href="https://svtr.ai/" class="btn">立即前往主页</a>
  </div>
  
  <script>
    // 设置登录状态到localStorage
    const userData = ${JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar
    })};
    const sessionToken = '${sessionToken}';
    
    localStorage.setItem('svtr_user', JSON.stringify(userData));
    localStorage.setItem('svtr_token', sessionToken);
    
    // 触发登录状态更新事件
    if (window.opener || window.parent !== window) {
      // 如果是在弹窗或iframe中，通知父窗口
      if (window.opener) {
        window.opener.postMessage({ 
          type: 'MAGIC_LINK_LOGIN_SUCCESS', 
          user: userData, 
          token: sessionToken 
        }, 'https://svtr.ai');
      }
    }
    
    // 3秒后跳转到主页
    setTimeout(() => {
      window.location.href = 'https://svtr.ai/?login=success';
    }, 3000);
    
    console.log('Magic Link 登录成功:', userData);
  </script>
</body>
</html>`;
      
      return new Response(redirectHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
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