#!/usr/bin/env node

/**
 * Feishu MCP vs 传统方式对比测试
 * 验证MCP的稳定性、速度和数据质量优势
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class FeishuMCPComparisonTest {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {
        traditional: { name: '传统飞书API', results: {} },
        mcp: { name: 'Feishu MCP', results: {} }
      },
      comparison: {},
      recommendations: []
    };
  }

  /**
   * 执行命令并记录性能指标
   */
  async executeWithMetrics(command, testName) {
    console.log(`🧪 执行测试: ${testName}`);
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      exec(command, { cwd: this.projectRoot, timeout: 60000 }, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;
        const result = {
          duration,
          success: !error,
          output_length: stdout ? stdout.length : 0,
          error_message: error ? error.message : null,
          stderr: stderr ? stderr.trim() : null
        };
        
        if (error) {
          console.log(`❌ ${testName} 失败 (${duration}ms): ${error.message}`);
        } else {
          console.log(`✅ ${testName} 成功 (${duration}ms)`);
        }
        
        resolve(result);
      });
    });
  }

  /**
   * 测试传统飞书API方式
   */
  async testTraditionalApproach() {
    console.log('\n📊 测试传统飞书API方式...');
    
    // 测试1: 连接稳定性
    const connectionTest = await this.executeWithMetrics(
      'node scripts/enhanced-feishu-sync-v2.js --test-connection',
      '传统API连接测试'
    );
    
    // 测试2: 数据获取速度
    const dataFetchTest = await this.executeWithMetrics(
      'node scripts/enhanced-feishu-sync-v2.js --dry-run',
      '传统API数据获取测试'
    );
    
    // 测试3: 错误处理
    const errorHandlingTest = await this.executeWithMetrics(
      'timeout 5s node scripts/enhanced-feishu-sync-v2.js --test-timeout',
      '传统API错误处理测试'
    );

    this.results.tests.traditional.results = {
      connection: connectionTest,
      data_fetch: dataFetchTest,
      error_handling: errorHandlingTest,
      avg_duration: (connectionTest.duration + dataFetchTest.duration + errorHandlingTest.duration) / 3
    };
  }

  /**
   * 测试Feishu MCP方式
   */
  async testMCPApproach() {
    console.log('\n🔧 测试Feishu MCP方式...');
    
    // 测试1: MCP连接稳定性
    const mcpConnectionTest = await this.executeWithMetrics(
      'claude mcp list | grep feishu',
      'Feishu MCP连接测试'
    );
    
    // 测试2: MCP数据获取
    const mcpDataTest = await this.executeWithMetrics(
      'node scripts/feishu-mcp-enhanced-sync.js --dry-run',
      'Feishu MCP数据获取测试'
    );
    
    // 测试3: MCP错误恢复
    const mcpErrorTest = await this.executeWithMetrics(
      'timeout 5s node scripts/feishu-mcp-enhanced-sync.js --test-resilience',
      'Feishu MCP错误恢复测试'
    );

    this.results.tests.mcp.results = {
      connection: mcpConnectionTest,
      data_fetch: mcpDataTest,
      error_handling: mcpErrorTest,
      avg_duration: (mcpConnectionTest.duration + mcpDataTest.duration + mcpErrorTest.duration) / 3
    };
  }

  /**
   * 对比数据质量
   */
  async compareDataQuality() {
    console.log('\n📈 对比数据质量...');
    
    try {
      // 读取传统方式的数据
      const traditionalDataPath = path.join(this.projectRoot, 'assets/data/rag/enhanced-feishu-full-content.json');
      let traditionalData = null;
      try {
        traditionalData = JSON.parse(await fs.readFile(traditionalDataPath, 'utf8'));
      } catch (error) {
        console.log('⚠️ 传统数据文件不存在，跳过质量对比');
      }

      // 读取MCP数据（如果存在）
      const mcpDataPath = path.join(this.projectRoot, 'assets/data/rag/feishu-mcp-content.json');
      let mcpData = null;
      try {
        mcpData = JSON.parse(await fs.readFile(mcpDataPath, 'utf8'));
      } catch (error) {
        console.log('⚠️ MCP数据文件不存在，跳过质量对比');
      }

      // 生成质量对比报告
      const qualityComparison = {
        traditional: traditionalData ? this.analyzeDataQuality(traditionalData) : null,
        mcp: mcpData ? this.analyzeDataQuality(mcpData) : null
      };

      this.results.data_quality = qualityComparison;
      
      if (qualityComparison.traditional && qualityComparison.mcp) {
        console.log(`📊 传统方式: ${qualityComparison.traditional.node_count} 节点, 平均质量: ${qualityComparison.traditional.avg_content_length}`);
        console.log(`🔧 MCP方式: ${qualityComparison.mcp.node_count} 节点, 平均质量: ${qualityComparison.mcp.avg_content_length}`);
      }

    } catch (error) {
      console.log(`数据质量对比失败: ${error.message}`);
    }
  }

  /**
   * 分析数据质量
   */
  analyzeDataQuality(data) {
    const nodes = data.nodes || [];
    
    const analysis = {
      node_count: nodes.length,
      total_content_length: 0,
      avg_content_length: 0,
      nodes_with_content: 0,
      structured_content_nodes: 0,
      recent_nodes: 0
    };

    const now = Date.now();
    
    nodes.forEach(node => {
      if (node.content && node.content.length > 0) {
        analysis.nodes_with_content++;
        analysis.total_content_length += node.content.length;
        
        // 检查结构化内容
        if (this.hasStructuredContent(node.content)) {
          analysis.structured_content_nodes++;
        }
        
        // 检查更新时间
        if (node.updated_at) {
          const nodeTime = new Date(node.updated_at).getTime();
          const daysDiff = (now - nodeTime) / (1000 * 60 * 60 * 24);
          if (daysDiff < 30) {
            analysis.recent_nodes++;
          }
        }
      }
    });

    analysis.avg_content_length = analysis.nodes_with_content > 0 
      ? Math.round(analysis.total_content_length / analysis.nodes_with_content)
      : 0;

    return analysis;
  }

  /**
   * 检查结构化内容
   */
  hasStructuredContent(content) {
    if (!content) return false;
    
    const patterns = [
      /\|[^|]+\|[^|]+\|/,  // 表格
      /^\s*[-*+]\s+/m,     // 列表
      /^\s*\d+\.\s+/m,     // 有序列表
      /```[\s\S]*?```/,    // 代码块
    ];
    
    return patterns.some(pattern => pattern.test(content));
  }

  /**
   * 生成综合对比分析
   */
  generateComparison() {
    console.log('\n📋 生成综合对比分析...');
    
    const traditional = this.results.tests.traditional.results;
    const mcp = this.results.tests.mcp.results;
    
    this.results.comparison = {
      performance: {
        winner: traditional.avg_duration < mcp.avg_duration ? 'traditional' : 'mcp',
        traditional_avg: traditional.avg_duration,
        mcp_avg: mcp.avg_duration,
        improvement: traditional.avg_duration > 0 
          ? ((traditional.avg_duration - mcp.avg_duration) / traditional.avg_duration * 100).toFixed(1) + '%'
          : 'N/A'
      },
      
      reliability: {
        traditional_success_rate: this.calculateSuccessRate(traditional),
        mcp_success_rate: this.calculateSuccessRate(mcp),
        winner: this.calculateSuccessRate(mcp) >= this.calculateSuccessRate(traditional) ? 'mcp' : 'traditional'
      },
      
      connection_stability: {
        traditional_stable: traditional.connection?.success || false,
        mcp_stable: mcp.connection?.success || false,
        winner: (mcp.connection?.success || false) ? 'mcp' : 'traditional'
      }
    };

    // 生成建议
    this.generateRecommendations();
  }

  /**
   * 计算成功率
   */
  calculateSuccessRate(results) {
    const tests = [results.connection, results.data_fetch, results.error_handling];
    const successful = tests.filter(test => test?.success).length;
    return ((successful / tests.length) * 100).toFixed(1);
  }

  /**
   * 生成使用建议
   */
  generateRecommendations() {
    const comparison = this.results.comparison;
    
    if (comparison.reliability.mcp_success_rate > comparison.reliability.traditional_success_rate) {
      this.results.recommendations.push({
        priority: 'high',
        type: 'reliability',
        message: 'MCP方式表现出更高的可靠性，建议优先使用',
        evidence: `MCP成功率: ${comparison.reliability.mcp_success_rate}% vs 传统方式: ${comparison.reliability.traditional_success_rate}%`
      });
    }

    if (comparison.performance.winner === 'mcp') {
      this.results.recommendations.push({
        priority: 'medium',
        type: 'performance',
        message: 'MCP方式在性能上有优势',
        evidence: `性能提升: ${comparison.performance.improvement}`
      });
    }

    if (comparison.connection_stability.mcp_stable && !comparison.connection_stability.traditional_stable) {
      this.results.recommendations.push({
        priority: 'high',
        type: 'stability',
        message: 'MCP连接更稳定，建议作为主要同步方式',
        evidence: 'MCP连接测试通过，传统方式存在连接问题'
      });
    }

    // 根据整体评估给出最终建议
    const mcpAdvantages = this.results.recommendations.filter(r => 
      r.message.includes('MCP') && (r.priority === 'high' || r.priority === 'medium')
    ).length;

    if (mcpAdvantages >= 2) {
      this.results.final_recommendation = {
        decision: 'use_mcp',
        confidence: 'high',
        reasoning: 'MCP在多个关键指标上表现更好，建议作为主要数据同步方式'
      };
    } else if (mcpAdvantages >= 1) {
      this.results.final_recommendation = {
        decision: 'gradual_migration',
        confidence: 'medium',
        reasoning: 'MCP显示出优势，建议逐步迁移并保持传统方式作为备份'
      };
    } else {
      this.results.final_recommendation = {
        decision: 'keep_traditional',
        confidence: 'medium',
        reasoning: '传统方式仍然可靠，可以保持现状并定期重新评估MCP'
      };
    }
  }

  /**
   * 保存测试报告
   */
  async saveReport() {
    console.log('\n💾 保存对比测试报告...');
    
    try {
      // 保存详细报告
      const reportPath = path.join(this.projectRoot, 'reports/feishu-mcp-comparison-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      
      // 生成人类可读摘要
      const summaryPath = path.join(this.projectRoot, 'reports/feishu-mcp-comparison-summary.md');
      const summary = this.generateMarkdownSummary();
      await fs.writeFile(summaryPath, summary);
      
      console.log(`📄 详细报告: ${reportPath}`);
      console.log(`📝 报告摘要: ${summaryPath}`);
      
    } catch (error) {
      console.error('报告保存失败:', error.message);
    }
  }

  /**
   * 生成Markdown摘要
   */
  generateMarkdownSummary() {
    const comp = this.results.comparison;
    const final = this.results.final_recommendation;
    
    return `# Feishu MCP vs 传统方式对比报告

## 测试概览
- **测试时间**: ${this.results.timestamp}
- **测试项目**: 连接稳定性、数据获取速度、错误处理能力

## 性能对比

### ⏱️ 平均响应时间
- **传统方式**: ${comp.performance?.traditional_avg || 'N/A'}ms
- **MCP方式**: ${comp.performance?.mcp_avg || 'N/A'}ms
- **性能提升**: ${comp.performance?.improvement || 'N/A'}

### 🔄 可靠性对比
- **传统方式成功率**: ${comp.reliability?.traditional_success_rate || 'N/A'}%
- **MCP方式成功率**: ${comp.reliability?.mcp_success_rate || 'N/A'}%
- **可靠性优势**: ${comp.reliability?.winner === 'mcp' ? 'MCP方式' : '传统方式'}

### 🔗 连接稳定性
- **传统方式**: ${comp.connection_stability?.traditional_stable ? '✅ 稳定' : '❌ 不稳定'}
- **MCP方式**: ${comp.connection_stability?.mcp_stable ? '✅ 稳定' : '❌ 不稳定'}

## 建议摘要

${this.results.recommendations.map(rec => `
### ${rec.priority.toUpperCase()} - ${rec.type}
**建议**: ${rec.message}  
**依据**: ${rec.evidence}
`).join('\n')}

## 最终建议

**决策**: ${final?.decision || 'pending'}  
**信心度**: ${final?.confidence || 'unknown'}  
**理由**: ${final?.reasoning || '需要更多测试数据'}

---
*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
`;
  }

  /**
   * 执行完整对比测试
   */
  async execute() {
    console.log('🚀 开始Feishu MCP vs 传统方式对比测试...\n');
    
    try {
      // 执行测试
      await this.testTraditionalApproach();
      await this.testMCPApproach();
      await this.compareDataQuality();
      
      // 生成对比分析
      this.generateComparison();
      
      // 保存报告
      await this.saveReport();
      
      // 输出摘要
      console.log('\n📊 测试完成！主要发现:');
      console.log(`🎯 最终建议: ${this.results.final_recommendation?.decision || '需要更多数据'}`);
      console.log(`📈 信心度: ${this.results.final_recommendation?.confidence || 'unknown'}`);
      
      if (this.results.recommendations.length > 0) {
        console.log('\n💡 关键建议:');
        this.results.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
        });
      }
      
      return this.results;
      
    } catch (error) {
      console.error('\n❌ 对比测试失败:', error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const test = new FeishuMCPComparisonTest();
  test.execute()
    .then(() => {
      console.log('\n✅ 对比测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 测试失败:', error.message);
      process.exit(1);
    });
}

module.exports = FeishuMCPComparisonTest;