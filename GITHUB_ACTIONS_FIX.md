# 🔧 GitHub Actions自动同步失败修复指南

## 🚨 **问题分析**

### 错误信息：
```
sync Process completed with exit code 128
```

### 失败原因：
**退出码128** = Git操作失败，主要原因：

1. **🔑 权限不足** - GitHub Token缺少写入权限
2. **🛡️ 分支保护** - main分支保护规则阻止直接push
3. **⚡ 认证失败** - GITHUB_TOKEN配置问题
4. **🔄 合并冲突** - 自动提交与远程分支冲突

---

## ✅ **修复方案**

### **已实施的自动修复：**

#### 1. 📝 **权限配置修复**
```yaml
jobs:
  sync:
    permissions:
      contents: write  # ✅ 添加内容写入权限
      actions: read    # ✅ 添加Actions读取权限
```

#### 2. 🔄 **冲突解决机制**
- ✅ 添加`git fetch`和`git rebase`避免冲突
- ✅ 实施3次重试机制
- ✅ 增强错误处理和状态反馈

#### 3. 🛡️ **环境验证检查**
- ✅ 验证同步脚本存在性
- ✅ 检查Node.js环境
- ✅ 语法验证预检查

#### 4. 📊 **详细日志输出**
- ✅ 每个步骤的状态反馈
- ✅ 失败时的明确错误信息
- ✅ 重试过程的透明化

---

## 🎯 **手动修复步骤**

### **Step 1: 检查仓库设置**

1. **进入GitHub仓库设置**：
   ```
   https://github.com/capmapt/chatsvtr/settings
   ```

2. **检查Actions权限**：
   - 导航到 `Settings` > `Actions` > `General`
   - 确保 `Workflow permissions` 设置为：
     - ✅ `Read and write permissions`
     - ✅ `Allow GitHub Actions to create and approve pull requests`

### **Step 2: 分支保护规则调整**

1. **检查分支保护**：
   ```
   https://github.com/capmapt/chatsvtr/settings/branches
   ```

2. **调整main分支保护规则**：
   - 如果有保护规则，添加例外：
   - ✅ `Allow specified actors to bypass required pull requests`
   - ✅ 添加 `github-actions[bot]` 到例外列表

### **Step 3: 手动测试同步**

在GitHub仓库页面：

1. **触发手动同步**：
   ```
   Actions > SVTR知识库自动同步 > Run workflow
   ```

2. **选择同步类型**：
   - `test` - 测试同步（推荐先试）
   - `daily` - 日常同步
   - `full` - 完整同步

### **Step 4: 本地测试（可选）**

如果需要本地调试：

```bash
# 1. 安装依赖
npm ci

# 2. 设置环境变量
export FEISHU_APP_ID=cli_a8e2014cbe7d9013
export FEISHU_APP_SECRET=tysHBj6njxwafO92dwO1DdttVvqvesf0

# 3. 测试同步脚本
node scripts/improved-feishu-sync.js svtrai2025

# 4. 检查输出文件
ls -la assets/data/rag/
```

---

## 📈 **预期修复效果**

### ✅ **修复后的工作流程：**

1. **00:00 PST** - 自动触发定时任务
2. **环境检查** - 验证脚本和依赖
3. **数据同步** - 从飞书API获取最新数据
4. **智能提交** - 检测变化并自动提交
5. **冲突处理** - 自动解决合并冲突
6. **状态通知** - 发送成功/失败通知

### 📊 **监控指标：**

- **成功率目标**: 95%+
- **执行时间**: < 5分钟
- **数据更新**: 自动检测变化
- **错误恢复**: 3次自动重试

---

## 🔍 **问题诊断检查表**

### 如果修复后仍然失败，请检查：

- [ ] **GitHub Token权限** - 确保有`contents: write`权限
- [ ] **分支保护规则** - main分支是否允许Actions推送
- [ ] **飞书API配置** - App ID和Secret是否正确
- [ ] **网络连接** - GitHub Actions能否访问飞书API
- [ ] **脚本语法** - 同步脚本是否有语法错误
- [ ] **文件权限** - assets/data/rag/目录是否可写

### 常见错误代码：

- **Exit 128**: Git操作失败（权限/冲突）
- **Exit 1**: 脚本执行错误（飞书API/语法）
- **Exit 0**: 成功执行 ✅

---

## 📞 **如需进一步支持**

如果问题仍然存在：

1. **查看Actions日志**：
   ```
   https://github.com/capmapt/chatsvtr/actions
   ```

2. **检查具体错误信息**：
   - 点击失败的workflow
   - 展开失败的步骤
   - 复制完整错误日志

3. **常见解决方案**：
   - 重新运行工作流
   - 检查仓库权限设置
   - 验证飞书API凭据
   - 手动合并冲突

---

**修复时间**: 预计修复将在下次定时执行时生效（每日12:00 AM PST）

**状态追踪**: 可通过GitHub Actions页面实时监控修复效果