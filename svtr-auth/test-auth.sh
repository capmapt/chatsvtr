#!/bin/bash

# SVTR 认证服务测试脚本
# 使用AWS SES Mailbox Simulator进行测试

AUTH_URL="https://svtr-auth.liumin-gsm.workers.dev"
TEST_EMAIL="success@simulator.amazonses.com"

echo "🚀 SVTR认证服务测试开始..."
echo "📧 使用测试邮箱: $TEST_EMAIL"
echo "🔗 服务地址: $AUTH_URL"
echo ""

# 1. 健康检查
echo "1️⃣ 健康检查"
curl -s "$AUTH_URL/" | head -1
echo ""

# 2. 发送OTP验证码
echo "2️⃣ 发送OTP验证码"
OTP_RESPONSE=$(curl -s -X POST "$AUTH_URL/auth/email/send" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"language\":\"zh-CN\"}")

echo "响应: $OTP_RESPONSE"

# 提取OTP (测试模式下返回)
OTP=$(echo "$OTP_RESPONSE" | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)
echo "提取的OTP: $OTP"
echo ""

# 3. 验证OTP
if [ ! -z "$OTP" ]; then
  echo "3️⃣ 验证OTP"
  VERIFY_RESPONSE=$(curl -s -X POST "$AUTH_URL/auth/email/verify" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$OTP\"}")
  
  echo "验证响应: $VERIFY_RESPONSE"
  
  # 提取会话token
  TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "会话Token: $TOKEN"
  echo ""
  
  # 4. 验证会话
  if [ ! -z "$TOKEN" ]; then
    echo "4️⃣ 验证会话"
    SESSION_RESPONSE=$(curl -s "$AUTH_URL/auth/session?token=$TOKEN")
    echo "会话响应: $SESSION_RESPONSE"
    echo ""
  fi
fi

# 5. 发送Magic Link
echo "5️⃣ 发送Magic Link"
MAGIC_RESPONSE=$(curl -s -X POST "$AUTH_URL/auth/magic/send" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"language\":\"zh-CN\",\"returnTo\":\"https://svtr.ai\"}")

echo "Magic Link响应: $MAGIC_RESPONSE"

# 提取Magic Link (测试模式下返回)
MAGIC_LINK=$(echo "$MAGIC_RESPONSE" | grep -o '"magicLink":"[^"]*"' | cut -d'"' -f4)
echo "Magic Link: $MAGIC_LINK"
echo ""

# 6. 测试Magic Link
if [ ! -z "$MAGIC_LINK" ]; then
  echo "6️⃣ 测试Magic Link"
  MAGIC_LOGIN_RESPONSE=$(curl -s "$MAGIC_LINK")
  echo "Magic Link登录响应: $MAGIC_LOGIN_RESPONSE"
  echo ""
fi

echo "✅ 测试完成！"