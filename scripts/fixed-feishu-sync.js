#!/usr/bin/env node

/**
 * 修复版飞书知识库同步脚本 
 * 使用正确的metainfo API获取工作表ID，解决数据获取问题
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class FixedFeishuSync {
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

  // 将数字转换为Excel列标识符 (1->A, 26->Z, 27->AA)
  numberToColumn(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result || 'A';
  }

  // 获取文档内容 - 根据类型使用不同API
  async getDocumentContent(objToken, objType, title) {
    console.log(`📄 获取文档内容: ${title} (${objType})`);
    
    if (objType === 'docx') {
      return await this.getDocxContent(objToken, title);
    } else if (objType === 'sheet') {
      return await this.getSheetContentFixed(objToken, title);
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

  // 修复版表格内容获取 - 使用正确的metainfo API
  async getSheetContentFixed(objToken, title) {
    try {
      // 使用metainfo API获取正确的工作表信息
      const metaUrl = `${this.config.baseUrl}/sheets/v2/spreadsheets/${objToken}/metainfo`;
      
      const metaResponse = await fetch(metaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!metaResponse.ok) {
        console.log(`⚠️ 表格metainfo获取失败: ${metaResponse.status}`);
        return null;
      }
      
      const metaData = await metaResponse.json();
      
      if (metaData.code !== 0 || !metaData.data?.sheets) {
        console.log(`⚠️ 表格metainfo解析失败`);
        return null;
      }
      
      const sheetsInfo = metaData.data.sheets;
      console.log(`✅ 成功获取表格信息: ${title} - 发现 ${sheetsInfo.length} 个工作表`);
      
      // 获取所有工作表的数据
      const allSheetsData = [];
      let totalProcessedCells = 0;
      
      for (const [index, sheetInfo] of sheetsInfo.entries()) {
        const sheetId = sheetInfo.sheetId;
        const sheetTitle = sheetInfo.title;
        const rowCount = sheetInfo.rowCount || 0;
        const colCount = sheetInfo.columnCount || 0;
        
        console.log(`📊 处理工作表 ${index + 1}/${sheetsInfo.length}: "${sheetTitle}" (${rowCount}行 × ${colCount}列)`);
        
        // 计算最优的数据获取范围 - 限制大小以避免API超时
        const maxRows = Math.min(rowCount, 1500); // 限制最大行数
        const maxCols = Math.min(colCount, 40); // 限制最大列数
        
        if (maxRows > 0 && maxCols > 0) {
          const endColumn = this.numberToColumn(maxCols);
          const range = `A1:${endColumn}${maxRows}`;
          
          console.log(`🔍 获取范围: ${range}`);
          
          try {
            const dataUrl = `${this.config.baseUrl}/sheets/v2/spreadsheets/${objToken}/values/${sheetId}!${range}`;
            
            const dataResponse = await fetch(dataUrl, {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (dataResponse.ok) {
              const data = await dataResponse.json();
              
              if (data.code === 0) {
                const values = data.data?.values || [];
                
                if (values.length > 0) {
                  const cellCount = values.reduce((sum, row) => sum + row.length, 0);
                  totalProcessedCells += cellCount;
                  
                  allSheetsData.push({
                    sheetName: sheetTitle,
                    sheetId: sheetId,
                    data: values,
                    rowCount: values.length,
                    cellCount: cellCount,
                    range: range,
                    method: 'metainfo_fixed'
                  });
                  
                  console.log(`✅ "${sheetTitle}" 成功: ${values.length}行, ${cellCount}个单元格`);
                } else {
                  console.log(`⚠️ "${sheetTitle}" 返回0行数据`);
                }
              } else {
                console.log(`⚠️ "${sheetTitle}" API错误: ${data.msg}`);
              }
            } else {
              console.log(`⚠️ "${sheetTitle}" HTTP错误: ${dataResponse.status}`);
            }
          } catch (sheetError) {
            console.log(`⚠️ "${sheetTitle}" 处理异常: ${sheetError.message}`);
          }
        } else {
          console.log(`⚠️ "${sheetTitle}" 跳过 - 无有效尺寸`);
        }
        
        // 添加延迟避免API限制
        if (index < sheetsInfo.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      if (allSheetsData.length > 0 && totalProcessedCells > 0) {
        // 构建结构化的表格内容
        const structuredContent = this.buildStructuredSheetContent(title, allSheetsData, metaData.data?.properties);
        
        console.log(`🎉 表格 "${title}" 数据获取完成: ${allSheetsData.length}个工作表, ${totalProcessedCells}个单元格`);
        console.log(`📊 内容长度: ${structuredContent.length} 字符 (相比原来的100字符增加了 ${Math.round(structuredContent.length/100)}x)`);
        
        return {
          type: 'sheet',
          content: structuredContent,
          sheetInfo: metaData.data?.properties,
          allSheetsData: allSheetsData,
          totalCells: totalProcessedCells,
          length: structuredContent.length,
          optimized: true
        };
      } else {
        console.log(`⚠️ 表格 "${title}" 无法获取有效数据，使用降级方案`);
        
        // 降级方案：如果无法获取详细数据，至少保存基本信息
        const fallbackContent = this.buildFallbackSheetContent(title, metaData.data?.properties);
        
        return {
          type: 'sheet',
          content: fallbackContent,
          sheetInfo: metaData.data?.properties,
          length: fallbackContent.length,
          optimized: false
        };
      }
      
    } catch (error) {
      console.log(`⚠️ 表格内容获取失败: ${error.message}`);
    }
    
    return null;
  }

  // 构建结构化的表格内容
  buildStructuredSheetContent(title, allSheetsData, sheetInfo) {
    let content = `# ${title}\n\n`;
    
    // 添加表格基本信息
    if (sheetInfo) {
      content += `**表格信息：**\n`;
      content += `- 标题: ${sheetInfo.title || title}\n`;
      content += `- 总工作表数量: ${sheetInfo.sheetCount || allSheetsData.length}\n`;
      content += `- 版本: ${sheetInfo.revision || '未知'}\n\n`;
    }
    
    // 处理每个工作表的数据
    allSheetsData.forEach((sheetData, index) => {
      content += `## 工作表 ${index + 1}: ${sheetData.sheetName}\n\n`;
      content += `**数据规模：** ${sheetData.rowCount}行 × ${Math.max(...sheetData.data.map(row => row.length))}列 (${sheetData.cellCount}个单元格)\n\n`;
      
      if (sheetData.data.length > 0) {
        // 添加表头
        const headers = sheetData.data[0] || [];
        if (headers.length > 0) {
          content += `**列标题：** ${headers.join(' | ')}\n\n`;
        }
        
        // 添加数据行（控制数量以控制大小）
        const maxRows = Math.min(sheetData.data.length, 100); // 每个工作表最多100行
        content += `**数据内容（前${maxRows}行）：**\n`;
        
        for (let i = 0; i < maxRows; i++) {
          const row = sheetData.data[i] || [];
          if (row.some(cell => cell && cell.toString().trim())) { // 只包含非空行
            content += `${i + 1}. ${row.join(' | ')}\n`;
          }
        }
        
        if (sheetData.data.length > maxRows) {
          content += `\n... 还有 ${sheetData.data.length - maxRows} 行数据\n`;
        }
        
        content += '\n';
      }
    });
    
    return content;
  }

  // 降级方案的表格内容
  buildFallbackSheetContent(title, sheetInfo) {
    let content = `# ${title}\n\n`;
    content += `**状态：** 基础信息获取成功，详细数据获取失败\n\n`;
    
    if (sheetInfo) {
      content += `**表格信息：**\n`;
      content += `- 标题: ${sheetInfo.title || title}\n`;
      content += `- 总工作表数量: ${sheetInfo.sheetCount || '未知'}\n`;
      content += `- 版本: ${sheetInfo.revision || '未知'}\n\n`;
    }
    
    content += `**备注：** 这是一个飞书表格文档，包含AI创投相关数据。由于API限制，无法获取详细数据内容。\n`;
    
    return content;
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
      if (docContent.allSheetsData) {
        processedNode.metadata.allSheetsData = docContent.allSheetsData;
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
    title.split(/[\s,，、]+/).forEach(word => {
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
  async runFixedSync() {
    console.log('🚀 开始修复版飞书知识库同步...\n');
    
    if (!await this.getAccessToken()) {
      throw new Error('认证失败');
    }

    try {
      // 获取根节点列表
      const rootNodes = await this.getChildNodes(''); // 空字符串获取根节点
      
      console.log(`📚 发现 ${rootNodes.length} 个根节点`);
      
      // 递归处理每个根节点
      for (const rootNode of rootNodes) {
        console.log(`\n🎯 开始处理根节点: ${rootNode.title}`);
        await this.processNodeRecursively(rootNode, 0);
      }
      
      // 保存结果
      await this.saveResults();
      
      console.log('\n🎉 修复版同步完成！');
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
        apiVersion: 'v2_fixed',
        syncMethod: 'metainfo_based_full_content',
        sourceInfo: {
          platform: 'SVTR飞书知识库',
          spaceId: this.config.spaceId,
          domain: this.config.wikiDomain,
          syncVersion: 'fixed-feishu-sync'
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
    const syncer = new FixedFeishuSync();
    await syncer.runFixedSync();
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

// 执行同步
if (require.main === module) {
  main();
}

module.exports = FixedFeishuSync;