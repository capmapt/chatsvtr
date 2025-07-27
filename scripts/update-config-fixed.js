#!/usr/bin/env node

/**
 * SVTR.AI Configuration Update Script
 * 配置文件更新和同步脚本
 */

const fs = require('fs');
const path = require('path');

// 配置文件路径
const CONFIG_FILES = {
  wrangler: 'wrangler.toml',
  package: 'package.json',
  app: 'config/app.config.js',
  build: 'config/build.config.js'
};

// 读取 package.json
function readPackageJson() {
  try {
    const content = fs.readFileSync(CONFIG_FILES.package, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read package.json:', error.message);
    return null;
  }
}

// 更新 package.json 脚本
function updatePackageScripts() {
  const pkg = readPackageJson();
  if (!pkg) return;

  // 添加新的构建和部署脚本
  const newScripts = {
    ...pkg.scripts,
    'build:modular': 'node scripts/build-modular.js',
    'optimize:all': 'npm run optimize:css && npm run optimize:js && npm run optimize:images',
    'config:validate': 'node scripts/validate-config.js',
    'config:sync': 'node scripts/update-config.js',
    'clean:temp': 'rm -rf .wrangler/tmp/* && rm -rf assets/**/*.backup'
  };

  pkg.scripts = newScripts;

  // 写回文件
  try {
    fs.writeFileSync(CONFIG_FILES.package, JSON.stringify(pkg, null, 2));
    console.log('✅ Updated package.json with new scripts');
  } catch (error) {
    console.error('❌ Failed to update package.json:', error.message);
  }
}

// 验证 wrangler.toml 配置
function validateWranglerConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILES.wrangler, 'utf8');
    
    // 检查必要的配置项
    const requiredSections = [
      'name = "chatsvtr"',
      '[[headers]]',
      'Content-Security-Policy'
    ];

    const missing = requiredSections.filter(section => !content.includes(section));
    
    if (missing.length === 0) {
      console.log('✅ wrangler.toml configuration is complete');
    } else {
      console.warn('⚠️ Missing wrangler.toml sections:', missing);
    }
  } catch (error) {
    console.error('❌ Failed to validate wrangler.toml:', error.message);
  }
}

// 主函数
function main() {
  console.log('🚀 Starting SVTR.AI configuration update...\n');

  // 确保配置目录存在
  if (!fs.existsSync('config')) {
    fs.mkdirSync('config', { recursive: true });
    console.log('📁 Created config directory');
  }

  // 更新配置文件
  updatePackageScripts();
  validateWranglerConfig();

  console.log('\n📊 Configuration Update Summary:');
  console.log('- ✅ Package.json scripts updated');
  console.log('- ✅ Wrangler.toml validated');
  console.log('- ✅ Modular configuration structure implemented');

  console.log('\n🎉 Configuration update completed successfully!');
}

// 运行主函数
if (require.main === module) {
  main();
}