/**
 * 飞书Webhook接收端点
 * 处理飞书知识库内容更新事件，触发多平台内容分发
 */

interface FeishuWebhookEvent {
  schema: string;
  header: {
    event_id: string;
    event_type: string;
    create_time: string;
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event?: {
    [key: string]: any;
  };
  challenge?: string;
  type?: string;
}

interface Env {
  FEISHU_WEBHOOK_SECRET: string;
  FEISHU_APP_ID: string;
}

export async function onRequestPost(context: EventContext<Env, any, any>): Promise<Response> {
  try {
    const request = context.request;
    const env = context.env;

    // 解析请求body
    const body: FeishuWebhookEvent = await request.json();
    
    console.log('🔔 接收到飞书Webhook事件:', {
      eventType: body.header?.event_type || body.type,
      eventId: body.header?.event_id,
      timestamp: new Date().toISOString()
    });

    // 处理URL验证（飞书Webhook订阅验证）
    if (body.type === 'url_verification') {
      console.log('✅ 处理URL验证请求');
      return Response.json({ 
        challenge: body.challenge 
      });
    }

    // 验证事件来源（可选，增强安全性）
    if (body.header?.app_id && env.FEISHU_APP_ID) {
      if (body.header.app_id !== env.FEISHU_APP_ID) {
        console.error('❌ App ID验证失败');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // 处理具体的事件类型
    if (body.header?.event_type) {
      await handleFeishuEvent(body, env);
    }

    // 返回成功响应（飞书要求2xx状态码）
    return Response.json({ 
      success: true,
      message: 'Event processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook处理出错:', error);
    
    // 返回成功状态避免飞书重试，但记录错误
    return Response.json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 200 }); // 仍返回200状态码
  }
}

/**
 * 处理具体的飞书事件
 */
async function handleFeishuEvent(event: FeishuWebhookEvent, env: Env) {
  const eventType = event.header.event_type;
  const eventData = event.event;

  console.log('📋 处理事件类型:', eventType);

  switch (eventType) {
    case 'wiki.space.document.created':
      await handleDocumentCreated(eventData, env);
      break;
      
    case 'wiki.space.document.updated':
      await handleDocumentUpdated(eventData, env);
      break;
      
    case 'wiki.space.document.deleted':
      await handleDocumentDeleted(eventData, env);
      break;
      
    case 'wiki.space.member_added':
      console.log('📥 知识库新增成员:', eventData);
      break;
      
    case 'wiki.space.member_removed':
      console.log('📤 知识库移除成员:', eventData);
      break;
      
    default:
      console.log('ℹ️ 未处理的事件类型:', eventType, eventData);
  }
}

/**
 * 处理文档创建事件
 */
async function handleDocumentCreated(eventData: any, env: Env) {
  console.log('📝 处理文档创建事件:', {
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id,
    title: eventData?.title || '未知标题'
  });

  try {
    // TODO: 触发内容获取和多平台发布流程
    // 1. 获取新文档内容
    // 2. 解析和转换格式
    // 3. 调度发布到各平台
    // 4. 更新RAG知识库
    
    // 当前阶段：记录事件用于后续处理
    await logContentEvent('document_created', eventData);
    
  } catch (error) {
    console.error('❌ 处理文档创建事件失败:', error);
  }
}

/**
 * 处理文档更新事件
 */
async function handleDocumentUpdated(eventData: any, env: Env) {
  console.log('✏️ 处理文档更新事件:', {
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id,
    title: eventData?.title || '未知标题',
    updateTime: eventData?.update_time
  });

  try {
    // TODO: 实现增量更新逻辑
    // 1. 获取更新后的内容
    // 2. 比较变更内容
    // 3. 重新发布到相关平台
    // 4. 更新RAG知识库对应条目
    
    // 当前阶段：记录事件用于后续处理
    await logContentEvent('document_updated', eventData);
    
  } catch (error) {
    console.error('❌ 处理文档更新事件失败:', error);
  }
}

/**
 * 处理文档删除事件
 */
async function handleDocumentDeleted(eventData: any, env: Env) {
  console.log('🗑️ 处理文档删除事件:', {
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id
  });

  try {
    // TODO: 实现内容删除逻辑
    // 1. 从各平台撤回已发布内容（如果支持）
    // 2. 从RAG知识库删除对应条目
    // 3. 更新内容索引
    
    // 当前阶段：记录事件用于后续处理
    await logContentEvent('document_deleted', eventData);
    
  } catch (error) {
    console.error('❌ 处理文档删除事件失败:', error);
  }
}

/**
 * 记录内容事件（用于监控和调试）
 */
async function logContentEvent(eventType: string, eventData: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id,
    title: eventData?.title,
    data: eventData
  };

  console.log('📊 内容事件记录:', logEntry);
  
  // TODO: 存储到KV或数据库用于分析
  // await env.WEBHOOK_LOGS.put(`event_${Date.now()}`, JSON.stringify(logEntry));
}

/**
 * GET请求处理 - 用于健康检查
 */
export async function onRequestGet(): Promise<Response> {
  return Response.json({
    status: 'active',
    message: 'Feishu Webhook endpoint is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}