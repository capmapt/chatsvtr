/**
 * SVTR.AI Service Worker
 * 智能缓存策略，提升性能和离线体验
 */

const CACHE_NAME = 'svtr-ai-v1.2.0';
const STATIC_CACHE = 'svtr-static-v1.2.0';
const DYNAMIC_CACHE = 'svtr-dynamic-v1.2.0';
const API_CACHE = 'svtr-api-v1.2.0';

// 需要预缓存的核心资源（包含AVIF支持）
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/style-optimized.css',
  '/assets/css/sidebar-optimized.css',
  '/assets/css/chat-optimized.css',
  '/assets/js/main-optimized.js',
  '/assets/js/chat-optimized.js',
  '/assets/js/i18n-optimized.js',
  '/assets/js/translations.js',
  '/assets/js/sidebar-qr-manager-optimized.js',
  '/assets/images/logo.avif',
  '/assets/images/logo.webp',
  '/assets/images/logo.jpg',
  '/assets/images/banner.avif',
  '/assets/images/banner.webp',
  '/assets/images/qr-code.avif',
  '/assets/images/qr-code.webp',
  '/assets/images/qr-code.jpg',
  '/assets/images/discord-qr-code.avif',
  '/assets/images/discord-qr-code.webp',
  '/assets/images/discord-qr-code.png'
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先
  static: {
    patterns: [
      /\.(?:js|css|jpg|jpeg|png|webp|avif|svg|woff2|woff|ttf)$/,
      /\/assets\//
    ],
    strategy: 'cacheFirst',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30天
  },
  
  // HTML页面：网络优先，缓存备用
  pages: {
    patterns: [
      /\.html$/,
      /\/$/,
      /\/pages\//
    ],
    strategy: 'networkFirst',
    maxAge: 24 * 60 * 60 * 1000 // 1天
  },
  
  // API请求：网络优先，短期缓存
  api: {
    patterns: [
      /\/api\//,
      /\/functions\//
    ],
    strategy: 'networkFirst',
    maxAge: 5 * 60 * 1000 // 5分钟
  },
  
  // 外部资源：缓存优先
  external: {
    patterns: [
      /^https:\/\/fonts\./,
      /^https:\/\/cdn\./,
      /^https:\/\/.*\.googleapis\.com/
    ],
    strategy: 'cacheFirst',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
  }
};

// Service Worker安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] 预缓存核心资源');
        return cache.addAll(CORE_ASSETS.map(url => new Request(url, {cache: 'no-cache'})));
      })
      .then(() => {
        console.log('[SW] 核心资源缓存完成');
        return self.skipWaiting(); // 立即激活新的SW
      })
      .catch((error) => {
        console.error('[SW] 预缓存失败:', error);
      })
  );
});

// Service Worker激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  );
});

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过non-GET请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // 确定缓存策略
  const strategy = determineStrategy(request.url);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] 请求处理失败:', error);
        return fetch(request);
      })
  );
});

// 确定请求的缓存策略
function determineStrategy(url) {
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    for (const pattern of config.patterns) {
      if (pattern.test(url)) {
        return { name, ...config };
      }
    }
  }
  
  // 默认策略：网络优先
  return {
    name: 'default',
    strategy: 'networkFirst',
    maxAge: 60 * 60 * 1000 // 1小时
  };
}

// 处理请求的核心逻辑
async function handleRequest(request, strategy) {
  switch (strategy.strategy) {
    case 'cacheFirst':
      return cacheFirst(request, strategy);
    case 'networkFirst':
      return networkFirst(request, strategy);
    case 'staleWhileRevalidate':
      return staleWhileRevalidate(request, strategy);
    default:
      return networkFirst(request, strategy);
  }
}

// 缓存优先策略
async function cacheFirst(request, strategy) {
  const cacheName = getCacheName(strategy.name);
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      // 添加时间戳
      const response = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          'sw-cache-time': Date.now().toString()
        }
      });
      
      cache.put(request, response);
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败，返回缓存（如果有）
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 网络优先策略
async function networkFirst(request, strategy) {
  const cacheName = getCacheName(strategy.name);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      
      // 添加时间戳并缓存
      const response = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers.entries()),
          'sw-cache-time': Date.now().toString()
        }
      });
      
      cache.put(request, response);
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果是页面请求且无缓存，返回离线页面
    if (request.destination === 'document') {
      return createOfflinePage();
    }
    
    throw error;
  }
}

// 陈旧内容重新验证策略
async function staleWhileRevalidate(request, strategy) {
  const cacheName = getCacheName(strategy.name);
  const cachedResponse = await caches.match(request);
  
  // 异步更新缓存
  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(cacheName);
      cache.then((c) => {
        const responseToCache = networkResponse.clone();
        const response = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: {
            ...Object.fromEntries(responseToCache.headers.entries()),
            'sw-cache-time': Date.now().toString()
          }
        });
        c.put(request, response);
      });
    }
    return networkResponse;
  });
  
  // 立即返回缓存，如果有的话
  return cachedResponse || networkPromise;
}

// 获取对应的缓存名称
function getCacheName(strategyName) {
  switch (strategyName) {
    case 'static':
    case 'external':
      return STATIC_CACHE;
    case 'api':
      return API_CACHE;
    default:
      return DYNAMIC_CACHE;
  }
}

// 检查缓存是否过期
function isExpired(response, maxAge) {
  const cacheTime = response.headers.get('sw-cache-time');
  if (!cacheTime) return false;
  
  const age = Date.now() - parseInt(cacheTime);
  return age > maxAge;
}

// 创建离线页面
function createOfflinePage() {
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>离线模式 - SVTR.AI</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center;
          padding: 50px 20px;
          background: #f8f9fa;
        }
        .offline-content {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 16px;
        }
        p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .retry-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }
        .retry-btn:hover {
          background: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="offline-content">
        <div class="offline-icon">📡</div>
        <h1>当前处于离线状态</h1>
        <p>网络连接已断开，部分功能可能不可用。请检查网络连接后重试。</p>
        <button class="retry-btn" onclick="window.location.reload()">重新加载</button>
      </div>
      
      <script>
        // 监听网络状态变化
        window.addEventListener('online', () => {
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `;
  
  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// 处理错误和离线状态
self.addEventListener('error', (event) => {
  console.error('[SW] 错误:', event.error);
});

// 监听消息（用于缓存管理）
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then((info) => {
        event.ports[0].postMessage({ type: 'CACHE_INFO', payload: info });
      });
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
  }
});

// 获取缓存信息
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    info[cacheName] = {
      size: requests.length,
      requests: requests.map(req => req.url)
    };
  }
  
  return info;
}

// 清理指定缓存
async function clearCache(cacheName) {
  if (cacheName) {
    return caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    return Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

console.log('[SW] Service Worker已加载');