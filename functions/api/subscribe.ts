/**
 * SVTR邮箱订阅API端点
 * 处理用户邮箱订阅和退订功能
 * 集成Cloudflare KV存储，支持完整数据管理
 */

// 验证邮箱格式
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 生成订阅ID
function generateSubscriptionId(email: string): string {
  return `sub_${btoa(email).replace(/[+/=]/g, '')}`;
}

// 处理POST请求 - 订阅邮箱
export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    
    // 解析请求数据
    const requestData = await request.json();
    const { email, preferences = [], language = 'zh-CN' } = requestData;
    
    console.log('收到订阅请求:', { email, preferences, language });
    
    // 验证必要字段
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        message: '邮箱地址是必需的'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 验证邮箱格式
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        message: '邮箱格式无效'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 生成订阅数据
    const subscriptionId = generateSubscriptionId(email);
    const subscriptionData = {
      email,
      preferences,
      subscribedAt: new Date().toISOString(),
      ipAddress: request.headers.get('CF-Connecting-IP'),
      cfCountry: request.headers.get('CF-IPCountry'), // Cloudflare提供的国家代码
      userAgent: request.headers.get('User-Agent'),
      language
    };
    
    console.log('保存订阅数据:', subscriptionData);
    
    // 检查KV存储是否可用
    if (!env.SVTR_SESSIONS || !env.SVTR_CACHE) {
      console.warn('KV存储未配置，使用模拟响应');
      return new Response(JSON.stringify({
        success: true,
        message: language === 'zh-CN' ? '订阅成功！（测试模式）' : 'Successfully subscribed! (Test mode)',
        data: { subscriptionId },
        note: 'KV存储未配置，数据未实际保存'
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    // 保存到KV存储
    await env.SVTR_SESSIONS.put(subscriptionId, JSON.stringify(subscriptionData));
    
    // 更新订阅者列表（用于管理面板）
    const subscribersList = await env.SVTR_CACHE.get('subscribers_list');
    let subscribers = [];
    
    if (subscribersList) {
      subscribers = JSON.parse(subscribersList);
    }
    
    // 检查是否已存在
    const existingIndex = subscribers.findIndex((sub: any) => sub.email === email);
    if (existingIndex >= 0) {
      // 更新现有订阅
      subscribers[existingIndex] = { ...subscriptionData, id: subscriptionId };
    } else {
      // 添加新订阅
      subscribers.push({ ...subscriptionData, id: subscriptionId });
    }
    
    // 保存更新后的列表
    await env.SVTR_CACHE.put('subscribers_list', JSON.stringify(subscribers));
    
    // 记录统计数据
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats_${today}`;
    const todayStats = await env.SVTR_CACHE.get(statsKey);
    let stats = { subscriptions: 0 };
    
    if (todayStats) {
      stats = JSON.parse(todayStats);
    }
    stats.subscriptions += 1;
    
    await env.SVTR_CACHE.put(statsKey, JSON.stringify(stats), {
      expirationTtl: 30 * 24 * 60 * 60 // 30天过期
    });
    
    console.log('订阅成功保存');
    
    return new Response(JSON.stringify({
      success: true,
      message: language === 'zh-CN' ? '订阅成功！' : 'Successfully subscribed!',
      data: { subscriptionId }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('订阅处理失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误，请稍后重试',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理GET请求 - 获取订阅统计
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    console.log('GET请求:', action);
    
    // 如果KV存储未配置，返回模拟数据
    if (!env.SVTR_SESSIONS || !env.SVTR_CACHE) {
      console.warn('KV存储未配置，返回模拟数据');
      
      if (action === 'stats') {
        return new Response(JSON.stringify({
          totalSubscribers: 0,
          todaySubscribers: 0,
          recentSubscribers: 0,
          languageDistribution: { 'zh-CN': 0, 'en-US': 0 },
          languageBreakdown: { 'zh-CN': 0, 'en-US': 0 },
          note: 'KV存储未配置，显示模拟数据'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      if (action === 'list') {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    if (action === 'stats') {
      // 获取统计数据
      const subscribersList = await env.SVTR_CACHE.get('subscribers_list');
      const subscribers = subscribersList ? JSON.parse(subscribersList) : [];
      
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        totalSubscribers: subscribers.length,
        todaySubscribers: subscribers.filter((sub: any) => {
          const subDate = new Date(sub.subscribedAt);
          const subToday = subDate.toISOString().split('T')[0];
          return subToday === today;
        }).length,
        recentSubscribers: subscribers.filter((sub: any) => {
          const subDate = new Date(sub.subscribedAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return subDate > weekAgo;
        }).length,
        languageDistribution: subscribers.reduce((acc: any, sub: any) => {
          acc[sub.language] = (acc[sub.language] || 0) + 1;
          return acc;
        }, { 'zh-CN': 0, 'en-US': 0 }),
        // 保持向后兼容
        languageBreakdown: subscribers.reduce((acc: any, sub: any) => {
          acc[sub.language] = (acc[sub.language] || 0) + 1;
          return acc;
        }, {})
      };
      
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (action === 'list') {
      // 获取订阅者列表（简化版，隐私保护）
      const subscribersList = await env.SVTR_CACHE.get('subscribers_list');
      const subscribers = subscribersList ? JSON.parse(subscribersList) : [];
      
      const publicList = subscribers.map((sub: any) => ({
        id: sub.id,
        email: sub.email, // 返回完整邮箱用于管理面板
        emailDomain: sub.email.split('@')[1],
        preferences: sub.preferences,
        subscribedAt: sub.subscribedAt,
        language: sub.language,
        ipAddress: sub.ipAddress,
        userAgent: sub.userAgent
      }));
      
      return new Response(JSON.stringify(publicList), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '无效的请求参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('获取数据失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理DELETE请求 - 取消订阅
export async function onRequestDelete(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const requestData = await request.json();
    const { email } = requestData;
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        message: '邮箱地址是必需的'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 如果KV存储未配置
    if (!env.SVTR_SESSIONS || !env.SVTR_CACHE) {
      return new Response(JSON.stringify({
        success: true,
        message: '取消订阅成功（测试模式）',
        note: 'KV存储未配置，操作未实际执行'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const subscriptionId = generateSubscriptionId(email);
    
    // 从KV存储中删除
    await env.SVTR_SESSIONS.delete(subscriptionId);
    
    // 从订阅者列表中删除
    const subscribersList = await env.SVTR_CACHE.get('subscribers_list');
    if (subscribersList) {
      const subscribers = JSON.parse(subscribersList);
      const filteredSubscribers = subscribers.filter((sub: any) => sub.email !== email);
      await env.SVTR_CACHE.put('subscribers_list', JSON.stringify(filteredSubscribers));
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: '取消订阅成功'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('取消订阅失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '服务器错误',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理OPTIONS请求 - CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}