# SVTR.AI - 硅谷科技评论

![SVTR.AI](assets/images/banner.webp)

**洞察全球资本，成就AI创业者** - SVTR.AI全球AI创投平台

> 🚀 已完成域名统一重构，项目结构全面优化 (2025-08-22)

## 🌟 平台介绍

SVTR.AI是专注AI创投领域的专业分析平台，追踪**10,761+**家全球AI公司和**121,884+**投资人，提供AI创投榜、AI创投库、AI创投会等核心服务。

### 🎯 核心服务
- **AI创投榜**: AI融资排行、投资机构排名、热门AI赛道分析
- **AI创投库**: 全球AI公司数据库、投资机构库、关键人物库  
- **AI创投会**: 专业AI创投社区、定期meetup活动
- **AI周报**: 每周精选AI行业投融资动态和深度分析

## 🚀 技术特色

- **🤖 AI聊天系统**: RAG增强的智能问答，支持流式响应
- **📱 响应式设计**: 完美适配PC、平板、手机全平台
- **⚡ 极致性能**: WebP图片、资源压缩、CDN加速
- **🌐 多语言支持**: 中英文无缝切换
- **🔐 多重认证**: OAuth + 自建邮箱认证系统
- **📊 实时数据**: 飞书MCP自动同步，数据实时更新
- **🎨 现代UI**: 折叠侧边栏、动效交互、暗色模式支持

## 🏗️ 技术架构

### 前端技术栈
- **原生技术**: HTML5 + CSS3 + ES2022
- **构建优化**: TypeScript + Terser + CleanCSS
- **图片优化**: WebP/AVIF格式 + 懒加载
- **PWA支持**: Service Worker + 离线缓存

### 后端架构  
- **无服务器**: Cloudflare Workers + Functions
- **数据存储**: Cloudflare KV + Vectorize
- **AI服务**: OpenAI + Cloudflare Workers AI
- **邮件服务**: AWS SES + 自动化工作流

### 域名架构
- **主域名**: https://svtr.ai
- **认证服务**: auth.svtr.ai  
- **重定向**: svtrglobal.com, svtrai.com → svtr.ai

## 📁 项目结构

详细结构请查看 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

```
chatsvtr/
├── 🏠 核心文件 (index.html, package.json, wrangler.toml)
├── 📄 pages/ - 功能页面
├── 🎨 assets/ - 静态资源 (optimized版本)
├── ⚙️ functions/ - Cloudflare Workers API
├── 📜 scripts/ - 开发/部署/测试脚本  
├── 🔧 config/ - 配置文件
├── 📚 docs/ - 项目文档
├── 🧪 tests/ - 测试用例
├── 🔐 svtr-auth/ - 认证服务
└── 🎨 superdesign-mcp-claude-code/ - 设计系统
```

## 🔧 开发指南

### 环境要求
- Node.js 18+
- npm 9+ 
- Cloudflare账户 (部署用)

### 快速开始
```bash
# 1. 克隆项目
git clone https://github.com/capmapt/chatsvtr.git
cd chatsvtr

# 2. 安装依赖
npm install

# 3. 开发环境 (推荐)
npm run dev              # Wrangler开发服务器 (端口3000)
npm run preview          # 预览服务器 (端口8080)

# 4. 构建优化
npm run build            # TypeScript编译
npm run optimize:all     # 全量优化 (图片+资源+Gzip)

# 5. 测试
npm run test             # Jest单元测试
npm run test:e2e         # Playwright E2E测试
npm run lint             # ESLint检查
```

### 数据同步
```bash
npm run sync             # 智能飞书数据同步
npm run rag:test         # 测试RAG功能
```

### 部署
```bash
npm run deploy:cloudflare # Cloudflare部署
```

## 📊 功能模块

### 核心页面
- **🏠 首页**: 统计数据展示、AI聊天、导航菜单
- **📈 AI创投榜**: 实时排行数据、图表分析
- **📚 AI创投库**: 公司库、机构库、人物库
- **📰 AI周报**: 每周精选内容、订阅功能
- **🎯 项目对接**: 交易精选、投融资匹配

### AI增强功能  
- **🤖 智能聊天**: RAG增强问答系统
- **📊 数据分析**: 自动生成市场洞察
- **🔔 智能推荐**: 个性化内容推送

## 🎯 业务模块

- **AI创投榜**：融资概览、赛道概览、公司概览、机构概览、人员概览
- **AI创投库**：创业公司、投资机构、创投人物
- **AI创投群**：社区交流
- **AI创投会**：线下活动
- **AI创投营**：培训服务

## 📈 统计数据

- **121,884+** 社区成员
- **10,761+** 创业公司与投资机构
- **1,102+** 权益会员

## 🛠️ 技术栈

- **前端**：HTML5、CSS3、Vanilla JavaScript
- **样式**：响应式设计、CSS Grid、Flexbox
- **性能**：懒加载、预加载、异步脚本
- **部署**：Netlify、GitHub Pages

## 📱 移动端优化

- 精细响应式断点（768px、480px）
- 触摸区域优化
- 移动端导航适配
- 性能优化（40%+提升）

## 🚀 部署

项目支持多种部署方式：

### Netlify
```bash
npm run deploy
```

### GitHub Pages
直接在GitHub仓库设置中启用Pages功能

### 手动部署
上传所有文件到任意静态服务器即可

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交Issue和Pull Request来帮助改进项目。

## 📞 联系我们

- 官网：https://svtr.ai
- 邮箱：kerry@svtrai.com
- 微信：扫描二维码添加好友

---

© 2025 SVTR.AI. All rights reserved.
