-- D1 Database Indexes for RAG Performance Optimization
-- Phase 2.1: 创建索引提升查询性能
-- 执行命令: npx wrangler d1 execute svtr-production --remote --file=scripts/create-d1-indexes.sql

-- ===================================================
-- 1. knowledge_base_nodes 表索引（基础元数据）
-- ===================================================

-- 标题索引（用于快速标题匹配）
CREATE INDEX IF NOT EXISTS idx_nodes_title
  ON knowledge_base_nodes(title);

-- 对象类型索引（用于按类型筛选）
CREATE INDEX IF NOT EXISTS idx_nodes_objtype
  ON knowledge_base_nodes(obj_type);

-- 父节点索引（用于层级查询）
CREATE INDEX IF NOT EXISTS idx_nodes_parent
  ON knowledge_base_nodes(parent_token);

-- 修改时间索引（用于最新内容排序）
CREATE INDEX IF NOT EXISTS idx_nodes_updated
  ON knowledge_base_nodes(updated_at DESC);

-- 复合索引：类型 + 修改时间（常用组合查询）
CREATE INDEX IF NOT EXISTS idx_nodes_type_updated
  ON knowledge_base_nodes(obj_type, updated_at DESC);

-- 公开可见性索引（用于筛选可访问内容）
CREATE INDEX IF NOT EXISTS idx_nodes_visibility
  ON knowledge_base_nodes(is_public, is_indexed);

-- ===================================================
-- 2. knowledge_base_content 表索引（完整内容）
-- ===================================================

-- node_token索引（用于快速JOIN）
CREATE INDEX IF NOT EXISTS idx_content_node_token
  ON knowledge_base_content(node_token);

-- ===================================================
-- 3. published_articles 表索引
-- ===================================================

-- Slug索引（唯一约束，URL查找）
CREATE INDEX IF NOT EXISTS idx_article_slug
  ON published_articles(slug);

-- 分类索引（按分类筛选）
CREATE INDEX IF NOT EXISTS idx_article_category
  ON published_articles(category);

-- 发布日期索引（按时间排序）
CREATE INDEX IF NOT EXISTS idx_article_publish_date
  ON published_articles(publish_date DESC);

-- 状态索引（只查询已发布）
CREATE INDEX IF NOT EXISTS idx_article_status
  ON published_articles(status);

-- 浏览量索引（热门文章排序）
CREATE INDEX IF NOT EXISTS idx_article_views
  ON published_articles(view_count DESC);

-- 复合索引：状态 + 发布日期（最常用查询）
CREATE INDEX IF NOT EXISTS idx_article_status_date
  ON published_articles(status, publish_date DESC);

-- ===================================================
-- 4. companies 表索引（融资数据）
-- ===================================================

-- 公司名称索引
CREATE INDEX IF NOT EXISTS idx_companies_name
  ON companies(company_name);

-- 融资轮次索引
CREATE INDEX IF NOT EXISTS idx_companies_stage
  ON companies(latest_stage);

-- 融资日期索引
CREATE INDEX IF NOT EXISTS idx_companies_funding_date
  ON companies(last_funding_date DESC);

-- 估值排序索引
CREATE INDEX IF NOT EXISTS idx_companies_valuation
  ON companies(latest_valuation_usd DESC);

-- 活跃状态索引
CREATE INDEX IF NOT EXISTS idx_companies_active
  ON companies(is_active, is_public);

-- ===================================================
-- 5. investors 表索引
-- ===================================================

-- 投资机构名称索引
CREATE INDEX IF NOT EXISTS idx_investors_name
  ON investors(investor_name);

-- 投资机构类型索引
CREATE INDEX IF NOT EXISTS idx_investors_type
  ON investors(investor_type);

-- 投资数量索引
CREATE INDEX IF NOT EXISTS idx_investors_count
  ON investors(investments_count DESC);

-- ===================================================
-- 索引创建完成统计
-- ===================================================

-- 查看所有索引
SELECT
  name,
  tbl_name,
  sql
FROM sqlite_master
WHERE type = 'index'
  AND tbl_name IN ('knowledge_base_nodes', 'knowledge_base_content', 'published_articles', 'companies', 'investors')
ORDER BY tbl_name, name;

-- 显示表统计
SELECT
  'knowledge_base_nodes' as table_name,
  COUNT(*) as row_count
FROM knowledge_base_nodes
UNION ALL
SELECT
  'knowledge_base_content',
  COUNT(*)
FROM knowledge_base_content
UNION ALL
SELECT
  'published_articles',
  COUNT(*)
FROM published_articles
UNION ALL
SELECT
  'companies',
  COUNT(*)
FROM companies
UNION ALL
SELECT
  'investors',
  COUNT(*)
FROM investors;
