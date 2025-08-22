#!/bin/bash

# SVTR.AI 智能推送 - 自动快照+推送
# 如果没有快照自动创建，然后推送

set -e

SNAPSHOT_FILE=".dev-snapshot"

echo "🚀 启动智能推送..."

# 检查是否已有快照
if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "📸 未找到快照，自动创建..."
    ./scripts/dev-snapshot.sh
    echo ""
fi

# 执行推送
echo "📤 开始推送流程..."
./scripts/dev-push.sh