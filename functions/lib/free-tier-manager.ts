/**
 * Cloudflare免费额度管理器
 * 跟踪使用情况，实现类似AutoRAG的免费体验
 */

interface UsageStats {
  dailyRequests: number;
  monthlyNeurons: number;
  lastResetDate: string;
  lastMonthlyReset: string;
}

export class FreeTierManager {
  private kv: any;
  
  // Cloudflare免费额度限制
  private readonly DAILY_REQUEST_LIMIT = 10000;
  private readonly MONTHLY_NEURON_LIMIT = 100000;
  private readonly NEURON_COST_PER_REQUEST = 1; // 估算每次请求消耗

  constructor(kv: any) {
    this.kv = kv;
  }

  /**
   * 检查是否在免费额度内
   */
  async checkQuota(): Promise<{ allowed: boolean; reason?: string; remaining?: any }> {
    const stats = await this.getUsageStats();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');

    // 检查日额度
    if (stats.dailyRequests >= this.DAILY_REQUEST_LIMIT) {
      return {
        allowed: false,
        reason: 'Daily request limit exceeded. Resets at midnight UTC.',
        remaining: {
          daily: 0,
          monthly: Math.max(0, this.MONTHLY_NEURON_LIMIT - stats.monthlyNeurons)
        }
      };
    }

    // 检查月额度
    if (stats.monthlyNeurons >= this.MONTHLY_NEURON_LIMIT) {
      return {
        allowed: false,
        reason: 'Monthly computation limit exceeded. Resets next month.',
        remaining: {
          daily: Math.max(0, this.DAILY_REQUEST_LIMIT - stats.dailyRequests),
          monthly: 0
        }
      };
    }

    return {
      allowed: true,
      remaining: {
        daily: this.DAILY_REQUEST_LIMIT - stats.dailyRequests,
        monthly: this.MONTHLY_NEURON_LIMIT - stats.monthlyNeurons
      }
    };
  }

  /**
   * 记录API使用
   */
  async recordUsage(neuronCost: number = 1): Promise<void> {
    const stats = await this.getUsageStats();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');

    // 重置日计数器
    if (stats.lastResetDate !== today) {
      stats.dailyRequests = 0;
      stats.lastResetDate = today;
    }

    // 重置月计数器
    if (stats.lastMonthlyReset !== currentMonth) {
      stats.monthlyNeurons = 0;
      stats.lastMonthlyReset = currentMonth;
    }

    // 更新使用统计
    stats.dailyRequests += 1;
    stats.monthlyNeurons += neuronCost;

    await this.saveUsageStats(stats);
  }

  /**
   * 获取使用统计
   */
  private async getUsageStats(): Promise<UsageStats> {
    try {
      const data = await this.kv.get('usage_stats');
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.log('Failed to get usage stats:', error);
    }

    // 默认统计数据
    const now = new Date();
    return {
      dailyRequests: 0,
      monthlyNeurons: 0,
      lastResetDate: now.toISOString().split('T')[0],
      lastMonthlyReset: now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0')
    };
  }

  /**
   * 保存使用统计
   */
  private async saveUsageStats(stats: UsageStats): Promise<void> {
    try {
      await this.kv.put('usage_stats', JSON.stringify(stats));
    } catch (error) {
      console.log('Failed to save usage stats:', error);
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
        limit: this.DAILY_REQUEST_LIMIT,
        remaining: Math.max(0, this.DAILY_REQUEST_LIMIT - stats.dailyRequests),
        resetTime: 'Midnight UTC'
      },
      monthly: {
        used: stats.monthlyNeurons,
        limit: this.MONTHLY_NEURON_LIMIT,
        remaining: Math.max(0, this.MONTHLY_NEURON_LIMIT - stats.monthlyNeurons),
        resetTime: 'First day of next month'
      }
    };
  }

  /**
   * 智能降级策略
   */
  async getSuggestedFallback(reason: string): Promise<string> {
    if (reason.includes('Daily')) {
      return 'demo_mode'; // 使用智能演示模式
    } else if (reason.includes('Monthly')) {
      return 'basic_mode'; // 使用基础回复模式
    }
    return 'demo_mode';
  }
}

/**
 * 创建免费额度管理器实例
 */
export function createFreeTierManager(kv: any): FreeTierManager {
  return new FreeTierManager(kv);
}