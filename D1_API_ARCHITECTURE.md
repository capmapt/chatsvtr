# D1 API 架构设计方案

**创建时间**: 2025-10-22
**目的**: 设计灵活、可扩展的D1 API架构

---

## 🎯 设计原则

### 1. **80/20原则**
- 80%的需求用1个通用API满足
- 20%的复杂需求创建专用API

### 2. **渐进式增强**
- 先创建最简单的通用API
- 根据实际需求逐步添加专用功能

---

## 🏗️ 推荐架构：1+N模式

### **核心API：`/api/d1/query`** (通用查询)

**功能**: 处理80%的简单查询需求

**支持的查询**:
```javascript
// 基础查询
GET /api/d1/query?table=companies&limit=100

// 排序
GET /api/d1/query?table=companies&order_by=latest_valuation_usd&order=desc

// 简单筛选
GET /api/d1/query?table=companies&latest_stage=Series A

// 分页
GET /api/d1/query?table=companies&limit=50&offset=100

// 多表查询（预定义）
GET /api/d1/query?view=companies_with_investors
```

**实现**:
```typescript
// functions/api/d1/query.ts
export async function onRequestGet(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // 解析参数
  const table = url.searchParams.get('table');
  const view = url.searchParams.get('view');  // 预定义视图
  const limit = parseInt(url.searchParams.get('limit') || '100');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const orderBy = url.searchParams.get('order_by') || 'id';
  const order = url.searchParams.get('order') || 'desc';

  // 如果是预定义视图
  if (view) {
    return handleView(env.DB, view, url.searchParams);
  }

  // 表白名单验证
  const allowedTables = [
    'companies',
    'investors',
    'published_articles',
    'knowledge_base_nodes'
  ];

  if (!table || !allowedTables.includes(table)) {
    return jsonError('Invalid table', 400);
  }

  // 字段白名单验证（防止SQL注入）
  const allowedOrderBy = {
    companies: ['id', 'last_funding_date', 'latest_valuation_usd', 'total_funding_usd'],
    investors: ['id', 'investments_count', 'exits_count'],
    published_articles: ['id', 'publish_date', 'view_count']
  };

  if (!allowedOrderBy[table]?.includes(orderBy)) {
    return jsonError('Invalid order_by field', 400);
  }

  // 构建基础查询
  let sql = `SELECT * FROM ${table} WHERE 1=1`;
  const bindings = [];

  // 添加通用筛选条件
  if (table === 'companies') {
    sql += ` AND is_active = 1 AND is_public = 1`;

    // 支持的筛选字段
    const stage = url.searchParams.get('latest_stage');
    if (stage) {
      sql += ` AND latest_stage = ?`;
      bindings.push(stage);
    }

    const minAmount = url.searchParams.get('min_amount');
    if (minAmount) {
      sql += ` AND latest_amount_usd >= ?`;
      bindings.push(parseFloat(minAmount));
    }
  }

  // 添加排序和分页
  sql += ` ORDER BY ${orderBy} ${order.toUpperCase()} LIMIT ? OFFSET ?`;
  bindings.push(limit, offset);

  // 执行查询
  const result = await env.DB.prepare(sql).bind(...bindings).all();

  return new Response(JSON.stringify({
    success: true,
    data: result.results,
    total: result.results.length,
    limit,
    offset
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 预定义视图处理
async function handleView(db: D1Database, view: string, params: URLSearchParams) {
  const views = {
    // 公司+投资人联合查询
    'companies_with_investors': async () => {
      const companyId = params.get('company_id');
      const sql = `
        SELECT
          c.*,
          json_group_array(
            json_object(
              'investor_name', inv.investor_name,
              'amount_usd', i.amount_usd,
              'funding_round', i.funding_round,
              'investment_date', i.investment_date
            )
          ) as investors
        FROM companies c
        LEFT JOIN investments i ON c.id = i.company_id
        LEFT JOIN investors inv ON i.investor_id = inv.id
        WHERE c.id = ?
        GROUP BY c.id
      `;
      return db.prepare(sql).bind(companyId).first();
    },

    // 热门文章
    'popular_articles': async () => {
      const limit = parseInt(params.get('limit') || '10');
      const sql = `
        SELECT
          a.*,
          n.title,
          n.content_summary
        FROM published_articles a
        INNER JOIN knowledge_base_nodes n ON a.node_token = n.node_token
        WHERE a.status = 'published'
        ORDER BY a.view_count DESC
        LIMIT ?
      `;
      return db.prepare(sql).bind(limit).all();
    },

    // 融资排行榜
    'funding_ranking': async () => {
      const metric = params.get('metric') || 'valuation';
      const limit = parseInt(params.get('limit') || '50');

      const orderField = metric === 'valuation'
        ? 'latest_valuation_usd'
        : 'total_funding_usd';

      const sql = `
        SELECT * FROM companies
        WHERE is_active = 1
          AND is_public = 1
          AND ${orderField} IS NOT NULL
        ORDER BY ${orderField} DESC
        LIMIT ?
      `;
      return db.prepare(sql).bind(limit).all();
    }
  };

  if (!views[view]) {
    return jsonError('Invalid view', 400);
  }

  const result = await views[view]();
  return new Response(JSON.stringify({
    success: true,
    data: result.results || result
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 📋 调用示例

### 1. **简单表查询**

#### 公司列表
```javascript
fetch('/api/d1/query?table=companies&limit=100&order_by=last_funding_date')
  .then(r => r.json())
  .then(data => {
    // data.data = [{ company_name, latest_stage, ... }]
    renderCompanyList(data.data);
  });
```

#### 投资人列表
```javascript
fetch('/api/d1/query?table=investors&order_by=investments_count&limit=50')
```

#### 文章列表
```javascript
fetch('/api/d1/query?table=published_articles&order_by=publish_date&limit=20')
```

### 2. **带筛选条件**

#### 筛选Series A公司
```javascript
fetch('/api/d1/query?table=companies&latest_stage=Series A&limit=50')
```

#### 筛选大额融资
```javascript
fetch('/api/d1/query?table=companies&min_amount=50000000&order_by=latest_amount_usd')
```

### 3. **预定义视图（复杂查询）**

#### 公司详情（含投资人）
```javascript
fetch('/api/d1/query?view=companies_with_investors&company_id=123')
  .then(r => r.json())
  .then(data => {
    // data.data = {
    //   company_name: "OpenAI",
    //   investors: [
    //     { investor_name: "Microsoft", amount_usd: 10000000000, ... }
    //   ]
    // }
  });
```

#### 热门文章
```javascript
fetch('/api/d1/query?view=popular_articles&limit=10')
```

#### 融资排行榜
```javascript
fetch('/api/d1/query?view=funding_ranking&metric=valuation&limit=50')
```

### 4. **分页查询**

```javascript
// 第1页
fetch('/api/d1/query?table=companies&limit=50&offset=0')

// 第2页
fetch('/api/d1/query?table=companies&limit=50&offset=50')

// 第3页
fetch('/api/d1/query?table=companies&limit=50&offset=100')
```

---

## 🔐 安全考虑

### 1. **SQL注入防护**
```typescript
// ✅ 使用白名单
const allowedTables = ['companies', 'investors'];

// ✅ 参数化查询
db.prepare('SELECT * FROM companies WHERE id = ?').bind(id)

// ❌ 永远不要拼接SQL
// const sql = `SELECT * FROM ${table}`;  // 危险！
```

### 2. **字段白名单**
```typescript
const allowedOrderBy = {
  companies: ['id', 'last_funding_date', 'latest_valuation_usd'],
  // 只允许预定义的字段
};

if (!allowedOrderBy[table]?.includes(orderBy)) {
  return error('Invalid field');
}
```

### 3. **数据权限**
```typescript
// 只返回公开数据
sql += ` AND is_public = 1 AND is_active = 1`;
```

---

## 📊 如何调用D1特定内容？

### **方法1: URL参数筛选**
```javascript
// 查询OpenAI公司
fetch('/api/d1/query?table=companies&company_name=OpenAI')

// 查询特定ID
fetch('/api/d1/query?table=companies&id=123')

// 查询特定分类
fetch('/api/d1/query?table=published_articles&category=AI周报')
```

### **方法2: 预定义视图**
```javascript
// 在API中预定义复杂查询
const views = {
  'company_detail': (id) => `
    SELECT c.*,
           (SELECT json_group_array(...) FROM investments WHERE company_id = c.id) as investors
    FROM companies c
    WHERE c.id = ?
  `
};

// 前端调用
fetch('/api/d1/query?view=company_detail&id=123')
```

### **方法3: 搜索功能**
```javascript
// 添加全文搜索参数
fetch('/api/d1/query?table=companies&search=AI医疗')

// API实现
if (search) {
  sql += ` AND (company_name LIKE ? OR tags LIKE ?)`;
  bindings.push(`%${search}%`, `%${search}%`);
}
```

---

## 🎯 什么时候需要创建专用API？

### **场景1: 复杂业务逻辑**
```javascript
// 如果需要计算综合评分
GET /api/d1/companies/rankings/composite-score

// 通用API难以实现，需要专用API
export async function calculateCompositeScore(db) {
  // 复杂的评分算法
  const score = (valuation * 0.4) + (funding * 0.3) + (growth * 0.3);
  // ...
}
```

### **场景2: 多表复杂JOIN**
```javascript
// 如果需要深度嵌套数据
GET /api/d1/companies/ecosystem?company_id=123

// 返回: 公司 + 投资人 + 投资人的其他投资 + 关联公司
```

### **场景3: 高频调用优化**
```javascript
// 如果某个查询非常频繁，创建专用缓存API
GET /api/d1/companies/trending

// 内置Redis/KV缓存，5分钟更新一次
```

---

## 📈 扩展路径

### **Phase 1: 只创建通用API** ✅
```
/api/d1/query
```
- 满足80%需求
- 1-2小时完成

### **Phase 2: 添加预定义视图** ⏳
```
/api/d1/query?view=companies_with_investors
/api/d1/query?view=funding_ranking
/api/d1/query?view=popular_articles
```
- 满足复杂查询
- 再花1小时

### **Phase 3: 按需创建专用API** ⏳
```
/api/d1/companies/[id]        # 只在需要时创建
/api/d1/companies/rankings    # 只在需要时创建
```
- 根据实际需求决定
- 每个30分钟

---

## 🎯 总结

### **问题1: 1个API能呈现D1任何内容吗？**
**答案**: 可以！通过：
- 参数控制查询哪张表
- 参数控制筛选条件
- 预定义视图处理复杂查询

### **问题2: 如何调用特定内容？**
**答案**: 3种方式：
1. **URL参数**: `?table=companies&id=123`
2. **预定义视图**: `?view=company_detail&id=123`
3. **搜索参数**: `?table=companies&search=OpenAI`

### **问题3: 需要创建多少个API？**
**推荐**:
- **现在**: 1个通用API（`/api/d1/query`）
- **以后**: 根据需求逐步添加（0-3个专用API）

---

**创建者**: Claude Code
**创建时间**: 2025-10-22
**下一步**: 创建通用 `/api/d1/query` API
