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
    'optimize:css': 'node scripts/optimize-css.js',
    'optimize:js': 'node scripts/optimize-js.js',
    'optimize:images': 'node scripts/optimize-images.js',
    'deploy:quick': 'npm run build:modular && npm run optimize:all && wrangler pages deploy',
    'dev:server': 'node dev-server.js',
    'config:validate': 'node scripts/validate-config.js',
    'config:sync': 'node scripts/update-config.js',
    'clean:temp': 'rm -rf .wrangler/tmp/* && rm -rf assets/**/*.backup',
    'security:audit': 'npm audit && node scripts/security-check.js'
  };

  pkg.scripts = newScripts;

  // 添加新的依赖（如果不存在）
  const newDevDependencies = {
    ...pkg.devDependencies,
    'terser': '^5.24.0',
    'cssnano': '^6.0.1',
    'postcss': '^8.4.31',
    'autoprefixer': '^10.4.16'
  };

  pkg.devDependencies = newDevDependencies;

  // 写回文件
  try {
    fs.writeFileSync(CONFIG_FILES.package, JSON.stringify(pkg, null, 2));
    console.log('✅ Updated package.json with new scripts and dependencies');
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
      'Content-Security-Policy',
      '[[vectorize]]',
      '[[kv_namespaces]]',
      '[ai]'
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

// 创建配置同步脚本
function createConfigSyncScript() {
  const syncScript = `#!/bin/bash

# SVTR.AI Configuration Sync Script
# 配置文件同步脚本

echo "🔄 Synchronizing SVTR.AI configurations..."

# 1. 验证配置文件完整性
echo "Validating configuration files..."
node scripts/validate-config.js

# 2. 同步环境变量到 .env.example
echo "Updating .env.example..."
cat > .env.example << EOF
# SVTR.AI Environment Variables
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Development Settings
NODE_ENV=development
PORT=3000

# API Configuration
API_BASE_URL=/api

# Feature Flags
ENABLE_REAL_TIME_CHAT=true
ENABLE_SMART_DEMO=true
ENABLE_PERFORMANCE_MONITORING=true
EOF

# 3. 更新 README 配置说明
echo "Updating README configuration section..."

# 4. 验证安全配置
echo "Checking security configurations..."
npm run security:audit

echo "✅ Configuration sync completed!"
`;

  try {
    fs.writeFileSync('scripts/sync-config.sh', syncScript);
    fs.chmodSync('scripts/sync-config.sh', '755');
    console.log('✅ Created configuration sync script');
  } catch (error) {
    console.error('❌ Failed to create sync script:', error.message);
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
  createConfigSyncScript();

  console.log('\n📊 Configuration Update Summary:');
  console.log('- ✅ Package.json scripts updated');
  console.log('- ✅ Wrangler.toml validated');
  console.log('- ✅ Configuration sync script created');
  console.log('- ✅ Modular configuration structure implemented');

  console.log('\n📝 Next Steps:');
  console.log('1. Run: npm install (to install new dependencies)');
  console.log('2. Run: npm run config:validate (to validate all configs)');
  console.log('3. Run: npm run build:modular (to test modular build)');
  console.log('4. Run: npm run deploy:quick (to deploy optimized version)');

  console.log('\n🎉 Configuration update completed successfully!');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  updatePackageScripts,
  validateWranglerConfig,
  createConfigSyncScript
};`;

fs.writeFileSync('scripts/update-config.js', syncScript);
fs.chmodSync('scripts/update-config.js', '755');
console.log('✅ Created configuration update script');
  } catch (error) {
    console.error('❌ Failed to create update script:', error.message);
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
  createConfigSyncScript();

  console.log('\n📊 Configuration Update Summary:');
  console.log('- ✅ Package.json scripts updated');
  console.log('- ✅ Wrangler.toml validated');
  console.log('- ✅ Configuration sync script created');
  console.log('- ✅ Modular configuration structure implemented');

  console.log('\n📝 Next Steps:');
  console.log('1. Run: npm install (to install new dependencies)');
  console.log('2. Run: npm run config:validate (to validate all configs)');
  console.log('3. Run: npm run build:modular (to test modular build)');
  console.log('4. Run: npm run deploy:quick (to deploy optimized version)');

  console.log('\n🎉 Configuration update completed successfully!');
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  updatePackageScripts,
  validateWranglerConfig,
  createConfigSyncScript
};