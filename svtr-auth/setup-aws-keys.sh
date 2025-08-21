#!/bin/bash

echo "🔐 SVTR认证服务 - AWS SES密钥配置"
echo "=================================="
echo ""

echo "📋 设置说明："
echo "1. 您需要有AWS账户和SES服务访问权限"
echo "2. 域名 svtr.ai 需要在AWS SES中已验证"
echo "3. 建议申请SES生产访问权限（脱离沙盒模式）"
echo ""

echo "🔑 开始设置AWS密钥..."
echo ""

# 设置AWS Access Key ID
echo "1️⃣ 设置 AWS_ACCESS_KEY_ID"
echo "请输入您的AWS Access Key ID："
read -r AWS_ACCESS_KEY_ID

if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS Access Key ID不能为空"
    exit 1
fi

echo "正在设置AWS_ACCESS_KEY_ID..."
echo "$AWS_ACCESS_KEY_ID" | npx wrangler secret put AWS_ACCESS_KEY_ID --name svtr-auth

echo ""

# 设置AWS Secret Access Key
echo "2️⃣ 设置 AWS_SECRET_ACCESS_KEY"
echo "请输入您的AWS Secret Access Key："
read -s AWS_SECRET_ACCESS_KEY

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS Secret Access Key不能为空"
    exit 1
fi

echo "正在设置AWS_SECRET_ACCESS_KEY..."
echo "$AWS_SECRET_ACCESS_KEY" | npx wrangler secret put AWS_SECRET_ACCESS_KEY --name svtr-auth

echo ""

# 验证设置
echo "3️⃣ 验证密钥设置"
SECRETS=$(npx wrangler secret list --name svtr-auth)
echo "已设置的密钥："
echo "$SECRETS"

echo ""

# 重新部署
echo "4️⃣ 重新部署服务"
echo "正在重新部署svtr-auth服务..."
npx wrangler deploy --name svtr-auth

echo ""
echo "✅ 配置完成！"
echo ""
echo "🧪 测试真实邮件发送："
echo "curl -X POST https://svtr-auth.liumin-gsm.workers.dev/auth/email/send \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"your-email@domain.com\",\"language\":\"zh-CN\"}'"
echo ""
echo "📧 请使用您的真实邮箱地址进行测试"
echo "注意：如果SES仍在沙盒模式，只能发送到已验证的邮箱地址"