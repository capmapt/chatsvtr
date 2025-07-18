#!/bin/bash

# SVTR.AI 快速部署脚本
# 整合 GitHub 推送和 Cloudflare 部署

echo "🚀 SVTR.AI 快速部署流程..."

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 检测到未提交的更改，开始提交..."
    
    # 显示更改内容
    echo "🔍 更改内容："
    git status --short
    echo ""
    
    # 添加所有更改
    git add .
    
    # 生成提交消息
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MSG="Update: $TIMESTAMP - Auto deploy"
    
    # 允许用户自定义提交消息
    read -p "📝 提交消息 (回车使用默认): " USER_MSG
    if [ -n "$USER_MSG" ]; then
        COMMIT_MSG="$USER_MSG"
    fi
    
    # 提交更改
    git commit -m "$COMMIT_MSG"
    
    if [ $? -eq 0 ]; then
        echo "✅ 代码已提交到本地仓库"
    else
        echo "❌ 提交失败，请检查错误"
        exit 1
    fi
fi

# 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ 代码已推送到 GitHub"
else
    echo "❌ GitHub 推送失败，请检查网络连接和权限"
    exit 1
fi

# 等待一下让 GitHub 处理
sleep 2

# 部署到 Cloudflare
echo "🌐 部署到 Cloudflare Pages..."
./deploy-cloudflare.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 部署完成！"
    echo ""
    echo "🔗 访问链接："
    echo "  - GitHub: https://github.com/capmapt/chatsvtr"
    echo "  - Cloudflare: https://chatsvtr.pages.dev"
    echo "  - 自定义域名: https://svtrglobal.com"
    echo ""
    echo "⏱️  通常需要 1-2 分钟才能看到更新生效"
else
    echo "❌ Cloudflare 部署失败"
    exit 1
fi