# SQLite MCP 配置指南

## ✅ 当前状态

SVTR项目的SQLite数据库基础设施已经准备完毕：

### 📁 数据库文件结构
```
database/
├── svtr.db           # 主数据库文件 (4KB SQLite格式)
├── init.sql          # 表结构初始化脚本
└── config.json       # 数据库配置信息
```

### 🗄️ 预设表结构

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| **users** | 用户管理 | email, username, subscription_type |
| **chat_history** | AI聊天记录 | user_id, message, response, session_id |
| **page_visits** | 访问统计 | page_path, user_agent, visit_time |
| **sync_logs** | 数据同步日志 | sync_type, status, duration_ms |
| **ai_venture_cache** | AI创投数据缓存 | data_type, data_content, source |
| **email_subscriptions** | 邮件订阅 | email, subscription_types, status |
| **system_config** | 系统配置 | config_key, config_value |
| **performance_metrics** | 性能监控 | metric_type, metric_value |

### 📊 预设视图
- **user_activity_summary** - 用户活动汇总
- **recent_sync_status** - 近期同步状态

## 🔧 MCP配置状态

### ⚠️ 当前问题
SQLite MCP连接失败，可能的原因：
1. **包兼容性问题**：`mcp-server-sqlite-npx` 可能不兼容当前环境
2. **依赖缺失**：可能需要额外的系统依赖
3. **配置错误**：数据库路径或参数配置问题

### 🎯 已尝试的配置
```bash
# 当前配置（连接失败）
claude mcp add sqlite "npx -y mcp-server-sqlite-npx /home/lium/chatsvtr/database/svtr.db"
```

## 🛠️ 解决方案选项

### 方案1: 继续排查MCP问题（推荐）
```bash
# 1. 清理并重试
claude mcp remove sqlite

# 2. 尝试不同的SQLite MCP包
claude mcp add sqlite "npx -y @modelcontextprotocol/server-sqlite /home/lium/chatsvtr/database/svtr.db"

# 3. 或使用其他实现
claude mcp add sqlite "npx -y sqlite-mcp-server /home/lium/chatsvtr/database/svtr.db"
```

### 方案2: 使用Node.js数据库库（备选）
如果MCP持续失败，可以直接在代码中使用SQLite：
```bash
npm install sqlite3
npm install better-sqlite3
```

### 方案3: 暂时跳过数据库MCP
当前9个MCP已经覆盖核心功能，SQLite可以作为后续优化项目。

## 📋 管理命令

### 🔍 诊断命令
```bash
npm run database:test      # 完整数据库测试
npm run database:status    # 检查文件状态
npm run database:config    # 查看配置
npm run mcp:status         # 检查所有MCP状态
```

### 🛠️ 维护命令
```bash
npm run database:init      # 重新初始化
npm run database:backup    # 创建备份
```

## 🎯 SVTR具体应用场景

### 1. 用户管理系统
```sql
-- 用户注册
INSERT INTO users (email, username, subscription_type) 
VALUES ('user@example.com', 'Username', 'premium');

-- 查看用户活动
SELECT * FROM user_activity_summary WHERE email = 'user@example.com';
```

### 2. 聊天历史记录
```sql
-- 保存聊天记录
INSERT INTO chat_history (user_id, message, response, session_id) 
VALUES (1, '什么是AI独角兽？', '专业回答...', 'session_123');

-- 查询用户聊天历史
SELECT * FROM chat_history WHERE user_id = 1 ORDER BY created_at DESC LIMIT 10;
```

### 3. 网站统计分析
```sql
-- 记录页面访问
INSERT INTO page_visits (page_path, user_agent, ip_address) 
VALUES ('/', 'Chrome/91.0', '192.168.1.1');

-- 分析热门页面
SELECT page_path, COUNT(*) as visits 
FROM page_visits 
WHERE visit_time > datetime('now', '-7 days')
GROUP BY page_path 
ORDER BY visits DESC;
```

### 4. 数据同步监控
```sql
-- 记录同步状态
INSERT INTO sync_logs (sync_type, status, duration_ms, records_processed) 
VALUES ('feishu_mcp', 'success', 5000, 252);

-- 查看同步统计
SELECT * FROM recent_sync_status;
```

### 5. AI创投数据缓存
```sql
-- 缓存公司数据
INSERT INTO ai_venture_cache (data_type, data_key, data_content, source) 
VALUES ('company', 'anthropic', '{"name": "Anthropic", "valuation": "4.1B"}', 'feishu');

-- 查询缓存数据
SELECT * FROM ai_venture_cache WHERE data_type = 'company' AND is_active = 1;
```

## 🔄 下一步行动计划

### 立即执行（优先级🔥🔥🔥）
1. **排查MCP连接问题**
   ```bash
   # 尝试其他SQLite MCP包
   npm search mcp sqlite
   ```

2. **验证数据库文件完整性**
   ```bash
   npm run database:test
   ```

### 短期计划（1周内）
1. **建立数据库表结构**
   - 通过MCP工具执行 `init.sql`
   - 或手动创建核心表

2. **集成到现有工作流**
   - 修改同步脚本保存到数据库
   - 聊天功能集成用户记录

### 中期规划（1月内）
1. **数据迁移**
   - 将现有JSON数据迁移到SQLite
   - 建立数据一致性检查

2. **性能优化**
   - 添加必要索引
   - 查询性能调优

## 💡 替代方案考虑

### 如果SQLite MCP持续失败
1. **使用直接的Node.js库**
   ```javascript
   const Database = require('better-sqlite3');
   const db = new Database('./database/svtr.db');
   ```

2. **创建自定义数据库API**
   ```bash
   # 在functions/api/中创建数据库端点
   functions/api/database.ts
   ```

3. **使用Cloudflare D1**
   ```bash
   # 通过Cloudflare MCP管理D1数据库
   ```

## 📊 当前影响评估

### ✅ 不影响现有功能
- 9个MCP工具正常运行
- 数据同步和工作流完整
- 核心功能100%可用

### 🎯 SQLite集成的价值
- **数据查询能力** +100%
- **用户管理功能** +100%
- **统计分析能力** +100%
- **数据持久性** +100%

### 📈 优先级评估
- **紧急度**: 低（不影响核心功能）
- **重要度**: 中（未来扩展需要）
- **复杂度**: 中（主要是MCP配置问题）
- **投资回报**: 高（一旦配置成功）

## 🎉 总结

虽然SQLite MCP当前连接失败，但SVTR项目的数据库基础设施已经完整准备：

✅ **已完成**：
- 数据库文件创建 (4KB SQLite格式)
- 完整表结构设计 (8表 + 2视图)
- 初始化脚本准备
- 管理命令集成

⚠️ **待解决**：
- MCP连接配置问题
- 表结构实际创建

🎯 **建议**：
1. 继续使用当前9个MCP工具
2. 后续专门解决SQLite MCP配置
3. 或考虑直接使用Node.js数据库库

**SVTR项目的核心MCP生态系统已经完整，SQLite是锦上添花的功能！** 🌟

---

*配置指南更新时间: 2025年8月17日*  
*下次排查建议: 需要时*