# 飞书API权限升级申请

## 申请应用信息
- **应用ID**: cli_a8e2014cbe7d9013
- **应用名称**: SVTR硅谷科技评论 API集成
- **申请时间**: 2025年8月7日

## 当前权限范围
✅ 已有权限：
- `wiki:wiki.space.read` - 知识库空间读取
- `docx:docx.document.read` - 文档基础读取
- `auth:tenant_access_token` - 租户访问令牌

## 申请新增权限

### 1. Wiki知识库权限
```
wiki:wiki.node.read_all     - 完整节点内容读取
wiki:wiki.node.view         - 节点详细内容查看  
wiki:wiki.children.view     - 子节点查看权限
wiki:wiki.space.read_all    - 知识库完整读取
wiki:wiki.content.read      - Wiki内容读取
```

### 2. 文档权限升级
```
docx:docx.document.read_all - 完整文档内容读取
docx:docx.content.read      - 文档结构化内容读取
```

### 3. 电子表格权限
```
sheets:sheets.spreadsheet.read     - 电子表格读取
sheets:sheets.spreadsheet.view     - 电子表格查看
sheets:sheets.cell.read            - 单元格数据读取
```

### 4. 批量操作权限
```
wiki:wiki.batch.read        - 批量节点查询
api:api.batch.request       - 批量API请求
```

## 申请理由

### 业务背景
SVTR(硅谷科技评论)是专业的AI创投生态系统分析平台，需要通过飞书知识库API获取以下关键数据：

1. **AI创投库数据**: 10,761+ 全球AI公司信息
2. **市场分析报告**: 季度观察和行业趋势分析  
3. **投资人网络**: 121,884+ 专业投资人数据
4. **实时资讯**: 每日更新的行业动态

### 技术需求
我们需要通过API实现：

- **完整知识库遍历**: 获取所有子节点和层级结构
- **结构化数据提取**: 从文档和表格中提取结构化信息
- **自动化数据同步**: 每日自动同步最新内容
- **RAG系统集成**: 为AI聊天机器人提供专业知识库

### 当前限制及影响
使用基础权限时遇到的问题：

1. `/wiki/v2/nodes/{token}/children` → 404 (无法获取子节点)
2. `/wiki/v2/nodes/{token}/content` → 404 (无法获取完整内容)
3. `/sheets/v2/spreadsheets/{token}` → 404 (无法读取电子表格)
4. 批量查询API不可用，同步效率低下

### 数据使用承诺
我们承诺：

- ✅ 仅用于SVTR平台内部数据分析和展示
- ✅ 不会泄露或转售任何原始数据
- ✅ 严格遵循飞书平台使用条款
- ✅ 实施数据访问控制和安全措施
- ✅ 定期删除过期的缓存数据

## 联系信息
- **申请人**: SVTR团队
- **邮箱**: 请提供你的邮箱地址
- **公司**: 硅谷科技评论 (Silicon Valley Tech Review)  
- **网站**: svtr.ai
- **飞书workspace**: svtrglobal.feishu.cn

## 预期时间线
- **申请提交**: 2025年8月7日
- **期望审核时间**: 3-5个工作日
- **测试验证**: 权限获得后24小时内完成测试
- **正式上线**: 测试通过后立即投入生产使用