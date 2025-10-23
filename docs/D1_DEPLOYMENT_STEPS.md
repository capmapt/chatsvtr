# D1数据库部署步骤指南

## 当前进度 ✅

### 已完成
1. ✅ 创建完整的数据库Schema文件 (`database/d1-complete-schema.sql`)
2. ✅ 开发飞书知识库同步脚本 (`scripts/feishu-knowledge-to-d1-sync.js`)
3. ✅ 生成同步SQL文件 (`database/sync-data.sql`)
   - 263个知识节点
   - 文件大小: 1.98 MB
   - 包含节点、内容、关系、文章URL映射

### 数据概览
- 总节点数: **263个**
- 文档类型分布:
  - docx: 192个（文章）
  - sheet: 65个（表格）
  - slides: 3个（演示）
  - bitable: 2个（多维表）
  - file: 1个（文件）
- 平均内容长度: 2580字符
- 平均RAG评分: 48.14

---

## 下一步操作（需要手动执行）

由于Wrangler CLI认证问题，请按以下步骤在Cloudflare Dashboard手动完成部署：

### 步骤1: 创建D1数据库（5分钟）

1. **访问** Cloudflare Dashboard
   ```
   https://dash.cloudflare.com/
   ```

2. **登录** 您的账号
   ```
   邮箱: liumin.gsm@gmail.com
   账户: ML (e71f26d60292ae7d08e2fedb2328558e)
   ```

3. **导航** 到 D1 数据库
   ```
   左侧菜单: Workers & Pages → D1 SQL Database
   ```

4. **创建** 新数据库
   - 点击 "Create database" 按钮
   - 数据库名称: `svtr-production`
   - 位置: 自动选择（Automatic）
   - 点击 "Create"

5. **复制** Database ID
   ```
   创建成功后，页面会显示类似：
   Database ID: abc123-def456-ghi789-...
   ```
   请复制这个ID，下一步需要用到。

---

### 步骤2: 更新wrangler.toml配置（2分钟）

将以下内容添加到 `wrangler.toml` 文件中（在现有绑定之后）：

```toml
# D1数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "svtr-production"
database_id = "替换为步骤1中复制的Database ID"
```

**示例**:
```toml
[[d1_databases]]
binding = "DB"
database_name = "svtr-production"
database_id = "abc123-def456-ghi789-..."  # 替换为实际ID
```

---

### 步骤3: 执行Schema创建（5分钟）

有两种方式执行Schema：

#### 方式A: 使用Wrangler CLI（推荐）

在项目根目录运行：

```bash
npx wrangler d1 execute svtr-production --remote --file=./database/d1-complete-schema.sql
```

**预期输出**:
```
🌀 Executing on remote database svtr-production...
🚣 Executed 10 commands in 1.23s
```

#### 方式B: 使用Cloudflare Dashboard

1. 访问 https://dash.cloudflare.com/ → D1 → svtr-production
2. 点击 "Console" 标签页
3. 复制 `database/d1-complete-schema.sql` 文件内容
4. 粘贴到SQL编辑器
5. 点击 "Execute" 按钮

---

### 步骤4: 执行数据同步（5分钟）

#### 方式A: 使用Wrangler CLI（推荐）

```bash
npx wrangler d1 execute svtr-production --remote --file=./database/sync-data.sql
```

**注意**: 文件较大（1.98MB），执行可能需要1-2分钟

**预期输出**:
```
🌀 Executing on remote database svtr-production...
🚣 Executed 790+ commands in 15.67s
```

#### 方式B: 分批执行（如果文件太大）

如果单次执行失败，可以分批执行：

```bash
# 创建分批脚本
node scripts/split-sync-sql.js

# 执行每批
npx wrangler d1 execute svtr-production --remote --file=./database/sync-data-part1.sql
npx wrangler d1 execute svtr-production --remote --file=./database/sync-data-part2.sql
# ...
```

---

### 步骤5: 验证数据同步（5分钟）

#### 5.1 检查表结构

```bash
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**预期输出**:
```
name
-------------------------
knowledge_base_nodes
knowledge_base_content
knowledge_base_relations
published_articles
companies
investors
investments
rankings_cache
sync_logs
system_config
```

#### 5.2 检查节点数量

```bash
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT COUNT(*) as total_nodes FROM knowledge_base_nodes"
```

**预期输出**:
```
total_nodes
-----------
263
```

#### 5.3 检查文档类型分布

```bash
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT obj_type, COUNT(*) as count FROM knowledge_base_nodes GROUP BY obj_type"
```

**预期输出**:
```
obj_type | count
---------|------
docx     | 192
sheet    | 65
slides   | 3
bitable  | 2
file     | 1
```

#### 5.4 检查发布文章数量

```bash
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT COUNT(*) as total_articles FROM published_articles WHERE status='published'"
```

**预期输出**:
```
total_articles
--------------
180-200 (docx中RAG分数>45且长度>500的)
```

#### 5.5 查看示例文章

```bash
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT slug, meta_title, category, publish_date FROM published_articles LIMIT 5"
```

**预期输出**:
```
slug                                | meta_title              | category    | publish_date
------------------------------------|-------------------------|-------------|-------------
ai创投观察丨2025-q3-stZ4wqMc       | AI创投观察丨2025 Q3...  | AI创投观察  | 2025-10-20
...
```

---

## 故障排除

### 问题1: Wrangler认证失败

**症状**:
```
ERROR: Authentication error [code: 10000]
```

**解决方案**:
```bash
# 重新登录
npx wrangler logout
npx wrangler login

# 或使用API Token
export CLOUDFLARE_API_TOKEN="your-api-token"
```

### 问题2: SQL文件太大无法执行

**症状**:
```
ERROR: Request entity too large
```

**解决方案**:
```bash
# 使用分批执行脚本
node scripts/split-sync-sql.js
```

### 问题3: 数据库已存在

**症状**:
```
ERROR: Database already exists
```

**解决方案**:
```bash
# 删除旧数据库（谨慎！）
npx wrangler d1 delete svtr-production

# 或使用不同名称
npx wrangler d1 create svtr-production-v2
```

### 问题4: 字符编码问题

**症状**:
```
ERROR: Invalid UTF-8 character
```

**解决方案**:
- 检查 `sync-data.sql` 文件编码（应为UTF-8）
- 重新运行同步脚本生成SQL

---

## 验证清单

在继续下一步之前，请确认以下所有项目：

- [ ] D1数据库 `svtr-production` 已创建
- [ ] Database ID 已添加到 `wrangler.toml`
- [ ] Schema创建成功（10张表）
- [ ] 数据同步成功（263个节点）
- [ ] 节点类型分布正确（docx: 192, sheet: 65等）
- [ ] 发布文章URL已生成

---

## 下一步计划

完成以上步骤后，我们将继续：

1. **创建API端点** (`functions/api/articles/*.ts`)
   - 文章列表API
   - 文章详情API
   - 搜索API

2. **前端集成**
   - 更新内容社区页面
   - 创建文章详情页模板

3. **测试验证**
   - 本地开发测试
   - API功能验证

---

## 需要帮助？

如果遇到问题，请参考：
- [D1文档]: https://developers.cloudflare.com/d1/
- [Wrangler文档]: https://developers.cloudflare.com/workers/wrangler/
- 或在项目issue中提问

---

**当前状态**: 等待在Cloudflare Dashboard创建D1数据库

**预计剩余时间**: 20分钟（手动操作）
