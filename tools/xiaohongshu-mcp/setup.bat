@echo off
echo 小红书MCP安装脚本
echo ===================

:: 检查Go是否安装
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo 正在安装Go语言...
    winget install --id GoLang.Go --source winget
    echo 请重新启动命令行窗口后再运行此脚本
    pause
    exit /b 1
)

echo Go语言已安装
go version

:: 设置Go代理
echo 设置Go代理...
go env -w GOPROXY=https://goproxy.cn,direct

:: 编译主程序
echo 编译小红书MCP服务器...
go build -o xiaohongshu-mcp.exe .
if %errorlevel% neq 0 (
    echo 编译失败!
    pause
    exit /b 1
)

:: 编译登录程序
echo 编译登录工具...
go build -o xiaohongshu-login.exe cmd/login/main.go
if %errorlevel% neq 0 (
    echo 登录工具编译失败!
    pause
    exit /b 1
)

echo.
echo ✅ 编译成功!
echo.
echo 📖 使用说明:
echo 1. 首次使用请运行: xiaohongshu-login.exe
echo 2. 扫码登录小红书
echo 3. 启动服务: xiaohongshu-mcp.exe
echo 4. 服务地址: http://localhost:18060/mcp
echo.
echo 🔧 Claude Code配置:
echo claude mcp add --transport http xiaohongshu-mcp http://localhost:18060/mcp
echo.
pause