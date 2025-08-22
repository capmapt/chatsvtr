# AWS SES 邮件服务集成指南

## 概述
SVTR已集成AWS SES邮件发送服务，支持验证码邮件和Magic Link邮件的真实发送。

## 🚀 AWS SES 配置步骤

### 1. 创建AWS账号并设置SES
1. 登录 [AWS Console](https://console.aws.amazon.com/)
2. 进入 **Simple Email Service (SES)** 控制台
3. 选择区域 `us-east-1` (弗吉尼亚北部)

### 2. 验证发送域名
```bash
# 需要验证的域名
noreply@svtr.ai
```

**操作步骤:**
1. 点击 **Identities** → **Create identity**
2. 选择 **Domain** 
3. 输入 `svtr.ai`
4. 添加DNS记录到域名注册商:
   - TXT记录用于域名验证
   - CNAME记录用于DKIM签名

### 3. 申请生产访问权限
默认情况下，AWS SES处于沙盒模式，需要申请生产访问：

1. 进入 **Account dashboard**
2. 点击 **Request production access**
3. 填写申请表单:
   - **Mail type**: Transactional
   - **Website URL**: https://svtr.ai
   - **Use case description**: 
     ```
     SVTR (Silicon Valley Tech Review) 是一个AI创投平台，需要发送用户注册验证码邮件和Magic Link登录邮件。
     预计每日发送量: 100-500封邮件
     用途: 用户身份验证和安全登录
     ```

### 4. 创建IAM用户和访问密钥
```bash
# 创建IAM策略 (SES发送权限)
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

**操作步骤:**
1. 进入 **IAM** 控制台
2. 创建新用户 `svtr-ses-sender`
3. 附加上述SES发送策略
4. 生成访问密钥对 (AccessKeyId + SecretAccessKey)

## 🔑 Cloudflare Workers 环境变量配置

### 方法1: 使用wrangler命令行
```bash
# 设置AWS SES密钥
wrangler pages secret put AWS_ACCESS_KEY_ID
# 输入你的Access Key ID

wrangler pages secret put AWS_SECRET_ACCESS_KEY  
# 输入你的Secret Access Key

# 验证配置
wrangler pages secret list
```

### 方法2: Cloudflare Dashboard
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **chatsvtr**
3. **Settings** → **Environment variables**
4. 添加生产环境变量:
   - `AWS_ACCESS_KEY_ID`: 你的Access Key
   - `AWS_SECRET_ACCESS_KEY`: 你的Secret Key

## 📧 邮件模板功能

### 支持的邮件类型
1. **验证码邮件** - 6位数字验证码
2. **Magic Link邮件** - 一键登录链接

### 多语言支持
- 🇨🇳 中文 (`zh-CN`)
- 🇺🇸 英文 (`en`)

### 邮件模板特色
- 🎨 响应式HTML设计
- 🔒 安全提醒和注意事项
- 🏢 SVTR品牌设计风格
- 📱 移动设备友好
- 🔗 纯文本备份版本

## 🧪 测试验证

### 本地开发测试
```bash
# 启动开发服务器
npm run dev

# 测试验证码发送
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"send_code","email":"test@example.com","language":"zh-CN"}'

# 测试Magic Link发送  
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"send_magic_link","email":"test@example.com","language":"en"}'
```

### 生产环境测试
```bash
# 测试验证码发送
curl -X POST https://svtr.ai/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"send_code","email":"your-email@domain.com"}'
```

## 📊 监控和日志

### Cloudflare Workers 日志
```bash
# 实时查看日志
wrangler pages deployment tail --project-name=chatsvtr
```

### AWS SES 发送统计
1. 进入 **SES Console** → **Reputation tracking**
2. 查看发送量、退信率、投诉率

## 🔧 故障排除

### 常见错误及解决方案

**1. 405 Method Not Allowed**
- 检查Functions文件是否正确部署
- 验证_routes.json配置

**2. AWS SES Authentication Failed**  
- 确认Access Key和Secret Key正确
- 检查IAM用户权限

**3. Email Not Delivered**
- 确认域名验证状态
- 检查是否还在沙盒模式
- 查看AWS SES发送日志

**4. CORS错误**
- 确认Origin头部正确设置
- 检查多域名CORS配置

## 💰 成本估算

### AWS SES 定价 (us-east-1)
- 前62,000封邮件/月: **免费**
- 超出部分: $0.10/1000封邮件
- 附件发送: $0.12/GB

### 月度成本预估
```
预计发送量: 2,000封/月
成本: $0 (免费额度内)

预计发送量: 100,000封/月  
成本: $3.80/月
```

## 🚀 部署检查清单

- [ ] AWS SES 域名验证完成
- [ ] 生产访问权限获得批准  
- [ ] IAM用户和密钥创建
- [ ] Cloudflare环境变量配置
- [ ] 本地开发环境测试通过
- [ ] 生产环境邮件发送测试
- [ ] 多语言邮件模板验证
- [ ] 错误处理和日志监控设置

## 📞 支持联系

如果在配置过程中遇到问题:
1. 查看Cloudflare Workers日志
2. 检查AWS SES发送统计
3. 参考本文档故障排除章节
4. 联系SVTR技术支持

---

配置完成后，SVTR平台将支持真实邮件发送，为用户提供可靠的身份验证服务。