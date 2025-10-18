# 🚀 部署验证检查清单

**目的**: 确保每次部署后代码真正对用户可见且功能正常

**适用范围**: 所有生产环境部署

---

## ✅ 阶段1: 部署前检查 (Pre-Deployment)

### **代码质量**
- [ ] 所有测试通过: `npm test`
- [ ] Linting通过: `npm run lint`
- [ ] 本地预览验证: `npm run preview`
- [ ] 核心功能手动测试完成

### **代码审查**
- [ ] 查看变更内容: `git diff main`
- [ ] 确认没有调试代码（console.log等，除非必要）
- [ ] 确认没有敏感信息（API keys等）
- [ ] Commit message清晰描述改动

### **版本管理**
- [ ] 更新版本号（如适用）
- [ ] 更新CHANGELOG.md
- [ ] 更新相关文档

---

## ✅ 阶段2: 部署执行 (Deployment)

### **代码提交**
```bash
# 1. 提交代码
git add .
git commit -m "feat: 描述改动内容"

# 2. 同步远程
git pull --rebase origin main

# 3. 推送
git push origin main
```

### **监控部署**
- [ ] GitHub Actions workflow触发
- [ ] Cloudflare Pages构建开始
- [ ] 构建过程无错误
- [ ] 部署状态显示"Active"

---

## ✅ 阶段3: 部署后验证 (Post-Deployment) ⚠️ **最重要**

### **3.1 部署状态检查**

```bash
# 检查最新部署
npx wrangler pages deployment list --project-name=chatsvtr | head -5

# 记录部署信息
DEPLOYMENT_ID="<从上面获取>"
DEPLOYMENT_URL="https://${DEPLOYMENT_ID}.chatsvtr.pages.dev"
echo "✅ Deployment URL: $DEPLOYMENT_URL"
```

- [ ] 最新部署状态为"Active"
- [ ] Commit hash匹配
- [ ] 记录部署URL和ID

---

### **3.2 代码部署验证**

```bash
# 验证关键代码已部署（替换为实际的关键词）
curl -s "$DEPLOYMENT_URL/assets/js/funding-daily.js" | grep "关键功能关键词"

# 检查文件大小是否合理
curl -I "$DEPLOYMENT_URL/assets/js/funding-daily.js"
```

- [ ] 关键功能代码存在
- [ ] 文件大小合理（没有异常）
- [ ] HTTP状态码为200

---

### **3.3 功能验证**

**方法1: 自动化测试**
```bash
# 运行E2E测试（如果有）
npm run test:e2e -- --url=$DEPLOYMENT_URL
```

**方法2: 手动验证** ⚠️ **必须执行**
- [ ] 访问部署URL：`$DEPLOYMENT_URL`
- [ ] 验证首页加载正常
- [ ] 验证核心功能正常工作
- [ ] 打开浏览器控制台检查错误
- [ ] 测试主要用户路径

**核心功能检查（根据本次改动）**:
- [ ] 功能1: ___________
- [ ] 功能2: ___________
- [ ] 功能3: ___________

---

### **3.4 缓存策略检查**

```bash
# 检查缓存头
curl -I "$DEPLOYMENT_URL/assets/js/funding-daily.js" | grep -i cache

# 检查主域名缓存
curl -I "https://svtr.ai/assets/js/funding-daily.js" | grep -i cache
```

- [ ] 了解缓存策略（max-age值）
- [ ] 评估缓存对用户的影响
- [ ] 确定是否需要清除缓存指导

**如果缓存时间>1小时**:
- [ ] 准备缓存清除指南
- [ ] 提供最新部署URL作为备选
- [ ] 在用户通知中说明缓存延迟

---

### **3.5 性能检查**

```bash
# 检查关键资源加载时间
curl -o /dev/null -s -w "Time: %{time_total}s\n" "$DEPLOYMENT_URL"
```

- [ ] 首页加载时间<3秒
- [ ] 关键资源加载正常
- [ ] 没有明显性能退化

---

### **3.6 主域名验证**

⚠️ **注意**: 主域名可能有CDN缓存延迟

```bash
# 等待5-10分钟后验证主域名
curl -s "https://svtr.ai/assets/js/funding-daily.js" | grep "关键功能关键词"
```

- [ ] 等待足够时间（5-10分钟）
- [ ] 主域名显示更新内容
- [ ] 或在用户通知中说明延迟

---

## ✅ 阶段4: 用户通知 (User Communication)

### **通知模板**

```markdown
## 🎉 功能更新已部署

### ✅ 更新内容
- [描述主要改动1]
- [描述主要改动2]
- [描述主要改动3]

### 🔗 访问链接
- **最新部署**: $DEPLOYMENT_URL
- **主域名**: https://svtr.ai

### ⚠️ 重要提示
由于CDN缓存策略，主域名可能需要5-10分钟生效。

**如果看不到更新，请尝试**:
1. 访问最新部署URL（立即生效）
2. 使用无痕模式访问主域名
3. 强制刷新浏览器（Ctrl+Shift+R）
4. 查看缓存清除指南: [CACHE_CLEAR_GUIDE.md](CACHE_CLEAR_GUIDE.md)

### 📊 如何验证
1. 打开浏览器控制台（F12）
2. 刷新页面
3. 检查是否有[关键日志输出]
4. 验证[核心功能]是否正常

### 📞 遇到问题？
- 查看故障排除指南
- 在GitHub创建Issue
- 联系维护团队
```

### **通知检查清单**
- [ ] 清晰描述更新内容
- [ ] 提供最新部署URL
- [ ] 说明可能的缓存延迟
- [ ] 提供缓存清除方法
- [ ] 提供验证步骤
- [ ] 提供反馈渠道

---

## ✅ 阶段5: 监控与跟踪 (Monitoring)

### **短期监控（24小时）**
- [ ] 监控错误日志
- [ ] 检查性能指标
- [ ] 收集用户反馈
- [ ] 准备快速回滚方案

### **记录部署信息**

```bash
# 创建部署记录
cat >> deployment.log << EOF
---
Date: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
Commit: $(git rev-parse HEAD)
Deployment: $DEPLOYMENT_ID
URL: $DEPLOYMENT_URL
Status: ✅ Verified
Changes: [简要描述]
Deployed by: [名字]
EOF
```

- [ ] 记录部署时间
- [ ] 记录Commit hash
- [ ] 记录部署URL
- [ ] 记录验证结果

---

## 🚨 回滚计划 (Rollback Plan)

### **触发回滚的条件**
- [ ] 核心功能完全失效
- [ ] 严重性能问题
- [ ] 安全漏洞
- [ ] 用户报告的严重bug

### **回滚步骤**

```bash
# 方法1: 通过Cloudflare Dashboard回滚到上一个部署

# 方法2: Git回滚
git revert HEAD
git push origin main

# 方法3: 回滚到特定commit
git reset --hard <previous-commit-hash>
git push --force origin main  # ⚠️ 谨慎使用
```

### **回滚后检查**
- [ ] 验证回滚成功
- [ ] 通知用户
- [ ] 分析问题原因
- [ ] 创建事后复盘文档

---

## 📋 快速检查清单（打印版）

```
部署验证快速清单 v1.0

□ 部署前
  □ 测试通过
  □ 代码审查
  □ 版本更新

□ 部署
  □ 代码推送
  □ CI/CD成功
  □ 部署Active

□ 验证 ⚠️
  □ 记录部署URL
  □ 验证代码部署
  □ 功能手动测试
  □ 检查缓存策略
  □ 性能检查
  □ 主域名验证

□ 通知
  □ 清晰描述更新
  □ 提供多种访问方式
  □ 说明缓存延迟
  □ 提供验证方法

□ 监控
  □ 错误日志
  □ 性能指标
  □ 用户反馈
  □ 记录部署信息

签名: ___________  日期: ___________
```

---

## 🎯 关键原则

> **"部署完成 ≠ 用户可见"**

**永远记住**:
1. 🚨 验证代码真的部署了
2. 🚨 验证功能真的正常工作
3. 🚨 考虑缓存对用户的影响
4. 🚨 提供清晰的用户指导
5. 🚨 准备快速回滚方案

---

## 📚 相关文档

- [CACHE_CLEAR_GUIDE.md](../CACHE_CLEAR_GUIDE.md) - 缓存清除指南
- [DEPLOYMENT_VERIFICATION_2025-09-30.md](../DEPLOYMENT_VERIFICATION_2025-09-30.md) - 部署验证示例
- [post-mortem/](post-mortem/) - 事后复盘文档

---

**维护者**: SVTR Team
**版本**: 1.0
**最后更新**: 2025-10-16
