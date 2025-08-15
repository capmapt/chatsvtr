#!/usr/bin/env node

/**
 * 只同步"交易精选"数据的快速脚本
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const config = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  baseUrl: 'https://open.feishu.cn/open-apis'
};

let accessToken = null;

async function getAccessToken() {
  const url = `${config.baseUrl}/auth/v3/tenant_access_token/internal`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret
    })
  });
  
  const data = await response.json();
  if (data.code === 0) {
    accessToken = data.tenant_access_token;
    console.log('✅ 飞书认证成功');
    return true;
  }
  return false;
}

async function getTradingPicksData() {
  const appToken = 'XCNeb9GjNaQaeYsm7WwcZRSJn1f';
  const tableId = 'tblGwQMQ9DXvGgA9';
  
  try {
    // 获取应用信息
    const appInfoUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}`;
    const appInfoResponse = await fetch(appInfoUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const appInfo = await appInfoResponse.json();

    // 获取字段信息
    const fieldsUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`;
    const fieldsResponse = await fetch(fieldsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const fieldsData = await fieldsResponse.json();
    const fields = fieldsData.data?.items || [];

    // 获取所有记录 (分页)
    let allRecords = [];
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
      const recordsUrl = `${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=100${pageToken ? `&page_token=${pageToken}` : ''}`;
      const recordsResponse = await fetch(recordsUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const recordsData = await recordsResponse.json();
      const records = recordsData.data?.items || [];
      
      allRecords = allRecords.concat(records);
      hasMore = recordsData.data?.has_more || false;
      pageToken = recordsData.data?.page_token || '';
      
      console.log(`📊 已获取 ${allRecords.length} 条记录...`);
    }

    console.log(`🎉 总共获取到 ${allRecords.length} 条记录`);

    // 构建结构化内容
    let content = `# 交易精选\n\n**状态：** ✅ 成功获取完整数据\n\n`;
    content += `**多维表格信息：**\n`;
    content += `- 应用名称: ${appInfo.data?.app?.name || '交易精选'}\n`;
    content += `- 数据表: Deal\n`;
    content += `- 字段数量: ${fields.length}\n`;
    content += `- 记录数量: ${allRecords.length}\n`;
    content += `- 更新时间: ${new Date().toISOString()}\n\n`;

    // 添加字段说明
    content += `**字段列表：**\n`;
    fields.forEach((field, index) => {
      content += `- ${field.field_name} (${getFieldTypeName(field.type)})\n`;
    });
    content += `\n`;

    // 添加所有记录
    content += `## 交易记录详情\n\n`;
    
    allRecords.forEach((record, index) => {
      content += `### 记录 ${index + 1}\n\n`;
      
      // 遍历记录中的字段值
      Object.entries(record.fields || {}).forEach(([fieldId, value]) => {
        const field = fields.find(f => f.field_id === fieldId);
        const fieldName = field?.field_name || fieldId;
        const displayValue = formatFieldValue(value);
        
        if (displayValue && displayValue !== '空' && displayValue !== '[]') {
          content += `**${fieldName}**: ${displayValue}\n\n`;
        }
      });
      
      content += `---\n\n`;
    });

    return {
      content,
      length: content.length,
      recordCount: allRecords.length,
      fieldCount: fields.length
    };

  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    return null;
  }
}

function getFieldTypeName(type) {
  const typeMap = {
    1: '单行文本',
    2: '数字', 
    3: '单选',
    4: '多选',
    5: '日期',
    7: '复选框',
    11: '人员',
    13: '电话号码',
    15: '超链接',
    17: '附件',
    18: '关联',
    19: '查找引用',
    20: '公式',
    21: '双向关联'
  };
  return typeMap[type] || `类型${type}`;
}

function formatFieldValue(value) {
  if (value === null || value === undefined) return '空';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(v => {
        if (v.text) return v.text;
        if (v.name) return v.name;
        return JSON.stringify(v);
      }).join(', ');
    }
    if (value.text) return value.text;
    if (value.name) return value.name;
    return JSON.stringify(value);
  }
  return String(value);
}

async function updateDataFile(data) {
  try {
    // 读取现有的 RAG 数据
    const ragPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    const ragData = JSON.parse(await fs.readFile(ragPath, 'utf8'));

    // 查找"交易精选"节点并更新
    const targetNodeId = 'node_CNRPwjCvBiElEgkP1EwcaIA5nJe';
    const nodeIndex = ragData.nodes.findIndex(node => node.id === targetNodeId);

    if (nodeIndex !== -1) {
      // 更新节点内容
      ragData.nodes[nodeIndex].content = data.content;
      ragData.nodes[nodeIndex].contentLength = data.length;
      ragData.nodes[nodeIndex].lastUpdated = new Date().toISOString().split('T')[0];
      
      // 添加详细元数据
      ragData.nodes[nodeIndex].bitableData = {
        recordCount: data.recordCount,
        fieldCount: data.fieldCount,
        dataType: 'complete',
        lastSync: new Date().toISOString()
      };

      // 保存文件
      await fs.writeFile(ragPath, JSON.stringify(ragData, null, 2));
      console.log(`✅ 已更新 RAG 数据文件: ${data.recordCount} 条记录, ${data.length} 字符`);
      
      return true;
    } else {
      console.error('❌ 未找到"交易精选"节点');
      return false;
    }
  } catch (error) {
    console.error('❌ 更新数据文件失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始同步"交易精选"数据...\n');
  
  // 认证
  if (!(await getAccessToken())) {
    console.error('❌ 认证失败');
    process.exit(1);
  }
  
  // 获取数据
  console.log('📊 获取交易精选数据...');
  const data = await getTradingPicksData();
  
  if (!data) {
    console.error('❌ 获取数据失败');
    process.exit(1);
  }
  
  // 更新数据文件
  console.log('💾 更新数据文件...');
  const updateSuccess = await updateDataFile(data);
  
  if (updateSuccess) {
    console.log('\n🎉 同步完成！');
    console.log(`📊 数据统计:`);
    console.log(`   - 记录数量: ${data.recordCount}`);
    console.log(`   - 字段数量: ${data.fieldCount}`);
    console.log(`   - 内容长度: ${data.length} 字符`);
  } else {
    console.error('❌ 同步失败');
    process.exit(1);
  }
}

main().catch(console.error);