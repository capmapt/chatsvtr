/**
 * 每日融资数据自动更新的定时任务
 * 每天北京时间09:00自动执行，刷新缓存的融资数据
 */

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: KVNamespace;
}

/**
 * 定时任务处理函数
 */
export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('🕘 融资日报定时更新任务开始...');

    try {
      // 调用融资数据同步API
      const baseUrl = env.APP_URL || 'https://svtr.ai';
      const response = await fetch(`${baseUrl}/api/funding-daily-sync?refresh=true`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SVTR-Scheduled-Update/1.0',
          'X-Source': 'scheduled-task'
        }
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ 定时更新成功: ${result.count} 条融资数据已更新`);

        // 可选：发送通知到监控系统或日志
        // await notifyUpdateSuccess(result);

      } else {
        throw new Error(`同步失败: ${result.message}`);
      }

    } catch (error) {
      console.error('❌ 融资日报定时更新失败:', error);

      // 可选：发送警报通知
      // await notifyUpdateFailure(error);

      // 重新抛出错误，让Cloudflare记录失败
      throw error;
    }
  }
};

/**
 * 可选：成功通知函数
 * 可以发送到webhook、邮件或其他监控系统
 */
async function notifyUpdateSuccess(result: any): Promise<void> {
  // 这里可以集成Slack、企业微信、邮件等通知方式
  console.log('📈 融资数据更新通知:', {
    timestamp: new Date().toISOString(),
    count: result.count,
    source: result.source,
    status: 'success'
  });
}

/**
 * 可选：失败通知函数
 */
async function notifyUpdateFailure(error: any): Promise<void> {
  // 这里可以集成警报系统
  console.error('🚨 融资数据更新失败通知:', {
    timestamp: new Date().toISOString(),
    error: String(error),
    status: 'failed'
  });
}