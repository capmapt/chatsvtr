# 🚀 快速开发流程 - SVTR.AI

## 📋 修改代码前的必做清单

- [ ] 创建备份：`npm run backup`
- [ ] 查看当前状态：`git status`
- [ ] 确认工作目录：`pwd`

## 🔍 预览修改效果

### 🎯 推荐方式：使用预览脚本
```bash
./scripts/preview.sh
# 访问 http://localhost:8080
```

### 🎛️ 交互式工具
```bash
./scripts/deploy-workflow.sh
# 选择选项 2) 启动预览服务器
```

## ✅ 满意后的部署流程

```bash
# 1. 提交更改
git add .
git commit -m "描述你的更改"

# 2. 推送到GitHub
git push origin main

# 3. 自动部署到Cloudflare (1-3分钟)
```

## 🔄 如果不满意需要回退

### 🚨 紧急回退
```bash
npm run rollback
# 或
node scripts/rollback.js
```

### 📝 回退步骤
1. 运行回退工具
2. 查看最近10次提交
3. 选择要回退到的提交哈希
4. 确认回退操作
5. 自动推送和部署

## 🎯 一键命令参考

| 命令 | 功能 |
|------|------|
| `./scripts/preview.sh` | 启动预览服务器 |
| `npm run backup` | 创建备份标签 |
| `npm run rollback` | 版本回退 |
| `./scripts/deploy-workflow.sh` | 完整部署工具 |
| `git log --oneline -10` | 查看提交历史 |

## 🔧 常用URL

- **本地预览**: http://localhost:8080
- **移动端测试**: http://localhost:8080/pages/test-mobile.html
- **生产环境**: https://your-domain.com
- **GitHub仓库**: https://github.com/capmapt/chatsvtr

---

💡 **提示**: 每次修改前先运行 `npm run backup` 创建备份点！