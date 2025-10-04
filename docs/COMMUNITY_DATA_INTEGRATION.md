# SVTR内容社区 - 飞书数据集成指南

## 📋 概述

SVTR内容社区现已集成飞书知识库真实数据,从 [SVTR.AI创投库](https://svtrglobal.feishu.cn/wiki/FeE4wE5kwi2BvlksekTcJvN6n1e) 自动同步文章内容。

## 🎯 功能特性

### 1. 数据来源
- **飞书知识库**: 258个节点完整内容
- **文章数量**: 121篇高质量AI创投文章
- **分类覆盖**: 初创公司(102)、行业分析(17)、上市公司(1)、投资机构(1)

### 2. 智能分类
文章自动分类到以下维度:

#### 主分类
- 🚀 **AI初创公司** (84%)
- 📈 **AI上市公司** (1%)
- 🔬 **AI行业分析** (14%)
- 💰 **AI投资机构** (1%)

#### 行业层次
- 基础层 (73篇) - 算力、芯片、云服务
- 模型层 (16篇) - 大模型、多模态
- 应用层 - Agent、Copilot、垂直应用

#### 公司阶段
- 早期阶段 - 种子轮、天使轮
- 成长期 - A轮、B轮
- 独角兽 - 估值>10亿美元
- 上市公司 - IPO后

### 3. 智能标签
- 大语言模型
- AI芯片
- 多模态
- 企业服务
- 医疗AI
- 教育科技
- 金融科技

## 🚀 快速开始

### 生成内容社区数据

```bash
# 从飞书数据生成社区文章
npm run sync:community

# 测试数据质量
npm run test:community
```

### 数据同步流程

```bash
# 1. 同步飞书知识库 (如果需要最新数据)
npm run sync

# 2. 生成内容社区数据
npm run sync:community

# 3. 验证数据质量
npm run test:community

# 4. 预览效果
npm run preview
# 访问 http://localhost:8080/pages/content-community.html
```

## 📁 文件结构

```
chatsvtr/
├── assets/
│   ├── data/
│   │   ├── rag/
│   │   │   └── enhanced-feishu-full-content.json  # 飞书原始数据
│   │   └── community-articles.json                 # 社区文章数据
│   └── js/
│       └── community-data-loader.js                # 数据加载器
├── pages/
│   └── content-community.html                      # 社区页面
└── scripts/
    ├── generate-community-data.js                  # 数据生成脚本
    └── test-community-data.js                      # 数据测试脚本
```

## 🔧 核心脚本

### 1. generate-community-data.js

从飞书数据生成内容社区格式:

```javascript
// 功能:
// - 读取飞书RAG数据
// - 过滤和转换为文章格式
// - 智能分类和打标签
// - 提取元数据
// - 生成飞书链接
```

**数据转换规则**:
- 过滤条件: 内容>200字符, docx类型, 非模板
- 自动检测: 分类、标签、阶段、层次
- 提取作者: 基于内容类型匹配
- 生成摘要: 前200-300字符

### 2. community-data-loader.js

前端数据加载和渲染:

```javascript
// 功能:
// - 异步加载JSON数据
// - 动态渲染文章卡片
// - 实时筛选和搜索
// - 点击跳转飞书源文档
```

**筛选功能**:
- 分类筛选
- 阶段筛选
- 层次筛选
- 投资类型筛选
- 全文搜索

### 3. test-community-data.js

数据质量测试:

```javascript
// 测试项目:
// 1. 数据结构完整性
// 2. 分类分布统计
// 3. 标签覆盖率
// 4. 元数据完整性
// 5. 筛选功能验证
// 6. 数据质量检查
```

## 📊 数据质量指标

### 当前统计 (2025-09-30)

- ✅ **总文章数**: 121篇
- ✅ **数据结构**: 100% 完整
- ✅ **标签覆盖**: 94%
- ✅ **飞书链接**: 100%
- ✅ **元数据覆盖**:
  - 行业层次: 84%
  - 投资类型: 83%
  - 公司阶段: 55%

### 质量标准

- ✅ 标题长度 ≥ 10字符
- ✅ 摘要长度 ≥ 50字符
- ✅ 内容长度: 平均5263字符
- ✅ 日期格式: YYYY-MM-DD
- ✅ 飞书链接有效性

## 🎨 前端集成

### HTML引用

```html
<!-- 加载数据加载器 -->
<script src="../assets/js/community-data-loader.js"></script>

<!-- 初始化 -->
<script>
  const dataLoader = new CommunityDataLoader();
  await dataLoader.init();
  dataLoader.renderArticles('#contentGrid');
</script>
```

### 筛选示例

```javascript
// 获取筛选后的文章
const filtered = dataLoader.filterArticles({
  category: 'startups',    // 初创公司
  layer: 'model',          // 模型层
  stage: 'unicorn',        // 独角兽
  search: 'OpenAI'         // 搜索关键词
});
```

### 统计数据

```javascript
// 获取统计信息
const stats = dataLoader.getStats();
console.log(stats);
// {
//   total: 121,
//   startups: 102,
//   public: 1,
//   analysis: 17,
//   investors: 1,
//   byLayer: { infrastructure: 73, model: 16, ... },
//   byStage: { early: 66, growth: 0, ... }
// }
```

## 🔄 更新流程

### 定期更新 (推荐)

```bash
# 每周执行一次完整同步
npm run sync           # 同步飞书最新数据
npm run sync:community # 生成社区数据
npm run test:community # 验证数据质量
```

### 手动更新

如果飞书数据已经是最新:

```bash
npm run sync:community  # 仅重新生成社区数据
```

## 🐛 故障排除

### 问题1: 数据加载失败

**症状**: 控制台显示 `❌ 数据加载失败`

**解决**:
```bash
# 检查文件是否存在
ls assets/data/community-articles.json

# 重新生成数据
npm run sync:community
```

### 问题2: 筛选无结果

**症状**: 页面显示 "未找到匹配的文章"

**解决**:
- 检查筛选条件是否过于严格
- 查看控制台日志中的筛选结果数量
- 尝试清除所有筛选条件

### 问题3: 飞书链接打不开

**症状**: 点击文章跳转到错误页面

**解决**:
- 确认飞书权限 (需要访问SVTR知识库)
- 检查 `source.url` 是否正确
- 验证 `objToken` 和 `nodeToken`

## 📈 未来计划

### 短期优化
- [ ] 添加文章详情页
- [ ] 支持图片预览
- [ ] 优化移动端体验
- [ ] 增加收藏功能

### 中期扩展
- [ ] 个性化推荐
- [ ] 作者主页
- [ ] 评论系统
- [ ] 订阅通知

### 长期规划
- [ ] AI内容生成
- [ ] 多语言支持
- [ ] 数据可视化
- [ ] API接口开放

## 🤝 贡献指南

### 添加新的分类标签

编辑 `scripts/generate-community-data.js`:

```javascript
const categoryKeywords = {
  startups: [...],
  public: [...],
  analysis: [...],
  investors: [...],
  new_category: ['关键词1', '关键词2']  // 新增分类
};
```

### 自定义筛选逻辑

编辑 `assets/js/community-data-loader.js`:

```javascript
filterArticles(filters) {
  return this.articles.filter(article => {
    // 添加自定义筛选条件
    if (filters.customFilter) {
      // 自定义逻辑
    }
    return true;
  });
}
```

## 📞 技术支持

- **文档**: [CLAUDE.md](../CLAUDE.md)
- **Issue**: [GitHub Issues](https://github.com/your-repo/issues)
- **联系**: support@svtr.ai

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)

---

**最后更新**: 2025-09-30
**数据版本**: v2_enhanced
**文章数量**: 121篇
