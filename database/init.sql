-- SVTR数据库初始化脚本
-- 创建时间: 2025-08-18T00:06:13.164Z

-- 用户管理表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    subscription_type TEXT DEFAULT 'free' -- free, premium, enterprise
);

-- 聊天历史表
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT NOT NULL,
    response TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_time_ms INTEGER,
    model_used TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 网站访问统计表
CREATE TABLE IF NOT EXISTS page_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_path TEXT NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    referer TEXT,
    visit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    session_duration INTEGER, -- 秒
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 数据同步日志表
CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL, -- feishu, mcp, manual
    status TEXT NOT NULL, -- success, failed, in_progress
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    duration_ms INTEGER,
    records_processed INTEGER,
    error_message TEXT,
    sync_details JSON -- 存储详细信息
);

-- AI创投数据缓存表
CREATE TABLE IF NOT EXISTS ai_venture_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_type TEXT NOT NULL, -- company, investment, news, report
    data_key TEXT UNIQUE NOT NULL, -- 唯一标识
    data_content JSON NOT NULL,
    source TEXT, -- feishu, api, manual
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- 邮件订阅表
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    subscription_types TEXT, -- JSON array: ["ai_weekly", "trading_picks", "updates"]
    status TEXT DEFAULT 'active', -- active, unsubscribed, bounced
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_sent_at DATETIME,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 系统配置表
CREATE TABLE IF NOT EXISTS system_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    config_type TEXT DEFAULT 'string', -- string, json, number, boolean
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 性能监控表
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_type TEXT NOT NULL, -- page_load, api_response, sync_time
    metric_value REAL NOT NULL,
    metric_unit TEXT, -- ms, seconds, bytes
    page_path TEXT,
    user_agent TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_session ON chat_history (user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_path_time ON page_visits (page_path, visit_time);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status ON sync_logs (sync_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_venture_cache_type_key ON ai_venture_cache (data_type, data_key);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions (email);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_time ON performance_metrics (metric_type, recorded_at);

-- 插入默认系统配置
INSERT OR IGNORE INTO system_config (config_key, config_value, config_type, description) VALUES
('site_name', 'SVTR.AI', 'string', '网站名称'),
('sync_interval_hours', '6', 'number', '数据同步间隔（小时）'),
('max_chat_history_days', '30', 'number', '聊天历史保留天数'),
('email_batch_size', '100', 'number', '邮件批量发送数量'),
('enable_analytics', 'true', 'boolean', '是否启用访问分析'),
('last_feishu_sync', '', 'string', '最后一次飞书同步时间'),
('default_timezone', 'Asia/Shanghai', 'string', '默认时区'),
('version', '1.0.0', 'string', '数据库版本');

-- 插入示例数据（仅在开发环境）
INSERT OR IGNORE INTO users (email, username, subscription_type) VALUES
('admin@svtr.ai', 'SVTR Admin', 'enterprise'),
('demo@svtr.ai', 'Demo User', 'premium');

-- 创建视图以简化常用查询
CREATE VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
    u.id,
    u.email,
    u.username,
    u.subscription_type,
    COUNT(DISTINCT ch.session_id) as chat_sessions,
    COUNT(pv.id) as page_visits,
    MAX(pv.visit_time) as last_visit,
    u.created_at
FROM users u
LEFT JOIN chat_history ch ON u.id = ch.user_id
LEFT JOIN page_visits pv ON u.id = pv.user_id
GROUP BY u.id;

CREATE VIEW IF NOT EXISTS recent_sync_status AS
SELECT 
    sync_type,
    status,
    COUNT(*) as count,
    MAX(start_time) as last_sync,
    AVG(duration_ms) as avg_duration_ms
FROM sync_logs 
WHERE start_time > datetime('now', '-7 days')
GROUP BY sync_type, status;

-- 完成消息
SELECT 'SVTR数据库初始化完成！' as message, 
       datetime('now') as initialized_at;
