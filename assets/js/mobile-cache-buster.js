// 移动端缓存强制清除脚本 - 版本: 20250923-070227
(function() {
  'use strict';

  // 检查是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    console.log('📱 移动端缓存清除激活 - v20250923-070227');

    // 强制清除所有类型的缓存
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(registration) {
          registration.unregister();
        });
      });
    }

    // 清除localStorage和sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e) {
      console.warn('存储清除失败:', e);
    }

    // 强制刷新所有资源
    const resources = document.querySelectorAll('link[rel="stylesheet"], script[src]');
    resources.forEach(function(resource) {
      if (resource.tagName === 'LINK') {
        const href = resource.href;
        if (href && !href.includes('v=20250923-070227')) {
          resource.href = href + (href.includes('?') ? '&' : '?') + 'v=20250923-070227&t=' + Date.now();
        }
      } else if (resource.tagName === 'SCRIPT' && resource.src) {
        const src = resource.src;
        if (src && !src.includes('v=20250923-070227')) {
          resource.src = src + (src.includes('?') ? '&' : '?') + 'v=20250923-070227&t=' + Date.now();
        }
      }
    });

    // 显示版本信息
    console.log('%c📱 移动端资源已更新到最新版本: 20250923-070227', 'color: #4CAF50; font-weight: bold;');
  }
})();