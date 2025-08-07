#!/usr/bin/env node

/**
 * 增强版飞书知识库同步脚本 V2
 * 使用正确的API端点获取完整的子节点内容
 * 基于API测试发现的正确调用方式
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class EnhancedFeishuSyncV2 {
  constructor() {
    this.config = {
      appId: 'cli_a8e2014cbe7d9013',
      appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
      baseUrl: 'https://open.feishu.cn/open-apis',
      spaceId: '7321328173944340484',
      wikiDomain: 'svtrglobal.feishu.cn'
    };
    
    this.accessToken = null;
    this.outputDir = path.join(__dirname, '../assets/data/rag');
    this.knowledgeBase = [];
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
        console.error('❌ 飞书认证失败:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('❌ 飞书认证失败:', error.message);
      return false;
    }
  }

  // 使用正确的API获取子节点
  async getChildNodes(parentNodeToken) {
    console.log(`🌲 获取子节点: ${parentNodeToken}`);
    
    try {
      // 使用正确的子节点API
      const url = `${this.config.baseUrl}/wiki/v2/spaces/${this.config.spaceId}/nodes?parent_node_token=${parentNodeToken}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 子节点API响应: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data?.items) {
          console.log(`✅ 成功获取 ${data.data.items.length} 个子节点`);
          return data.data.items;
        }
      } else {
        const errorText = await response.text();
        console.log('⚠️ 子节点获取失败:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log(`⚠️ 子节点请求失败: ${error.message}`);
    }
    
    return [];
  }

  // 获取文档内容 - 根据类型使用不同API
  async getDocumentContent(objToken, objType, title) {
    console.log(`📄 获取文档内容: ${title} (${objType})`);
    
    if (objType === 'docx') {
      return await this.getDocxContent(objToken, title);
    } else if (objType === 'sheet') {
      return await this.getSheetContent(objToken, title);
    }
    
    return null;
  }

  // 获取文档内容
  async getDocxContent(objToken, title) {
    try {
      const url = `${this.config.baseUrl}/docx/v1/documents/${objToken}/raw_content`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data?.content) {
          console.log(`✅ 成功获取文档内容: ${title} (${data.data.content.length}字符)`);
          return {
            type: 'docx',
            content: data.data.content,
            length: data.data.content.length
          };
        }
      }
    } catch (error) {
      console.log(`⚠️ 文档内容获取失败: ${error.message}`);
    }
    
    return null;
  }

  // 获取电子表格内容
  async getSheetContent(objToken, title) {
    try {
      // 首先获取表格基础信息
      const infoUrl = `${this.config.baseUrl}/sheets/v3/spreadsheets/${objToken}`;
      
      const infoResponse = await fetch(infoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log(`✅ 成功获取表格信息: ${title}`);
        
        // 尝试获取表格的工作表列表
        try {
          const sheetsUrl = `${this.config.baseUrl}/sheets/v3/spreadsheets/${objToken}/sheets`;
          const sheetsResponse = await fetch(sheetsUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (sheetsResponse.ok) {
            const sheetsData = await sheetsResponse.json();
            if (sheetsData.code === 0 && sheetsData.data?.sheets) {
              console.log(`✅ 获取到 ${sheetsData.data.sheets.length} 个工作表`);
              
              // 获取第一个工作表的数据
              const firstSheet = sheetsData.data.sheets[0];
              if (firstSheet) {
                const rangeUrl = `${this.config.baseUrl}/sheets/v2/spreadsheets/${objToken}/values/${firstSheet.sheet_id}!A1:Z100`;
                
                const rangeResponse = await fetch(rangeUrl, {
                  headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (rangeResponse.ok) {
                  const rangeData = await rangeResponse.json();
                  console.log(`✅ 成功获取表格数据: ${title}`);
                  
                  return {
                    type: 'sheet',
                    content: JSON.stringify(rangeData.data?.values || []),
                    sheetInfo: infoData.data?.spreadsheet,
                    sheets: sheetsData.data.sheets,
                    length: JSON.stringify(rangeData.data?.values || []).length
                  };
                }
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ 表格数据获取失败: ${error.message}`);
        }
        
        return {
          type: 'sheet',
          content: `表格: ${title}\\n基础信息: ${JSON.stringify(infoData.data?.spreadsheet || {})}`,
          sheetInfo: infoData.data?.spreadsheet,
          length: 100
        };
      }
    } catch (error) {
      console.log(`⚠️ 表格内容获取失败: ${error.message}`);
    }
    
    return null;
  }

  // 递归获取所有节点内容
  async processNodeRecursively(node, level = 0) {
    const indent = '  '.repeat(level);
    console.log(`${indent}🔍 处理节点: ${node.title} (${node.obj_type})`);
    
    const processedNode = {
      id: `node_${node.node_token}`,
      title: node.title,
      nodeToken: node.node_token,
      objToken: node.obj_token,
      objType: node.obj_type,
      level: level,
      type: 'wiki_node',
      source: 'SVTR飞书知识库',
      lastUpdated: new Date().toISOString().split('T')[0],
      metadata: {
        nodeToken: node.node_token,
        objToken: node.obj_token,
        objType: node.obj_type,
        hasChild: node.has_child,
        createTime: node.node_create_time,
        parentToken: node.parent_node_token || '',
        level: level
      }
    };

    // 获取文档内容
    const docContent = await this.getDocumentContent(node.obj_token, node.obj_type, node.title);
    if (docContent) {
      processedNode.content = docContent.content;
      processedNode.contentLength = docContent.length;
      processedNode.docType = docContent.type;
      
      if (docContent.sheetInfo) {
        processedNode.metadata.sheetInfo = docContent.sheetInfo;
      }
      if (docContent.sheets) {
        processedNode.metadata.sheets = docContent.sheets;
      }
    } else {
      processedNode.content = `节点: ${node.title}\\n类型: ${node.obj_type}\\n创建时间: ${new Date(parseInt(node.node_create_time) * 1000).toLocaleDateString()}`;
      processedNode.contentLength = processedNode.content.length;
    }

    // 生成搜索关键词
    processedNode.searchKeywords = this.generateKeywords(processedNode.title, processedNode.content);
    processedNode.semanticTags = this.generateSemanticTags(processedNode.title, processedNode.content);
    processedNode.ragScore = this.calculateRAGScore(processedNode.title, processedNode.content);

    this.knowledgeBase.push(processedNode);

    // 递归处理子节点
    if (node.has_child) {
      console.log(`${indent}🌲 获取子节点...`);
      const childNodes = await this.getChildNodes(node.node_token);
      
      if (childNodes.length > 0) {
        console.log(`${indent}✅ 找到 ${childNodes.length} 个子节点`);
        
        for (const childNode of childNodes) {
          await this.processNodeRecursively(childNode, level + 1);
        }
      }
    }

    return processedNode;
  }

  // 生成关键词
  generateKeywords(title, content) {
    const keywords = [];
    const text = (title + ' ' + content).toLowerCase();
    
    // AI创投相关关键词
    const patterns = [
      'ai', 'svtr', '创投', '投资', '融资', '硅谷科技评论', 'startup', 'venture', 
      'capital', '独角兽', '估值', '轮次', 'ipo', '上市', '公司', '机构', '创始人'
    ];
    
    patterns.forEach(pattern => {
      if (text.includes(pattern)) {
        keywords.push(pattern);
      }
    });
    
    // 提取标题中的关键词
    title.split(/[\\s,，、]+/).forEach(word => {
      if (word.length > 1) {
        keywords.push(word.toLowerCase());
      }
    });
    
    return [...new Set(keywords)];
  }

  // 生成语义标签
  generateSemanticTags(title, content) {
    const tags = [];
    const text = (title + ' ' + content).toLowerCase();
    
    const tagMappings = {
      'svtr_platform': ['svtr', '硅谷科技评论', '平台'],
      'investment_funding': ['投资', '融资', '估值', '轮次', 'funding', 'investment'],
      'artificial_intelligence': ['ai', '人工智能', '机器学习', '大模型'],
      'market_analysis': ['分析', '市场', '观察', '趋势', 'analysis', 'market'],
      'company_database': ['公司', '数据库', '排行榜', 'database', 'ranking'],
      'member_services': ['会员', '专区', '服务', 'member', 'vip']
    };
    
    Object.entries(tagMappings).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    });
    
    return tags;
  }

  // 计算RAG分数
  calculateRAGScore(title, content) {
    let score = 0;
    const text = title + ' ' + content;
    
    // 内容长度分数 (0-40分)
    score += Math.min(text.length / 100, 40);
    
    // 关键词密度分数 (0-30分)
    const keywords = ['ai', '投资', '创投', '融资', 'svtr', '公司', '分析'];
    const keywordCount = keywords.reduce((count, keyword) => {
      return count + (text.toLowerCase().split(keyword).length - 1);
    }, 0);
    score += Math.min(keywordCount * 3, 30);
    
    // 结构化程度分数 (0-20分)
    if (text.includes('•') || text.includes('1.') || text.includes('-')) score += 10;
    if (text.includes('：') || text.includes(':')) score += 5;
    if (text.includes('%') || text.includes('$') || text.includes('亿')) score += 5;
    
    // 专业性分数 (0-10分)
    const professionalTerms = ['估值', 'ipo', '独角兽', '轮次', '投资机构'];
    const professionalCount = professionalTerms.reduce((count, term) => {
      return count + (text.toLowerCase().includes(term) ? 1 : 0);
    }, 0);
    score += Math.min(professionalCount * 2, 10);
    
    return Math.round(score * 100) / 100;
  }

  // 主同步流程
  async runEnhancedSync() {
    console.log('🚀 开始增强版飞书知识库同步 V2..\\n');
    
    if (!await this.getAccessToken()) {
      throw new Error('认证失败');
    }

    try {
      // 获取根节点列表
      const rootNodes = await this.getChildNodes(''); // 空字符串获取根节点
      
      console.log(`📚 发现 ${rootNodes.length} 个根节点`);
      
      // 递归处理每个根节点
      for (const rootNode of rootNodes) {
        console.log(`\\n🎯 开始处理根节点: ${rootNode.title}`);
        await this.processNodeRecursively(rootNode, 0);
      }
      
      // 保存结果
      await this.saveResults();
      
      console.log('\\n🎉 增强版同步完成！');
      console.log(`📊 总计处理节点: ${this.knowledgeBase.length}`);
      console.log(`📝 平均内容长度: ${Math.round(this.knowledgeBase.reduce((sum, item) => sum + (item.contentLength || 0), 0) / this.knowledgeBase.length)}`);
      
    } catch (error) {
      console.error('❌ 同步失败:', error.message);
      throw error;
    }
  }

  // 保存结果
  async saveResults() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      
      const summary = {
        lastUpdated: new Date().toISOString(),
        totalNodes: this.knowledgeBase.length,
        nodesByLevel: {},
        nodesByType: {},
        avgContentLength: Math.round(this.knowledgeBase.reduce((sum, item) => sum + (item.contentLength || 0), 0) / this.knowledgeBase.length),
        avgRagScore: Math.round(this.knowledgeBase.reduce((sum, item) => sum + (item.ragScore || 0), 0) / this.knowledgeBase.length * 100) / 100,
        apiVersion: 'v2_enhanced',
        syncMethod: 'recursive_full_content',
        sourceInfo: {
          platform: 'SVTR飞书知识库',
          spaceId: this.config.spaceId,
          domain: this.config.wikiDomain,
          syncVersion: 'enhanced-feishu-sync-v2'
        }
      };
      
      // 统计各级别和类型的节点数量
      this.knowledgeBase.forEach(node => {
        const level = `level_${node.level || 0}`;
        const type = node.docType || node.objType || 'unknown';
        
        summary.nodesByLevel[level] = (summary.nodesByLevel[level] || 0) + 1;
        summary.nodesByType[type] = (summary.nodesByType[type] || 0) + 1;
      });
      
      const result = {
        summary,
        nodes: this.knowledgeBase
      };
      
      const outputFile = path.join(this.outputDir, 'enhanced-feishu-full-content.json');
      await fs.writeFile(outputFile, JSON.stringify(result, null, 2), 'utf8');
      
      console.log(`💾 结果保存到: ${outputFile}`);
      
    } catch (error) {
      console.error('❌ 保存失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  try {
    const syncer = new EnhancedFeishuSyncV2();
    await syncer.runEnhancedSync();
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 执行同步
if (require.main === module) {
  main();
}

module.exports = EnhancedFeishuSyncV2;