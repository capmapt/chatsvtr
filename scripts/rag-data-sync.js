#!/usr/bin/env node

/**
 * SVTR.AI RAG数据同步服务
 * 专为RAG系统设计的飞书知识库同步工具
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class SVTRRAGDataSync {
  constructor() {
    this.config = {
      appId: process.env.FEISHU_APP_ID,
      appSecret: process.env.FEISHU_APP_SECRET,
      baseUrl: 'https://open.feishu.cn/open-apis',
      
      // 知识库数据源配置
      dataSources: {
        // AI创投库 - 多维表格
        aiDatabase: {
          id: 'SRmKb3sSAauviCsf0cocnCWdnd2',
          type: 'bitable',
          name: 'AI创投库',
          tables: ['blkZ3RiwRz0nScoi'] // 主表ID
        },
        
        // AI创投榜 - 知识库文档
        aiRanking: {
          id: 'DI9Hw8v8tiZF2Xk13KDcDI8Bn1b',
          type: 'wiki',
          name: 'AI创投榜'
        },
        
        // AI创投会 - 知识库文档  
        aiMeetup: {
          id: 'N2MIwXwClitUy4k1JtvcYqfjnoe',
          type: 'wiki', 
          name: 'AI创投会'
        },
        
        // AI创投营 - 知识库文档
        aiCamp: {
          id: 'J3v0wuQyZicsIfkki94cSAC0njf',
          type: 'wiki',
          name: 'AI创投营'
        },
        
        // 关于我们 - 知识库文档
        aboutUs: {
          id: 'MFl0wpCVIigeQVkIifVcsgEcnJc',
          type: 'wiki',
          name: '关于我们'
        }
      }
    };
    
    this.accessToken = null;
    this.outputDir = path.join(__dirname, '../assets/data/rag');
    this.knowledgeBase = [];
  }

  /**
   * 获取飞书访问token
   */
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
        return this.accessToken;
      } else {
        throw new Error(`认证失败: ${data.msg}`);
      }
    } catch (error) {
      console.error('❌ 飞书认证失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取知识库文档内容
   */
  async getWikiDocument(documentId) {
    if (!this.accessToken) await this.getAccessToken();
    
    // 获取文档基本信息
    const infoUrl = `${this.config.baseUrl}/wiki/v2/spaces/${documentId}`;
    
    try {
      const infoResponse = await fetch(infoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const infoData = await infoResponse.json();
      
      if (infoData.code !== 0) {
        console.log(`⚠️ 无法获取文档信息 ${documentId}: ${infoData.msg}`);
        return null;
      }
      
      // 获取文档节点列表
      const nodesUrl = `${this.config.baseUrl}/wiki/v2/spaces/${documentId}/nodes`;
      
      const nodesResponse = await fetch(nodesUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const nodesData = await nodesResponse.json();
      
      if (nodesData.code !== 0) {
        console.log(`⚠️ 无法获取文档节点 ${documentId}: ${nodesData.msg}`);
        return null;
      }
      
      const documents = [];
      
      // 遍历所有节点，获取文档内容
      for (const node of nodesData.data.items || []) {
        try {
          const contentUrl = `${this.config.baseUrl}/wiki/v2/spaces/${documentId}/nodes/${node.node_token}/content`;
          
          const contentResponse = await fetch(contentUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const contentData = await contentResponse.json();
          
          if (contentData.code === 0) {
            documents.push({
              id: `${documentId}_${node.node_token}`,
              title: node.title || '未命名文档',
              content: this.extractTextFromContent(contentData.data.content),
              type: 'wiki',
              source: `飞书知识库`,
              nodeToken: node.node_token,
              lastUpdated: new Date().toISOString(),
              metadata: {
                spaceId: documentId,
                nodeType: node.node_type,
                hasChildren: node.has_child || false
              }
            });
            
            console.log(`✅ 成功获取文档: ${node.title}`);
          }
        } catch (error) {
          console.log(`⚠️ 获取节点内容失败 ${node.node_token}: ${error.message}`);
        }
      }
      
      return documents;
      
    } catch (error) {
      console.error(`❌ 获取知识库文档失败 ${documentId}:`, error.message);
      return null;
    }
  }

  /**
   * 获取多维表格数据
   */
  async getBitableData(baseId, tableId) {
    if (!this.accessToken) await this.getAccessToken();
    
    try {
      // 获取表格信息
      const tablesUrl = `${this.config.baseUrl}/bitable/v1/apps/${baseId}/tables`;
      
      const tablesResponse = await fetch(tablesUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const tablesData = await tablesResponse.json();
      
      if (tablesData.code !== 0) {
        console.log(`⚠️ 无法获取表格信息 ${baseId}: ${tablesData.msg}`);
        return null;
      }
      
      const documents = [];
      
      // 遍历所有表格
      for (const table of tablesData.data.items || []) {
        try {
          // 获取表格记录
          const recordsUrl = `${this.config.baseUrl}/bitable/v1/apps/${baseId}/tables/${table.table_id}/records`;
          
          const recordsResponse = await fetch(recordsUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const recordsData = await recordsResponse.json();
          
          if (recordsData.code === 0) {
            // 处理每条记录
            for (const record of recordsData.data.items || []) {
              const processedRecord = this.processTableRecord(record, table.name);
              if (processedRecord) {
                documents.push({
                  id: `${baseId}_${table.table_id}_${record.record_id}`,
                  title: processedRecord.title,
                  content: processedRecord.content,
                  type: 'bitable',
                  source: '飞书多维表格',
                  lastUpdated: new Date().toISOString(),
                  metadata: {
                    baseId: baseId,
                    tableId: table.table_id,
                    tableName: table.name,
                    recordId: record.record_id,
                    ...processedRecord.metadata
                  }
                });
              }
            }
            
            console.log(`✅ 成功获取表格: ${table.name} (${recordsData.data.items?.length || 0} 条记录)`);
          }
        } catch (error) {
          console.log(`⚠️ 获取表格记录失败 ${table.table_id}: ${error.message}`);
        }
      }
      
      return documents;
      
    } catch (error) {
      console.error(`❌ 获取多维表格失败 ${baseId}:`, error.message);
      return null;
    }
  }

  /**
   * 从飞书文档内容中提取纯文本
   */
  extractTextFromContent(content) {
    if (!content) return '';
    
    // 简单的文本提取，实际可能需要更复杂的解析
    if (typeof content === 'string') {
      return content.replace(/<[^>]*>/g, '').trim(); // 移除HTML标签
    }
    
    if (typeof content === 'object') {
      return JSON.stringify(content); // 暂时转为JSON字符串
    }
    
    return String(content);
  }

  /**
   * 处理表格记录，提取有价值的信息
   */
  processTableRecord(record, tableName) {
    const fields = record.fields || {};
    
    // 尝试找到标题字段
    const titleField = fields['公司名称'] || fields['名称'] || fields['标题'] || fields['title'] || fields['name'];
    if (!titleField) return null;
    
    // 构建内容
    const contentParts = [];
    
    for (const [key, value] of Object.entries(fields)) {
      if (value && typeof value === 'string' && value.trim()) {
        contentParts.push(`${key}: ${value.trim()}`);
      } else if (Array.isArray(value) && value.length > 0) {
        contentParts.push(`${key}: ${value.join(', ')}`);
      }
    }
    
    return {
      title: String(titleField),
      content: contentParts.join('\n'),
      metadata: {
        tableName: tableName,
        recordFields: Object.keys(fields),
        // 提取特定字段作为元数据
        company: fields['公司名称'],
        industry: fields['行业'] || fields['赛道'],
        round: fields['轮次'],
        valuation: fields['估值'],
        investor: fields['投资机构']
      }
    };
  }

  /**
   * 同步所有数据源
   */
  async syncAllData() {
    console.log('🚀 开始同步SVTR知识库数据...\n');
    
    // 确保输出目录存在
    await fs.mkdir(this.outputDir, { recursive: true });
    
    for (const [key, source] of Object.entries(this.config.dataSources)) {
      console.log(`📚 同步数据源: ${source.name}`);
      
      try {
        let documents = null;
        
        if (source.type === 'wiki') {
          documents = await this.getWikiDocument(source.id);
        } else if (source.type === 'bitable') {
          documents = await this.getBitableData(source.id, source.tables?.[0]);
        }
        
        if (documents && documents.length > 0) {
          this.knowledgeBase.push(...documents);
          console.log(`✅ ${source.name}: ${documents.length} 个文档\n`);
        } else {
          console.log(`⚠️ ${source.name}: 未获取到数据\n`);
        }
        
        // 避免API频率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ 同步 ${source.name} 失败:`, error.message);
      }
    }
    
    await this.saveKnowledgeBase();
  }

  /**
   * 保存知识库数据
   */
  async saveKnowledgeBase() {
    const outputFile = path.join(this.outputDir, 'knowledge-base.json');
    
    const summary = {
      lastUpdated: new Date().toISOString(),
      totalDocuments: this.knowledgeBase.length,
      sources: this.config.dataSources,
      statistics: this.generateStatistics()
    };
    
    const output = {
      summary,
      documents: this.knowledgeBase
    };
    
    await fs.writeFile(outputFile, JSON.stringify(output, null, 2));
    
    console.log(`\n📊 同步完成统计:`);
    console.log(`总计文档: ${this.knowledgeBase.length}`);
    console.log(`知识库文档: ${summary.statistics.wikiDocuments}`);
    console.log(`表格记录: ${summary.statistics.bitableRecords}`);
    console.log(`保存位置: ${outputFile}`);
  }

  /**
   * 生成统计信息
   */
  generateStatistics() {
    const stats = {
      wikiDocuments: 0,
      bitableRecords: 0,
      totalCharacters: 0,
      averageLength: 0
    };
    
    for (const doc of this.knowledgeBase) {
      if (doc.type === 'wiki') {
        stats.wikiDocuments++;
      } else if (doc.type === 'bitable') {
        stats.bitableRecords++;
      }
      
      stats.totalCharacters += doc.content.length;
    }
    
    stats.averageLength = Math.round(stats.totalCharacters / this.knowledgeBase.length);
    
    return stats;
  }
}

// 主函数
async function main() {
  const syncService = new SVTRRAGDataSync();
  
  try {
    await syncService.syncAllData();
    console.log('\n🎉 SVTR知识库同步完成！');
  } catch (error) {
    console.error('\n❌ 同步失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { SVTRRAGDataSync };