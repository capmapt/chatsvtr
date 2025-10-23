# 飞书API替换MCP工具计划

**创建时间**: 2025-10-22
**目的**: 将项目中所有飞书API直接调用替换为MCP工具调用，提升代码可维护性

---

## 📋 可用的MCP飞书工具

基于我们的MCP服务器配置，以下飞书API工具可用：

### 1. **Base (多维表) 相关**
- ✅ `mcp__feishu__bitable_v1_app_create` - 创建Base应用
- ✅ `mcp__feishu__bitable_v1_appTable_create` - 创建表
- ✅ `mcp__feishu__bitable_v1_appTableField_list` - 列出字段
- ✅ `mcp__feishu__bitable_v1_appTable_list` - 列出所有表
- ✅ `mcp__feishu__bitable_v1_appTableRecord_create` - 创建记录
- ✅ `mcp__feishu__bitable_v1_appTableRecord_search` - 搜索记录
- ✅ `mcp__feishu__bitable_v1_appTableRecord_update` - 更新记录

### 2. **用户管理相关**
- ✅ `mcp__feishu__contact_v3_user_batchGetId` - 批量获取用户ID

### 3. **文档相关**
- ✅ `mcp__feishu__docx_v1_document_rawContent` - 获取文档纯文本
- ✅ `mcp__feishu__docx_builtin_import` - 导入Markdown为文档

### 4. **权限相关**
- ✅ `mcp__feishu__drive_v1_permissionMember_create` - 添加协作者权限

### 5. **群聊相关**
- ✅ `mcp__feishu__im_v1_chat_create` - 创建群聊
- ✅ `mcp__feishu__im_v1_chat_list` - 获取群聊列表
- ✅ `mcp__feishu__im_v1_chatMembers_get` - 获取群成员
- ✅ `mcp__feishu__im_v1_message_create` - 发送消息
- ✅ `mcp__feishu__im_v1_message_list` - 获取聊天记录

### 6. **Wiki相关**
- ✅ `mcp__feishu__wiki_v2_space_getNode` - 获取Wiki节点信息

---

## 🔍 项目中飞书API使用情况分析

### 核心同步脚本

#### 1. **scripts/feishu-knowledge-to-d1-sync.js**
**当前API调用**:
```javascript
// 需要检查实际使用的API
- getTenantAccessToken() - 获取访问令牌
- 知识库节点列表API
- 文档内容API
- Sheet数据API
- Bitable数据API
```

**需要替换的功能**:
- [ ] 知识库节点遍历 → 可能需要组合多个MCP工具
- [ ] 文档内容获取 → `mcp__feishu__docx_v1_document_rawContent`
- [ ] Bitable数据读取 → `mcp__feishu__bitable_v1_appTableRecord_search`

#### 2. **scripts/enhanced-feishu-sync-v3.js**
**当前API调用**:
```javascript
// Sheet相关API
- getSheetData()
- getHiddenSheets()
- resolveImportRange()
```

**需要替换的功能**:
- [ ] Sheet数据读取 - **MCP工具不直接支持**
- [ ] 隐藏工作表检测 - **MCP工具不直接支持**

**问题**: MCP飞书工具似乎**不包含Sheet API**！

#### 3. **functions/api/wiki-funding-sync.ts**
**当前API调用**:
```javascript
- Bitable记录查询
- 字段映射
```

**需要替换的功能**:
- ✅ Bitable查询 → `mcp__feishu__bitable_v1_appTableRecord_search`
- ✅ 字段列表 → `mcp__feishu__bitable_v1_appTableField_list`

---

## ⚠️ 发现的限制

### 1. **Sheet API缺失**
**问题**: MCP飞书工具集**不包含**以下关键API：
- ❌ 获取Sheet元数据（工作表列表、隐藏状态）
- ❌ 读取Sheet数据
- ❌ 解析Sheet公式（如IMPORTRANGE）

**影响范围**:
- `scripts/enhanced-feishu-sync-v3.js` - 核心同步脚本
- `scripts/check-hidden-sheets.js` - 隐藏工作表检测
- `scripts/resolve-importrange.js` - 公式解析

**解决方案**:
1. **继续使用原生API** - Sheet相关功能保持现状
2. **请求MCP工具扩展** - 联系MCP维护者添加Sheet API
3. **改用Bitable** - 将Sheet数据迁移到Bitable（长期方案）

### 2. **知识库API限制**
**问题**: MCP工具中没有**知识库列表/遍历** API，只有单个节点查询。

**当前使用**:
- `scripts/feishu-knowledge-to-d1-sync.js` 需要遍历整个知识库

**解决方案**:
- 保留原生知识库列表API
- 使用MCP工具获取单个节点详情

---

## ✅ 可立即替换的API

### 优先级1: Bitable相关（生产环境使用）

#### A. wiki-funding-sync.ts
**当前代码**:
```typescript
// 原生API调用
const response = await fetch(`https://open.feishu.cn/open-api/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({...})
});
```

**替换为MCP**:
```typescript
import { mcp__feishu__bitable_v1_appTableRecord_search } from '@mcp/feishu';

const records = await mcp__feishu__bitable_v1_appTableRecord_search({
  path: {
    app_token: appToken,
    table_id: tableId
  },
  data: {
    filter: {...},
    sort: [...]
  },
  useUAT: false  // 使用tenant_access_token
});
```

**优势**:
- 自动处理认证
- TypeScript类型安全
- 自动重试和错误处理

#### B. new-bitable-data.ts
**替换范围**:
- Bitable表列表查询 → `mcp__feishu__bitable_v1_appTable_list`
- Bitable字段查询 → `mcp__feishu__bitable_v1_appTableField_list`
- Bitable记录搜索 → `mcp__feishu__bitable_v1_appTableRecord_search`

### 优先级2: 文档相关

#### A. 获取文档内容
**当前**: 原生`/docx/v1/documents/:document_id/raw_content` API

**替换**: `mcp__feishu__docx_v1_document_rawContent`
```typescript
const content = await mcp__feishu__docx_v1_document_rawContent({
  path: { document_id: docId },
  params: { lang: 0 }  // 0=中文, 1=英文
});
```

### 优先级3: Wiki相关

#### A. 获取Wiki节点
**当前**: 原生`/wiki/v2/spaces/:space_id/nodes/:node_token` API

**替换**: `mcp__feishu__wiki_v2_space_getNode`
```typescript
const node = await mcp__feishu__wiki_v2_space_getNode({
  params: {
    token: nodeToken,
    obj_type: 'docx'  // 或 sheet, bitable等
  }
});
```

---

## 📝 实施计划

### Phase 1: Bitable API替换（高优先级）
**时间**: 1-2小时
**文件**:
1. ✅ `functions/api/wiki-funding-sync.ts` - 生产环境融资数据API
2. ✅ `functions/api/new-bitable-data.ts` - 新Bitable数据源
3. ✅ `scripts/test-new-bitable-source.js` - 测试脚本

**步骤**:
1. 创建`functions/lib/feishu-mcp-client.ts` - MCP客户端封装
2. 逐个文件替换Bitable API
3. 本地测试验证
4. 部署到生产环境

### Phase 2: 文档/Wiki API替换（中优先级）
**时间**: 2-3小时
**文件**:
1. `scripts/feishu-knowledge-to-d1-sync.js` - 知识库同步
2. 其他文档读取脚本

**步骤**:
1. 替换文档内容获取API
2. 替换Wiki节点查询API
3. 保留知识库列表API（MCP不支持）

### Phase 3: Sheet API保留（暂不替换）
**原因**: MCP工具不支持Sheet API

**保留的文件**:
- `scripts/enhanced-feishu-sync-v3.js`
- `scripts/check-hidden-sheets.js`
- `scripts/resolve-importrange.js`

**长期方案**:
- 联系MCP维护者添加Sheet API支持
- 或将关键Sheet数据迁移到Bitable

---

## 🎯 预期收益

### 1. **代码质量**
- ✅ TypeScript类型安全
- ✅ 统一的错误处理
- ✅ 自动认证管理

### 2. **可维护性**
- ✅ 减少重复的认证逻辑
- ✅ 统一的API调用方式
- ✅ 更好的代码复用

### 3. **可靠性**
- ✅ MCP工具内置重试机制
- ✅ 更好的错误提示
- ✅ 自动token刷新

### 4. **性能**
- ✅ 连接池复用
- ✅ 自动并发控制
- ⚠️ 可能略慢（多一层封装）

---

## ❓ 待确认问题

### 1. MCP工具性能
- [ ] MCP工具的调用延迟如何？
- [ ] 是否支持批量操作？
- [ ] 并发限制是多少？

### 2. Sheet API支持
- [ ] 是否有计划添加Sheet API？
- [ ] 有无替代方案？

### 3. 知识库API
- [ ] 是否支持知识库列表/遍历？
- [ ] 如何获取子节点列表？

---

## 📊 总结

### 可替换API统计
- ✅ **Bitable API**: 7个 - 完全支持
- ✅ **文档API**: 2个 - 完全支持
- ✅ **Wiki API**: 1个 - 部分支持（单节点查询）
- ❌ **Sheet API**: 0个 - 不支持
- ❌ **知识库列表API**: 0个 - 不支持

### 建议
1. **立即开始**: Phase 1 Bitable API替换（影响生产环境）
2. **谨慎处理**: Sheet API保持原生调用（MCP不支持）
3. **长期优化**: 与MCP维护者沟通，补充缺失API

---

**创建者**: Claude Code
**创建时间**: 2025-10-22
**状态**: 📋 分析完成，等待实施决策
