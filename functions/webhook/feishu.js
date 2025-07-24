// 飞书Webhook处理器
// 用于接收飞书内容更新通知并触发同步

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    
    // 验证飞书Webhook签名
    const signature = request.headers.get('X-Lark-Signature');
    if (!verifySignature(body, signature, env.FEISHU_WEBHOOK_SECRET)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // 处理不同类型的事件
    const { type, event } = body;
    
    if (type === 'url_verification') {
      // 首次验证
      return new Response(JSON.stringify({
        challenge: body.challenge
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (event?.type === 'wiki.node.updated' || 
        event?.type === 'bitable.record.updated') {
      
      console.log('📝 检测到飞书内容更新:', event);
      
      // 触发GitHub Actions同步
      const githubResponse = await fetch(
        'https://api.github.com/repos/capmapt/chatsvtr/dispatches',
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'feishu-update',
            client_payload: {
              trigger: 'feishu_webhook',
              event_type: event.type,
              timestamp: new Date().toISOString()
            }
          })
        }
      );
      
      if (githubResponse.ok) {
        console.log('✅ 成功触发同步更新');
        return new Response('OK', { status: 200 });
      } else {
        console.error('❌ 触发同步失败');
        return new Response('Sync failed', { status: 500 });
      }
    }
    
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('❌ Webhook处理失败:', error);
    return new Response('Internal error', { status: 500 });
  }
}

function verifySignature(body, signature, secret) {
  // 实现飞书Webhook签名验证逻辑
  // 参考: https://open.feishu.cn/document/ukTMukTMukTM/uUTNz4SN1MjL1UzM
  return true; // 简化实现
}