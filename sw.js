/**
 * SVTR.AI Service Worker
 * 提供缓存管理和离线支持
 */

const CACHE_NAME = 'svtr-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/css/style-optimized.css',
  '/assets/css/chat-optimized.css',
  '/assets/js/security-utils.js',
  '/assets/js/image-optimizer.js',
  '/assets/js/cache-manager.js',
  '/assets/js/ux-enhancer.js',
  '/assets/js/translations.js',
  '/assets/js/i18n-optimized.js',
  '/assets/js/main-optimized.js',
  '/assets/js/chat-optimized.js',
  '/assets/images/logo.webp',
  '/assets/images/logo.jpg',
  '/assets/images/qr-code.webp',
  '/assets/images/qr-code.jpg'
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('预缓存静态资源');
        return cache.addAll(STATIC_ASSETS.filter(url => url !== '/'));
      })
      .catch((error) => {
        console.log('预缓存失败，继续安装:', error);
      })
  );
  
  // 强制激活新的Service Worker
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活中...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 立即控制所有客户端
  self.clients.claim();
});

// 网络请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // API请求：网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功的API响应不缓存（数据实时性）
          return response;
        })
        .catch(() => {
          // API请求失败时返回离线响应
          return new Response(
            JSON.stringify({
              error: '网络连接失败，请检查网络后重试',
              offline: true
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // 静态资源：缓存优先策略
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // 有缓存，在后台更新
            fetch(request)
              .then((response) => {
                if (response.status === 200) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => {
                      cache.put(request, responseClone);
                    });
                }
              })
              .catch(() => {
                // 后台更新失败，忽略
              });
            
            return cachedResponse;
          }
          
          // 无缓存，发起网络请求
          return fetch(request)
            .then((response) => {
              if (response.status === 200 && isStaticAsset(request.url)) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // 网络请求失败，返回离线页面
              if (request.destination === 'document') {
                return caches.match('/index.html')
                  .then((response) => response || createOfflinePage());
              }
              
              // 其他资源失败
              throw new Error('网络不可用');
            });
        })
    );
  }
});

// 判断是否为静态资源
function isStaticAsset(url) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'];
  return staticExtensions.some(ext => url.includes(ext));
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

// 消息处理
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      caches.keys().then((cacheNames) => {
        event.ports[0].postMessage({
          caches: cacheNames,
          currentCache: CACHE_NAME
        });
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});