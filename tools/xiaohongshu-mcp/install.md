# 小红书MCP安装指南

## 安装方法

### 方法1: 预编译二进制文件(推荐)

1. 手动从GitHub Releases下载：
   - 访问：https://github.com/xpzouying/xiaohongshu-mcp/releases
   - 下载 `xiaohongshu-mcp-windows-amd64.exe`
   - 下载 `xiaohongshu-login-windows-amd64.exe`

2. 将下载的文件重命名：
   ```bash
   mv xiaohongshu-mcp-windows-amd64.exe xiaohongshu-mcp.exe
   mv xiaohongshu-login-windows-amd64.exe xiaohongshu-login.exe
   ```

### 方法2: 从源码编译

1. 安装Go语言：
   ```bash
   winget install --id GoLang.Go --source winget
   ```

2. 设置Go代理(国内用户):
   ```bash
   go env -w GOPROXY=https://goproxy.cn,direct
   ```

3. 编译项目：
   ```bash
   cd /c/Projects/chatsvtr/tools/xiaohongshu-mcp
   go build -o xiaohongshu-mcp.exe .
   go build -o xiaohongshu-login.exe cmd/login/main.go
   ```

## 使用步骤

### 1. 首次登录
```bash
./xiaohongshu-login.exe
```
按照提示扫码登录小红书

### 2. 启动MCP服务
```bash
# 无头模式(推荐)
./xiaohongshu-mcp.exe

# 有界面模式(调试用)
./xiaohongshu-mcp.exe -headless=false
```

服务将在 `http://localhost:18060/mcp` 启动

### 3. 配置Claude Code MCP

```bash
# 添加MCP服务器
claude mcp add --transport http xiaohongshu-mcp http://localhost:18060/mcp

# 检查是否添加成功
claude mcp list
```

## 可用的MCP工具

- `check_login_status` - 检查登录状态
- `publish_content` - 发布图文内容
- `list_feeds` - 获取推荐列表
- `search_feeds` - 搜索内容
- `get_feed_detail` - 获取帖子详情
- `post_comment_to_feed` - 发表评论
- `user_profile` - 获取用户资料

## 注意事项

1. **风险控制**:
   - 每天发帖建议不超过50篇
   - 控制发布频率，避免机器行为特征
   - 内容质量要高

2. **技术限制**:
   - 标题不超过20字
   - 同一账号不能多处登录
   - Cookie可能过期需重新登录

3. **内容要求**:
   - 支持图文发布(推荐本地图片路径)
   - 支持HTTP图片链接
   - 支持JPG/PNG/GIF/WebP格式

## 与ChatSVTR集成

可以将小红书发布功能与现有的AI创投日报系统集成：

1. **内容流程**: 飞书数据 → AI生成 → 小红书发布
2. **自动化**: 定时获取融资信息，生成小红书内容
3. **多平台**: 同步到小红书、微信公众号等平台