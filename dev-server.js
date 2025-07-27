/**
 * SVTR.AI 本地开发服务器
 * 解决Cloudflare环境复杂性，提供简化的开发体验
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 配置
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

// 模拟AI响应的数据
const mockAIResponses = {
  'cloudflare': {
    available: Math.random() > 0.3, // 70%可用率，模拟不稳定
    responses: [
      "基于SVTR.AI最新数据，AI创投市场呈现强劲增长态势...",
      "根据我们的数据库，目前追踪10,761+家全球AI公司...",
      "SVTR平台显示，投资人网络已达121,884+专业人士..."
    ]
  },
  'demo': {
    available: true, // 演示模式总是可用
    responses: [
      "演示模式：SVTR.AI平台数据显示，AI创投领域正经历快速发展...",
      "基于飞书知识库：硅谷科技评论追踪全球AI公司超过10,000家...",
      "真实数据演示：我们的投资人网络覆盖121,884+专业人士..."
    ]
  }
};

// 日志函数
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // 青色
    success: '\x1b[32m', // 绿色
    warning: '\x1b[33m', // 黄色
    error: '\x1b[31m',   // 红色
  };
  const color = colors[type] || colors.info;
  console.log(`${color}[${timestamp}] ${message}\x1b[0m`);
}

// 获取文件内容
function getFile(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    return null;
  }
}

// 处理API请求
async function handleAPIRequest(req, res, pathname) {
  if (pathname === '/api/chat' && req.method === 'POST') {
    log('收到聊天API请求', 'info');
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const messages = data.messages || [];
        const userMessage = messages[messages.length - 1]?.content || '';
        
        log(`用户消息: ${userMessage.substring(0, 50)}...`, 'info');
        
        // 设置SSE响应头
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        });
        
        // 模拟AI服务选择
        const useCloudflare = mockAIResponses.cloudflare.available && Math.random() > 0.2;
        const provider = useCloudflare ? 'cloudflare' : 'demo';
        const responses = mockAIResponses[provider].responses;
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        log(`使用 ${provider} 提供商`, useCloudflare ? 'success' : 'warning');
        
        // 模拟流式响应
        const words = response.split(' ');
        let index = 0;
        
        const sendChunk = () => {
          if (index < words.length) {
            const content = words[index] + ' ';
            const chunk = JSON.stringify({ response: content });
            res.write(`data: ${chunk}\n\n`);
            index++;
            
            // 模拟网络延迟
            const delay = useCloudflare ? 50 + Math.random() * 100 : 30;
            setTimeout(sendChunk, delay);
          } else {
            // 添加RAG源信息（如果是demo模式）
            if (provider === 'demo') {
              const sourceInfo = '\n\n---\n**📚 基于SVTR知识库** (1个匹配):\n1. 硅谷科技评论（SVTR.AI）官方数据';
              const sourceChunk = JSON.stringify({ response: sourceInfo });
              res.write(`data: ${sourceChunk}\n\n`);
            }
            
            res.write('data: [DONE]\n\n');
            res.end();
            log('AI响应完成', 'success');
          }
        };
        
        // 开始发送响应
        setTimeout(sendChunk, 500);
        
      } catch (error) {
        log(`API错误: ${error.message}`, 'error');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'AI服务暂时不可用',
          message: '正在使用演示模式',
          fallback: true
        }));
      }
    });
    
    return true;
  }
  
  return false;
}

// 处理静态文件
function handleStaticFile(req, res, pathname) {
  // 默认文件
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  const filePath = path.join(__dirname, pathname);
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  const content = getFile(filePath);
  
  if (content) {
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
    log(`服务文件: ${pathname}`, 'success');
    return true;
  }
  
  return false;
}

// 创建服务器
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end();
    return;
  }
  
  // 处理API请求
  if (await handleAPIRequest(req, res, pathname)) {
    return;
  }
  
  // 处理静态文件
  if (handleStaticFile(req, res, pathname)) {
    return;
  }
  
  // 404处理
  log(`文件未找到: ${pathname}`, 'warning');
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head><title>404 - 文件未找到</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
        <h1>🚫 文件未找到</h1>
        <p>请求的文件 <code>${pathname}</code> 不存在。</p>
        <p><a href="/">返回首页</a> | <a href="/chatbot-live-demo.html">体验Chatbot</a></p>
      </body>
    </html>
  `);
});

// 启动服务器
server.listen(PORT, HOST, () => {
  log(`🚀 SVTR.AI 开发服务器已启动`, 'success');
  log(`📍 地址: http://${HOST}:${PORT}`, 'info');
  log(`💬 Chatbot演示: http://${HOST}:${PORT}/chatbot-live-demo.html`, 'info');
  log(`🎯 主页: http://${HOST}:${PORT}/`, 'info');
  log(`🔧 支持热重载，修改文件后自动更新`, 'info');
  log(`⚡ 模拟AI服务状态 - Cloudflare: ${mockAIResponses.cloudflare.available ? '可用' : '不可用'}`, 
      mockAIResponses.cloudflare.available ? 'success' : 'warning');
});

// 优雅关闭
process.on('SIGINT', () => {
  log('正在关闭服务器...', 'warning');
  server.close(() => {
    log('服务器已关闭', 'info');
    process.exit(0);
  });
});

// 错误处理
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    log(`端口 ${PORT} 已被占用，请尝试其他端口`, 'error');
    log(`使用方法: PORT=3001 node dev-server.js`, 'info');
  } else {
    log(`服务器错误: ${error.message}`, 'error');
  }
  process.exit(1);
});

// 导出服务器（用于测试）
module.exports = server;