#!/bin/bash

# SVTR.AI 快速提交脚本
# 用于频繁的开发提交，不触发部署

echo "📝 SVTR.AI 快速提交..."

# 检查是否有更改
if [ -z "$(git status --porcelain)" ]; then
    echo "💡 没有检测到更改，无需提交"
    exit 0
fi

# 显示更改内容
echo "🔍 更改内容："
git status --short
echo ""

# 显示具体更改
echo "📋 详细更改："
git diff --stat
echo ""

# 添加所有更改
git add .

# 提交消息选项
echo "📝 选择提交类型："
echo "  1) 功能更新 (feat)"
echo "  2) 样式修改 (style)"
echo "  3) 错误修复 (fix)"
echo "  4) 文档更新 (docs)"
echo "  5) 性能优化 (perf)"
echo "  6) 自定义消息"
echo ""

read -p "选择 (1-6): " CHOICE

case $CHOICE in
    1)
        COMMIT_TYPE="feat"
        read -p "功能描述: " DESCRIPTION
        COMMIT_MSG="feat: $DESCRIPTION"
        ;;
    2)
        COMMIT_TYPE="style"
        read -p "样式描述: " DESCRIPTION
        COMMIT_MSG="style: $DESCRIPTION"
        ;;
    3)
        COMMIT_TYPE="fix"
        read -p "修复描述: " DESCRIPTION
        COMMIT_MSG="fix: $DESCRIPTION"
        ;;
    4)
        COMMIT_TYPE="docs"
        read -p "文档描述: " DESCRIPTION
        COMMIT_MSG="docs: $DESCRIPTION"
        ;;
    5)
        COMMIT_TYPE="perf"
        read -p "优化描述: " DESCRIPTION
        COMMIT_MSG="perf: $DESCRIPTION"
        ;;
    6)
        read -p "自定义提交消息: " COMMIT_MSG
        ;;
    *)
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        COMMIT_MSG="update: $TIMESTAMP"
        ;;
esac

# 提交更改
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo "✅ 代码已提交到本地仓库"
    echo "💡 使用 'git push' 推送到远程仓库"
    echo "💡 使用 './quick-deploy.sh' 进行完整部署"
else
    echo "❌ 提交失败，请检查错误"
    exit 1
fi