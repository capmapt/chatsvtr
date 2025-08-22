# Google OAuth 应用配置指南

## 🚨 问题诊断

用户报告 `svtrglobal.com` 谷歌登录出现 **404 错误**。

经过诊断，代码配置正常，问题在于 **Google Cloud Console OAuth 应用配置缺少重定向URI**。

## 🔧 解决方案

### 1. 访问 Google Cloud Console
1. 打开 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择项目或创建新项目
3. 导航到 **APIs & Services** > **Credentials**

### 2. 找到 OAuth 2.0 客户端 ID
- **客户端 ID**: `369633995349-7apl7m77mpeo4231b1kl2v3nonqi60ga.apps.googleusercontent.com`
- 点击编辑该 OAuth 客户端

### 3. 添加授权重定向 URI

在 **授权重定向 URI** 部分，确保包含以下所有地址：

```
https://svtr.ai/api/auth/google
https://svtrai.com/api/auth/google
https://svtr.cn/api/auth/google
https://svtrglobal.com/api/auth/google
https://chatsvtr.pages.dev/api/auth/google
http://localhost:3000/api/auth/google
```

### 4. 重要提醒

- ✅ **精确匹配**: 重定向URI必须与代码中的完全一致
- ✅ **协议要求**: 生产环境必须使用 HTTPS
- ✅ **路径完整**: 必须包含完整路径 `/api/auth/google`
- ❌ **通配符不支持**: Google不支持通配符域名

## 📊 当前状态检查

根据诊断结果：

| 域名 | OAuth重定向 | 回调地址 | 状态 |
|------|-------------|----------|------|
| svtr.ai | ✅ 正常 | ✅ 正确 | 需检查Console配置 |
| svtrglobal.com | ✅ 正常 | ✅ 正确 | **需要添加到Console** |
| chatsvtr.pages.dev | ✅ 正常 | ✅ 正确 | ✅ 已修复 |
| svtrai.com | ⚠️ 重定向到svtr.ai | - | 需配置DNS |
| svtr.cn | ❌ DNS失败 | - | 需配置DNS |

## 🎯 立即行动项

### 🔴 紧急修复 (svtrglobal.com 404错误)
1. 登录 Google Cloud Console
2. 找到 OAuth 客户端: `369633995349-7apl7m77mpeo4231b1kl2v3nonqi60ga`
3. 添加重定向URI: `https://svtrglobal.com/api/auth/google`
4. 保存配置
5. 等待2-5分钟生效

### 🟡 完整配置 (所有域名支持)
```
https://svtr.ai/api/auth/google
https://svtrglobal.com/api/auth/google
https://chatsvtr.pages.dev/api/auth/google
http://localhost:3000/api/auth/google
```

## 🧪 验证方法

配置完成后，测试验证：

```bash
# 测试重定向
curl -I https://svtrglobal.com/api/auth/google

# 应该返回 302 重定向到 Google OAuth
```

## 📝 GitHub OAuth 同样需要配置

GitHub OAuth 应用也需要添加所有重定向URI：
- 访问 [GitHub Developer Settings](https://github.com/settings/developers)
- 找到应用: `Ov23liTtfl1NQmZtq2em`
- 添加对应的 GitHub 回调地址

## ⚡ 生效时间

- **Google OAuth**: 配置后2-5分钟生效
- **GitHub OAuth**: 配置后立即生效
- **DNS 更改**: 可能需要几小时到24小时

## 🔍 故障排除

如果配置后仍有问题：

1. **清除浏览器缓存**
2. **检查域名DNS解析**
3. **确认HTTPS证书有效**
4. **验证客户端密钥配置**

---

**总结**: svtrglobal.com 的404错误是因为Google OAuth应用缺少该域名的重定向URI配置，添加后即可解决。