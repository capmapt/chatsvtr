@echo off
echo Claude Code MCP配置脚本
echo ========================

echo 正在配置小红书MCP到Claude Code...
echo.

claude mcp add --transport http xiaohongshu-mcp http://localhost:18060/mcp

echo.
echo 检查MCP服务器列表:
claude mcp list

echo.
echo ✅ 配置完成！
echo.
echo 📖 使用说明:
echo 1. 运行 start.bat 启动小红书MCP服务
echo 2. 在Claude Code中可以使用小红书相关功能
echo.
echo 🛠️ 可用工具:
echo - check_login_status    检查登录状态
echo - publish_content       发布图文内容
echo - search_feeds          搜索内容
echo - list_feeds            获取推荐列表
echo - get_feed_detail       获取帖子详情
echo - post_comment_to_feed  发表评论
echo - user_profile          获取用户资料
echo.
pause