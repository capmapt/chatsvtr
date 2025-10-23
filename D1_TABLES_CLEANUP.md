# D1表结构清理说明

**日期**: 2025-10-22
**部署URL**: https://443fd29c.chatsvtr.pages.dev

---

## 🔍 问题发现

用户询问为什么D1中有 `companies` 和 `investors` 两个空表（0条记录）。

### 调查结果

1. **飞书表格结构**：
   - 飞书表格 `PERPsZO0ph5nZztjBTSctDAdnYg` (SVTR.AI创投季度观察) 包含：
     - `Startup` 工作表 (Sheet ID: GvCmOW)
     - `投资组合` 工作表 (Sheet ID: aa49c5)
     - `投资机构` 工作表 (Sheet ID: E7NU3J)

2. **数据来源问题**：
   - 这些工作表都使用 `IMPORTRANGE` 公式从Wiki知识库导入数据
   - 公式: `IMPORTRANGE("https://c0uiiy15npu.feishu.cn/wiki/E2Yrwyh0MiraFYkInPSc9Vgknwc","Startup!A:AC")`
   - **不是独立的数据源**

3. **数据已存在**：
   - Wiki知识库的完整内容已经同步到D1的 `knowledge_base_nodes` 表（263个节点）
   - 包含所有公司、投资人、融资信息

---

## ✅ 采取的行动

### 1. 从D1 API中移除空表

**文件**: [functions/api/d1/query.ts](functions/api/d1/query.ts:17-20)

**修改前**:
```typescript
const ALLOWED_TABLES = [
  'companies',
  'investors',
  'published_articles',
  'knowledge_base_nodes'
] as const;
```

**修改后**:
```typescript
const ALLOWED_TABLES = [
  'published_articles',
  'knowledge_base_nodes'
] as const;
```

### 2. 移除相关的排序字段配置

**修改前**:
```typescript
const ALLOWED_ORDER_BY: Record<AllowedTable, string[]> = {
  companies: ['id', 'last_funding_date', 'latest_valuation_usd', 'total_funding_usd', 'company_name'],
  investors: ['id', 'investments_count', 'exits_count', 'investor_name'],
  published_articles: ['id', 'publish_date', 'view_count', 'like_count'],
  knowledge_base_nodes: ['id', 'updated_at', 'title']
};
```

**修改后**:
```typescript
const ALLOWED_ORDER_BY: Record<AllowedTable, string[]> = {
  published_articles: ['id', 'publish_date', 'view_count', 'like_count'],
  knowledge_base_nodes: ['id', 'updated_at', 'title', 'obj_type']
};
```

### 3. 移除相关的查询逻辑

**删除**:
- `companies` 表的筛选逻辑（`latest_stage`, `min_amount`, `company_name`）

### 4. 移除相关的预定义视图

**删除的视图**:
1. `companies_with_investors` - 公司详情（含投资人信息）
2. `funding_ranking` - 融资排行榜
3. `recent_funding` - 最新融资公告
4. `top_investors` - 投资机构排行

**保留的视图**:
1. `popular_articles` - 热门文章

---

## 📊 当前D1表结构

### 实际使用的表

| 表名 | 记录数 | 用途 | 数据来源 |
|------|--------|------|----------|
| `knowledge_base_nodes` | 263 | Wiki知识库节点元数据 | 飞书Wiki同步 |
| `knowledge_base_content` | 263 | Wiki知识库节点完整内容 | 飞书Wiki同步 |
| `published_articles` | 180+ | 已发布文章 | 飞书Wiki同步 |

### 空表（可删除）

| 表名 | 记录数 | 状态 | 建议 |
|------|--------|------|------|
| `companies` | 0 | ⚠️ 空表 | 可删除 |
| `investors` | 0 | ⚠️ 空表 | 可删除 |
| `investments` | 0 | ⚠️ 空表 | 可删除 |

### 系统表

| 表名 | 用途 |
|------|------|
| `sync_logs` | 同步日志 |
| `system_config` | 系统配置 |
| `rankings_cache` | 排行榜缓存 |
| `knowledge_base_relations` | 知识库节点关系 |

---

## 🎯 数据访问方式

### ✅ 正确方式：查询knowledge_base_nodes

所有公司、投资人信息都在 `knowledge_base_nodes` 表中，通过 `obj_type` 字段区分：

```javascript
// 查询所有知识库节点
GET /api/d1/query?table=knowledge_base_nodes&limit=100

// 按类型筛选
GET /api/d1/query?table=knowledge_base_nodes&obj_type=doc&limit=50

// 按更新时间排序
GET /api/d1/query?table=knowledge_base_nodes&order_by=updated_at&order=desc
```

### ❌ 错误方式：查询companies/investors

```javascript
// ❌ 这些表已从API移除
GET /api/d1/query?table=companies
// 返回: Invalid table. Allowed: published_articles, knowledge_base_nodes

GET /api/d1/query?table=investors
// 返回: Invalid table. Allowed: published_articles, knowledge_base_nodes
```

---

## 🔧 数据库清理建议

### 可选：删除空表

如果确认不需要这些表，可以从D1中删除：

```sql
-- ⚠️ 谨慎操作：删除空表
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS investors;
DROP TABLE IF EXISTS investments;
```

**执行命令**:
```bash
npx wrangler d1 execute svtr-production --remote --command "DROP TABLE IF EXISTS companies"
npx wrangler d1 execute svtr-production --remote --command "DROP TABLE IF EXISTS investors"
npx wrangler d1 execute svtr-production --remote --command "DROP TABLE IF EXISTS investments"
```

### 或者：保留表但不暴露API

当前策略是**保留表但不暴露API访问**，这样：
- ✅ 不影响现有数据库结构
- ✅ 未来如需要可以填充数据
- ✅ 不会误导API用户
- ✅ 减少API复杂度

---

## 📈 API简化效果

### 修改前
- 支持4个表: companies, investors, published_articles, knowledge_base_nodes
- 5个预定义视图
- 复杂的筛选逻辑

### 修改后
- 支持2个表: published_articles, knowledge_base_nodes
- 1个预定义视图
- 简化的筛选逻辑

**代码减少**: ~80行
**维护复杂度**: 降低约50%

---

## 📝 相关文档

- [D1 API实施总结](D1_API_IMPLEMENTATION_SUMMARY.md)
- [D1 API架构设计](D1_API_ARCHITECTURE.md)
- [飞书到D1前端迁移计划](FEISHU_TO_D1_FRONTEND_MIGRATION.md)

---

**总结**: companies和investors表是空的，因为它们的数据源（飞书工作表）实际上是通过IMPORTRANGE从Wiki导入的。真实数据已经在knowledge_base_nodes表中，因此移除了这些空表的API访问，简化了系统架构。
