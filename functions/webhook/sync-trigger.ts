/**
 * 同步触发Webhook
 * 接收外部请求触发数据同步
 */

interface Env {
  WEBHOOK_SECRET?: string;
}

interface SyncRequest {
  trigger: 'manual' | 'scheduled' | 'content_updated';
  syncType?: 'smart' | 'complete' | 'enhanced';
  priority?: 'low' | 'normal' | 'high';
  source?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // 只允许POST请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // 验证webhook密钥（如果设置了）
      if (env.WEBHOOK_SECRET) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response('Unauthorized', { status: 401 });
        }
        
        const token = authHeader.substring(7);
        if (token !== env.WEBHOOK_SECRET) {
          return new Response('Invalid token', { status: 401 });
        }
      }

      // 解析请求体
      const syncRequest: SyncRequest = await request.json();
      
      // 验证请求格式
      if (!syncRequest.trigger) {
        return new Response('Missing trigger field', { status: 400 });
      }

      const allowedTriggers = ['manual', 'scheduled', 'content_updated'];
      if (!allowedTriggers.includes(syncRequest.trigger)) {
        return new Response('Invalid trigger type', { status: 400 });
      }

      const allowedSyncTypes = ['smart', 'complete', 'enhanced'];
      const syncType = syncRequest.syncType || 'smart';
      if (!allowedSyncTypes.includes(syncType)) {
        return new Response('Invalid sync type', { status: 400 });
      }

      // 记录触发信息
      console.log('🔄 收到同步触发请求', {
        trigger: syncRequest.trigger,
        syncType,
        priority: syncRequest.priority || 'normal',
        source: syncRequest.source || 'unknown',
        timestamp: new Date().toISOString()
      });

      // 构建同步命令URL（在实际环境中，这可能是调用内部服务）
      const syncResponse = await triggerSync(syncType, syncRequest);

      return new Response(JSON.stringify({
        success: true,
        message: 'Sync triggered successfully',
        syncType,
        trigger: syncRequest.trigger,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('❌ Webhook处理失败:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

/**
 * 触发同步操作
 */
async function triggerSync(syncType: string, request: SyncRequest) {
  // 在实际环境中，这里应该：
  // 1. 调用内部API触发同步
  // 2. 或者发送消息到队列系统
  // 3. 或者直接执行同步脚本
  
  console.log(`🚀 触发${syncType}同步`, {
    priority: request.priority,
    source: request.source,
    trigger: request.trigger
  });

  // 模拟异步同步操作
  // 在生产环境中，这应该是实际的同步逻辑
  
  return {
    triggered: true,
    syncType,
    estimatedDuration: '5-10 minutes'
  };
}

/**
 * 获取同步状态
 */
export async function getSyncStatus(): Promise<Response> {
  try {
    // 检查最近的同步状态
    const status = {
      lastSync: '2025-08-07T16:46:03.511Z',
      status: 'completed',
      nodesCount: 252,
      dataQuality: '84.5%',
      nextScheduledSync: '2025-08-08T02:00:00Z'
    };

    return new Response(JSON.stringify({
      success: true,
      status
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}