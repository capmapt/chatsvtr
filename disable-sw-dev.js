// 在开发环境禁用Service Worker的脚本
console.log('🔧 开发环境Service Worker禁用工具');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('注销Service Worker:', registration.scope);
      registration.unregister();
    });
  });
  
  // 清除所有缓存
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('删除缓存:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(() => {
    console.log('✅ 所有Service Worker缓存已清除');
    console.log('🔄 请刷新页面以继续测试');
  });
}

// 提供在控制台执行的指令
console.log('\n如果仍有问题，请在控制台执行:');
console.log('window.location.reload(true);');