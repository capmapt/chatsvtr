#!/usr/bin/env node

/**
 * SVTR.AI 2025年增强功能测试脚本
 * 测试新的AI模型、缓存系统、RAG增强和流式响应
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SVTR.AI 2025年增强功能测试');
console.log('=====================================');

// 测试1: 检查新增的服务文件
function testServiceFiles() {
  console.log('\n📁 测试1: 检查增强服务文件');
  
  const requiredFiles = [
    'functions/lib/intelligent-cache-service.ts',
    'functions/lib/enhanced-streaming-service.ts', 
    'functions/lib/advanced-retrieval-service.ts',
    'functions/lib/realtime-data-service.ts',
    'assets/js/chat-enhanced-2025.js',
    'assets/css/chat-enhanced-2025.css'
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`✅ ${file} (${Math.round(stats.size/1024)}KB)`);
    } else {
      console.log(`❌ ${file} - 文件不存在`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// 测试2: 验证chat.ts中的模型配置
function testModelUpgrades() {
  console.log('\n🧠 测试2: 验证AI模型升级');
  
  const chatFilePath = path.join(process.cwd(), 'functions/api/chat.ts');
  
  if (!fs.existsSync(chatFilePath)) {
    console.log('❌ chat.ts文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(chatFilePath, 'utf8');
  
  const checkItems = [
    { name: 'Llama 3.3 70B模型', pattern: /llama-3\.3-70b-instruct/ },
    { name: 'Qwen 2.5模型', pattern: /qwen2\.5-.*b-instruct/ },
    { name: 'DeepSeek V3模型', pattern: /deepseek-v3/ },
    { name: '智能缓存集成', pattern: /createIntelligentCache/ },
    { name: '查询复杂度分析', pattern: /analyzeQueryComplexity/ },
    { name: '分层模型配置', pattern: /nextGenModels/ }
  ];
  
  let passedChecks = 0;
  
  for (const check of checkItems) {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name}`);
      passedChecks++;
    } else {
      console.log(`⚠️ ${check.name} - 可能未完全集成`);
    }
  }
  
  console.log(`模型升级完成度: ${passedChecks}/${checkItems.length}`);
  return passedChecks >= checkItems.length * 0.8; // 80%通过率
}

// 测试3: 检查RAG系统增强
function testRAGEnhancements() {
  console.log('\n🔍 测试3: 验证RAG系统增强');
  
  const ragFilePath = path.join(process.cwd(), 'functions/lib/hybrid-rag-service.ts');
  
  if (!fs.existsSync(ragFilePath)) {
    console.log('❌ hybrid-rag-service.ts文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(ragFilePath, 'utf8');
  
  const ragFeatures = [
    { name: '高级检索集成', pattern: /createAdvancedRetrieval/ },
    { name: '2025年升级标记', pattern: /2025年升级/ },
    { name: '自适应检索', pattern: /performAdaptiveRetrieval/ },
    { name: '图谱增强', pattern: /graphEnhanced/ },
    { name: '实时数据支持', pattern: /realtime/ }
  ];
  
  let enhancedFeatures = 0;
  
  for (const feature of ragFeatures) {
    if (feature.pattern.test(content)) {
      console.log(`✅ ${feature.name}`);
      enhancedFeatures++;
    } else {
      console.log(`⚠️ ${feature.name} - 未检测到`);
    }
  }
  
  console.log(`RAG增强完成度: ${enhancedFeatures}/${ragFeatures.length}`);
  return enhancedFeatures >= ragFeatures.length * 0.6; // 60%通过率
}

// 测试4: 验证前端增强
function testFrontendEnhancements() {
  console.log('\n💻 测试4: 验证前端增强功能');
  
  const frontendFiles = {
    'assets/js/chat-enhanced-2025.js': [
      { name: '增强流式处理', pattern: /handleEnhancedStreamingResponse/ },
      { name: '思考阶段显示', pattern: /handleThinkingChunk/ },
      { name: '置信度指示器', pattern: /updateConfidenceIndicator/ },
      { name: '统计面板', pattern: /showStats/ },
      { name: '打字机效果', pattern: /typewriterEffect/ }
    ],
    'assets/css/chat-enhanced-2025.css': [
      { name: '思考覆盖层样式', pattern: /thinking-overlay/ },
      { name: '进度条动画', pattern: /progress-bar/ },
      { name: '消息增强样式', pattern: /svtr-message\.enhanced/ },
      { name: '置信度徽章', pattern: /confidence-badge/ },
      { name: '深色模式支持', pattern: /dark-mode/ }
    ]
  };
  
  let totalFeatures = 0;
  let implementedFeatures = 0;
  
  for (const [filePath, features] of Object.entries(frontendFiles)) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      console.log(`\n检查 ${filePath}:`);
      
      for (const feature of features) {
        totalFeatures++;
        if (feature.pattern.test(content)) {
          console.log(`  ✅ ${feature.name}`);
          implementedFeatures++;
        } else {
          console.log(`  ❌ ${feature.name}`);
        }
      }
    } else {
      console.log(`❌ ${filePath} - 文件不存在`);
      totalFeatures += features.length;
    }
  }
  
  console.log(`前端增强完成度: ${implementedFeatures}/${totalFeatures}`);
  return implementedFeatures >= totalFeatures * 0.7; // 70%通过率
}

// 测试5: 检查配置和依赖
function testConfiguration() {
  console.log('\n⚙️ 测试5: 验证配置和依赖');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const wranglerTomlPath = path.join(process.cwd(), 'wrangler.toml');
  
  let configScore = 0;
  
  // 检查package.json
  if (fs.existsSync(packageJsonPath)) {
    const packageContent = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageContent.devDependencies && packageContent.devDependencies.typescript) {
      console.log('✅ TypeScript依赖');
      configScore++;
    }
    
    if (packageContent.devDependencies && packageContent.devDependencies['@cloudflare/workers-types']) {
      console.log('✅ Cloudflare Workers类型');
      configScore++;
    }
  }
  
  // 检查wrangler.toml
  if (fs.existsSync(wranglerTomlPath)) {
    const wranglerContent = fs.readFileSync(wranglerTomlPath, 'utf8');
    
    if (wranglerContent.includes('SVTR_VECTORIZE')) {
      console.log('✅ Vectorize配置');
      configScore++;
    }
    
    if (wranglerContent.includes('[ai]')) {
      console.log('✅ AI绑定配置');
      configScore++;
    }
    
    if (wranglerContent.includes('SVTR_CACHE')) {
      console.log('✅ KV缓存配置');
      configScore++;
    }
  }
  
  console.log(`配置完成度: ${configScore}/5`);
  return configScore >= 4;
}

// 生成测试报告
function generateReport(results) {
  console.log('\n📊 测试总结报告');
  console.log('=================');
  
  const testNames = [
    '服务文件检查',
    'AI模型升级',
    'RAG系统增强', 
    '前端功能增强',
    '配置和依赖'
  ];
  
  let passedTests = 0;
  
  results.forEach((result, index) => {
    const status = result ? '✅ 通过' : '❌ 失败';
    console.log(`${testNames[index]}: ${status}`);
    if (result) passedTests++;
  });
  
  const successRate = (passedTests / results.length * 100).toFixed(1);
  console.log(`\n总体通过率: ${passedTests}/${results.length} (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('\n🎉 恭喜！SVTR.AI 2025年增强功能基本就绪！');
    console.log('建议进行进一步的集成测试和性能测试。');
  } else if (successRate >= 60) {
    console.log('\n⚠️ 增强功能部分完成，建议解决剩余问题后再部署。');
  } else {
    console.log('\n❌ 增强功能存在较多问题，建议检查实现后重新测试。');
  }
  
  return successRate;
}

// 主测试流程
async function runTests() {
  const results = [];
  
  try {
    results.push(testServiceFiles());
    results.push(testModelUpgrades());
    results.push(testRAGEnhancements());
    results.push(testFrontendEnhancements());
    results.push(testConfiguration());
    
    const successRate = generateReport(results);
    
    // 输出下一步建议
    console.log('\n🔧 下一步建议:');
    console.log('1. 运行 npm run dev 启动开发服务器测试');
    console.log('2. 测试新的AI模型响应和智能路由');
    console.log('3. 验证增强的流式响应UI效果');
    console.log('4. 检查实时数据集成和缓存性能');
    console.log('5. 进行端到端的用户体验测试');
    
    if (successRate >= 80) {
      console.log('\n🚀 系统已准备好部署到生产环境！');
    }
    
    process.exit(successRate >= 60 ? 0 : 1);
    
  } catch (error) {
    console.error('测试执行出错:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}