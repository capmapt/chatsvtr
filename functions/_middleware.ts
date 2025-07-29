/**
 * Cloudflare Pages 中间件
 * 设置安全头和性能优化
 */

interface Env {
  // 环境变量类型定义
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next();
  const url = new URL(context.request.url);
  
  // 创建新的响应对象以添加头部
  const newResponse = new Response(response.body, response);
  
  // 基础安全头
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  };
  
  // 仅在HTTPS下设置HSTS
  if (url.protocol === 'https:') {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  
  // CSP策略
  const cspPolicy = [
    "default-src 'self' https:",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://c0uiiy15npu.feishu.cn https://static.cloudflareinsights.com https://*.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: https://cloudflareinsights.com https://*.cloudflareinsights.com",
    "frame-src 'self' https://c0uiiy15npu.feishu.cn",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
  
  securityHeaders['Content-Security-Policy'] = cspPolicy;
  
  // 缓存策略
  const pathname = url.pathname;
  
  if (pathname.startsWith('/assets/')) {
    // 静态资源：长期缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.endsWith('.html') || pathname === '/') {
    // HTML文件：短期缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  } else if (pathname === '/sw.js') {
    // Service Worker：不缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  } else if (pathname.startsWith('/api/')) {
    // API：不缓存
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    newResponse.headers.set('Pragma', 'no-cache');
  }
  
  // 应用所有安全头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  
  // 性能优化头
  if (context.request.headers.get('Accept-Encoding')?.includes('gzip')) {
    newResponse.headers.set('Content-Encoding', 'gzip');
  }
  
  // CORS头（如果需要）
  if (pathname.startsWith('/api/')) {
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return newResponse;
};