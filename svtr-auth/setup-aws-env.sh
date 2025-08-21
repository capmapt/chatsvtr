#!/bin/bash

echo "🔐 SVTR认证服务 - AWS SES密钥配置 (环境变量方式)"
echo "================================================"
echo ""

echo "📋 使用方法："
echo "AWS_ACCESS_KEY_ID='your_key_id' AWS_SECRET_ACCESS_KEY='your_secret_key' ./setup-aws-env.sh"
echo ""

# 检查环境变量
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ 请设置 AWS_ACCESS_KEY_ID 环境变量"
    echo "示例: AWS_ACCESS_KEY_ID='AKIA...' AWS_SECRET_ACCESS_KEY='...' ./setup-aws-env.sh"
    exit 1
fi

if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ 请设置 AWS_SECRET_ACCESS_KEY 环境变量"
    echo "示例: AWS_ACCESS_KEY_ID='AKIA...' AWS_SECRET_ACCESS_KEY='...' ./setup-aws-env.sh"
    exit 1
fi

echo "✅ 检测到AWS密钥环境变量"
echo "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID:0:8}..."
echo "AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY:0:8}..."
echo ""

# 设置密钥到Cloudflare Workers
echo "1️⃣ 设置 AWS_ACCESS_KEY_ID..."
echo "$AWS_ACCESS_KEY_ID" | npx wrangler secret put AWS_ACCESS_KEY_ID --name svtr-auth

echo ""
echo "2️⃣ 设置 AWS_SECRET_ACCESS_KEY..."
echo "$AWS_SECRET_ACCESS_KEY" | npx wrangler secret put AWS_SECRET_ACCESS_KEY --name svtr-auth

echo ""
echo "3️⃣ 验证密钥设置..."
npx wrangler secret list --name svtr-auth

echo ""
echo "4️⃣ 重新部署服务..."
npx wrangler deploy --name svtr-auth

echo ""
echo "✅ AWS SES密钥配置完成！"
echo ""
echo "🧪 测试真实邮件发送："
echo "curl -X POST https://svtr-auth.liumin-gsm.workers.dev/auth/email/send \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"your-email@domain.com\",\"language\":\"zh-CN\"}'"
echo ""
echo "📧 请使用您的真实邮箱地址进行测试"
echo "⚠️  注意：如果SES在沙盒模式，只能发送到已验证的邮箱地址"