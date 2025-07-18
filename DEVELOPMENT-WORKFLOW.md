# SVTR.AI 开发工作流程

## 🚀 快速开始

### 1. 首次设置

```bash
# 添加 zsh 别名配置
cat zsh-config.txt >> ~/.zshrc
source ~/.zshrc

# 现在可以使用快捷命令
svtr              # 进入项目并显示菜单
svtr-dev          # 直接启动开发服务器
svtr-preview      # 启动预览服务器
svtr-commit       # 快速提交代码
svtr-deploy       # 完整部署流程
```

### 2. 日常开发流程

```bash
# 1. 启动开发环境
svtr-dev          # 启动在 localhost:3000

# 2. 编辑代码
# 修改 HTML/CSS/JS 文件，浏览器自动刷新查看效果

# 3. 提交更改
svtr-commit       # 交互式提交

# 4. 完整部署
svtr-deploy       # 推送到 GitHub + 部署到 Cloudflare
```

## 🛠️ 工具脚本说明

### dev-start.sh
- 项目启动脚本
- 显示项目状态和可用命令
- 可选择启动开发服务器

### dev-preview.sh
- 本地预览服务器
- 支持自定义端口
- 自动禁用缓存
- 提供多个测试页面链接

### dev-commit.sh
- 快速提交工具
- 支持语义化提交消息
- 显示更改内容
- 仅本地提交，不推送

### quick-deploy.sh
- 完整部署流程
- 自动提交 → 推送 GitHub → 部署 Cloudflare
- 错误处理和状态反馈

## 🌐 部署流程

### GitHub 配置
- 仓库: https://github.com/capmapt/chatsvtr
- 分支: main
- 自动触发 Cloudflare 部署

### Cloudflare Pages
- 项目名: chatsvtr
- 构建命令: 无需构建（静态站点）
- 输出目录: . （根目录）
- 自定义域名: svtrglobal.com

## 📱 预览环境

### 本地预览链接
- 主页: http://localhost:3000
- AI100页面: http://localhost:3000/pages/ai-100.html
- 移动端测试: http://localhost:3000/test-mobile.html
- Banner预览: http://localhost:3000/banner-preview.html

### 生产环境链接
- Cloudflare: https://chatsvtr.pages.dev
- 自定义域名: https://svtrglobal.com

## 🔧 故障排除

### 端口被占用
```bash
# 查看占用端口的进程
lsof -i :3000

# 终止进程
lsof -ti:3000 | xargs kill -9
```

### Cloudflare 部署失败
```bash
# 检查 wrangler 安装
npm install -g wrangler

# 检查登录状态
wrangler whoami

# 重新登录
wrangler auth login
```

### Git 推送失败
```bash
# 检查远程仓库
git remote -v

# 重新设置远程仓库
git remote set-url origin https://github.com/capmapt/chatsvtr.git
```

## 📋 最佳实践

1. **频繁提交**: 使用 `svtr-commit` 进行小粒度提交
2. **测试预览**: 每次更改后使用 `svtr-preview` 测试
3. **完整部署**: 确认无误后使用 `svtr-deploy` 部署
4. **移动端测试**: 定期检查移动端显示效果
5. **性能监控**: 关注 Cloudflare 分析数据

## 🔄 版本控制

- 使用语义化提交消息
- 定期创建备份标签
- 保持代码库整洁
- 及时合并优化分支