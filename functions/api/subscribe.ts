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
    
    // 获取详细地理位置信息
    const ipAddress = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    let geoLocation = {
      city: '未知',
      region: '未知',
      country: '未知',
      timezone: '未知'
    };

    try {
      // 使用ipapi.co获取详细地理位置（免费1000次/天）
      if (ipAddress && ipAddress !== '127.0.0.1' && !ipAddress.startsWith('192.168.')) {
        console.log(`[Subscribe] 获取IP地理位置: ${ipAddress}`);
        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
          headers: { 'User-Agent': 'SVTR-GeoLocation/1.0' },
          timeout: 5000 // 5秒超时
        });
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData && geoData.city) {
            geoLocation = {
              city: geoData.city || '未知',
              region: geoData.region || '未知', 
              country: geoData.country_name || '未知',
              timezone: geoData.timezone || '未知'
            };
            console.log(`[Subscribe] 地理位置获取成功:`, geoLocation);
          }
        }
      }
    } catch (error) {
      console.warn(`[Subscribe] 地理位置获取失败: ${error.message}`);
      // 使用Cloudflare fallback
      const cfCountry = request.headers.get('CF-IPCountry');
      if (cfCountry && cfCountry !== 'XX') {
        const countryMap: { [key: string]: string } = {
          'CN': '中国', 'US': '美国', 'JP': '日本', 'KR': '韩国', 
          'SG': '新加坡', 'HK': '香港', 'TW': '台湾', 'GB': '英国'
        };
        geoLocation.country = countryMap[cfCountry] || cfCountry;
      }
    }

    // 生成订阅数据
    const subscriptionId = generateSubscriptionId(email);
    const subscriptionData = {
      email,
      preferences,
      subscribedAt: new Date().toISOString(),
      ipAddress,
      cfCountry: request.headers.get('CF-IPCountry'), // 保留原有字段
      userAgent: request.headers.get('User-Agent'),
      language,
      // 新增详细地理位置信息
      geoLocation
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
      
      const publicList = subscribers.map((sub: any) => {
        // 格式化地理位置信息 - 优化显示逻辑
        let locationInfo = '未知地区';
        
        // 优先使用详细地理位置信息
        if (sub.geoLocation) {
          const geo = sub.geoLocation;
          if (geo.city && geo.city !== '未知' && geo.city !== 'Unknown') {
            // 优先显示城市信息
            locationInfo = `${geo.city}${geo.region && geo.region !== geo.city ? ', ' + geo.region : ''}, ${geo.country}`;
          } else if (geo.region && geo.region !== '未知' && geo.region !== 'Unknown') {
            // 没有城市，显示区域
            locationInfo = `${geo.region}, ${geo.country}`;
          } else if (geo.country && geo.country !== '未知' && geo.country !== 'Unknown') {
            // 只有国家信息
            locationInfo = geo.country;
          }
        }
        
        // 后备逻辑1：基于IP推断位置
        if (locationInfo === '未知地区' && sub.ipAddress) {
          locationInfo = getLocationFromIPAddress(sub.ipAddress, sub.cfCountry);
        }
        
        // 后备逻辑2：基于邮箱域名推断
        if (locationInfo === '未知地区' || locationInfo === '其他地区') {
          const emailDomain = sub.email.split('@')[1];
          const domainLocation = getLocationFromEmailDomain(emailDomain);
          if (domainLocation !== '其他地区') {
            locationInfo = domainLocation;
          }
        }
        
        return {
          id: sub.id,
          email: sub.email, // 返回完整邮箱用于管理面板
          emailDomain: sub.email.split('@')[1],
          preferences: sub.preferences,
          subscribedAt: sub.subscribedAt,
          language: sub.language,
          location: locationInfo, // 替换ipAddress为location
          geoLocation: sub.geoLocation, // 保留完整地理位置信息
          userAgent: sub.userAgent
        };
      });
      
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

// 基于IP地址获取位置信息的辅助函数
function getLocationFromIPAddress(ip: string, cfCountry?: string): string {
  // 本地/测试环境IP
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return '本地环境';
  }
  
  // 优先使用Cloudflare的国家代码 - 扩展更多国家和城市映射
  if (cfCountry && cfCountry !== 'XX') {
    const locationMap: { [key: string]: string } = {
      'CN': '中国大陆',
      'US': '美国',
      'JP': '日本',
      'KR': '韩国',
      'SG': '新加坡',
      'HK': '香港特别行政区',
      'TW': '台湾地区',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'IN': '印度',
      'BR': '巴西',
      'MX': '墨西哥',
      'RU': '俄罗斯',
      'IT': '意大利',
      'ES': '西班牙',
      'NL': '荷兰',
      'CH': '瑞士',
      'SE': '瑞典',
      'NO': '挪威',
      'DK': '丹麦',
      'FI': '芬兰',
      'BE': '比利时',
      'AT': '奥地利',
      'PL': '波兰',
      'CZ': '捷克',
      'HU': '匈牙利',
      'MY': '马来西亚',
      'TH': '泰国',
      'VN': '越南',
      'ID': '印度尼西亚',
      'PH': '菲律宾',
      'NZ': '新西兰',
      'ZA': '南非',
      'EG': '埃及',
      'IL': '以色列',
      'AE': '阿联酋',
      'SA': '沙特阿拉伯'
    };
    return locationMap[cfCountry] || `${cfCountry}`;
  }
  
  // 基于IP段的详细推断
  if (ip.includes('.')) {
    const segments = ip.split('.').map(Number);
    const firstSegment = segments[0];
    const secondSegment = segments[1];
    
    // 中国大陆详细IP段分析
    if ((firstSegment >= 1 && firstSegment <= 126 && firstSegment !== 127)) {
      if (firstSegment >= 58 && firstSegment <= 61) return '北京, 中国';
      if (firstSegment >= 114 && firstSegment <= 117) return '上海, 中国';
      if (firstSegment >= 113 && firstSegment <= 114) return '广东, 中国';
      return '中国大陆';
    }
    
    if ((firstSegment >= 202 && firstSegment <= 203) ||
        (firstSegment >= 210 && firstSegment <= 222)) {
      return '中国大陆';
    }
    
    // 美国详细IP段
    if ((firstSegment >= 3 && firstSegment <= 99) ||
        (firstSegment >= 128 && firstSegment <= 191)) {
      if (firstSegment >= 192 && firstSegment <= 199) return '加利福尼亚, 美国';
      if (firstSegment >= 204 && firstSegment <= 207) return '纽约, 美国';
      return '美国';
    }
  }
  
  return '未知地区';
}

// 基于邮箱域名获取地理位置信息
function getLocationFromEmailDomain(emailDomain: string): string {
  const domainLocationMap: { [key: string]: string } = {
    // 中国主要邮箱服务商
    'qq.com': '腾讯邮箱 (中国)',
    '163.com': '网易邮箱 (中国)',
    '126.com': '网易邮箱 (中国)',
    'sina.com': '新浪邮箱 (中国)',
    'sina.cn': '新浪邮箱 (中国)',
    'sohu.com': '搜狐邮箱 (中国)',
    'foxmail.com': '腾讯Foxmail (中国)',
    'yeah.net': '网易邮箱 (中国)',
    'tom.com': 'TOM邮箱 (中国)',
    'aliyun.com': '阿里云邮箱 (中国)',
    
    // 国际邮箱服务商
    'gmail.com': 'Google邮箱 (全球)',
    'yahoo.com': 'Yahoo邮箱 (美国)',
    'yahoo.co.jp': 'Yahoo日本 (日本)',
    'hotmail.com': 'Microsoft邮箱 (美国)',
    'outlook.com': 'Microsoft邮箱 (美国)',
    'live.com': 'Microsoft邮箱 (美国)',
    'msn.com': 'Microsoft邮箱 (美国)',
    'icloud.com': 'Apple邮箱 (美国)',
    'me.com': 'Apple邮箱 (美国)',
    
    // 企业和机构
    'svtr.ai': '平台内部',
    'example.com': '测试环境',
    
    // 教育机构常见后缀
    'edu.cn': '中国教育机构',
    'ac.cn': '中国科研机构',
    'gov.cn': '中国政府机构',
    'edu': '教育机构',
    'ac.uk': '英国学术机构',
    'edu.au': '澳大利亚教育机构'
  };
  
  const lowerDomain = emailDomain.toLowerCase();
  
  // 精确匹配
  if (domainLocationMap[lowerDomain]) {
    return domainLocationMap[lowerDomain];
  }
  
  // 模糊匹配教育机构
  if (lowerDomain.includes('.edu')) return '教育机构';
  if (lowerDomain.includes('.gov')) return '政府机构';
  if (lowerDomain.includes('.org')) return '非营利组织';
  
  return '其他地区';
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