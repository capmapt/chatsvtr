#!/usr/bin/env node

/**
 * 手动数据更新工具
 * 提供简化的命令行工具来更新AI周报和交易精选数据
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class ManualUpdateTool {
  constructor() {
    this.dataDir = path.join(__dirname, '../assets/data');
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async updateWeekly() {
    console.log('\n📝 更新AI周报数据\n');

    const issue = await this.question('期数 (如: 115): ');
    const title = await this.question('标题 (如: AI周报第115期): ');
    const summary = await this.question('摘要: ');
    const feishuLink = await this.question('飞书链接: ');
    const highlightsInput = await this.question('亮点 (用逗号分隔): ');

    const highlights = highlightsInput.split(',').map(h => h.trim()).filter(h => h);

    const weeklyData = {
      issue: parseInt(issue),
      title: title || `AI周报第${issue}期`,
      publishDate: new Date().toISOString().split('T')[0],
      summary: summary,
      feishuLink: feishuLink,
      tags: ["AI", "创投", "周报"],
      highlights: highlights
    };

    await this.saveWeeklyData(weeklyData);
    console.log('✅ AI周报数据更新成功！');
  }

  async updateTrading() {
    console.log('\n💼 添加交易精选公司\n');

    const name = await this.question('公司名称: ');
    const sector = await this.question('行业 (如: AI/ML): ');
    const stage = await this.question('融资阶段 (如: Series A): ');
    const description = await this.question('公司描述: ');
    const fundingAmount = await this.question('融资金额 (如: $10M): ');
    const fundingDate = await this.question('融资日期 (如: 2025-07-22): ');
    const investorsInput = await this.question('投资机构 (用逗号分隔): ');
    const website = await this.question('官网 (可选): ');
    const tagsInput = await this.question('标签 (用逗号分隔): ');
    const analysisInput = await this.question('分析要点 (用分号分隔): ');

    const investors = investorsInput.split(',').map(i => i.trim()).filter(i => i);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    const analysisPoints = analysisInput.split(';').map(a => a.trim()).filter(a => a);

    const companyData = {
      id: Date.now(), // 简单的ID生成
      name,
      sector,
      stage,
      description,
      fundingAmount,
      lastFundingDate: fundingDate,
      investors,
      website: website || '',
      tags,
      analysisPoints
    };

    await this.addTradingCompany(companyData);
    console.log('✅ 交易精选公司添加成功！');
  }

  async saveWeeklyData(weeklyData) {
    const filePath = path.join(this.dataDir, 'ai-weekly.json');
    
    try {
      let existingData = { 
        meta: { 
          startIssue: 115, 
          currentIssue: 115,
          description: "AI周报数据，从第115期开始"
        }, 
        issues: [] 
      };
      
      try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
      } catch (error) {
        console.log('📝 创建新的周报数据文件');
      }

      const existingIndex = existingData.issues.findIndex(
        issue => issue.issue === weeklyData.issue
      );

      if (existingIndex >= 0) {
        existingData.issues[existingIndex] = weeklyData;
        console.log(`📝 更新第${weeklyData.issue}期周报`);
      } else {
        existingData.issues.push(weeklyData);
        existingData.meta.currentIssue = Math.max(
          existingData.meta.currentIssue, 
          weeklyData.issue
        );
        console.log(`📝 添加第${weeklyData.issue}期周报`);
      }

      existingData.issues.sort((a, b) => b.issue - a.issue);

      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
      
    } catch (error) {
      console.error('❌ 保存周报数据失败:', error);
      throw error;
    }
  }

  async addTradingCompany(companyData) {
    const filePath = path.join(this.dataDir, 'trading-picks.json');
    
    try {
      let existingData = {
        meta: {
          description: "交易精选数据，包含重点关注的创业公司",
          totalCompanies: 0,
          lastUpdated: new Date().toISOString().split('T')[0]
        },
        companies: []
      };
      
      try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        existingData = JSON.parse(existingContent);
      } catch (error) {
        console.log('📝 创建新的交易精选数据文件');
      }

      // 检查是否已存在同名公司
      const existingIndex = existingData.companies.findIndex(
        company => company.name === companyData.name
      );

      if (existingIndex >= 0) {
        existingData.companies[existingIndex] = companyData;
        console.log(`📝 更新公司: ${companyData.name}`);
      } else {
        existingData.companies.push(companyData);
        console.log(`📝 添加公司: ${companyData.name}`);
      }

      // 更新元数据
      existingData.meta.totalCompanies = existingData.companies.length;
      existingData.meta.lastUpdated = new Date().toISOString().split('T')[0];

      await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
      
    } catch (error) {
      console.error('❌ 保存交易数据失败:', error);
      throw error;
    }
  }

  async showMenu() {
    console.log('\n🚀 SVTR.AI 数据更新工具\n');
    console.log('1. 更新AI周报');
    console.log('2. 添加交易精选公司');
    console.log('3. 退出');
    
    const choice = await this.question('\n请选择操作 (1-3): ');
    
    switch (choice) {
      case '1':
        await this.updateWeekly();
        break;
      case '2':
        await this.updateTrading();
        break;
      case '3':
        console.log('👋 再见！');
        this.rl.close();
        return;
      default:
        console.log('❌ 无效选择');
    }
    
    await this.showMenu(); // 返回菜单
  }

  async run() {
    try {
      await this.showMenu();
    } catch (error) {
      console.error('❌ 运行失败:', error.message);
      this.rl.close();
    }
  }
}

// 命令行执行
if (require.main === module) {
  const tool = new ManualUpdateTool();
  tool.run();
}

module.exports = ManualUpdateTool;