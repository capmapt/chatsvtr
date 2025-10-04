# 飞书图片和表格在网页直接显示的完整解决方案

## 🎯 核心问题

### 问题1: 飞书图片无法直接显示
- **原因**: 飞书API返回的只是图片`token`,不是直接可用的URL
- **限制**: 即使获取URL,也只有24小时有效期,需要认证
- **影响**: 无法在静态网页中直接使用`<img src="">`显示图片

### 问题2: 表格数据结构复杂
- **原因**: 表格是独立的文档块,需要单独API调用获取详细数据
- **复杂度**: 需要解析单元格、合并单元格、样式等

## 💡 完整解决方案

### 方案架构

```
用户浏览器
    ↓
[前端页面]
    ↓ 请求图片
[Cloudflare Worker API] (/api/get-rich-media)
    ↓
[飞书开放平台API]
    ↓ 返回图片二进制数据
[Cloudflare Worker] 转发图片
    ↓
[用户浏览器] 显示图片
```

### 方案A: 后端API代理 (推荐)

#### 1. 创建Cloudflare Functions API

**文件**: `functions/api/get-rich-media.ts`

**核心功能**:
- 接收参数: `type=image&documentId=xxx&token=xxx`
- 调用飞书API获取access_token
- 使用token获取图片临时URL或直接下载
- 将图片二进制数据代理返回给前端
- 添加缓存头(1小时)减少API调用

**优点**:
- ✅ 前端无需处理飞书认证
- ✅ 可以添加缓存减少API调用
- ✅ 隐藏App Secret安全
- ✅ 图片总是最新

**缺点**:
- ❌ 每次加载都需要API调用
- ❌ 增加服务器负载

#### 2. 更新前端渲染器

**修改**: `assets/js/rich-content-renderer.js`

```javascript
renderImage(imageInfo, index, documentId) {
  const imageToken = imageInfo.token;
  const imageUrl = `/api/get-rich-media?type=image&documentId=${documentId}&token=${imageToken}`;

  return `
    <img
      class="rich-image lazy-load"
      src="${imageUrl}"
      alt="图片 ${index}"
      loading="lazy"
      style="max-width: 100%; height: auto;"
    />
  `;
}
```

#### 3. 传递documentId

需要在render方法中传入documentId:

```javascript
// community-data-loader.js
if (article.richBlocks && article.richBlocks.length > 0) {
  formattedContent = this.richRenderer.render(
    article.richBlocks,
    article.id  // 传入documentId
  );
}
```

### 方案B: 预下载到本地/CDN

#### 流程

1. **批量下载脚本**: `scripts/download-feishu-images.js`
   - 读取所有文章的richBlocks
   - 提取所有图片token
   - 调用飞书API下载图片
   - 保存到`assets/images/feishu/`
   - 更新数据文件中的图片路径

2. **定时任务**: GitHub Actions每天凌晨执行
   - 重新下载所有图片
   - 提交到仓库

**优点**:
- ✅ 加载速度最快
- ✅ 不依赖飞书API可用性
- ✅ 可以离线查看

**缺点**:
- ❌ 需要大量存储空间(756张图片)
- ❌ 图片更新有延迟
- ❌ 需要定时同步

### 方案C: 混合方案(当前实现)

#### 当前实现
- 摘要显示富文本排版
- 提供"查看完整版"按钮
- 使用iframe嵌入飞书文档

**优点**:
- ✅ 实现简单,零维护
- ✅ 图片总是最新
- ✅ 完整的飞书体验

**缺点**:
- ❌ 需要加载整个飞书页面
- ❌ 无法自定义样式
- ❌ 依赖飞书服务可用性

## 📋 实施步骤 (方案A - 推荐)

### Step 1: 创建后端API

✅ 已完成: `functions/api/get-rich-media.ts`

### Step 2: 更新渲染器支持documentId

需要修改:
1. `rich-content-renderer.js` - render方法接受documentId参数
2. `renderImagePlaceholder` → `renderImage` - 生成API URL
3. `community-data-loader.js` - 传递documentId

### Step 3: 添加懒加载支持

```javascript
// 图片懒加载
document.querySelectorAll('.lazy-load').forEach(img => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy-load');
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  } else {
    img.src = img.dataset.src;
  }
});
```

### Step 4: 添加加载动画

CSS:
```css
.rich-image {
  opacity: 0;
  transition: opacity 0.3s;
}

.rich-image.loaded {
  opacity: 1;
}

.image-loading {
  /* 加载动画样式 */
}
```

### Step 5: 错误处理

```javascript
img.onerror = function() {
  this.src = '/assets/images/image-error-placeholder.png';
};
```

## 🚀 性能优化

### 1. CDN缓存
```typescript
// get-rich-media.ts
headers: {
  'Cache-Control': 'public, max-age=86400', // 缓存24小时
  'CDN-Cache-Control': 'max-age=86400'
}
```

### 2. 图片压缩
使用Cloudflare Image Resizing:
```
/cdn-cgi/image/width=800,quality=85/api/get-rich-media?...
```

### 3. 懒加载
- 只加载可视区域的图片
- 使用Intersection Observer API

### 4. 渐进式加载
- 先显示占位符
- 加载完成后淡入

## 📊 对比总结

| 方案 | 实现难度 | 维护成本 | 用户体验 | 加载速度 | 推荐度 |
|------|---------|---------|---------|---------|--------|
| A: API代理 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| B: 预下载 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| C: iframe嵌入 | ⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 最终建议

**短期方案** (1-2天实现):
- 使用方案A: 后端API代理
- 实现图片实时加载
- 保留"查看完整版"按钮作为备选

**长期优化** (1-2周):
- 添加方案B: 预下载机制
- 设置GitHub Actions定时同步
- 使用CDN加速

**表格处理**:
- 短期: 保持占位符 + "查看完整版"
- 长期: 开发表格渲染器,支持基础表格显示

## 📝 代码清单

需要修改的文件:
1. ✅ `functions/api/get-rich-media.ts` (已创建)
2. ⏳ `assets/js/rich-content-renderer.js` (需修改)
3. ⏳ `assets/js/community-data-loader.js` (需修改)
4. ⏳ `pages/content-community.html` (添加CSS)

估计工作量: 2-3小时
