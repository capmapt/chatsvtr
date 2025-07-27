# 🚀 SVTR.AI - 硅谷科技评论官网

🤖 **AI-Powered Agent Testing** - Claude Code 代理工作流测试中...

![SVTR.AI](assets/images/banner.webp)

专注AI创投领域的社区门户网站，集成智能聊天机器人和RAG知识库检索。

## 🎯 项目概述

**SVTR.AI** 是硅谷科技评论的官方平台，致力于构建全球AI创投行业生态系统的统一入口。

### 核心功能
- 🤖 **智能Chatbot** - 基于RAG的AI创投分析助手
- 📊 **AI创投库** - 10,761+全球AI公司数据库
- 🌐 **多语言支持** - 中英文双语界面
- 📱 **响应式设计** - 完美适配移动端

### 技术栈
- **前端**: 原生 HTML/CSS/JavaScript
- **后端**: Cloudflare Workers + Functions
- **AI**: Cloudflare AI (Llama 3.1) + 多重后备
- **数据**: 飞书知识库 + Vectorize向量检索
- **部署**: Cloudflare Pages

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 一键启动
```bash
# 克隆项目
git clone https://github.com/capmapt/chatsvtr.git
cd chatsvtr

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://127.0.0.1:3000 查看网站

### Chatbot体验
- **完整演示**: http://127.0.0.1:3000/demo/chatbot-live-demo.html
- **集成版本**: http://127.0.0.1:3000/index.html

## 📁 项目结构

```
chatsvtr/
├── 📄 index.html              # 主页
├── 🖥️ dev-server.js           # 开发服务器
├── 📦 package.json            # 项目配置
├── ⚙️ wrangler.toml           # Cloudflare配置
├── 📁 assets/                 # 静态资源
│   ├── css/                   # 样式文件
│   ├── js/                    # JavaScript文件
│   ├── images/                # 图片资源 (WebP优化)
│   └── data/                  # 数据文件
├── 📁 functions/              # Cloudflare Functions
│   ├── api/                   # API端点
│   └── lib/                   # 工具库
├── 📁 pages/                  # 页面文件
├── 📁 scripts/                # 构建脚本
├── 📁 demo/                   # 演示文件
└── 📁 docs/                   # 文档
```

## 🛠️ 开发指南

### 可用命令

```bash
# 开发相关
npm run dev              # 启动简化开发服务器
npm run dev:cloudflare   # 启动完整Cloudflare环境
npm run dev:static       # 静态文件服务器

# 构建优化
npm run build            # TypeScript编译
npm run optimize:all     # 资源优化 (图片+JS+CSS)

# 部署相关
npm run deploy:simple    # 一键部署助手
npm run deploy:cloudflare # Cloudflare Pages部署

# 数据同步
npm run sync:daily       # 同步飞书数据
npm run rag:setup        # RAG系统设置
```

## 🤖 Chatbot功能特性

### 🛡️ 多重AI后备策略
- **主要**: Cloudflare AI (Llama 3.1 70B/8B)
- **备用1**: OpenAI GPT-3.5/4
- **备用2**: Anthropic Claude
- **保底**: 智能演示模式 (基于真实数据)

### 🔧 智能错误恢复
- **熔断器保护**: 3次失败自动切换
- **自动恢复**: 60秒后重试
- **无缝体验**: 用户无感知切换

### 📚 RAG增强检索
- **飞书集成**: 实时同步SVTR知识库
- **向量检索**: Cloudflare Vectorize
- **混合策略**: 关键词+语义匹配
- **可视化引用**: 知识源标注

### ⚡ 性能优化
- **流式响应**: 实时打字效果
- **中文优化**: 字符断裂修复
- **资源压缩**: 32.8% JS体积减少
- **图片优化**: WebP格式转换

## 📊 项目数据

### 真实数据规模
- **AI公司**: 10,761+ 家全球追踪
- **投资人网络**: 121,884+ 专业人士
- **知识库**: 13个文档节点 (实时同步)
- **更新频率**: 每日自动同步

### 技术指标
- **响应时间**: < 3秒 (优化后)
- **可用性**: 99%+ (多重后备)
- **压缩比**: 32.8% JS体积减少
- **兼容性**: 支持所有现代浏览器

## 🚀 部署指南

### 本地部署 (推荐)
```bash
./scripts/simple-deploy.sh
# 选择 "1. 本地开发"
```

### Cloudflare Pages部署
```bash
# 自动部署
npm run deploy:cloudflare

# 或手动
wrangler pages deploy .
```

## 🔗 相关链接

- **官网**: https://svtr.ai
- **GitHub**: https://github.com/capmapt/chatsvtr
- **Cloudflare Pages**: https://chatsvtr.pages.dev
- **飞书知识库**: https://svtrglobal.feishu.cn/wiki/TB4nwFKSjiZybRkoZx7c7mBXnxd

---

## 📈 更新日志

### v1.1.0 (2025-07-25) - Chatbot优化版
- ✅ 新增多重AI后备策略
- ✅ 优化流式响应处理
- ✅ 改进错误恢复机制
- ✅ 增强RAG检索显示
- ✅ 添加性能监控
- ✅ 简化开发环境配置

### v1.0.0 (2025-01-07)
- 🎉 初始发布
- ✅ 基础聊天机器人功能
- ✅ 飞书知识库集成
- ✅ Cloudflare部署支持

---

**🎉 感谢使用 SVTR.AI！让我们一起推动AI创投行业的发展！**