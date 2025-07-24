// SVTR.AI Cloudflare Workers定时同步任务
// 部署到Cloudflare Workers，设置Cron触发器

export default {
  async scheduled(event, env, ctx) {
    console.log('🕐 开始定时同步任务:', new Date().toISOString());
    
    try {
      // 触发GitHub Actions同步
      const githubResponse = await fetch(
        'https://api.github.com/repos/capmapt/chatsvtr/dispatches',
        {
          method: 'POST',
          headers: {
            'Authorization': `token ${env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'feishu-update',
            client_payload: {
              trigger: 'scheduled',
              timestamp: new Date().toISOString()
            }
          })
        }
      );
      
      if (githubResponse.ok) {
        console.log('✅ 成功触发GitHub Actions同步');
      } else {
        console.error('❌ 触发GitHub Actions失败:', await githubResponse.text());
      }
      
    } catch (error) {
      console.error('❌ 定时同步任务失败:', error.message);
    }
  }
};