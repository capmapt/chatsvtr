#!/usr/bin/env node

/**
 * 提取Critical CSS并内联到HTML中
 * 提升首屏渲染性能
 */

const fs = require('fs');
const path = require('path');

// 关键CSS选择器 - 首屏可见元素
const criticalSelectors = [
  // 基础重置和变量
  '*,::after,::before',
  ':root',
  'html',
  'body',
  
  // 首屏布局
  'header',
  '.banner-header',
  '.banner-content',
  '.banner-logo',
  '.banner-text',
  '.banner-title',
  '.banner-tagline',
  '.business-tags',
  '.business-tag',
  
  // 导航和侧边栏（关键部分）
  '.menu-toggle',
  '.lang-toggle',
  '.sidebar',
  '.overlay',
  
  // 包装器
  '.wrapper',
  '.content',
  
  // 移动端关键断点
  '@media (max-width:768px)',
  '@media (max-width:480px)',
  
  // 关键动画
  '@keyframes banner-slide-in',
  '@keyframes fade-in-up'
];

function extractCriticalCSS() {
  try {
    const cssPath = path.join(__dirname, '../assets/css/style-optimized.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // 提取关键CSS规则
    let criticalCSS = '';
    
    // 添加CSS变量和基础样式
    criticalCSS += `*,::after,::before{box-sizing:border-box}`;
    criticalCSS += `:root{--primary-color:#FA8C32;--secondary-color:#FFBB33;--accent-color:#FFD600;--bg-main:linear-gradient(135deg, #fff8e1, #ffe0b2);--bg-panel:#FFF;--text-primary:#000;--text-secondary:#666;--text-link:#0066cc;--text-link-hover:#004499;--border-color:rgba(0,0,0,0.1);--shadow-light:0 4px 12px rgba(0,0,0,0.1);--transition-fast:0.3s;--border-radius:6px;--border-radius-large:12px}`;
    criticalCSS += `html{scroll-behavior:smooth}`;
    criticalCSS += `body{margin:0;padding:0;min-height:100vh;background:var(--bg-main);font-family:"Helvetica Neue",Arial,sans-serif;overflow-x:hidden}`;
    
    // 首屏布局关键样式
    criticalCSS += `header{position:relative;width:100%;z-index:1200}`;
    criticalCSS += `.banner-header{width:100%;aspect-ratio:4/1;background:#ffe0b2;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;border-bottom:3px solid var(--primary-color)}`;
    criticalCSS += `.banner-content{display:flex;align-items:center;justify-content:center;gap:40px;max-width:1000px;width:100%;height:100%}`;
    criticalCSS += `.banner-logo{position:relative;width:120px;height:120px;flex-shrink:0;display:flex;align-items:center;justify-content:center}`;
    criticalCSS += `.banner-logo img{width:100px;height:100px;border-radius:50%;object-fit:cover;box-shadow:0 4px 20px rgba(250,140,50,.4),0 2px 10px rgba(0,0,0,.1);border:3px solid rgba(255,255,255,.8)}`;
    criticalCSS += `.banner-title{font-size:3rem;font-weight:700;margin:0 0 12px;line-height:1.3;color:#000;text-shadow:1px 1px 2px rgba(255,255,255,.8)}`;
    criticalCSS += `.banner-tagline{font-size:1.4rem;font-weight:400;line-height:1.4;color:#4a3429;text-shadow:1px 1px 2px rgba(255,255,255,.7);margin:0;letter-spacing:.5px;display:flex;align-items:center;gap:20px;justify-content:center}`;
    
    // 业务标签关键样式
    criticalCSS += `.business-tags{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px auto 10px;width:calc(100% - 40px);max-width:760px;padding:0 20px;justify-items:center}`;
    criticalCSS += `.business-tag{font-size:1.5rem;font-weight:800;padding:18px 44px;border-radius:32px;background:linear-gradient(90deg,#fff176 10%,#ffa726 90%);color:#333;letter-spacing:2.5px;white-space:nowrap;width:100%;border:none;text-align:center;margin:0;cursor:pointer;position:relative;box-shadow:0 0 15px 0 #ffe08288,0 2px 12px #fa8c3230}`;
    
    // 导航关键样式
    criticalCSS += `.menu-toggle{position:fixed;top:20px;left:20px;background:0 0;border:none;font-size:1.5rem;color:var(--primary-color);cursor:pointer;z-index:1100;padding:8px;border-radius:4px}`;
    criticalCSS += `.lang-toggle{position:fixed;top:20px;right:20px;display:flex;background:#fff;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,.15);z-index:1100;overflow:hidden;align-items:center}`;
    criticalCSS += `.lang-toggle button{padding:4px 8px;border:none;background:0 0;color:#555;font-weight:500;cursor:pointer;font-size:1rem}`;
    criticalCSS += `.lang-toggle button.active{background:var(--primary-color);color:#fff}`;
    
    // 包装器样式
    criticalCSS += `.wrapper{width:100%;max-width:800px;margin:10px auto;border-radius:var(--border-radius);box-shadow:var(--shadow-light);overflow:hidden}`;
    criticalCSS += `.content{margin-left:0;padding:10px 20px;display:flex;flex-direction:column;align-items:center}`;
    
    // 移动端关键断点
    criticalCSS += `@media (max-width:768px){`;
    criticalCSS += `.wrapper{margin:5px auto}`;
    criticalCSS += `.banner-header{aspect-ratio:3/1;min-height:140px}`;
    criticalCSS += `.banner-content{flex-direction:column;gap:8px;padding:12px}`;
    criticalCSS += `.banner-logo{width:50px;height:50px}`;
    criticalCSS += `.banner-logo img{width:40px;height:40px}`;
    criticalCSS += `.banner-title{font-size:1.6rem;margin:0 0 4px}`;
    criticalCSS += `.banner-tagline{font-size:.8rem;gap:10px}`;
    criticalCSS += `.business-tags{gap:10px;margin:8px auto 4px}`;
    criticalCSS += `.business-tag{font-size:1.2rem;padding:14px 28px;letter-spacing:1.8px}`;
    criticalCSS += `.menu-toggle{top:12px;left:12px;font-size:1.6rem;padding:10px}`;
    criticalCSS += `.lang-toggle{top:12px;right:12px;font-size:.9rem}`;
    criticalCSS += `.content{padding:8px 12px}`;
    criticalCSS += `}`;
    
    // 更小屏幕优化
    criticalCSS += `@media (max-width:480px){`;
    criticalCSS += `.wrapper{margin:3px auto}`;
    criticalCSS += `.banner-header{aspect-ratio:5/1;min-height:100px}`;
    criticalCSS += `.banner-content{gap:4px;padding:8px}`;
    criticalCSS += `.banner-logo{width:40px;height:40px}`;
    criticalCSS += `.banner-logo img{width:32px;height:32px}`;
    criticalCSS += `.banner-title{font-size:1.2rem;margin:0 0 2px}`;
    criticalCSS += `.banner-tagline{font-size:.7rem;gap:6px}`;
    criticalCSS += `.business-tags{display:flex;flex-direction:column;gap:8px;margin:10px auto 4px;width:100%;padding:0}`;
    criticalCSS += `.business-tag{font-size:1.05rem;padding:12px 0;width:100%;margin:0}`;
    criticalCSS += `.content{padding:6px 10px}`;
    criticalCSS += `}`;
    
    return criticalCSS;
    
  } catch (error) {
    console.error('提取Critical CSS失败:', error);
    return '';
  }
}

function updateHTML() {
  try {
    const htmlPath = path.join(__dirname, '../index.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    const criticalCSS = extractCriticalCSS();
    
    if (!criticalCSS) {
      console.error('无法提取Critical CSS');
      return;
    }
    
    // 查找现有的CSS预加载标签
    const cssPreloadRegex = /<link rel="preload" href="assets\/css\/style-optimized\.css"[^>]*>/;
    
    // 创建内联CSS和异步加载的新标签
    const newCSSTags = `  <!-- Critical CSS内联 -->
  <style>${criticalCSS}</style>
  
  <!-- 异步加载完整CSS -->
  <link rel="preload" href="assets/css/style-optimized.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="assets/css/style-optimized.css"></noscript>`;
    
    // 替换现有的CSS加载方式
    if (cssPreloadRegex.test(htmlContent)) {
      htmlContent = htmlContent.replace(cssPreloadRegex, newCSSTags);
    } else {
      // 如果没找到预加载标签，在head中插入
      htmlContent = htmlContent.replace(
        '</head>',
        `${newCSSTags}\n</head>`
      );
    }
    
    // 移除原有的noscript链接（如果存在）
    htmlContent = htmlContent.replace(
      /<noscript><link rel="stylesheet" href="assets\/css\/style-optimized\.css"><\/noscript>/g,
      ''
    );
    
    fs.writeFileSync(htmlPath, htmlContent);
    
    console.log('✅ Critical CSS已内联到HTML中');
    console.log(`📊 Critical CSS大小: ${(criticalCSS.length / 1024).toFixed(1)}KB`);
    console.log('🚀 首屏渲染性能将显著提升');
    
  } catch (error) {
    console.error('更新HTML失败:', error);
  }
}

// 执行优化
updateHTML();