#!/usr/bin/env node

/**
 * 直接测试Cloudflare Workers AI模型可用性
 */

console.log('🧪 测试Cloudflare Workers AI模型可用性');
console.log('=====================================');

// 模拟Workers AI环境（这个脚本无法直接调用，但可以生成测试代码）
const testModels = [
  '@cf/openai/gpt-oss-120b',
  '@cf/openai/gpt-oss-20b',
  '@cf/meta/llama-3.3-70b-instruct',
  '@cf/qwen/qwen2.5-coder-32b-instruct',
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'
];

console.log('📋 当前配置的模型列表:');
testModels.forEach((model, index) => {
  console.log(`${index + 1}. ${model}`);
});

console.log('\n🔍 检查建议:');
console.log('1. 在Wrangler开发服务器终端查找错误信息');
console.log('2. 查看是否有模型调用失败的日志');
console.log('3. 检查API调用格式是否正确');

console.log('\n🛠️ 调试步骤:');
console.log('1. 在浏览器开发者工具的Network标签中查看/api/chat请求');
console.log('2. 查看请求是否成功发送');
console.log('3. 查看响应状态码和错误信息');

console.log('\n💡 可能的问题:');
console.log('- OpenAI模型可能在某些区域不可用');
console.log('- API调用格式需要调整');  
console.log('- 需要特殊权限或配置');
console.log('- 模型ID可能不正确');

console.log('\n🔄 建议的fallback策略:');
console.log('如果OpenAI模型不可用，应该自动降级到:');
console.log('1. @cf/meta/llama-3.3-70b-instruct');
console.log('2. @cf/qwen/qwen2.5-coder-32b-instruct');
console.log('3. @cf/qwen/qwen1.5-14b-chat-awq');