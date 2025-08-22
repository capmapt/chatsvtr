#!/bin/bash

# SVTR.AI 开发推送脚本
# 提交、推送到GitHub并触发Cloudflare部署

set -e

SNAPSHOT_FILE=".dev-snapshot"

echo "🚀 开发推送工具..."

# 检查是否有更改需要提交
if [ -z "$(git status --porcelain)" ]; then
    echo "💡 没有更改需要提交"
    
    # 检查是否有本地提交未推送
    LOCAL_COMMITS=$(git rev-list --count HEAD ^origin/$(git branch --show-current) 2>/dev/null || echo "0")
    
    if [ "$LOCAL_COMMITS" -gt 0 ]; then
        echo "📤 发现 $LOCAL_COMMITS 个本地提交未推送"
        read -p "🔧 是否推送本地提交? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push
            echo "✅ 已推送到GitHub"
        fi
    else
        echo "💚 所有更改已同步"
    fi
    
    # 清理快照文件
    [ -f "$SNAPSHOT_FILE" ] && rm -f "$SNAPSHOT_FILE" && echo "🗑️  已清理快照文件"
    exit 0
fi

# 显示更改内容
echo "🔍 准备提交的更改："
git status --short
echo ""
git diff --stat

echo ""
echo "📝 选择提交类型："
echo "  1) 功能更新 (feat)"
echo "  2) 样式修改 (style)" 
echo "  3) 错误修复 (fix)"
echo "  4) 内容更新 (content)"
echo "  5) 性能优化 (perf)"
echo "  6) 自定义消息"

read -p "选择 (1-6): " CHOICE

case $CHOICE in
    1)
        read -p "功能描述: " DESCRIPTION
        COMMIT_MSG="feat: $DESCRIPTION"
        ;;
    2)
        read -p "样式描述: " DESCRIPTION
        COMMIT_MSG="style: $DESCRIPTION"
        ;;
    3)
        read -p "修复描述: " DESCRIPTION
        COMMIT_MSG="fix: $DESCRIPTION"
        ;;
    4)
        read -p "内容描述: " DESCRIPTION
        COMMIT_MSG="content: $DESCRIPTION"
        ;;
    5)
        read -p "优化描述: " DESCRIPTION
        COMMIT_MSG="perf: $DESCRIPTION"
        ;;
    6)
        read -p "自定义提交消息: " COMMIT_MSG
        ;;
    *)
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
        COMMIT_MSG="update: $TIMESTAMP"
        ;;
esac

# 运行代码检查
echo ""
echo "🔍 运行代码检查..."
if npm run lint > /dev/null 2>&1; then
    echo "✅ 代码风格检查通过"
else
    echo "⚠️  代码风格检查有警告，但继续提交"
fi

if npm run validate:html > /dev/null 2>&1; then
    echo "✅ HTML验证通过"
else
    echo "⚠️  HTML验证有警告，但继续提交"
fi

# 提交更改
echo ""
echo "💾 提交更改..."
git add .
git commit -m "$COMMIT_MSG"

# 推送到GitHub
echo "📤 推送到GitHub..."
git push

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 推送成功！"
    echo "✅ 代码已推送到GitHub"
    echo "🌐 Cloudflare将自动部署更新"
    
    # 清理快照文件
    [ -f "$SNAPSHOT_FILE" ] && rm -f "$SNAPSHOT_FILE" && echo "🗑️  已清理快照文件"
    
    echo ""
    echo "🔗 相关链接:"
    echo "  GitHub: https://github.com/capmapt/chatsvtr"
    echo "  网站: https://svtr.ai"
else
    echo "❌ 推送失败"
    exit 1
fi