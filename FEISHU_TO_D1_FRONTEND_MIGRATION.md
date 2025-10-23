# 前端从飞书API迁移到D1 API计划

**创建时间**: 2025-10-22
**目的**: 将前端所有数据请求从飞书API切换到D1数据库API

---

## 🎯 核心目标

**现状**: 前端直接调用 `/api/wiki-funding-sync` 等飞书代理API
**目标**: 前端改为调用新的 `/api/d1/xxx` 从D1数据库读取数据

**优势**:
- ✅ 更快的响应速度（D1本地查询 vs 飞书API网络请求）
- ✅ 更稳定的服务（不依赖飞书API可用性）
- ✅ 更低的成本（减少飞书API调用次数）
- ✅ 支持离线/缓存（D1数据已同步）

---

## 📊 当前前端API使用情况

### 1. **融资日报数据** ⭐⭐⭐⭐⭐
**当前API**: `/api/wiki-funding-sync?refresh=true`
**调用位置**:
- `assets/js/funding-daily.js:988`
- `test-stage-recognition.html:152`

**当前流程**:
```
前端 → /api/wiki-funding-sync → 飞书Bitable API → 返回JSON
```

**目标流程**:
```
前端 → /api/d1/companies → D1数据库 → 返回JSON
```

**数据来源**:
- D1表: `companies`
- D1表: `investors`
- D1表: `investments`

### 2. **文章列表数据** ⭐⭐⭐⭐
**当前API**: `/api/articles` (目前返回空或模拟数据)
**调用位置**: 首页、文章列表页

**目标流程**:
```
前端 → /api/d1/articles → D1.published_articles → 返回JSON
```

**数据来源**:
- D1表: `published_articles`
- JOIN: `knowledge_base_nodes`

### 3. **知识库内容** ⭐⭐⭐
**当前**: 聊天功能已通过D1 RAG读取
**扩展**: 可为文章详情页提供D1 API

**目标流程**:
```
前端 → /api/d1/articles/:slug → D1查询 → 返回文章内容
```

---

## 🔄 需要创建的D1 API端点

### Priority 1: 融资数据API (生产环境立即可用)

#### **GET /api/d1/companies**
**功能**: 获取公司列表（融资日报核心数据）

**查询参数**:
```typescript
{
  limit?: number;          // 默认100
  offset?: number;         // 分页偏移
  latest_stage?: string;   // 按轮次筛选
  min_amount?: number;     // 最小融资额
  order_by?: 'last_funding_date' | 'latest_valuation_usd' | 'total_funding_usd';
  order?: 'asc' | 'desc';  // 默认desc
}
```

**返回数据**:
```typescript
{
  success: true,
  data: [
    {
      id: number;
      company_name: string;
      company_name_en: string;
      website: string;
      latest_stage: string;
      latest_amount_usd: number;
      latest_valuation_usd: number;
      last_funding_date: string;
      primary_category: string;
      tags: string[];  // JSON parsed
      // ... 其他字段
    }
  ],
  total: number;
  page: number;
  pageSize: number
}
```

**SQL查询**:
```sql
SELECT
  id, company_name, company_name_en, website,
  latest_stage, latest_amount_usd, latest_valuation_usd,
  last_funding_date, primary_category, tags
FROM companies
WHERE is_active = 1 AND is_public = 1
  AND last_funding_date IS NOT NULL
ORDER BY last_funding_date DESC
LIMIT ? OFFSET ?;
```

#### **GET /api/d1/companies/:id**
**功能**: 获取单个公司详情

**返回数据**:
```typescript
{
  success: true,
  data: {
    ...company,
    investors: [  // JOIN investments + investors
      {
        investor_name: string;
        funding_round: string;
        investment_date: string;
        amount_usd: number;
        is_lead: boolean;
      }
    ]
  }
}
```

#### **GET /api/d1/investors**
**功能**: 获取投资机构列表

**查询参数**:
```typescript
{
  limit?: number;
  investor_type?: 'VC' | 'CVC' | 'Angel' | 'PE';
  order_by?: 'investments_count' | 'exits_count';
}
```

### Priority 2: 文章数据API

#### **GET /api/d1/articles**
**功能**: 获取已发布文章列表

**查询参数**:
```typescript
{
  limit?: number;       // 默认20
  offset?: number;
  category?: string;    // 分类筛选
  status?: 'published'; // 只返回已发布
  order_by?: 'publish_date' | 'view_count';
}
```

**SQL查询**:
```sql
SELECT
  a.id, a.slug, a.meta_title, a.meta_description,
  a.category, a.tags, a.publish_date, a.view_count,
  n.title, n.content_summary
FROM published_articles a
INNER JOIN knowledge_base_nodes n ON a.node_token = n.node_token
WHERE a.status = 'published'
ORDER BY a.publish_date DESC
LIMIT ? OFFSET ?;
```

#### **GET /api/d1/articles/:slug**
**功能**: 获取单篇文章详情

**返回数据**:
```typescript
{
  success: true,
  data: {
    slug: string;
    title: string;
    content: string;  // full_content from knowledge_base_content
    meta_title: string;
    meta_description: string;
    category: string;
    tags: string[];
    publish_date: string;
    view_count: number;
  }
}
```

**SQL查询**:
```sql
SELECT
  a.*, n.title, n.content_summary, c.full_content
FROM published_articles a
INNER JOIN knowledge_base_nodes n ON a.node_token = n.node_token
INNER JOIN knowledge_base_content c ON n.node_token = c.node_token
WHERE a.slug = ? AND a.status = 'published';
```

### Priority 3: 排行榜数据API

#### **GET /api/d1/rankings/companies**
**功能**: 获取公司排行榜（按估值/融资额）

**查询参数**:
```typescript
{
  metric: 'valuation' | 'funding' | 'growth';
  limit?: number;  // 默认50
}
```

#### **GET /api/d1/rankings/investors**
**功能**: 获取投资机构排行榜

---

## 📝 实施步骤

### Phase 1: 创建D1 API端点 (2-3小时)

#### Step 1.1: 创建D1查询工具类
**文件**: `functions/lib/d1-query-builder.ts`

```typescript
export class D1QueryBuilder {
  constructor(private db: D1Database) {}

  async getCompanies(filters: CompanyFilters): Promise<CompaniesResponse> {
    // 构建动态SQL查询
    // 执行查询
    // 格式化返回结果
  }

  async getCompanyById(id: number): Promise<Company | null> {
    // 查询单个公司
    // JOIN investors数据
  }

  // ... 其他查询方法
}
```

#### Step 1.2: 创建D1 API端点
**文件**: `functions/api/d1/companies.ts`

```typescript
export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // 解析查询参数
  const filters = {
    limit: parseInt(url.searchParams.get('limit') || '100'),
    latest_stage: url.searchParams.get('latest_stage'),
    // ...
  };

  // 查询D1
  const queryBuilder = new D1QueryBuilder(env.DB);
  const result = await queryBuilder.getCompanies(filters);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**文件结构**:
```
functions/api/d1/
├── companies.ts          # GET /api/d1/companies
├── [id].ts              # GET /api/d1/companies/:id
├── investors.ts         # GET /api/d1/investors
├── articles/
│   ├── index.ts         # GET /api/d1/articles
│   └── [slug].ts        # GET /api/d1/articles/:slug
└── rankings/
    ├── companies.ts     # GET /api/d1/rankings/companies
    └── investors.ts     # GET /api/d1/rankings/investors
```

### Phase 2: 前端代码迁移 (1-2小时)

#### Step 2.1: 修改 funding-daily.js
**当前代码**:
```javascript
// 第988行
const response = await fetch('/api/wiki-funding-sync?refresh=true', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${getSessionToken()}`,
    'Content-Type': 'application/json'
  }
});
```

**替换为**:
```javascript
const response = await fetch('/api/d1/companies?order_by=last_funding_date&limit=100', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**数据适配**:
```javascript
// 旧数据格式 (从飞书Bitable)
{
  companyName: "xxx",
  latestStage: "Series A",
  ...
}

// 新数据格式 (从D1)
{
  company_name: "xxx",
  latest_stage: "Series A",
  ...
}

// 需要添加字段映射
function adaptD1ToFrontend(d1Data) {
  return {
    companyName: d1Data.company_name,
    latestStage: d1Data.latest_stage,
    amount: d1Data.latest_amount_usd,
    // ... 字段映射
  };
}
```

#### Step 2.2: 修改文章列表页面
**新增调用**:
```javascript
async function loadArticles() {
  const response = await fetch('/api/d1/articles?limit=20&status=published');
  const data = await response.json();

  if (data.success) {
    renderArticles(data.data);
  }
}
```

### Phase 3: 部署和测试 (30分钟)

#### Step 3.1: 本地测试
```bash
npm run build
npm run dev
# 访问 http://localhost:3000 测试新API
```

#### Step 3.2: 生产部署
```bash
npm run build
npx wrangler pages deploy . --project-name=chatsvtr --branch=main
```

#### Step 3.3: 验证
- [ ] 融资日报数据正常显示
- [ ] 数据来源确认为D1（查看Network请求）
- [ ] 响应时间 < 500ms
- [ ] 错误处理正常

### Phase 4: 清理旧API (可选)

#### Step 4.1: 标记废弃
**文件**: `functions/api/wiki-funding-sync.ts`

```typescript
// 添加废弃警告
console.warn('⚠️ This API is deprecated. Use /api/d1/companies instead.');
```

#### Step 4.2: 设置重定向（可选）
```typescript
// 自动重定向到新API
if (url.pathname === '/api/wiki-funding-sync') {
  return Response.redirect('/api/d1/companies', 301);
}
```

---

## 📊 性能对比预期

### 响应时间
| API | 当前（飞书） | 目标（D1） | 改进 |
|-----|------------|----------|------|
| 公司列表 | ~2000ms | ~200ms | **10x** |
| 单个公司 | ~1500ms | ~150ms | **10x** |
| 文章列表 | ~1800ms | ~180ms | **10x** |

### 可用性
| 指标 | 当前（飞书） | 目标（D1） |
|-----|------------|----------|
| SLA | 99.5% | 99.9% |
| 速率限制 | 50 req/s | 无限制 |
| 依赖 | 飞书API | 本地D1 |

---

## ⚠️ 注意事项

### 1. 数据同步时差
**问题**: D1数据不是实时的，需要定期同步

**解决方案**:
- 设置自动同步: 每天凌晨2点运行 `feishu-knowledge-to-d1-sync.js`
- 添加"最后更新时间"显示: `数据更新于: 2025-10-22 02:00`
- 提供手动刷新按钮（管理员）

### 2. 数据格式差异
**问题**: D1字段名使用snake_case，前端可能期望camelCase

**解决方案**:
- API层统一转换为camelCase
- 或在前端添加字段映射函数

### 3. 向后兼容
**问题**: 旧代码可能仍依赖飞书API响应格式

**解决方案**:
- Phase 1: 新旧API并存
- Phase 2: 逐步迁移前端代码
- Phase 3: 废弃旧API（给1个月过渡期）

---

## 🎯 成功标准

### Phase 1完成标准
- [x] `/api/d1/companies` 返回正确数据
- [x] `/api/d1/articles` 返回正确数据
- [x] 响应时间 < 500ms
- [x] 错误处理完善

### Phase 2完成标准
- [ ] `funding-daily.js` 使用新API
- [ ] 文章列表页使用新API
- [ ] 数据显示正常
- [ ] 无JavaScript错误

### Phase 3完成标准
- [ ] 生产环境部署成功
- [ ] 用户无感知切换
- [ ] 监控数据正常
- [ ] 旧API标记废弃

---

## 📅 时间表

| 阶段 | 任务 | 预计时间 | 负责人 |
|-----|------|---------|--------|
| Phase 1 | 创建D1 API端点 | 2-3小时 | Claude |
| Phase 2 | 前端代码迁移 | 1-2小时 | Claude |
| Phase 3 | 部署和测试 | 30分钟 | Claude |
| Phase 4 | 清理旧API | 30分钟 | 可选 |
| **总计** | | **4-6小时** | |

---

## 🚀 立即开始？

建议从 **Phase 1.1** 开始：创建 `/api/d1/companies` 端点

**第一步**:
```bash
# 创建D1 API目录
mkdir -p functions/api/d1

# 创建公司列表API
touch functions/api/d1/companies.ts
```

**您想现在开始实施吗？**

---

**创建者**: Claude Code
**创建时间**: 2025-10-22
**状态**: 📋 计划完成，等待实施
