/**
 * SVTR用户行为数据处理API
 * 接收和存储用户行为跟踪数据到Cloudflare KV
 */

interface Env {
  USER_BEHAVIOR_KV: KVNamespace;
  // 其他环境变量...
}

interface BehaviorData {
  type: string;
  sessionId: string;
  userId: string;
  timestamp: number;
  [key: string]: any;
}

interface SessionSummary {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  activeDuration?: number;
  pageViews: number;
  clicks: number;
  maxScrollDepth: number;
  pages: string[];
  devices: any;
  engagement: {
    formSubmissions: number;
    linkClicks: number;
    scrollMilestones: number;
  };
}

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;
  
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    const behaviorData: BehaviorData[] = await request.json();
    
    if (!Array.isArray(behaviorData) || behaviorData.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Invalid behavior data format' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // 处理行为数据
    const results = await processBehaviorData(env.USER_BEHAVIOR_KV, behaviorData);
    
    return new Response(JSON.stringify({
      success: true,
      processed: results.processed,
      errors: results.errors,
      message: `Successfully processed ${results.processed} behavior events`
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('用户行为数据处理失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: '用户行为数据处理失败'
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
 * 处理用户行为数据
 */
async function processBehaviorData(kv: KVNamespace, behaviorData: BehaviorData[]) {
  let processed = 0;
  const errors: string[] = [];
  const sessionSummaries = new Map<string, SessionSummary>();

  for (const data of behaviorData) {
    try {
      // 验证必需字段
      if (!data.sessionId || !data.userId || !data.timestamp || !data.type) {
        errors.push(`Invalid data structure: ${JSON.stringify(data)}`);
        continue;
      }

      // 生成存储键
      const date = new Date(data.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const hourKey = date.getHours().toString().padStart(2, '0');
      
      // 按日期和小时分组存储原始数据
      const rawDataKey = `raw:${dateKey}:${hourKey}:${data.sessionId}:${Date.now()}`;
      await kv.put(rawDataKey, JSON.stringify(data), {
        expirationTtl: 30 * 24 * 60 * 60 // 30天过期
      });

      // 更新会话摘要
      await updateSessionSummary(kv, data, sessionSummaries);

      // 更新页面统计
      if (data.type === 'page_view') {
        await updatePageStats(kv, data, dateKey);
      }

      // 更新用户活动统计
      if (['click', 'scroll_milestone', 'form_submit'].includes(data.type)) {
        await updateUserActivity(kv, data, dateKey);
      }

      processed++;
      
    } catch (error) {
      errors.push(`Processing error for ${data.type}: ${error.message}`);
    }
  }

  // 保存会话摘要
  for (const [sessionId, summary] of sessionSummaries) {
    try {
      const summaryKey = `session:${summary.userId}:${sessionId}`;
      await kv.put(summaryKey, JSON.stringify(summary), {
        expirationTtl: 90 * 24 * 60 * 60 // 90天过期
      });
    } catch (error) {
      errors.push(`Session summary save error: ${error.message}`);
    }
  }

  return { processed, errors };
}

/**
 * 更新会话摘要
 */
async function updateSessionSummary(kv: KVNamespace, data: BehaviorData, sessionSummaries: Map<string, SessionSummary>) {
  const { sessionId, userId, timestamp, type } = data;
  
  let summary = sessionSummaries.get(sessionId);
  
  if (!summary) {
    // 尝试从KV加载现有摘要
    const existingKey = `session:${userId}:${sessionId}`;
    const existingData = await kv.get(existingKey, 'json') as SessionSummary | null;
    
    summary = existingData || {
      sessionId,
      userId,
      startTime: timestamp,
      pageViews: 0,
      clicks: 0,
      maxScrollDepth: 0,
      pages: [],
      devices: null,
      engagement: {
        formSubmissions: 0,
        linkClicks: 0,
        scrollMilestones: 0
      }
    };
  }

  // 更新摘要数据
  switch (type) {
    case 'page_view':
      summary.pageViews++;
      if (!summary.pages.includes(data.page?.path)) {
        summary.pages.push(data.page?.path);
      }
      if (data.device && !summary.devices) {
        summary.devices = data.device;
      }
      break;
      
    case 'page_unload':
      summary.endTime = timestamp;
      if (data.timing) {
        summary.totalDuration = data.timing.totalDuration;
        summary.activeDuration = data.timing.activeDuration;
      }
      if (data.scrollData?.maxDepth > summary.maxScrollDepth) {
        summary.maxScrollDepth = data.scrollData.maxDepth;
      }
      break;
      
    case 'click':
      summary.clicks++;
      break;
      
    case 'form_submit':
      summary.engagement.formSubmissions++;
      break;
      
    case 'link_click':
      summary.engagement.linkClicks++;
      break;
      
    case 'scroll_milestone':
      summary.engagement.scrollMilestones++;
      break;
  }

  sessionSummaries.set(sessionId, summary);
}

/**
 * 更新页面统计
 */
async function updatePageStats(kv: KVNamespace, data: BehaviorData, dateKey: string) {
  const pagePath = data.page?.path || 'unknown';
  const pageStatsKey = `page_stats:${dateKey}:${pagePath}`;
  
  try {
    const existingStats = await kv.get(pageStatsKey, 'json') as any || {
      path: pagePath,
      date: dateKey,
      views: 0,
      uniqueUsers: new Set(),
      referrers: {},
      devices: {
        desktop: 0,
        mobile: 0,
        tablet: 0
      }
    };

    existingStats.views++;
    existingStats.uniqueUsers.add(data.userId);

    if (data.page?.referrer && data.page.referrer !== 'direct') {
      const referrerDomain = new URL(data.page.referrer).hostname;
      existingStats.referrers[referrerDomain] = (existingStats.referrers[referrerDomain] || 0) + 1;
    }

    // 设备类型检测（简单版本）
    if (data.device?.userAgent) {
      const ua = data.device.userAgent.toLowerCase();
      if (ua.includes('mobile')) {
        existingStats.devices.mobile++;
      } else if (ua.includes('tablet')) {
        existingStats.devices.tablet++;
      } else {
        existingStats.devices.desktop++;
      }
    }

    // 转换Set为数组以便JSON序列化
    const statsToSave = {
      ...existingStats,
      uniqueUsers: Array.from(existingStats.uniqueUsers),
      uniqueUserCount: existingStats.uniqueUsers.size
    };

    await kv.put(pageStatsKey, JSON.stringify(statsToSave), {
      expirationTtl: 365 * 24 * 60 * 60 // 1年过期
    });

  } catch (error) {
    console.error('更新页面统计失败:', error);
  }
}

/**
 * 更新用户活动统计
 */
async function updateUserActivity(kv: KVNamespace, data: BehaviorData, dateKey: string) {
  const userId = data.userId;
  const activityKey = `user_activity:${dateKey}:${userId}`;
  
  try {
    const existingActivity = await kv.get(activityKey, 'json') as any || {
      userId,
      date: dateKey,
      clicks: 0,
      scrollMilestones: 0,
      formSubmissions: 0,
      sessions: new Set(),
      pages: new Set(),
      totalActiveTime: 0
    };

    existingActivity.sessions.add(data.sessionId);
    if (data.page?.path) {
      existingActivity.pages.add(data.page.path);
    }

    switch (data.type) {
      case 'click':
        existingActivity.clicks++;
        break;
      case 'scroll_milestone':
        existingActivity.scrollMilestones++;
        break;
      case 'form_submit':
        existingActivity.formSubmissions++;
        break;
    }

    // 转换Set为数组以便JSON序列化
    const activityToSave = {
      ...existingActivity,
      sessions: Array.from(existingActivity.sessions),
      pages: Array.from(existingActivity.pages),
      sessionCount: existingActivity.sessions.size,
      pageCount: existingActivity.pages.size
    };

    await kv.put(activityKey, JSON.stringify(activityToSave), {
      expirationTtl: 90 * 24 * 60 * 60 // 90天过期
    });

  } catch (error) {
    console.error('更新用户活动统计失败:', error);
  }
}

/**
 * GET请求处理 - 查询行为数据
 */
export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const userId = url.searchParams.get('userId');
  const date = url.searchParams.get('date');
  const sessionId = url.searchParams.get('sessionId');
  const page = url.searchParams.get('page');

  try {
    let responseData = null;

    if (type === 'session' && date) {
      // 查询会话数据
      const listOptions = {
        prefix: `session:`,
        limit: 50
      };
      const sessionList = await env.USER_BEHAVIOR_KV.list(listOptions);
      
      const sessions = [];
      for (const key of sessionList.keys) {
        const session = await env.USER_BEHAVIOR_KV.get(key.name, 'json');
        if (session) sessions.push(session);
      }
      responseData = { sessions };
      
    } else if (type === 'page_stats' && date) {
      // 查询页面统计
      const listOptions = {
        prefix: `page_stats:${date}:`
      };
      const pageStatsList = await env.USER_BEHAVIOR_KV.list(listOptions);
      
      const pages = [];
      for (const key of pageStatsList.keys) {
        const stats = await env.USER_BEHAVIOR_KV.get(key.name, 'json');
        if (stats) pages.push(stats);
      }
      responseData = { pages };
      
    } else if (type === 'user_activity' && date) {
      // 查询用户活动 - 实时活动数据
      const listOptions = {
        prefix: `raw:${date}:`,
        limit: 100
      };
      const activityList = await env.USER_BEHAVIOR_KV.list(listOptions);
      
      const activities = [];
      for (const key of activityList.keys) {
        const activity = await env.USER_BEHAVIOR_KV.get(key.name, 'json');
        if (activity) activities.push(activity);
      }
      
      // 按时间倒序排列
      activities.sort((a, b) => b.timestamp - a.timestamp);
      responseData = { activities: activities.slice(0, 20) }; // 返回最近20条
      
    } else if (type === 'heatmap' && page && date) {
      // 查询热力图数据
      const heatmapKey = `heatmap:${date}:${page}`;
      const heatmapData = await env.USER_BEHAVIOR_KV.get(heatmapKey, 'json');
      responseData = { clicks: heatmapData?.clicks || [] };
    }

    // 如果没有数据，返回空数据而不是null
    if (!responseData) {
      responseData = { activities: [], sessions: [], pages: [], clicks: [] };
    }

    return new Response(JSON.stringify({
      success: true,
      ...responseData
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('获取用户行为数据失败:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      activities: [],
      sessions: [],
      pages: [],
      clicks: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}