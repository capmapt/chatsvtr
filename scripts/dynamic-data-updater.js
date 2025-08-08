#!/usr/bin/env node

/**
 * 动态数据更新器
 * 基于网络搜索和RAG系统的实时数据修复
 * 绝不编造数据，只使用可验证的来源
 */

const fs = require('fs');
const path = require('path');

class DynamicDataUpdater {
  constructor() {
    this.dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    this.logFile = path.join(__dirname, '../logs/dynamic-data-update.json');
    
    // 支持的数据源优先级
    this.dataSources = {
      primary: 'feishu_rag',        // 飞书RAG系统 (最高优先级)
      secondary: 'web_search',      // 网络实时搜索
      fallback: 'placeholder'       // 占位符标记 (最后选择)
    };
    
    // 需要更新的实体列表
    this.targetEntities = [
      {
        name: 'anthropic',
        searchQueries: [
          'Anthropic latest funding round 2025',
          'Anthropic valuation 2025',
          'Anthropic Series E funding'
        ],
        expectedFields: ['funding', 'valuation', 'investors', 'date']
      },
      {
        name: 'openai', 
        searchQueries: [
          'OpenAI latest valuation 2025',
          'OpenAI funding round 2025',
          'OpenAI SoftBank investment'
        ],
        expectedFields: ['funding', 'valuation', 'investors', 'date']
      },
      {
        name: 'svtr',
        ragQueries: [
          'SVTR创始人',
          '硅谷科技评论创始人',
          'Min Liu Allen SVTR'
        ],
        expectedFields: ['founder', 'established', 'mission']
      }
    ];
  }

  async updateDataDynamically() {
    console.log('🔄 启动动态数据更新器...\n');

    const updateLog = {
      timestamp: new Date().toISOString(),
      summary: {
        totalEntities: this.targetEntities.length,
        updatedEntities: 0,
        dataSourcesUsed: {},
        issuesFound: 0
      },
      updates: [],
      sources: [],
      errors: []
    };

    try {
      // 1. 检查RAG系统数据完整性
      const ragData = await this.loadRAGData();
      console.log(`📊 RAG数据加载：${ragData.nodes?.length || 0}个节点`);

      // 2. 对每个目标实体进行动态更新
      for (const entity of this.targetEntities) {
        console.log(`\n🎯 处理实体: ${entity.name}`);
        const entityUpdate = await this.updateEntityData(entity, ragData);
        
        if (entityUpdate.updated) {
          updateLog.summary.updatedEntities++;
          updateLog.updates.push(entityUpdate);
        }
        
        if (entityUpdate.issues.length > 0) {
          updateLog.summary.issuesFound += entityUpdate.issues.length;
        }
      }

      // 3. 更新数据源统计
      updateLog.summary.dataSourcesUsed = this.getDataSourceStats(updateLog.updates);

      // 4. 应用更新到RAG数据
      if (updateLog.summary.updatedEntities > 0) {
        await this.applyUpdatesToRAGData(ragData, updateLog.updates);
        console.log(`\n✅ 已应用${updateLog.summary.updatedEntities}个实体的更新`);
      } else {
        console.log('\n💡 未发现需要更新的数据');
      }

      // 5. 保存更新日志
      await this.saveUpdateLog(updateLog);

      // 6. 显示更新摘要
      this.displayUpdateSummary(updateLog);

      return updateLog;

    } catch (error) {
      updateLog.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      
      console.error('❌ 动态数据更新失败:', error.message);
      throw error;
    }
  }

  async loadRAGData() {
    try {
      if (!fs.existsSync(this.dataFile)) {
        throw new Error('RAG数据文件不存在，请先运行数据同步');
      }

      const rawData = fs.readFileSync(this.dataFile, 'utf8');
      return JSON.parse(rawData);
    } catch (error) {
      throw new Error(`加载RAG数据失败: ${error.message}`);
    }
  }

  async updateEntityData(entity, ragData) {
    const entityUpdate = {
      entity: entity.name,
      updated: false,
      dataSource: null,
      newData: {},
      issues: [],
      confidence: 0
    };

    try {
      // 策略1: 从RAG系统查找现有数据
      const ragResult = await this.searchInRAGData(entity, ragData);
      if (ragResult.found && ragResult.completeness >= 0.8) {
        console.log(`✅ RAG系统已有完整的${entity.name}数据 (完整度: ${(ragResult.completeness * 100).toFixed(1)}%)`);
        entityUpdate.dataSource = this.dataSources.primary;
        entityUpdate.confidence = ragResult.completeness;
        return entityUpdate;
      }

      // 策略2: 检查是否存在数据缺失问题
      const missingData = this.identifyMissingData(entity, ragResult.data);
      if (missingData.length === 0) {
        console.log(`✅ ${entity.name}数据完整，无需更新`);
        return entityUpdate;
      }

      console.log(`⚠️ ${entity.name}发现${missingData.length}个数据缺失问题:`);
      missingData.forEach(issue => {
        console.log(`   - ${issue}`);
        entityUpdate.issues.push(issue);
      });

      // 策略3: 生成占位符建议（不进行网络搜索）
      entityUpdate.newData = this.generatePlaceholderData(entity, missingData);
      entityUpdate.dataSource = this.dataSources.fallback;
      entityUpdate.updated = true;
      entityUpdate.confidence = 0.3; // 低置信度，因为是占位符

      console.log(`💡 已生成${entity.name}的占位符数据，建议手动更新`);

      return entityUpdate;

    } catch (error) {
      entityUpdate.issues.push(`处理${entity.name}时出错: ${error.message}`);
      return entityUpdate;
    }
  }

  async searchInRAGData(entity, ragData) {
    const result = {
      found: false,
      completeness: 0,
      data: {},
      matchingNodes: []
    };

    try {
      if (!ragData.nodes || !Array.isArray(ragData.nodes)) {
        return result;
      }

      // 搜索相关节点
      const searchTerms = this.getEntitySearchTerms(entity);
      const matchingNodes = [];

      ragData.nodes.forEach(node => {
        const content = (node.content || '').toLowerCase();
        const title = (node.title || '').toLowerCase();
        const combinedText = content + ' ' + title;

        let relevanceScore = 0;
        searchTerms.forEach(term => {
          if (combinedText.includes(term.toLowerCase())) {
            relevanceScore += term.length > 4 ? 2 : 1;
          }
        });

        if (relevanceScore > 0) {
          matchingNodes.push({
            ...node,
            relevanceScore
          });
        }
      });

      if (matchingNodes.length > 0) {
        result.found = true;
        result.matchingNodes = matchingNodes.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // 评估数据完整性
        result.completeness = this.assessDataCompleteness(entity, result.matchingNodes);
        result.data = this.extractEntityDataFromNodes(entity, result.matchingNodes);
      }

      return result;

    } catch (error) {
      console.warn(`RAG数据搜索失败: ${error.message}`);
      return result;
    }
  }

  getEntitySearchTerms(entity) {
    const baseTerms = [entity.name];
    
    switch (entity.name) {
      case 'anthropic':
        return [...baseTerms, 'claude', '人工智能', '大模型', 'ai安全'];
      case 'openai':
        return [...baseTerms, 'chatgpt', 'gpt', 'sam altman'];  
      case 'svtr':
        return [...baseTerms, '硅谷科技评论', 'min liu', 'allen', '创始人'];
      default:
        return baseTerms;
    }
  }

  assessDataCompleteness(entity, nodes) {
    const combinedContent = nodes.map(n => n.content || '').join(' ').toLowerCase();
    let score = 0;
    let totalFields = entity.expectedFields.length;

    entity.expectedFields.forEach(field => {
      switch (field) {
        case 'funding':
          if (combinedContent.includes('融资') || combinedContent.includes('funding')) {
            // 检查是否有具体数字而非占位符
            if (!/xx\s*[万千亿]/.test(combinedContent) && /\d+[万千亿]/.test(combinedContent)) {
              score += 1;
            } else {
              score += 0.3; // 有提及但数据不完整
            }
          }
          break;
        case 'valuation':
          if (combinedContent.includes('估值') || combinedContent.includes('valuation')) {
            if (!/xx\s*[万千亿]/.test(combinedContent) && /\d+[万千亿]/.test(combinedContent)) {
              score += 1;
            } else {
              score += 0.3;
            }
          }
          break;
        case 'founder':
          if (combinedContent.includes('创始人') || combinedContent.includes('founder')) {
            if (!combinedContent.includes('创始人：\n') && !combinedContent.includes('founder:')) {
              score += 1;
            } else {
              score += 0.3;
            }
          }
          break;
        default:
          // 通用字段检查
          if (combinedContent.includes(field)) {
            score += 0.5;
          }
          break;
      }
    });

    return Math.min(score / totalFields, 1.0);
  }

  extractEntityDataFromNodes(entity, nodes) {
    const data = {};
    const combinedContent = nodes.map(n => n.content || '').join('\n');

    // 根据实体类型提取结构化数据
    switch (entity.name) {
      case 'anthropic':
      case 'openai':
        data.latestFunding = this.extractFundingInfo(combinedContent);
        data.valuation = this.extractValuationInfo(combinedContent);
        data.investors = this.extractInvestorInfo(combinedContent);
        break;
      case 'svtr':
        data.founder = this.extractFounderInfo(combinedContent);
        data.mission = this.extractMissionInfo(combinedContent);
        break;
    }

    return data;
  }

  extractFundingInfo(content) {
    const fundingPatterns = [
      /(\d+(?:\.\d+)?)\s*([万千亿])\s*美?元?\s*融资/g,
      /融资\s*(\d+(?:\.\d+)?)\s*([万千亿])\s*美?元?/g
    ];

    for (const pattern of fundingPatterns) {
      const match = content.match(pattern);
      if (match && !match[0].includes('xx')) {
        return match[0];
      }
    }

    return null;
  }

  extractValuationInfo(content) {
    const valuationPatterns = [
      /估值\s*(\d+(?:\.\d+)?)\s*([万千亿])\s*美?元?/g,
      /(\d+(?:\.\d+)?)\s*([万千亿])\s*美?元?\s*估值/g
    ];

    for (const pattern of valuationPatterns) {
      const match = content.match(pattern);
      if (match && !match[0].includes('xx')) {
        return match[0];
      }
    }

    return null;
  }

  extractFounderInfo(content) {
    const founderPatterns = [
      /创始人[：:]\s*([^\n\r,，。]+)/g,
      /founder[：:]\s*([^\n\r,，。]+)/gi
    ];

    for (const pattern of founderPatterns) {
      const match = content.match(pattern);
      if (match && match[1] && match[1].trim().length > 0 && !match[1].includes('：')) {
        return match[1].trim();
      }
    }

    return null;
  }

  extractInvestorInfo(content) {
    // 简单的投资方信息提取
    const investorKeywords = ['投资方', '投资人', '领投', '参投', 'investor', 'led by'];
    for (const keyword of investorKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        // 这里可以添加更复杂的投资方提取逻辑
        return '已在内容中提及';
      }
    }
    return null;
  }

  extractMissionInfo(content) {
    const missionKeywords = ['专注', '定位', '致力于', 'focus', 'mission'];
    for (const keyword of missionKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return '已在内容中描述';
      }
    }
    return null;
  }

  identifyMissingData(entity, ragData) {
    const issues = [];
    
    entity.expectedFields.forEach(field => {
      const hasData = ragData[field];
      if (!hasData) {
        issues.push(`缺少${field}信息`);
      }
    });

    return issues;
  }

  generatePlaceholderData(entity, missingData) {
    const placeholderData = {};
    
    missingData.forEach(issue => {
      if (issue.includes('funding')) {
        placeholderData.funding_note = `[需要更新] ${entity.name}最新融资信息 - 建议从官方公告或权威媒体获取`;
      }
      if (issue.includes('valuation')) {
        placeholderData.valuation_note = `[需要更新] ${entity.name}最新估值信息 - 建议从投资数据库获取`;
      }
      if (issue.includes('founder')) {
        placeholderData.founder_note = `[需要更新] ${entity.name}创始人信息 - 建议从公司官网获取`;
      }
    });

    placeholderData.update_required = true;
    placeholderData.last_check = new Date().toISOString();
    placeholderData.data_source_needed = '网络搜索或官方公告';

    return placeholderData;
  }

  getDataSourceStats(updates) {
    const stats = {};
    updates.forEach(update => {
      stats[update.dataSource] = (stats[update.dataSource] || 0) + 1;
    });
    return stats;
  }

  async applyUpdatesToRAGData(ragData, updates) {
    // 为每个更新创建新的节点或更新现有节点
    updates.forEach(update => {
      if (update.updated && Object.keys(update.newData).length > 0) {
        // 添加数据更新标记到相关节点
        const updateNode = {
          id: `update_${update.entity}_${Date.now()}`,
          title: `${update.entity.toUpperCase()}数据更新建议`,
          content: this.formatUpdateNote(update),
          type: 'data_update_note',
          source: 'Dynamic Data Updater',
          lastUpdated: new Date().toISOString(),
          metadata: {
            entityName: update.entity,
            dataSource: update.dataSource,
            confidence: update.confidence,
            updateRequired: true
          }
        };
        
        ragData.nodes = ragData.nodes || [];
        ragData.nodes.push(updateNode);
      }
    });

    // 更新汇总信息
    if (ragData.summary) {
      ragData.summary.lastDataUpdate = new Date().toISOString();
      ragData.summary.pendingUpdates = updates.filter(u => u.updated).length;
    }

    // 保存更新后的数据
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(ragData, null, 2));
      console.log(`✅ RAG数据已更新并保存`);
    } catch (error) {
      throw new Error(`保存RAG数据失败: ${error.message}`);
    }
  }

  formatUpdateNote(update) {
    let note = `# ${update.entity.toUpperCase()} 数据更新建议\n\n`;
    note += `**数据来源**: ${update.dataSource}\n`;
    note += `**置信度**: ${(update.confidence * 100).toFixed(1)}%\n`;
    note += `**更新时间**: ${new Date().toLocaleString('zh-CN')}\n\n`;

    if (update.issues.length > 0) {
      note += `## 发现的问题:\n`;
      update.issues.forEach(issue => {
        note += `- ${issue}\n`;
      });
      note += '\n';
    }

    if (Object.keys(update.newData).length > 0) {
      note += `## 建议的数据更新:\n`;
      Object.entries(update.newData).forEach(([key, value]) => {
        note += `- **${key}**: ${value}\n`;
      });
      note += '\n';
    }

    note += `## 建议操作:\n`;
    note += `1. 从权威来源获取${update.entity}的最新准确信息\n`;
    note += `2. 手动更新相关RAG节点内容\n`;  
    note += `3. 验证数据准确性后移除此更新建议\n\n`;
    note += `**重要**: 请勿使用未经验证的信息，确保所有数据来自可靠来源。`;

    return note;
  }

  async saveUpdateLog(log) {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(this.logFile, JSON.stringify(log, null, 2));
      console.log(`📝 动态更新日志已保存: ${this.logFile}`);
    } catch (error) {
      console.warn('保存更新日志失败:', error.message);
    }
  }

  displayUpdateSummary(log) {
    console.log('\n🎯 动态数据更新摘要');
    console.log('='*50);
    console.log(`📊 处理实体: ${log.summary.totalEntities}个`);
    console.log(`✅ 更新实体: ${log.summary.updatedEntities}个`);
    console.log(`⚠️  发现问题: ${log.summary.issuesFound}个`);

    if (Object.keys(log.summary.dataSourcesUsed).length > 0) {
      console.log('\n📈 数据源使用统计:');
      Object.entries(log.summary.dataSourcesUsed).forEach(([source, count]) => {
        const sourceName = {
          'feishu_rag': 'RAG系统',
          'web_search': '网络搜索', 
          'placeholder': '占位符标记'
        }[source] || source;
        console.log(`   ${sourceName}: ${count}个`);
      });
    }

    if (log.updates.length > 0) {
      console.log('\n📋 更新详情:');
      log.updates.forEach((update, index) => {
        const confidence = (update.confidence * 100).toFixed(1);
        console.log(`${index + 1}. ${update.entity}: ${update.dataSource} (置信度: ${confidence}%)`);
        if (update.issues.length > 0) {
          console.log(`   问题: ${update.issues.join(', ')}`);
        }
      });
    }

    if (log.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      log.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.error}`);
      });
    }

    console.log('\n💡 重要提醒:');
    console.log('1. 动态更新器不会编造数据，只会标记需要更新的内容');
    console.log('2. 请从权威来源手动获取最新准确信息');
    console.log('3. 所有数据更新都应该经过人工验证');
    console.log('4. 建议定期运行此工具检查数据完整性');
  }
}

// 主函数
async function main() {
  console.log('🔄 SVTR 动态数据更新器启动\n');

  try {
    const updater = new DynamicDataUpdater();
    const result = await updater.updateDataDynamically();
    
    console.log('\n🎉 动态数据更新完成！');
    
    if (result.summary.updatedEntities > 0) {
      console.log('\n📌 下一步操作建议:');
      console.log('1. 检查生成的更新建议');
      console.log('2. 从权威来源获取准确数据');
      console.log('3. 手动更新RAG系统内容');
      console.log('4. 重新运行质量检查');
    }
    
  } catch (error) {
    console.error('💥 动态数据更新失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DynamicDataUpdater;