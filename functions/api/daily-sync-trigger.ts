/**
 * 每日定时同步触发器
 * 可以通过外部调用（如 GitHub Actions、Uptime Robot 等）来实现定时功能
 */

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: KVNamespace;
}

/**
 * 处理定时同步请求
 */
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    // 简单的安全检查 - 可以添加更严格的认证
    const authToken = url.searchParams.get('token');
    const expectedToken = 'svtr-daily-sync-2025'; // 生产环境应使用更安全的token

    if (authToken !== expectedToken) {
      return new Response(JSON.stringify({
        success: false,
        message: '未授权访问'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('🔄 执行每日定时同步任务...');

    // 调用新的Bitable数据同步API
    const syncResponse = await fetch(`${url.origin}/api/new-bitable-data?refresh=true`);

    if (!syncResponse.ok) {
      throw new Error(`同步API调用失败: ${syncResponse.status}`);
    }

    const syncResult = await syncResponse.json();

    const result = {
      success: true,
      message: '每日同步任务完成',
      timestamp: new Date().toISOString(),
      syncResult: {
        source: syncResult.source,
        count: syncResult.count,
        note: syncResult.note
      }
    };

    console.log('✅ 每日定时同步完成:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ 每日定时同步失败:', error);

    return new Response(JSON.stringify({
      success: false,
      message: '同步任务失败',
      error: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * 处理CORS预检请求
 */
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}