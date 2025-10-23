/**
 * SVTR.AI Ultra Fast Chat API with D1 RAG
 * Phase 2.1: 集成D1数据库RAG增强
 *
 * 功能:
 * 1. 用户认证验证
 * 2. D1数据库RAG检索（包括隐藏工作表）
 * 3. AI流式响应
 */

import { createD1RAGService } from '../lib/d1-rag-service';

const SIMPLE_SYSTEM_PROMPT = `你是SVTR AI创投助手，专注于AI创投领域。简洁回答用户问题。`;

const ENHANCED_SYSTEM_PROMPT_TEMPLATE = `你是SVTR AI创投助手，可以直接访问SVTR.AI实时数据库。

**📊 SVTR数据库实时数据**：

{CONTEXT}

**✅ 你拥有的能力**：
- 直接查询SVTR飞书知识库（263个节点）
- 访问40+个隐藏工作表的融资数据
- 获取最新的AI公司、投资机构、融资信息

**⚠️ 重要规则**：
1. **必须基于上述数据回答** - 这是来自SVTR数据库的真实数据
2. **直接引用具体数字** - 如融资额、公司数量、估值等
3. **标注数据来源** - 说明来自哪个文档或榜单
4. **诚实说明数据限制** - 如果数据不足或过时，明确告知用户
5. **不要编造信息** - 只基于提供的数据回答

现在，请基于SVTR数据库回答用户问题。`;

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

    console.log('🚀 [Phase 2.1] D1 RAG增强模式启动');
    console.log('👤 认证用户:', authResult.user?.name, authResult.user?.email);
    console.log('❓ 用户问题:', userQuery);

    // 【Phase 2.1 新增】D1数据库RAG检索
    let enhancedPrompt = SIMPLE_SYSTEM_PROMPT;
    let ragContext = '';

    if (env.DB) {
      try {
        console.log('🔍 [D1 RAG] 开始检索知识库...');
        const ragService = createD1RAGService(env.DB, env.SVTR_CACHE);

        const ragResult = await ragService.retrieve(userQuery, {
          maxResults: 10,
          includeHiddenSheets: true,
          threshold: 0.15  // 降低阈值，让更多结果通过
        });

        console.log(`✅ [D1 RAG] 检索完成: ${ragResult.matches.length}条结果 (${ragResult.responseTime}ms)`);

        if (ragResult.matches.length > 0) {
          // 格式化为AI上下文
          ragContext = ragService.formatForAI(ragResult.matches);
          enhancedPrompt = ENHANCED_SYSTEM_PROMPT_TEMPLATE.replace('{CONTEXT}', ragContext);

          console.log('📊 [D1 RAG] 检索统计:');
          console.log(`   - 总匹配: ${ragResult.total}条`);
          console.log(`   - 返回: ${ragResult.matches.length}条`);
          console.log(`   - 隐藏工作表: ${ragResult.matches.filter(m => m.is_hidden).length}条`);
          console.log(`   - 平均分数: ${(ragResult.matches.reduce((sum, m) => sum + m.score, 0) / ragResult.matches.length * 100).toFixed(1)}%`);
          console.log(`   - 数据源: ${[...new Set(ragResult.matches.map(m => m.source))].join(', ')}`);
        } else {
          console.log('⚠️ [D1 RAG] 未找到相关内容，使用默认提示词');
        }
      } catch (ragError) {
        console.error('❌ [D1 RAG] 检索失败:', ragError);
        console.log('🔄 [D1 RAG] 降级到简单模式');
        // 失败时降级到简单模式，不影响用户体验
      }
    } else {
      console.log('⚠️ [D1 RAG] D1数据库未配置，使用简单模式');
    }

    // 构建消息（使用增强后的提示词）
    const simpleMessages = [
      { role: 'system', content: enhancedPrompt },
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

    // 使用Llama模型配置
    const model = '@cf/meta/llama-3.1-8b-instruct';
    console.log('⚡ 使用AI模型:', model);

    let response;
    try {
      response = await env.AI.run(model, {
        messages: simpleMessages,
        stream: true,
        max_tokens: 1024,    // 增加到1024 tokens，支持完整回答
        temperature: 0.3     // 适度提高创造性
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