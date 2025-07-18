#!/bin/bash

# SVTR.AI 本地预览脚本
# 支持多端口预览和自动打开浏览器

PORT=${1:-3000}
BROWSER=${2:-""}

echo "🔍 启动 SVTR.AI 预览服务器..."
echo "📍 端口: $PORT"
echo "📁 目录: $(pwd)"

# 检查端口是否被占用
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，尝试终止进程..."
    lsof -ti:$PORT | xargs kill -9
    sleep 2
fi

# 创建临时服务器脚本
cat > /tmp/server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 3000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🌐 服务器启动在 http://localhost:{PORT}")
    print(f"📱 移动端预览: http://localhost:{PORT}/test-mobile.html")
    print(f"🎨 Banner测试: http://localhost:{PORT}/banner-preview.html")
    print(f"📊 使用 Ctrl+C 停止服务器")
    print(f"🔄 自动禁用缓存，修改文件后刷新即可看到变化")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ 服务器已停止")
EOF

# 启动服务器
python3 /tmp/server.py $PORT &
SERVER_PID=$!

# 等待服务器启动
sleep 2

# 显示有用信息
echo ""
echo "🎯 预览链接："
echo "  主页: http://localhost:$PORT"
echo "  AI100页面: http://localhost:$PORT/pages/ai-100.html"
echo "  移动端测试: http://localhost:$PORT/test-mobile.html"
echo "  Banner预览: http://localhost:$PORT/banner-preview.html"
echo ""
echo "🛠️  开发提示："
echo "  - 修改文件后刷新浏览器即可看到变化"
echo "  - 服务器已禁用缓存，无需强制刷新"
echo "  - 使用 Ctrl+C 停止服务器"
echo ""

# 自动打开浏览器（如果在WSL中则跳过）
if [[ -n "$BROWSER" && "$BROWSER" != "false" ]]; then
    if command -v explorer.exe &> /dev/null; then
        # WSL环境，使用Windows浏览器
        explorer.exe "http://localhost:$PORT"
    elif command -v xdg-open &> /dev/null; then
        # Linux环境
        xdg-open "http://localhost:$PORT"
    fi
fi

# 等待用户停止
wait $SERVER_PID