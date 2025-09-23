#!/usr/bin/env node
/**
 * 部署完整性验证脚本
 * 确保生产环境与本地开发环境文件版本一致
 */

const fs = require('fs');
const crypto = require('crypto');
const https = require('https');

// 关键文件列表
const CRITICAL_FILES = [
  'assets/js/funding-daily.js',
  'assets/css/funding-cards.css',
  'index.html'
];

// 生产环境URL
const PRODUCTION_URL = 'https://c1e7b62c.chatsvtr.pages.dev';

/**
 * 计算文件MD5哈希值
 */
function getFileHash(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  文件不存在: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * 获取生产环境文件内容
 */
function fetchProductionFile(filePath) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}/${filePath}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const hash = crypto.createHash('md5').update(data).digest('hex');
          resolve(hash);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * 验证部署完整性
 */
async function verifyDeployment() {
  console.log('🔍 开始验证部署完整性...\n');

  let allMatch = true;
  const results = [];

  for (const file of CRITICAL_FILES) {
    try {
      console.log(`📁 检查文件: ${file}`);

      // 获取本地文件哈希
      const localHash = getFileHash(file);
      if (!localHash) {
        results.push({ file, status: '❌ 本地文件缺失', localHash: null, prodHash: null });
        allMatch = false;
        continue;
      }

      // 获取生产环境文件哈希
      const prodHash = await fetchProductionFile(file);

      // 比较哈希值
      const match = localHash === prodHash;
      allMatch = allMatch && match;

      results.push({
        file,
        status: match ? '✅ 匹配' : '❌ 不匹配',
        localHash: localHash.substring(0, 8),
        prodHash: prodHash.substring(0, 8)
      });

      console.log(`   本地: ${localHash.substring(0, 8)}`);
      console.log(`   生产: ${prodHash.substring(0, 8)}`);
      console.log(`   状态: ${match ? '✅ 匹配' : '❌ 不匹配'}\n`);

    } catch (error) {
      console.error(`❌ 检查 ${file} 时出错:`, error.message);
      results.push({ file, status: '❌ 检查失败', error: error.message });
      allMatch = false;
    }
  }

  // 输出总结报告
  console.log('📋 部署完整性验证报告');
  console.log('='.repeat(50));

  results.forEach(result => {
    console.log(`${result.file}: ${result.status}`);
    if (result.localHash && result.prodHash) {
      console.log(`  本地哈希: ${result.localHash} | 生产哈希: ${result.prodHash}`);
    }
  });

  console.log('='.repeat(50));

  if (allMatch) {
    console.log('🎉 所有文件版本一致，部署完整性验证通过！');
    return true;
  } else {
    console.log('⚠️  发现文件版本不一致，建议重新部署！');
    console.log('\n🔧 修复建议:');
    console.log('1. 运行: npm run deploy:cloudflare');
    console.log('2. 或者: wrangler pages deploy --commit-dirty=true');
    console.log('3. 等待2-3分钟后重新验证');
    return false;
  }
}

/**
 * 检查关键功能标识
 */
async function checkFeatureMarkers() {
  console.log('\n🔍 检查关键功能标识...');

  try {
    const prodContent = await new Promise((resolve, reject) => {
      https.get(`${PRODUCTION_URL}/assets/css/funding-cards.css`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    // 检查关键CSS特征
    const features = [
      { name: '3D卡片翻转', marker: 'transform: rotateY(180deg)', present: prodContent.includes('transform: rotateY(180deg)') },
      { name: '卡片高度360px', marker: 'height: 360px', present: prodContent.includes('height: 360px') },
      { name: '翻转动画', marker: 'transition: transform 0.6s', present: prodContent.includes('transition: transform 0.6s') }
    ];

    features.forEach(feature => {
      console.log(`${feature.present ? '✅' : '❌'} ${feature.name}: ${feature.present ? '存在' : '缺失'}`);
    });

    return features.every(f => f.present);

  } catch (error) {
    console.error('❌ 功能标识检查失败:', error.message);
    return false;
  }
}

// 主执行函数
async function main() {
  console.log('🚀 AI创投日报部署完整性验证');
  console.log('=' * 60);

  try {
    const integrityCheck = await verifyDeployment();
    const featureCheck = await checkFeatureMarkers();

    if (integrityCheck && featureCheck) {
      console.log('\n🎉 部署验证完全通过！');
      process.exit(0);
    } else {
      console.log('\n⚠️  部署验证发现问题，需要处理！');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 验证过程出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  verifyDeployment,
  checkFeatureMarkers,
  getFileHash
};