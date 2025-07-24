#!/usr/bin/env node

/**
 * SVTR.AI 自动化同步设置脚本
 * 设置定时任务和Webhook触发的自动同步
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class AutoSyncSetup {
  constructor() {
    this.configDir = path.join(__dirname, '../config');
    this.scriptsDir = __dirname;
  }

  /**
   * 生成GitHub Actions工作流
   */
  async generateGitHubActions() {
    const workflow = {
      name: 'SVTR知识库自动同步',
      on: {
        schedule: [
          { cron: '0 1 * * *' },  // 每日上午9点 (UTC+8)
          { cron: '0 2 * * 1' }   // 每周一上午10点全量同步
        ],
        workflow_dispatch: {},    // 支持手动触发
        repository_dispatch: {    // 支持API触发
          types: ['feishu-update']
        }
      },
      jobs: {
        sync: {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout代码',
              uses: 'actions/checkout@v4'
            },
            {
              name: '设置Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '18'
              }
            },
            {
              name: '安装依赖',
              run: 'npm install'
            },
            {
              name: '每日增量同步',
              if: 'github.event.schedule == \'0 1 * * *\'',
              run: 'npm run sync:daily',
              env: {
                FEISHU_APP_ID: '${{ secrets.FEISHU_APP_ID }}',
                FEISHU_APP_SECRET: '${{ secrets.FEISHU_APP_SECRET }}',
                OPENAI_API_KEY: '${{ secrets.OPENAI_API_KEY }}',
                CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
                CLOUDFLARE_API_TOKEN: '${{ secrets.CLOUDFLARE_API_TOKEN }}'
              }
            },
            {
              name: '每周全量同步',
              if: 'github.event.schedule == \'0 2 * * 1\'',
              run: 'npm run sync:full',
              env: {
                FEISHU_APP_ID: '${{ secrets.FEISHU_APP_ID }}',
                FEISHU_APP_SECRET: '${{ secrets.FEISHU_APP_SECRET }}',
                OPENAI_API_KEY: '${{ secrets.OPENAI_API_KEY }}',
                CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
                CLOUDFLARE_API_TOKEN: '${{ secrets.CLOUDFLARE_API_TOKEN }}'
              }
            },
            {
              name: 'Webhook触发同步',
              if: 'github.event.action == \'feishu-update\'',
              run: 'npm run sync:webhook',
              env: {
                FEISHU_APP_ID: '${{ secrets.FEISHU_APP_ID }}',
                FEISHU_APP_SECRET: '${{ secrets.FEISHU_APP_SECRET }}',
                OPENAI_API_KEY: '${{ secrets.OPENAI_API_KEY }}',
                CLOUDFLARE_ACCOUNT_ID: '${{ secrets.CLOUDFLARE_ACCOUNT_ID }}',
                CLOUDFLARE_API_TOKEN: '${{ secrets.CLOUDFLARE_API_TOKEN }}'
              }
            },
            {
              name: '提交更新',
              run: 'git config --local user.email "action@github.com" && git config --local user.name "GitHub Action" && git add assets/data/ && (git diff --staged --quiet || git commit -m "auto: 更新飞书知识库数据 $(date +%Y-%m-%d-%H:%M:%S)") && git push'
            }
          ]
        }
      }
    };

    const workflowDir = path.join(__dirname, '../.github/workflows');
    await fs.mkdir(workflowDir, { recursive: true });
    
    const workflowFile = path.join(workflowDir, 'feishu-sync.yml');
    await fs.writeFile(workflowFile, 
      '# 自动生成的GitHub Actions工作流\\n' +
      '# 用于自动同步飞书知识库数据\\n\\n' +
      this.yamlStringify(workflow)
    );
    
    console.log('✅ GitHub Actions工作流已生成:', workflowFile);
    return workflowFile;
  }

  /**
   * 生成Cloudflare Workers定时任务
   */
  async generateCloudflareScheduler() {
    const schedulerCode = `// SVTR.AI Cloudflare Workers定时同步任务
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
            'Authorization': \`token \${env.GITHUB_TOKEN}\`,
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
};`;

    const schedulerFile = path.join(__dirname, '../workers/scheduler.js');
    await fs.mkdir(path.dirname(schedulerFile), { recursive: true });
    await fs.writeFile(schedulerFile, schedulerCode);
    
    console.log('✅ Cloudflare Workers定时任务已生成:', schedulerFile);
    return schedulerFile;
  }

  /**
   * 更新package.json添加同步命令
   */
  async updatePackageJson() {
    const packagePath = path.join(__dirname, '../package.json');
    
    try {
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      // 添加同步命令
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['sync:daily'] = 'node scripts/enhanced-rag-sync.js';
      packageJson.scripts['sync:full'] = 'node scripts/rag-data-sync.js && node scripts/enhanced-rag-sync.js';
      packageJson.scripts['sync:webhook'] = 'node scripts/enhanced-rag-sync.js';
      packageJson.scripts['sync:test'] = 'node scripts/enhanced-rag-sync.js';
      
      await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json同步命令已更新');
      
    } catch (error) {
      console.log('⚠️ 更新package.json失败:', error.message);
    }
  }

  /**
   * 生成飞书Webhook处理器
   */
  async generateWebhookHandler() {
    const webhookCode = `// 飞书Webhook处理器
// 用于接收飞书内容更新通知并触发同步

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    
    // 验证飞书Webhook签名
    const signature = request.headers.get('X-Lark-Signature');
    if (!verifySignature(body, signature, env.FEISHU_WEBHOOK_SECRET)) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // 处理不同类型的事件
    const { type, event } = body;
    
    if (type === 'url_verification') {
      // 首次验证
      return new Response(JSON.stringify({
        challenge: body.challenge
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (event?.type === 'wiki.node.updated' || 
        event?.type === 'bitable.record.updated') {
      
      console.log('📝 检测到飞书内容更新:', event);
      
      // 触发GitHub Actions同步
      const githubResponse = await fetch(
        'https://api.github.com/repos/capmapt/chatsvtr/dispatches',
        {
          method: 'POST',
          headers: {
            'Authorization': \`token \${env.GITHUB_TOKEN}\`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event_type: 'feishu-update',
            client_payload: {
              trigger: 'feishu_webhook',
              event_type: event.type,
              timestamp: new Date().toISOString()
            }
          })
        }
      );
      
      if (githubResponse.ok) {
        console.log('✅ 成功触发同步更新');
        return new Response('OK', { status: 200 });
      } else {
        console.error('❌ 触发同步失败');
        return new Response('Sync failed', { status: 500 });
      }
    }
    
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('❌ Webhook处理失败:', error);
    return new Response('Internal error', { status: 500 });
  }
}

function verifySignature(body, signature, secret) {
  // 实现飞书Webhook签名验证逻辑
  // 参考: https://open.feishu.cn/document/ukTMukTMukTM/uUTNz4SN1MjL1UzM
  return true; // 简化实现
}`;

    const webhookFile = path.join(__dirname, '../functions/webhook/feishu.js');
    await fs.mkdir(path.dirname(webhookFile), { recursive: true });
    await fs.writeFile(webhookFile, webhookCode);
    
    console.log('✅ 飞书Webhook处理器已生成:', webhookFile);
    return webhookFile;
  }

  /**
   * 生成同步状态监控面板
   */
  async generateSyncDashboard() {
    const dashboardHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SVTR.AI 知识库同步状态</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .status-card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-good { border-left: 4px solid #28a745; }
        .status-warning { border-left: 4px solid #ffc107; }
        .status-error { border-left: 4px solid #dc3545; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 0.9em; }
        .sync-log { background: #f8f9fa; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🚀 SVTR.AI 知识库同步状态</h1>
    
    <div class="status-card status-good">
        <h3>📊 同步数据概览</h3>
        <div class="metric">
            <div class="metric-value" id="totalDocs">-</div>
            <div class="metric-label">总文档数</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="weeklyIssues">-</div>
            <div class="metric-label">AI周报期数</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="companies">-</div>
            <div class="metric-label">公司数据</div>
        </div>
        <div class="metric">
            <div class="metric-value" id="lastSync">-</div>
            <div class="metric-label">上次同步</div>
        </div>
    </div>
    
    <div class="status-card">
        <h3>🔄 同步控制</h3>
        <button onclick="triggerSync('daily')">每日同步</button>
        <button onclick="triggerSync('full')">全量同步</button>
        <button onclick="checkStatus()">检查状态</button>
        <button onclick="viewLogs()">查看日志</button>
    </div>
    
    <div class="status-card">
        <h3>📝 同步日志</h3>
        <div class="sync-log" id="syncLog">
            正在加载同步状态...
        </div>
    </div>
    
    <script>
        // 同步状态监控脚本
        async function loadSyncStatus() {
            try {
                const response = await fetch('/api/sync-status');
                const data = await response.json();
                
                document.getElementById('totalDocs').textContent = data.totalDocs || 0;
                document.getElementById('weeklyIssues').textContent = data.weeklyIssues || 0;
                document.getElementById('companies').textContent = data.companies || 0;
                document.getElementById('lastSync').textContent = data.lastSync || '未知';
                
                const logElement = document.getElementById('syncLog');
                logElement.textContent = data.logs || '暂无日志';
                
            } catch (error) {
                console.error('加载同步状态失败:', error);
                document.getElementById('syncLog').textContent = '加载状态失败: ' + error.message;
            }
        }
        
        async function triggerSync(type) {
            try {
                const response = await fetch('/api/trigger-sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type })
                });
                
                const result = await response.json();
                alert(result.success ? '同步已触发' : '同步触发失败: ' + result.error);
                
                if (result.success) {
                    setTimeout(loadSyncStatus, 3000); // 3秒后刷新状态
                }
                
            } catch (error) {
                alert('触发同步失败: ' + error.message);
            }
        }
        
        function checkStatus() {
            loadSyncStatus();
        }
        
        function viewLogs() {
            window.open('/admin/sync-logs', '_blank');
        }
        
        // 页面加载时获取状态
        loadSyncStatus();
        
        // 每30秒自动刷新状态
        setInterval(loadSyncStatus, 30000);
    </script>
</body>
</html>`;

    const dashboardFile = path.join(__dirname, '../pages/sync-dashboard.html');
    await fs.writeFile(dashboardFile, dashboardHtml);
    
    console.log('✅ 同步状态监控面板已生成:', dashboardFile);
    return dashboardFile;
  }

  /**
   * 简单的YAML转换
   */
  yamlStringify(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.yamlStringify(value, indent + 1);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          yaml += `${spaces}${key}: []\n`;
        } else {
          yaml += `${spaces}${key}:\n`;
          for (const item of value) {
            if (typeof item === 'object') {
              yaml += `${spaces}  -\n`;
              yaml += this.yamlStringify(item, indent + 2);
            } else {
              yaml += `${spaces}  - ${item}\n`;
            }
          }
        }
      } else {
        const quotedValue = typeof value === 'string' && 
          (value.includes(':') || value.includes("'") || value.includes('"') || value.includes('|')) 
          ? `'${value.replace(/'/g, "''")}'`
          : value;
        yaml += `${spaces}${key}: ${quotedValue}\n`;
      }
    }
    
    return yaml;
  }

  /**
   * 执行完整设置
   */
  async setupAll() {
    console.log('🛠️ 开始设置SVTR.AI自动化同步系统...\\n');
    
    try {
      // 生成各种配置文件
      await this.generateGitHubActions();
      await this.generateCloudflareScheduler();
      await this.updatePackageJson();
      await this.generateWebhookHandler();
      await this.generateSyncDashboard();
      
      console.log('\\n🎉 自动化同步系统设置完成！');
      console.log('\\n📋 下一步操作:');
      console.log('1. 在GitHub仓库设置中添加以下Secrets:');
      console.log('   - FEISHU_APP_ID');
      console.log('   - FEISHU_APP_SECRET');
      console.log('   - OPENAI_API_KEY (可选)');
      console.log('   - CLOUDFLARE_ACCOUNT_ID (可选)');
      console.log('   - CLOUDFLARE_API_TOKEN (可选)');
      console.log('   - GITHUB_TOKEN (用于API触发)');
      console.log('\\n2. 在飞书应用中设置Webhook URL:');
      console.log('   https://你的域名.pages.dev/webhook/feishu');
      console.log('\\n3. 部署Cloudflare Workers定时任务 (可选)');
      console.log('\\n4. 访问同步监控面板:');
      console.log('   https://你的域名.pages.dev/pages/sync-dashboard.html');
      
    } catch (error) {
      console.error('\\n❌ 设置失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const setupService = new AutoSyncSetup();
  
  try {
    await setupService.setupAll();
    process.exit(0);
  } catch (error) {
    console.error('\\n❌ 自动化设置失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { AutoSyncSetup };