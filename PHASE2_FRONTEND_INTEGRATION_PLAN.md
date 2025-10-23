# Phase 2: D1数据库前端集成详细方案

**创建时间**: 2025-10-22
**状态**: ✅ 数据完整就绪，可立即开始实施
**前置条件**: ✅ D1数据库完整部署，包含所有隐藏工作表数据

---

## 📋 目录

1. [集成总览](#集成总览)
2. [数据源映射](#数据源映射)
3. [前端集成位置](#前端集成位置)
4. [API端点设计](#api端点设计)
5. [数据流架构](#数据流架构)
6. [实施路线图](#实施路线图)
7. [技术栈](#技术栈)

---

## 集成总览

### 核心目标

将D1数据库中的**263个知识库节点**（包括40+个隐藏工作表）集成到SVTR前端的**4个关键位置**：

1. **聊天系统RAG增强** - 最高优先级 ⭐⭐⭐⭐⭐
2. **AI创投日报实时数据** - 高优先级 ⭐⭐⭐⭐
3. **数据榜单页面** - 中优先级 ⭐⭐⭐
4. **文章/周报内容页** - 中优先级 ⭐⭐⭐

### 已完成的数据准备

| 数据类型 | 总数 | 内容数量 | D1同步状态 | 隐藏数据 |
|---------|------|----------|-----------|----------|
| **docx文档** | 192 | 完整文章内容 | ✅ 100% | N/A |
| **Bitable多维表** | 2 | 2个数据表 | ✅ 100% | ✅ 无隐藏 |
| **Sheet电子表格** | 65 | 300+工作表 | ✅ 96.9% | ✅ 40+隐藏表已同步 |
| **总数据节点** | **263** | **9,080字符/节点** | ✅ 99.2% | ✅ 完全同步 |

---

## 数据源映射

### D1数据库表结构

```sql
-- 1. 知识库内容表（核心）
CREATE TABLE knowledge_base_content (
  node_token TEXT PRIMARY KEY,      -- 飞书节点唯一ID
  title TEXT,                       -- 节点标题
  obj_type TEXT,                    -- 类型: docx/sheet/bitable
  full_content TEXT,                -- 完整内容（JSON或Markdown）
  summary TEXT,                     -- AI生成摘要
  created_time INTEGER,             -- 创建时间戳
  modified_time INTEGER,            -- 修改时间戳
  parent_node_token TEXT,           -- 父节点ID
  depth INTEGER,                    -- 层级深度
  has_child INTEGER                 -- 是否有子节点
);

-- 2. 发布文章表（待实施）
CREATE TABLE published_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_token TEXT UNIQUE,           -- 关联知识库内容
  slug TEXT UNIQUE,                 -- URL友好的标识符
  meta_title TEXT,                  -- SEO标题
  meta_description TEXT,            -- SEO描述
  category TEXT,                    -- 分类
  tags TEXT,                        -- 标签（JSON数组）
  status TEXT DEFAULT 'draft',      -- draft/published/archived
  view_count INTEGER DEFAULT 0,     -- 浏览次数
  publish_date TEXT,                -- 发布日期
  featured INTEGER DEFAULT 0,       -- 是否精选
  FOREIGN KEY (node_token) REFERENCES knowledge_base_content(node_token)
);

-- 3. Sheet数据快速查询表（待实施）
CREATE TABLE sheet_data_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_token TEXT,                -- Sheet父节点
  worksheet_name TEXT,              -- 工作表名称
  worksheet_id TEXT,                -- 工作表ID
  is_hidden INTEGER DEFAULT 0,      -- 是否隐藏
  data_summary TEXT,                -- 数据摘要
  last_sync_time INTEGER            -- 最后同步时间
);
```

### 现有数据分布

#### 1. 文档类型分布（192个docx）

```
AI周报系列
├── AI周报丨2025 Q3
├── AI周报丨2025 Q2
├── AI周报丨2025 Q1
└── AI周报丨2024系列 (约20篇)

AI融资报告
├── AI融资概览丨季度
├── AI融资概览丨月度
├── AI融资概览丨周度
└── 行业融资专题 (约30篇)

AI创投观察
├── AI创投季度观察
├── AI投资机构分析
├── AI独角兽报告
└── 市场趋势分析 (约50篇)

其他专题
├── YC加速器分析
├── AI人物专访
├── 技术深度分析
└── 行业研究报告 (约90篇)
```

#### 2. Sheet数据分布（65个Sheet，300+工作表）

**核心榜单Sheet**:
- **AI创投榜丨融资** (136,324字符，含隐藏工作表)
- **AI创投榜丨投资** (102,172字符，含隐藏工作表)
- **AI行业概览** (155,400字符，含5个隐藏工作表)
- **AI融资概览** (107,266字符，含3个隐藏工作表：Startup/行业分类/Date)
- **AI创投季度观察** (88,330字符，含7个工作表)
- **SVTR AI估值排行榜** (22,351字符，含9个工作表)

**数据类型**:
- 投资组合数据（隐藏工作表）
- 创始人背景（工作经历/教育背景）
- 投资机构详情
- 行业分类汇总
- 时间序列数据
- 各层级榜单（基础层/模型层/应用层）

#### 3. Bitable数据（2个）

- **交易精选** - 1个数据表 (Deal)
- **大模型丨Transformer论文八子** - 1个数据表 (Attention Is All You Need)

---

## 前端集成位置

### 1. 聊天系统RAG增强 ⭐⭐⭐⭐⭐

**位置**: [index.html:529-538](index.html#L529-L538) - Chat组件

**当前状态**:
```javascript
// assets/js/chat-optimized.js - 当前使用演示模式
getSmartDemoResponse(userQuery) {
  // 静态响应，无实际RAG
  return this.matchResponseBySemantic(query, lang);
}
```

**集成后架构**:
```
用户提问 "AI创投榜丨融资的前10名公司是谁？"
    ↓
chat-optimized.js → fetch('/api/chat')
    ↓
functions/api/chat.ts (已有认证)
    ↓
functions/lib/hybrid-rag-service.ts
    ↓
【新增】D1数据库查询
    ├── 1. 语义搜索 knowledge_base_content (向量检索)
    ├── 2. 关键词匹配 (SQL LIKE/FTS)
    └── 3. Sheet数据快速查询 sheet_data_index
    ↓
【新增】整合Sheet隐藏工作表数据
    ├── 从 "AI创投榜丨融资" 提取 Startup 隐藏表
    ├── 解析JSON数据结构
    └── 提取前10名公司信息
    ↓
Cloudflare Workers AI (已有)
    ↓
流式返回结构化答案
```

**数据来源**:
- `knowledge_base_content` 表 - 完整内容检索
- `sheet_data_index` 表 - 快速定位隐藏工作表
- 隐藏工作表数据（如Startup、投资组合）

**预期效果**:
```
用户: "AI创投榜丨融资的前10名公司是谁？"

AI: "根据SVTR最新的AI创投榜丨融资数据（更新时间：2025-10-20）：

📊 **AI融资TOP 10**

1. **OpenAI** - $13B | 系列轮次 | 美国
   主要投资方：Microsoft, Thrive Capital

2. **Anthropic** - $7.3B | Series D | 美国
   主要投资方：Amazon, Google, Salesforce

3. **xAI** - $6B | Series C | 美国
   主要投资方：Valor Equity, Sequoia Capital

... (继续列出剩余7家)

💡 **数据说明**：
- 数据来源：SVTR AI创投榜 - Startup工作表（包含10,761家公司）
- 排序依据：融资总额
- 更新频率：每周更新

📈 **趋势洞察**：
前10名公司累计融资额超过$50B，占全球AI融资总额的35%...
```

---

### 2. AI创投日报实时数据 ⭐⭐⭐⭐

**位置**: [index.html:453-527](index.html#L453-L527) - 融资日报模块

**当前状态**:
```javascript
// assets/js/funding-daily.js - 当前从Bitable API获取
async function fetchFundingData() {
  const response = await fetch('https://open.feishu.cn/open-apis/bitable/v1/apps/{app_token}/tables/{table_id}/records');
  // 实时API调用，有配额限制
}
```

**集成后架构**:
```
页面加载
    ↓
funding-daily.js → fetch('/api/funding-daily')
    ↓
【新增】functions/api/funding-daily.ts
    ↓
D1数据库查询
    ├── SELECT * FROM funding_daily_cache
    ├── WHERE date >= DATE('now', '-30 days')
    └── ORDER BY funding_amount DESC
    ↓
【缓存策略】
    ├── 如果缓存新鲜 (< 1小时) → 直接返回D1数据
    └── 如果缓存过期 → 后台同步Feishu + 更新D1
    ↓
返回JSON数据
    ↓
前端渲染融资卡片 + 图表
```

**D1表结构**（待创建）:
```sql
CREATE TABLE funding_daily_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  funding_amount TEXT,
  funding_stage TEXT,
  investors TEXT,              -- JSON数组
  industry_tags TEXT,          -- JSON数组
  announcement_date TEXT,
  company_description TEXT,
  logo_url TEXT,
  company_url TEXT,
  cache_time INTEGER,          -- 缓存时间戳
  source TEXT DEFAULT 'feishu' -- 数据来源
);

CREATE INDEX idx_funding_date ON funding_daily_cache(announcement_date);
CREATE INDEX idx_funding_stage ON funding_daily_cache(funding_stage);
```

**API端点设计**:
```typescript
// functions/api/funding-daily.ts
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // 支持筛选参数
  const filters = {
    stage: url.searchParams.get('stage'),      // Pre-Seed, Seed, Series A...
    days: url.searchParams.get('days') || 30,  // 默认30天
    tags: url.searchParams.get('tags')?.split(',') // 行业标签
  };

  // 从D1查询
  let query = `
    SELECT * FROM funding_daily_cache
    WHERE announcement_date >= DATE('now', '-${filters.days} days')
  `;

  if (filters.stage) {
    query += ` AND funding_stage = '${filters.stage}'`;
  }

  const results = await env.DB.prepare(query).all();

  return Response.json({
    success: true,
    data: results.results,
    cached: true,
    cache_time: new Date().toISOString()
  });
}
```

**预期效果**:
- ⚡ 加载速度从**2-3秒**降至**200-300ms**
- 📊 实时图表生成（融资轮次分布、金额区间占比）
- 🏷️ 支持筛选：轮次、行业标签、时间范围
- 💾 减少飞书API调用（从每次访问 → 每小时1次）

---

### 3. 数据榜单页面 ⭐⭐⭐

**位置**: [index.html:320-325](index.html#L320-L325) - 侧边栏数据产品导航

**当前链接**:
```html
<li><a href="https://svtrglobal.feishu.cn/wiki/..." target="_blank">AI融资榜</a></li>
<li><a href="https://svtrglobal.feishu.cn/wiki/..." target="_blank">AI投资榜</a></li>
```

**集成后架构**:
```
用户点击 "AI融资榜"
    ↓
跳转到 /pages/ai-funding-ranking.html (新建页面)
    ↓
fetch('/api/rankings/funding')
    ↓
【新增】functions/api/rankings/funding.ts
    ↓
D1数据库查询
    ├── 主查询：knowledge_base_content (node_token = 'AI创投榜丨融资')
    ├── 解析 full_content (JSON格式的Sheet数据)
    └── 提取隐藏工作表 "Startup" 的完整数据
    ↓
【数据处理】
    ├── 按融资额排序
    ├── 提取关键字段：公司名/融资额/轮次/投资方
    ├── 分页处理（每页50条）
    └── 生成快照统计（总公司数/总融资额/平均融资额）
    ↓
返回结构化JSON
    ↓
前端渲染交互式榜单
    ├── 可排序表格（融资额/时间/轮次）
    ├── 搜索过滤
    ├── 导出功能（CSV/Excel）
    └── 图表可视化
```

**新建页面**:
- `/pages/ai-funding-ranking.html` - AI融资榜
- `/pages/ai-investment-ranking.html` - AI投资榜
- `/pages/ai-valuation-ranking.html` - AI估值排行榜

**数据来源映射**:

| 榜单页面 | D1数据源 | 隐藏工作表 | 数据量 |
|---------|---------|-----------|--------|
| AI融资榜 | AI创投榜丨融资 | Startup表 | 136KB, 10,000+条 |
| AI投资榜 | AI创投榜丨投资 | 投资机构表 | 102KB, 1,000+机构 |
| AI估值排行榜 | SVTR AI估值排行榜 | 基础层/模型层/应用层投资组合 | 22KB, 分层数据 |

**API端点**:
```typescript
// functions/api/rankings/[type].ts
// type = funding | investment | valuation

export async function onRequest(context) {
  const { env, params, request } = context;
  const rankingType = params.type; // funding/investment/valuation
  const url = new URL(request.url);

  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
  const sortBy = url.searchParams.get('sortBy') || 'funding_amount';
  const order = url.searchParams.get('order') || 'DESC';

  // 映射到D1节点
  const nodeMapping = {
    funding: 'AI创投榜丨融资',
    investment: 'AI创投榜丨投资',
    valuation: 'SVTR AI估值排行榜'
  };

  // 查询D1
  const node = await env.DB.prepare(`
    SELECT full_content
    FROM knowledge_base_content
    WHERE title = ?
  `).bind(nodeMapping[rankingType]).first();

  // 解析Sheet数据（JSON格式）
  const sheetData = JSON.parse(node.full_content);
  const startupData = sheetData.worksheets.find(w => w.name === 'Startup');

  // 排序和分页
  const sorted = startupData.rows.sort((a, b) => {
    // 按指定字段排序
  });

  const paginatedData = sorted.slice((page - 1) * pageSize, page * pageSize);

  return Response.json({
    success: true,
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / pageSize)
    },
    stats: {
      totalCompanies: sorted.length,
      totalFunding: calculateTotal(sorted),
      avgFunding: calculateAverage(sorted)
    }
  });
}
```

---

### 4. 文章/周报内容页 ⭐⭐⭐

**位置**: 新建独立页面系统

**集成架构**:
```
用户点击 "AI周报丨2025 Q3"
    ↓
跳转到 /pages/articles/ai-weekly-2025-q3-StZ4wqMc.html
    ↓
【静态HTML生成】构建时预渲染
    ├── 从D1查询文章内容
    ├── 生成静态HTML（SEO友好）
    └── 包含元数据、结构化数据
    ↓
【动态数据】页面加载后
    ├── fetch('/api/articles/ai-weekly-2025-q3-StZ4wqMc')
    ├── 更新浏览计数
    ├── 加载相关推荐
    └── 加载评论/讨论
```

**D1表扩展**:
```sql
-- 文章元数据表（已规划）
CREATE TABLE published_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_token TEXT UNIQUE,
  slug TEXT UNIQUE,                 -- ai-weekly-2025-q3-StZ4wqMc
  meta_title TEXT,
  meta_description TEXT,
  category TEXT,                    -- AI周报/融资报告/创投观察
  tags TEXT,                        -- ["AI", "融资", "2025Q3"]
  status TEXT DEFAULT 'published',
  view_count INTEGER DEFAULT 0,
  publish_date TEXT,
  author TEXT,
  reading_time INTEGER,             -- 预估阅读时间（分钟）
  featured INTEGER DEFAULT 0,
  FOREIGN KEY (node_token) REFERENCES knowledge_base_content(node_token)
);

-- 文章关联推荐表
CREATE TABLE article_related (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  related_article_id INTEGER,
  similarity_score REAL,            -- 相似度分数
  FOREIGN KEY (article_id) REFERENCES published_articles(id),
  FOREIGN KEY (related_article_id) REFERENCES published_articles(id)
);
```

**API端点**:
```typescript
// functions/api/articles/[slug].ts
export async function onRequest(context) {
  const { env, params } = context;
  const slug = params.slug;

  // 查询文章
  const article = await env.DB.prepare(`
    SELECT
      a.id,
      a.slug,
      a.meta_title,
      a.meta_description,
      a.category,
      a.tags,
      a.view_count,
      a.publish_date,
      a.author,
      a.reading_time,
      c.full_content
    FROM published_articles a
    JOIN knowledge_base_content c ON a.node_token = c.node_token
    WHERE a.slug = ? AND a.status = 'published'
  `).bind(slug).first();

  if (!article) {
    return new Response('文章未找到', { status: 404 });
  }

  // 更新浏览计数
  await env.DB.prepare(`
    UPDATE published_articles
    SET view_count = view_count + 1
    WHERE slug = ?
  `).bind(slug).run();

  // 查询相关文章
  const relatedArticles = await env.DB.prepare(`
    SELECT
      pa.slug,
      pa.meta_title,
      pa.category,
      pa.publish_date,
      ar.similarity_score
    FROM article_related ar
    JOIN published_articles pa ON ar.related_article_id = pa.id
    WHERE ar.article_id = ?
    ORDER BY ar.similarity_score DESC
    LIMIT 5
  `).bind(article.id).all();

  return Response.json({
    success: true,
    data: {
      ...article,
      tags: JSON.parse(article.tags || '[]'),
      relatedArticles: relatedArticles.results
    }
  });
}
```

---

## API端点设计

### 端点总览

| 端点 | 方法 | 功能 | 优先级 | 状态 |
|------|------|------|--------|------|
| `/api/chat` | POST | 聊天RAG增强 | ⭐⭐⭐⭐⭐ | ✅ 已有框架 |
| `/api/funding-daily` | GET | 融资日报缓存 | ⭐⭐⭐⭐ | ❌ 待开发 |
| `/api/rankings/[type]` | GET | 榜单数据 | ⭐⭐⭐ | ❌ 待开发 |
| `/api/articles/[slug]` | GET | 文章内容 | ⭐⭐⭐ | ❌ 待开发 |
| `/api/articles` | GET | 文章列表 | ⭐⭐ | ❌ 待开发 |
| `/api/search` | GET | 全站搜索 | ⭐⭐ | ❌ 待开发 |
| `/api/sync/knowledge-base` | POST | 手动同步 | ⭐ | ❌ 待开发 |

### 详细API规范

#### 1. `/api/chat` - 聊天RAG增强

**现有代码**: [functions/api/chat.ts](functions/api/chat.ts)

**需要修改**:
```typescript
// 添加D1数据库查询
import { HybridRAGService } from '../lib/hybrid-rag-service';

export async function onRequestPost(context: any): Promise<Response> {
  const { request, env } = context;

  // 现有认证逻辑 ✅
  const authResult = await validateAuth(request, env);
  if (!authResult.isValid) {
    return new Response(JSON.stringify({ error: 'AUTH_REQUIRED' }), { status: 401 });
  }

  const body = await request.json();
  const { messages } = body;
  const userQuery = messages[messages.length - 1]?.content || '';

  // 【新增】D1数据库RAG检索
  const ragService = new HybridRAGService(env.DB);
  const relevantContext = await ragService.retrieve(userQuery, {
    maxResults: 5,
    includeHiddenSheets: true,  // 包含隐藏工作表数据
    searchTables: ['knowledge_base_content', 'sheet_data_index']
  });

  // 【新增】构建增强提示词
  const enhancedSystemPrompt = `你是SVTR AI创投助手。

**知识库上下文**：
${relevantContext.map((ctx, i) => `
${i + 1}. 【${ctx.title}】(${ctx.obj_type})
${ctx.summary || ctx.content.substring(0, 200)}
`).join('\n')}

请基于以上实时数据回答用户问题。`;

  // 现有AI调用逻辑 ✅
  const simpleMessages = [
    { role: 'system', content: enhancedSystemPrompt },
    ...messages
  ];

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: simpleMessages,
    stream: true
  });

  return new Response(response, { headers: responseHeaders });
}
```

**D1查询示例**:
```typescript
// functions/lib/hybrid-rag-service.ts
export class HybridRAGService {
  constructor(private db: D1Database) {}

  async retrieve(query: string, options: RetrievalOptions) {
    // 1. 关键词匹配
    const keywordResults = await this.db.prepare(`
      SELECT
        node_token,
        title,
        obj_type,
        full_content,
        summary
      FROM knowledge_base_content
      WHERE title LIKE ? OR summary LIKE ?
      LIMIT ?
    `).bind(`%${query}%`, `%${query}%`, options.maxResults).all();

    // 2. Sheet数据快速查询（如果包含隐藏工作表）
    if (options.includeHiddenSheets) {
      const sheetResults = await this.db.prepare(`
        SELECT
          kb.node_token,
          kb.title,
          kb.full_content,
          si.worksheet_name,
          si.is_hidden,
          si.data_summary
        FROM knowledge_base_content kb
        JOIN sheet_data_index si ON kb.node_token = si.parent_token
        WHERE si.worksheet_name LIKE ? OR si.data_summary LIKE ?
        LIMIT ?
      `).bind(`%${query}%`, `%${query}%`, options.maxResults).all();

      keywordResults.results.push(...sheetResults.results);
    }

    // 3. 返回结果
    return keywordResults.results.map(row => ({
      node_token: row.node_token,
      title: row.title,
      obj_type: row.obj_type,
      content: row.full_content,
      summary: row.summary || this.generateSummary(row.full_content)
    }));
  }

  private generateSummary(content: string): string {
    // 简单摘要生成（取前200字符）
    return content.substring(0, 200) + '...';
  }
}
```

#### 2. `/api/funding-daily` - 融资日报

**新建文件**: `functions/api/funding-daily.ts`

```typescript
interface FundingDailyRecord {
  id: number;
  company_name: string;
  funding_amount: string;
  funding_stage: string;
  investors: string[];
  industry_tags: string[];
  announcement_date: string;
  company_description: string;
  logo_url: string;
  company_url: string;
}

export async function onRequest(context: any): Promise<Response> {
  const { env, request } = context;
  const url = new URL(request.url);

  // 解析查询参数
  const filters = {
    stage: url.searchParams.get('stage'),
    days: parseInt(url.searchParams.get('days') || '30'),
    tags: url.searchParams.get('tags')?.split(','),
    limit: parseInt(url.searchParams.get('limit') || '50')
  };

  // 构建SQL查询
  let query = `
    SELECT * FROM funding_daily_cache
    WHERE announcement_date >= DATE('now', '-${filters.days} days')
  `;

  const bindings: any[] = [];

  if (filters.stage) {
    query += ` AND funding_stage = ?`;
    bindings.push(filters.stage);
  }

  if (filters.tags && filters.tags.length > 0) {
    query += ` AND industry_tags LIKE ?`;
    bindings.push(`%${filters.tags[0]}%`);
  }

  query += ` ORDER BY announcement_date DESC LIMIT ?`;
  bindings.push(filters.limit);

  // 执行查询
  const results = await env.DB.prepare(query)
    .bind(...bindings)
    .all();

  // 解析JSON字段
  const records: FundingDailyRecord[] = results.results.map((row: any) => ({
    ...row,
    investors: JSON.parse(row.investors || '[]'),
    industry_tags: JSON.parse(row.industry_tags || '[]')
  }));

  // 计算统计数据
  const stats = {
    total_count: records.length,
    total_funding: records.reduce((sum, r) => {
      const amount = parseFundingAmount(r.funding_amount);
      return sum + (amount || 0);
    }, 0),
    stage_distribution: calculateStageDistribution(records),
    tag_distribution: calculateTagDistribution(records)
  };

  return Response.json({
    success: true,
    data: records,
    stats,
    filters,
    cached: true,
    cache_time: new Date().toISOString()
  });
}

// 辅助函数
function parseFundingAmount(amount: string): number | null {
  // 解析 "$100M", "$1.5B" 等格式
  const match = amount.match(/\$?([\d.]+)\s*([MBK])/i);
  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = { 'K': 1000, 'M': 1000000, 'B': 1000000000 };
  return value * (multipliers[unit] || 1);
}

function calculateStageDistribution(records: FundingDailyRecord[]) {
  const distribution: Record<string, number> = {};
  records.forEach(r => {
    distribution[r.funding_stage] = (distribution[r.funding_stage] || 0) + 1;
  });
  return distribution;
}

function calculateTagDistribution(records: FundingDailyRecord[]) {
  const distribution: Record<string, number> = {};
  records.forEach(r => {
    r.industry_tags.forEach(tag => {
      distribution[tag] = (distribution[tag] || 0) + 1;
    });
  });
  return distribution;
}
```

#### 3. `/api/rankings/[type]` - 榜单数据

**新建文件**: `functions/api/rankings/[type].ts`

```typescript
export async function onRequest(context: any): Promise<Response> {
  const { env, params, request } = context;
  const rankingType = params.type; // funding | investment | valuation
  const url = new URL(request.url);

  // 分页参数
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
  const sortBy = url.searchParams.get('sortBy') || 'funding_amount';
  const order = url.searchParams.get('order') || 'DESC';

  // 映射到D1节点
  const nodeMapping: Record<string, string> = {
    funding: 'AI创投榜丨融资',
    investment: 'AI创投榜丨投资',
    valuation: 'SVTR AI估值排行榜'
  };

  const nodeTitle = nodeMapping[rankingType];
  if (!nodeTitle) {
    return new Response('Invalid ranking type', { status: 400 });
  }

  // 查询D1
  const node = await env.DB.prepare(`
    SELECT full_content
    FROM knowledge_base_content
    WHERE title = ?
  `).bind(nodeTitle).first();

  if (!node) {
    return new Response('Ranking data not found', { status: 404 });
  }

  // 解析Sheet数据（假设存储为JSON）
  const sheetData = JSON.parse(node.full_content);

  // 提取Startup隐藏工作表（融资榜）
  const worksheetName = rankingType === 'funding' ? 'Startup' :
                        rankingType === 'investment' ? '投资机构' :
                        '概览';

  const worksheet = sheetData.worksheets.find((w: any) =>
    w.name === worksheetName || w.title === worksheetName
  );

  if (!worksheet) {
    return new Response('Worksheet not found', { status: 404 });
  }

  // 排序
  let rows = worksheet.rows;
  rows.sort((a: any, b: any) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    // 处理数值排序（如融资额）
    if (sortBy === 'funding_amount') {
      const aNum = parseFundingAmount(aVal);
      const bNum = parseFundingAmount(bVal);
      return order === 'DESC' ? bNum - aNum : aNum - bNum;
    }

    // 处理字符串排序
    return order === 'DESC' ?
      String(bVal).localeCompare(String(aVal)) :
      String(aVal).localeCompare(String(bVal));
  });

  // 分页
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRows = rows.slice(startIndex, endIndex);

  // 统计数据
  const stats = {
    totalCompanies: rows.length,
    totalFunding: rows.reduce((sum: number, row: any) => {
      const amount = parseFundingAmount(row.funding_amount);
      return sum + (amount || 0);
    }, 0),
    avgFunding: 0
  };
  stats.avgFunding = stats.totalFunding / stats.totalCompanies;

  return Response.json({
    success: true,
    data: paginatedRows,
    pagination: {
      page,
      pageSize,
      total: rows.length,
      totalPages: Math.ceil(rows.length / pageSize)
    },
    stats,
    sortBy,
    order
  });
}
```

#### 4. `/api/articles/[slug]` - 文章内容

**新建文件**: `functions/api/articles/[slug].ts`

```typescript
export async function onRequest(context: any): Promise<Response> {
  const { env, params } = context;
  const slug = params.slug;

  // 查询文章
  const article = await env.DB.prepare(`
    SELECT
      a.id,
      a.slug,
      a.meta_title,
      a.meta_description,
      a.category,
      a.tags,
      a.view_count,
      a.publish_date,
      a.author,
      a.reading_time,
      c.full_content,
      c.title as original_title
    FROM published_articles a
    JOIN knowledge_base_content c ON a.node_token = c.node_token
    WHERE a.slug = ? AND a.status = 'published'
  `).bind(slug).first();

  if (!article) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Article not found'
    }), { status: 404 });
  }

  // 更新浏览计数（异步，不阻塞响应）
  env.DB.prepare(`
    UPDATE published_articles
    SET view_count = view_count + 1
    WHERE slug = ?
  `).bind(slug).run().catch(err => {
    console.error('Failed to update view count:', err);
  });

  // 查询相关文章
  const relatedArticles = await env.DB.prepare(`
    SELECT
      pa.slug,
      pa.meta_title,
      pa.category,
      pa.publish_date,
      ar.similarity_score
    FROM article_related ar
    JOIN published_articles pa ON ar.related_article_id = pa.id
    WHERE ar.article_id = ?
    ORDER BY ar.similarity_score DESC
    LIMIT 5
  `).bind(article.id).all();

  return Response.json({
    success: true,
    data: {
      id: article.id,
      slug: article.slug,
      title: article.meta_title,
      description: article.meta_description,
      category: article.category,
      tags: JSON.parse(article.tags || '[]'),
      viewCount: article.view_count,
      publishDate: article.publish_date,
      author: article.author,
      readingTime: article.reading_time,
      content: article.full_content,
      relatedArticles: relatedArticles.results.map((ra: any) => ({
        slug: ra.slug,
        title: ra.meta_title,
        category: ra.category,
        publishDate: ra.publish_date
      }))
    }
  });
}
```

#### 5. `/api/articles` - 文章列表

**新建文件**: `functions/api/articles/index.ts`

```typescript
export async function onRequest(context: any): Promise<Response> {
  const { env, request } = context;
  const url = new URL(request.url);

  // 查询参数
  const category = url.searchParams.get('category');
  const tag = url.searchParams.get('tag');
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const featured = url.searchParams.get('featured') === 'true';

  // 构建查询
  let query = `
    SELECT
      id,
      slug,
      meta_title,
      meta_description,
      category,
      tags,
      view_count,
      publish_date,
      author,
      reading_time,
      featured
    FROM published_articles
    WHERE status = 'published'
  `;

  const bindings: any[] = [];

  if (category) {
    query += ` AND category = ?`;
    bindings.push(category);
  }

  if (tag) {
    query += ` AND tags LIKE ?`;
    bindings.push(`%"${tag}"%`);
  }

  if (featured) {
    query += ` AND featured = 1`;
  }

  query += ` ORDER BY publish_date DESC`;
  query += ` LIMIT ? OFFSET ?`;
  bindings.push(pageSize, (page - 1) * pageSize);

  // 执行查询
  const results = await env.DB.prepare(query).bind(...bindings).all();

  // 获取总数
  const totalQuery = `
    SELECT COUNT(*) as total
    FROM published_articles
    WHERE status = 'published'
    ${category ? 'AND category = ?' : ''}
    ${tag ? 'AND tags LIKE ?' : ''}
    ${featured ? 'AND featured = 1' : ''}
  `;

  const totalBindings: any[] = [];
  if (category) totalBindings.push(category);
  if (tag) totalBindings.push(`%"${tag}"%`);

  const totalResult = await env.DB.prepare(totalQuery)
    .bind(...totalBindings)
    .first();

  const total = totalResult?.total || 0;

  return Response.json({
    success: true,
    data: results.results.map((article: any) => ({
      ...article,
      tags: JSON.parse(article.tags || '[]')
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}
```

---

## 数据流架构

### 整体数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                    用户访问 SVTR.AI                          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
   ┌────▼────┐              ┌──────▼──────┐
   │ 聊天系统 │              │  页面浏览    │
   │ (Chat)  │              │  (Browse)   │
   └────┬────┘              └──────┬──────┘
        │                          │
        │ POST /api/chat           │ GET /api/...
        │                          │
   ┌────▼──────────────────────────▼─────┐
   │   Cloudflare Workers Functions      │
   │   ├── chat.ts (RAG增强)             │
   │   ├── funding-daily.ts (融资日报)   │
   │   ├── rankings/[type].ts (榜单)     │
   │   └── articles/[slug].ts (文章)     │
   └────┬──────────────────────────┬─────┘
        │                          │
        │ SQL查询                   │ 缓存检查
        │                          │
   ┌────▼──────────────────────────▼─────┐
   │        D1 Database (SQLite)         │
   │   ├── knowledge_base_content        │
   │   │   ├── 192 docx (文章)           │
   │   │   ├── 65 Sheet (榜单)           │
   │   │   └── 2 Bitable (专题)          │
   │   ├── published_articles            │
   │   ├── funding_daily_cache           │
   │   └── sheet_data_index              │
   └────┬──────────────────────────┬─────┘
        │                          │
        │ 如果缓存过期               │ 定时同步
        │                          │
   ┌────▼──────────────────────────▼─────┐
   │        Feishu Knowledge Base        │
   │   ├── 飞书知识库 (原始数据)          │
   │   ├── 飞书多维表 (实时融资)          │
   │   └── Webhook通知 (数据更新)        │
   └────────────────────────────────────┘
```

### 缓存策略

```
┌──────────────────────────────────────┐
│          请求到达                     │
└────────────┬─────────────────────────┘
             │
   ┌─────────▼─────────┐
   │ 检查D1缓存         │
   │ cache_time字段    │
   └─────────┬─────────┘
             │
     ┌───────┴────────┐
     │                │
  缓存新鲜          缓存过期
  (< 1小时)         (> 1小时)
     │                │
     │           ┌────▼────┐
     │           │后台同步  │
     │           │飞书API  │
     │           └────┬────┘
     │                │
     │           ┌────▼────┐
     │           │更新D1   │
     │           │缓存     │
     │           └────┬────┘
     │                │
     └────────┬───────┘
              │
       ┌──────▼──────┐
       │ 返回D1数据  │
       └─────────────┘
```

**缓存更新触发条件**:
1. **定时同步** - Cron每小时执行一次 `functions/_scheduled/funding-daily-update.ts`
2. **手动触发** - 管理后台手动点击"同步数据"
3. **Webhook触发** - 飞书知识库更新时自动推送到 `functions/api/feishu-webhook.ts`

### 性能优化

| 优化策略 | 实施方法 | 预期效果 |
|---------|---------|---------|
| **D1查询缓存** | 使用Cloudflare KV存储热门查询结果 | 响应时间 < 50ms |
| **SQL索引优化** | 为常查询字段创建索引 | 查询速度提升5-10倍 |
| **分页查询** | LIMIT + OFFSET | 减少数据传输量 |
| **JSON字段解析** | 使用JSON_EXTRACT函数 | 避免完整解析 |
| **异步更新** | 浏览计数等异步写入 | 不阻塞主响应 |

---

## 实施路线图

### Phase 2.1: 聊天系统RAG增强 (Week 1-2)

**目标**: 让聊天系统能够检索D1数据并回答精确问题

#### 任务清单

**Week 1: 基础架构**
- [ ] 1.1 创建 `HybridRAGService` 类 (2天)
  - [ ] 实现关键词匹配查询
  - [ ] 实现Sheet数据解析
  - [ ] 实现隐藏工作表数据提取
  - [ ] 单元测试覆盖

- [ ] 1.2 修改 `functions/api/chat.ts` (1天)
  - [ ] 集成HybridRAGService
  - [ ] 构建增强提示词
  - [ ] 测试流式响应

- [ ] 1.3 创建D1索引 (0.5天)
  ```sql
  CREATE INDEX idx_kb_title ON knowledge_base_content(title);
  CREATE INDEX idx_kb_objtype ON knowledge_base_content(obj_type);
  CREATE INDEX idx_kb_content_fts ON knowledge_base_content_fts(full_content);
  ```

**Week 2: 测试和优化**
- [ ] 2.1 功能测试 (2天)
  - [ ] 测试问题："AI创投榜丨融资的前10名公司是谁？"
  - [ ] 测试问题："OpenAI的最新融资金额是多少？"
  - [ ] 测试问题："2025年Q3有哪些值得关注的AI周报？"
  - [ ] 验证隐藏工作表数据能被检索

- [ ] 2.2 性能优化 (1天)
  - [ ] SQL查询优化（Explain Analyze）
  - [ ] 响应时间监控
  - [ ] 缓存策略实施

- [ ] 2.3 用户验收测试 (1天)
  - [ ] 内部团队测试
  - [ ] 收集反馈
  - [ ] 调优

**交付物**:
- ✅ 聊天系统能实时检索D1数据
- ✅ 响应时间 < 3秒
- ✅ 准确率 > 85%

---

### Phase 2.2: 融资日报D1缓存 (Week 3)

**目标**: 将AI创投日报从实时API改为D1缓存

#### 任务清单

- [ ] 3.1 创建D1表结构 (0.5天)
  ```sql
  CREATE TABLE funding_daily_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT,
    funding_amount TEXT,
    funding_stage TEXT,
    investors TEXT,
    industry_tags TEXT,
    announcement_date TEXT,
    company_description TEXT,
    logo_url TEXT,
    company_url TEXT,
    cache_time INTEGER,
    source TEXT DEFAULT 'feishu'
  );

  CREATE INDEX idx_funding_date ON funding_daily_cache(announcement_date);
  CREATE INDEX idx_funding_stage ON funding_daily_cache(funding_stage);
  ```

- [ ] 3.2 创建同步脚本 (1天)
  - [ ] `scripts/sync-funding-daily-to-d1.js`
  - [ ] 从飞书Bitable获取最新30天数据
  - [ ] 写入D1数据库
  - [ ] 测试数据完整性

- [ ] 3.3 创建API端点 (1天)
  - [ ] `functions/api/funding-daily.ts`
  - [ ] 实现筛选逻辑（stage/tags/days）
  - [ ] 实现统计计算
  - [ ] 测试API响应

- [ ] 3.4 修改前端代码 (1天)
  - [ ] 修改 `assets/js/funding-daily.js`
  - [ ] 从飞书API改为调用 `/api/funding-daily`
  - [ ] 测试图表生成
  - [ ] 测试筛选功能

- [ ] 3.5 设置Cron定时同步 (0.5天)
  - [ ] `functions/_scheduled/funding-daily-update.ts`
  - [ ] 每小时执行一次
  - [ ] 配置wrangler.toml

**交付物**:
- ✅ 融资日报页面加载时间 < 300ms
- ✅ 数据实时性 < 1小时
- ✅ 飞书API调用减少99%

---

### Phase 2.3: 榜单页面开发 (Week 4-5)

**目标**: 创建独立榜单页面，展示D1数据

#### 任务清单

**Week 4: 后端API**
- [ ] 4.1 创建API端点 (2天)
  - [ ] `functions/api/rankings/funding.ts` - AI融资榜
  - [ ] `functions/api/rankings/investment.ts` - AI投资榜
  - [ ] `functions/api/rankings/valuation.ts` - AI估值榜
  - [ ] 实现排序、分页、筛选逻辑

- [ ] 4.2 Sheet数据解析 (1天)
  - [ ] 解析JSON格式的Sheet数据
  - [ ] 提取隐藏工作表（Startup/投资组合）
  - [ ] 数据清洗和格式化

- [ ] 4.3 API测试 (1天)
  - [ ] 单元测试
  - [ ] 集成测试
  - [ ] 性能测试

**Week 5: 前端页面**
- [ ] 5.1 创建HTML页面 (2天)
  - [ ] `pages/ai-funding-ranking.html`
  - [ ] `pages/ai-investment-ranking.html`
  - [ ] `pages/ai-valuation-ranking.html`
  - [ ] 响应式布局

- [ ] 5.2 实现交互功能 (2天)
  - [ ] 排序（点击列标题）
  - [ ] 分页（上一页/下一页）
  - [ ] 搜索（公司名/轮次）
  - [ ] 导出（CSV/Excel）

- [ ] 5.3 图表可视化 (1天)
  - [ ] 使用Chart.js或ECharts
  - [ ] 融资额分布饼图
  - [ ] 轮次分布柱状图
  - [ ] 时间趋势折线图

**交付物**:
- ✅ 3个独立榜单页面
- ✅ 支持10,000+条数据快速加载
- ✅ 交互流畅，响应时间 < 1秒

---

### Phase 2.4: 文章系统 (Week 6-7)

**目标**: 建立文章发布和浏览系统

#### 任务清单

**Week 6: 数据模型和API**
- [ ] 6.1 创建D1表结构 (0.5天)
  ```sql
  CREATE TABLE published_articles (...);
  CREATE TABLE article_related (...);
  ```

- [ ] 6.2 数据导入脚本 (1天)
  - [ ] 从 `knowledge_base_content` 提取docx类型
  - [ ] 生成SEO友好的slug
  - [ ] 创建元数据（标题/描述/标签）
  - [ ] 计算相关文章（基于标签相似度）

- [ ] 6.3 创建API端点 (2天)
  - [ ] `/api/articles` - 文章列表
  - [ ] `/api/articles/[slug]` - 文章详情
  - [ ] 实现浏览计数
  - [ ] 实现相关推荐

**Week 7: 前端页面**
- [ ] 7.1 文章列表页 (1天)
  - [ ] `pages/articles.html`
  - [ ] 卡片式布局
  - [ ] 分类筛选
  - [ ] 标签筛选

- [ ] 7.2 文章详情页 (2天)
  - [ ] `pages/articles/[slug].html`
  - [ ] Markdown渲染
  - [ ] 目录导航
  - [ ] 相关推荐
  - [ ] 社交分享

- [ ] 7.3 SEO优化 (1天)
  - [ ] Open Graph标签
  - [ ] Twitter Card
  - [ ] JSON-LD结构化数据
  - [ ] 面包屑导航

**交付物**:
- ✅ 文章发布系统
- ✅ SEO优化完成
- ✅ 192篇文章可浏览

---

### Phase 2.5: 测试和上线 (Week 8)

**目标**: 全面测试和生产部署

#### 任务清单

- [ ] 8.1 功能测试 (2天)
  - [ ] 聊天系统RAG准确性测试
  - [ ] 融资日报数据完整性测试
  - [ ] 榜单页面交互测试
  - [ ] 文章系统浏览测试
  - [ ] 跨浏览器兼容性测试

- [ ] 8.2 性能测试 (1天)
  - [ ] Lighthouse性能评分 (目标 > 90)
  - [ ] API响应时间监控 (目标 < 1s)
  - [ ] D1查询性能分析
  - [ ] 并发压力测试

- [ ] 8.3 安全审计 (1天)
  - [ ] SQL注入检测
  - [ ] XSS漏洞扫描
  - [ ] CSRF保护验证
  - [ ] 敏感数据加密检查

- [ ] 8.4 生产部署 (1天)
  - [ ] 备份D1数据库
  - [ ] 部署到Cloudflare Pages
  - [ ] DNS配置验证
  - [ ] SSL证书检查
  - [ ] 监控告警配置

**交付物**:
- ✅ Phase 2完整上线
- ✅ 性能指标达标
- ✅ 安全审计通过

---

## 技术栈

### 前端技术

| 技术 | 用途 | 文件位置 |
|------|------|---------|
| **HTML5** | 页面结构 | `index.html`, `pages/*.html` |
| **CSS3** | 样式设计 | `assets/css/*.css` |
| **JavaScript (ES2022)** | 交互逻辑 | `assets/js/*.js` |
| **Chart.js / ECharts** | 数据可视化 | 融资日报图表 |
| **Markdown渲染** | 文章内容 | 文章详情页 |

### 后端技术

| 技术 | 用途 | 文件位置 |
|------|------|---------|
| **Cloudflare Workers** | Serverless函数 | `functions/api/*.ts` |
| **TypeScript** | 类型安全 | 所有`.ts`文件 |
| **D1 Database** | SQLite数据库 | Cloudflare管理 |
| **Workers AI** | LLM推理 | `functions/api/chat.ts` |
| **Cloudflare KV** | 缓存存储 | 认证、会话 |

### 数据同步

| 技术 | 用途 | 文件位置 |
|------|------|---------|
| **Node.js脚本** | 数据同步 | `scripts/*.js` |
| **飞书API** | 数据源 | `scripts/enhanced-feishu-sync-v3.js` |
| **Cron Jobs** | 定时任务 | `functions/_scheduled/*.ts` |
| **Webhooks** | 实时通知 | `functions/api/feishu-webhook.ts` |

---

## 风险和缓解策略

### 技术风险

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|---------|
| **D1查询性能** | 响应慢 | 中 | SQL优化、索引、缓存 |
| **数据同步延迟** | 数据不实时 | 低 | Webhook通知、Cron频率提高 |
| **飞书API限制** | 同步失败 | 中 | 重试机制、错误处理 |
| **D1存储限制** | 数据库满 | 低 | 定期清理、归档策略 |

### 业务风险

| 风险 | 影响 | 概率 | 缓解策略 |
|------|------|------|---------|
| **用户体验下降** | 用户流失 | 中 | AB测试、灰度发布 |
| **SEO排名下降** | 流量减少 | 低 | SEO审计、元数据优化 |
| **数据准确性** | 信任度降低 | 低 | 数据质量检查、人工审核 |

---

## 成功指标

### 性能指标

| 指标 | 当前 | 目标 | 测量方法 |
|------|------|------|---------|
| **聊天响应时间** | 3-5秒 | < 3秒 | 平均响应时间 |
| **融资日报加载** | 2-3秒 | < 300ms | Lighthouse |
| **榜单页面加载** | N/A | < 1秒 | Lighthouse |
| **API可用性** | N/A | > 99.9% | Uptime监控 |

### 业务指标

| 指标 | 目标 | 测量方法 |
|------|------|---------|
| **RAG准确率** | > 85% | 人工评估 |
| **用户满意度** | > 4.5/5 | 用户调查 |
| **页面浏览量** | +30% | Google Analytics |
| **会话时长** | +20% | Google Analytics |

---

## 附录

### A. D1数据库完整Schema

```sql
-- 知识库内容表
CREATE TABLE knowledge_base_content (
  node_token TEXT PRIMARY KEY,
  title TEXT,
  obj_type TEXT,
  full_content TEXT,
  summary TEXT,
  created_time INTEGER,
  modified_time INTEGER,
  parent_node_token TEXT,
  depth INTEGER,
  has_child INTEGER
);

CREATE INDEX idx_kb_title ON knowledge_base_content(title);
CREATE INDEX idx_kb_objtype ON knowledge_base_content(obj_type);

-- 发布文章表
CREATE TABLE published_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_token TEXT UNIQUE,
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
  category TEXT,
  tags TEXT,
  status TEXT DEFAULT 'draft',
  view_count INTEGER DEFAULT 0,
  publish_date TEXT,
  author TEXT,
  reading_time INTEGER,
  featured INTEGER DEFAULT 0,
  FOREIGN KEY (node_token) REFERENCES knowledge_base_content(node_token)
);

CREATE INDEX idx_article_slug ON published_articles(slug);
CREATE INDEX idx_article_category ON published_articles(category);
CREATE INDEX idx_article_publish_date ON published_articles(publish_date);

-- 文章关联推荐表
CREATE TABLE article_related (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER,
  related_article_id INTEGER,
  similarity_score REAL,
  FOREIGN KEY (article_id) REFERENCES published_articles(id),
  FOREIGN KEY (related_article_id) REFERENCES published_articles(id)
);

-- 融资日报缓存表
CREATE TABLE funding_daily_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT,
  funding_amount TEXT,
  funding_stage TEXT,
  investors TEXT,
  industry_tags TEXT,
  announcement_date TEXT,
  company_description TEXT,
  logo_url TEXT,
  company_url TEXT,
  cache_time INTEGER,
  source TEXT DEFAULT 'feishu'
);

CREATE INDEX idx_funding_date ON funding_daily_cache(announcement_date);
CREATE INDEX idx_funding_stage ON funding_daily_cache(funding_stage);

-- Sheet数据快速查询表
CREATE TABLE sheet_data_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_token TEXT,
  worksheet_name TEXT,
  worksheet_id TEXT,
  is_hidden INTEGER DEFAULT 0,
  data_summary TEXT,
  row_count INTEGER,
  column_count INTEGER,
  last_sync_time INTEGER
);

CREATE INDEX idx_sheet_parent ON sheet_data_index(parent_token);
CREATE INDEX idx_sheet_worksheet ON sheet_data_index(worksheet_name);
```

### B. API端点完整列表

| 端点 | 方法 | 认证 | 功能 | 优先级 |
|------|------|------|------|--------|
| `/api/chat` | POST | ✅ 必需 | 聊天RAG | ⭐⭐⭐⭐⭐ |
| `/api/funding-daily` | GET | ❌ 公开 | 融资日报 | ⭐⭐⭐⭐ |
| `/api/rankings/funding` | GET | ❌ 公开 | AI融资榜 | ⭐⭐⭐ |
| `/api/rankings/investment` | GET | ❌ 公开 | AI投资榜 | ⭐⭐⭐ |
| `/api/rankings/valuation` | GET | ❌ 公开 | AI估值榜 | ⭐⭐⭐ |
| `/api/articles` | GET | ❌ 公开 | 文章列表 | ⭐⭐⭐ |
| `/api/articles/[slug]` | GET | ❌ 公开 | 文章详情 | ⭐⭐⭐ |
| `/api/search` | GET | ❌ 公开 | 全站搜索 | ⭐⭐ |
| `/api/sync/knowledge-base` | POST | ✅ 管理员 | 手动同步 | ⭐ |

### C. 前端页面完整列表

| 页面 | 路径 | 数据源 | 状态 |
|------|------|--------|------|
| **首页** | `/index.html` | D1 (聊天+融资日报) | ✅ 现有 |
| **AI融资榜** | `/pages/ai-funding-ranking.html` | D1 (AI创投榜丨融资) | ❌ 待开发 |
| **AI投资榜** | `/pages/ai-investment-ranking.html` | D1 (AI创投榜丨投资) | ❌ 待开发 |
| **AI估值榜** | `/pages/ai-valuation-ranking.html` | D1 (SVTR AI估值排行榜) | ❌ 待开发 |
| **文章列表** | `/pages/articles.html` | D1 (published_articles) | ❌ 待开发 |
| **文章详情** | `/pages/articles/[slug].html` | D1 (知识库内容) | ❌ 待开发 |
| **AI周报** | `/pages/ai-weekly.html` | D1 (筛选category=AI周报) | ✅ 现有 |

---

## 总结

### Phase 2前端集成的核心价值

1. **性能提升** - API响应从2-3秒降至200-300ms（提升10倍）
2. **数据完整** - 包含40+隐藏工作表数据（数据量+42.5%）
3. **成本降低** - 飞书API调用减少99%（配额压力解除）
4. **用户体验** - 实时RAG、快速榜单、流畅浏览

### 下一步行动

✅ **立即可开始** - 所有数据已就绪（D1数据库99.2%完整）

**推荐实施顺序**:
1. Phase 2.1 - 聊天RAG增强（最高ROI）
2. Phase 2.2 - 融资日报缓存（快速见效）
3. Phase 2.3 - 榜单页面开发（核心功能）
4. Phase 2.4 - 文章系统（内容生态）

**预计总工期**: 8周（2个月）

---

**文档版本**: v1.0
**创建日期**: 2025-10-22
**最后更新**: 2025-10-22
**作者**: Claude Code + SVTR Team
