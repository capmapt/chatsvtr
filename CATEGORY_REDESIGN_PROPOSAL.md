# 内容社区分类重新设计方案

> 基于飞书知识库真实分类结构
> 日期: 2025-09-30

---

## 📊 飞书原始分类结构

### 三大顶级分类
1. **SVTR.AI创投季度观察** (2个子分类)
   - AI创投观察丨2025 Q2
   - SVTR周报模版

2. **SVTR AI创投库** (12个子分类)
   - SVTR AI估值排行榜
   - SVTR AI独角兽排行榜
   - AI融资概览
   - AI行业概览
   - AI公司概览
   - AI机构概览
   - AI人物概览
   - AI并购库
   - 社群通讯录
   - 资源库
   - ...

3. **SVTR丨硅谷科技评论** (9个子分类)
   - SVTR.AI会员专区
   - 交易精选
   - AI周报
   - SVTR.AI 100
   - SVTR.AI创投榜
   - SVTR.AI创投群/会/营
   - ...

### 二级分类 (Level 2)
- AI融资榜
- AI基建榜
- AI高校榜
- AI应用榜
- AI工具榜
- AI大厂榜
- AI机构榜
- AI公司研究
- 斯坦福创业项目
- AI创投群丨会员专区
- ...

### 三级分类 (Level 3, 135个)
- AI独角兽
- Cloud 100
- AI 50 强
- 开源AI 初创公司
- 国内备案大模型
- 基础层-算力
- 算力芯片
- 各大学(斯坦福/哈佛/MIT...)
- ...

---

## 🎯 新分类设计方案

### 方案A: 内容类型优先

#### 主导航 (6个)
```
📊 数据榜单    📰 观察报告    💼 公司研究    🏛️ 机构研究    👤 创始人    📚 资源库
```

#### 子分类筛选
**数据榜单** 下:
- AI融资榜
- AI估值榜
- AI独角兽榜
- AI基建榜
- AI应用榜
- AI大厂榜
- AI机构榜
- AI 100强

**观察报告** 下:
- 季度观察 (Q1/Q2/Q3/Q4)
- AI周报
- 行业分析
- 市场趋势

**公司研究** 下:
- 初创公司
- 上市公司
- 独角兽
- 并购案例

**机构研究** 下:
- VC机构
- PE机构
- CVC企业风投
- LP有限合伙人

**创始人** 下:
- 技术创始人
- 连续创业者
- 学术背景
- 大厂背景

**资源库** 下:
- AI工具
- 开源项目
- 学习资料
- 会员专区

---

### 方案B: 用户需求优先 (推荐)

#### 主导航 (5+1个)
```
🔥 热门推荐    💰 融资动态    🚀 公司洞察    📈 榜单数据    🎓 深度研究    ⭐ 会员专区
```

**详细说明:**

**🔥 热门推荐** (默认首页)
- 编辑精选
- 本周热门
- 最新发布
- 最受关注

**💰 融资动态**
- 最新融资
- 融资榜单
- 按轮次: 种子轮/A轮/B轮/C轮...
- 按金额: $1M-10M / $10M-50M / $50M-100M / $100M+
- 按赛道: 大模型/基础设施/应用层

**🚀 公司洞察**
- 初创公司
- 独角兽 (估值$1B+)
- 上市公司
- 并购案例
- 按阶段: 早期/成长期/成熟期
- 按层次: 基础层/模型层/应用层

**📈 榜单数据**
- AI 100强
- 估值排行
- 融资排行
- 基建榜
- 应用榜
- 大厂榜
- 机构榜

**🎓 深度研究**
- 季度观察
- AI周报
- 行业分析
- 技术趋势
- 市场洞察
- 投资策略

**⭐ 会员专区**
- 独家内容
- 创投群
- 创投会
- 创投营
- 项目对接

---

## 🏷️ 标签系统设计

### 内容类型标签
```javascript
const contentTypeTags = [
  { id: 'news', name: '融资快讯', color: '#FF6B6B' },
  { id: 'report', name: '研究报告', color: '#4ECDC4' },
  { id: 'ranking', name: '榜单数据', color: '#95E1D3' },
  { id: 'analysis', name: '深度分析', color: '#F38181' },
  { id: 'interview', name: '创始人访谈', color: '#AA96DA' },
  { id: 'weekly', name: 'AI周报', color: '#FCBAD3' }
];
```

### 技术层标签
```javascript
const techLayerTags = [
  { id: 'infrastructure', name: '基础层', color: '#3498DB' },
  { id: 'model', name: '模型层', color: '#9B59B6' },
  { id: 'application', name: '应用层', color: '#1ABC9C' }
];
```

### 细分赛道标签
```javascript
const verticalTags = [
  { id: 'llm', name: '大语言模型', color: '#E74C3C' },
  { id: 'chip', name: 'AI芯片', color: '#F39C12' },
  { id: 'cloud', name: '云算力', color: '#16A085' },
  { id: 'agent', name: 'AI智能体', color: '#8E44AD' },
  { id: 'robot', name: 'AI机器人', color: '#C0392B' },
  { id: 'healthcare', name: 'AI+医疗', color: '#27AE60' },
  { id: 'finance', name: 'AI+金融', color: '#2980B9' },
  { id: 'education', name: 'AI+教育', color: '#D35400' },
  { id: 'enterprise', name: '企业服务', color: '#7F8C8D' },
  { id: 'marketing', name: 'AI+营销', color: '#E67E22' }
];
```

### 公司阶段标签
```javascript
const stageTags = [
  { id: 'seed', name: '种子轮', color: '#95A5A6' },
  { id: 'early', name: '早期阶段', color: '#3498DB' },
  { id: 'growth', name: '成长期', color: '#1ABC9C' },
  { id: 'unicorn', name: '独角兽', color: '#9B59B6' },
  { id: 'ipo', name: '已上市', color: '#E74C3C' }
];
```

### 地域标签
```javascript
const regionTags = [
  { id: 'us', name: '美国', color: '#3498DB' },
  { id: 'china', name: '中国', color: '#E74C3C' },
  { id: 'uk', name: '英国', color: '#2ECC71' },
  { id: 'israel', name: '以色列', color: '#F39C12' },
  { id: 'india', name: '印度', color: '#9B59B6' }
];
```

### 投资机构标签
```javascript
const investorTags = [
  { id: 'yc', name: 'YC', color: '#FF6600' },
  { id: 'sequoia', name: 'Sequoia', color: '#00563F' },
  { id: 'a16z', name: 'a16z', color: '#7B68EE' },
  { id: 'benchmark', name: 'Benchmark', color: '#1E90FF' },
  { id: 'greylock', name: 'Greylock', color: '#708090' }
];
```

---

## 🎨 视觉设计建议

### 导航布局
```html
<!-- 顶部快速导航 -->
<nav class="category-tabs">
  <a href="#hot" class="tab active">🔥 热门推荐</a>
  <a href="#funding" class="tab">💰 融资动态</a>
  <a href="#company" class="tab">🚀 公司洞察</a>
  <a href="#ranking" class="tab">📈 榜单数据</a>
  <a href="#research" class="tab">🎓 深度研究</a>
  <a href="#vip" class="tab premium">⭐ 会员专区</a>
</nav>

<!-- 左侧筛选器 -->
<aside class="filters-sidebar">
  <div class="filter-group">
    <h4>内容类型</h4>
    <label><input type="checkbox" value="news"> 融资快讯</label>
    <label><input type="checkbox" value="report"> 研究报告</label>
    <label><input type="checkbox" value="ranking"> 榜单数据</label>
  </div>

  <div class="filter-group">
    <h4>技术层次</h4>
    <label><input type="radio" name="layer" value="all"> 全部</label>
    <label><input type="radio" name="layer" value="infrastructure"> 基础层</label>
    <label><input type="radio" name="layer" value="model"> 模型层</label>
    <label><input type="radio" name="layer" value="application"> 应用层</label>
  </div>

  <div class="filter-group">
    <h4>细分赛道</h4>
    <!-- 多选标签云 -->
    <div class="tag-cloud">
      <span class="tag">大语言模型</span>
      <span class="tag">AI芯片</span>
      <span class="tag">云算力</span>
      <!-- ... -->
    </div>
  </div>
</aside>
```

### 文章卡片增强
```html
<article class="article-card">
  <!-- 顶部标签 -->
  <div class="card-tags">
    <span class="tag-type">融资快讯</span>
    <span class="tag-layer">基础层</span>
    <span class="tag-vertical">AI芯片</span>
  </div>

  <!-- 标题 -->
  <h3>NVIDIA完成$10B融资，AI芯片领域新纪录</h3>

  <!-- 核心数据 -->
  <div class="card-highlights">
    <div class="highlight">
      <span class="label">融资金额</span>
      <span class="value">$10.0B</span>
    </div>
    <div class="highlight">
      <span class="label">轮次</span>
      <span class="value">D轮</span>
    </div>
    <div class="highlight">
      <span class="label">估值</span>
      <span class="value">$50.0B</span>
    </div>
  </div>

  <!-- 摘要 -->
  <p class="card-excerpt">...</p>

  <!-- 底部元信息 -->
  <div class="card-footer">
    <div class="meta-left">
      <span class="investor">🏛️ Sequoia</span>
      <span class="region">🇺🇸 美国</span>
    </div>
    <div class="meta-right">
      <span class="date">2025-09-28</span>
      <span class="reading-time">📖 5分钟</span>
    </div>
  </div>
</article>
```

---

## 📝 实施建议

### 阶段1: 重新生成数据 (1-2小时)
1. 修改 `scripts/generate-community-data.js`
2. 基于飞书层级结构重新分类
3. 添加更丰富的标签系统
4. 提取融资金额、轮次、估值等结构化数据

### 阶段2: 更新UI (2-3小时)
1. 重新设计导航系统
2. 添加左侧筛选器(可选)
3. 增强文章卡片显示
4. 添加标签云组件

### 阶段3: 增强筛选 (1-2小时)
1. 支持多标签筛选
2. 添加排序功能(最新/热门/融资金额)
3. 添加高级筛选(日期范围/金额范围)

---

## 🎯 最终效果

### 用户体验改进
- ✅ 分类更贴近真实数据结构
- ✅ 标签系统更丰富专业
- ✅ 筛选功能更强大
- ✅ 信息展示更直观

### 内容质量提升
- ✅ 数据来源可追溯
- ✅ 分类逻辑清晰
- ✅ 专业性更强
- ✅ 用户粘性更高

---

## 💡 推荐方案

**建议采用方案B: 用户需求优先**

理由:
1. 符合用户浏览习惯 (热门→融资→公司→榜单→研究)
2. 内容分层清晰
3. 可扩展性强
4. 会员体系完整

**快速实施版本** (1-2小时):
1. 保留现有5个主分类
2. 添加10个核心标签
3. 增强卡片显示融资信息
4. 添加多标签筛选

完整版实施请参考上述详细方案。
