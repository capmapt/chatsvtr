#!/usr/bin/env node

/**
 * 数据质量扫描器
 * 检测和修复数据缺失、格式问题
 * 专门解决"Anthropic融资xx亿元"等数据空格问题
 */

const fs = require('fs');
const path = require('path');

class DataQualityScanner {
  constructor() {
    this.dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    this.outputFile = path.join(__dirname, '../logs/data-quality-report.json');
    this.patterns = {
      // 检测模式：寻找数据缺失的常见模式
      missingValues: [
        /(\w+)最近融资\s*xx\s*亿元/gi,                    // "xx亿元"模式
        /融资\s*xx\s*[万千亿]/gi,                        // 融资金额空格
        /估值\s*xx\s*[万千亿]/gi,                        // 估值空格
        /轮次\s*：\s*$/gmi,                              // 空轮次
        /创始人\s*：\s*$/gmi,                            // 空创始人
        /成立时间\s*：\s*$/gmi,                          // 空成立时间
        /\s{3,}/g,                                      // 多余空格
        /[\u00A0\u2000-\u200F\u2028-\u202F\u3000]/g      // 特殊空白字符
      ],
      // 格式问题模式
      formatIssues: [
        /\n{3,}/g,                                      // 多余换行
        /[。！？]{2,}/g,                                // 重复标点
        /[\s]*[\r\n]+[\s]*/g,                          // 不规范换行
        /^\s+|\s+$/gm                                   // 行首尾空格
      ],
      // 公司信息缺失模式
      companyInfoGaps: [
        /(\w+)公司.*?融资.*?，但.*?信息.*?缺失/gi,
        /(\w+).*?详细.*?信息.*?暂无/gi,
        /关于(\w+)的.*?数据.*?不完整/gi
      ]
    };
  }

  async scan() {
    console.log('🔍 开始数据质量扫描...\n');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalNodes: 0,
        issuesFound: 0,
        categorizedIssues: {
          missingValues: 0,
          formatIssues: 0,
          companyInfoGaps: 0,
          criticalGaps: 0
        }
      },
      detailedFindings: {
        missingValues: [],
        formatIssues: [],
        companyInfoGaps: [],
        criticalGaps: []
      },
      recommendations: [],
      fixedContent: []
    };

    try {
      // 读取增强版数据
      const rawData = fs.readFileSync(this.dataFile, 'utf8');
      const data = JSON.parse(rawData);
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('数据格式不正确，缺少nodes数组');
      }

      report.summary.totalNodes = data.nodes.length;
      console.log(`📊 扫描节点总数: ${data.nodes.length}`);

      // 逐个分析节点
      for (let i = 0; i < data.nodes.length; i++) {
        const node = data.nodes[i];
        await this.analyzeNode(node, i, report);
        
        // 进度显示
        if ((i + 1) % 50 === 0) {
          console.log(`   处理进度: ${i + 1}/${data.nodes.length} (${((i + 1) / data.nodes.length * 100).toFixed(1)}%)`);
        }
      }

      // 生成修复建议
      this.generateFixRecommendations(report);

      // 保存报告
      await this.saveReport(report);

      // 显示结果摘要
      this.displaySummary(report);

      return report;

    } catch (error) {
      console.error('❌ 扫描失败:', error.message);
      throw error;
    }
  }

  async analyzeNode(node, index, report) {
    const content = node.content || '';
    const title = node.title || '';
    const nodeId = node.id || `node-${index}`;

    // 检测数据缺失问题
    this.detectMissingValues(content, title, nodeId, report);
    
    // 检测格式问题
    this.detectFormatIssues(content, title, nodeId, report);
    
    // 检测公司信息缺失
    this.detectCompanyInfoGaps(content, title, nodeId, report);
    
    // 检测关键信息缺失（SVTR创始人、OpenAI等）
    this.detectCriticalGaps(content, title, nodeId, report);
  }

  detectMissingValues(content, title, nodeId, report) {
    this.patterns.missingValues.forEach((pattern, patternIndex) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          report.summary.categorizedIssues.missingValues++;
          report.summary.issuesFound++;
          
          report.detailedFindings.missingValues.push({
            nodeId,
            title: title.substring(0, 50) + (title.length > 50 ? '...' : ''),
            issue: `数据缺失模式: ${match}`,
            patternType: this.getMissingValuePatternType(patternIndex),
            severity: this.assessSeverity(match),
            context: this.extractContext(content, match, 100),
            suggestedFix: this.suggestMissingValueFix(match)
          });
        });
      }
    });
  }

  detectFormatIssues(content, title, nodeId, report) {
    this.patterns.formatIssues.forEach((pattern, patternIndex) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          report.summary.categorizedIssues.formatIssues++;
          report.summary.issuesFound++;
          
          report.detailedFindings.formatIssues.push({
            nodeId,
            title: title.substring(0, 50),
            issue: `格式问题: ${this.getFormatIssueDescription(patternIndex)}`,
            matchedText: match.length > 20 ? match.substring(0, 20) + '...' : match,
            severity: 'low',
            fixable: true
          });
        });
      }
    });
  }

  detectCompanyInfoGaps(content, title, nodeId, report) {
    // 检测公司信息缺失的特定模式
    const companyMentions = content.match(/(\w+)公司|(\w+)企业|(\w+)\s*(AI|科技)/gi) || [];
    
    companyMentions.forEach(mention => {
      // 检查该公司是否缺少关键信息
      const companyName = mention.replace(/公司|企业|AI|科技/g, '').trim();
      
      if (companyName.length > 1) {
        const hasFinancingInfo = content.includes(`${companyName}融资`) || content.includes(`${companyName}投资`);
        const hasFounderInfo = content.includes(`${companyName}创始人`) || content.includes(`${companyName}CEO`);
        const hasDetailedInfo = content.includes(`${companyName}详细`) || content.includes(`${companyName}介绍`);
        
        if (!hasFinancingInfo && !hasFounderInfo && !hasDetailedInfo) {
          report.summary.categorizedIssues.companyInfoGaps++;
          report.summary.issuesFound++;
          
          report.detailedFindings.companyInfoGaps.push({
            nodeId,
            title,
            companyName,
            issue: '公司信息不完整',
            missingInfo: ['融资信息', '创始人信息', '详细介绍'],
            severity: 'medium'
          });
        }
      }
    });
  }

  detectCriticalGaps(content, title, nodeId, report) {
    const criticalKeywords = [
      { keyword: 'SVTR', expectedInfo: ['创始人', 'Min Liu', 'Allen'] },
      { keyword: 'OpenAI', expectedInfo: ['分析', '投资', '发展'] },
      { keyword: 'Anthropic', expectedInfo: ['融资', '亿元', '投资'] }
    ];

    criticalKeywords.forEach(({ keyword, expectedInfo }) => {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        const hasExpectedInfo = expectedInfo.some(info => 
          content.toLowerCase().includes(info.toLowerCase())
        );
        
        if (!hasExpectedInfo) {
          report.summary.categorizedIssues.criticalGaps++;
          report.summary.issuesFound++;
          
          report.detailedFindings.criticalGaps.push({
            nodeId,
            title,
            keyword,
            issue: `${keyword}相关信息不完整`,
            missingInfo: expectedInfo,
            severity: 'high',
            priority: 'immediate'
          });
        }
      }
    });
  }

  getMissingValuePatternType(patternIndex) {
    const types = [
      '融资金额缺失',
      '一般融资数据缺失', 
      '估值数据缺失',
      '轮次信息缺失',
      '创始人信息缺失',
      '成立时间缺失',
      '多余空格',
      '特殊空白字符'
    ];
    return types[patternIndex] || '未知类型';
  }

  getFormatIssueDescription(patternIndex) {
    const descriptions = [
      '过多连续换行',
      '重复标点符号',
      '不规范换行格式',
      '行首尾多余空格'
    ];
    return descriptions[patternIndex] || '格式问题';
  }

  assessSeverity(match) {
    if (match.includes('xx亿') || match.includes('创始人：') || match.includes('轮次：')) {
      return 'high';
    }
    if (match.includes('xx万') || match.includes('xx千')) {
      return 'medium';
    }
    return 'low';
  }

  extractContext(content, match, contextLength = 100) {
    const index = content.indexOf(match);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + match.length + contextLength / 2);
    
    return '...' + content.substring(start, end) + '...';
  }

  suggestMissingValueFix(match) {
    if (match.includes('xx亿元')) {
      return '查找具体融资金额数据并替换"xx"';
    }
    if (match.includes('创始人：')) {
      return '补充具体创始人姓名信息';
    }
    if (match.includes('轮次：')) {
      return '补充具体融资轮次（种子轮、A轮等）';
    }
    return '检查并补充缺失的具体数据';
  }

  generateFixRecommendations(report) {
    const recommendations = [];

    // 基于问题严重程度生成建议
    const highSeverityCount = report.detailedFindings.missingValues.filter(i => i.severity === 'high').length;
    const criticalGapsCount = report.summary.categorizedIssues.criticalGaps;

    if (criticalGapsCount > 0) {
      recommendations.push({
        priority: 'critical',
        action: `立即修复${criticalGapsCount}个关键信息缺失`,
        details: '影响核心功能的关键信息（SVTR创始人、Anthropic融资等）需要优先补充',
        estimatedEffort: 'high'
      });
    }

    if (highSeverityCount > 0) {
      recommendations.push({
        priority: 'high', 
        action: `修复${highSeverityCount}个高优先级数据缺失`,
        details: '包括融资金额、创始人信息等核心商业数据',
        estimatedEffort: 'medium'
      });
    }

    if (report.summary.categorizedIssues.formatIssues > 10) {
      recommendations.push({
        priority: 'medium',
        action: '批量修复格式问题',
        details: '可通过自动化脚本修复空格、换行等格式问题',
        estimatedEffort: 'low'
      });
    }

    recommendations.push({
      priority: 'medium',
      action: '增强飞书数据同步机制',
      details: '在同步过程中实时检测和修复数据缺失问题',
      estimatedEffort: 'medium'
    });

    report.recommendations = recommendations;
  }

  async saveReport(report) {
    try {
      // 确保logs目录存在
      const logDir = path.dirname(this.outputFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // 保存详细报告
      fs.writeFileSync(this.outputFile, JSON.stringify(report, null, 2));
      
      // 生成简化摘要
      const summaryFile = this.outputFile.replace('.json', '-summary.txt');
      const summaryText = this.generateSummaryText(report);
      fs.writeFileSync(summaryFile, summaryText);
      
      console.log(`\n📊 详细报告已保存: ${this.outputFile}`);
      console.log(`📄 摘要报告已保存: ${summaryFile}`);
      
    } catch (error) {
      console.error('保存报告失败:', error.message);
    }
  }

  generateSummaryText(report) {
    return `
SVTR 数据质量扫描报告摘要
============================
扫描时间: ${report.timestamp}
总节点数: ${report.summary.totalNodes}
发现问题: ${report.summary.issuesFound}

问题分类:
- 数据缺失: ${report.summary.categorizedIssues.missingValues}
- 格式问题: ${report.summary.categorizedIssues.formatIssues}  
- 公司信息缺失: ${report.summary.categorizedIssues.companyInfoGaps}
- 关键信息缺失: ${report.summary.categorizedIssues.criticalGaps}

优先修复建议:
${report.recommendations.map(r => `• [${r.priority.toUpperCase()}] ${r.action}`).join('\n')}

关键发现:
${report.detailedFindings.criticalGaps.slice(0, 3).map(g => 
  `• ${g.keyword}: ${g.issue}`
).join('\n')}

数据质量得分: ${this.calculateQualityScore(report)}/100
    `.trim();
  }

  calculateQualityScore(report) {
    const totalNodes = report.summary.totalNodes;
    const totalIssues = report.summary.issuesFound;
    const criticalIssues = report.summary.categorizedIssues.criticalGaps;
    
    // 基础分数
    let score = 100;
    
    // 扣分机制
    score -= (totalIssues / totalNodes) * 30; // 问题比例影响
    score -= criticalIssues * 10;            // 关键问题重扣分
    
    return Math.max(0, Math.round(score));
  }

  displaySummary(report) {
    console.log('\n🎯 数据质量扫描结果摘要');
    console.log('='*40);
    console.log(`📊 总节点数: ${report.summary.totalNodes}`);
    console.log(`⚠️  发现问题: ${report.summary.issuesFound}`);
    console.log(`📈 数据质量得分: ${this.calculateQualityScore(report)}/100\n`);

    console.log('🔍 问题分类统计:');
    console.log(`   数据缺失: ${report.summary.categorizedIssues.missingValues}个`);
    console.log(`   格式问题: ${report.summary.categorizedIssues.formatIssues}个`);
    console.log(`   公司信息缺失: ${report.summary.categorizedIssues.companyInfoGaps}个`);
    console.log(`   关键信息缺失: ${report.summary.categorizedIssues.criticalGaps}个\n`);

    if (report.detailedFindings.criticalGaps.length > 0) {
      console.log('🚨 关键问题 (需立即修复):');
      report.detailedFindings.criticalGaps.slice(0, 3).forEach((gap, index) => {
        console.log(`   ${index + 1}. ${gap.keyword}: ${gap.issue}`);
      });
      console.log();
    }

    if (report.recommendations.length > 0) {
      console.log('💡 优先修复建议:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
      });
      console.log();
    }

    console.log('✅ 扫描完成！查看详细报告了解具体修复方案。');
  }
}

// 主函数
async function main() {
  console.log('🔍 SVTR 数据质量扫描器启动\n');

  try {
    const scanner = new DataQualityScanner();
    const report = await scanner.scan();
    
    console.log('\n🎉 扫描任务完成！');
    
    // 如果发现关键问题，提示下一步操作
    if (report.summary.categorizedIssues.criticalGaps > 0) {
      console.log('\n⚡ 建议立即运行数据修复工具:');
      console.log('   npm run fix:data-gaps');
    }
    
  } catch (error) {
    console.error('💥 扫描失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataQualityScanner;