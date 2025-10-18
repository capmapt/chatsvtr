# AI创投日报筛选功能 - 设计方案

**日期**: 2025-10-16
**状态**: 设计中
**优先级**: 高

---

## 🎯 功能目标

在创投日报卡片上方添加筛选栏，方便用户快速查找感兴趣的融资信息。

---

## 📊 数据字段分析

### **可用的筛选字段**

根据当前数据结构 (来自 `assets/js/funding-daily.js:100-118`):

```javascript
{
  companyName: string,        // 公司名称 (提取)
  stage: string,              // 融资轮次 (提取/推断)
  amount: number,             // 融资金额 (提取)
  currency: string,           // 货币类型
  description: string,        // 企业介绍 (原始)
  tags: string[],             // 标签 (二级分类 + 标签)
  investedAt: string,         // 投资时间
  investors: string[],        // 投资方 (提取)
  companyWebsite: string,     // 公司官网
  contactInfo: string,        // 联系方式
  teamBackground: string,     // 团队背景
  category: string,           // 细分领域
  subCategory: string,        // 二级分类
  founder: string             // 创始人 (提取)
}
```

### **筛选维度优先级**

| 优先级 | 字段 | 数据源 | 实现难度 | 用户价值 |
|--------|------|--------|---------|----------|
| P0 | 融资轮次 (stage) | 提取/推断 | 低 | ⭐⭐⭐⭐⭐ |
| P0 | 融资金额区间 (amount) | 提取 | 低 | ⭐⭐⭐⭐⭐ |
| P0 | 标签 (tags) | 飞书数据 | 低 | ⭐⭐⭐⭐⭐ |
| P1 | 投资方 (investors) | 提取 | 中 | ⭐⭐⭐⭐ |
| P2 | 细分领域 (category) | 飞书数据 | 低 | ⭐⭐⭐ |
| P3 | 成立地点 | ❌ 无数据 | - | ⭐⭐ |
| P3 | 成立时间 | ❌ 无数据 | - | ⭐⭐ |

**关键发现**:
- ✅ **成立时间**: 当前数据中没有
- ✅ **成立地点**: 当前数据中没有
- ✅ 可以从`企业介绍`中尝试提取，但准确率可能较低

---

## 🎨 UI设计方案

### **筛选栏位置**

```
┌─────────────────────────────────────────┐
│  AI创投日报                              │
│  ⏰ 更新时间: xxx                         │
├─────────────────────────────────────────┤
│  🔍 筛选条件                             │ ← 新增筛选栏
│  [融资轮次▼] [金额区间▼] [标签▼] [更多▼]│
│  已选: [A轮 ×] [$10M-50M ×]              │
├─────────────────────────────────────────┤
│  📊 显示 15/77 条结果                    │ ← 筛选结果统计
├─────────────────────────────────────────┤
│  ┌───────────────┐                       │
│  │  卡片1        │                       │
│  └───────────────┘                       │
│  ┌───────────────┐                       │
│  │  卡片2        │                       │
│  └───────────────┘                       │
└─────────────────────────────────────────┘
```

### **筛选器类型**

#### **1. 融资轮次 (多选)**
```
┌─ 融资轮次 ────────┐
│ ☑ Seed (15)       │
│ ☐ Pre-A (8)       │
│ ☑ A轮 (12)        │
│ ☐ B轮 (7)         │
│ ☐ C轮 (5)         │
│ ☐ D轮以上 (3)     │
│ ☐ 未知 (2)        │
└───────────────────┘
```

#### **2. 融资金额区间 (单选/范围)**
```
┌─ 融资金额 ────────┐
│ ○ 全部            │
│ ○ <$5M (10)       │
│ ● $5M-20M (25)    │
│ ○ $20M-50M (15)   │
│ ○ $50M-100M (8)   │
│ ○ $100M-500M (7)  │
│ ○ >$500M (2)      │
│                   │
│ 或自定义范围：    │
│ [___] ~ [___] M   │
└───────────────────┘
```

#### **3. 标签 (多选 + 搜索)**
```
┌─ 行业标签 ────────┐
│ 🔍 [搜索标签...]  │
│ ☑ AI (25)         │
│ ☐ 大模型 (10)     │
│ ☐ 机器人 (8)      │
│ ☑ 医疗AI (12)     │
│ ☐ 金融科技 (7)    │
│ ... 显示更多      │
└───────────────────┘
```

#### **4. 投资方 (多选 + 搜索)**
```
┌─ 投资方 ──────────┐
│ 🔍 [搜索投资方...]│
│ ☑ 红杉资本 (15)   │
│ ☐ IDG资本 (12)    │
│ ☐ 经纬中国 (10)   │
│ ... 显示更多      │
└───────────────────┘
```

---

## 💻 技术实现方案

### **阶段1: 基础筛选功能** (MVP)

#### **1.1 数据结构**

```javascript
// 筛选状态
const filterState = {
  stages: [],           // ['Seed', 'A轮']
  amountRange: null,    // { min: 5000000, max: 20000000 } 或 null
  tags: [],             // ['AI', '医疗AI']
  investors: [],        // ['红杉资本']
  searchKeyword: ''     // 关键词搜索
};

// 筛选选项 (动态生成)
const filterOptions = {
  stages: [],           // 从数据中提取所有轮次 + 统计数量
  amountRanges: [],     // 预定义金额区间 + 统计数量
  tags: [],             // 从数据中提取所有标签 + 统计数量
  investors: []         // 从数据中提取所有投资方 + 统计数量
};
```

#### **1.2 核心函数**

```javascript
// 🔍 筛选数据
function filterFundingData(data, filters) {
  return data.filter(item => {
    // 融资轮次筛选
    if (filters.stages.length > 0) {
      if (!filters.stages.includes(item.stage)) return false;
    }

    // 金额区间筛选
    if (filters.amountRange) {
      const { min, max } = filters.amountRange;
      if (item.amount < min || item.amount > max) return false;
    }

    // 标签筛选 (任一匹配即可)
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag =>
        item.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // 投资方筛选 (任一匹配即可)
    if (filters.investors.length > 0) {
      const hasMatchingInvestor = filters.investors.some(investor =>
        item.investors?.some(inv => inv.includes(investor))
      );
      if (!hasMatchingInvestor) return false;
    }

    // 关键词搜索 (公司名+描述)
    if (filters.searchKeyword) {
      const keyword = filters.searchKeyword.toLowerCase();
      const matchName = item.companyName?.toLowerCase().includes(keyword);
      const matchDesc = item.description?.toLowerCase().includes(keyword);
      if (!matchName && !matchDesc) return false;
    }

    return true;
  });
}

// 📊 生成筛选选项 (带数量统计)
function generateFilterOptions(data) {
  const options = {
    stages: new Map(),
    tags: new Map(),
    investors: new Map()
  };

  data.forEach(item => {
    // 统计轮次
    options.stages.set(
      item.stage,
      (options.stages.get(item.stage) || 0) + 1
    );

    // 统计标签
    item.tags?.forEach(tag => {
      options.tags.set(
        tag,
        (options.tags.get(tag) || 0) + 1
      );
    });

    // 统计投资方
    item.investors?.forEach(investor => {
      options.investors.set(
        investor,
        (options.investors.get(investor) || 0) + 1
      );
    });
  });

  return {
    stages: Array.from(options.stages.entries())
      .sort((a, b) => b[1] - a[1]), // 按数量降序
    tags: Array.from(options.tags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20), // 只显示前20个
    investors: Array.from(options.investors.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
  };
}
```

#### **1.3 UI组件**

```javascript
// 🎨 生成筛选栏HTML
function createFilterBarHTML(options, currentFilters) {
  return `
    <div class="funding-filter-bar">
      <!-- 筛选器按钮组 -->
      <div class="filter-buttons">
        <button class="filter-btn" data-filter="stage">
          融资轮次 <span class="filter-count">${currentFilters.stages.length || ''}</span>
          <span class="dropdown-icon">▼</span>
        </button>

        <button class="filter-btn" data-filter="amount">
          融资金额 <span class="filter-count">${currentFilters.amountRange ? '1' : ''}</span>
          <span class="dropdown-icon">▼</span>
        </button>

        <button class="filter-btn" data-filter="tags">
          行业标签 <span class="filter-count">${currentFilters.tags.length || ''}</span>
          <span class="dropdown-icon">▼</span>
        </button>

        <button class="filter-btn" data-filter="investors">
          投资方 <span class="filter-count">${currentFilters.investors.length || ''}</span>
          <span class="dropdown-icon">▼</span>
        </button>

        <button class="filter-reset-btn" onclick="resetFilters()" ${hasActiveFilters() ? '' : 'disabled'}>
          重置筛选
        </button>
      </div>

      <!-- 已选筛选条件 -->
      <div class="filter-tags" id="filterTags">
        ${generateFilterTagsHTML(currentFilters)}
      </div>

      <!-- 筛选器下拉面板 (动态显示) -->
      <div class="filter-panels" id="filterPanels"></div>
    </div>

    <!-- 结果统计 -->
    <div class="filter-result-stats">
      📊 显示 <strong id="filteredCount">0</strong> / <strong id="totalCount">0</strong> 条结果
    </div>
  `;
}
```

---

### **阶段2: 高级功能** (增强版)

#### **2.1 URL状态同步**

```javascript
// 筛选状态保存到URL
function syncFiltersToURL(filters) {
  const params = new URLSearchParams();
  if (filters.stages.length) params.set('stages', filters.stages.join(','));
  if (filters.amountRange) params.set('amount', `${filters.amountRange.min}-${filters.amountRange.max}`);
  if (filters.tags.length) params.set('tags', filters.tags.join(','));

  const newURL = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newURL);
}

// 从URL恢复筛选状态
function loadFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  return {
    stages: params.get('stages')?.split(',') || [],
    amountRange: parseAmountRange(params.get('amount')),
    tags: params.get('tags')?.split(',') || [],
    investors: params.get('investors')?.split(',') || []
  };
}
```

#### **2.2 筛选预设 (快捷筛选)**

```javascript
const FILTER_PRESETS = {
  'early-stage': {
    name: '早期项目',
    filters: {
      stages: ['Seed', 'Pre-A', 'A轮'],
      amountRange: { min: 0, max: 20000000 }
    }
  },
  'hot-ai': {
    name: '热门AI',
    filters: {
      tags: ['AI', '大模型', 'LLM']
    }
  },
  'top-investors': {
    name: '顶级机构',
    filters: {
      investors: ['红杉资本', 'IDG资本', '经纬中国']
    }
  }
};
```

#### **2.3 筛选结果缓存**

```javascript
// 缓存筛选结果，避免重复计算
const filterCache = new Map();

function getCachedFilterResult(data, filters) {
  const cacheKey = JSON.stringify(filters);
  if (filterCache.has(cacheKey)) {
    return filterCache.get(cacheKey);
  }

  const result = filterFundingData(data, filters);
  filterCache.set(cacheKey, result);
  return result;
}
```

---

## 📱 响应式设计

### **桌面端** (>768px)
- 筛选器横向排列
- 下拉面板显示完整选项

### **移动端** (<768px)
- 筛选器纵向堆叠或折叠到"筛选"按钮
- 使用全屏/抽屉式筛选面板
- 简化选项显示

---

## 🎯 用户体验优化

### **1. 实时反馈**
- 选择筛选条件时，实时显示结果数量
- 防抖处理，避免频繁重新渲染

### **2. 智能推荐**
- 根据当前筛选条件，推荐相关标签
- 显示"热门筛选组合"

### **3. 筛选历史**
- 记录最近使用的筛选条件
- 提供"恢复上次筛选"功能

### **4. 空状态处理**
- 筛选无结果时，提示用户调整条件
- 提供"清除部分筛选"建议

---

## 📊 性能考虑

### **优化策略**

1. **虚拟滚动**: 大量数据时，只渲染可见卡片
2. **防抖/节流**: 搜索输入防抖 300ms
3. **懒加载**: 标签/投资方选项懒加载
4. **Web Worker**: 大数据集筛选可考虑使用 Worker

---

## 🚀 实施计划

### **Phase 1: MVP** (2-3天)
- [ ] 融资轮次筛选
- [ ] 融资金额区间筛选
- [ ] 标签筛选 (前20个)
- [ ] 基础UI实现
- [ ] 筛选结果统计

### **Phase 2: 增强** (1-2天)
- [ ] 投资方筛选
- [ ] 关键词搜索
- [ ] 已选条件显示 + 快速删除
- [ ] 响应式设计优化

### **Phase 3: 高级** (1-2天)
- [ ] URL状态同步
- [ ] 筛选预设
- [ ] 筛选历史
- [ ] 性能优化

---

## ✅ 接受标准

- [ ] 所有筛选维度正常工作
- [ ] 筛选结果准确无误
- [ ] 移动端体验良好
- [ ] 性能优化 (大数据集<100ms)
- [ ] 筛选状态可保存到URL
- [ ] 无筛选结果时有友好提示

---

## 📝 备注

### **关于"成立时间"和"成立地点"**

由于当前数据源（飞书Bitable）没有这两个字段，有以下选项：

#### **选项1: 从企业介绍中提取** (准确率60-70%)
```javascript
// 提取成立时间
/(\d{4})年.*?成立/
// "2019年成立于..." → 2019

// 提取成立地点
/成立于([^，。]+)/
// "成立于美国旧金山" → 美国旧金山
```

**优点**: 无需修改数据源
**缺点**: 准确率不高，维护成本大

#### **选项2: 在飞书表格新增字段** (推荐)
在飞书Bitable中新增:
- **成立时间** (年份): `2019`
- **成立地点** (城市/国家): `美国旧金山`

**优点**: 数据准确，易于维护
**缺点**: 需要手动补充历史数据

#### **选项3: 暂不实现** (建议)
先实现其他高价值筛选维度，等数据完善后再添加

---

**维护者**: SVTR Team
**最后更新**: 2025-10-16
