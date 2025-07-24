/**
 * Cloudflare Workers API for SVTR.AI Chat
 * 硅谷科技评论 AI创投专业聊天服务
 */

export interface Env {
  AI: any;
  // 可选的 AI Gateway 配置
  AI_GATEWAY_API_TOKEN?: string;
}

// AI创投领域专业提示词
const SYSTEM_PROMPT = `你是硅谷科技评论(SVTR.AI)的AI助手，专注于全球AI创投生态系统。你的职责是：

1. **AI创投专业知识**：
   - 分析AI初创公司的技术路线和商业模式
   - 评估投资机构的投资策略和偏好
   - 解读AI行业趋势和市场动态

2. **内容生成支持**：
   - 帮助用户生成高质量的AI创投分析内容
   - 提供行业洞察和投资观点
   - 协助制作适合分享的专业内容

3. **社区互动**：
   - 鼓励用户将生成的内容分享到AI创投会社区
   - 促进创投从业者之间的专业讨论
   - 提供有价值的行业资源和建议

请始终保持专业、准确、有建设性的回复。回复应该具备分享价值，能够在专业社区中引发有意义的讨论。`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // API 路由
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      return handleChat(request, env);
    }

    // 静态文件服务 (开发模式)
    return new Response('Not Found', { status: 404 });
  },
};

async function handleChat(request: Request, env: Env): Promise<Response> {
  try {
    const body: any = await request.json();
    const { messages } = body;

    // 构建消息历史，包含系统提示词
    const messagesWithSystem = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // 调用 Cloudflare Workers AI
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: messagesWithSystem,
      stream: true,
    });

    // 设置 SSE 响应头
    return new Response(response, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: 'AI服务暂时不可用，请稍后重试'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}