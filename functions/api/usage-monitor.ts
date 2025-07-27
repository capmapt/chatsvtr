/**
 * Cloudflare AI 免费额度监控
 * 确保不超出免费限制
 */

interface UsageStats {
  dailyRequests: number;
  monthlyTokens: number;
  lastResetDate: string;
  lastMonthlyReset: string;
}

// Cloudflare AI 免费额度限制（估算）
const FREE_LIMITS = {
  DAILY_REQUESTS: 1000,      // 每日请求数限制
  MONTHLY_TOKENS: 100000,    // 每月token限制
  MAX_TOKENS_PER_REQUEST: 2048  // 单次请求token限制
};

export class UsageMonitor {
  private context: any;

  constructor(context: any) {
    this.context = context;
  }

  /**
   * 检查是否可以执行请求
   */
  async checkQuota(estimatedTokens: number = 500): Promise<{ allowed: boolean; reason?: string }> {
    const stats = await this.getUsageStats();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // 重置日计数器
    if (stats.lastResetDate !== today) {
      stats.dailyRequests = 0;
      stats.lastResetDate = today;
    }

    // 重置月计数器
    if (stats.lastMonthlyReset !== currentMonth) {
      stats.monthlyTokens = 0;
      stats.lastMonthlyReset = currentMonth;
    }

    // 检查日限制
    if (stats.dailyRequests >= FREE_LIMITS.DAILY_REQUESTS) {
      return {
        allowed: false,
        reason: `日请求数已达限制 (${FREE_LIMITS.DAILY_REQUESTS})，请明天再试`
      };
    }

    // 检查月token限制
    if (stats.monthlyTokens + estimatedTokens > FREE_LIMITS.MONTHLY_TOKENS) {
      return {
        allowed: false,
        reason: `月token使用量接近限制，请下月再试`
      };
    }

    return { allowed: true };
  }

  /**
   * 记录使用情况
   */
  async recordUsage(tokensUsed: number): Promise<void> {
    const stats = await this.getUsageStats();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    // 确保计数器是当前日期/月份的
    if (stats.lastResetDate !== today) {
      stats.dailyRequests = 0;
      stats.lastResetDate = today;
    }

    if (stats.lastMonthlyReset !== currentMonth) {
      stats.monthlyTokens = 0;
      stats.lastMonthlyReset = currentMonth;
    }

    // 更新使用统计
    stats.dailyRequests += 1;
    stats.monthlyTokens += tokensUsed;

    await this.saveUsageStats(stats);
  }

  /**
   * 获取使用统计
   */
  private async getUsageStats(): Promise<UsageStats> {
    try {
      // 尝试从KV存储读取
      const data = await this.context.env.USAGE_KV?.get('usage_stats');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('无法读取使用统计，使用默认值');
    }

    // 返回默认统计
    const now = new Date();
    return {
      dailyRequests: 0,
      monthlyTokens: 0,
      lastResetDate: now.toISOString().split('T')[0],
      lastMonthlyReset: `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
    };
  }

  /**
   * 保存使用统计
   */
  private async saveUsageStats(stats: UsageStats): Promise<void> {
    try {
      await this.context.env.USAGE_KV?.put('usage_stats', JSON.stringify(stats));
    } catch (error) {
      console.log('无法保存使用统计');
    }
  }

  /**
   * 获取剩余配额信息
   */
  async getQuotaInfo(): Promise<any> {
    const stats = await this.getUsageStats();
    
    return {
      daily: {
        used: stats.dailyRequests,
        limit: FREE_LIMITS.DAILY_REQUESTS,
        remaining: Math.max(0, FREE_LIMITS.DAILY_REQUESTS - stats.dailyRequests),
        percentage: Math.round((stats.dailyRequests / FREE_LIMITS.DAILY_REQUESTS) * 100)
      },
      monthly: {
        used: stats.monthlyTokens,
        limit: FREE_LIMITS.MONTHLY_TOKENS,
        remaining: Math.max(0, FREE_LIMITS.MONTHLY_TOKENS - stats.monthlyTokens),
        percentage: Math.round((stats.monthlyTokens / FREE_LIMITS.MONTHLY_TOKENS) * 100)
      }
    };
  }

  /**
   * 估算token使用量
   */
  estimateTokens(text: string): number {
    // 简单估算：中文1字符≈1token，英文1词≈1token
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w.length > 0).length;
    
    return Math.ceil(chineseChars + englishWords * 1.3);
  }
}