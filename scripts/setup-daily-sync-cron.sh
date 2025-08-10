#!/bin/bash

# 设置SVTR每日自动同步Cron任务
# 执行方式: ./scripts/setup-daily-sync-cron.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🤖 设置SVTR每日自动同步Cron任务"
echo "📁 项目目录: $PROJECT_DIR"

# 确保日志目录存在
mkdir -p "$PROJECT_DIR/logs"

# 创建cron任务脚本
cat > "$PROJECT_DIR/scripts/daily-sync-cron.sh" << 'EOF'
#!/bin/bash

# SVTR每日自动同步脚本
# 由cron任务调用

# 设置环境变量
export PATH=/usr/local/bin:/usr/bin:/bin:$PATH
export NODE_ENV=production

# 项目目录
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# 日志文件
LOG_FILE="$PROJECT_DIR/logs/daily-sync-$(date +'%Y-%m-%d').log"

echo "🚀 开始每日自动同步 - $(date)" >> "$LOG_FILE"

# 执行智能同步
if timeout 600 npm run sync >> "$LOG_FILE" 2>&1; then
    echo "✅ 智能同步成功 - $(date)" >> "$LOG_FILE"
    
    # 检查是否有数据更新
    if git status --porcelain | grep -q "assets/data/rag/"; then
        echo "📊 检测到数据更新，准备提交..." >> "$LOG_FILE"
        
        # 提交数据更新
        git add assets/data/rag/
        git commit -m "🔄 每日自动同步RAG数据 - $(date +'%Y-%m-%d %H:%M')" >> "$LOG_FILE" 2>&1
        
        # 推送到远程仓库
        if git push >> "$LOG_FILE" 2>&1; then
            echo "✅ 数据已推送到远程仓库" >> "$LOG_FILE"
            
            # 自动部署到Cloudflare (可选)
            if command -v wrangler &> /dev/null; then
                echo "🚀 开始自动部署..." >> "$LOG_FILE"
                if timeout 300 npx wrangler pages deploy --commit-dirty=true >> "$LOG_FILE" 2>&1; then
                    echo "✅ 自动部署成功" >> "$LOG_FILE"
                else
                    echo "⚠️ 自动部署失败，需要手动检查" >> "$LOG_FILE"
                fi
            else
                echo "ℹ️ Wrangler未安装，跳过自动部署" >> "$LOG_FILE"
            fi
        else
            echo "❌ 推送失败，需要手动检查" >> "$LOG_FILE"
        fi
    else
        echo "ℹ️ 无数据变更，跳过提交" >> "$LOG_FILE"
    fi
else
    echo "❌ 智能同步失败 - $(date)" >> "$LOG_FILE"
    
    # 尝试fallback到完整同步
    echo "🔄 尝试完整同步作为备选..." >> "$LOG_FILE"
    if timeout 1200 npm run sync:complete >> "$LOG_FILE" 2>&1; then
        echo "✅ 完整同步成功" >> "$LOG_FILE"
    else
        echo "❌ 完整同步也失败，需要人工介入" >> "$LOG_FILE"
        # 这里可以添加邮件或Slack通知
    fi
fi

echo "🏁 每日自动同步任务结束 - $(date)" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

# 清理旧日志文件 (保留7天)
find "$PROJECT_DIR/logs" -name "daily-sync-*.log" -mtime +7 -delete 2>/dev/null || true
EOF

# 使脚本可执行
chmod +x "$PROJECT_DIR/scripts/daily-sync-cron.sh"

echo "✅ 已创建每日同步脚本: $PROJECT_DIR/scripts/daily-sync-cron.sh"

# 添加到crontab
CRON_COMMAND="0 2 * * * $PROJECT_DIR/scripts/daily-sync-cron.sh"

# 检查是否已存在相同的cron任务
if crontab -l 2>/dev/null | grep -q "daily-sync-cron.sh"; then
    echo "⚠️  Cron任务已存在，正在更新..."
    # 移除旧的任务
    crontab -l 2>/dev/null | grep -v "daily-sync-cron.sh" | crontab -
fi

# 添加新的cron任务
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "✅ 已添加Cron任务: 每天凌晨2点自动同步"
echo "📋 当前Cron任务列表:"
crontab -l

echo ""
echo "🔧 手动测试命令:"
echo "   测试同步脚本: $PROJECT_DIR/scripts/daily-sync-cron.sh"
echo "   查看日志: tail -f $PROJECT_DIR/logs/daily-sync-$(date +'%Y-%m-%d').log"
echo "   查看Cron任务: crontab -l"
echo "   移除Cron任务: crontab -l | grep -v daily-sync-cron.sh | crontab -"

echo ""
echo "⏰ 下次自动同步时间: $(date -d 'tomorrow 2:00' +'%Y-%m-%d 02:00')"