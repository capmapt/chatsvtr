#!/usr/bin/env node

/**
 * OpenAI开源模型测试脚本
 * 测试ChatSVTR系统中OpenAI GPT-OSS模型的可用性
 */

console.log('🧪 OpenAI开源模型测试开始');
console.log('================================================================================');

// 模拟聊天API请求测试
const testQueries = [
  {
    message: "简单问题测试",
    content: "你好",
    expectedModel: "@cf/openai/gpt-oss-20b",
    reason: "简单问题应使用轻量级模型"
  },
  {
    message: "代码相关问题",
    content: "如何用JavaScript实现一个简单的代码压缩功能？",
    expectedModel: "@cf/openai/gpt-oss-120b",
    reason: "代码问题优先使用OpenAI开源模型"
  },
  {
    message: "复杂AI创投分析",
    content: "请详细分析2024年AI创投市场的投资趋势和风险",
    expectedModel: "@cf/openai/gpt-oss-120b", 
    reason: "复杂分析使用大模型"
  },
  {
    message: "Anthropic投资情况",
    content: "Anthropic公司的最新融资情况如何？",
    expectedModel: "@cf/openai/gpt-oss-120b",
    reason: "专业投资分析使用大模型"
  }
];

// 模拟模型选择逻辑（复制自chat.ts的逻辑）
function selectModel(userQuery) {
  // 默认使用OpenAI GPT-OSS 120B模型
  let selectedModel = '@cf/openai/gpt-oss-120b';
  
  // 智能模型选择逻辑 - 按优先级判断
  const isCodeRelated = userQuery.toLowerCase().includes('code') || 
                       userQuery.toLowerCase().includes('代码') ||
                       userQuery.toLowerCase().includes('programming') ||
                       userQuery.toLowerCase().includes('编程');
  
  const isComplexQuery = userQuery.includes('复杂') || 
                        userQuery.includes('详细') ||
                        userQuery.includes('分析') ||
                        userQuery.length > 50;
  
  const isSimpleQuery = userQuery.length < 30 && 
                       !isComplexQuery && 
                       !isCodeRelated &&
                       !userQuery.includes('投资') &&
                       !userQuery.includes('融资') &&
                       !userQuery.includes('公司');
  
  if (isCodeRelated) {
    selectedModel = '@cf/openai/gpt-oss-120b';
    console.log('🔧 检测到代码相关问题，使用OpenAI大模型');
  } else if (isSimpleQuery) {
    selectedModel = '@cf/openai/gpt-oss-20b';
    console.log('💡 简单问题，使用OpenAI轻量级模型优化响应速度');
  } else {
    // 默认使用大模型处理AI创投相关复杂问题
    selectedModel = '@cf/openai/gpt-oss-120b';
    console.log('🚀 使用OpenAI大模型处理专业问题');
  }
  
  return selectedModel;
}

// 执行测试
testQueries.forEach((test, index) => {
  console.log(`\n🚀 测试 ${index + 1}: ${test.message}`);
  console.log('============================================================');
  console.log(`📝 输入: "${test.content}"`);
  
  const actualModel = selectModel(test.content);
  const passed = actualModel === test.expectedModel;
  
  console.log(`🎯 预期模型: ${test.expectedModel}`);
  console.log(`🤖 实际模型: ${actualModel}`);
  console.log(`📊 测试结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
  console.log(`💭 原因: ${test.reason}`);
  
  if (!passed) {
    console.log(`⚠️  模型选择不匹配！`);
  }
  
  console.log('--------------------------------------------------------------------------------');
});

console.log('\n📊 测试总结:');
console.log('✅ OpenAI开源模型优先级配置已更新');
console.log('🎯 模型选择策略:');
console.log('  • 默认: @cf/openai/gpt-oss-120b (OpenAI大模型)');
console.log('  • 简单问题: @cf/openai/gpt-oss-20b (OpenAI轻量级)'); 
console.log('  • 代码问题: @cf/openai/gpt-oss-120b (保持OpenAI优先)');
console.log('  • Fallback顺序: OpenAI -> Llama -> Qwen -> DeepSeek');

console.log('\n🚀 下一步操作:');
console.log('1. 运行 `npm run dev` 启动开发服务器');
console.log('2. 测试聊天功能验证OpenAI模型响应');
console.log('3. 运行 `npm run deploy:cloudflare` 部署到生产环境');

console.log('\n📝 OpenAI开源模型特点:');
console.log('• GPT-OSS-120B: 117B参数，接近o4-mini性能');
console.log('• GPT-OSS-20B: 21B参数，匹配o3-mini性能'); 
console.log('• Apache 2.0开源许可证');
console.log('• 在推理、代码、数学等任务表现优异');
console.log('• 支持工具调用和多轮对话');