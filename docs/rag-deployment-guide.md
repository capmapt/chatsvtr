# SVTR.AI RAG系统部署指南

## 🎉 RAG功能已成功部署！

### ✅ 已完成的部署步骤:

1. **Chat API升级**: 已启用RAG增强版本
2. **Vectorize配置**: 已配置Cloudflare Vectorize绑定
3. **前端界面**: 已更新聊天组件和样式
4. **数据脚本**: 已准备飞书数据同步和向量化脚本

### 🚀 启用RAG功能的步骤:

#### 1. 环境配置
请确保 `.env` 文件包含以下配置:
```env
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxx

# OpenAI配置 (用于Embedding)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx

# Cloudflare配置 (用于Vectorize)
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxx
```

#### 2. 创建Vectorize索引
```bash
wrangler vectorize create svtr-knowledge-base --dimensions=1536 --metric=cosine
```

#### 3. 数据同步和向量化
```bash
# 同步飞书知识库数据
npm run rag:sync

# 向量化处理
npm run rag:build

# 测试RAG功能
npm run rag:test
```

#### 4. 部署到Cloudflare
```bash
wrangler pages deploy
```

### 🧪 测试RAG功能:

#### 自动化测试
```bash
npm run rag:test
```

#### 交互式测试
```bash
npm run rag:test -- --interactive
```

### 📊 监控和维护:

1. **数据更新**: 定期运行 `npm run rag:sync` 同步最新数据
2. **向量重建**: 数据大幅更新后运行 `npm run rag:build`
3. **性能监控**: 关注Cloudflare Dashboard中的Vectorize使用情况

### 🔧 故障排除:

#### 常见问题:
1. **Embedding API失败**: 检查OPENAI_API_KEY是否正确
2. **Vectorize连接失败**: 检查Cloudflare配置和索引是否创建
3. **飞书同步失败**: 检查飞书应用权限和API密钥

#### 回滚方案:
如需回滚到原始版本:
```bash
# 恢复原始Chat API
cp backups/rag-deployment/functions/api/chat.ts functions/api/chat.ts

# 重新部署
wrangler pages deploy
```

### 📈 预期效果:

- ✅ 基于SVTR真实数据的专业回答
- ✅ 显著提升回答质量和准确性
- ✅ 自动显示知识库来源和置信度
- ✅ 智能检索和上下文增强

---

部署时间: 7/22/2025, 9:44:14 PM
版本: RAG v1.0
