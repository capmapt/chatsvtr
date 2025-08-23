# LinkedIn OAuth 应用配置指南

## 🚀 新增功能

SVTR平台现已支持LinkedIn OAuth登录！用户可以使用LinkedIn账号快速注册和登录。

## 📋 LinkedIn Developer 应用配置

### 1. 创建LinkedIn应用

1. **访问**: [LinkedIn Developers](https://www.linkedin.com/developers/)
2. **点击**: "Create App"
3. **填写应用信息**:
   ```
   App name: SVTR - 硅谷科技评论
   LinkedIn Page: (选择或创建公司页面，可选)
   Privacy policy URL: https://svtr.ai/privacy
   App logo: 上传SVTR logo
   ```

### 2. 配置OAuth设置

在应用的 **Auth** 标签页：

#### **Authorized redirect URLs**:
```
https://svtr.ai/api/auth/linkedin
http://localhost:3000/api/auth/linkedin
```

#### **产品和权限**:
1. **必须添加产品**: "Sign In with LinkedIn using OpenID Connect"
2. **Scopes** (权限范围):
   - ✅ `profile` - 获取基本用户信息
   - ✅ `email` - 获取用户邮箱地址

### 3. 获取应用凭据

在 **Auth** 标签页复制:
- **Client ID**
- **Client Secret**

## ⚙️ 代码配置

### 1. 更新环境变量

在 `wrangler.toml` 中设置:
```toml
LINKEDIN_CLIENT_ID = "你的LinkedIn Client ID"
```

### 2. 设置密钥

```bash
# 设置LinkedIn Client Secret
npx wrangler pages secret put LINKEDIN_CLIENT_SECRET
# 输入你的LinkedIn Client Secret
```

### 3. 部署应用

```bash
npx wrangler pages deploy . --project-name chatsvtr
```

## 🎯 技术实现

### OAuth流程
1. 用户在任意SVTR域名点击LinkedIn登录
2. 重定向到LinkedIn授权页面
3. 用户授权后回调到 `https://svtr.ai/api/auth/linkedin`
4. 后端获取用户信息和邮箱
5. 创建/更新本地用户账号
6. 生成会话令牌
7. 重定向回用户原始访问的域名

### 统一回调策略
- **回调URL**: 统一使用 `https://svtr.ai/api/auth/linkedin`
- **智能重定向**: 通过state参数保存原始域名，认证后重定向回去
- **多域名支持**: 支持所有SVTR域名的LinkedIn登录

### 用户数据结构
```typescript
interface LinkedInUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'linkedin';
  linkedinProfile: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
```

## 🧪 测试验证

### 本地测试
```bash
# 启动开发服务器
npm run dev

# 访问登录页面，测试LinkedIn登录
open http://localhost:3000
```

### 生产环境测试
访问任意SVTR域名，点击LinkedIn登录按钮：
- https://svtr.ai
- https://svtrglobal.com  
- https://chatsvtr.pages.dev

## 📊 支持的认证方式

现在SVTR支持完整的OAuth认证矩阵：

| 认证方式 | 状态 | 支持域名 |
|---------|------|----------|
| Google OAuth | ✅ 可用 | 所有域名 |
| GitHub OAuth | ✅ 可用 | 所有域名 |
| **LinkedIn OAuth** | ✅ **新增** | 所有域名 |
| 邮箱验证码 | ✅ 可用 | 所有域名 |
| Magic Link | ✅ 可用 | 所有域名 |

## 🔧 故障排除

### 常见问题

1. **"哎呀，出错了"错误**: LinkedIn应用必须添加"Sign In with LinkedIn using OpenID Connect"产品
2. **权限不足**: 确保使用新的 `profile` 和 `email` 权限范围
3. **404错误**: 检查redirect URL是否正确配置
4. **Scope错误**: 新建的LinkedIn应用不再支持 `r_liteprofile` 和 `r_emailaddress`

### 调试步骤

1. 检查LinkedIn Developer Console中的应用状态
2. 验证Client ID和Secret是否正确设置
3. 确认权限范围是否正确申请
4. 查看Cloudflare Workers日志

## 🎉 部署完成

LinkedIn OAuth登录功能已完全集成到SVTR平台：

- ✅ 后端API完整实现
- ✅ 前端界面美观集成
- ✅ 统一回调策略
- ✅ 多域名支持
- ✅ 用户数据管理
- ✅ 会话令牌系统

**下一步**: 配置LinkedIn Developer应用，获取Client ID和Secret，然后更新环境变量并部署！