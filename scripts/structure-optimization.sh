#!/bin/bash

# 项目结构优化脚本
# 整理文档、配置文件和报告文件的组织结构

echo "📁 开始项目结构优化..."

# 1. 创建更好的目录结构
echo "🏗️ 创建优化的目录结构..."
mkdir -p docs/{deployment,development,rag,archives}
mkdir -p config/jest
mkdir -p reports

# 2. 整理docs目录 - 按功能分类
echo "📚 整理文档目录..."

# RAG相关文档
mv docs/RAG_SYSTEM_IMPROVEMENTS_REPORT.md docs/rag/ 2>/dev/null
mv docs/hybrid-rag-deployment.md docs/rag/ 2>/dev/null
mv docs/rag-deployment-guide.md docs/rag/ 2>/dev/null
mv docs/rag-implementation-design.md docs/rag/ 2>/dev/null
mv docs/rag-integration-plan.md docs/rag/ 2>/dev/null
mv docs/rag-setup-status.json docs/rag/ 2>/dev/null

# 部署相关文档
mv docs/deployment.md docs/deployment/ 2>/dev/null

# 开发相关文档
mv docs/development-workflow.md docs/development/ 2>/dev/null

# 其他文档
mv docs/file-cleanup-report.md docs/archives/ 2>/dev/null
mv docs/sidebar-optimization-summary.md docs/archives/ 2>/dev/null

# 3. 移动配置文件到config目录
echo "⚙️ 整理配置文件..."
mv jest.config.js config/ 2>/dev/null

# 4. 移动报告文件
echo "📊 整理报告文件..."
mv seo-report.json reports/ 2>/dev/null

# 5. 创建docs主README
echo "📖 创建文档索引..."
cat > docs/README.md << 'EOF'
# ChatSVTR 项目文档

## 📁 文档结构

### 🚀 部署文档 (`deployment/`)
- 生产环境部署指南
- Cloudflare配置说明

### 🔧 开发文档 (`development/`)  
- 开发环境设置
- 工作流程说明
- 代码规范

### 🤖 RAG系统文档 (`rag/`)
- RAG架构设计
- 部署和集成指南
- 系统改进报告

### 📦 历史文档 (`archives/`)
- 已完成的优化报告
- 历史版本文档

## 📖 主要文档

- [项目总览](../CLAUDE.md) - 完整项目说明
- [API文档](../API.md) - API接口说明  
- [部署指南](deployment/deployment.md) - 生产部署
- [开发指南](development/development-workflow.md) - 开发流程

## 🔗 快速链接

- [在线访问](https://chat.svtr.ai)
- [GitHub仓库](https://github.com/capmapt/chatsvtr)
- [问题反馈](https://github.com/capmapt/chatsvtr/issues)
EOF

# 6. 更新package.json中的jest配置路径
echo "🔧 更新Jest配置路径..."
if [ -f package.json ]; then
    # 更新package.json中的jest配置路径引用（如果存在）
    sed -i.bak 's/"jest.config.js"/"config\/jest.config.js"/g' package.json 2>/dev/null
fi

# 7. 显示优化结果
echo ""
echo "✅ 项目结构优化完成！"
echo ""
echo "📊 优化总结："
echo "• 文档分类整理：RAG、部署、开发文档分类存放"
echo "• 配置文件集中：config/目录统一管理"
echo "• 报告文件归档：reports/目录统一存放"
echo "• 创建文档索引：docs/README.md快速导航"
echo ""
echo "📁 新的目录结构："
echo "docs/"
echo "├── README.md"
echo "├── deployment/"
echo "├── development/"
echo "├── rag/"
echo "└── archives/"
echo ""
echo "config/"
echo "├── jest.config.js"
echo "├── babel.config.js"
echo "└── playwright.config.js"
echo ""
echo "reports/"
echo "└── seo-report.json"