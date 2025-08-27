/**
 * SVTR.AI Ultra Fast Chat API
 * 极简版本 - 优先响应速度 + 登录验证
 */

const SIMPLE_SYSTEM_PROMPT = `你是SVTR AI创投助手，专注于AI创投领域。简洁回答用户问题。`;

// 验证用户认证状态
async function validateAuth(request: Request, env: any): Promise<{ isValid: boolean; user?: any; error?: string }> {
  try {
    // 从请求头获取认证信息
    const authHeader = request.headers.get('Authorization');
    const userIdHeader = request.headers.get('X-User-ID');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { isValid: false, error: '缺少认证Token' };
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return { isValid: false, error: 'Token格式错误' };
    }

    // 验证会话Token
    const sessionData = await env.SVTR_CACHE.get(`session_${token}`);
    if (!sessionData) {
      return { isValid: false, error: '会话无效或已过期' };
    }

    const session = JSON.parse(sessionData);
    
    // 检查会话是否过期
    if (new Date(session.expiresAt) < new Date()) {
      await env.SVTR_CACHE.delete(`session_${token}`);
      return { isValid: false, error: '会话已过期' };
    }

    // 获取用户信息
    const userData = await env.SVTR_CACHE.get(`user_id_${session.userId}`);
    if (!userData) {
      return { isValid: false, error: '用户不存在' };
    }

    const user = JSON.parse(userData);
    console.log('✅ 用户认证成功:', user.name, user.email);
    
    return { isValid: true, user };
  } catch (error) {
    console.error('🚨 认证验证失败:', error);
    return { isValid: false, error: '认证服务错误' };
  }
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;

    // 🔐 验证用户认证 - 新增登录要求
    const authResult = await validateAuth(request, env);
    if (!authResult.isValid) {
      console.log('❌ 用户未认证:', authResult.error);
      return new Response(JSON.stringify({
        success: false,
        error: 'AUTH_REQUIRED',
        message: authResult.error || '请先登录后使用聊天功能',
        code: 401
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
        }
      });
    }

    const body: any = await request.json();
    const { messages } = body;

    // 获取用户问题
    const userQuery = messages[messages.length - 1]?.content || '';
    
    console.log('🚀 极速模式启动，用户问题:', userQuery);
    console.log('👤 认证用户:', authResult.user?.name, authResult.user?.email);

    // 构建简单消息
    const simpleMessages = [
      { role: 'system', content: SIMPLE_SYSTEM_PROMPT },
      ...messages
    ];

    // 响应头
    const responseHeaders = new Headers({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
    });

    // 使用最快模型和最简配置
    const model = '@cf/meta/llama-3.1-8b-instruct';
    console.log('⚡ 使用极速模型:', model);

    let response;
    try {
      response = await env.AI.run(model, {
        messages: simpleMessages,
        stream: true,
        max_tokens: 256,     // 极小token数量
        temperature: 0.1     // 最简参数
      });
      console.log('✅ 模型调用成功');
    } catch (error) {
      console.error('❌ 模型调用失败:', error);
      throw error;
    }

    // 返回流式响应
    return new Response(response, { headers: responseHeaders });

  } catch (error) {
    console.error('❌ API错误:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
      }
    });
  }
}

// 处理OPTIONS请求 - CORS预检
export async function onRequestOptions(context: any): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-ID',
      'Access-Control-Max-Age': '86400',
    }
  });
}