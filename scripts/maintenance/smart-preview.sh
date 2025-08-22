#!/bin/bash

# SVTR.AI 智能预览 - 自动快照+预览
# 如果没有快照自动创建，然后启动预览服务器

set -e

SNAPSHOT_FILE=".dev-snapshot"

echo "🔍 启动智能预览..."

# 检查是否已有快照
if [ ! -f "$SNAPSHOT_FILE" ]; then
    echo "📸 未找到快照，自动创建..."
    ./scripts/dev-snapshot.sh
    echo ""
fi

# 检查8080端口是否被占用
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口8080已被占用，停止现有服务..."
    pkill -f "python3 -m http.server 8080" 2>/dev/null || true
    sleep 1
fi

# 启动预览服务器
echo "🌐 启动预览服务器: http://localhost:8080"
echo "💡 按 Ctrl+C 停止服务器"
echo ""

python3 -m http.server 8080