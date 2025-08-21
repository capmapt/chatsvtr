#!/bin/bash

echo "🧪 SVTR认证服务 - 真实邮件发送测试"
echo "================================"
echo ""

AUTH_URL="https://svtr-auth.liumin-gsm.workers.dev"

echo "📧 测试不同邮箱地址的发送情况："
echo ""

# 测试AWS SES Mailbox Simulator (应该成功)
echo "1️⃣ 测试AWS SES Mailbox Simulator"
curl -s -X POST "$AUTH_URL/auth/email/send" \
  -H "Content-Type: application/json" \
  -d '{"email":"success@simulator.amazonses.com","language":"zh-CN"}' \
  | head -100
echo ""
echo ""

# 测试其他邮箱
echo "2️⃣ 测试您的邮箱地址"
echo "请输入您要测试的邮箱地址："
read -r TEST_EMAIL

if [ ! -z "$TEST_EMAIL" ]; then
    echo "正在发送验证码到: $TEST_EMAIL"
    RESPONSE=$(curl -s -X POST "$AUTH_URL/auth/email/send" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$TEST_EMAIL\",\"language\":\"zh-CN\"}")
    
    echo "响应: $RESPONSE"
    echo ""
    
    # 检查是否成功
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ 邮件发送成功！请检查您的邮箱。"
        
        # 提取OTP（如果在测试模式）
        OTP=$(echo "$RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$OTP" ]; then
            echo "🔢 验证码: $OTP"
            echo ""
            echo "是否要验证OTP？(y/n)"
            read -r VERIFY_CHOICE
            
            if [ "$VERIFY_CHOICE" = "y" ]; then
                echo "正在验证OTP..."
                VERIFY_RESPONSE=$(curl -s -X POST "$AUTH_URL/auth/email/verify" \
                  -H "Content-Type: application/json" \
                  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$OTP\"}")
                
                echo "验证响应: $VERIFY_RESPONSE"
            fi
        fi
    else
        echo "❌ 邮件发送失败"
        echo "可能原因："
        echo "- AWS SES仍在沙盒模式，需要验证目标邮箱"
        echo "- 域名 svtr.ai 验证未完成"
        echo "- AWS SES配置问题"
        echo ""
        echo "💡 建议："
        echo "1. 确认 AWS SES 已申请生产访问权限"
        echo "2. 验证 svtr.ai 域名在AWS SES中的状态"
        echo "3. 检查 no-reply@svtr.ai 邮箱验证状态"
    fi
fi

echo ""
echo "🔗 AWS SES 控制台: https://console.aws.amazon.com/ses/"
echo "📊 查看发送统计和验证状态"