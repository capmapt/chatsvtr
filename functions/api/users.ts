/**
 * SVTR 用户管理API端点
 * 用于管理中心获取用户列表、统计等信息
 */

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'github';
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  geoLocation?: {
    city: string;
    region: string;
    country: string;
    timezone: string;
  };
  ipAddress?: string;
}

// 处理GET请求 - 获取用户列表和统计
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'list';
    
    console.log('[Users API] 请求操作:', action);
    
    if (action === 'list') {
      // 获取用户列表
      const users = await getAllUsers(env);
      
      return new Response(JSON.stringify(users), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (action === 'stats') {
      // 获取用户统计
      const users = await getAllUsers(env);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const thisMonth = now.toISOString().slice(0, 7);
      
      // 统计数据
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(user => user.isActive).length,
        todayRegistrations: users.filter(user => 
          user.createdAt.startsWith(today)
        ).length,
        monthlyRegistrations: users.filter(user => 
          user.createdAt.startsWith(thisMonth)
        ).length,
        providerDistribution: {
          email: users.filter(user => user.provider === 'email').length,
          google: users.filter(user => user.provider === 'google').length,
          github: users.filter(user => user.provider === 'github').length
        },
        recentUsers: users
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
      };
      
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (action === 'search') {
      // 搜索用户
      const query = url.searchParams.get('q')?.toLowerCase() || '';
      const users = await getAllUsers(env);
      
      const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.name?.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
      );
      
      return new Response(JSON.stringify(filteredUsers), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '不支持的操作'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('[Users API] 错误:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '获取用户数据失败',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理POST请求 - 用户管理操作
export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const requestData = await request.json();
    const { action } = requestData;
    
    console.log('[Users API] POST操作:', action, requestData);
    
    if (action === 'update_status') {
      const { userId, isActive } = requestData;
      
      if (!userId || typeof isActive !== 'boolean') {
        return new Response(JSON.stringify({
          success: false,
          message: '参数错误：需要userId和isActive'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      // 更新用户状态
      const updated = await updateUserStatus(env, userId, isActive);
      
      if (updated) {
        return new Response(JSON.stringify({
          success: true,
          message: `用户状态已更新为${isActive ? '活跃' : '禁用'}`
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          message: '用户不存在或更新失败'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      message: '不支持的操作'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('[Users API] POST错误:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '操作失败',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理OPTIONS请求 - CORS预检
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// 获取所有用户的辅助函数
async function getAllUsers(env: any): Promise<User[]> {
  try {
    const users: User[] = [];
    
    // KV list操作获取所有用户key
    const listResult = await env.SVTR_CACHE.list({ prefix: 'user_', limit: 1000 });
    
    console.log(`[Users API] 找到 ${listResult.keys.length} 个用户key`);
    
    // 获取订阅者列表用于交叉比对
    const subscribersList = await env.SVTR_CACHE.get('subscribers_list');
    const subscribers = subscribersList ? JSON.parse(subscribersList) : [];
    const subscriberEmails = new Set(subscribers.map((sub: any) => sub.email));
    
    console.log(`[Users API] 找到 ${subscribers.length} 个订阅者`);
    
    // 批量获取用户数据
    const userPromises = listResult.keys
      .filter(key => key.name.startsWith('user_') && key.name.includes('@'))
      .map(async (key) => {
        try {
          const userData = await env.SVTR_CACHE.get(key.name);
          if (userData) {
            const user = JSON.parse(userData) as User;
            
            // 增加订阅状态
            const isSubscriber = subscriberEmails.has(user.email);
            
            // 增加地理位置信息（从IP获取基本位置信息）
            const location = await getLocationFromUserData(user, subscribers);
            
            return {
              ...user,
              isSubscriber,
              location
            };
          }
          return null;
        } catch (error) {
          console.error(`[Users API] 解析用户数据失败 ${key.name}:`, error);
          return null;
        }
      });
    
    const userResults = await Promise.all(userPromises);
    const validUsers = userResults.filter(user => user !== null) as User[];
    
    // 按创建时间降序排列
    validUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`[Users API] 成功获取 ${validUsers.length} 个有效用户`);
    
    return validUsers;
    
  } catch (error) {
    console.error('[Users API] 获取用户列表失败:', error);
    return [];
  }
}

// 从用户数据获取地理位置信息
async function getLocationFromUserData(user: any, subscribers: any[]): Promise<string> {
  try {
    // 优先使用用户自身的地理位置信息（新注册用户）
    if (user.geoLocation) {
      const geo = user.geoLocation;
      if (geo.city && geo.city !== '未知') {
        return `${geo.city}, ${geo.region || geo.country}`;
      }
      if (geo.country && geo.country !== '未知') {
        return geo.country;
      }
    }
    
    // 其次从订阅数据中查找该用户的详细地理位置信息
    const subscriberInfo = subscribers.find((sub: any) => sub.email === user.email);
    
    if (subscriberInfo) {
      // 使用订阅时的地理位置信息
      if (subscriberInfo.geoLocation) {
        const geo = subscriberInfo.geoLocation;
        if (geo.city && geo.city !== '未知') {
          return `${geo.city}, ${geo.region || geo.country}`;
        }
        if (geo.country && geo.country !== '未知') {
          return geo.country;
        }
      }
      
      // 回退到原有的IP地址推断逻辑
      if (subscriberInfo.ipAddress) {
        const location = getLocationFromIP(subscriberInfo.ipAddress, subscriberInfo.cfCountry);
        if (location && location !== '未知地区') {
          return location;
        }
      }
    }
    
    // 如果没有地理位置信息，尝试从邮箱域名推断地理区域
    const emailDomain = user.email.split('@')[1];
    return getLocationFromEmailDomain(emailDomain);
    
  } catch (error) {
    console.error(`[Users API] 获取用户地理位置失败 ${user.email}:`, error);
    return '未知';
  }
}

// 基于IP地址进行地理位置推断（使用Cloudflare的CF-IPCountry头）
function getLocationFromIP(ip: string, cfCountry?: string): string {
  // 本地/测试环境IP
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return '本地环境';
  }
  
  // 优先使用Cloudflare的国家代码
  if (cfCountry && cfCountry !== 'XX') {
    const countryMap: { [key: string]: string } = {
      'CN': '中国',
      'US': '美国',
      'JP': '日本',
      'KR': '韩国',
      'SG': '新加坡',
      'HK': '香港',
      'TW': '台湾',
      'GB': '英国',
      'DE': '德国',
      'FR': '法国',
      'CA': '加拿大',
      'AU': '澳大利亚',
      'IN': '印度',
      'BR': '巴西',
      'MX': '墨西哥',
      'RU': '俄罗斯'
    };
    return countryMap[cfCountry] || `${cfCountry}地区`;
  }
  
  // 基于IP段的简单推断（IPv4）
  if (ip.includes('.')) {
    const segments = ip.split('.').map(Number);
    const firstSegment = segments[0];
    
    // 中国大陆常见IP段
    if ((firstSegment >= 1 && firstSegment <= 126 && firstSegment !== 127) ||
        (firstSegment >= 202 && firstSegment <= 203) ||
        (firstSegment >= 210 && firstSegment <= 222)) {
      return '中国';
    }
    
    // 美国常见IP段
    if ((firstSegment >= 3 && firstSegment <= 99) ||
        (firstSegment >= 128 && firstSegment <= 191)) {
      return '美国';
    }
  }
  
  return '未知地区';
}

// 基于邮箱域名推断地理区域
function getLocationFromEmailDomain(domain: string): string {
  const domainLocationMap: { [key: string]: string } = {
    'qq.com': '中国',
    '163.com': '中国',
    '126.com': '中国',
    'sina.com': '中国',
    'sina.cn': '中国',
    'sohu.com': '中国',
    'foxmail.com': '中国',
    'gmail.com': '全球',
    'yahoo.com': '美国',
    'hotmail.com': '美国',
    'outlook.com': '美国',
    'live.com': '美国',
    'msn.com': '美国',
    'svtr.ai': '平台内部',
    'example.com': '测试环境'
  };
  
  return domainLocationMap[domain.toLowerCase()] || '其他地区';
}

// 更新用户状态
async function updateUserStatus(env: any, userId: string, isActive: boolean): Promise<boolean> {
  try {
    // 先通过user_id_前缀找到用户
    const userData = await env.SVTR_CACHE.get(`user_id_${userId}`);
    
    if (!userData) {
      console.log(`[Users API] 用户不存在: ${userId}`);
      return false;
    }
    
    const user: User = JSON.parse(userData);
    const updatedUser: User = {
      ...user,
      isActive,
      lastLoginAt: new Date().toISOString() // 更新最后操作时间
    };
    
    // 更新两个存储key
    await env.SVTR_CACHE.put(`user_${user.email}`, JSON.stringify(updatedUser));
    await env.SVTR_CACHE.put(`user_id_${userId}`, JSON.stringify(updatedUser));
    
    console.log(`[Users API] 用户状态更新成功: ${userId} -> ${isActive}`);
    return true;
    
  } catch (error) {
    console.error(`[Users API] 更新用户状态失败 ${userId}:`, error);
    return false;
  }
}