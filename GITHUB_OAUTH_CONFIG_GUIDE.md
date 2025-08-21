# GitHub OAuth 应用配置指南

## 🚨 问题诊断

用户报告在 `svtrglobal.com` 点击GitHub登录时出现错误：

```
Be careful!
The redirect_uri is not associated with this application.
The application might be misconfigured or could be trying to redirect you to a website you weren't expecting.
```

## 🔍 问题根因

**错误原因**: GitHub OAuth应用的重定向URI配置中缺少 `https://svtrglobal.com/api/auth/github`

**GitHub App ID**: `Ov23liTtfl1NQmZtq2em`

## 🔧 立即修复步骤

### 1. 访问 GitHub Developer Settings
1. 打开 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 **OAuth Apps** 标签页
3. 找到应用 ID: `Ov23liTtfl1NQmZtq2em`

### 2. 编辑 OAuth 应用配置
1. 点击 **Edit** 编辑应用
2. 找到 **Authorization callback URL** 部分

### 3. 添加所有重定向 URL

**当前需要配置的所有回调地址**：
```
https://svtr.ai/api/auth/github
https://svtrglobal.com/api/auth/github
https://chatsvtr.pages.dev/api/auth/github
http://localhost:3000/api/auth/github
```

**注意**: GitHub OAuth应用每次只能设置一个回调URL，需要为每个域名创建单独的OAuth应用，或者使用主域名然后通过服务端重定向。

## 🎯 推荐解决方案

### 方案A: 创建多个 GitHub OAuth 应用 (推荐)
为每个主要域名创建独立的GitHub OAuth应用：

1. **svtr.ai 应用** (当前)
   - Client ID: `Ov23liTtfl1NQmZtq2em`
   - Callback: `https://svtr.ai/api/auth/github`

2. **svtrglobal.com 应用** (需创建)
   - 创建新的OAuth应用
   - Callback: `https://svtrglobal.com/api/auth/github`

### 方案B: 统一重定向策略
使用主域名作为统一回调，然后服务端重定向：

1. 所有GitHub OAuth使用 `https://svtr.ai/api/auth/github`
2. 服务端根据 `state` 参数识别原始域名
3. 完成认证后重定向回原始域名

## 📝 具体配置步骤

### 创建 svtrglobal.com 的 GitHub OAuth 应用

1. **访问**: https://github.com/settings/applications/new
2. **Application name**: `SVTR Global (svtrglobal.com)`
3. **Homepage URL**: `https://svtrglobal.com`
4. **Authorization callback URL**: `https://svtrglobal.com/api/auth/github`
5. **点击 Register application**
6. **复制 Client ID 和 Client Secret**

### 更新代码配置

需要在 `wrangler.toml` 中添加新的配置或使用环境变量区分不同域名的GitHub应用。

## 🔄 代码修改方案

### 选项1: 多应用配置
```typescript
// 根据域名选择不同的GitHub Client ID
function getGitHubClientId(hostname: string): string {
  switch (hostname) {
    case 'svtrglobal.com':
      return env.GITHUB_CLIENT_ID_GLOBAL; // 新应用的 Client ID
    case 'svtr.ai':
    default:
      return env.GITHUB_CLIENT_ID; // 原有应用的 Client ID
  }
}
```

### 选项2: 统一回调 (更简单)
```typescript
// 所有域名都使用 svtr.ai 作为 GitHub 回调
const githubCallbackUrl = 'https://svtr.ai/api/auth/github';
// 在 state 参数中传递原始域名
const state = `${crypto.randomUUID()}_${currentDomain}`;
```

## ⚡ 临时解决方案

**最快修复**: 将现有GitHub OAuth应用的回调URL改为：
```
https://svtrglobal.com/api/auth/github
```

但这会影响其他域名的GitHub登录。

## 🧪 验证方法

配置完成后测试：
```bash
# 应该正常重定向，不再显示警告
curl -I https://svtrglobal.com/api/auth/github
```

## 📊 当前状态总结

| 域名 | Google OAuth | GitHub OAuth | 状态 |
|------|--------------|--------------|------|
| svtr.ai | ✅ 工作正常 | ✅ 工作正常 | 完好 |
| svtrglobal.com | ❌ 需添加重定向URI | ❌ 需添加重定向URI | **需修复** |
| chatsvtr.pages.dev | ✅ 已修复 | ✅ 已修复 | 完好 |

---

**推荐**: 使用方案B (统一重定向策略)，这样只需要一个GitHub OAuth应用，维护更简单。