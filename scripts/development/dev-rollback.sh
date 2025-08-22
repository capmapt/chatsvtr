#!/bin/bash

# SVTR.AI 开发回滚脚本  
# 回滚到开发快照点

set -e

SNAPSHOT_FILE=".dev-snapshot"

echo "🔄 开发回滚工具..."

# 检查快照文件是否存在
if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "❌ 未找到开发快照"
    echo "💡 使用 'npm run dev:snapshot' 创建快照"
    exit 1
fi

# 读取快照信息
source $SNAPSHOT_FILE

echo "📋 找到快照:"
echo "  提交: $SNAPSHOT_COMMIT"
echo "  分支: $SNAPSHOT_BRANCH" 
echo "  时间: $SNAPSHOT_TIME"

# 显示当前状态
echo ""
echo "📊 当前状态:"
git status --short

echo ""
read -p "⚠️  确定要回滚到快照状态吗？当前未保存的更改将丢失 (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 回滚已取消"
    exit 0
fi

# 丢弃所有更改
echo "🗑️  清理工作区..."
git reset --hard HEAD
git clean -fd

# 回滚到快照提交
echo "⏪ 回滚到快照提交..."
git reset --hard $SNAPSHOT_COMMIT

# 如果有暂存的更改，恢复它们
if [ "$STASH_CREATED" = "true" ]; then
    echo "📥 恢复快照前的暂存更改..."
    if git stash list | grep -q "snapshot-stash-$SNAPSHOT_TIME"; then
        git stash pop stash@{$(git stash list | grep "snapshot-stash-$SNAPSHOT_TIME" | cut -d: -f1 | cut -d@ -f2 | tr -d '{}')}
        echo "✅ 暂存更改已恢复"
    fi
fi

# 清理快照文件
rm -f $SNAPSHOT_FILE

echo ""
echo "✅ 回滚完成！"
echo "📊 当前状态:"
git log -1 --oneline
git status --short