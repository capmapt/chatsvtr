# ChatSVTR 项目结构文档

> 最后更新: 2025-08-22
> 状态: 已清理和重新组织

## 📂 核心目录结构

```
chatsvtr/
├── 🏠 核心文件
│   ├── index.html              # 主页面
│   ├── package.json            # 项目依赖
│   ├── wrangler.toml          # Cloudflare配置
│   ├── tsconfig.json          # TypeScript配置
│   ├── sw.js                  # Service Worker
│   ├── robots.txt             # SEO爬虫配置
│   ├── sitemap.xml            # 站点地图
│   ├── _headers               # Cloudflare Headers
│   └── _routes.json           # Cloudflare路由
│
├── 📄 页面 (pages/)
│   ├── ai-100.html            # AI 100排行榜
│   ├── ai-weekly.html         # AI周报
│   ├── ai-daily-helper.html   # AI日常助手
│   ├── trading-picks.html     # 交易精选(项目对接)
│   ├── stats-widget.html      # 统计组件
│   ├── sync-dashboard.html    # 同步仪表板
│   ├── admin-center.html      # 管理中心
│   └── admin-dashboard.html   # 管理仪表板
│
├── 🎨 资源文件 (assets/)
│   ├── css/                   # 样式文件
│   │   ├── *-optimized.css    # 生产优化版本
│   │   └── *.css             # 功能模块样式
│   ├── js/                    # JavaScript文件  
│   │   ├── *-optimized.js     # 生产优化版本
│   │   └── *.js              # 功能模块脚本
│   ├── images/               # 图片资源
│   │   ├── *.webp            # WebP格式(优先)
│   │   ├── *.avif            # AVIF格式(次选)
│   │   └── *.jpg             # 备用格式
│   └── data/                 # 数据文件
│       ├── rag/              # RAG系统数据
│       └── trading-picks.json # 交易数据
│
├── ⚙️ 后端服务 (functions/)
│   ├── api/                  # API端点
│   │   ├── chat.ts           # 聊天API
│   │   ├── subscribe.ts      # 订阅服务
│   │   ├── auth/            # 认证相关
│   │   └── ...              # 其他API
│   ├── lib/                 # 共享库
│   │   ├── hybrid-rag-service.ts # RAG服务
│   │   ├── email-service.ts # 邮件服务
│   │   └── ...              # 其他服务
│   └── webhook/             # Webhook处理
│
├── 📜 脚本工具 (scripts/)
│   ├── development/         # 开发脚本
│   ├── testing/            # 测试脚本
│   ├── deployment/         # 部署脚本
│   ├── maintenance/        # 维护脚本
│   └── *.js               # 核心构建脚本
│
├── 🔧 配置文件 (config/)
│   ├── jest.config.js      # Jest测试配置
│   ├── babel.config.js     # Babel配置
│   ├── playwright.config.js # E2E测试配置
│   └── platform-templates/ # 平台模板
│
├── 📚 文档 (docs/)
│   ├── config/             # 配置文档
│   │   ├── oauth/          # OAuth配置指南
│   │   ├── AWS_SES_SETUP_GUIDE.md
│   │   └── MULTI_DOMAIN_CONFIG.md
│   ├── guides/             # 操作指南
│   ├── planning/           # 项目规划
│   ├── rag/               # RAG系统文档
│   ├── archived/          # 归档文档
│   └── archives/          # 历史记录
│
├── 🧪 测试 (tests/)
│   ├── e2e/               # 端到端测试
│   └── *.test.js          # 单元测试
│
├── 🔐 认证服务 (svtr-auth/)
│   ├── worker.ts          # 认证Worker
│   ├── package.json       # 独立配置
│   └── wrangler.toml      # 部署配置
│
├── 🎨 设计系统 (superdesign-mcp-claude-code/)
│   ├── src/               # MCP服务器源码
│   ├── dist/              # 编译输出
│   └── superdesign/       # 设计文件
│
├── 📊 监控日志 (logs/)
│   ├── cron-sync.log      # 同步日志
│   ├── sync-alerts.json   # 同步告警
│   └── *.json            # 监控数据
│
└── 📈 报告 (reports/)
    └── seo-report.json    # SEO分析报告
```

## 🎯 核心功能模块

### 1. **前端系统**
- **主页**: 响应式设计，多语言支持(中英文)
- **聊天系统**: AI聊天，RAG增强，流式响应
- **侧边栏**: 折叠式导航，QR码集成
- **统计组件**: 实时数据展示

### 2. **后端服务**
- **Cloudflare Workers**: 无服务器计算
- **RAG系统**: 混合检索增强生成
- **认证服务**: OAuth + 自建邮箱认证
- **数据同步**: Feishu MCP自动同步

### 3. **构建系统**
- **TypeScript**: 类型安全
- **优化流程**: CSS/JS压缩，图片优化
- **测试覆盖**: Jest单元测试 + Playwright E2E
- **部署自动化**: Cloudflare Pages

## 🌐 域名架构

### 主域名
- **https://svtr.ai** - 主站点

### 重定向域名 (301)
- `svtrglobal.com` → `https://svtr.ai`
- `svtrai.com` → `https://svtr.ai`  
- `www.svtr.ai` → `https://svtr.ai`

### 子域名服务
- `auth.svtr.ai` - 认证服务

## 🔧 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES2022)
- **后端**: Cloudflare Workers, TypeScript
- **数据库**: Cloudflare KV, Vectorize
- **AI服务**: OpenAI + Cloudflare Workers AI
- **构建工具**: Wrangler, Terser, CleanCSS
- **测试**: Jest, Playwright
- **监控**: 自定义日志系统

## 📋 项目状态

- ✅ **域名统一**: 完成多域名301重定向
- ✅ **文件清理**: 移除冗余和测试文件
- ✅ **结构优化**: 重新组织目录结构
- ✅ **SEO优化**: canonical、og:url、sitemap
- ✅ **性能优化**: 资源压缩、WebP图片
- ✅ **认证系统**: OAuth + 自建认证完整
- ✅ **RAG系统**: 智能问答功能完善

## 🚀 快速开始

```bash
# 开发环境
npm run dev              # Wrangler开发服务器

# 构建优化  
npm run build            # TypeScript编译
npm run optimize:all     # 全量资源优化

# 测试
npm run test             # Jest单元测试
npm run test:e2e         # Playwright E2E

# 部署
npm run deploy:cloudflare # 生产部署
```

---
*此文档记录了项目清理和重构后的最新状态，定期更新以保持同步。*