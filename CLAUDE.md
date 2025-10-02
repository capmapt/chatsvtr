# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# ChatSVTR - SVTR.AI全球AI创投平台

## 项目概述
ChatSVTR 是硅谷科技评论(SVTR.AI)的官网项目，全球AI创投行业的统一平台。

### 核心技术栈
- **前端**: 原生HTML5/CSS3/JavaScript (ES2022)
- **后端**: Cloudflare Workers + Functions
- **数据存储**: Cloudflare KV + Vectorize
- **AI服务**: Cloudflare Workers AI + OpenAI fallback
- **构建**: TypeScript + 自定义脚本优化

### 关键目录结构
```
chatsvtr/
├── index.html                 # 主入口
├── assets/                    # 静态资源
│   ├── js/chat-optimized.js  # 聊天系统
│   └── css/style-optimized.css # 主样式
├── functions/api/            # Cloudflare Functions
│   ├── chat.ts              # 聊天API + RAG
│   └── suggestions.ts       # 建议API
├── pages/                   # 子页面
└── scripts/                 # 构建脚本
```

## 核心开发命令

### 开发环境
```bash
npm run dev              # Wrangler开发服务器 (端口3000)
npm run preview          # 预览服务器 (端口8080)
```

### 构建优化
```bash
npm run build            # TypeScript编译
npm run optimize:all     # 全量优化 (图片+资源+Gzip)
```

### 数据同步
```bash
npm run sync             # 智能飞书数据同步
npm run rag:test         # 测试RAG功能
```

### 测试
```bash
npm run test             # Jest单元测试
npm run test:e2e         # Playwright E2E测试
npm run lint             # ESLint检查
```

### 部署
```bash
npm run deploy:cloudflare # Cloudflare部署
```

## AI & RAG系统

### 混合RAG架构
- **主服务**: `functions/lib/hybrid-rag-service.ts`
- **数据源**: 飞书知识库 (252个节点完整内容)
- **AI模型**: OpenAI GPT + Cloudflare Workers AI
- **存储**: `assets/data/rag/enhanced-feishu-full-content.json`

### 飞书API集成
- **App ID**: `cli_a8e2014cbe7d9013`
- **Space ID**: `7321328173944340484`
- **同步脚本**: `scripts/smart-sync-strategy.js`

## 项目特色

### 性能优化
- WebP图片转换 + fallback
- JavaScript/CSS压缩 (Terser/CleanCSS)
- Gzip压缩所有静态资源
- 37.9KB总体积减少

### 开发体验
- 中文命令别名: `npm run 预览`, `npm run 推送`
- 智能同步策略: 自动数据质量检查
- 完整测试覆盖: 单元测试 + E2E测试
- 自动备份回滚: `npm run backup`, `npm run rollback`

## 重要文件快速导航

### 🏠 核心文件
- `index.html` - 主页面
- `assets/js/chat-optimized.js` - 聊天系统主逻辑
- `functions/api/chat.ts` - 聊天API端点

### 🔧 配置文件
- `package.json` - 项目配置和脚本
- `wrangler.toml` - Cloudflare配置
- `tsconfig.json` - TypeScript配置

### 📚 详细文档
详细文档已移至 `docs/` 目录:
- `docs/guides/` - MCP配置指南
- `docs/planning/` - 项目规划文档
- `docs/rag/` - RAG系统文档

## 开发最佳实践

### 修改前准备
```bash
npm run backup          # 创建Git备份标签
```

### 测试验证
```bash
npm run preview         # 本地预览
npm run test           # 运行测试
npm run lint           # 代码检查
```

### 部署流程
```bash
npm run optimize:all    # 资源优化
npm run deploy:cloudflare # 部署到生产环境
```

## 故障排除

### 常见问题
- **聊天功能异常**: 检查Cloudflare Workers AI配额
- **构建失败**: `rm -rf node_modules && npm install`
- **部署问题**: `wrangler auth whoami` 检查认证

### 重要提醒
- 该项目使用**混合技术栈**: 前端原生JS + 后端Serverless
- **性能优先**: 所有优化围绕用户体验和加载速度
- **双文件系统**: 核心文件都有优化版本 (如 `main.js` 和 `main-optimized.js`)

## Claude工作记忆
- 2025-08-19: 完成token消耗优化，移动大型文档到docs/目录，创建.claudeignore文件
- Phase 1已完成: 用户体验核心优化，包括RAG系统、性能优化、测试框架
- 关键成就: 37.9KB资源优化，Lighthouse 90+分性能评分