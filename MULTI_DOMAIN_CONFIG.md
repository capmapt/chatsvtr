# SVTR 多域名配置指南

## 概述
SVTR 平台支持多个域名访问，所有域名共享相同的用户认证系统和数据。

## 支持的域名列表
- **svtr.ai** (主域名)
- **svtrai.com** 
- **svtr.cn**
- **svtrglobal.com**
- **localhost:3000** (开发环境)

## OAuth 应用配置

### Google OAuth 配置
需要在 [Google Cloud Console](https://console.cloud.google.com) 中更新OAuth应用的重定向URI：

**重定向URI列表：**
```
https://svtr.ai/api/auth/google
https://svtrai.com/api/auth/google
https://svtr.cn/api/auth/google
https://svtrglobal.com/api/auth/google
http://localhost:3000/api/auth/google
```

### GitHub OAuth 配置  
需要在 [GitHub Developer Settings](https://github.com/settings/developers) 中更新OAuth应用的回调URL：

**回调URL列表：**
```
https://svtr.ai/api/auth/github
https://svtrai.com/api/auth/github
https://svtr.cn/api/auth/github
https://svtrglobal.com/api/auth/github
http://localhost:3000/api/auth/github
```

## 技术实现

### 1. 动态域名检测
```typescript
function getCurrentDomain(request: Request, env: any): string {
  const requestUrl = new URL(request.url);
  const hostname = requestUrl.hostname;
  
  const allowedDomains = [
    'svtr.ai', 'svtrai.com', 'svtr.cn', 
    'svtrglobal.com', 'localhost:3000'
  ];
  
  for (const domain of allowedDomains) {
    if (hostname.includes(domain.split(':')[0])) {
      return requestUrl.protocol + '//' + requestUrl.host;
    }
  }
  
  return env.APP_URL || 'https://svtr.ai';
}
```

### 2. CORS 多域名支持
```typescript
function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  
  const allowedOrigins = [
    'https://svtr.ai', 'https://svtrai.com',
    'https://svtr.cn', 'https://svtrglobal.com',
    'http://localhost:3000'
  ];
  
  const allowedOrigin = allowedOrigins.find(allowed => 
    origin.startsWith(allowed)
  );
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}
```

### 3. 环境变量配置
在 `wrangler.toml` 中配置：

```toml
[vars]
APP_URL = "https://svtr.ai"
ALLOWED_RETURN_TO = "https://svtr.ai,https://svtrai.com,https://svtr.cn,https://svtrglobal.com,http://localhost:3000"
```

## 用户体验

### 统一身份系统
- 用户在任何域名上注册/登录后，可以在所有域名上保持登录状态
- 用户数据和会话在所有域名间共享
- OAuth 回调自动重定向到用户访问的原始域名

### 认证流程
1. 用户在 `svtrai.com` 点击"Google登录"
2. 系统检测当前域名为 `svtrai.com`
3. OAuth 回调URL 设置为 `https://svtrai.com/api/auth/google`
4. 认证成功后重定向回 `https://svtrai.com`

## 部署检查清单

- [ ] 更新Google OAuth重定向URI
- [ ] 更新GitHub OAuth回调URL  
- [ ] 验证Cloudflare Workers环境变量
- [ ] 测试各域名的认证功能
- [ ] 确认CORS策略生效
- [ ] 检查会话共享功能

## 域名解析配置
所有域名都应该指向同一个Cloudflare Pages项目：

```
CNAME记录:
svtr.ai -> chatsvtr.pages.dev
svtrai.com -> chatsvtr.pages.dev  
svtr.cn -> chatsvtr.pages.dev
svtrglobal.com -> chatsvtr.pages.dev
```

## 注意事项

1. **Cookie同源策略**: 不同域名的cookie不会自动共享，需要通过localStorage或sessionStorage管理登录状态
2. **SSL证书**: 确保所有域名都有有效的SSL证书
3. **SEO考虑**: 设置canonical URL避免重复内容问题
4. **监控**: 为各域名设置独立的错误监控和分析

## 故障排除

### OAuth认证失败
1. 检查OAuth应用的回调URL配置
2. 确认域名在CORS允许列表中
3. 查看控制台错误日志

### 跨域请求失败
1. 验证CORS头部设置
2. 检查请求来源域名
3. 确认preflight请求正常

---

配置完成后，用户可以从任何支持的域名访问SVTR平台并享受一致的认证体验。