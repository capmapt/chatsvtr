/**
 * Cloudflare Workers Scheduled Event Handler
 * 每日定时同步RAG数据
 */

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    
    // 验证请求来源（可选：添加webhook密钥验证）
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${env.SYNC_WEBHOOK_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('🤖 开始定时同步任务...');
    
    // 调用飞书API同步数据
    const syncResult = await performScheduledSync(env);
    
    if (syncResult.success) {
      console.log('✅ 定时同步成功:', syncResult.summary);
      
      // 可选：发送成功通知
      await sendSyncNotification(env, {
        status: 'success',
        summary: syncResult.summary,
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: '定时同步完成',
        data: syncResult.summary
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.error('❌ 定时同步失败:', syncResult.error);
      
      // 发送失败通知
      await sendSyncNotification(env, {
        status: 'error', 
        error: syncResult.error,
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({
        success: false,
        message: '定时同步失败',
        error: syncResult.error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('🚨 定时同步异常:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '定时同步异常',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 执行定时同步
 */
async function performScheduledSync(env: any) {
  try {
    // 这里可以调用现有的飞书同步逻辑
    // 或者触发GitHub Actions webhook
    
    const feishuAppId = env.FEISHU_APP_ID;
    const feishuSecret = env.FEISHU_APP_SECRET;
    
    if (!feishuAppId || !feishuSecret) {
      throw new Error('飞书API配置缺失');
    }
    
    // 简化版同步逻辑（实际应该调用完整的同步函数）
    const syncTimestamp = new Date().toISOString();
    
    // 触发GitHub Actions workflow（推荐方式）
    const webhookResult = await triggerGitHubSync(env);
    
    return {
      success: true,
      summary: {
        syncTime: syncTimestamp,
        triggerMethod: 'github_actions',
        webhookResult: webhookResult
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 触发GitHub Actions同步
 */
async function triggerGitHubSync(env: any) {
  try {
    // 调用GitHub API触发workflow_dispatch事件
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/daily-sync.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          sync_type: 'smart'
        }
      })
    });
    
    if (response.ok) {
      return { triggered: true, timestamp: new Date().toISOString() };
    } else {
      const error = await response.text();
      throw new Error(`GitHub API调用失败: ${error}`);
    }
    
  } catch (error) {
    console.error('GitHub webhook触发失败:', error);
    return { triggered: false, error: error.message };
  }
}

/**
 * 发送同步通知（可选）
 */
async function sendSyncNotification(env: any, data: any) {
  try {
    // 可以集成Slack、Discord、邮件等通知方式
    console.log('📬 同步通知:', data);
    
    // 示例：发送到Slack webhook
    if (env.SLACK_WEBHOOK_URL) {
      await fetch(env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🤖 SVTR RAG数据同步${data.status === 'success' ? '成功' : '失败'}`,
          attachments: [{
            color: data.status === 'success' ? 'good' : 'danger',
            fields: [
              { title: '时间', value: data.timestamp, short: true },
              { title: '状态', value: data.status, short: true },
              { title: '详情', value: data.summary || data.error, short: false }
            ]
          }]
        })
      });
    }
    
  } catch (error) {
    console.error('通知发送失败:', error);
  }
}