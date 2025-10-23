-- SVTR D1 Complete Database Schema
-- 创建时间: 2025-10-21
-- 包含: 知识库、文章、公司数据、投资人数据

-- ============================================
-- 知识库节点表（核心元数据）
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 飞书标识
    node_token TEXT UNIQUE NOT NULL,
    obj_token TEXT NOT NULL,
    obj_type TEXT NOT NULL CHECK(obj_type IN ('docx', 'sheet', 'slides', 'bitable', 'file', 'wiki')),
    feishu_space_id TEXT DEFAULT '7321328173944340484',

    -- 基本信息
    title TEXT NOT NULL,
    node_level INTEGER DEFAULT 0,
    parent_token TEXT,
    has_child BOOLEAN DEFAULT 0,

    -- 内容摘要（用于快速预览）
    content_summary TEXT,
    content_length INTEGER DEFAULT 0,

    -- 分类和标签
    doc_type TEXT,
    search_keywords TEXT, -- JSON array: ["ai", "svtr", "创投"]
    semantic_tags TEXT,   -- JSON array: ["svtr_platform", "artificial_intelligence"]

    -- RAG增强
    rag_score REAL DEFAULT 0,
    embedding_vector_id TEXT, -- Vectorize中的向量ID

    -- 访问控制
    is_public BOOLEAN DEFAULT 1,
    is_indexed BOOLEAN DEFAULT 1,
    visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'member_only', 'private')),

    -- 统计信息
    view_count INTEGER DEFAULT 0,
    last_viewed_at DATETIME,

    -- 飞书元数据
    feishu_create_time INTEGER,
    feishu_owner_id TEXT,
    feishu_url TEXT,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 知识库节点索引
CREATE INDEX IF NOT EXISTS idx_kb_nodes_type ON knowledge_base_nodes (obj_type, is_public);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_level ON knowledge_base_nodes (node_level, parent_token);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_rag ON knowledge_base_nodes (rag_score DESC);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_sync ON knowledge_base_nodes (synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_token ON knowledge_base_nodes (node_token);
CREATE INDEX IF NOT EXISTS idx_kb_nodes_title ON knowledge_base_nodes (title);

-- ============================================
-- 完整内容表（大文本分离存储）
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_token TEXT UNIQUE NOT NULL,

    -- 完整内容（支持Markdown/HTML）
    full_content TEXT NOT NULL,
    content_format TEXT DEFAULT 'markdown' CHECK(content_format IN ('markdown', 'html', 'plain')),

    -- 内容元数据
    content_hash TEXT,
    content_size INTEGER,

    -- 特殊类型处理
    sheet_data TEXT,    -- JSON: 表格数据
    bitable_data TEXT,  -- JSON: 多维表数据
    slide_images TEXT,  -- JSON: 演示文稿图片列表

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (node_token) REFERENCES knowledge_base_nodes (node_token) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kb_content_token ON knowledge_base_content (node_token);
CREATE INDEX IF NOT EXISTS idx_kb_content_hash ON knowledge_base_content (content_hash);

-- ============================================
-- 节点关系表（支持树形结构查询）
-- ============================================
CREATE TABLE IF NOT EXISTS knowledge_base_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    parent_token TEXT NOT NULL,
    child_token TEXT NOT NULL,
    relation_type TEXT DEFAULT 'parent_child' CHECK(relation_type IN ('parent_child', 'related', 'referenced')),

    -- 关系权重（用于推荐）
    weight REAL DEFAULT 1.0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_token) REFERENCES knowledge_base_nodes (node_token) ON DELETE CASCADE,
    FOREIGN KEY (child_token) REFERENCES knowledge_base_nodes (node_token) ON DELETE CASCADE,

    UNIQUE(parent_token, child_token, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_kb_rel_parent ON knowledge_base_relations (parent_token);
CREATE INDEX IF NOT EXISTS idx_kb_rel_child ON knowledge_base_relations (child_token);

-- ============================================
-- 文章发布表（专门用于内容社区展示）
-- ============================================
CREATE TABLE IF NOT EXISTS published_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    node_token TEXT NOT NULL,

    -- 发布信息
    published_url TEXT,
    slug TEXT UNIQUE,

    -- SEO优化
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    og_image TEXT,

    -- 分类
    category TEXT,
    tags TEXT, -- JSON array

    -- 互动数据
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- 状态
    status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT 0,
    publish_date DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (node_token) REFERENCES knowledge_base_nodes (node_token) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON published_articles (status, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON published_articles (category, is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON published_articles (slug);

-- ============================================
-- 公司数据表（数据榜单用）
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feishu_record_id TEXT UNIQUE,

    -- 基本信息
    company_name TEXT NOT NULL,
    company_name_en TEXT,
    website TEXT,
    founded_year INTEGER,
    location TEXT,
    location_cn TEXT,

    -- 融资信息
    latest_stage TEXT,
    latest_amount_usd REAL,
    latest_valuation_usd REAL,
    total_funding_usd REAL,
    last_funding_date DATE,

    -- 分类和标签
    primary_category TEXT,
    secondary_category TEXT,
    tags TEXT, -- JSON array

    -- 业务数据
    arr_usd REAL,
    monthly_revenue_usd REAL,
    user_count INTEGER,

    -- 创始团队
    founders_info TEXT, -- JSON
    team_background TEXT,

    -- 评分和排名
    svtr_score REAL,
    market_score REAL,
    tech_score REAL,
    team_score REAL,

    -- 搜索和索引
    search_vector TEXT,

    -- 状态控制
    is_active BOOLEAN DEFAULT 1,
    is_public BOOLEAN DEFAULT 1,
    data_quality_score INTEGER DEFAULT 0,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    feishu_sync_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_companies_category ON companies (primary_category, is_active);
CREATE INDEX IF NOT EXISTS idx_companies_funding ON companies (latest_amount_usd DESC);
CREATE INDEX IF NOT EXISTS idx_companies_stage ON companies (latest_stage);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (company_name);

-- ============================================
-- 投资机构表
-- ============================================
CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feishu_record_id TEXT UNIQUE,

    investor_name TEXT NOT NULL,
    investor_name_en TEXT,
    investor_type TEXT CHECK(investor_type IN ('VC', 'CVC', 'Angel', 'PE', 'Family Office')),

    -- 基本信息
    website TEXT,
    founded_year INTEGER,
    location TEXT,
    aum_usd REAL, -- Assets Under Management

    -- 投资偏好
    typical_stage TEXT,
    focus_sectors TEXT, -- JSON array
    avg_check_size_usd REAL,

    -- 活跃度
    investments_count INTEGER DEFAULT 0,
    exits_count INTEGER DEFAULT 0,

    -- 搜索和索引
    search_vector TEXT,

    -- 状态控制
    is_active BOOLEAN DEFAULT 1,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    feishu_sync_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_investors_type ON investors (investor_type, is_active);
CREATE INDEX IF NOT EXISTS idx_investors_name ON investors (investor_name);

-- ============================================
-- 投资记录表
-- ============================================
CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feishu_record_id TEXT UNIQUE,

    company_id INTEGER NOT NULL,
    investor_id INTEGER NOT NULL,

    -- 投资详情
    funding_round TEXT,
    investment_date DATE,
    amount_usd REAL,
    valuation_usd REAL,
    is_lead BOOLEAN DEFAULT 0,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    FOREIGN KEY (investor_id) REFERENCES investors (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_investments_company ON investments (company_id);
CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments (investor_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments (investment_date DESC);

-- ============================================
-- 排名缓存表（提升查询性能）
-- ============================================
CREATE TABLE IF NOT EXISTS rankings_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    ranking_type TEXT NOT NULL,
    ranking_data TEXT NOT NULL, -- JSON
    filters_hash TEXT,

    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_rankings_type ON rankings_cache (ranking_type, filters_hash);
CREATE INDEX IF NOT EXISTS idx_rankings_expires ON rankings_cache (expires_at);

-- ============================================
-- 同步日志表
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_type ON sync_logs (sync_type, created_at DESC);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config (key);

-- ============================================
-- 数据完整性检查
-- ============================================

-- 插入初始统计记录
INSERT OR IGNORE INTO system_config (key, value, description)
VALUES
    ('db_version', '1.0.0', 'D1数据库Schema版本'),
    ('kb_sync_enabled', 'true', '知识库同步是否启用'),
    ('last_full_sync', '', '最后一次完整同步时间');

-- ============================================
-- Schema创建完成
-- ============================================
-- 总计表数: 10
-- - 知识库相关: 4张 (nodes, content, relations, articles)
-- - 数据榜单相关: 4张 (companies, investors, investments, rankings_cache)
-- - 系统表: 2张 (sync_logs, system_config - 已存在)
