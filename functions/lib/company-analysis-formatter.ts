/**
 * SVTR.AI 公司分析格式化服务
 * 基于专业投资分析报告框架，提供结构化的公司分析输出
 */

interface CompanyAnalysisData {
  companyName: string;
  foundingYear?: string;
  founders?: string[];
  location?: string;
  businessModel?: string;
  marketSegment?: string;
  fundingStage?: string;
  totalFunding?: string;
  valuation?: string;
  investors?: string[];
  competitors?: string[];
  keyMetrics?: Record<string, any>;
  risks?: string[];
  opportunities?: string[];
  recentNews?: any[];
  analysisDate?: string;
}

interface AnalysisContext {
  ragMatches: any[];
  webSearchResults?: any[];
  confidence: number;
  queryType: string;
}

export class CompanyAnalysisFormatter {
  
  /**
   * 格式化公司分析报告
   */
  formatCompanyAnalysis(data: CompanyAnalysisData, context: AnalysisContext): string {
    const sections = [];
    
    // 1. 执行摘要
    sections.push(this.formatExecutiveSummary(data, context));
    
    // 2. 公司概况
    sections.push(this.formatCompanyOverview(data));
    
    // 3. 商业模式分析
    sections.push(this.formatBusinessModel(data));
    
    // 4. 市场与竞争
    sections.push(this.formatMarketAnalysis(data));
    
    // 5. 财务与融资
    sections.push(this.formatFinancialAnalysis(data, context));
    
    // 6. 风险与机遇
    sections.push(this.formatRiskOpportunityAnalysis(data));
    
    // 7. 投资亮点
    sections.push(this.formatInvestmentHighlights(data));
    
    // 8. 数据来源说明
    sections.push(this.formatDataSources(context));
    
    return sections.filter(section => section).join('\n\n');
  }

  /**
   * 执行摘要 - 核心要点概述
   */
  private formatExecutiveSummary(data: CompanyAnalysisData, context: AnalysisContext): string {
    return `## 📊 执行摘要

**${data.companyName}** 是${data.marketSegment ? `一家专注于${data.marketSegment}的` : '一家'}${data.businessModel || 'AI'}公司${data.foundingYear ? `，成立于${data.foundingYear}年` : ''}。

🎯 **核心定位**：${this.generatePositioning(data)}

💰 **融资情况**：${data.fundingStage || '待更新'}${data.totalFunding ? ` | 累计融资${data.totalFunding}` : ''}${data.valuation ? ` | 估值${data.valuation}` : ''}

📈 **投资价值**：${this.generateValueProposition(data, context)}`;
  }

  /**
   * 公司概况 - 基础信息
   */
  private formatCompanyOverview(data: CompanyAnalysisData): string {
    const overview = [`## 🏢 公司概况`];
    
    if (data.founders && data.founders.length > 0) {
      overview.push(`**创始团队**：${data.founders.join('、')}`);
    }
    
    if (data.location) {
      overview.push(`**总部地址**：${data.location}`);
    }
    
    if (data.foundingYear) {
      overview.push(`**成立时间**：${data.foundingYear}年`);
    }

    overview.push(`**业务领域**：${data.marketSegment || 'AI技术'}`);
    
    return overview.join('\n');
  }

  /**
   * 商业模式分析
   */
  private formatBusinessModel(data: CompanyAnalysisData): string {
    const sections = [`## 💼 商业模式分析`];
    
    if (data.businessModel) {
      sections.push(`**核心模式**：${data.businessModel}`);
    }
    
    // 基于市场细分推断商业模式特点
    const modelInsights = this.generateBusinessModelInsights(data);
    if (modelInsights) {
      sections.push(modelInsights);
    }
    
    return sections.join('\n\n');
  }

  /**
   * 市场与竞争分析
   */
  private formatMarketAnalysis(data: CompanyAnalysisData): string {
    const sections = [`## 🎯 市场与竞争分析`];
    
    // 市场定位
    if (data.marketSegment) {
      sections.push(`**目标市场**：${data.marketSegment}市场`);
    }
    
    // 竞争对手
    if (data.competitors && data.competitors.length > 0) {
      sections.push(`**主要竞争对手**：${data.competitors.join('、')}`);
    }
    
    // 市场前景分析
    const marketOutlook = this.generateMarketOutlook(data);
    if (marketOutlook) {
      sections.push(`**市场前景**：${marketOutlook}`);
    }
    
    return sections.join('\n\n');
  }

  /**
   * 财务与融资分析
   */
  private formatFinancialAnalysis(data: CompanyAnalysisData, context: AnalysisContext): string {
    const sections = [`## 💰 财务与融资分析`];
    
    // 融资历程
    if (data.fundingStage || data.totalFunding) {
      const fundingInfo = [];
      if (data.fundingStage) fundingInfo.push(`当前阶段：${data.fundingStage}`);
      if (data.totalFunding) fundingInfo.push(`累计融资：${data.totalFunding}`);
      if (data.valuation) fundingInfo.push(`最新估值：${data.valuation}`);
      
      sections.push(`**融资概况**：${fundingInfo.join(' | ')}`);
    }
    
    // 投资机构
    if (data.investors && data.investors.length > 0) {
      sections.push(`**投资方**：${data.investors.join('、')}`);
    }
    
    // 关键指标
    if (data.keyMetrics && Object.keys(data.keyMetrics).length > 0) {
      const metrics = Object.entries(data.keyMetrics)
        .map(([key, value]) => `${key}：${value}`)
        .join(' | ');
      sections.push(`**核心指标**：${metrics}`);
    }
    
    // 实时数据说明
    if (context.webSearchResults && context.webSearchResults.length > 0) {
      sections.push(`**📈 最新动态**：基于实时网络数据更新`);
    }
    
    return sections.join('\n\n');
  }

  /**
   * 风险与机遇分析
   */
  private formatRiskOpportunityAnalysis(data: CompanyAnalysisData): string {
    const sections = [`## ⚖️ 风险与机遇分析`];
    
    // 投资机遇
    if (data.opportunities && data.opportunities.length > 0) {
      sections.push(`**📈 投资机遇**：\n${data.opportunities.map(opp => `• ${opp}`).join('\n')}`);
    } else {
      // 基于行业生成通用机遇
      const genericOpportunities = this.generateGenericOpportunities(data);
      if (genericOpportunities.length > 0) {
        sections.push(`**📈 潜在机遇**：\n${genericOpportunities.map(opp => `• ${opp}`).join('\n')}`);
      }
    }
    
    // 潜在风险
    if (data.risks && data.risks.length > 0) {
      sections.push(`**⚠️ 潜在风险**：\n${data.risks.map(risk => `• ${risk}`).join('\n')}`);
    } else {
      // 基于行业生成通用风险
      const genericRisks = this.generateGenericRisks(data);
      if (genericRisks.length > 0) {
        sections.push(`**⚠️ 关注风险**：\n${genericRisks.map(risk => `• ${risk}`).join('\n')}`);
      }
    }
    
    return sections.join('\n\n');
  }

  /**
   * 投资亮点总结
   */
  private formatInvestmentHighlights(data: CompanyAnalysisData): string {
    const highlights = this.generateInvestmentHighlights(data);
    
    if (highlights.length === 0) return '';
    
    return `## ✨ 投资亮点

${highlights.map((highlight, index) => `**${index + 1}.** ${highlight}`).join('\n\n')}`;
  }

  /**
   * 数据来源说明
   */
  private formatDataSources(context: AnalysisContext): string {
    const sources = [];
    
    if (context.ragMatches.length > 0) {
      const ragSources = context.ragMatches.filter(match => match.source !== 'web_search').length;
      if (ragSources > 0) {
        sources.push(`SVTR知识库 (${ragSources}个匹配)`);
      }
    }
    
    if (context.webSearchResults && context.webSearchResults.length > 0) {
      sources.push(`实时网络数据 (${context.webSearchResults.length}个来源)`);
    }
    
    const today = new Date().toLocaleDateString('zh-CN');
    
    return `---
    
**📚 数据来源**：${sources.join(' + ')}  
**🔍 分析置信度**：${(context.confidence * 100).toFixed(1)}%  
**📅 分析日期**：${today}  
**⚡ 数据更新**：包含最新市场信息`;
  }

  // === 辅助方法 ===

  private generatePositioning(data: CompanyAnalysisData): string {
    if (data.marketSegment) {
      const segmentMap: Record<string, string> = {
        'AI基础设施': '为AI开发者和企业提供底层技术支撑',
        'AI应用': '面向终端用户的AI产品和服务',
        'AI芯片': '专注AI计算硬件和芯片设计',
        '机器学习': '提供机器学习平台和工具',
        '自动驾驶': '推动智能交通和无人驾驶技术',
        '医疗AI': '结合AI技术改善医疗健康服务'
      };
      return segmentMap[data.marketSegment] || `${data.marketSegment}领域的创新公司`;
    }
    return '专注AI技术创新与应用的科技公司';
  }

  private generateValueProposition(data: CompanyAnalysisData, context: AnalysisContext): string {
    const props = [];
    
    if (data.fundingStage === 'Series A' || data.fundingStage === 'Series B') {
      props.push('成长期优质标的');
    }
    
    if (data.valuation && data.valuation.includes('亿')) {
      props.push('独角兽企业');
    }
    
    if (context.confidence > 0.8) {
      props.push('数据充分');
    }
    
    if (props.length === 0) {
      props.push('AI赛道投资机会');
    }
    
    return props.join('，');
  }

  private generateBusinessModelInsights(data: CompanyAnalysisData): string {
    if (!data.marketSegment) return '';
    
    const insights: Record<string, string> = {
      'AI基础设施': '**收入模式**：SaaS订阅 + API调用计费 + 企业定制服务\n**客户群体**：AI开发者、企业技术团队、科研机构',
      'AI应用': '**收入模式**：用户订阅 + 增值服务 + 企业授权\n**客户群体**：C端用户、SMB企业、大型企业客户',
      'AI芯片': '**收入模式**：硬件销售 + 授权费 + 技术服务\n**客户群体**：云服务商、设备制造商、科技企业'
    };
    
    return insights[data.marketSegment] || '';
  }

  private generateMarketOutlook(data: CompanyAnalysisData): string {
    if (!data.marketSegment) return '';
    
    const outlooks: Record<string, string> = {
      'AI基础设施': '随着企业AI转型加速，基础设施需求强劲增长',
      'AI应用': 'AI应用市场快速扩张，垂直领域机会众多',
      'AI芯片': 'AI算力需求爆发，专用芯片市场前景广阔',
      '自动驾驶': 'L4/L5级自动驾驶商业化进程加快，市场空间巨大'
    };
    
    return outlooks[data.marketSegment] || '所在细分市场具有良好发展前景';
  }

  private generateGenericOpportunities(data: CompanyAnalysisData): string[] {
    const opportunities = [];
    
    if (data.fundingStage === 'Series A' || data.fundingStage === 'Series B') {
      opportunities.push('处于快速成长期，具备规模化潜力');
    }
    
    if (data.marketSegment?.includes('AI')) {
      opportunities.push('受益于AI技术快速发展和广泛应用');
    }
    
    opportunities.push('市场需求持续增长，商业化前景良好');
    
    return opportunities;
  }

  private generateGenericRisks(data: CompanyAnalysisData): string[] {
    const risks = [];
    
    risks.push('技术迭代风险：AI技术快速发展可能带来技术替代风险');
    risks.push('市场竞争风险：赛道竞争激烈，需持续保持技术和产品优势');
    
    if (data.fundingStage === 'Early Stage' || data.fundingStage === 'Seed') {
      risks.push('早期阶段风险：商业模式验证和市场拓展存在不确定性');
    }
    
    return risks;
  }

  private generateInvestmentHighlights(data: CompanyAnalysisData): string[] {
    const highlights = [];
    
    if (data.founders && data.founders.length > 0) {
      highlights.push(`**优秀创始团队**：${data.founders.join('、')}等行业专家领衔`);
    }
    
    if (data.investors && data.investors.length > 0) {
      highlights.push(`**明星投资人背书**：获${data.investors.slice(0, 3).join('、')}等知名机构投资`);
    }
    
    if (data.marketSegment) {
      highlights.push(`**赛道前景广阔**：${data.marketSegment}市场需求强劲，成长空间大`);
    }
    
    if (data.valuation && !data.valuation.includes('待')) {
      highlights.push(`**估值合理**：当前估值${data.valuation}，具备投资价值`);
    }
    
    return highlights;
  }
}

/**
 * 从RAG结果中提取公司分析数据
 */
export function extractCompanyDataFromRAG(companyName: string, ragMatches: any[], webResults?: any[]): CompanyAnalysisData {
  const data: CompanyAnalysisData = {
    companyName,
    analysisDate: new Date().toISOString()
  };
  
  // 从RAG匹配中提取信息
  ragMatches.forEach(match => {
    const content = match.content?.toLowerCase() || '';
    const title = match.title?.toLowerCase() || '';
    
    // 提取创始人信息
    if (content.includes('创始人') || content.includes('founder')) {
      // 简单的创始人提取逻辑
      const founderMatch = match.content.match(/创始人[：:]\s*([^，。\n]+)/);
      if (founderMatch) {
        data.founders = [founderMatch[1].trim()];
      }
    }
    
    // 提取融资信息
    if (content.includes('融资') || content.includes('轮') || content.includes('投资')) {
      if (content.includes('a轮') || content.includes('series a')) {
        data.fundingStage = 'Series A';
      } else if (content.includes('b轮') || content.includes('series b')) {
        data.fundingStage = 'Series B';
      } else if (content.includes('种子轮') || content.includes('seed')) {
        data.fundingStage = 'Seed';
      }
    }
    
    // 提取估值信息
    const valuationMatch = match.content.match(/估值[：:]?\s*(\d+[亿万]?\s*[美元元]?)/);
    if (valuationMatch) {
      data.valuation = valuationMatch[1];
    }
    
    // 提取业务领域
    if (content.includes('ai') || content.includes('人工智能')) {
      data.marketSegment = 'AI技术';
      if (content.includes('基础设施')) data.marketSegment = 'AI基础设施';
      else if (content.includes('应用')) data.marketSegment = 'AI应用';
      else if (content.includes('芯片')) data.marketSegment = 'AI芯片';
    }
  });
  
  // 从网络搜索结果中补充最新信息
  if (webResults) {
    webResults.forEach(result => {
      if (result.verified && result.content) {
        // 提取最新估值和融资信息
        const valuationMatch = result.content.match(/valued?\s+at\s+\$?(\d+\.?\d*)\s*(billion|million)/i);
        if (valuationMatch) {
          const amount = valuationMatch[1];
          const unit = valuationMatch[2].toLowerCase() === 'billion' ? '十亿美元' : '百万美元';
          data.valuation = `${amount}${unit}`;
        }
      }
    });
  }
  
  return data;
}

/**
 * 工厂函数：创建公司分析格式化器
 */
export function createCompanyAnalysisFormatter() {
  return new CompanyAnalysisFormatter();
}