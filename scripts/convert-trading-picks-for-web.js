#!/usr/bin/env node

/**
 * 将交易精选数据转换为网页展示格式
 */

const fs = require('fs').promises;
const path = require('path');

class TradingPicksConverter {
  constructor() {
    this.ragDataPath = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    this.outputPath = path.join(__dirname, '../assets/data/trading-picks.json');
  }

  async convertData() {
    try {
      console.log('📖 读取飞书RAG数据...');
      const ragData = JSON.parse(await fs.readFile(this.ragDataPath, 'utf8'));
      
      // 查找交易精选节点
      const tradingNode = ragData.nodes.find(node => node.title === '交易精选');
      
      if (!tradingNode) {
        throw new Error('未找到交易精选数据');
      }

      console.log('✅ 找到交易精选数据，开始转换...');
      
      // 解析内容获取公司记录
      const companies = this.parseCompanyRecords(tradingNode.content);
      
      // 构建网页所需的数据格式
      const webData = {
        meta: {
          title: '交易精选',
          description: '精选优质创业公司与投资机会分析',
          totalCompanies: companies.length,
          lastUpdated: new Date().toISOString(),
          source: 'SVTR飞书知识库',
          dataVersion: '2.0'
        },
        companies: companies
      };

      // 保存转换后的数据
      await fs.writeFile(this.outputPath, JSON.stringify(webData, null, 2));
      
      console.log(`🎉 转换完成！`);
      console.log(`📊 转换统计:`);
      console.log(`   - 公司数量: ${companies.length}`);
      console.log(`   - 输出文件: ${this.outputPath}`);
      
      return webData;
      
    } catch (error) {
      console.error('❌ 转换失败:', error.message);
      throw error;
    }
  }

  parseCompanyRecords(content) {
    const companies = [];
    
    // 使用正则表达式提取每个记录
    const recordPattern = /### 记录 (\d+)(.*?)(?=### 记录 \d+|$)/gs;
    const matches = [...content.matchAll(recordPattern)];
    
    console.log(`📋 发现 ${matches.length} 条记录`);
    
    matches.forEach((match, index) => {
      try {
        const recordContent = match[2];
        const company = this.parseCompanyRecord(recordContent, index + 1);
        if (company) {
          companies.push(company);
        }
      } catch (error) {
        console.log(`⚠️ 记录 ${index + 1} 解析失败: ${error.message}`);
      }
    });
    
    return companies.slice(0, 20); // 限制显示前20个公司
  }

  parseCompanyRecord(recordContent, recordNumber) {
    const fields = this.extractFields(recordContent);
    
    if (!fields['公司名称']) {
      console.log(`⚠️ 记录 ${recordNumber} 缺少公司名称，跳过`);
      return null;
    }

    // 转换为网页格式
    const company = {
      id: recordNumber,
      name: fields['公司名称'] || `公司 ${recordNumber}`,
      sector: this.formatSector(fields['细分领域'], fields['二级分类']),
      stage: this.formatStage(fields['估值\n（亿美元）'], fields['成立时间']),
      description: this.formatDescription(fields),
      fundingAmount: this.formatFundingAmount(fields['金额\n（万美元）'], fields['估值\n（亿美元）']),
      lastFundingDate: this.formatDate(fields['更新时间']),
      valuation: fields['估值\n（亿美元）'] ? `${fields['估值\n（亿美元）']}亿美元` : '',
      investors: this.parseInvestors(fields['投资方']),
      founder: fields['创始人'] || '',
      website: fields['官网'] || '',
      location: fields['成立地点'] || '',
      foundedYear: fields['成立时间'] || '',
      employees: fields['公司人数'] || '',
      arr: fields['ARR（万美元）'] ? `${(fields['ARR（万美元）'] / 10000).toFixed(1)}亿美元` : '',
      tags: this.parseTags(fields),
      analysisPoints: this.generateAnalysisPoints(fields),
      businessModel: fields['主要业务'] || '',
      deepResearch: fields['深度研究'] || ''
    };

    return company;
  }

  extractFields(content) {
    const fields = {};
    
    // 匹配字段模式：**字段名**: 值
    const fieldPattern = /\*\*(.*?)\*\*:\s*(.*?)(?=\n\*\*|\n---|$)/gs;
    const matches = [...content.matchAll(fieldPattern)];
    
    matches.forEach(match => {
      const fieldName = match[1].trim();
      const fieldValue = match[2].trim();
      if (fieldValue && fieldValue !== '空' && fieldValue !== '[]') {
        fields[fieldName] = fieldValue;
      }
    });
    
    return fields;
  }

  formatSector(sector, subCategory) {
    if (!sector && !subCategory) return '未知领域';
    
    const sectorMap = {
      '模型层': '🤖 AI模型',
      '基础层': '⚙️ AI基础设施', 
      '应用层': '📱 AI应用',
      '模型层-大模型': '🤖 大语言模型',
      '模型层-垂类模型': '🎯 垂直模型',
      '基础层-数据': '💾 数据服务',
      '应用层-开发者': '👨‍💻 开发者工具',
      '应用层-生命科学': '🧬 生命科学',
      '应用层-企业服务': '🏢 企业服务',
      '应用层-金融服务': '💰 金融科技',
      '应用层-工业制造': '🏭 工业制造'
    };
    
    return sectorMap[subCategory] || sectorMap[sector] || (subCategory || sector);
  }

  formatStage(valuation, foundedYear) {
    if (!valuation && !foundedYear) return '';
    
    const val = parseFloat(valuation);
    const year = parseInt(foundedYear);
    const currentYear = new Date().getFullYear();
    const age = year ? currentYear - year : 0;
    
    let stage = '';
    
    if (val >= 100) {
      stage += '超级独角兽 ';
    } else if (val >= 10) {
      stage += '独角兽 ';
    } else if (val >= 1) {
      stage += '准独角兽 ';
    }
    
    if (age <= 2) {
      stage += '· 初创期';
    } else if (age <= 5) {
      stage += '· 成长期';  
    } else if (age > 5) {
      stage += '· 成熟期';
    }
    
    return stage.trim() || '成长企业';
  }

  formatDescription(fields) {
    const businessModel = fields['主要业务'] || '';
    const introduction = fields['企业介绍'] || '';
    
    if (introduction.length > businessModel.length) {
      return introduction.substring(0, 200) + (introduction.length > 200 ? '...' : '');
    }
    
    return businessModel.substring(0, 200) + (businessModel.length > 200 ? '...' : '');
  }

  formatFundingAmount(amount, valuation) {
    const funding = parseFloat(amount);
    const val = parseFloat(valuation);
    
    let result = '';
    if (funding) {
      if (funding >= 10000) {
        result += `${(funding / 10000).toFixed(1)}亿美元融资`;
      } else {
        result += `${funding}万美元融资`;
      }
    }
    
    if (val) {
      result += ` · 估值${val}亿美元`;
    }
    
    return result || '融资信息待更新';
  }

  formatDate(timestamp) {
    if (!timestamp) return '2025年';
    
    const date = new Date(parseInt(timestamp));
    if (isNaN(date.getTime())) return '2025年';
    
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  parseInvestors(investorsString) {
    if (!investorsString) return [];
    
    // 分割投资机构
    const investors = investorsString
      .split(/[,，、；;]/)
      .map(inv => inv.trim())
      .filter(inv => inv.length > 0 && inv !== '未披露')
      .slice(0, 6); // 限制显示数量
    
    return investors;
  }

  parseTags(fields) {
    const tags = [];
    
    // 从标签字段解析
    if (fields['标签']) {
      const tagString = fields['标签'];
      const parsedTags = tagString.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
      tags.push(...parsedTags);
    }
    
    // 添加其他标签
    if (fields['ARR（万美元）']) {
      const arr = parseFloat(fields['ARR（万美元）']);
      if (arr >= 50000) tags.push('高收入');
    }
    
    if (fields['创始人'] && (fields['创始人'].includes('华人') || fields['标签']?.includes('华人'))) {
      tags.push('华人创业');
    }
    
    const year = parseInt(fields['成立时间']);
    if (year >= 2023) tags.push('AI Native');
    
    return [...new Set(tags)].slice(0, 5);
  }

  generateAnalysisPoints(fields) {
    const points = [];
    
    // 基于数据生成分析要点
    const valuation = parseFloat(fields['估值\n（亿美元）']);
    const funding = parseFloat(fields['金额\n（万美元）']);
    const arr = parseFloat(fields['ARR（万美元）']);
    const employees = fields['公司人数'];
    
    if (valuation >= 100) {
      points.push(`🏆 超级独角兽企业，估值${valuation}亿美元，行业领军地位`);
    } else if (valuation >= 10) {
      points.push(`🦄 独角兽企业，市场估值${valuation}亿美元`);
    }
    
    if (arr) {
      points.push(`💰 年化收入${(arr/10000).toFixed(1)}亿美元，商业模式成熟`);
    }
    
    if (funding >= 10000) {
      points.push(`💎 单轮融资${(funding/10000).toFixed(1)}亿美元，资本高度认可`);
    }
    
    const founder = fields['创始人'];
    const background = fields['工作经历'] || fields['教育背景'];
    if (founder && background) {
      if (background.includes('Google') || background.includes('Meta') || background.includes('OpenAI')) {
        points.push(`👨‍💻 创始人${founder}来自顶级科技公司，技术实力雄厚`);
      }
      if (background.includes('斯坦福') || background.includes('MIT') || background.includes('哈佛')) {
        points.push(`🎓 团队拥有顶级院校背景，学术实力突出`);
      }
    }
    
    if (fields['深度研究']) {
      points.push(`📊 SVTR深度研究: ${fields['深度研究']}`);
    }
    
    return points.slice(0, 3);
  }
}

// 主函数
async function main() {
  try {
    const converter = new TradingPicksConverter();
    await converter.convertData();
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TradingPicksConverter;