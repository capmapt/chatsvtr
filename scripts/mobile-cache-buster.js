#!/usr/bin/env node

/**
 * 移动端缓存清除工具
 * 自动给所有CSS/JS文件添加版本参数，强制移动端浏览器更新
 */

const fs = require('fs');
const path = require('path');

class MobileCacheBuster {
  constructor() {
    this.version = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-');
    this.processed = 0;
  }

  /**
   * 执行缓存清除
   */
  async execute() {
    console.log('📱 移动端缓存清除工具');
    console.log(`🏷️ 版本号: ${this.version}\n`);

    try {
      // 1. 更新HTML文件中的资源版本
      await this.updateHTMLFiles();

      // 2. 更新页面版本meta标签
      await this.updatePageVersion();

      // 3. 创建移动端专用脚本
      await this.createMobileCacheScript();

      console.log(`\n✅ 缓存清除完成！共处理 ${this.processed} 个文件`);
      console.log('📱 移动端访问时将强制刷新所有资源');

    } catch (error) {
      console.error('❌ 缓存清除失败:', error.message);
      process.exit(1);
    }
  }

  /**
   * 更新HTML文件中的资源版本
   */
  async updateHTMLFiles() {
    const htmlFiles = ['index.html', 'pages/ai-100.html', 'pages/stats-widget.html'];

    for (const htmlFile of htmlFiles) {
      if (fs.existsSync(htmlFile)) {
        console.log(`🔄 更新 ${htmlFile}...`);

        let content = fs.readFileSync(htmlFile, 'utf8');

        // 移除旧的版本参数
        content = content.replace(/(\.css|\.js)\?v=[^"'\s>]+/g, '$1');

        // 添加新的版本参数
        content = content.replace(
          /(assets\/(?:css|js)\/[^"'\s>]+\.(?:css|js))/g,
          `$1?v=${this.version}`
        );

        fs.writeFileSync(htmlFile, content, 'utf8');
        this.processed++;
      }
    }
  }

  /**
   * 更新页面版本meta标签
   */
  async updatePageVersion() {
    const indexPath = 'index.html';
    if (fs.existsSync(indexPath)) {
      console.log('🏷️ 更新页面版本标签...');

      let content = fs.readFileSync(indexPath, 'utf8');

      // 更新版本meta标签
      content = content.replace(
        /<meta name="version" content="[^"]*"/,
        `<meta name="version" content="${this.version}"`
      );

      fs.writeFileSync(indexPath, content, 'utf8');
    }
  }

  /**
   * 创建移动端缓存清除脚本
   */
  async createMobileCacheScript() {
    console.log('📝 创建移动端缓存清除脚本...');

    const mobileScript = `
// 移动端缓存强制清除脚本 - 版本: ${this.version}
(function() {
  'use strict';

  // 检查是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    console.log('📱 移动端缓存清除激活 - v${this.version}');

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
        if (href && !href.includes('v=${this.version}')) {
          resource.href = href + (href.includes('?') ? '&' : '?') + 'v=${this.version}&t=' + Date.now();
        }
      } else if (resource.tagName === 'SCRIPT' && resource.src) {
        const src = resource.src;
        if (src && !src.includes('v=${this.version}')) {
          resource.src = src + (src.includes('?') ? '&' : '?') + 'v=${this.version}&t=' + Date.now();
        }
      }
    });

    // 显示版本信息
    console.log('%c📱 移动端资源已更新到最新版本: ${this.version}', 'color: #4CAF50; font-weight: bold;');
  }
})();
`;

    fs.writeFileSync('assets/js/mobile-cache-buster.js', mobileScript.trim(), 'utf8');
    this.processed++;
  }
}

// 主执行
if (require.main === module) {
  const buster = new MobileCacheBuster();

  buster.execute()
    .then(() => {
      console.log('\\n🎉 移动端缓存清除工具执行完成！');
      console.log('\\n📱 建议用户操作:');
      console.log('1. 强制刷新页面 (Ctrl+F5 或 Cmd+Shift+R)');
      console.log('2. 清除浏览器缓存');
      console.log('3. iOS Safari: 设置 > Safari > 清除历史记录与网站数据');
      console.log('4. Android Chrome: 设置 > 隐私设置 > 清除浏览数据');
    })
    .catch((error) => {
      console.error('\\n❌ 执行失败:', error.message);
      process.exit(1);
    });
}

module.exports = MobileCacheBuster;