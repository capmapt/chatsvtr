#!/usr/bin/env node

/**
 * Enhanced RAG Data Sync for SVTR.AI
 * 增强的RAG数据同步服务，整合现有数据并支持全量知识库同步
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class EnhancedRAGSync {
  constructor() {
    this.outputDir = path.join(__dirname, '../assets/data/rag');
    this.sourceDir = path.join(__dirname, '../assets/data');
    this.knowledgeBase = [];
  }

  /**
   * 从现有数据文件构建知识库
   */
  async buildKnowledgeBaseFromExisting() {
    console.log('🔍 从现有数据构建知识库...');
    
    // 读取AI周报数据
    try {
      const weeklyPath = path.join(this.sourceDir, 'ai-weekly.json');
      const weeklyData = JSON.parse(await fs.readFile(weeklyPath, 'utf8'));
      
      for (const issue of weeklyData.issues || []) {
        this.knowledgeBase.push({
          id: `weekly_${issue.issue}`,
          title: issue.title,
          content: this.buildWeeklyContent(issue),
          type: 'weekly_report',
          source: '飞书AI周报',
          lastUpdated: issue.publishDate,
          metadata: {
            issue: issue.issue,
            publishDate: issue.publishDate,
            tags: issue.tags || [],
            highlights: issue.highlights || [],
            feishuLink: issue.feishuLink
          }
        });
      }
      
      console.log(`✅ 导入 ${weeklyData.issues?.length || 0} 期AI周报`);
    } catch (error) {
      console.log('⚠️ AI周报数据读取失败:', error.message);
    }

    // 读取交易精选数据
    try {
      const tradingPath = path.join(this.sourceDir, 'trading-picks.json');
      const tradingData = JSON.parse(await fs.readFile(tradingPath, 'utf8'));
      
      for (const company of tradingData.companies || []) {
        this.knowledgeBase.push({
          id: `company_${company.id}`,
          title: `${company.name} - ${company.sector}`,
          content: this.buildCompanyContent(company),
          type: 'company_profile',
          source: '飞书交易精选',
          lastUpdated: tradingData.meta.lastUpdated,
          metadata: {
            companyName: company.name,
            sector: company.sector,
            stage: company.stage,
            fundingAmount: company.fundingAmount,
            investors: company.investors || [],
            tags: company.tags || [],
            website: company.website
          }
        });
      }
      
      console.log(`✅ 导入 ${tradingData.companies?.length || 0} 家公司数据`);
    } catch (error) {
      console.log('⚠️ 交易精选数据读取失败:', error.message);
    }

    // 添加硬编码的重要AI创投知识
    this.addCoreKnowledge();
  }

  /**
   * 构建周报内容
   */
  buildWeeklyContent(issue) {
    const parts = [
      `期数: ${issue.issue}`,
      `标题: ${issue.title}`,
      `发布日期: ${issue.publishDate}`,
      `摘要: ${issue.summary}`,
      '',
      '重点内容:',
      ...(issue.highlights || []).map(h => `• ${h}`),
      '',
      `飞书链接: ${issue.feishuLink}`,
      `标签: ${(issue.tags || []).join(', ')}`
    ];
    
    return parts.join('\n');
  }

  /**
   * 构建公司内容
   */
  buildCompanyContent(company) {
    const parts = [
      `公司名称: ${company.name}`,
      `行业赛道: ${company.sector}`,
      `融资阶段: ${company.stage}`,
      `融资金额: ${company.fundingAmount}`,
      `融资日期: ${company.lastFundingDate}`,
      `投资机构: ${(company.investors || []).join(', ')}`,
      `官网: ${company.website}`,
      '',
      `公司描述: ${company.description}`,
      '',
      '分析要点:',
      ...(company.analysisPoints || []).map(p => `• ${p}`),
      '',
      `标签: ${(company.tags || []).join(', ')}`
    ];
    
    return parts.join('\n');
  }

  /**
   * 添加核心AI创投知识
   */
  addCoreKnowledge() {
    const coreKnowledge = [
      {
        id: 'svtr_about',
        title: '硅谷科技评论 (SVTR) 介绍',
        content: `硅谷科技评论专注于全球AI创投行业生态系统建设：

核心业务:
• 内容沉淀：飞书知识库、多维表格（AI创投库）
• 内容分发：微信公众号、LinkedIn、小红书、X、Substack  
• 社群运营：微信群、Discord

目标用户:
• AI创投从业者（投资人、创业者）
• 行业研究人员和分析师
• 对AI创投感兴趣的专业人士

核心产品:
1. AI创投库：结构化的AI初创公司和投资机构数据库
2. AI创投会：社区驱动的内容平台
3. AI创投营：用户提交的个人和项目信息展示平台

数据规模:
• 实时追踪10,761家全球AI公司
• 覆盖121,884+专业投资人和创业者网络
• 独家飞书知识库：AI周报、交易精选、深度分析
• 数据更新频率：每日实时同步最新融资和技术动态`,
        type: 'company_info',
        source: '内部资料',
        lastUpdated: new Date().toISOString().split('T')[0],
        metadata: {
          category: 'about',
          importance: 'high'
        }
      },
      {
        id: 'ai_investment_trends_2025',
        title: '2025年AI投资核心逻辑',
        content: `2025年AI投资的核心趋势和逻辑:

投资重点转移:
• 从"AI能力"转向"AI应用价值创造"
• 企业级AI工具成为新的SaaS增长引擎
• 数据飞轮和网络效应是核心护城河
• AI基础设施层面临整合和重新洗牌
• 监管合规将成为竞争优势而非阻碍

重点赛道:
• AI Agent和智能助手
• 企业级AI工具和平台
• AI在垂直行业的深度应用
• AI安全和治理解决方案
• 多模态AI和具身智能

投资策略:
• 关注具有护城河的AI应用公司
• 重视数据资产和网络效应
• 看好有明确商业模式的企业级AI
• 谨慎评估纯技术驱动的AI公司
• 关注AI+传统行业的结合机会`,
        type: 'investment_analysis',
        source: '投资研究',
        lastUpdated: new Date().toISOString().split('T')[0],
        metadata: {
          category: 'trends',
          year: '2025',
          importance: 'high'
        }
      },
      {
        id: 'major_ai_companies_2025',
        title: '2025年重点AI公司概览',
        content: `全球AI创投市场重点关注公司:

Foundation Model层:
• OpenAI: ChatGPT, GPT-4, 估值$1570亿
• Anthropic: Claude系列, 获Amazon/Google投资$60亿
• DeepMind: Google旗下, Gemini模型
• xAI: Elon Musk创立, Grok模型

企业AI应用:
• Scale AI: AI数据基础设施, 估值$140亿, 准备IPO
• Adept: AI智能体, B轮$350万
• Harvey AI: 法律AI助手, 快速增长
• Glean: 企业搜索AI, 估值$22亿

AI基础设施:
• Together AI: 开源AI云平台
• Replicate: AI模型部署平台  
• Weights & Biases: AI实验管理
• Hugging Face: AI模型社区平台

垂直AI应用:
• Perplexity: AI搜索引擎, 估值$30亿
• Character.AI: AI对话平台
• Midjourney: AI绘画工具
• Runway: AI视频生成`,
        type: 'company_database',
        source: '市场研究',
        lastUpdated: new Date().toISOString().split('T')[0],
        metadata: {
          category: 'companies',
          scope: 'global',
          importance: 'high'
        }
      }
    ];

    this.knowledgeBase.push(...coreKnowledge);
    console.log(`✅ 添加 ${coreKnowledge.length} 个核心知识条目`);
  }

  /**
   * 生成增强的RAG检索数据
   */
  async generateEnhancedRAGData() {
    console.log('🧠 生成增强RAG检索数据...');
    
    // 为每个文档生成检索关键词
    for (const doc of this.knowledgeBase) {
      doc.searchKeywords = this.generateSearchKeywords(doc);
      doc.semanticTags = this.generateSemanticTags(doc);
    }
    
    // 构建语义模式库
    const semanticPatterns = this.buildSemanticPatterns();
    
    // 构建最终输出
    const ragData = {
      summary: {
        lastUpdated: new Date().toISOString(),
        totalDocuments: this.knowledgeBase.length,
        documentTypes: this.getDocumentTypeStats(),
        sources: this.getSourceStats(),
        enhancedFeatures: [
          'keyword_search',
          'semantic_patterns',
          'metadata_filtering',
          'relevance_scoring'
        ]
      },
      semanticPatterns,
      documents: this.knowledgeBase
    };
    
    return ragData;
  }

  /**
   * 生成搜索关键词
   */
  generateSearchKeywords(doc) {
    const keywords = new Set();
    
    // 从标题提取
    const titleWords = doc.title.split(/[\s\-\(\)]+/).filter(w => w.length > 1);
    titleWords.forEach(word => keywords.add(word.toLowerCase()));
    
    // 从内容提取重要词汇
    const content = doc.content.toLowerCase();
    const importantPatterns = [
      /(\d+[\w]*[亿万]+[美元元]?)/g,  // 金额
      /(series [a-f]|a轮|b轮|c轮|pre-?[ab]|种子轮)/gi,  // 融资轮次
      /(ai|人工智能|machine learning|深度学习|大模型)/gi,  // AI相关
      /([投资机构|vc|基金])/gi,  // 投资相关
      /(ipo|上市|估值)/gi  // 市场相关
    ];
    
    importantPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      matches.forEach(match => keywords.add(match.toLowerCase()));
    });
    
    // 从元数据提取
    if (doc.metadata) {
      Object.values(doc.metadata).forEach(value => {
        if (typeof value === 'string' && value.length > 1) {
          keywords.add(value.toLowerCase());
        } else if (Array.isArray(value)) {
          value.forEach(item => {
            if (typeof item === 'string' && item.length > 1) {
              keywords.add(item.toLowerCase());
            }
          });
        }
      });
    }
    
    return Array.from(keywords).slice(0, 20); // 限制关键词数量
  }

  /**
   * 生成语义标签
   */
  generateSemanticTags(doc) {
    const tags = [];
    const content = doc.content.toLowerCase();
    
    // 基于内容特征生成标签
    if (content.includes('融资') || content.includes('投资') || content.includes('funding')) {
      tags.push('funding');
    }
    if (content.includes('ai') || content.includes('人工智能') || content.includes('machine learning')) {
      tags.push('artificial_intelligence');
    }
    if (content.includes('创业') || content.includes('startup') || content.includes('初创')) {
      tags.push('startup');
    }
    if (content.includes('估值') || content.includes('valuation') || content.includes('市值')) {
      tags.push('valuation');
    }
    if (content.includes('ipo') || content.includes('上市') || content.includes('public')) {
      tags.push('public_market');
    }
    
    return tags;
  }

  /**
   * 构建语义模式库
   */
  buildSemanticPatterns() {
    return {
      funding_queries: {
        patterns: ['融资', '投资', 'funding', 'investment', '轮次', 'series'],
        weight: 1.2
      },
      company_queries: {
        patterns: ['公司', 'company', '企业', 'startup', '初创'],
        weight: 1.0
      },
      ai_queries: {
        patterns: ['ai', '人工智能', 'artificial intelligence', '机器学习', 'machine learning', '大模型', 'llm'],
        weight: 1.3
      },
      market_queries: {
        patterns: ['市场', 'market', '行业', 'industry', '趋势', 'trend'],
        weight: 1.1
      },
      valuation_queries: {
        patterns: ['估值', 'valuation', '市值', 'market cap', 'ipo', '上市'],
        weight: 1.2
      }
    };
  }

  /**
   * 获取文档类型统计
   */
  getDocumentTypeStats() {
    const stats = {};
    this.knowledgeBase.forEach(doc => {
      stats[doc.type] = (stats[doc.type] || 0) + 1;
    });
    return stats;
  }

  /**
   * 获取数据源统计
   */
  getSourceStats() {
    const stats = {};
    this.knowledgeBase.forEach(doc => {
      stats[doc.source] = (stats[doc.source] || 0) + 1;
    });
    return stats;
  }

  /**
   * 保存增强RAG数据
   */
  async saveEnhancedData(ragData) {
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const outputFile = path.join(this.outputDir, 'enhanced-knowledge-base.json');
    await fs.writeFile(outputFile, JSON.stringify(ragData, null, 2));
    
    console.log(`\n📊 增强RAG数据生成完成:`);
    console.log(`总计文档: ${ragData.summary.totalDocuments}`);
    console.log(`数据类型: ${Object.keys(ragData.summary.documentTypes).join(', ')}`);
    console.log(`数据源: ${Object.keys(ragData.summary.sources).join(', ')}`);
    console.log(`保存位置: ${outputFile}`);
    
    return outputFile;
  }

  /**
   * 执行完整同步
   */
  async syncAll() {
    console.log('🚀 开始增强RAG数据同步...\n');
    
    try {
      // 从现有数据构建知识库
      await this.buildKnowledgeBaseFromExisting();
      
      // 生成增强RAG数据
      const ragData = await this.generateEnhancedRAGData();
      
      // 保存数据
      const outputFile = await this.saveEnhancedData(ragData);
      
      console.log('\n🎉 增强RAG数据同步完成！');
      console.log('📝 现在chatbot可以基于以下数据提供智能回复:');
      console.log('   • AI周报内容和趋势分析');
      console.log('   • 重点创业公司详细信息');
      console.log('   • 投资市场核心逻辑和趋势');
      console.log('   • SVTR平台和服务介绍');
      
      return outputFile;
      
    } catch (error) {
      console.error('\n❌ 同步失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const syncService = new EnhancedRAGSync();
  
  try {
    await syncService.syncAll();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 增强RAG同步失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { EnhancedRAGSync };