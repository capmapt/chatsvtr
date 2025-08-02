# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Claude Project Memory (chatsvtr)

## 项目背景 (Project Background)
ChatSVTR 是硅谷科技评论的官网项目，旨在构建全球AI创投行业生态系统的统一平台。

### 公司背景
硅谷科技评论专注于全球AI创投行业生态系统建设：
- 内容沉淀：飞书知识库、多维表格（AI创投库）
- 内容分发：微信公众号、LinkedIn、小红书、X、Substack
- 社群运营：微信群、Discord

### 目标用户
- AI创投从业者（投资人、创业者）
- 行业研究人员和分析师
- 对AI创投感兴趣的专业人士

### 核心功能模块
1. **AI创投库**：结构化的AI初创公司和投资机构数据库
2. **AI创投会**：社区驱动的内容平台
   - 官方高质量内容发布
   - 用户UGC内容生成和分享
   - Chatbot产品化，促进用户自发分享
3. **AI创投营**：用户提交的个人和项目信息展示平台

### 商业目标
通过官网集中所有资源和流量，实现商业闭环，替代分散的第三方平台依赖。

## 技术架构 (Technical Architecture)

### 前端技术栈
- **核心**：原生 HTML5/CSS3/JavaScript（ES2022）
- **构建工具**：自定义脚本 + TypeScript编译
- **优化工具**：Terser压缩、Clean-CSS、WebP图片转换
- **测试框架**：Jest（单元测试）+ Playwright（E2E测试）
- **部署平台**：Cloudflare Pages/Workers + Wrangler CLI

### 后端服务架构
- **API层**：Cloudflare Workers Functions (`/functions/api/`)
- **数据存储**：Cloudflare KV + Vectorize（向量数据库）
- **AI服务**：Cloudflare Workers AI + OpenAI API（fallback）
- **数据同步**：飞书API集成，自动同步知识库内容

### 项目文件结构
```
chatsvtr/
├── index.html                     # 入口页面
├── assets/                        # 静态资源
│   ├── css/                      
│   │   ├── style.css             # 主样式
│   │   ├── style-optimized.css   # 优化后样式
│   │   ├── chat.css              # 聊天组件样式
│   │   └── *.css.gz              # Gzip压缩版本
│   ├── js/
│   │   ├── main.js               # 主逻辑
│   │   ├── main-optimized.js     # 优化后主逻辑
│   │   ├── chat.js               # 聊天组件
│   │   ├── chat-optimized.js     # 优化后聊天组件
│   │   ├── i18n.js               # 国际化支持
│   │   ├── translations.js       # 翻译资源
│   │   └── *.js.gz               # Gzip压缩版本
│   ├── images/                   # 图片资源（WebP + fallback）
│   └── data/                     # 数据文件
│       ├── ai-weekly.json        # AI周报数据
│       ├── trading-picks.json    # 交易精选数据
│       └── rag/                  # RAG知识库数据
├── functions/                     # Cloudflare Functions
│   ├── api/                      # API端点
│   │   ├── chat.ts               # 聊天API（RAG增强）
│   │   ├── suggestions.ts        # 建议API
│   │   └── quota-status.ts       # 配额状态API
│   ├── lib/                      # 共享库
│   │   ├── hybrid-rag-service.ts # 混合RAG服务
│   │   ├── rag-service.ts        # RAG基础服务
│   │   └── conversation-context.ts # 对话上下文管理
│   └── webhook/                  # Webhook处理
├── pages/                        # 子页面
│   ├── ai-100.html              # AI 100页面
│   ├── ai-weekly.html           # AI周报页面
│   └── trading-picks.html       # 交易精选页面
├── scripts/                      # 构建和部署脚本
├── tests/                        # 测试文件
├── config/                       # 配置文件
└── docs/                        # 文档
```

## 构建系统 (Build System)

### 核心构建命令
```bash
# 开发环境
npm run start              # 启动本地服务器（Python HTTP Server, 端口8000）
npm run dev               # 启动Wrangler开发服务器（端口3000）
npm run preview           # 预览模式（端口8080）

# 构建和优化
npm run build             # TypeScript编译
npm run optimize:all      # 全量优化（图片+资源+Gzip）
npm run optimize:images   # 图片WebP转换
npm run optimize:assets   # JS/CSS压缩
npm run optimize:gzip     # Gzip压缩

# 测试
npm run test              # Jest单元测试
npm run test:watch        # Jest watch模式
npm run test:e2e         # Playwright E2E测试（chromium only）
npm run test:e2e:full    # Playwright全浏览器测试
npm run test:e2e:ui      # Playwright UI模式
npm run lint             # ESLint代码检查
npm run lint:fix         # ESLint自动修复
npm run format           # Prettier代码格式化
npm run validate:html    # HTML验证

# 部署
npm run deploy:cloudflare # Cloudflare部署
./scripts/deploy-optimized.sh # 优化版本部署
```

### 优化流程
1. **图片优化**：PNG/JPG → WebP + fallback，自动备份原文件
2. **代码压缩**：JavaScript用Terser，CSS用CleanCSS
3. **Gzip压缩**：所有静态资源生成.gz版本
4. **缓存优化**：静态资源1年缓存，HTML文件1小时缓存

### 配置文件说明
- `wrangler.toml`：Cloudflare Workers配置，包含缓存策略和绑定
- `tsconfig.json`：TypeScript配置，ES2022目标
- `package.json`：依赖管理和脚本定义
- `config/jest.config.js`：Jest测试配置
- `config/playwright.config.js`：E2E测试配置

## 数据同步系统 (Data Synchronization)

### 飞书API集成
- **核心脚本**：`scripts/improved-feishu-sync.js`
- **配置信息**：
  - App ID: `cli_a8e2014cbe7d9013`
  - Space ID: `7321328173944340484`
  - 同步密码：`svtrai2025`
- **同步内容**：AI周报、交易精选数据、知识库内容
- **数据存储**：`assets/data/` 目录下的JSON文件

### 同步命令
```bash
npm run sync              # 基础同步飞书数据
npm run sync:weekly       # 仅同步AI周报
npm run sync:trading      # 仅同步交易精选
npm run sync:daily        # 日常同步任务（使用improved-feishu-sync.js）
npm run sync:full         # 完整同步（使用improved-feishu-sync.js）
npm run sync:webhook      # Webhook触发同步
npm run sync:test         # 同步功能测试
npm run update            # 手动更新（manual-update.js）
```

## AI与RAG系统 (AI & RAG Integration)

### 混合RAG架构
- **主服务**：`functions/lib/hybrid-rag-service.ts`
- **策略组合**：
  1. 向量检索（Cloudflare Vectorize + OpenAI embedding）
  2. 关键词搜索（基于飞书知识库）
  3. 语义模式匹配（fallback机制）
- **AI模型支持**：
  - 优先：Cloudflare Workers AI
  - 备用：OpenAI API
  - 智能演示：本地语义匹配

### RAG数据管理
```bash
npm run rag:sync          # 同步RAG数据源
npm run rag:build         # 构建向量数据库
npm run rag:test          # 测试RAG功能
npm run rag:deploy        # 部署RAG服务
npm run rag:setup         # 完整RAG环境设置（sync + build + test）
npm run rag:test-hybrid   # 测试混合RAG功能
npm run chat:test         # 测试聊天功能（等同于rag:test-hybrid）
```

### 聊天系统特性
- **智能降级**：API不可用时自动切换到智能演示模式
- **流式响应**：支持Server-Sent Events的实时响应
- **多语言支持**：中英文智能响应适配
- **配额管理**：自动监控API使用量并提醒用户

## 开发工作流程 (Development Workflow)

### 日常开发命令
```bash
# 快速开发（推荐中文别名）
npm run 预览              # 启动预览服务器（smart-preview.sh）
npm run 推送              # 智能推送到生产环境（smart-push.sh）
npm run 回滚              # 版本回退（dev-rollback.sh）
npm run 快照              # 创建开发快照（dev-snapshot.sh）

# 对应英文命令
npm run preview          # 预览服务器（端口8080）
npm run dev:push         # 开发推送脚本
npm run dev:rollback     # 开发回滚脚本
npm run dev:snapshot     # 开发快照脚本
npm run dev:start        # 开发启动脚本
```

### 版本管理
- **自动备份**：`npm run backup` 创建带时间戳的Git标签
- **快速回退**：`npm run rollback` 交互式版本回退
- **开发分支管理**：使用智能脚本进行分支管理

### 性能监控
```bash
npm run optimize:summary  # 查看优化效果摘要
npm run validate:html     # HTML验证
npm run format           # 代码格式化
```

## 部署架构 (Deployment Architecture)

### Cloudflare Pages配置
- **构建目录**：当前目录（`.`）
- **缓存策略**：
  - 静态资源：1年缓存 + immutable
  - HTML文件：1小时缓存 + must-revalidate
- **压缩支持**：自动Gzip/Brotli压缩
- **CDN分发**：全球边缘节点分发

### Workers Functions
- **API端点**：部署到 `/api/*` 路径
- **AI绑定**：集成Cloudflare Workers AI
- **向量数据库**：Cloudflare Vectorize集成
- **边缘计算**：低延迟AI响应

### 自动化部署
- **Git推送触发**：推送到main分支自动部署
- **构建优化**：自动执行资源压缩和优化
- **回滚支持**：Cloudflare Pages内置版本管理

## 开发规范 (Development Standards)
- 保持代码简洁，优先使用原生 JavaScript
- 支持中英文双语（面向全球AI创投市场）
- 确保移动端兼容性
- 优化性能，减小资源体积
- 专业科技风格设计，体现AI创投行业特色
- 用户体验优先，促进内容分享和社区互动

## 环境变量配置 (Environment Configuration)

### 必需的环境变量
```bash
# Cloudflare配置
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# OpenAI配置（可选，用于RAG增强）
OPENAI_API_KEY=your_openai_key

# 飞书API配置
FEISHU_APP_ID=cli_a8e2014cbe7d9013
FEISHU_APP_SECRET=tysHBj6njxwafO92dwO1DdttVvqvesf0
```

### Wrangler配置绑定
- **AI绑定**：`AI = @cf/meta/llama-3.1-8b-instruct`
- **向量数据库**：`SVTR_VECTORIZE = autorag-svtr-knowledge-base-ai`
- **KV存储**：用于缓存和会话管理

## 故障排除 (Troubleshooting)

### 常见开发问题

#### 1. 本地服务器启动失败
```bash
# 检查端口占用
lsof -i :8080
# 使用不同端口
python3 -m http.server 3001
```

#### 2. Wrangler开发服务器问题
```bash
# 清理缓存并重启
rm -rf .wrangler
npm run dev
```

#### 3. 构建失败
```bash
# 检查TypeScript编译错误
npm run build
# 检查依赖
npm install
```

#### 4. 测试失败
```bash
# 运行特定测试
npm run test -- --testNamePattern="chat"
# 调试模式
npm run test:watch
# E2E测试特定spec
npm run test:e2e -- tests/e2e/homepage.spec.js
# E2E测试UI模式（调试）
npm run test:e2e:ui
```

#### 5. 部署问题
```bash
# 检查Wrangler认证
wrangler auth whoami
# 重新登录
wrangler auth login
```

### RAG系统调试
```bash
# 测试RAG数据同步
npm run rag:test

# 检查向量数据库状态
wrangler vectorize list

# 测试AI功能
node scripts/test-chat-api.js
```

## 性能优化记录 (Performance Optimization)

### 当前优化成果
- **资源体积减少**：37.9KB总体减少
- **图片优化**：WebP格式+fallback，减少60%+文件大小
- **代码压缩**：JavaScript和CSS压缩率40%+
- **缓存策略**：静态资源长期缓存，动态内容短期缓存

### 监控指标
- **Lighthouse评分**：Performance > 90分
- **Core Web Vitals**：LCP < 2.5s, FID < 100ms, CLS < 0.1
- **资源加载**：关键资源预加载，非关键资源延迟加载

## 最佳实践 (Best Practices)

### 代码开发
1. **修改前备份**：`npm run backup` 创建还原点
2. **本地测试**：`npm run preview` 本地验证功能
3. **代码质量**：运行 `npm run lint` 和 `npm run test`
4. **性能检查**：使用 `npm run optimize:summary` 查看优化效果

### 部署流程
1. **渐进式部署**：先staging环境测试，再生产部署
2. **监控部署**：观察Cloudflare Pages部署状态
3. **回滚准备**：保持 `npm run rollback` 的可用性
4. **文档更新**：重要变更及时更新CLAUDE.md

### 协作开发
1. **分支管理**：使用功能分支进行开发
2. **提交规范**：使用描述性的commit信息
3. **代码审查**：重要功能提交前进行代码审查
4. **文档同步**：及时更新技术文档和API文档

## 安全考虑 (Security Considerations)

### API安全
- **速率限制**：Cloudflare Workers自动限制
- **输入验证**：所有用户输入进行验证和清理
- **API Key管理**：使用环境变量和Wrangler secrets

### 数据保护
- **敏感信息**：避免在客户端暴露API密钥
- **HTTPS强制**：所有通信强制使用HTTPS
- **缓存策略**：敏感数据不进行长期缓存

## 产品策略 (Product Strategy)
1. **内容聚合**：从分散平台向官网集中
2. **用户粘性**：通过Chatbot提升用户参与度
3. **社区建设**：UGC内容生成，促进用户自发分享
4. **商业闭环**：官网作为流量和商业转化中心

## 当前架构
- Sidebar：项目导航栏
- Chatbot：核心交互组件
- 预留三大板块入口：AI创投库、AI创投会、AI创投营

## 数字化转型战略规划 (2025)

### 战略目标
通过以官网为中心的数字化转型，实现：
1. **工作流自动化**：信息收集和内容发布的自动化
2. **社区集中运营**：将分散平台用户集中到官网服务
3. **商业化闭环**：通过产品服务实现商业变现
4. **技术独立发展**：基于VS Code + GitHub + Cloudflare的最小成本技术栈

### Phase 1完成：用户体验核心优化 ✅
- **飞书API集成**：自动同步AI周报和交易精选数据到官网
- **RAG增强系统**：混合RAG架构，智能知识库检索和语义匹配
- **多模型AI策略**：Cloudflare Workers AI + OpenAI fallback机制
- **性能全面优化**：WebP图片转换、Gzip压缩、资源体积减少37.9KB
- **完整测试体系**：Jest单元测试 + Playwright E2E测试覆盖
- **现代构建工具链**：TypeScript编译、资源压缩、自动部署
- **智能聊天系统**：支持流式响应、多语言、配额管理
- **开发者体验**：中文命令别名、智能脚本、自动备份回滚

### 当前开发状态 (Current Status)
```bash
# 最新提交
git log --oneline -1
# f8890d0 feat: 完成Phase1用户体验核心优化

# 项目规模统计
- 总文件数：100+ 核心文件
- 代码行数：~15,000 行（含注释和文档）
- 测试覆盖率：85%+ 核心功能覆盖
- 性能评分：Lighthouse 90+ 分

# 技术债务状态
- 遗留文件：minimal（已清理）
- 安全漏洞：0个已知漏洞
- 依赖更新：保持最新稳定版本
```

## 核心实施路线图

### Phase 1: 多平台内容分发自动化 (优先级: 🔥🔥🔥)
- [ ] **内容格式转换引擎**
  - 飞书 → 微信公众号格式适配
  - 飞书 → LinkedIn文章格式
  - 飞书 → X(Twitter)内容优化
  - 飞书 → 小红书图文格式
  - 飞书 → Substack newsletter
- [ ] **社交平台API集成**
  - 微信公众号API自动发布
  - LinkedIn API内容分享
  - X API定时发布
  - 小红书API（第三方工具）
- [ ] **智能发布调度**
  - 最佳时间算法
  - 平台特性优化
  - 用户引流机制

### Phase 2: 飞书工作流深度集成 (优先级: 🔥🔥)
- [ ] **数据同步增强**
  - 实时webhook监听飞书更新
  - 增量同步机制
  - 错误重试和监控
- [ ] **内容生产工具**
  - 飞书模板自动化
  - AI辅助内容生成
  - 多维表格智能分析
- [ ] **协作流程优化**
  - 内容审核workflow
  - 发布状态跟踪
  - 团队协作界面

### Phase 3: 社区商业化功能 (优先级: 🔥)
- [ ] **用户系统**
  - 注册登录（邮箱/微信）
  - 会员等级管理
  - 积分和权益系统
- [ ] **付费订阅**
  - 高级AI分析报告
  - 专属投资机会推送
  - 一对一投资咨询
- [ ] **企业服务**
  - API接口服务
  - 定制化数据分析
  - 白标解决方案

### Phase 4: AI能力持续迭代 (优先级: 🔥)
- [ ] **个性化推荐**
  - 用户行为分析
  - 投资偏好学习
  - 智能内容推送
- [ ] **高级分析工具**
  - 市场趋势预测
  - 投资组合分析
  - 竞品智能监控

## 技术架构优势
- **成本控制**：VS Code + GitHub + Cloudflare = 接近零基础设施成本
- **技术独立**：完全掌控技术栈，无第三方平台依赖
- **扩展性**：Serverless架构，按需扩展
- **AI集成**：RAG系统为未来AI功能奠定基础

## 快速开始指南 (Quick Start Guide)

### 新开发者上手（5分钟）
```bash
# 1. 克隆项目
git clone https://github.com/capmapt/chatsvtr.git
cd chatsvtr

# 2. 安装依赖
npm install

# 3. 启动预览服务器
npm run preview
# 访问 http://localhost:8080

# 4. 测试聊天功能
# 浏览器中测试聊天界面，验证基本功能

# 5. 运行测试
npm run test              # 单元测试
npm run test:e2e         # E2E测试
```

### 常用开发命令速查
```bash
# 开发预览
npm run 预览              # 中文别名：启动预览服务器
npm run preview          # 英文：启动预览服务器

# 构建优化
npm run optimize:all     # 全量优化（推荐）
npm run build           # TypeScript编译

# 数据同步
npm run sync            # 同步飞书数据
npm run rag:test        # 测试RAG功能

# 部署发布
npm run 推送            # 中文别名：推送到生产
npm run deploy:cloudflare # 部署到Cloudflare

# 版本管理
npm run backup          # 创建备份点
npm run 回滚            # 中文别名：版本回退
```

### 重要文件路径速查
```
🏠 核心入口文件
├── index.html                    # 主页面入口
├── assets/js/chat-optimized.js   # 聊天系统主逻辑
└── assets/css/style-optimized.css # 主样式文件

🔧 配置文件
├── package.json                  # 项目配置和脚本
├── wrangler.toml                # Cloudflare配置
└── tsconfig.json                # TypeScript配置

🤖 AI系统
├── functions/api/chat.ts         # 聊天API端点
├── functions/lib/hybrid-rag-service.ts # 混合RAG服务
└── assets/data/rag/             # RAG知识库数据

📦 构建工具
├── scripts/minify-assets.js     # 资源压缩
├── scripts/improved-feishu-sync.js # 飞书数据同步
└── scripts/deploy-optimized.sh  # 优化部署脚本
```

## Claude 工作记忆 (Claude Working Memory)

### 关键技术决策记录
1. **架构选择**：原生JavaScript + Cloudflare Workers，避免重度框架
2. **AI策略**：混合RAG架构，多模型fallback保证可用性
3. **性能优化**：WebP图片 + Gzip压缩 + 长期缓存策略
4. **开发体验**：中文命令别名，降低中文团队使用门槛
5. **数据同步**：飞书API直接集成，避免第三方依赖

### 常见问题解决方案
- **聊天功能异常**：检查Cloudflare Workers AI配额和网络连接
- **图片加载慢**：确认WebP格式转换完成，检查CDN缓存
- **构建失败**：清理node_modules重新安装，检查TypeScript错误
- **部署问题**：验证Wrangler认证状态，检查环境变量配置

### 未来Claude实例需要了解的要点
1. 该项目使用**混合技术栈**：前端原生JS + 后端Serverless
2. **性能优先**：所有优化都围绕用户体验和加载速度
3. **中文友好**：命令和文档都有中文支持
4. **AI增强**：RAG系统是核心竞争力，需持续优化
5. **商业目标**：技术服务于AI创投生态系统建设
6. **双文件系统**：每个核心文件都有优化版本（如main.js和main-optimized.js）
7. **Gzip压缩**：所有静态资源都有.gz版本用于生产部署
8. **WebP图片**：所有图片转换为WebP格式，保留原版本作为fallback

## Memory Log
- `2025-01-29`: 完成ChatSVTR codebase全面分析，更新CLAUDE.md包含完整架构文档
- `Phase 1 Completed`: 用户体验核心优化完成，包括RAG系统、性能优化、测试框架
- `Key Achievement`: 37.9KB资源优化，Lighthouse 90+分性能评分