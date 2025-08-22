#!/bin/bash

# SVTR.AI 开发快照脚本
# 创建工作前快照，支持安全回滚

set -e

SNAPSHOT_FILE=".dev-snapshot"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')

echo "📸 创建开发快照..."

# 检查是否在git仓库中
if [ ! -d ".git" ]; then
    echo "❌ 错误：不在git仓库中"
    exit 1
fi

# 检查工作区状态
if [ ! -z "$(git status --porcelain)" ]; then
    echo "⚠️  工作区有未提交的更改："
    git status --short
    echo ""
    
    read -p "🔧 是否提交当前更改后创建快照? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "💾 自动提交当前更改..."
        git add .
        git commit -m "auto-save: before snapshot $TIMESTAMP"
    else
        echo "📋 暂存当前更改..."
        git stash push -m "snapshot-stash-$TIMESTAMP"
        echo "STASH_CREATED=true" > $SNAPSHOT_FILE
    fi
fi

# 记录当前状态
CURRENT_COMMIT=$(git rev-parse HEAD)
CURRENT_BRANCH=$(git branch --show-current)

# 保存快照信息
cat > $SNAPSHOT_FILE << EOF
# SVTR.AI 开发快照 - $TIMESTAMP
SNAPSHOT_COMMIT=$CURRENT_COMMIT
SNAPSHOT_BRANCH=$CURRENT_BRANCH
SNAPSHOT_TIME=$TIMESTAMP
STASH_CREATED=${STASH_CREATED:-false}
EOF

echo "✅ 快照已创建"
echo "📋 快照信息:"
echo "  提交: $CURRENT_COMMIT"
echo "  分支: $CURRENT_BRANCH"
echo "  时间: $TIMESTAMP"
echo ""
echo "💡 现在可以安全地进行修改"
echo "💡 使用 'npm run dev:rollback' 回滚到此快照"