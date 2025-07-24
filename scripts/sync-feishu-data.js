#!/usr/bin/env node

/**
 * 飞书数据同步脚本
 * 自动同步AI周报和交易精选数据到本地JSON文件
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class FeishuSyncService {
  constructor() {
    this.config = {
      appId: process.env.FEISHU_APP_ID,
      appSecret: process.env.FEISHU_APP_SECRET,
      baseUrl: 'https://open.feishu.cn/open-apis',
      // 从飞书链接中提取的文档和表格ID
      weeklyDocId: 'V2JnwfmvtiBUTdkc32rcQrXWn4g', // AI周报文档ID
      tradingBaseId: 'XCNeb9GjNaQaeYsm7WwcZRSJn1f' // 交易精选表格ID
    };
    
    this.accessToken = null;
    this.dataDir = path.join(__dirname, '../assets/data');
  }

  /**
   * 获取飞书访问token
   */
  async getAccessToken() {
    const url = `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
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
   * 获取文档内容 (AI周报)
   */
  async getWeeklyContent() {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    // 尝试wiki API端点
    const url = `${this.config.baseUrl}/wiki/v2/spaces/by_token/${this.config.weeklyDocId}`;
    
    try {
      console.log('📝 请求URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📝 响应状态:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('📝 响应内容预览:', responseText.substring(0, 200) + '...');
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON解析失败，响应内容:', responseText);
        throw new Error('飞书API返回非JSON格式数据，可能需要特殊权限或文档不存在');
      }
      
      if (data.code === 0) {
        return this.parseWeeklyData(data.data);
      } else {
        throw new Error(`获取周报数据失败: ${data.msg || '未知错误'}`);
      }
    } catch (error) {
      console.error('❌ 获取周报数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取多维表格数据 (交易精选)
   */
  async getTradingData() {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    const url = `${this.config.baseUrl}/bitable/v1/apps/${this.config.tradingBaseId}/tables`;
    
    try {
      // 首先获取表格列表
      const tablesResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      const tablesData = await tablesResponse.json();
      
      if (tablesData.code !== 0) {
        throw new Error(`获取表格列表失败: ${tablesData.msg}`);
      }
      
      // 获取第一个表格的数据
      const tableId = tablesData.data.items[0]?.table_id;
      if (!tableId) {
        throw new Error('未找到表格数据');
      }
      
      const recordsUrl = `${this.config.baseUrl}/bitable/v1/apps/${this.config.tradingBaseId}/tables/${tableId}/records`;
      
      const recordsResponse = await fetch(recordsUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      const recordsData = await recordsResponse.json();
      
      if (recordsData.code === 0) {
        return this.parseTradingData(recordsData.data);
      } else {
        throw new Error(`获取交易数据失败: ${recordsData.msg}`);
      }
    } catch (error) {
      console.error('❌ 获取交易数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 解析周报数据
   */
  parseWeeklyData(docData) {
    // 这里需要根据实际文档结构进行解析
    // 示例解析逻辑
    const currentDate = new Date().toISOString().split('T')[0];
    
    return {
      issue: this.extractIssueNumber(docData),
      title: this.extractTitle(docData),
      publishDate: currentDate,
      summary: this.extractSummary(docData),
      feishuLink: `https://svtrglobal.feishu.cn/wiki/${this.config.weeklyDocId}`,
      tags: ["AI", "创投", "周报"],
      highlights: this.extractHighlights(docData)
    };
  }

  /**
   * 解析交易数据
   */
  parseTradingData(recordsData) {
    const companies = recordsData.items.map(record => {
      const fields = record.fields;
      return {
        id: record.record_id,
        name: fields['公司名称'] || '',
        sector: fields['行业'] || '',
        stage: fields['融资阶段'] || '',
        description: fields['公司描述'] || '',
        fundingAmount: fields['融资金额'] || '',
        lastFundingDate: fields['融资日期'] || '',
        investors: this.parseInvestors(fields['投资机构']),
        website: fields['官网'] || '',
        tags: this.parseTags(fields['标签']),
        analysisPoints: this.parseAnalysisPoints(fields['分析要点'])
      };
    });

    return {
      meta: {
        description: "交易精选数据，包含重点关注的创业公司",
        totalCompanies: companies.length,
        lastUpdated: new Date().toISOString().split('T')[0]
      },
      companies
    };
  }

  // 辅助解析方法
  extractIssueNumber(docData) {
    // 从文档标题中提取期数
    // 需要根据实际文档结构实现
    return 115; // 临时返回
  }

  extractTitle(docData) {
    // 提取文档标题
    return "AI周报第115期"; // 临时返回
  }

  extractSummary(docData) {
    // 提取摘要
    return "本期AI周报将涵盖最新的人工智能发展动态、创投资讯以及行业趋势分析。";
  }

  extractHighlights(docData) {
    // 提取要点
    return ["AI技术最新突破", "创投市场动态", "行业趋势分析"];
  }

  parseInvestors(investorData) {
    if (Array.isArray(investorData)) {
      return investorData;
    }
    if (typeof investorData === 'string') {
      return investorData.split(',').map(s => s.trim());
    }
    return [];
  }

  parseTags(tagData) {
    if (Array.isArray(tagData)) {
      return tagData;
    }
    if (typeof tagData === 'string') {
      return tagData.split(',').map(s => s.trim());
    }
    return [];
  }

  parseAnalysisPoints(analysisData) {
    if (Array.isArray(analysisData)) {
      return analysisData;
    }
    if (typeof analysisData === 'string') {
      return analysisData.split('\n').filter(s => s.trim());
    }
    return [];
  }

  /**
   * 保存数据到本地JSON文件
   */
  async saveWeeklyData(weeklyData) {
    const filePath = path.join(this.dataDir, 'ai-weekly.json');
    
    try {
      // 读取现有数据
      let existingData = { meta: { startIssue: 115, currentIssue: 115 }, issues: [] };
      
      try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
      } catch (error) {
        console.log('📝 创建新的周报数据文件');
      }

      // 检查是否已存在该期数据
      const existingIndex = existingData.issues.findIndex(
        issue => issue.issue === weeklyData.issue
      );

      if (existingIndex >= 0) {
        // 更新现有数据
        existingData.issues[existingIndex] = weeklyData;
        console.log(`📝 更新第${weeklyData.issue}期周报`);
      } else {
        // 添加新数据
        existingData.issues.push(weeklyData);
        existingData.meta.currentIssue = Math.max(
          existingData.meta.currentIssue, 
          weeklyData.issue
        );
        console.log(`📝 添加第${weeklyData.issue}期周报`);
      }

      // 按期数排序
      existingData.issues.sort((a, b) => b.issue - a.issue);

      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
      console.log('✅ 周报数据保存成功');
      
    } catch (error) {
      console.error('❌ 保存周报数据失败:', error);
      throw error;
    }
  }

  async saveTradingData(tradingData) {
    const filePath = path.join(this.dataDir, 'trading-picks.json');
    
    try {
      await fs.writeFile(filePath, JSON.stringify(tradingData, null, 2));
      console.log('✅ 交易精选数据保存成功');
    } catch (error) {
      console.error('❌ 保存交易精选数据失败:', error);
      throw error;
    }
  }

  /**
   * 执行完整同步流程
   */
  async syncAll() {
    console.log('🚀 开始同步飞书数据...\n');

    try {
      // 检查配置
      if (!this.config.appId || !this.config.appSecret) {
        throw new Error('请设置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量');
      }

      // 同步周报数据
      console.log('📖 同步AI周报数据...');
      const weeklyData = await this.getWeeklyContent();
      await this.saveWeeklyData(weeklyData);

      // 同步交易数据
      console.log('💼 同步交易精选数据...');
      const tradingData = await this.getTradingData();
      await this.saveTradingData(tradingData);

      console.log('\n🎉 数据同步完成！');
      
    } catch (error) {
      console.error('\n❌ 同步失败:', error.message);
      process.exit(1);
    }
  }
}

// 命令行执行
if (require.main === module) {
  const service = new FeishuSyncService();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--weekly-only')) {
    // 仅同步周报
    service.getWeeklyContent()
      .then(data => service.saveWeeklyData(data))
      .then(() => console.log('✅ 周报同步完成'))
      .catch(err => {
        console.error('❌ 周报同步失败:', err.message);
        process.exit(1);
      });
  } else if (args.includes('--trading-only')) {
    // 仅同步交易精选
    service.getTradingData()
      .then(data => service.saveTradingData(data))
      .then(() => console.log('✅ 交易精选同步完成'))
      .catch(err => {
        console.error('❌ 交易精选同步失败:', err.message);
        process.exit(1);
      });
  } else {
    // 全量同步
    service.syncAll();
  }
}

module.exports = FeishuSyncService;