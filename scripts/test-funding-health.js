#!/usr/bin/env node

/**
 * 融资日报健康检查测试脚本
 * 用于定期监控和诊断问题
 */

const https = require('https');

// 配置
const CONFIG = {
  PROD_URL: 'https://svtr.ai/api/wiki-funding-health',
  DEV_URL: 'http://localhost:3000/api/wiki-funding-health',
  TIMEOUT: 30000, // 30秒超时
};

/**
 * 发起HTTP请求
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : require('http');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SVTR-Health-Check/1.0'
      },
      timeout: CONFIG.TIMEOUT
    };

    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          reject(new Error(`JSON解析失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.end();
  });
}

/**
 * 格式化检查结果
 */
function formatResult(result) {
  const statusEmoji = {
    'healthy': '✅',
    'degraded': '⚠️',
    'down': '❌'
  };

  const checkEmoji = {
    'ok': '✅',
    'error': '❌',
    'pending': '⏳',
    'skipped': '⏭️',
    'unavailable': '⚪'
  };

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${statusEmoji[result.status] || '❓'} 总体状态: ${result.status.toUpperCase()}`);
  console.log(`⏰ 检查时间: ${new Date(result.timestamp).toLocaleString('zh-CN')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 详细检查:\n');

  // 飞书认证
  const authCheck = result.checks.feishuAuth;
  console.log(`  ${checkEmoji[authCheck.status]} 飞书认证`);
  if (authCheck.latency) {
    console.log(`     延迟: ${authCheck.latency}ms`);
  }
  if (authCheck.error) {
    console.log(`     错误: ${authCheck.error}`);
  }

  // 数据获取
  const dataCheck = result.checks.dataFetch;
  console.log(`\n  ${checkEmoji[dataCheck.status]} 数据获取`);
  if (dataCheck.recordCount !== undefined) {
    console.log(`     记录数: ${dataCheck.recordCount}条`);
  }
  if (dataCheck.latency) {
    console.log(`     延迟: ${dataCheck.latency}ms`);
  }
  if (dataCheck.error) {
    console.log(`     错误: ${dataCheck.error}`);
  }

  // 缓存状态
  const cacheCheck = result.checks.cacheStatus;
  console.log(`\n  ${checkEmoji[cacheCheck.status]} 缓存状态`);
  if (cacheCheck.hasCache !== undefined) {
    console.log(`     缓存: ${cacheCheck.hasCache ? '有效' : '无'}`);
  }
  if (cacheCheck.error) {
    console.log(`     错误: ${cacheCheck.error}`);
  }

  // 建议
  if (result.recommendations && result.recommendations.length > 0) {
    console.log('\n💡 建议:');
    result.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const env = args[0] || 'dev';
  const url = env === 'prod' ? CONFIG.PROD_URL : CONFIG.DEV_URL;

  console.log(`\n🔍 正在检查${env === 'prod' ? '生产环境' : '开发环境'}健康状态...`);
  console.log(`🌐 URL: ${url}\n`);

  try {
    const response = await makeRequest(url);

    if (response.status === 200 || response.status === 503) {
      formatResult(response.data);

      // 退出码
      if (response.data.status === 'down') {
        process.exit(1);
      } else if (response.data.status === 'degraded') {
        process.exit(2);
      } else {
        process.exit(0);
      }
    } else {
      console.error(`❌ HTTP错误: ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ 健康检查失败: ${error.message}`);
    process.exit(1);
  }
}

main();