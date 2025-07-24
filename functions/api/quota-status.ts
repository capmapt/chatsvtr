/**
 * SVTR.AI 免费额度状态API
 * 返回用户当前的配额使用情况
 */

import { createFreeTierManager } from '../lib/free-tier-manager';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { env } = context;
    
    // 初始化免费额度管理器
    const freeTierManager = createFreeTierManager(env.SVTR_KV);
    
    // 获取配额信息
    const quotaInfo = await freeTierManager.getQuotaInfo();
    const quotaCheck = await freeTierManager.checkQuota();
    
    const statusData = {
      status: quotaCheck.allowed ? 'active' : 'exceeded',
      quotas: {
        daily: {
          used: quotaInfo.daily.used,
          limit: quotaInfo.daily.limit,
          remaining: quotaInfo.daily.remaining,
          percentage: Math.round((quotaInfo.daily.used / quotaInfo.daily.limit) * 100),
          resetTime: quotaInfo.daily.resetTime
        },
        monthly: {
          used: quotaInfo.monthly.used,
          limit: quotaInfo.monthly.limit,
          remaining: quotaInfo.monthly.remaining,
          percentage: Math.round((quotaInfo.monthly.used / quotaInfo.monthly.limit) * 100),
          resetTime: quotaInfo.monthly.resetTime
        }
      },
      message: quotaCheck.allowed 
        ? '✅ 免费额度充足，享受SVTR.AI专业分析'
        : `⚠️ ${quotaCheck.reason}`,
      upgradeHint: !quotaCheck.allowed 
        ? '💎 配置自己的Cloudflare Workers AI密钥可获得更大免费额度！'
        : null,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(statusData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
    
  } catch (error) {
    console.error('获取配额状态失败:', error);
    
    return new Response(JSON.stringify({
      status: 'error',
      message: '无法获取配额状态',
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}