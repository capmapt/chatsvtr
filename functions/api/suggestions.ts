/**
 * SVTR.AI 智能建议API
 * 基于会话上下文提供个性化建议问题
 */

import { ConversationContextManager } from '../lib/conversation-context';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: '缺少会话ID',
        suggestions: getDefaultSuggestions()
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // 初始化上下文管理器
    const contextManager = new ConversationContextManager(env.CHAT_SESSIONS);
    
    // 获取智能建议
    const suggestions = contextManager.getSmartSuggestions(sessionId);
    
    // 获取会话信息用于调试
    const session = await contextManager.getOrCreateSession(sessionId);
    
    return new Response(JSON.stringify({
      sessionId,
      suggestions,
      sessionInfo: {
        messageCount: session.messages.length,
        topics: session.extractedTopics.slice(0, 5),
        interests: session.userInterests.slice(0, 3),
        summary: session.conversationSummary
      },
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, max-age=0'
      }
    });

  } catch (error) {
    console.error('智能建议API错误:', error);
    
    return new Response(JSON.stringify({
      error: '获取建议失败',
      suggestions: getDefaultSuggestions(),
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { sessionId, userQuery, contextHint } = body;
    
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: '缺少会话ID'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    const contextManager = new ConversationContextManager(env.CHAT_SESSIONS);
    
    // 如果提供了用户查询，可以基于此生成更相关的建议
    let suggestions;
    if (userQuery) {
      // 临时添加用户查询到会话中，生成相关建议
      await contextManager.addMessage(sessionId, {
        role: 'user',
        content: userQuery,
        timestamp: Date.now()
      });
      suggestions = contextManager.getSmartSuggestions(sessionId);
    } else {
      suggestions = contextManager.getSmartSuggestions(sessionId);
    }

    return new Response(JSON.stringify({
      sessionId,
      suggestions,
      contextHint,
      timestamp: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('智能建议POST API错误:', error);
    
    return new Response(JSON.stringify({
      error: '生成建议失败',
      suggestions: getDefaultSuggestions()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * 默认建议问题
 */
function getDefaultSuggestions(): string[] {
  return [
    'SVTR.AI追踪哪些AI公司？',
    '最新的AI投资趋势是什么？',
    '如何识别有潜力的AI创业团队？',
    '生成式AI领域的投资机会？',
    'AI基础设施赛道的发展前景？',
    'SVTR平台有哪些独特优势？'
  ];
}