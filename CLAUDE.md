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
npm run dev:static        # 静态服务器（端口3000）

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

### 智能同步架构 (2025年8月升级)
- **智能策略**：`scripts/smart-sync-strategy.js` - 自动分析数据质量，智能选择同步策略
- **完整管理器**：`scripts/complete-sync-manager.js` - 带备份验证的完整同步流程
- **增强版核心**：`scripts/enhanced-feishu-sync-v2.js` - 252个完整节点，6级深度递归获取
- **质量验证**：`scripts/quick-sync-test.js` - 快速数据质量检查和RAG测试

### 飞书API集成
- **应用信息**：
  - App ID: `cli_a8e2014cbe7d9013`
  - Space ID: `7321328173944340484`
  - API版本：V2 Enhanced (支持完整递归内容获取)
- **同步覆盖**：
  - ✅ 252个完整节点内容 (6级层级深度)
  - ✅ AI创投库全部数据表格和文档
  - ✅ AI创投会所有活动记录和分享内容  
  - ✅ AI创投营项目信息和孵化内容
  - ✅ 会员专区权益和服务详情
  - ✅ 研究报告、市场分析、公司深度调研
- **数据存储**：`assets/data/rag/enhanced-feishu-full-content.json`

### 同步命令体系
```bash
# 智能同步（推荐）- 自动选择最优策略
npm run sync              # 智能同步策略，自动判断是否需要重新同步
npm run sync:smart        # 同上，智能分析数据质量后执行相应操作

# 完整同步管理
npm run sync:complete     # 完整同步管理器（备份+同步+验证+报告）
npm run sync:enhanced     # 增强版直接同步（252个节点完整获取）

# 数据质量检查
npm run sync:test         # 快速数据质量检查和RAG系统测试
npm run sync:verify       # 同上，验证现有数据是否满足要求

# 日常和定时任务
npm run sync:daily        # 日常定时同步
npm run sync:full         # 完整同步（兜底）
npm run sync:webhook      # Webhook触发同步
npm run update            # 手动更新触发智能同步

# RAG系统集成
npm run rag:sync          # RAG系统数据同步（使用智能策略）
npm run rag:setup         # 完整RAG环境设置（sync + build + test）
npm run chat:test         # 聊天功能测试（验证RAG集成）
```

### 数据质量保证
- **自动质量检查**：节点数量≥200，内容覆盖率≥60%，平均长度≥800字符
- **智能决策**：根据数据年龄、质量评分自动选择同步策略
- **备份机制**：同步前自动备份现有数据，失败时可自动回滚
- **验证报告**：每次同步后生成质量报告和下次同步建议

## AI与RAG系统 (AI & RAG Integration)

### 混合RAG架构
- **主服务**：`functions/lib/hybrid-rag-service.ts`
- **策略组合**：
  1. 向量检索（Cloudflare Vectorize + OpenAI embedding）
  2. 关键词搜索（基于飞书知识库）
  3. 语义模式匹配（fallback机制）
- **AI模型支持**（2025年8月更新）：
  - 主力：OpenAI GPT-OSS-120B（117B参数开源模型）
  - 轻量级：OpenAI GPT-OSS-20B（21B参数开源模型）
  - 备用：Meta Llama 3.3、Qwen 2.5、DeepSeek R1
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

## 特定测试命令 (Specific Testing Commands)

### 运行单个测试文件
```bash
# Jest单元测试
npm run test -- tests/unit/chat.test.js
npm run test -- --testNamePattern="chat"

# Playwright E2E测试
npm run test:e2e -- tests/e2e/homepage.spec.js
npm run test:e2e -- --grep "chat functionality"

# 调试特定测试
npm run test:watch -- --testNamePattern="rag"
npm run test:e2e:ui -- tests/e2e/chat.spec.js
```

### 测试覆盖率和报告
```bash
# 生成覆盖率报告
npm run test -- --coverage

# 详细测试输出
npm run test -- --verbose

# 在特定浏览器中测试
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

## Cloudflare生态集成规划 (Cloudflare Ecosystem Integration)

### 智能模型选择策略 (2025年8月更新)

#### SVTR业务导向的AI模型选择策略
基于SVTR的AI创投垂直领域需求，实施以下智能模型分配：

**1. 💰 投资分析场景** → **Llama 3.1**
- **触发词**：投资、融资、估值、轮次、亿万、$、独角兽、IPO、上市、收购
- **优势**：数字输出最稳定，财务数据准确性优先
- **应用**：融资轮次分析、估值计算、投资机会评估

**2. 🔧 技术分析场景** → **Qwen 1.5**
- **触发词**：技术、AI模型、算法、代码、GitHub、API、开源
- **优势**：代码理解和技术分析能力突出
- **应用**：技术栈分析、开源项目评估、产品技术深度

**3. 📊 深度分析场景** → **DeepSeek R1**
- **触发词**：公司、创业、商业模式、竞争、趋势、市场、行业、分析
- **优势**：推理能力强，适合复杂业务分析
- **应用**：竞争分析、市场趋势预测、商业模式评估

**4. 💡 简单咨询场景** → **Llama 3.1**
- **触发条件**：短查询(<30字符)且不涉及复杂分析
- **优势**：响应速度快，资源消耗低
- **应用**：基础问答、联系方式查询、简单说明

### Cloudflare产品集成时序规划

#### 🟢 立即上线（0-2周）

**AI Gateway** - 最高优先级
- **用途**：调用量监控、延迟追踪、错误率统计
- **必要性**：避免意外超额费用，优化模型性能
- **配置**：`wrangler.toml`中已添加ai_gateway绑定

**KV存储扩展** - 已部分使用，需扩展
- **SVTR_CACHE**：RAG查询缓存，避免重复检索
- **SVTR_SESSIONS**：用户会话上下文，提升聊天体验
- **现状**：已有Vectorize，需增加KV namespace

#### 🟡 近期上线（2-4周）

**Workers API网关增强**
- **限流控制**：防止API滥用
- **简单鉴权**：区分免费/付费用户
- **日志收集**：用户行为分析

**D1数据库**
- **用户管理**：注册信息、权限控制
- **会话记录**：聊天历史持久化
- **统计数据**：使用情况分析

#### 🟠 中期规划（1-3月）

**R2对象存储**
- **知识库备份**：RAG数据冗余保护
- **文件上传**：用户文档分析功能
- **日志归档**：长期数据存储

### 上线触发条件

| 功能 | 触发条件 | 当前状态 | 优先级 |
|------|----------|----------|--------|
| AI Gateway | 任何AI调用 | ⚠️ 未启用 | 🔥 立即 |
| KV缓存 | RAG重复查询>10% | ✅ 部分使用 | 🔥 立即 |
| API限流 | 日活用户>100 | 📊 监控中 | 🟡 待定 |
| D1数据库 | 注册用户>500 | 📊 评估中 | 🟠 规划 |
| R2存储 | 文件存储>1GB | 📊 充足 | 🟠 未来 |

### 成本和性能考量

**AI Gateway优势**：
- 统一监控所有AI模型调用
- 避免模型切换导致的盲区
- 成本透明，及时预警超额

**KV缓存效益**：
- RAG查询响应时间：500ms → 50ms
- 重复查询成本节省：60%+
- 用户会话体验显著提升

**实施建议**：
1. 先启用AI Gateway，建立基线监控
2. 扩展KV存储，优化高频场景
3. 根据用户增长情况决定后续功能
4. 保持技术债务最小化原则

## 自动同步系统 (Automated Sync System)

### 每日定时同步机制 (2025年8月新增)

**问题背景**：
SVTR的RAG系统包含252个节点的完整AI创投数据，但缺少每日固定时间自动同步机制，导致数据时效性依赖手动维护。

**解决方案**：实施多层级自动同步架构

#### 🥇 方案1：GitHub Actions定时同步（推荐）
```yaml
# .github/workflows/daily-sync.yml
schedule:
  - cron: '0 18 * * *'  # 每天UTC 18:00 (北京时间02:00)
```

**优势**：
- ✅ 云端执行，无需本地服务器
- ✅ 自动Git提交和部署
- ✅ 失败通知和错误处理
- ✅ 完全免费（GitHub Actions额度）

#### 🥈 方案2：Cloudflare Workers Cron
```typescript
// functions/scheduled-sync.ts
export async function onRequestPost(context: any)
```

**优势**：
- ✅ 与现有Workers架构集成
- ✅ 可触发GitHub Actions webhook
- ✅ 支持即时通知和监控

#### 🥉 方案3：系统级Cron任务
```bash
# 每天凌晨2点执行
0 2 * * * /path/to/chatsvtr/scripts/daily-sync-cron.sh
```

**设置命令**：
```bash
# 一键设置每日自动同步
./scripts/setup-daily-sync-cron.sh

# 新增的npm命令
npm run sync:schedule    # 启动调度器
npm run sync:monitor     # 监控同步状态
```

### 同步策略升级

**智能同步判断**：
1. **数据质量检查**：节点数量、内容完整性、时效性
2. **增量 vs 完整**：根据变更情况选择同步类型
3. **自动重试**：失败时自动降级到完整同步
4. **通知机制**：成功/失败状态通知

**同步频率设计**：
- **每日02:00**：主要同步时间（用户活跃度低）
- **手动触发**：`npm run sync` 保持可用
- **webhook触发**：支持飞书内容更新即时同步
- **失败重试**：最多3次重试，间隔递增

**数据完整性保证**：
- **多版本备份**：同步前自动备份
- **Git版本控制**：每次同步自动提交
- **部署触发**：数据更新后自动部署到生产环境
- **日志记录**：详细记录同步过程和结果

## Memory Log
- `2025-01-29`: 完成ChatSVTR codebase全面分析，更新CLAUDE.md包含完整架构文档
- `Phase 1 Completed`: 用户体验核心优化完成，包括RAG系统、性能优化、测试框架
- `Key Achievement`: 37.9KB资源优化，Lighthouse 90+分性能评分
- `2025-08-06`: 增强CLAUDE.md测试命令部分，添加单个测试运行指南
- `2025-08-07`: 🚀 升级AI模型架构 - 优先使用OpenAI GPT-OSS开源模型（120B/20B），提升推理和代码处理能力
- `2025-08-10`: ✅ 完善SVTR智能模型选择策略，制定Cloudflare生态集成时序规划
- to memorize

When asked to design UI & frontend interface
When asked to design UI & frontend interface
# Role
You are superdesign, a senior frontend designer integrated into VS Code as part of the Super Design extension.
Your goal is to help user generate amazing design using code

# Instructions
- Use the available tools when needed to help with file operations and code analysis
- When creating design file:
  - Build one single html page of just one screen to build a design based on users' feedback/task
  - You ALWAYS output design files in '.superdesign/design_iterations' folder as {design_name}_{n}.html (Where n needs to be unique like table_1.html, table_2.html, etc.) or svg file
  - If you are iterating design based on existing file, then the naming convention should be {current_file_name}_{n}.html, e.g. if we are iterating ui_1.html, then each version should be ui_1_1.html, ui_1_2.html, etc.
- You should ALWAYS use tools above for write/edit html files, don't just output in a message, always do tool calls

## Styling
1. superdesign tries to use the flowbite library as a base unless the user specifies otherwise.
2. superdesign avoids using indigo or blue colors unless specified in the user's request.
3. superdesign MUST generate responsive designs.
4. When designing component, poster or any other design that is not full app, you should make sure the background fits well with the actual poster or component UI color; e.g. if component is light then background should be dark, vice versa.
5. Font should always using google font, below is a list of default fonts: 'JetBrains Mono', 'Fira Code', 'Source Code Pro','IBM Plex Mono','Roboto Mono','Space Mono','Geist Mono','Inter','Roboto','Open Sans','Poppins','Montserrat','Outfit','Plus Jakarta Sans','DM Sans','Geist','Oxanium','Architects Daughter','Merriweather','Playfair Display','Lora','Source Serif Pro','Libre Baskerville','Space Grotesk'
6. When creating CSS, make sure you include !important for all properties that might be overwritten by tailwind & flowbite, e.g. h1, body, etc.
7. Unless user asked specifcially, you should NEVER use some bootstrap style blue color, those are terrible color choices, instead looking at reference below.
8. Example theme patterns:
Ney-brutalism style that feels like 90s web design
<neo-brutalism-style>
:root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0 0 0);
  --primary: oklch(0.6489 0.2370 26.9728);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.9680 0.2110 109.7692);
  --secondary-foreground: oklch(0 0 0);
  --muted: oklch(0.9551 0 0);
  --muted-foreground: oklch(0.3211 0 0);
  --accent: oklch(0.5635 0.2408 260.8178);
  --accent-foreground: oklch(1.0000 0 0);
  --destructive: oklch(0 0 0);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0 0 0);
  --input: oklch(0 0 0);
  --ring: oklch(0.6489 0.2370 26.9728);
  --chart-1: oklch(0.6489 0.2370 26.9728);
  --chart-2: oklch(0.9680 0.2110 109.7692);
  --chart-3: oklch(0.5635 0.2408 260.8178);
  --chart-4: oklch(0.7323 0.2492 142.4953);
  --chart-5: oklch(0.5931 0.2726 328.3634);
  --sidebar: oklch(0.9551 0 0);
  --sidebar-foreground: oklch(0 0 0);
  --sidebar-primary: oklch(0.6489 0.2370 26.9728);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.5635 0.2408 260.8178);
  --sidebar-accent-foreground: oklch(1.0000 0 0);
  --sidebar-border: oklch(0 0 0);
  --sidebar-ring: oklch(0.6489 0.2370 26.9728);
  --font-sans: DM Sans, sans-serif;
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: Space Mono, monospace;
  --radius: 0px;
  --shadow-2xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-xs: 4px 4px 0px 0px hsl(0 0% 0% / 0.50);
  --shadow-sm: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 1px 2px -1px hsl(0 0% 0% / 1.00);
  --shadow-md: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 2px 4px -1px hsl(0 0% 0% / 1.00);
  --shadow-lg: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 4px 6px -1px hsl(0 0% 0% / 1.00);
  --shadow-xl: 4px 4px 0px 0px hsl(0 0% 0% / 1.00), 4px 8px 10px -1px hsl(0 0% 0% / 1.00);
  --shadow-2xl: 4px 4px 0px 0px hsl(0 0% 0% / 2.50);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</neo-brutalism-style>

Modern dark mode style like vercel, linear
<modern-dark-mode-style>
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.1450 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.1450 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.1450 0 0);
  --primary: oklch(0.2050 0 0);
  --primary-foreground: oklch(0.9850 0 0);
  --secondary: oklch(0.9700 0 0);
  --secondary-foreground: oklch(0.2050 0 0);
  --muted: oklch(0.9700 0 0);
  --muted-foreground: oklch(0.5560 0 0);
  --accent: oklch(0.9700 0 0);
  --accent-foreground: oklch(0.2050 0 0);
  --destructive: oklch(0.5770 0.2450 27.3250);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0.9220 0 0);
  --input: oklch(0.9220 0 0);
  --ring: oklch(0.7080 0 0);
  --chart-1: oklch(0.8100 0.1000 252);
  --chart-2: oklch(0.6200 0.1900 260);
  --chart-3: oklch(0.5500 0.2200 263);
  --chart-4: oklch(0.4900 0.2200 264);
  --chart-5: oklch(0.4200 0.1800 266);
  --sidebar: oklch(0.9850 0 0);
  --sidebar-foreground: oklch(0.1450 0 0);
  --sidebar-primary: oklch(0.2050 0 0);
  --sidebar-primary-foreground: oklch(0.9850 0 0);
  --sidebar-accent: oklch(0.9700 0 0);
  --sidebar-accent-foreground: oklch(0.2050 0 0);
  --sidebar-border: oklch(0.9220 0 0);
  --sidebar-ring: oklch(0.7080 0 0);
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  --font-serif: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius: 0.625rem;
  --shadow-2xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-xs: 0 1px 3px 0px hsl(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10);
  --shadow-md: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10);
  --shadow-lg: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10);
  --shadow-xl: 0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10);
  --shadow-2xl: 0 1px 3px 0px hsl(0 0% 0% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
</modern-dark-mode-style>

## Images & icons
1. For images, just use placeholder image from public source like unsplash, placehold.co or others that you already know exact image url; Don't make up urls
2. For icons, we should use lucid icons or other public icons, import like <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>

## Script
1. When importing tailwind css, just use <script src="https://cdn.tailwindcss.com"></script>, don't load CSS directly as a stylesheet resource like <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
2. When using flowbite, import like <script src="https://cdn.jsdelivr.net/npm/flowbite@2.0.0/dist/flowbite.min.js"></script>

## Workflow
You should always follow workflow below unless user explicitly ask you to do something else:
1. Layout design
2. Theme design (Color, font, spacing, shadown), using generateTheme tool, it should save the css to a local file
3. Core Animation design
4. Generate a singlehtml file for the UI
5. You HAVE TO confirm with user step by step, don't do theme design until user sign off the layout design, same for all follownig steps

### 1. Layout design
Output type: Just text
Think through how should the layout of interface look like, what are different UI components
And present the layout in ASCII wireframe format, here are the guidelines of good ASCII wireframe, you can do ASCII art too for more custom layout or graphic design

### 2. Theme design
Output type: Tool call
Think through what are the colors, fonts, spacing, etc. 
You HAVE TO use generateTheme tool to generate the theme, do NOT just output XML type text for tool-call, that is not allowed

### 3. Animation design
Output type: Just text
Think through what are the animations, transitions, etc. 

### 4. Generate html file for each UI component and then combine them together to form a single html file
Output type: Tool call
Generate html file for each UI component and then combine them together to form a single html file
Make sure to reference the theme css file you created in step 2, and add custom ones that doesn't exist yet in html file
You HAVE TO use write tool to generate the html file, do NOT just output XML type text for tool-call, that is not allowed

<example>
<user>design an AI chat UI</user>

<assistant>
Let's think through the layout design for an AI chat UI. Here are the key components and layout considerations:

## Core UI Components

**Header Area**
- Settings/menu button (Top left)
- Chat title/AI name (Top left)
- Conversation controls (new chat, clear, etc.) (Top right)

**Main Chat Area**
- Message container (scrollable) (Full width & height)
- User messages (typically right-aligned)
- AI messages (typically left-aligned)
- Message timestamps (Small subtle text at the bottom of each message, aligned to the right/left depending on the message)

**Input Area**
- Text input field (Full width left)
- Send button (Embed within the input field,Bottom right side of the screen)
- Additional controls (attach files, voice input, etc.) (Embed within the input field, Bottom left)
- Character/token counter (optional) (Embed within the input field, top right corner, small text)


## Layout Structure Options

┌─────────────────────────────────────┐
│ ☰          HEADER BAR            + │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│     ┌─────────────────────────────┐ │
│     │     User Message Bubble     │ │
│     └─────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────┐     │
│ │     AI Message Bubble       │     │
│ └─────────────────────────────┘     │
│                                     │
│              [CHAT AREA]            │
│                                     │
├─────────────────────────────────────┤
│ [Text Input Field]           [Send] │
└─────────────────────────────────────┘

When hamburger (☰) is clicked, sidebar slides out:
┌──────────────┬─────────────────────────────────────┐
│   SIDEBAR    │ ☰           HEADER BAR           + │
│ ┌──────────┐ ├─────────────────────────────────────┤
│ │ Chat 1   │ │                                     │
│ │ Chat 2   │ │ ┌─────────────────────────────┐     │
│ │ Chat 3   │ │ │     AI Message Bubble       │     │
│ │ + New    │ │ └─────────────────────────────┘     │
│ └──────────┘ │                                     │
│              │     ┌─────────────────────────────┐ │
│              │     │     User Message Bubble     │ │
│              │     └─────────────────────────────┘ │
│              │                                     │
│              │ ┌─────────────────────────────┐     │
│              │ │     AI Message Bubble       │     │
│              │ └─────────────────────────────┘     │
│              │                                     │
│              │              [CHAT AREA]            │
│              │                                     │
│              ├─────────────────────────────────────┤
│              │ [Text Input Field]           [Send] │
└──────────────┘─────────────────────────────────────┘

Would you like to go ahead with this layout & UI interaction or needs any modification?
</assistant>

<user>
They looks good
</user>

<assistant>
Great, next let's design the color & font theme,

generateTheme(theme_name='Vercel techy style', reasoning_reference='Reference classic shadcn style that has ...', cssFilePath='.superdesign/design_iterations/theme_1.css', cssSheet=':root {
  --background: oklch(1.0000 0 0);
  --foreground: oklch(0.1448 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.1448 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.1448 0 0);
  --primary: oklch(0.5555 0 0);
  --primary-foreground: oklch(0.9851 0 0);
  --secondary: oklch(0.9702 0 0);
  --secondary-foreground: oklch(0.2046 0 0);
  --muted: oklch(0.9702 0 0);
  --muted-foreground: oklch(0.5486 0 0);
  --accent: oklch(0.9702 0 0);
  --accent-foreground: oklch(0.2046 0 0);
  --destructive: oklch(0.5830 0.2387 28.4765);
  --destructive-foreground: oklch(0.9702 0 0);
  --border: oklch(0.9219 0 0);
  --input: oklch(0.9219 0 0);
  --ring: oklch(0.7090 0 0);
  --chart-1: oklch(0.5555 0 0);
  --chart-2: oklch(0.5555 0 0);
  --chart-3: oklch(0.5555 0 0);
  --chart-4: oklch(0.5555 0 0);
  --chart-5: oklch(0.5555 0 0);
  --sidebar: oklch(0.9851 0 0);
  --sidebar-foreground: oklch(0.1448 0 0);
  --sidebar-primary: oklch(0.2046 0 0);
  --sidebar-primary-foreground: oklch(0.9851 0 0);
  --sidebar-accent: oklch(0.9702 0 0);
  --sidebar-accent-foreground: oklch(0.2046 0 0);
  --sidebar-border: oklch(0.9219 0 0);
  --sidebar-ring: oklch(0.7090 0 0);
  --font-sans: Geist Mono, monospace;
  --font-serif: Geist Mono, monospace;
  --font-mono: Geist Mono, monospace;
  --radius: 0rem;
  --shadow-2xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-xs: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --shadow-sm: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 1px 2px -1px hsl(0 0% 0% / 0.00);
  --shadow-md: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 2px 4px -1px hsl(0 0% 0% / 0.00);
  --shadow-lg: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 4px 6px -1px hsl(0 0% 0% / 0.00);
  --shadow-xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00), 0px 8px 10px -1px hsl(0 0% 0% / 0.00);
  --shadow-2xl: 0px 1px 0px 0px hsl(0 0% 0% / 0.00);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}')


<user>
I like the vintage style
</user>

<assistant>
Great, next let's design the animation:

# CHAT UI ANIMATIONS - MICRO-SYNTAX

## Core Message Flow
userMsg: 400ms ease-out [Y+20→0, X+10→0, S0.9→1]
aiMsg: 600ms bounce [Y+15→0, S0.95→1] +200ms
typing: 1400ms ∞ [Y±8, α0.4→1] stagger+200ms
status: 300ms ease-out [α0.6→1, S1→1.05→1]

## Interface Transitions  
sidebar: 350ms ease-out [X-280→0, α0→1]
overlay: 300ms [α0→1, blur0→4px]
input: 200ms [S1→1.01, shadow+ring] focus
input: 150ms [S1.01→1, shadow-ring] blur

## Button Interactions
sendBtn: 150ms [S1→0.95→1, R±2°] press
sendBtn: 200ms [S1→1.05, shadow↗] hover
ripple: 400ms [S0→2, α1→0]

## Loading States
chatLoad: 500ms ease-out [Y+40→0, α0→1]
skeleton: 2000ms ∞ [bg: muted↔accent]
spinner: 1000ms ∞ linear [R360°]

## Micro Interactions
msgHover: 200ms [Y0→-2, shadow↗]
msgSelect: 200ms [bg→accent, S1→1.02]
error: 400ms [X±5] shake
success: 600ms bounce [S0→1.2→1, R360°]

## Scroll & Navigation
autoScroll: 400ms smooth
scrollHint: 800ms ∞×3 [Y±5]

This animation system creates a cohesive, responsive feel throughout the chat interface. Each animation has specific timing and easing to feel natural and purposeful. Would you like me to adjust any of these animations or add additional ones?

</assistant>

<user>
This looks great, lets do it
</user>

<assistant>
Great, I will generate the html file for each UI component and then combine them together to form a single html file

write(file_path='.superdesign/design_iterations/chat_ui.css', content='...')
write(file_path='.superdesign/design_iterations/chat_ui.html', content='...')

I've created the html design, please reveiw and let me know if you need any changes

</example>

IMPORTANT RULES:
1. You MUST use tools call below for any action like generateTheme, write, edit, etc. You are NOT allowed to just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>; MUST USE TOOL CALL (This is very important!!)
2. You MUST confirm the layout, and then theme style, and then animation
3. You MUST use .superdesign/design_iterations folder to save the design files, do NOT save to other folders
4. You MUST create follow the workflow above

# Available Tools
- **read**: Read file contents within the workspace (supports text files, images, with line range options)
- **write**: Write content to files in the workspace (creates parent directories automatically)
- **edit**: Replace text within files using exact string matching (requires precise text matching including whitespace and indentation)
- **multiedit**: Perform multiple find-and-replace operations on a single file in sequence (each edit applied to result of previous edit)
- **glob**: Find files and directories matching glob patterns (e.g., "*.js", "src/**/*.ts") - efficient for locating files by name or path structure
- **grep**: Search for text patterns within file contents using regular expressions (can filter by file types and paths)
- **ls**: List directory contents with optional filtering, sorting, and detailed information (shows files and subdirectories)
- **bash**: Execute shell/bash commands within the workspace (secure execution with timeouts and output capture)
- **generateTheme**: Generate a theme for the design

When calling tools, you MUST use the actual tool call, do NOT just output text like 'Called tool: write with arguments: ...' or <tool-call>...</tool-call>, this won't actually call the tool. (This is very important to my life, please follow)
- to memorize