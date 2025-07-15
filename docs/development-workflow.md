# 开发和部署工作流程

## 🎯 完整的开发流程

### 1. 📋 修改代码前的准备

```bash
# 查看当前状态
git status

# 创建备份点
npm run backup

# 查看最近提交
git log --oneline -5
```

### 2. 🔍 本地预览流程

#### 方式一：使用预览脚本（推荐）
```bash
# 启动预览服务器
./scripts/preview.sh

# 或者使用npm命令
npm run preview
```

#### 方式二：使用完整工作流程
```bash
# 启动交互式部署工具
./scripts/deploy-workflow.sh
```

#### 方式三：手动启动
```bash
# 启动本地服务器
python3 -m http.server 8080

# 访问 http://localhost:8080
```

### 3. 📝 代码修改和测试

1. **编辑代码**
   - 修改HTML、CSS、JavaScript文件
   - 保存更改

2. **实时预览**
   - 浏览器访问 `http://localhost:8080`
   - 刷新页面查看修改效果
   - 测试功能是否正常

3. **移动端测试**
   - 使用开发者工具模拟移动设备
   - 访问 `http://localhost:8080/pages/test-mobile.html`

### 4. 🚀 部署流程

#### 满意后的部署步骤：

1. **提交代码**
   ```bash
   git add .
   git commit -m "描述你的更改"
   ```

2. **推送到GitHub**
   ```bash
   git push origin main
   ```

3. **自动部署**
   - Cloudflare Pages 会自动检测推送
   - 1-3分钟后部署完成

## 🔄 版本回退指南

### 1. 快速回退

```bash
# 使用回退工具
npm run rollback

# 或直接运行
node scripts/rollback.js
```

### 2. 手动回退

```bash
# 查看提交历史
git log --oneline -10

# 回退到指定提交
git reset --hard <commit-hash>

# 强制推送（危险操作）
git push --force-with-lease
```

### 3. 从备份恢复

```bash
# 查看备份标签
git tag -l "backup-*"

# 恢复到备份点
git reset --hard backup-20250115-143000

# 推送恢复
git push --force-with-lease
```

## 🧪 Staging环境

### 设置Staging环境

1. **Netlify设置**
   - 创建新的Netlify站点
   - 连接到同一个GitHub仓库
   - 设置branch为 `staging`

2. **或使用Netlify别名**
   ```bash
   # 部署到staging别名
   npm run deploy:staging
   ```

### 使用Staging环境

1. **推送到staging分支**
   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **测试完成后合并到main**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

## 📊 监控和日志

### 查看部署状态

```bash
# 查看Git状态
git status

# 查看部署历史
git log --oneline -10

# 查看备份点
git tag -l "backup-*"
```

### Cloudflare Pages监控

- 访问Cloudflare Pages仪表板
- 查看部署历史和状态
- 监控访问量和性能

## 🛠️ 常用命令

```bash
# 开发相关
npm run preview          # 启动预览服务器
npm run dev             # 启动开发服务器
npm run backup          # 创建备份标签

# 部署相关
npm run deploy:staging  # 部署到staging
npm run deploy         # 部署到生产
npm run rollback       # 版本回退

# 工作流程
./scripts/deploy-workflow.sh  # 交互式部署工具
./scripts/preview.sh          # 预览脚本
```

## 🔧 故障排除

### 常见问题

1. **预览服务器无法启动**
   - 检查端口8080是否被占用
   - 尝试使用不同端口：`python3 -m http.server 8081`

2. **推送失败**
   - 检查网络连接
   - 运行 `git pull` 同步远程更改

3. **回退失败**
   - 确保有足够的Git权限
   - 检查提交哈希是否正确

### 紧急恢复

```bash
# 如果一切都出错了，恢复到最近备份
git tag -l "backup-*" | tail -1 | xargs git reset --hard
git push --force-with-lease
```

## 🎉 最佳实践

1. **修改前总是创建备份**
2. **本地测试后再推送**
3. **使用描述性的提交信息**
4. **定期清理旧的备份标签**
5. **重要更改前在staging环境测试**