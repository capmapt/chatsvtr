#!/usr/bin/env node

/**
 * 真实内容同步脚本
 * 基于测试结果，使用确认可用的API端点获取飞书真实内容
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class RealContentSync {
  constructor() {
    this.config = {
      appId: 'cli_a8e2014cbe7d9013',
      appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
      baseUrl: 'https://open.feishu.cn/open-apis',
      spaceId: '7321328173944340484',
      
      // 确认可用的文档对象
      availableDocuments: [
        {
          name: 'SVTR AI创投库',
          objToken: 'CB2cdSdyzokFt7xi2wOchtP6nPb',
          nodeToken: 'QZt5wuIvhigrTdkGdBjcFRsKnaf',
          type: 'docx',
          verified: true
        },
        {
          name: 'SVTR丨硅谷科技评论',
          objToken: 'DEzTdMe8qoLE3gxtnUHcZP83nNb', 
          nodeToken: 'TB4nwFKSjiZybRkoZx7c7mBXnxd',
          type: 'docx',
          verified: true
        }
      ]
    };
    
    this.accessToken = null;
    this.outputDir = path.join(__dirname, '../assets/data/rag');
    this.realContent = [];
  }

  async getAccessToken() {
    const url = `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        })
      });
      
      const data = await response.json();
      
      if (data.code === 0) {
        this.accessToken = data.tenant_access_token;
        console.log('✅ 飞书认证成功');
        return true;
      } else {
        console.error('❌ 认证失败:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('❌ 认证错误:', error.message);
      return false;
    }
  }

  async fetchDocumentContent(doc) {
    console.log(`📄 获取文档: ${doc.name}`);
    
    const url = `${this.config.baseUrl}/docx/v1/documents/${doc.objToken}/raw_content`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status}: ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      
      if (data.code === 0 && data.data.content) {
        console.log(`   ✅ 成功获取 ${data.data.content.length} 字符`);
        return {
          ...doc,
          content: data.data.content,
          rawData: data.data,
          fetchedAt: new Date().toISOString(),
          contentLength: data.data.content.length
        };
      } else {
        console.log(`   ⚠️ API错误: ${data.msg} (code: ${data.code})`);
        return null;
      }
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      return null;
    }
  }

  async fetchAllContent() {
    console.log('\n🔄 开始获取所有可用文档内容...');
    
    for (const doc of this.config.availableDocuments) {
      const content = await this.fetchDocumentContent(doc);
      
      if (content) {
        this.realContent.push(content);
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n📊 成功获取 ${this.realContent.length} 个文档的内容`);
  }

  processContent(doc) {
    const content = doc.content;
    
    // 基本文本清理
    const cleanContent = content
      .replace(/\n{3,}/g, '\n\n')  // 去除过多换行
      .replace(/\s{2,}/g, ' ')     // 去除多余空格
      .trim();
    
    // 提取关键信息
    const keywords = this.extractKeywords(cleanContent);
    const sections = this.extractSections(cleanContent);
    
    return {
      id: `real_${doc.nodeToken}`,
      title: doc.name,
      content: cleanContent,
      originalLength: content.length,
      processedLength: cleanContent.length,
      type: 'feishu_document',
      source: 'SVTR飞书知识库',
      lastUpdated: new Date().toISOString().split('T')[0],
      metadata: {
        objToken: doc.objToken,
        nodeToken: doc.nodeToken,
        docType: doc.type,
        fetchedAt: doc.fetchedAt,
        verified: doc.verified
      },
      keywords,
      sections,
      searchKeywords: this.generateSearchKeywords(cleanContent, doc.name),
      semanticTags: this.generateSemanticTags(cleanContent),
      ragScore: this.calculateRAGScore(cleanContent, keywords.length)
    };
  }

  extractKeywords(content) {
    const keywords = new Set();
    
    // SVTR特定关键词
    const svtrPatterns = [
      /SVTR\.AI|硅谷科技评论|Silicon Valley Tech Review/gi,
      /AI创投|AI venture|人工智能投资/gi,
      /创投数据库|投资数据/gi
    ];
    
    // 技术关键词
    const techPatterns = [
      /AI|人工智能|机器学习|深度学习/gi,
      /创业公司|初创企业|startup/gi,
      /投资|融资|风投|VC|venture capital/gi,
      /数据库|database|数据分析/gi
    ];
    
    const allPatterns = [...svtrPatterns, ...techPatterns];
    
    allPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => keywords.add(match.toLowerCase()));
    });
    
    return Array.from(keywords);
  }

  extractSections(content) {
    const sections = [];
    
    // 尝试识别章节结构
    const lines = content.split('\n');
    let currentSection = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 识别标题行 (通常很短且单独一行)
      if (trimmedLine.length > 0 && trimmedLine.length < 50 && 
          !trimmedLine.includes('：') && !trimmedLine.includes('。')) {
        
        if (currentSection) {
          sections.push(currentSection);
        }
        
        currentSection = {
          title: trimmedLine,
          content: ''
        };
      } else if (currentSection && trimmedLine.length > 0) {
        currentSection.content += trimmedLine + '\n';
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  generateSearchKeywords(content, title) {
    const keywords = new Set();
    
    // 添加标题词
    title.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 1) keywords.add(word);
    });
    
    // 提取内容关键词
    const contentWords = content.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    // 词频分析，取前20个高频词
    const wordCount = {};
    contentWords.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .forEach(([word]) => keywords.add(word));
    
    return Array.from(keywords);
  }

  generateSemanticTags(content) {
    const tags = [];
    const contentLower = content.toLowerCase();
    
    // 核心业务标签
    if (contentLower.includes('svtr') || contentLower.includes('硅谷科技评论')) {
      tags.push('svtr_platform');
    }
    if (contentLower.includes('ai') || contentLower.includes('人工智能')) {
      tags.push('artificial_intelligence');
    }
    if (contentLower.includes('创投') || contentLower.includes('投资')) {
      tags.push('investment_funding');
    }
    if (contentLower.includes('数据') || contentLower.includes('database')) {
      tags.push('data_analytics');
    }
    if (contentLower.includes('社区') || contentLower.includes('community')) {
      tags.push('community_platform');
    }
    
    return tags;
  }

  calculateRAGScore(content, keywordCount) {
    let score = 0;
    
    // 内容长度评分
    if (content.length > 1000) score += 20;
    else if (content.length > 500) score += 15;
    else if (content.length > 100) score += 10;
    else score += 5;
    
    // 关键词数量评分
    score += Math.min(keywordCount * 2, 20);
    
    // 结构化程度评分
    if (content.includes('目录') || content.includes('导航')) score += 10;
    if (content.split('\n').length > 10) score += 10;
    
    // SVTR专业度评分
    if (content.includes('SVTR') || content.includes('硅谷科技评论')) score += 15;
    
    return Math.min(score, 100);
  }

  async saveRealContentData() {
    console.log('\n💾 保存真实内容数据...');
    
    const processedDocuments = this.realContent.map(doc => this.processContent(doc));
    
    const outputData = {
      summary: {
        lastUpdated: new Date().toISOString(),
        totalDocuments: processedDocuments.length,
        sourceInfo: {
          platform: 'SVTR飞书知识库',
          spaceId: this.config.spaceId,
          syncMethod: 'real_content_api',
          verified: true
        },
        contentStats: {
          totalCharacters: processedDocuments.reduce((sum, doc) => sum + doc.processedLength, 0),
          avgRAGScore: processedDocuments.reduce((sum, doc) => sum + doc.ragScore, 0) / processedDocuments.length,
          totalKeywords: processedDocuments.reduce((sum, doc) => sum + doc.keywords.length, 0)
        }
      },
      documents: processedDocuments
    };
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // 保存到文件
    const outputFile = path.join(this.outputDir, 'real-feishu-content.json');
    await fs.writeFile(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
    
    console.log(`✅ 真实内容已保存到: ${outputFile}`);
    console.log(`📊 总计: ${processedDocuments.length} 个文档，${outputData.summary.contentStats.totalCharacters} 字符`);
    
    return outputFile;
  }

  async runSync() {
    console.log('🚀 开始真实内容同步...\n');
    
    if (!await this.getAccessToken()) {
      console.error('❌ 认证失败，同步中止');
      return;
    }
    
    // 获取所有可用内容
    await this.fetchAllContent();
    
    if (this.realContent.length === 0) {
      console.log('⚠️ 未获取到任何内容');
      return;
    }
    
    // 保存处理后的数据
    const outputFile = await this.saveRealContentData();
    
    console.log('\n🎉 真实内容同步完成！');
    console.log('📋 总结:');
    this.realContent.forEach(doc => {
      console.log(`   - ${doc.name}: ${doc.contentLength} 字符`);
    });
    
    return outputFile;
  }
}

if (require.main === module) {
  const syncer = new RealContentSync();
  syncer.runSync().catch(console.error);
}

module.exports = RealContentSync;