# AI创投日报健康监控指南

## 问题诊断与防御方案

### 🔍 已修复的核心问题

#### 问题1: Middleware Gzip配置错误
**症状**: 前端显示空白，控制台报JSON解析错误
**根因**: `_middleware.ts` 错误设置 `Content-Encoding: gzip` 但未实际压缩
**修复**: 删除第70-72行错误的压缩标记代码
**文件**: `functions/_middleware.ts:70-72`

#### 问题2: 前端缺少错误检测
**症状**: 无法识别压缩数据或格式错误
**修复**: 添加Gzip魔数检测、空响应检测、JSON格式验证
**文件**: `assets/js/funding-daily.js:690-722`

#### 问题3: 缺少健康监控
**症状**: 问题发生后才发现，无法预警
**修复**: 创建健康检查API和自动化监控
**文件**: `functions/api/wiki-funding-health.ts`, `.github/workflows/funding-daily-health-check.yml`

---

## 🛡️ 多层防御机制

### 第1层: API健康检查
```bash
# 本地检查
npm run health:check

# 生产环境检查
npm run health:check:prod
```

**检查项**:
- ✅ 飞书API认证状态
- ✅ 数据获取成功率
- ✅ 返回记录数量
- ✅ KV缓存状态
- ✅ 响应延迟

### 第2层: 前端数据验证
**自动检测**:
- 🔍 Gzip压缩数据检测 (0x1f8b魔数)
- 🔍 空响应检测
- 🔍 非JSON格式检测
- 🔍 超时控制 (15秒)

**降级策略**:
1. API失败 → Mock数据
2. 数据为空 → 显示友好提示
3. 解析失败 → 详细错误日志

### 第3层: GitHub Actions自动监控
**触发条件**:
- 每小时自动检查
- 手动触发检查
- 部署后自动检查

**告警机制**:
- 健康检查失败自动创建Issue
- 标签: `health-check`, `automated`, `bug`
- 包含详细诊断信息和修复建议

---

## 🔧 常见问题修复

### 问题A: 数据显示为空
**诊断步骤**:
1. 检查浏览器控制台
   ```javascript
   // 应该看到这些日志
   ✅ JSON解析成功，数据量: 20
   ```

2. 运行健康检查
   ```bash
   npm run health:check
   ```

3. 检查API响应
   ```bash
   curl -H "Accept-Encoding: identity" http://localhost:3000/api/wiki-funding-sync?refresh=true
   ```

**可能原因**:
- ❌ Middleware错误设置压缩
- ❌ 飞书API认证失败
- ❌ 数据源无记录
- ❌ 缓存损坏

**修复方案**:
```bash
# 1. 验证Middleware修复
grep -A 5 "性能优化头" functions/_middleware.ts

# 2. 清除缓存重试
# 在wrangler dashboard删除KV中的 wiki-funding-real-data-v3

# 3. 强制刷新
curl "http://localhost:3000/api/wiki-funding-sync?force=true&refresh=true"
```

### 问题B: 间歇性失败
**诊断步骤**:
1. 查看健康检查历史
   ```bash
   cat .monitor/funding-daily-status.json
   ```

2. 检查飞书API配额
   - 访问: https://open.feishu.cn/app/console

3. 查看KV存储状态
   ```bash
   wrangler kv:key get --binding SVTR_CACHE wiki-funding-real-data-v3
   ```

**可能原因**:
- ⚠️ 飞书API限流
- ⚠️ 网络波动
- ⚠️ Cloudflare Workers超时

**修复方案**:
- 启用KV缓存减少API调用
- 增加请求超时时间
- 添加重试机制

### 问题C: 数据过期
**诊断步骤**:
1. 检查最后更新时间
   ```javascript
   // 浏览器控制台
   document.getElementById('fundingUpdateTime').textContent
   ```

2. 检查飞书数据源
   - 访问: https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe

**可能原因**:
- 📅 缓存未刷新 (24小时TTL)
- 📅 飞书数据源未更新
- 📅 同步任务失败

**修复方案**:
```bash
# 强制刷新
curl "https://svtr.ai/api/wiki-funding-sync?force=true"

# 或在浏览器控制台
window.fundingDaily.refreshFundingData()
```

---

## 📊 监控最佳实践

### 日常运维
1. **每天检查一次健康状态**
   ```bash
   npm run health:check:prod
   ```

2. **每周查看GitHub Issues**
   - 标签: `health-check`
   - 关闭已解决的Issue

3. **每月审查监控数据**
   ```bash
   cat .monitor/funding-daily-status.json
   ```

### 部署前检查
```bash
# 1. 本地测试
npm run dev
# 访问 http://localhost:3000 验证数据展示

# 2. 健康检查
npm run health:check

# 3. 部署
npm run deploy:cloudflare

# 4. 部署后验证
npm run health:check:prod
```

### 紧急修复流程
```bash
# 1. 快速诊断
npm run health:check:prod

# 2. 查看错误日志
# 在Cloudflare Dashboard -> Workers -> Logs

# 3. 回滚到上个版本（如需要）
wrangler pages deployment list
wrangler pages deployment tail <DEPLOYMENT_ID>

# 4. 修复代码并重新部署
git commit -am "fix: 修复创投日报问题"
npm run deploy:cloudflare
```

---

## 🎯 性能指标

### 健康指标
| 指标 | 目标 | 警告阈值 | 错误阈值 |
|------|------|---------|---------|
| 飞书认证延迟 | < 500ms | > 1s | > 3s |
| 数据获取延迟 | < 2s | > 5s | > 10s |
| 数据记录数 | ≥ 15条 | < 10条 | < 5条 |
| API成功率 | 99.9% | < 99% | < 95% |
| 缓存命中率 | > 80% | < 50% | < 30% |

### 告警规则
- 🟢 **Healthy**: 所有指标正常
- 🟡 **Degraded**: 1个指标超过警告阈值
- 🔴 **Down**: 任意指标超过错误阈值

---

## 📝 代码检查清单

### 部署前必查
- [ ] Middleware无错误压缩设置
- [ ] 前端有完整错误检测
- [ ] API返回正确JSON格式
- [ ] 健康检查API可用
- [ ] Mock数据可用作fallback
- [ ] 本地测试通过
- [ ] 健康检查通过

### 修改API时必查
- [ ] 返回正确Content-Type
- [ ] 不手动设置Content-Encoding
- [ ] 错误有明确message字段
- [ ] 成功返回success=true
- [ ] 数据格式与前端一致

### 修改前端时必查
- [ ] 有超时控制
- [ ] 有Gzip检测
- [ ] 有空响应检测
- [ ] 有JSON格式验证
- [ ] 有降级策略
- [ ] 控制台日志清晰

---

## 🔗 相关文件

- `functions/_middleware.ts` - 中间件配置
- `functions/api/wiki-funding-sync.ts` - 数据同步API
- `functions/api/wiki-funding-health.ts` - 健康检查API
- `assets/js/funding-daily.js` - 前端展示逻辑
- `scripts/test-funding-health.js` - 健康检查脚本
- `.github/workflows/funding-daily-health-check.yml` - 自动监控
- `.monitor/funding-daily-status.json` - 监控状态记录

---

## 📞 紧急联系

- **飞书API问题**: 检查 https://open.feishu.cn/app/console
- **Cloudflare问题**: 检查 https://dash.cloudflare.com/
- **GitHub Actions**: 查看 https://github.com/yourusername/chatsvtr/actions

---

**最后更新**: 2025-09-30
**维护者**: SVTR Team