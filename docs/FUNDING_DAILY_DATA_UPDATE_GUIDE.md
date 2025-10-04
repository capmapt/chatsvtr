# AI创投日报数据更新指南

## 📋 问题复盘 (2025-10-04)

### 发现的问题

1. **融资金额提取错误**
   - 问题: 带逗号的数字无法识别 (`6,400万` → 无法匹配)
   - 影响: 部分融资金额显示为默认值 $10M

2. **团队背景显示错误**
   - 问题: 显示"12月30日"等无效数据
   - 影响: 用户看到错误信息

3. **缓存刷新参数不匹配** ⭐ 核心问题
   - 前端: `refresh=true`
   - 后端: 检查 `force=true`
   - 影响: **每次都读取旧缓存,无法获取最新数据**

### 根本原因

**缓存参数不一致导致数据无法更新**:
```
前端调用 → /api/wiki-funding-sync?refresh=true
后端检查 → if (force === 'true') // ❌ 永远为false
结果     → 总是返回缓存数据 (可能是几天前的旧数据)
```

### 修复方案

#### 1. 支持双参数刷新 ✅
```typescript
// functions/api/wiki-funding-sync.ts:140
const forceRefresh = url.searchParams.get('force') === 'true' ||
                     url.searchParams.get('refresh') === 'true';
```

#### 2. 融资金额提取增强 ✅
```javascript
// 支持逗号分隔的数字
/(\d+(?:,\d+)?(?:\.\d+)?)\s*万美元/
```

#### 3. 无效团队背景过滤 ✅
```javascript
function isInvalidTeamBackground(teamBackground) {
  // 过滤日期、空值、过短文本
  const invalidPatterns = [
    /^\d+月\d+日$/,
    /^20\d{2}年\d+月\d+日$/,
    // ...
  ];
  // ...
}
```

---

## 🔒 预防措施

### 1. API参数标准化

**规则**: 前后端使用统一的参数名

```typescript
// ✅ 推荐: 统一使用 refresh
前端: /api/xxx?refresh=true
后端: const refresh = url.searchParams.get('refresh') === 'true';

// ✅ 或者: 支持多个别名
const forceRefresh = ['force', 'refresh', 'reload']
  .some(key => url.searchParams.get(key) === 'true');
```

**检查清单**:
- [ ] API调用参数名与后端一致
- [ ] 测试刷新参数是否生效
- [ ] 验证缓存是否正确清除

### 2. 数据源更新流程

#### Step 1: 飞书数据源检查

```bash
# 直接调用飞书API查看原始数据
node scripts/test-feishu-raw.js

# 检查要点:
# - 字段名是否变更
# - 数据格式是否一致
# - 新增/删除字段
```

#### Step 2: 后端数据提取验证

```bash
# 测试API强制刷新
curl "https://svtr.ai/api/wiki-funding-sync?force=true&refresh=true"

# 检查:
# - source 应为 "real-time" (非 "cache")
# - 数据条数正确
# - 字段完整性
```

#### Step 3: 前端显示验证

```bash
# 本地测试
npm run dev

# 浏览器检查:
# - F12 Console 无错误
# - 融资卡片显示正常
# - 翻转卡片团队背景完整
```

#### Step 4: 清除生产缓存

```bash
# 方法1: API参数强制刷新
curl "https://svtr.ai/api/wiki-funding-sync?force=true"

# 方法2: Cloudflare KV手动删除
# 1. 访问 Cloudflare Dashboard
# 2. Workers & Pages → KV → SVTR_CACHE
# 3. 删除 key: "wiki-funding-real-data-v3"
```

### 3. 自动化监控

#### 健康检查脚本

创建 `scripts/check-funding-data-quality.js`:

```javascript
// 检查数据质量
async function checkDataQuality() {
  const res = await fetch('https://svtr.ai/api/wiki-funding-sync?force=true');
  const data = await res.json();

  // 检查1: 数据来源
  if (data.source === 'cache') {
    console.error('❌ 警告: 使用force=true仍返回缓存数据');
  }

  // 检查2: 团队背景质量
  const invalidTeam = data.data.filter(x => {
    const tb = x['团队背景'] || '';
    return tb.length < 20 || /^\d+月\d+日$/.test(tb);
  });

  if (invalidTeam.length > 10) {
    console.error(`❌ 警告: ${invalidTeam.length}条无效团队背景`);
  }

  // 检查3: 融资金额提取
  const invalidAmount = data.data.filter(x => {
    const desc = x['企业介绍'] || '';
    const hasAmount = /\d+(?:,\d+)?(?:\.\d+)?\s*(亿|千万|万).*(美元|元)/.test(desc);
    return hasAmount && x.amount === 10000000; // 默认值
  });

  if (invalidAmount.length > 5) {
    console.error(`❌ 警告: ${invalidAmount.length}条金额提取失败`);
  }

  console.log('✅ 数据质量检查通过');
}
```

#### GitHub Actions定时检查

`.github/workflows/funding-data-quality-check.yml`:

```yaml
name: 融资数据质量检查

on:
  schedule:
    - cron: '0 */6 * * *'  # 每6小时检查一次
  workflow_dispatch:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: node scripts/check-funding-data-quality.js
      - name: 通知失败
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '⚠️ 融资数据质量检查失败',
              body: '详见 Actions 日志',
              labels: ['data-quality', 'automated']
            })
```

### 4. 字段映射文档化

创建 `docs/feishu-field-mapping.md`:

```markdown
# 飞书字段映射

## 数据表信息
- App Token: DsQHbrYrLab84NspgnWcmj44nYe
- Table ID: tblLP6uUyPTKxfyx
- 源地址: https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe

## 字段映射

| 飞书字段 | API字段 | 数据类型 | 是否必需 | 提取逻辑 |
|---------|---------|---------|---------|---------|
| 企业介绍 | 企业介绍 | string | ✅ | `fields['企业介绍'] \|\| ''` |
| 团队背景 | 团队背景 | string | ⚠️ | `fields['团队背景'] \|\| ''` (需验证有效性) |
| 细分领域 | 细分领域 | string | ⚠️ | 用于分类 |
| 二级分类 | 二级分类 | string | ⚠️ | 用于标签 |
| 公司官网 | 公司官网 | string | ⚠️ | 卡片链接 |
| 联系方式 | 联系方式 | string | ❌ | 创始人超链接 |
| 标签 | 标签 | string | ❌ | 逗号分隔,合并到tags |

## 数据验证规则

### 团队背景
- ❌ 无效: 长度<5, 纯日期("12月30日")
- ✅ 有效: 包含人名+职位信息

### 融资金额提取
- 支持格式: "6,400万美元", "1.5亿美元", "$50M"
- 优先级: 本轮 > 通用模式
- 排除: 包含"累计"的金额
```

---

## 📝 快速检查清单

### 数据源更新时

- [ ] **1. 验证飞书API**
  ```bash
  node scripts/test-feishu-raw.js
  ```

- [ ] **2. 强制刷新缓存**
  ```bash
  curl "https://svtr.ai/api/wiki-funding-sync?force=true&refresh=true"
  ```

- [ ] **3. 检查数据质量**
  ```bash
  node scripts/check-funding-data-quality.js
  ```

- [ ] **4. 本地测试前端**
  ```bash
  npm run dev
  # 访问 http://localhost:3000
  # 检查卡片显示和翻转
  ```

- [ ] **5. 生产环境验证**
  - 访问 https://svtr.ai
  - Ctrl+F5 强制刷新
  - 检查3-5个卡片的团队背景

- [ ] **6. 监控数据源**
  - 检查 GitHub Actions 健康检查
  - 确认无错误告警

---

## 🚨 常见问题处理

### 问题1: 团队背景显示"公司信息"

**原因**:
- 缓存数据过期
- 飞书源字段变更
- 提取逻辑失效

**解决**:
```bash
# 1. 检查飞书原始数据
node scripts/test-feishu-raw.js | grep "团队背景"

# 2. 强制刷新API缓存
curl "https://svtr.ai/api/wiki-funding-sync?force=true&refresh=true"

# 3. 如果仍有问题,检查提取逻辑
grep -n "团队背景" functions/api/wiki-funding-sync.ts
```

### 问题2: 融资金额显示错误

**原因**:
- 数字格式变更(新增逗号、单位等)
- 正则表达式未覆盖

**解决**:
```bash
# 1. 查看企业介绍原文
curl -s "https://svtr.ai/api/wiki-funding-sync?force=true" | \
  jq '.data[0:3] | .[] | .企业介绍'

# 2. 测试提取逻辑
node -e "
const desc = 'xxx完成6,400万美元融资xxx';
const match = desc.match(/完成[^，。]*?(\d+(?:,\d+)?(?:\.\d+)?)\s*万美元/);
console.log(match);
"
```

### 问题3: 缓存无法刷新

**原因**:
- API参数名不匹配
- KV绑定失败
- 缓存键名变更

**解决**:
```bash
# 1. 检查API参数处理
grep -A 5 "forceRefresh" functions/api/wiki-funding-sync.ts

# 2. 检查KV绑定
grep "SVTR_CACHE" wrangler.toml

# 3. 手动删除KV缓存
# Cloudflare Dashboard → KV → 删除 "wiki-funding-real-data-v3"
```

---

## 📚 相关文档

- [飞书API文档](https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list)
- [AI创投日报健康监控指南](./FUNDING_DAILY_HEALTH_GUIDE.md)
- [数据源配置](./feishu-field-mapping.md)

---

**最后更新**: 2025-10-04
**维护者**: SVTR Team
