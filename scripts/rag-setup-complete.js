#!/usr/bin/env node

/**
 * SVTR.AI RAG系统完整设置验证脚本
 * 验证所有组件是否正确配置和运行
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class RAGSetupValidator {
  constructor() {
    this.results = {
      environment: {},
      files: {},
      configuration: {},
      recommendations: []
    };
  }

  /**
   * 验证环境变量
   */
  async validateEnvironment() {
    console.log('🔧 验证环境配置...');
    
    const requiredVars = {
      'FEISHU_APP_ID': process.env.FEISHU_APP_ID,
      'FEISHU_APP_SECRET': process.env.FEISHU_APP_SECRET,
      'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
      'CLOUDFLARE_ACCOUNT_ID': process.env.CLOUDFLARE_ACCOUNT_ID,
      'CLOUDFLARE_API_TOKEN': process.env.CLOUDFLARE_API_TOKEN
    };
    
    for (const [key, value] of Object.entries(requiredVars)) {
      const status = value ? '✅' : '❌';
      const result = value ? 'configured' : 'missing';
      
      console.log(`  ${status} ${key}: ${result}`);
      this.results.environment[key] = !!value;
      
      if (!value) {
        this.results.recommendations.push(`配置环境变量 ${key}`);
      }
    }
  }

  /**
   * 验证关键文件
   */
  async validateFiles() {
    console.log('\n📁 验证关键文件...');
    
    const criticalFiles = [
      // 核心RAG组件
      'functions/lib/rag-service.ts',
      'functions/api/chat.ts',
      
      // 数据处理脚本
      'scripts/rag-data-sync.js',
      'scripts/rag-vectorize.js',
      'scripts/rag-test.js',
      
      // 配置文件
      'wrangler.toml',
      'package.json',
      
      // 前端组件
      'assets/js/chat.js',
      'assets/css/chat.css',
      
      // 文档
      'docs/rag-deployment-guide.md',
      'docs/rag-implementation-design.md'
    ];
    
    for (const file of criticalFiles) {
      const filePath = path.join(__dirname, '..', file);
      
      try {
        await fs.access(filePath);
        console.log(`  ✅ ${file}`);
        this.results.files[file] = true;
      } catch (error) {
        console.log(`  ❌ ${file} - 缺失`);
        this.results.files[file] = false;
        this.results.recommendations.push(`检查文件 ${file} 是否存在`);
      }
    }
  }

  /**
   * 验证wrangler配置
   */
  async validateWranglerConfig() {
    console.log('\n⚙️ 验证Cloudflare配置...');
    
    try {
      const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
      const content = await fs.readFile(wranglerPath, 'utf8');
      
      // 检查Vectorize配置
      const hasVectorize = content.includes('[[vectorize]]');
      const hasBinding = content.includes('binding = "SVTR_VECTORIZE"');
      const hasIndexName = content.includes('index_name = "svtr-knowledge-base"');
      const hasDimensions = content.includes('dimensions = 1536');
      
      console.log(`  ${hasVectorize ? '✅' : '❌'} Vectorize 配置块`);
      console.log(`  ${hasBinding ? '✅' : '❌'} Vectorize 绑定`);
      console.log(`  ${hasIndexName ? '✅' : '❌'} 索引名称`);
      console.log(`  ${hasDimensions ? '✅' : '❌'} 向量维度`);
      
      this.results.configuration.vectorize = hasVectorize && hasBinding && hasIndexName && hasDimensions;
      
      if (!this.results.configuration.vectorize) {
        this.results.recommendations.push('修复wrangler.toml中的Vectorize配置');
      }
      
    } catch (error) {
      console.log('  ❌ 无法读取wrangler.toml');
      this.results.configuration.vectorize = false;
    }
  }

  /**
   * 验证package.json脚本
   */
  async validatePackageScripts() {
    console.log('\n📦 验证NPM脚本...');
    
    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const requiredScripts = [
        'rag:sync',
        'rag:build', 
        'rag:test',
        'rag:deploy',
        'rag:setup'
      ];
      
      for (const script of requiredScripts) {
        const exists = packageJson.scripts && packageJson.scripts[script];
        console.log(`  ${exists ? '✅' : '❌'} npm run ${script}`);
        
        if (!exists) {
          this.results.recommendations.push(`添加NPM脚本: ${script}`);
        }
      }
      
      this.results.configuration.scripts = requiredScripts.every(
        script => packageJson.scripts && packageJson.scripts[script]
      );
      
    } catch (error) {
      console.log('  ❌ 无法验证package.json');
      this.results.configuration.scripts = false;
    }
  }

  /**
   * 检查数据目录
   */
  async checkDataDirectories() {
    console.log('\n📂 检查数据目录...');
    
    const dataDirs = [
      'assets/data/rag',
      'assets/data/vectors',
      'assets/data/test-results'
    ];
    
    for (const dir of dataDirs) {
      const dirPath = path.join(__dirname, '..', dir);
      
      try {
        await fs.access(dirPath);
        console.log(`  ✅ ${dir}/`);
      } catch (error) {
        console.log(`  ℹ️ ${dir}/ - 将在首次运行时创建`);
      }
    }
  }

  /**
   * 提供设置指导
   */
  generateSetupInstructions() {
    console.log('\n🚀 RAG系统设置指导:\n');
    
    // 根据验证结果提供个性化指导
    const envConfigured = Object.values(this.results.environment).every(Boolean);
    const filesComplete = Object.values(this.results.files).every(Boolean);
    const configValid = this.results.configuration.vectorize && this.results.configuration.scripts;
    
    if (envConfigured && filesComplete && configValid) {
      console.log('🎉 系统配置完整！可以开始使用RAG功能:');
      console.log('');
      console.log('1. 创建Vectorize索引:');
      console.log('   wrangler vectorize create svtr-knowledge-base --dimensions=1536 --metric=cosine');
      console.log('');
      console.log('2. 完整设置流程:');
      console.log('   npm run rag:setup');
      console.log('');
      console.log('3. 交互式测试:');
      console.log('   npm run rag:test -- --interactive');
      console.log('');
      console.log('4. 部署到生产环境:');
      console.log('   wrangler pages deploy');
    } else {
      console.log('⚠️ 需要完成以下配置:');
      console.log('');
      
      if (!envConfigured) {
        console.log('📝 环境变量配置 (.env文件):');
        console.log('```env');
        for (const [key, configured] of Object.entries(this.results.environment)) {
          if (!configured) {
            console.log(`${key}=your_${key.toLowerCase()}_here`);
          }
        }
        console.log('```');
        console.log('');
      }
      
      if (this.results.recommendations.length > 0) {
        console.log('🔧 需要修复的问题:');
        this.results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. ${rec}`);
        });
        console.log('');
      }
      
      console.log('✅ 配置完成后，运行: npm run rag:setup');
    }
    
    console.log('\n📖 详细文档:');
    console.log('- 部署指南: docs/rag-deployment-guide.md');
    console.log('- 技术设计: docs/rag-implementation-design.md');
    console.log('- 在线文档: https://docs.svtr.ai/rag');
  }

  /**
   * 生成状态报告
   */
  async generateStatusReport() {
    const reportPath = path.join(__dirname, '..', 'docs/rag-setup-status.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: {
        environment: this.results.environment,
        files: this.results.files,
        configuration: this.results.configuration
      },
      recommendations: this.results.recommendations,
      nextSteps: [
        'Configure missing environment variables',
        'Create Cloudflare Vectorize index',
        'Run npm run rag:setup',
        'Test with npm run rag:test',
        'Deploy with wrangler pages deploy'
      ]
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 状态报告已保存: ${reportPath}`);
  }

  /**
   * 主验证流程
   */
  async validate() {
    console.log('🔍 SVTR.AI RAG系统设置验证\n');
    
    await this.validateEnvironment();
    await this.validateFiles();
    await this.validateWranglerConfig();
    await this.validatePackageScripts();
    await this.checkDataDirectories();
    
    this.generateSetupInstructions();
    await this.generateStatusReport();
    
    console.log('\n✨ 验证完成！');
  }
}

// 主函数
async function main() {
  const validator = new RAGSetupValidator();
  
  try {
    await validator.validate();
  } catch (error) {
    console.error('验证过程出错:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { RAGSetupValidator };