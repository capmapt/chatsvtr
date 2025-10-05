@echo off
echo 小红书MCP服务器启动脚本
echo ========================

cd /d "%~dp0"

echo 检查登录状态...
if not exist "cookies" (
    echo 首次使用需要登录小红书账号
    echo 正在启动登录工具...
    xiaohongshu-login.exe
    echo.
    echo 登录完成后请重新运行此脚本
    pause
    exit /b 0
)

echo 启动小红书MCP服务器...
echo 服务地址: http://localhost:18060/mcp
echo 按 Ctrl+C 停止服务
echo.

xiaohongshu-mcp.exe

pause