#!/bin/bash

# SVTR.AI 部署工作流程
# 完整的开发到生产部署流程

set -e

echo "🚀 SVTR.AI 部署工作流程"
echo "======================="

# 函数：显示菜单
show_menu() {
    echo ""
    echo "请选择操作:"
    echo "1) 📋 查看当前状态"
    echo "2) 🔍 启动预览服务器"
    echo "3) 💾 创建备份标签"
    echo "4) 🧪 部署到Staging环境"
    echo "5) 🚀 部署到生产环境"
    echo "6) 🔄 回退到上一版本"
    echo "7) 📊 查看部署历史"
    echo "8) ❌ 退出"
    echo ""
}

# 函数：查看当前状态
show_status() {
    echo "📊 当前状态:"
    echo "分支: $(git branch --show-current)"
    echo "最后提交: $(git log -1 --oneline)"
    echo ""
    echo "未提交更改:"
    git status -s || echo "无未提交更改"
    echo ""
    echo "最近5次提交:"
    git log --oneline -5
}

# 函数：启动预览
start_preview() {
    echo "🔍 启动预览服务器..."
    ./scripts/preview.sh
}

# 函数：创建备份
create_backup() {
    BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
    git tag $BACKUP_TAG
    echo "✅ 创建备份标签: $BACKUP_TAG"
}

# 函数：部署到staging
deploy_staging() {
    echo "🧪 部署到Staging环境..."
    
    # 检查是否有未提交更改
    if [[ -n $(git status -s) ]]; then
        echo "⚠️  检测到未提交更改，请先提交或暂存"
        return 1
    fi
    
    # 创建备份
    create_backup
    
    # 推送到GitHub
    git push origin main
    
    echo "✅ 已推送到GitHub，Staging环境将自动部署"
    echo "🔗 Staging URL: https://staging--svtr-chatsvtr.netlify.app/"
}

# 函数：部署到生产
deploy_production() {
    echo "🚀 部署到生产环境..."
    
    # 确认部署
    read -p "⚠️  确定要部署到生产环境吗? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 取消部署"
        return 1
    fi
    
    # 创建备份
    create_backup
    
    # 推送到GitHub
    git push origin main
    
    echo "✅ 已推送到GitHub，生产环境将自动部署"
    echo "🔗 生产URL: https://your-domain.com/"
}

# 函数：回退版本
rollback() {
    echo "🔄 启动回退工具..."
    node scripts/rollback.js
}

# 函数：查看部署历史
show_history() {
    echo "📊 部署历史:"
    echo ""
    echo "Git Tags (备份点):"
    git tag -l "backup-*" | tail -10
    echo ""
    echo "最近提交:"
    git log --oneline -10
}

# 主循环
while true; do
    show_menu
    read -p "请输入选项 (1-8): " choice
    
    case $choice in
        1)
            show_status
            ;;
        2)
            start_preview
            ;;
        3)
            create_backup
            ;;
        4)
            deploy_staging
            ;;
        5)
            deploy_production
            ;;
        6)
            rollback
            ;;
        7)
            show_history
            ;;
        8)
            echo "👋 再见!"
            exit 0
            ;;
        *)
            echo "❌ 无效选项，请重试"
            ;;
    esac
    
    echo ""
    read -p "按回车键继续..."
done