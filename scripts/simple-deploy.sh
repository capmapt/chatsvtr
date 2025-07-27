#!/bin/bash

# SVTR.AI Chatbot 一键简化部署脚本
# 解决Cloudflare环境复杂性问题

set -e

echo "🚀 SVTR.AI Chatbot 一键部署开始..."

# 检查环境
check_prerequisites() {
    echo "📋 检查运行环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    # 检查wrangler
    if ! command -v wrangler &> /dev/null; then
        echo "📦 安装 Wrangler..."
        npm install -g wrangler@latest
    fi
    
    echo "✅ 环境检查完成"
}

# 清理端口
cleanup_ports() {
    echo "🧹 清理端口冲突..."
    
    # 停止可能的冲突进程
    pkill -f "wrangler" 2>/dev/null || true
    pkill -f "python.*http.server" 2>/dev/null || true
    pkill -f "node.*server" 2>/dev/null || true
    
    sleep 2
    echo "✅ 端口清理完成"
}

# 升级wrangler解决版本问题
upgrade_wrangler() {
    echo "⬆️ 升级 Wrangler 到最新版本..."
    npm install -g wrangler@latest
    echo "✅ Wrangler 升级完成"
}

# 简化配置
simplify_config() {
    echo "⚙️ 简化 Cloudflare 配置..."
    
    # 备份原配置
    cp wrangler.toml wrangler.toml.backup 2>/dev/null || true
    
    # 创建简化的 wrangler.toml
    cat > wrangler.toml << EOF
name = "chatsvtr"
compatibility_date = "2024-12-01"
pages_build_output_dir = "."

# AI 绑定 (简化版)
[ai]
binding = "AI"

# Vectorize 绑定 (如果需要)
[[vectorize]]
binding = "SVTR_VECTORIZE"
index_name = "autorag-svtr-knowledge-base-ai"

# 简化的头部配置
[[headers]]
for = "*.html"
[headers.values]
"Cache-Control" = "public, max-age=300"

[[headers]]
for = "*.js"
[headers.values]
"Cache-Control" = "public, max-age=3600"

[[headers]]
for = "*.css"
[headers.values]
"Cache-Control" = "public, max-age=3600"
EOF
    
    echo "✅ 配置简化完成"
}

# 本地开发服务器
start_local_dev() {
    echo "🔧 启动本地开发服务器..."
    
    # 选择最佳启动方式
    local port=8888
    
    echo "尝试启动方式 1: Cloudflare Pages (简化模式)"
    if timeout 10s wrangler pages dev . --local --port $port --compatibility-date=2024-12-01 2>/dev/null; then
        echo "✅ Cloudflare Pages 启动成功: http://localhost:$port"
        return 0
    fi
    
    echo "尝试启动方式 2: Python 静态服务器"
    if command -v python3 &> /dev/null; then
        echo "🐍 使用 Python 静态服务器..."
        python3 -m http.server $port &
        SERVER_PID=$!
        sleep 3
        
        if curl -s http://localhost:$port > /dev/null; then
            echo "✅ Python 服务器启动成功: http://localhost:$port"
            echo "📝 服务器 PID: $SERVER_PID (使用 kill $SERVER_PID 停止)"
            return 0
        else
            kill $SERVER_PID 2>/dev/null || true
        fi
    fi
    
    echo "尝试启动方式 3: Node.js 简单服务器"
    if command -v npx &> /dev/null; then
        echo "📦 使用 Node.js 服务器..."
        npx http-server . -p $port --cors &
        SERVER_PID=$!
        sleep 3
        
        if curl -s http://localhost:$port > /dev/null; then
            echo "✅ Node.js 服务器启动成功: http://localhost:$port"
            echo "📝 服务器 PID: $SERVER_PID (使用 kill $SERVER_PID 停止)"
            return 0
        else
            kill $SERVER_PID 2>/dev/null || true
        fi
    fi
    
    echo "❌ 所有启动方式都失败了"
    return 1
}

# 生产部署
deploy_production() {
    echo "🚀 部署到 Cloudflare Pages..."
    
    # 检查登录状态
    if ! wrangler whoami &>/dev/null; then
        echo "🔐 请先登录 Cloudflare..."
        wrangler login
    fi
    
    # 部署
    echo "📤 正在部署..."
    if wrangler pages deploy .; then
        echo "✅ 部署成功！"
        echo "🌐 访问您的网站: https://chatsvtr.pages.dev"
    else
        echo "❌ 部署失败，请检查配置"
        return 1
    fi
}

# 健康检查
health_check() {
    local url=$1
    echo "🔍 运行健康检查..."
    
    if curl -s "$url" | grep -q "SVTR.AI"; then
        echo "✅ 网站正常运行"
        echo "💬 Chatbot 功能可用"
        return 0
    else
        echo "⚠️ 网站可能有问题"
        return 1
    fi
}

# 故障排除
troubleshoot() {
    echo "🔧 运行故障排除..."
    
    echo "📊 系统信息:"
    echo "  Node.js: $(node --version 2>/dev/null || echo '未安装')"
    echo "  Wrangler: $(wrangler --version 2>/dev/null || echo '未安装')"
    echo "  操作系统: $(uname -s)"
    
    echo "🔍 检查端口占用:"
    netstat -tuln 2>/dev/null | grep -E ":(8080|8888|3333|8000)" || echo "  无端口冲突"
    
    echo "📋 Cloudflare 状态:"
    wrangler whoami 2>/dev/null || echo "  未登录或配置错误"
    
    echo "🗂️ 文件检查:"
    ls -la wrangler.toml functions/ assets/ 2>/dev/null || echo "  文件结构可能有问题"
}

# 主菜单
show_menu() {
    echo ""
    echo "🎯 SVTR.AI Chatbot 部署助手"
    echo "=================================="
    echo "1. 🔧 本地开发 (推荐)"
    echo "2. 🚀 生产部署"
    echo "3. 🔍 健康检查"
    echo "4. 🛠️ 故障排除"
    echo "5. 🧹 清理环境"
    echo "6. ❌ 退出"
    echo ""
    read -p "请选择操作 (1-6): " choice
    
    case $choice in
        1)
            check_prerequisites
            cleanup_ports
            upgrade_wrangler
            simplify_config
            start_local_dev
            ;;
        2)
            check_prerequisites
            simplify_config
            deploy_production
            ;;
        3)
            read -p "请输入要检查的URL (默认: http://localhost:8888): " url
            url=${url:-http://localhost:8888}
            health_check "$url"
            ;;
        4)
            troubleshoot
            ;;
        5)
            cleanup_ports
            echo "✅ 环境清理完成"
            ;;
        6)
            echo "👋 再见！"
            exit 0
            ;;
        *)
            echo "❌ 无效选择，请重试"
            show_menu
            ;;
    esac
}

# 主程序
main() {
    # 如果有参数，直接执行对应操作
    if [ $# -gt 0 ]; then
        case $1 in
            "dev"|"local")
                check_prerequisites
                cleanup_ports
                simplify_config
                start_local_dev
                ;;
            "deploy"|"production")
                check_prerequisites
                simplify_config
                deploy_production
                ;;
            "check")
                health_check "${2:-http://localhost:8888}"
                ;;
            "clean")
                cleanup_ports
                ;;
            *)
                echo "用法: $0 [dev|deploy|check|clean]"
                exit 1
                ;;
        esac
    else
        # 显示菜单
        show_menu
    fi
}

# 运行主程序
main "$@"