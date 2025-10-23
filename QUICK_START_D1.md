# D1数据库快速启动指南

> ⏱️ 预计20分钟完成全部设置

## 📋 前置准备

- ✅ 已完成的工作
  - 数据库Schema (`database/d1-complete-schema.sql`)
  - 同步SQL文件 (`database/sync-data.sql` - 1.98MB, 263节点)
  - API端点 (`functions/api/articles/*.ts`)
  - 测试页面 (`test-d1-api.html`)

## 🚀 5步快速部署

### 步骤1: 创建D1数据库（5分钟）

```
1. 访问: https://dash.cloudflare.com/
2. 登录账号: liumin.gsm@gmail.com
3. 左侧菜单: Workers & Pages → D1 SQL Database
4. 点击: "Create database"
5. 名称: svtr-production
6. 点击: "Create"
7. 复制显示的 Database ID
```

### 步骤2: 更新配置（1分钟）

编辑 `wrangler.toml`，添加：

```toml
# D1数据库绑定（添加到文件末尾）
[[d1_databases]]
binding = "DB"
database_name = "svtr-production"
database_id = "粘贴你的Database ID"
```

### 步骤3: 创建表结构（2分钟）

```bash
cd c:\Projects\chatsvtr

npx wrangler d1 execute svtr-production --remote --file=./database/d1-complete-schema.sql
```

**预期输出**:
```
🚣 Executed 10 commands in 1.23s
```

### 步骤4: 导入数据（3分钟）

```bash
npx wrangler d1 execute svtr-production --remote --file=./database/sync-data.sql
```

**注意**: 文件较大（1.98MB），需要1-2分钟执行

**预期输出**:
```
🚣 Executed 790+ commands in 15.67s
```

### 步骤5: 验证部署（3分钟）

```bash
# 检查节点数量
npx wrangler d1 execute svtr-production --remote --command="SELECT COUNT(*) as total FROM knowledge_base_nodes"

# 应该显示: total = 263
```

```bash
# 检查文章数量
npx wrangler d1 execute svtr-production --remote --command="SELECT COUNT(*) as total FROM published_articles WHERE status='published'"

# 应该显示: total = 180-200
```

---

## 🧪 测试API（5分钟）

### 方式1: 使用Web测试页面

```bash
# 启动开发服务器
npm run dev

# 访问测试页面
# http://localhost:3000/test-d1-api.html
```

在页面上：
1. 点击"测试文章列表" - 应该显示10篇文章
2. 点击"测试文章详情" - 应该显示完整内容
3. 检查控制台无错误

### 方式2: 使用curl

```bash
# 测试文章列表
curl http://localhost:3000/api/articles?limit=5

# 测试文章详情（替换为实际slug）
curl http://localhost:3000/api/articles/ai创投观察丨2025-q3-stZ4wqMc
```

### 方式3: 使用浏览器

访问：
```
http://localhost:3000/api/articles
```

应该看到JSON响应，包含文章列表。

---

## ✅ 验证清单

在继续之前，请确认：

- [ ] D1数据库 `svtr-production` 已创建
- [ ] `wrangler.toml` 已更新 Database ID
- [ ] Schema执行成功（10张表）
- [ ] 数据导入成功（263节点）
- [ ] 文章数量正确（180-200篇）
- [ ] API测试通过（列表和详情）
- [ ] 无JavaScript错误

---

## 🔧 常见问题

### Q1: "Authentication error [code: 10000]"

**解决**:
```bash
npx wrangler logout
npx wrangler login
# 重新在浏览器授权
```

### Q2: "Request entity too large"

**解决**: SQL文件太大，使用Dashboard手动执行
1. 访问 https://dash.cloudflare.com/ → D1 → svtr-production → Console
2. 复制 `database/sync-data.sql` 内容
3. 分批粘贴执行（每次1000行）

### Q3: API返回404

**原因**: Workers未部署或路由未配置

**解决**:
```bash
# 重新部署
npm run dev

# 或部署到生产
npm run deploy:cloudflare
```

### Q4: 数据为空

**原因**: sync-data.sql未执行

**验证**:
```bash
npx wrangler d1 execute svtr-production --remote --command="SELECT COUNT(*) FROM knowledge_base_nodes"
```

如果返回0，重新执行步骤4。

---

## 📊 期待的结果

### 数据库状态
```
knowledge_base_nodes:    263 rows
knowledge_base_content:  263 rows
published_articles:      ~190 rows
knowledge_base_relations: ~100 rows
```

### API响应示例

**GET /api/articles?limit=2**:
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "slug": "ai创投观察丨2025-q3-stZ4wqMc",
        "meta_title": "AI创投观察丨2025 Q3：热度未退，资本正押注"确定性"",
        "category": "AI创投观察",
        "view_count": 1523,
        "publish_date": "2025-10-20"
      },
      ...
    ],
    "pagination": {
      "total": 192,
      "currentPage": 1,
      "hasMore": true
    }
  }
}
```

### 测试页面效果
访问 `test-d1-api.html` 应该看到：
- ✅ 文章列表加载成功
- ✅ 每篇文章显示标题、分类、日期、浏览数
- ✅ 点击详情按钮能加载完整内容
- ✅ 相关文章推荐正常显示

---

## 🎉 完成！

恭喜！你已经成功部署了D1数据库和API。

### 现在可以：
1. ✅ 通过API访问263个知识节点
2. ✅ 查询180+篇已发布文章
3. ✅ 使用分页、筛选、排序功能
4. ✅ 实时更新浏览计数
5. ✅ 为前端集成做好准备

### 下一步：
- [ ] 更新内容社区页面，调用D1 API
- [ ] 创建文章详情页模板
- [ ] 同步公司和投资人数据（数据榜单）
- [ ] 配置定时同步任务

---

## 📚 参考文档

- [完整实施总结](./D1_IMPLEMENTATION_SUMMARY.md)
- [详细部署步骤](./docs/D1_DEPLOYMENT_STEPS.md)
- [架构对比分析](./docs/D1_VS_FEISHU_ARCHITECTURE.md)
- [完整实施指南](./docs/D1_IMPLEMENTATION_COMPLETE_GUIDE.md)

---

**需要帮助？** 参考 `D1_IMPLEMENTATION_SUMMARY.md` 的故障排除章节。
