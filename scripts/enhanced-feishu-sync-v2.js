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
      wikiDomain: 'svtrglobal.feishu.cn',
      // API限流配置
      rateLimitDelay: 300, // 每次API调用间隔300ms
      requestTimeout: 30000, // 30秒请求超时
      maxRetries: 3 // 最大重试次数
    };
    
    this.accessToken = null;
    this.outputDir = path.join(__dirname, '../assets/data/rag');
    this.knowledgeBase = [];
    this.apiCallCount = 0;
    this.startTime = Date.now();
  }

  // API速率限制和重试机制
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async fetchWithTimeout(url, options, timeout = this.config.requestTimeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`请求超时 (${timeout}ms)`)), timeout);
    });
    
    return Promise.race([
      fetch(url, options),
      timeoutPromise
    ]);
  }
  
  async apiCallWithRetry(url, options, context = '') {
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // API调用前延迟
        if (this.apiCallCount > 0) {
          await this.sleep(this.config.rateLimitDelay);
        }
        
        this.apiCallCount++;
        console.log(`🔄 API调用 #${this.apiCallCount}: ${context} (尝试 ${attempt}/${this.config.maxRetries})`);
        
        const response = await this.fetchWithTimeout(url, options);
        return response;
        
      } catch (error) {
        lastError = error;
        console.log(`⚠️ API调用失败 (尝试 ${attempt}/${this.config.maxRetries}): ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ 等待 ${backoffDelay}ms 后重试...`);
          await this.sleep(backoffDelay);
        }
      }
    }
    
    throw lastError;
  }
  
  logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const memUsage = process.memoryUsage();
    console.log(`📊 进度报告: ${this.apiCallCount} API调用, ${elapsed.toFixed(1)}s 已用, 内存: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  }

  async getAccessToken() {
    const url = `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`;
    
    try {
      const response = await this.apiCallWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        })
      }, '飞书认证');
      
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

  // 使用正确的API获取子节点 - 优化版本
  async getChildNodes(parentNodeToken) {
    console.log(`🌲 获取子节点: ${parentNodeToken}`);
    
    try {
      const url = `${this.config.baseUrl}/wiki/v2/spaces/${this.config.spaceId}/nodes?parent_node_token=${parentNodeToken}`;
      
      const response = await this.apiCallWithRetry(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }, `获取子节点: ${parentNodeToken}`);
      
      console.log(`📊 子节点API响应: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.code === 0 && data.data?.items) {
          console.log(`✅ 成功获取 ${data.data.items.length} 个子节点`);
          
          // 定期报告进度
          if (this.apiCallCount % 10 === 0) {
            this.logProgress();
          }
          
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
    } else if (objType === 'bitable') {
      return await this.getBitableContent(objToken, title);
    }
    
    return null;
  }

  // 获取文档内容 - 优化版本
  async getDocxContent(objToken, title) {
    try {
      const url = `${this.config.baseUrl}/docx/v1/documents/${objToken}/raw_content`;
      
      const response = await this.apiCallWithRetry(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }, `获取文档: ${title}`);
      
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

  // 获取电子表格内容 - 优化版本
  async getSheetContent(objToken, title) {
    try {
      // 首先获取表格基础信息
      const infoUrl = `${this.config.baseUrl}/sheets/v3/spreadsheets/${objToken}`;
      
      const infoResponse = await this.apiCallWithRetry(infoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }, `获取表格信息: ${title}`);
      
      if (infoResponse.ok) {
        const infoData = await infoResponse.json();
        console.log(`✅ 成功获取表格信息: ${title}`);
        
        // 尝试获取实际数据 - 使用多种策略
        const allSheetsData = [];
        let totalProcessedCells = 0;
        
        console.log(`📊 开始尝试获取表格数据...`);
        
        // 策略1: 尝试不同的范围大小，从小到大
        const rangeSizes = [
          { range: 'A1:Z100', desc: '标准范围' },
          { range: 'A1:AB200', desc: '扩展范围' },
          { range: 'A1:AZ500', desc: '大范围' },
          { range: 'A1:CV1000', desc: '超大范围' }
        ];
        
        for (const {range, desc} of rangeSizes) {
          try {
            console.log(`🔍 尝试 ${desc}: ${range}`);
            
            const dataUrl = `${this.config.baseUrl}/sheets/v2/spreadsheets/${objToken}/values/${range}`;
            
            const dataResponse = await fetch(dataUrl, {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (dataResponse.ok) {
              const data = await dataResponse.json();
              const values = data.data?.values || [];
              
              console.log(`📊 ${desc} 响应: ${values.length} 行`);
              
              if (values.length > 0) {
                const cellCount = values.reduce((sum, row) => sum + row.length, 0);
                totalProcessedCells += cellCount;
                
                allSheetsData.push({
                  sheetName: '主工作表',
                  sheetId: 'default',
                  data: values,
                  rowCount: values.length,
                  cellCount: cellCount,
                  range: range,
                  method: desc
                });
                
                console.log(`✅ ${desc}成功: ${values.length}行, ${cellCount}个单元格`);
                
                // 如果获得了大量数据，就使用这个范围
                if (cellCount > 100) {
                  break;
                }
              }
            } else {
              console.log(`⚠️ ${desc}失败: ${dataResponse.status}`);
            }
          } catch (rangeError) {
            console.log(`⚠️ ${desc}错误: ${rangeError.message}`);
          }
        }
        
        // 策略2: 如果默认工作表没数据，尝试常见工作表名称
        if (allSheetsData.length === 0 || totalProcessedCells < 50) {
          console.log(`📋 尝试常见工作表名称...`);
          
          const commonSheetNames = ['Sheet1', 'sheet1', '工作表1', 'Sheet 1', '0'];
          
          for (const sheetName of commonSheetNames) {
            try {
              const range = 'A1:Z200';
              const dataUrl = `${this.config.baseUrl}/sheets/v2/spreadsheets/${objToken}/values/${sheetName}!${range}`;
              
              console.log(`🔍 尝试工作表 "${sheetName}"`);
              
              const dataResponse = await fetch(dataUrl, {
                headers: {
                  'Authorization': `Bearer ${this.accessToken}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (dataResponse.ok) {
                const data = await dataResponse.json();
                const values = data.data?.values || [];
                
                if (values.length > 0) {
                  const cellCount = values.reduce((sum, row) => sum + row.length, 0);
                  
                  // 如果找到更多数据，替换之前的结果
                  if (cellCount > totalProcessedCells) {
                    allSheetsData.length = 0; // 清空之前的数据
                    totalProcessedCells = cellCount;
                    
                    allSheetsData.push({
                      sheetName: sheetName,
                      sheetId: sheetName,
                      data: values,
                      rowCount: values.length,
                      cellCount: cellCount,
                      range: range,
                      method: '命名工作表'
                    });
                    
                    console.log(`✅ 工作表 "${sheetName}" 成功: ${values.length}行, ${cellCount}个单元格`);
                    break;
                  }
                }
              }
            } catch (sheetError) {
              console.log(`⚠️ 工作表 "${sheetName}" 错误: ${sheetError.message}`);
            }
          }
        }
        
        if (allSheetsData.length > 0 && totalProcessedCells > 0) {
          // 构建结构化的表格内容
          const structuredContent = this.buildStructuredSheetContent(title, allSheetsData, infoData.data?.spreadsheet);
          
          console.log(`🎉 表格 "${title}" 数据获取完成: ${allSheetsData.length}个工作表, ${totalProcessedCells}个单元格`);
          console.log(`📊 内容长度: ${structuredContent.length} 字符 (比原来的100字符增加了 ${Math.round(structuredContent.length/100)}x)`);
          
          return {
            type: 'sheet',
            content: structuredContent,
            sheetInfo: infoData.data?.spreadsheet,
            allSheetsData: allSheetsData,
            totalCells: totalProcessedCells,
            length: structuredContent.length,
            optimized: true
          };
        } else {
          console.log(`⚠️ 表格 "${title}" 无法获取有效数据，使用降级方案`);
        }
        
        // 降级方案：如果无法获取详细数据，至少保存基本信息
        const fallbackContent = this.buildFallbackSheetContent(title, infoData.data?.spreadsheet);
        
        return {
          type: 'sheet',
          content: fallbackContent,
          sheetInfo: infoData.data?.spreadsheet,
          length: fallbackContent.length,
          optimized: false
        };
      }
    } catch (error) {
      console.log(`⚠️ 表格内容获取失败: ${error.message}`);
    }
    
    return null;
  }

  // 获取多维表格(bitable)内容
  async getBitableContent(appToken, title) {
    console.log(`📊 开始获取多维表格: ${title}`);
    
    try {
      // 1. 首先获取表格基本信息
      const appInfoUrl = `${this.config.baseUrl}/bitable/v1/apps/${appToken}`;
      
      const appInfoResponse = await fetch(appInfoUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!appInfoResponse.ok) {
        throw new Error(`获取表格信息失败: ${appInfoResponse.status}`);
      }

      const appInfo = await appInfoResponse.json();
      console.log(`✅ 获取表格基本信息成功: ${title}`);

      // 2. 获取所有数据表
      const tablesUrl = `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables`;
      
      const tablesResponse = await fetch(tablesUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!tablesResponse.ok) {
        throw new Error(`获取数据表列表失败: ${tablesResponse.status}`);
      }

      const tablesData = await tablesResponse.json();
      const tables = tablesData.data?.items || [];
      
      console.log(`📋 发现 ${tables.length} 个数据表`);

      let allTablesContent = [];
      let totalRecords = 0;

      // 3. 遍历每个数据表获取数据
      for (const table of tables.slice(0, 5)) { // 限制处理前5个表格
        try {
          console.log(`📊 处理数据表: ${table.name || table.table_id}`);

          // 获取数据表字段信息
          const fieldsUrl = `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${table.table_id}/fields`;
          const fieldsResponse = await fetch(fieldsUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          let fields = [];
          if (fieldsResponse.ok) {
            const fieldsData = await fieldsResponse.json();
            fields = fieldsData.data?.items || [];
          }

          // 获取数据记录
          const recordsUrl = `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${table.table_id}/records?page_size=100`;
          const recordsResponse = await fetch(recordsUrl, {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json'
            }
          });

          if (recordsResponse.ok) {
            const recordsData = await recordsResponse.json();
            const records = recordsData.data?.items || [];
            
            allTablesContent.push({
              tableName: table.name || table.table_id,
              tableId: table.table_id,
              fields: fields,
              records: records,
              recordCount: records.length
            });

            totalRecords += records.length;
            console.log(`✅ 数据表 "${table.name}" 获取成功: ${records.length} 条记录`);
          }
        } catch (tableError) {
          console.log(`⚠️ 数据表处理失败: ${tableError.message}`);
        }
      }

      // 4. 构建结构化内容
      const structuredContent = this.buildBitableContent(title, allTablesContent, appInfo.data);

      console.log(`🎉 多维表格 "${title}" 获取完成: ${allTablesContent.length}个数据表, ${totalRecords}条记录`);

      return {
        type: 'bitable',
        content: structuredContent,
        appInfo: appInfo.data,
        tablesData: allTablesContent,
        totalRecords: totalRecords,
        length: structuredContent.length
      };

    } catch (error) {
      console.log(`❌ 多维表格获取失败: ${error.message}`);
      
      // 降级方案：返回基本信息
      const fallbackContent = `# ${title}\n\n**状态：** 基础信息获取成功，详细数据获取失败\n\n**多维表格信息：**\n- 标题: ${title}\n- Token: ${appToken}\n- 类型: bitable (多维表格)\n\n**备注：** 这是一个飞书多维表格文档，由于API权限或其他限制，无法获取详细数据内容。`;
      
      return {
        type: 'bitable',
        content: fallbackContent,
        length: fallbackContent.length,
        error: error.message
      };
    }
  }

  // 构建多维表格结构化内容
  buildBitableContent(title, tablesData, appInfo) {
    let content = `# ${title}\n\n`;
    
    // 添加应用基本信息
    if (appInfo) {
      content += `**多维表格信息：**\n`;
      content += `- 创建者: ${appInfo.owner_id || '未知'}\n`;
      content += `- 应用ID: ${appInfo.app_token}\n`;
      content += `- 数据表数量: ${tablesData.length}\n\n`;
    }

    // 处理每个数据表
    tablesData.forEach((tableInfo, index) => {
      content += `## 数据表 ${index + 1}: ${tableInfo.tableName}\n\n`;
      content += `**记录数量：** ${tableInfo.recordCount}\n\n`;

      // 添加字段信息
      if (tableInfo.fields && tableInfo.fields.length > 0) {
        content += `**字段列表：**\n`;
        tableInfo.fields.forEach(field => {
          content += `- ${field.field_name} (${field.type})\n`;
        });
        content += `\n`;
      }

      // 添加前几条记录作为示例
      if (tableInfo.records && tableInfo.records.length > 0) {
        content += `**数据示例：**\n`;
        const sampleSize = Math.min(3, tableInfo.records.length);
        
        for (let i = 0; i < sampleSize; i++) {
          const record = tableInfo.records[i];
          content += `\n**记录 ${i + 1}:**\n`;
          
          // 遍历记录中的字段值
          Object.entries(record.fields || {}).forEach(([fieldId, value]) => {
            const fieldName = tableInfo.fields.find(f => f.field_id === fieldId)?.field_name || fieldId;
            const displayValue = this.formatFieldValue(value);
            content += `- ${fieldName}: ${displayValue}\n`;
          });
        }
        
        if (tableInfo.records.length > sampleSize) {
          content += `\n... 还有 ${tableInfo.records.length - sampleSize} 条记录\n`;
        }
        content += `\n`;
      }
    });

    return content;
  }

  // 格式化字段值显示
  formatFieldValue(value) {
    if (value === null || value === undefined) return '空';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.length > 0 ? value.map(v => v.text || v).join(', ') : '[]';
      }
      return value.text || JSON.stringify(value).substring(0, 100);
    }
    return String(value).substring(0, 100);
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

  // 构建结构化的表格内容
  buildStructuredSheetContent(title, allSheetsData, sheetInfo) {
    let content = `# ${title}\n\n`;
    
    // 添加表格基本信息
    if (sheetInfo) {
      content += `**表格信息：**\n`;
      content += `- 创建者: ${sheetInfo.owner_id || '未知'}\n`;
      content += `- 链接: ${sheetInfo.url || ''}\n`;
      content += `- 工作表数量: ${allSheetsData.length}\n\n`;
    }
    
    // 处理每个工作表的数据
    allSheetsData.forEach((sheetData, index) => {
      content += `## 工作表 ${index + 1}: ${sheetData.sheetName}\n\n`;
      content += `**数据规模：** ${sheetData.rowCount}行 × ${Math.max(...sheetData.data.map(row => row.length))}列\n\n`;
      
      if (sheetData.data.length > 0) {
        // 添加表头
        const headers = sheetData.data[0] || [];
        if (headers.length > 0) {
          content += `**列标题：** ${headers.join(' | ')}\n\n`;
        }
        
        // 添加数据行（最多包含前50行以控制大小）
        const maxRows = Math.min(sheetData.data.length, 50);
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
      content += `- 创建者: ${sheetInfo.owner_id || '未知'}\n`;
      content += `- 链接: ${sheetInfo.url || ''}\n`;
      content += `- Token: ${sheetInfo.token || ''}\n\n`;
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