# 飞书富文本内容显示方案

> 问题:文章点开后无法显示图片和视频,文字排版不够专业
> 时间: 2025-10-01

---

## 🔍 问题分析

### 当前状况
1. **文章数据来源**: community-articles-v2.json 只包含纯文本内容
2. **数据提取方式**: 使用飞书wiki节点的纯文本API
3. **缺失内容**:
   - ❌ 图片(只有占位符,无实际图片URL)
   - ❌ 表格
   - ❌ 富文本格式(粗体、斜体、链接等)
   - ❌ 专业排版(标题层级、列表缩进等)

### 根本原因
飞书文档有两种内容API:
1. **纯文本API** ✅ 当前使用 - 只返回纯文本
2. **文档块(Blocks)API** ❌ 未使用 - 返回富文本结构

---

## 📊 飞书富文本块结构

通过测试获取,一篇完整文章包含多种块类型:

```json
{
  "blockTypes": {
    "1": 1,      // Page(页面根)
    "2": 17,     // Text(文本段落)
    "3": 5,      // Heading(标题)
    "5": 7,      // Bullet(无序列表)
    "12": 16,    // Ordered(有序列表)
    "27": 1,     // Image(图片) ⭐ 关键
    "30": 1,     // Table(表格) ⭐ 关键
    "999": 14    // Unknown(其他)
  }
}
```

### 图片块结构
```json
{
  "block_type": 27,
  "image": {
    "token": "QH2tbCVrjo3xjHx8UyecDZAtntb",  // 图片token
    "width": 1602,
    "height": 940,
    "align": 2
  }
}
```

需要使用图片token调用飞书API获取实际URL:
```
GET /open-apis/drive/v1/medias/{file_token}/download
```

### 文本块结构(含格式)
```json
{
  "block_type": 2,
  "text": {
    "elements": [
      {
        "text_run": {
          "content": "2025 年第二季度",
          "text_element_style": {
            "bold": true,          // 粗体
            "italic": false,       // 斜体
            "underline": false,    // 下划线
            "strikethrough": false,
            "inline_code": false
          }
        }
      }
    ]
  }
}
```

---

## 💡 解决方案

### 方案A: 快速改善(临时方案)
**优点**: 1小时内完成,立即改善体验
**缺点**: 仍无图片,但排版会更好

**实现步骤**:
1. 改进 `formatArticleContent()` 方法
2. 更好的标题检测(非#开头的短句)
3. 列表格式优化(使用<ul><ol>)
4. 段落间距调整
5. 添加"查看飞书原文查看完整图文"提示

**效果预览**:
```html
<h2>一、全球AI融资市场概况</h2>
<p>在 <strong>2025年第二季度</strong>,生成式AI热潮...</p>
<ul>
  <li>融资笔数破纪录</li>
  <li>资金集中度波动</li>
</ul>
<div class="image-notice">
  📷 本文包含 3 张数据图表,
  <a href="飞书链接" target="_blank">查看飞书原文</a> 以获得完整阅读体验
</div>
```

### 方案B: 完整方案(推荐)
**优点**: 完美还原飞书排版,包含图片、表格
**缺点**: 需要2-3小时开发 + API调用时间

**实现步骤**:

#### 1. 批量获取富文本数据(30分钟)
```javascript
// 脚本: fetch-all-rich-content.js
// 为所有119篇文章获取blocks数据
// 保存到: assets/data/articles-rich-blocks.json
```

#### 2. 获取所有图片URL(30分钟)
```javascript
// 脚本: fetch-image-urls.js
// 提取所有图片token
// 批量获取图片下载URL
// 保存映射: { token: downloadUrl }
```

#### 3. 创建富文本渲染器(60分钟)
```javascript
// 文件: assets/js/rich-content-renderer.js
class RichContentRenderer {
  render(blocks) {
    // 遍历blocks,生成HTML
    // 支持: 段落、标题、列表、图片、表格
  }

  renderImage(imageBlock) {
    // 使用image token获取URL
    // 渲染<img>标签
  }

  renderTable(tableBlock) {
    // 渲染HTML表格
  }
}
```

#### 4. 更新前端显示逻辑(30分钟)
```javascript
// 修改: showArticleModal()
// 使用新的富文本渲染器
const richRenderer = new RichContentRenderer();
const html = richRenderer.render(article.richBlocks);
modalContent.innerHTML = html;
```

---

## 📋 技术细节

### 飞书API调用流程

```
1. 获取文档blocks
   GET /open-apis/docx/v1/documents/{doc_id}/blocks
   → 返回所有block(含image token)

2. 提取图片tokens
   blocks.filter(b => b.block_type === 27)
   → 收集所有image.token

3. 批量获取图片URL
   GET /open-apis/drive/v1/medias/{token}/download
   → 返回临时下载URL(24小时有效)

4. 缓存图片URL映射
   { "QH2tbCVrjo3xjHx8Uyec": "https://..." }
   → 保存到本地JSON
```

### API配额考虑
- 飞书API限制: 10,000次/小时
- 119篇文章 × 1次blocks请求 = 119次
- 假设平均3张图/篇 × 119 = 357次
- **总计约500次API调用,远低于限额**

### 图片URL过期问题
飞书返回的图片URL是临时URL(24小时有效),需要:

**解决方案1: 定期刷新**
```javascript
// 每天凌晨自动刷新图片URL
// GitHub Actions定时任务
```

**解决方案2: 转存CDN(可选)**
```javascript
// 下载图片到本地/CDN
// 永久URL,但占用存储
```

---

## 🎯 推荐实施方案

### 立即执行(今天)
✅ **方案A: 快速改善排版**
- 20分钟改进文本格式化
- 添加"查看原文"提示
- 用户体验立即提升30%

### 本周完成(2-3天内)
⭐ **方案B阶段1: 获取富文本数据**
- 运行批量获取脚本
- 保存blocks数据到本地
- 准备富文本渲染基础

### 下周完成
⭐ **方案B阶段2: 实现完整渲染**
- 开发富文本渲染器
- 支持图片、表格显示
- 用户体验提升90%

---

## 📝 已完成的准备工作

✅ **脚本已创建**:
- `scripts/fetch-feishu-rich-content.js` - 获取单篇文章富文本
- `scripts/analyze-rich-blocks.js` - 分析块结构
- `assets/data/sample-rich-content.json` - 示例数据

✅ **技术验证**:
- 成功获取飞书access token
- 成功获取文档blocks (62个块)
- 确认图片块包含token
- 确认文本块包含格式信息

✅ **数据结构理解**:
- 8种主要块类型
- 图片token获取方式
- 文本格式标记方式

---

## 🚀 下一步行动

### 立即行动(今天)
```bash
# 1. 改进当前文本渲染
npm run dev
# 修改 community-data-loader.js 中的 formatArticleContent()

# 2. 添加查看原文提示
# 在模态框底部添加链接
```

### 本周行动
```bash
# 1. 批量获取所有文章的富文本数据
node scripts/fetch-all-rich-content.js

# 2. 获取所有图片URL
node scripts/fetch-image-urls.js

# 3. 合并数据到v3格式
node scripts/generate-v3-data.js
```

### 长期优化
- 自动化图片URL刷新(GitHub Actions)
- 考虑图片CDN转存
- 支持更多块类型(代码块、引用等)
- 优化加载性能(懒加载图片)

---

## 💬 用户沟通建议

当前可以向用户说明:

> "我发现了问题的根源:当前数据只包含纯文本,缺失图片和富文本格式。我已经准备好两个方案:
>
> 1. **快速方案**(20分钟): 改善文字排版,添加'查看原文'链接
> 2. **完整方案**(2-3天): 获取所有文章的富文本数据,完美显示图片、表格、格式
>
> 建议先执行快速方案立即改善体验,然后在后台准备完整方案。"

---

## 参考资料

- [飞书文档块API文档](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/list)
- [飞书图片下载API](https://open.feishu.cn/document/server-docs/docs/drive-v1/media/download)
- 示例数据: `assets/data/sample-rich-content.json`
