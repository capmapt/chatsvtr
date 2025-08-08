#!/bin/bash

echo "🧪 测试OpenAI GPT-OSS模型API调用"
echo "================================="

# 测试简单问题 (应使用GPT-OSS-20B)
echo ""
echo "📝 测试1: 简单问题 (预期使用GPT-OSS-20B)"
echo "curl -X POST http://localhost:3000/api/chat..."

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好"}
    ]
  }' \
  --no-buffer \
  -v 2>&1 | head -50

echo ""
echo "================================="

# 测试代码相关问题 (应使用GPT-OSS-120B) 
echo ""
echo "📝 测试2: 代码问题 (预期使用GPT-OSS-120B)"
echo "curl -X POST http://localhost:3000/api/chat..."

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      {"role": "user", "content": "请写一个JavaScript函数来计算斐波那契数列"}
    ]
  }' \
  --no-buffer \
  -v 2>&1 | head -50

echo ""
echo "================================="

# 测试AI创投问题 (应使用GPT-OSS-120B)
echo ""  
echo "📝 测试3: AI创投分析 (预期使用GPT-OSS-120B)"
echo "curl -X POST http://localhost:3000/api/chat..."

curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "messages": [
      {"role": "user", "content": "分析一下Anthropic的投资情况"}
    ]
  }' \
  --no-buffer \
  -v 2>&1 | head -50

echo ""
echo "🎯 测试完成！查看上面的输出了解模型选择和响应情况。"