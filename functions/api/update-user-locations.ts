/**
 * SVTR 用户地理位置更新API
 * 为现有用户补充地理位置信息
 */

import { getGeoLocationFromIP } from '../lib/geolocation-service';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'email' | 'google' | 'github' | 'linkedin';
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

// 处理POST请求 - 批量更新用户地理位置
export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const requestData = await request.json();
    const { action, batchSize = 10 } = requestData;
    
    console.log('[UpdateUserLocations] 开始批量更新用户地理位置');
    
    if (action !== 'update_locations') {
      return new Response(JSON.stringify({
        success: false,
        message: '不支持的操作'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 获取所有用户
    const listResult = await env.SVTR_CACHE.list({ prefix: 'user_', limit: 1000 });
    console.log(`[UpdateUserLocations] 找到 ${listResult.keys.length} 个用户key`);
    
    // 获取订阅者数据用于IP地址查找
    const subscribersList = await env.SVTR_CACHE.get('subscribers_list');
    const subscribers = subscribersList ? JSON.parse(subscribersList) : [];
    const subscriberMap = new Map(subscribers.map((sub: any) => [sub.email, sub]));
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // 批量处理用户数据
    const userKeys = listResult.keys
      .filter(key => key.name.startsWith('user_') && key.name.includes('@'))
      .slice(0, batchSize);
    
    for (const key of userKeys) {
      try {
        const userData = await env.SVTR_CACHE.get(key.name);
        if (!userData) continue;
        
        const user: User = JSON.parse(userData);
        
        // 如果用户已有地理位置信息，跳过
        if (user.geoLocation && user.geoLocation.city !== '未知') {
          skippedCount++;
          continue;
        }
        
        console.log(`[UpdateUserLocations] 更新用户地理位置: ${user.email}`);
        
        // 尝试从订阅数据中获取IP地址
        const subscriberInfo = subscriberMap.get(user.email);
        let ipAddress = user.ipAddress;
        let cfCountry: string | undefined;
        
        if (subscriberInfo && subscriberInfo.ipAddress) {
          ipAddress = subscriberInfo.ipAddress;
          cfCountry = subscriberInfo.cfCountry;
        }
        
        // 如果没有IP地址，跳过
        if (!ipAddress || ipAddress === '127.0.0.1') {
          skippedCount++;
          continue;
        }
        
        // 获取地理位置信息
        let geoLocation;
        try {
          geoLocation = await getGeoLocationFromIP(ipAddress, cfCountry);
        } catch (error) {
          console.warn(`[UpdateUserLocations] 地理位置获取失败: ${user.email}`, error);
          geoLocation = {
            city: '未知',
            region: '未知', 
            country: '未知',
            timezone: '未知'
          };
        }
        
        // 更新用户数据
        const updatedUser: User = {
          ...user,
          geoLocation,
          ipAddress,
          lastLoginAt: new Date().toISOString() // 更新最后操作时间
        };
        
        // 保存到两个存储key
        await env.SVTR_CACHE.put(`user_${user.email}`, JSON.stringify(updatedUser));
        await env.SVTR_CACHE.put(`user_id_${user.id}`, JSON.stringify(updatedUser));
        
        updatedCount++;
        console.log(`[UpdateUserLocations] 用户地理位置更新成功: ${user.email} -> ${geoLocation.city}, ${geoLocation.country}`);
        
        // 添加延迟避免API频率限制
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`[UpdateUserLocations] 更新用户失败 ${key.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`[UpdateUserLocations] 批量更新完成: 更新${updatedCount}个, 跳过${skippedCount}个, 错误${errorCount}个`);
    
    return new Response(JSON.stringify({
      success: true,
      message: '批量更新用户地理位置完成',
      data: {
        updated: updatedCount,
        skipped: skippedCount,
        errors: errorCount,
        total: userKeys.length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('[UpdateUserLocations] 批量更新失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '批量更新失败',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理GET请求 - 获取更新状态
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env } = context;
    
    // 统计用户地理位置信息完整度
    const listResult = await env.SVTR_CACHE.list({ prefix: 'user_', limit: 1000 });
    
    let totalUsers = 0;
    let usersWithLocation = 0;
    let usersWithCityInfo = 0;
    
    const userKeys = listResult.keys.filter(key => 
      key.name.startsWith('user_') && key.name.includes('@')
    );
    
    for (const key of userKeys) {
      try {
        const userData = await env.SVTR_CACHE.get(key.name);
        if (!userData) continue;
        
        const user: User = JSON.parse(userData);
        totalUsers++;
        
        if (user.geoLocation) {
          usersWithLocation++;
          if (user.geoLocation.city && user.geoLocation.city !== '未知') {
            usersWithCityInfo++;
          }
        }
      } catch (error) {
        console.error(`[UpdateUserLocations] 统计失败 ${key.name}:`, error);
      }
    }
    
    const stats = {
      totalUsers,
      usersWithLocation,
      usersWithCityInfo,
      completionRate: totalUsers > 0 ? ((usersWithLocation / totalUsers) * 100).toFixed(1) : '0',
      cityInfoRate: totalUsers > 0 ? ((usersWithCityInfo / totalUsers) * 100).toFixed(1) : '0'
    };
    
    return new Response(JSON.stringify({
      success: true,
      message: '用户地理位置统计',
      data: stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
    
  } catch (error) {
    console.error('[UpdateUserLocations] 获取统计失败:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: '获取统计失败',
      error: error.message
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}