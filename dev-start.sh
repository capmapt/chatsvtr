#!/bin/bash

# SVTR.AI 开发环境自动启动脚本
# 使用方法：./dev-start.sh 或 source dev-start.sh

echo "🚀 启动 SVTR.AI 开发环境..."

# 进入项目目录
cd /home/lium/chatsvtr

# 检查是否在正确目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：未找到 index.html，请检查项目路径"
    exit 1
fi

# 显示项目信息
echo "📁 项目目录: $(pwd)"
echo "📂 项目文件: $(ls -la | grep -E '\.(html|js|css)$' | wc -l) 个前端文件"

# 检查 Git 状态
if [ -d ".git" ]; then
    echo "🔄 Git 状态:"
    git status --short
    echo ""
fi

# 显示可用命令
echo "🛠️  可用命令："
echo "  npm run dev        - 启动开发服务器 (端口 3000)"
echo "  npm run preview    - 启动预览服务器 (端口 8080)"
echo "  ./quick-deploy.sh  - 快速部署到 Cloudflare"
echo "  ./dev-commit.sh    - 快速提交更改"
echo ""

# 可选：自动启动开发服务器
read -p "🔧 是否启动开发服务器? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 启动开发服务器在 http://localhost:3000"
    npm run dev
fi