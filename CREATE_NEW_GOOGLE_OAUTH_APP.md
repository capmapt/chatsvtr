# 创建新的 Google OAuth 应用指南

## 🚨 当前问题
现有的Google OAuth应用返回404错误，需要创建新的应用或修复现有应用。

## 📋 创建步骤

### 1. 访问Google Cloud Console
- 网址: https://console.cloud.google.com/
- 选择或创建项目

### 2. 启用Google OAuth API
- 进入 **APIs & Services** > **Library**
- 搜索 "Google+ API" 或 "People API"
- 点击启用

### 3. 创建OAuth 2.0客户端ID
- 进入 **APIs & Services** > **Credentials**
- 点击 **+ CREATE CREDENTIALS** > **OAuth client ID**
- 选择 **Web application**

### 4. 配置OAuth应用
```
Name: SVTR - 硅谷科技评论
Authorized JavaScript origins:
  https://svtr.ai
  https://svtrglobal.com
  https://svtrai.com
  https://svtr.cn
  https://chatsvtr.pages.dev
  http://localhost:3000

Authorized redirect URIs:
  https://svtr.ai/api/auth/google
```

### 5. 获取凭据
- 复制 **Client ID**
- 复制 **Client Secret**

### 6. 更新代码配置
```bash
# 更新wrangler.toml中的Client ID
GOOGLE_CLIENT_ID = "新的Client ID"

# 更新Cloudflare Pages密钥
npx wrangler pages secret put GOOGLE_CLIENT_SECRET
# 输入新的Client Secret
```

### 7. 重新部署
```bash
npx wrangler pages deploy . --project-name chatsvtr
```

## 🔄 快速修复流程

如果你有新的Google OAuth凭据，请告诉我新的Client ID和Secret，我来帮你更新配置并重新部署。

## 📊 验证清单
- [ ] Google Cloud项目存在且有效
- [ ] OAuth应用已创建并启用
- [ ] 所有重定向URI已正确配置
- [ ] Client ID和Secret已更新到代码
- [ ] 代码已重新部署到生产环境

## 💡 临时解决方案
如果无法立即修复Google OAuth，可以暂时：
1. 只使用GitHub OAuth登录
2. 实现邮箱验证码登录
3. 创建测试用的Google OAuth应用

---

**下一步**: 请检查Google Cloud Console中的OAuth应用状态，或提供新的OAuth凭据。