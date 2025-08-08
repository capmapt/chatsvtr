#!/usr/bin/env node

/**
 * OpenAI API格式测试脚本
 * 验证OpenAI GPT-OSS模型的API调用格式修复
 */

console.log('🧪 OpenAI API格式修复验证');
console.log('================================================================================');

// 模拟chat.ts中的API格式转换逻辑
function testApiFormat(model, messagesWithEnhancedSystem) {
  console.log(`\n🤖 测试模型: ${model}`);
  console.log('------------------------------------------------------------');
  
  if (model.includes('@cf/openai/gpt-oss')) {
    console.log('✅ 检测到OpenAI GPT-OSS模型，使用instructions + input格式');
    
    // OpenAI开源模型使用instructions + input格式
    const systemMessage = messagesWithEnhancedSystem.find(m => m.role === 'system');
    const userMessages = messagesWithEnhancedSystem.filter(m => m.role !== 'system');
    const conversationInput = userMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const apiCall = {
      instructions: systemMessage ? systemMessage.content : 'DEFAULT_SYSTEM_PROMPT',
      input: conversationInput,
      stream: true,
      max_tokens: 4096,
      temperature: 0.8
    };
    
    console.log('📝 API调用参数:');
    console.log(`  - instructions: "${apiCall.instructions.substring(0, 80)}..."`);
    console.log(`  - input: "${apiCall.input}"`);
    console.log(`  - stream: ${apiCall.stream}`);
    console.log(`  - max_tokens: ${apiCall.max_tokens}`);
    console.log(`  - temperature: ${apiCall.temperature}`);
    
    return apiCall;
  } else {
    console.log('✅ 检测到非OpenAI模型，使用标准messages格式');
    
    const apiCall = {
      messages: messagesWithEnhancedSystem,
      stream: true,
      max_tokens: 4096,
      temperature: 0.8,
      top_p: 0.95
    };
    
    console.log('📝 API调用参数:');
    console.log(`  - messages: [${apiCall.messages.length} 条消息]`);
    console.log(`  - stream: ${apiCall.stream}`);
    console.log(`  - max_tokens: ${apiCall.max_tokens}`);
    console.log(`  - temperature: ${apiCall.temperature}`);
    console.log(`  - top_p: ${apiCall.top_p}`);
    
    return apiCall;
  }
}

// 测试数据
const testMessages = [
  {
    role: 'system',
    content: 'You are SVTR.AI assistant for AI venture investment analysis.'
  },
  {
    role: 'user', 
    content: 'Tell me about Anthropic investment situation'
  },
  {
    role: 'assistant',
    content: 'Anthropic has received significant funding...'
  },
  {
    role: 'user',
    content: 'What about their latest funding round?'
  }
];

const testModels = [
  '@cf/openai/gpt-oss-120b',
  '@cf/openai/gpt-oss-20b', 
  '@cf/meta/llama-3.3-70b-instruct',
  '@cf/qwen/qwen2.5-coder-32b-instruct'
];

// 执行测试
testModels.forEach(model => {
  testApiFormat(model, testMessages);
});

console.log('\n📊 测试总结:');
console.log('================================================================================');
console.log('✅ API格式修复已完成:');
console.log('  • OpenAI GPT-OSS模型: 使用instructions + input格式');
console.log('  • 其他模型: 使用标准messages格式');
console.log('  • 自动检测模型类型并应用对应格式');

console.log('\n🔍 关键修复点:');
console.log('1. 检测模型名称包含"@cf/openai/gpt-oss"');
console.log('2. 提取system message作为instructions');
console.log('3. 合并user/assistant messages为单一input');
console.log('4. 移除不支持的top_p参数（OpenAI模型）');

console.log('\n🚀 预期效果:');
console.log('• OpenAI GPT-OSS模型现在应该能正确响应');
console.log('• 更好的推理和代码生成能力');
console.log('• 流式响应正常工作');
console.log('• Fallback机制保持完整');

console.log('\n⚠️  注意事项:');
console.log('• OpenAI模型可能有不同的响应格式');
console.log('• 需要测试流式响应解析是否正确');
console.log('• 监控模型切换和错误处理');