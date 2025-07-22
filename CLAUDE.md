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

### 技术栈
- 前端：原生 HTML/CSS/JavaScript
- 部署：Cloudflare Pages/Workers
- 构建：自定义脚本

## Build
静态站点；构建后部署 Cloudflare Pages / Workers。主入口 index.html；优化脚本 deploy-optimized.sh。

## Style
中文+英文；压缩 HTML/CSS/JS；图片延迟加载。

## 开发规范 (Development Standards)
- 保持代码简洁，优先使用原生 JavaScript
- 支持中英文双语（面向全球AI创投市场）
- 确保移动端兼容性
- 优化性能，减小资源体积
- 专业科技风格设计，体现AI创投行业特色
- 用户体验优先，促进内容分享和社区互动

## 产品策略 (Product Strategy)
1. **内容聚合**：从分散平台向官网集中
2. **用户粘性**：通过Chatbot提升用户参与度
3. **社区建设**：UGC内容生成，促进用户自发分享
4. **商业闭环**：官网作为流量和商业转化中心

## 当前架构
- Sidebar：项目导航栏
- Chatbot：核心交互组件
- 预留三大板块入口：AI创投库、AI创投会、AI创投营

## TODO backlog (填写自 Gemini 扫描)
<!-- Claude: 请读取 "Tasks from Gemini" 段落并生成执行计划。 -->

## Tasks from Gemini 2025-07-16T17:34:44-07:00

# Gemini Scan Tasks (placeholder)
# 运行 gscan 后会自动追加真正的扫描结果。

## Gemini scan $(date -Iseconds)

<好的，我将扫描仓库并根据您的要求提供一份改进建议。

- [ ] **构建/压缩 (Build/Minify):** 目前项目缺少自动化的前端资源（JS, CSS, HTML）构建和压缩流程。虽然存在 `-optimized`  后缀的文件，但这似乎是手动过程，容易出错且效率低下。引入如 `Vite` 或 `Webpack` 等构建工具可以自动化此过程，减小文件体积 ，提升加载速度。
    - 影响面: 🌕🌕🌕🌕🌑 (4)
    - 复杂度: 🌕🌕🌕🌑🌑 (3)
- [ ] **依赖管理 (Dependencies):** `package.json` 文件为空或不存在，表明项目没有使用 `npm` 或 `yarn` 来管理前端依赖。这 使得版本控制、依赖更新和团队协作变得困难。应初始化 `package.json` 并通过包管理器引入所有第三方库（例如，如果将来使用 `jQuery` 或 `lodash`）。
    - 影响面: 🌕🌕🌕🌕🌑 (4)
    - 复杂度: 🌕🌕🌑🌑🌑 (2)
- [ ] **测试 (Testing):** 项目完全没有自动化测试框架（如 `Jest`, `Cypress`）。这意味着所有功能验证都依赖手动测试，耗时且不可靠。添加单元测试和端到端测试可以确保代码质量，防止在迭代中引入新的 Bug。
    - 影响面: 🌕🌕🌕🌑🌑 (3)
    - 复杂度: 🌕🌕🌕🌕🌑 (4)
- [ ] **图片优化 (Image Optimization):** `assets/images` 目录中的图片（如 `banner.png`）未经过现代格式（如 `WebP`, `AVIF`）压缩或优化。优化图片可以显著减小文件大小，加快页面加载速度，尤其是对于移动端用户。
    - 影响面: 🌕🌕🌕🌑🌑 (3)
    - 复杂度: 🌕🌕🌑🌑🌑 (2)
- [ ] **部署 (Cloudflare Deploy):** 当前的部署似乎依赖于 `Netlify` (`netlify.toml`) 和自定义脚本 (`deploy-workflow.sh`) 。迁移到 Cloudflare Pages/Workers 可以利用其全球 CDN 网络、边缘计算能力，并可能提供更优的性能和安全性。这需要编写新的部 署配置（如 `wrangler.toml`）和迁移脚本。
    - 影响面: 🌕🌕🌑🌑🌑 (2)
    - 复杂度: 🌕🌕🌕🌑🌑 (3)>

## Memory Log
- `to memorize`: Added as a reminder to track and document project-specific notes and insights.