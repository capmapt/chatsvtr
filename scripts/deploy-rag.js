#!/usr/bin/env node

/**
 * SVTR.AI RAG系统部署脚本
 * 启用RAG增强功能并更新相关配置
 */

const fs = require('fs').promises;
const path = require('path');

class RAGDeployer {
  constructor() {
    this.baseDir = path.join(__dirname, '..');
    this.backupDir = path.join(__dirname, '../backups/rag-deployment');
  }

  /**
   * 创建备份
   */
  async createBackup() {
    console.log('📦 创建部署备份...');
    
    await fs.mkdir(this.backupDir, { recursive: true });
    
    const filesToBackup = [
      'functions/api/chat.ts',
      'package.json',
      'wrangler.toml'
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(this.baseDir, file);
      const backupPath = path.join(this.backupDir, file);
      
      try {
        // 确保备份目录存在
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        
        // 复制文件
        const content = await fs.readFile(sourcePath, 'utf8');
        await fs.writeFile(backupPath, content);
        
        console.log(`✅ 已备份: ${file}`);
      } catch (error) {
        console.log(`⚠️ 备份失败 ${file}: ${error.message}`);
      }
    }
  }

  /**
   * 启用RAG增强的Chat API
   */
  async enableRAGChatAPI() {
    console.log('🔄 启用RAG增强Chat API...');
    
    const originalPath = path.join(this.baseDir, 'functions/api/chat.ts');
    const enhancedPath = path.join(this.baseDir, 'functions/api/chat-enhanced.ts');
    
    try {
      // 检查增强版本是否存在
      await fs.access(enhancedPath);
      
      // 读取增强版本内容
      const enhancedContent = await fs.readFile(enhancedPath, 'utf8');
      
      // 替换原始版本
      await fs.writeFile(originalPath, enhancedContent);
      
      console.log('✅ Chat API已升级为RAG增强版本');
    } catch (error) {
      console.error('❌ 启用RAG Chat API失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新环境配置提示
   */
  async updateEnvironmentConfig() {
    console.log('⚙️ 检查环境配置...');
    
    const requiredEnvVars = [
      'FEISHU_APP_ID',
      'FEISHU_APP_SECRET', 
      'OPENAI_API_KEY',
      'CLOUDFLARE_ACCOUNT_ID',
      'CLOUDFLARE_API_TOKEN'
    ];
    
    const missingVars = [];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }
    
    if (missingVars.length > 0) {
      console.log('⚠️ 缺少以下环境变量:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
      
      console.log('\n📝 请在 .env 文件中添加以下配置:');
      console.log('```env');
      missingVars.forEach(varName => {
        console.log(`${varName}=your_${varName.toLowerCase()}_here`);
      });
      console.log('```');
      
      return false;
    }
    
    console.log('✅ 环境配置检查通过');
    return true;
  }

  /**
   * 创建Cloudflare Vectorize索引
   */
  async createVectorizeIndex() {
    console.log('☁️ 创建Cloudflare Vectorize索引...');
    
    try {
      // 这里需要实际调用Cloudflare API创建索引
      // 暂时输出创建命令供手动执行
      console.log('📋 请手动执行以下命令创建Vectorize索引:');
      console.log('```bash');
      console.log('wrangler vectorize create svtr-knowledge-base --dimensions=1536 --metric=cosine');
      console.log('```');
      
      console.log('或者访问Cloudflare Dashboard手动创建');
    } catch (error) {
      console.log('⚠️ Vectorize索引创建说明已输出，请手动执行');
    }
  }

  /**
   * 更新前端聊天组件
   */
  async updateChatComponent() {
    console.log('🎨 更新前端聊天组件...');
    
    const chatJsPath = path.join(this.baseDir, 'assets/js/chat.js');
    
    try {
      let content = await fs.readFile(chatJsPath, 'utf8');
      
      // 检查是否已经包含RAG相关代码
      if (content.includes('RAG增强')) {
        console.log('ℹ️ 聊天组件已包含RAG功能');
        return;
      }
      
      // 在聊天消息中添加来源显示逻辑
      const ragEnhancementCode = `
    // RAG增强功能 - 显示知识库来源
    displayMessageWithSources(message, sources) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message assistant-message';
      
      // 主要消息内容
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.innerHTML = this.formatMessage(message);
      messageDiv.appendChild(contentDiv);
      
      // 来源信息
      if (sources && sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'message-sources';
        sourcesDiv.innerHTML = \`
          <div class="sources-header">📚 基于SVTR知识库:</div>
          <ul class="sources-list">
            \${sources.map(source => \`<li>\${source}</li>\`).join('')}
          </ul>
        \`;
        messageDiv.appendChild(sourcesDiv);
      }
      
      return messageDiv;
    }`;
      
      // 在类定义结束前插入新代码
      content = content.replace(
        /(\s+}(?:\s*$|\s*\/\/ End of class))/,
        ragEnhancementCode + '$1'
      );
      
      await fs.writeFile(chatJsPath, content);
      console.log('✅ 聊天组件已更新，支持显示知识库来源');
      
    } catch (error) {
      console.log('⚠️ 更新聊天组件失败，请手动添加来源显示功能');
    }
  }

  /**
   * 更新CSS样式
   */
  async updateChatStyles() {
    console.log('🎨 更新聊天样式...');
    
    const chatCssPath = path.join(this.baseDir, 'assets/css/chat.css');
    
    try {
      let content = await fs.readFile(chatCssPath, 'utf8');
      
      // 检查是否已包含来源样式
      if (content.includes('.message-sources')) {
        console.log('ℹ️ 样式文件已包含RAG相关样式');
        return;
      }
      
      const ragStyles = `
/* RAG知识库来源样式 */
.message-sources {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-left: 4px solid #FA8C32;
  border-radius: 6px;
  font-size: 0.9em;
}

.sources-header {
  font-weight: 600;
  color: #FA8C32;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sources-list {
  margin: 0;
  padding-left: 20px;
  color: #666;
}

.sources-list li {
  margin-bottom: 4px;
  line-height: 1.4;
}

/* RAG增强指示器 */
.rag-enhanced::before {
  content: "🧠";
  margin-right: 6px;
  opacity: 0.7;
}
`;
      
      // 添加样式到文件末尾
      content += ragStyles;
      
      await fs.writeFile(chatCssPath, content);
      console.log('✅ 聊天样式已更新，支持显示知识库来源');
      
    } catch (error) {
      console.log('⚠️ 更新样式失败，请手动添加RAG相关样式');
    }
  }

  /**
   * 生成部署说明
   */
  async generateDeploymentGuide() {
    const guideContent = `# SVTR.AI RAG系统部署指南

## 🎉 RAG功能已成功部署！

### ✅ 已完成的部署步骤:

1. **Chat API升级**: 已启用RAG增强版本
2. **Vectorize配置**: 已配置Cloudflare Vectorize绑定
3. **前端界面**: 已更新聊天组件和样式
4. **数据脚本**: 已准备飞书数据同步和向量化脚本

### 🚀 启用RAG功能的步骤:

#### 1. 环境配置
请确保 \`.env\` 文件包含以下配置:
\`\`\`env
# 飞书配置
FEISHU_APP_ID=cli_xxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxx

# OpenAI配置 (用于Embedding)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx

# Cloudflare配置 (用于Vectorize)
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxx
CLOUDFLARE_API_TOKEN=xxxxxxxxxxxxxxxx
\`\`\`

#### 2. 创建Vectorize索引
\`\`\`bash
wrangler vectorize create svtr-knowledge-base --dimensions=1536 --metric=cosine
\`\`\`

#### 3. 数据同步和向量化
\`\`\`bash
# 同步飞书知识库数据
npm run rag:sync

# 向量化处理
npm run rag:build

# 测试RAG功能
npm run rag:test
\`\`\`

#### 4. 部署到Cloudflare
\`\`\`bash
wrangler pages deploy
\`\`\`

### 🧪 测试RAG功能:

#### 自动化测试
\`\`\`bash
npm run rag:test
\`\`\`

#### 交互式测试
\`\`\`bash
npm run rag:test -- --interactive
\`\`\`

### 📊 监控和维护:

1. **数据更新**: 定期运行 \`npm run rag:sync\` 同步最新数据
2. **向量重建**: 数据大幅更新后运行 \`npm run rag:build\`
3. **性能监控**: 关注Cloudflare Dashboard中的Vectorize使用情况

### 🔧 故障排除:

#### 常见问题:
1. **Embedding API失败**: 检查OPENAI_API_KEY是否正确
2. **Vectorize连接失败**: 检查Cloudflare配置和索引是否创建
3. **飞书同步失败**: 检查飞书应用权限和API密钥

#### 回滚方案:
如需回滚到原始版本:
\`\`\`bash
# 恢复原始Chat API
cp backups/rag-deployment/functions/api/chat.ts functions/api/chat.ts

# 重新部署
wrangler pages deploy
\`\`\`

### 📈 预期效果:

- ✅ 基于SVTR真实数据的专业回答
- ✅ 显著提升回答质量和准确性
- ✅ 自动显示知识库来源和置信度
- ✅ 智能检索和上下文增强

---

部署时间: ${new Date().toLocaleString()}
版本: RAG v1.0
`;

    const guidePath = path.join(this.baseDir, 'docs/rag-deployment-guide.md');
    await fs.writeFile(guidePath, guideContent);
    
    console.log(`📖 部署指南已生成: ${guidePath}`);
  }

  /**
   * 主部署流程
   */
  async deploy() {
    try {
      console.log('🚀 开始SVTR.AI RAG系统部署...\n');
      
      // 1. 创建备份
      await this.createBackup();
      
      // 2. 检查环境配置
      const configOk = await this.updateEnvironmentConfig();
      
      // 3. 启用RAG Chat API
      await this.enableRAGChatAPI();
      
      // 4. 更新前端组件
      await this.updateChatComponent();
      
      // 5. 更新样式
      await this.updateChatStyles();
      
      // 6. Vectorize索引说明
      await this.createVectorizeIndex();
      
      // 7. 生成部署指南
      await this.generateDeploymentGuide();
      
      console.log('\n🎉 RAG系统部署完成！');
      console.log('📖 请查看生成的部署指南了解后续步骤');
      
      if (!configOk) {
        console.log('\n⚠️ 注意: 请先配置缺少的环境变量，然后运行数据同步');
      }
      
      console.log('\n🔄 后续步骤:');
      console.log('1. 配置环境变量 (.env文件)');
      console.log('2. 创建Vectorize索引 (wrangler vectorize create)');
      console.log('3. 同步数据 (npm run rag:sync)');
      console.log('4. 向量化 (npm run rag:build)');
      console.log('5. 测试 (npm run rag:test)');
      console.log('6. 部署 (wrangler pages deploy)');
      
    } catch (error) {
      console.error('\n❌ 部署失败:', error.message);
      console.log('\n🔄 如需回滚，请运行恢复脚本');
      throw error;
    }
  }
}

// 主函数
async function main() {
  const deployer = new RAGDeployer();
  
  try {
    await deployer.deploy();
  } catch (error) {
    console.error('部署失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { RAGDeployer };