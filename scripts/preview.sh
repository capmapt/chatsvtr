#!/bin/bash

# SVTR.AI 预览脚本
# 用于在推送到GitHub之前预览修改效果

echo "🔍 SVTR.AI 预览服务器启动中..."
echo "================================="

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
    echo "⚠️  检测到未提交的更改:"
    git status -s
    echo ""
    echo "💡 提示: 这些更改将在预览中显示"
    echo ""
fi

# 显示当前分支和最后提交
echo "📊 当前状态:"
echo "分支: $(git branch --show-current)"
echo "最后提交: $(git log -1 --oneline)"
echo ""

# 启动预览服务器
echo "🚀 启动预览服务器..."
echo "📱 本地访问: http://localhost:8080"
echo "🌐 网络访问: http://$(hostname -I | awk '{print $1}'):8080"
echo ""
echo "💡 预览完成后按 Ctrl+C 停止服务器"
echo "✅ 满意后运行 'npm run deploy:staging' 部署到staging环境"
echo ""

# 启动服务器
python3 -m http.server 8080