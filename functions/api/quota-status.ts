/**
 * SVTR.AI 免费额度状态API
 * 返回用户当前的配额使用情况
 */

import { UsageMonitor } from './usage-monitor';

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const usageMonitor = new UsageMonitor(context);
    
    // 获取配额信息
    const quotaInfo = await usageMonitor.getQuotaInfo();
    const quotaCheck = await usageMonitor.checkQuota();
    
    // 生成用户友好的消息
    let message = '✅ Cloudflare AI免费额度充足，零费用运行';
    let upgradeHint = '';
    
    if (quotaInfo.daily.percentage > 80) {
      message = '⚠️ 今日免费额度使用较多，请适度使用';
    }
    
    if (quotaInfo.monthly.percentage > 80) {
      message = '🚨 本月免费额度即将用完，请控制使用频率';
      upgradeHint = '💡 提示：下月额度将自动重置，继续零费用使用';
    }
    
    if (!quotaCheck.allowed) {
      message = '❌ 免费额度已用完，已切换到演示模式';
      upgradeHint = '💡 明日或下月额度将自动重置，继续零费用体验';
    }

    const statusData = {
      status: quotaCheck.allowed ? 'active' : 'exceeded',
      quotas: quotaInfo,
      message,
      upgradeHint,
      costSavings: {
        estimatedCost: 0,
        description: '使用Cloudflare AI免费额度，完全零费用运行'
      },
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