// 调试环境检测逻辑
console.log('🔍 调试环境检测逻辑');
console.log('========================');

// 当前压缩后的逻辑（从chat-optimized.js提取）
function currentLogic(hostname, port) {
  const e = hostname === 'localhost' && port === '3000';
  const result = hostname !== 'localhost' && hostname !== '127.0.0.1' || e;
  return result;
}

// 测试各种情况
const testCases = [
  { hostname: 'localhost', port: '3000', expected: true, description: 'Wrangler开发环境' },
  { hostname: 'localhost', port: '8080', expected: false, description: '其他localhost端口' },
  { hostname: '127.0.0.1', port: '3000', expected: false, description: '127.0.0.1:3000' },
  { hostname: 'svtr.ai', port: '443', expected: true, description: '真正生产环境' }
];

console.log('测试结果:');
testCases.forEach(test => {
  const result = currentLogic(test.hostname, test.port);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.description}: ${test.hostname}:${test.port} -> ${result} (期望: ${test.expected})`);
});

console.log('\n🔧 修复建议:');
console.log('当前逻辑有问题！需要修复为:');
console.log('return isProduction || isWranglerDev;');

// 正确的逻辑
function correctLogic(hostname, port) {
  const isWranglerDev = hostname === 'localhost' && port === '3000';
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
  return isProduction || isWranglerDev;
}

console.log('\n修复后测试结果:');
testCases.forEach(test => {
  const result = correctLogic(test.hostname, test.port);
  const status = result === test.expected ? '✅' : '❌';
  console.log(`${status} ${test.description}: ${test.hostname}:${test.port} -> ${result} (期望: ${test.expected})`);
});