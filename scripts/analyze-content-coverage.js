#!/usr/bin/env node

/**
 * 分析内容覆盖率详情
 * 解释为什么不是100%覆盖率
 */

const fs = require('fs');
const path = require('path');

class ContentCoverageAnalyzer {
  constructor() {
    this.dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
  }

  async analyze() {
    console.log('📊 内容覆盖率详细分析\n');

    try {
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('数据格式错误：缺少nodes数组');
      }

      const totalNodes = data.nodes.length;
      console.log(`总节点数: ${totalNodes}\n`);

      // 按内容长度分类
      const categories = {
        empty: [], // 空内容
        minimal: [], // 极简内容 (1-50字符)
        short: [], // 短内容 (51-100字符)  
        medium: [], // 中等内容 (101-500字符)
        long: [], // 长内容 (501-2000字符)
        veryLong: [] // 超长内容 (2000+字符)
      };

      const noContentNodes = [];
      const basicInfoOnlyNodes = [];

      data.nodes.forEach(node => {
        const contentLength = node.contentLength || (node.content ? node.content.length : 0);
        const content = node.content || '';

        if (!content || content.trim().length === 0) {
          categories.empty.push({
            title: node.title,
            type: node.objType,
            level: node.level,
            nodeToken: node.nodeToken
          });
          noContentNodes.push(node);
        } else if (contentLength <= 50) {
          categories.minimal.push({
            title: node.title,
            type: node.objType,
            level: node.level,
            length: contentLength,
            content: content.substring(0, 50) + '...'
          });
        } else if (contentLength <= 100) {
          categories.short.push({
            title: node.title,
            type: node.objType,
            level: node.level,
            length: contentLength
          });
          
          // 检查是否只是基础信息
          if (content.includes('基础信息:') && content.length < 150) {
            basicInfoOnlyNodes.push(node);
          }
        } else if (contentLength <= 500) {
          categories.medium.push({
            title: node.title,
            type: node.objType,
            level: node.level,
            length: contentLength
          });
        } else if (contentLength <= 2000) {
          categories.long.push({
            title: node.title,
            type: node.objType,
            level: node.level,
            length: contentLength
          });
        } else {
          categories.veryLong.push({
            title: node.title,
            type: node.objType,
            level: node.level,
            length: contentLength
          });
        }
      });

      // 统计报告
      console.log('📈 内容长度分布:');
      console.log(`  空内容: ${categories.empty.length} 个 (${(categories.empty.length/totalNodes*100).toFixed(1)}%)`);
      console.log(`  极简内容 (1-50字符): ${categories.minimal.length} 个 (${(categories.minimal.length/totalNodes*100).toFixed(1)}%)`);
      console.log(`  短内容 (51-100字符): ${categories.short.length} 个 (${(categories.short.length/totalNodes*100).toFixed(1)}%)`);
      console.log(`  中等内容 (101-500字符): ${categories.medium.length} 个 (${(categories.medium.length/totalNodes*100).toFixed(1)}%)`);
      console.log(`  长内容 (501-2000字符): ${categories.long.length} 个 (${(categories.long.length/totalNodes*100).toFixed(1)}%)`);
      console.log(`  超长内容 (2000+字符): ${categories.veryLong.length} 个 (${(categories.veryLong.length/totalNodes*100).toFixed(1)}%)\n`);

      // RAG系统的内容有效性标准
      const ragThreshold = 100; // RAG系统认为有效的最低字符数
      const validForRAG = data.nodes.filter(n => n.contentLength >= ragThreshold).length;
      const ragCoverage = (validForRAG / totalNodes * 100).toFixed(1);
      
      console.log('🧠 RAG系统有效性分析:');
      console.log(`  RAG有效内容标准: ≥${ragThreshold}字符`);
      console.log(`  符合RAG标准: ${validForRAG} 个`);
      console.log(`  RAG覆盖率: ${ragCoverage}%\n`);

      // 分析无效内容的原因
      console.log('🔍 无效内容分析:\n');

      if (categories.empty.length > 0) {
        console.log(`1️⃣ 空内容节点 (${categories.empty.length}个):`);
        categories.empty.slice(0, 5).forEach(node => {
          console.log(`   - "${node.title}" (${node.type}, Level ${node.level})`);
        });
        if (categories.empty.length > 5) {
          console.log(`   ... 还有 ${categories.empty.length - 5} 个\n`);
        }
      }

      if (basicInfoOnlyNodes.length > 0) {
        console.log(`2️⃣ 仅基础信息节点 (${basicInfoOnlyNodes.length}个):`);
        basicInfoOnlyNodes.slice(0, 5).forEach(node => {
          console.log(`   - "${node.title}" (${node.objType})`);
          console.log(`     内容: ${node.content.substring(0, 80)}...`);
        });
        if (basicInfoOnlyNodes.length > 5) {
          console.log(`   ... 还有 ${basicInfoOnlyNodes.length - 5} 个\n`);
        }
      }

      // 按文档类型分析
      console.log('📁 按文档类型分析:');
      const typeAnalysis = {};
      data.nodes.forEach(node => {
        const type = node.objType || 'unknown';
        if (!typeAnalysis[type]) {
          typeAnalysis[type] = {
            total: 0,
            validForRAG: 0,
            avgLength: 0,
            totalLength: 0
          };
        }
        typeAnalysis[type].total++;
        typeAnalysis[type].totalLength += (node.contentLength || 0);
        if ((node.contentLength || 0) >= ragThreshold) {
          typeAnalysis[type].validForRAG++;
        }
      });

      Object.entries(typeAnalysis).forEach(([type, stats]) => {
        stats.avgLength = Math.round(stats.totalLength / stats.total);
        const coverage = (stats.validForRAG / stats.total * 100).toFixed(1);
        console.log(`  ${type}: ${stats.total}个, 平均长度${stats.avgLength}字符, RAG覆盖率${coverage}%`);
      });

      // 给出改进建议
      console.log('\n💡 改进建议:');
      
      if (categories.empty.length > 0) {
        console.log(`1. 处理 ${categories.empty.length} 个空内容节点 - 可能是权限问题或API限制`);
      }
      
      if (basicInfoOnlyNodes.length > 0) {
        console.log(`2. 优化 ${basicInfoOnlyNodes.length} 个仅有基础信息的节点 - 尝试获取完整内容`);
      }

      const lowContentNodes = categories.minimal.length + categories.short.length;
      if (lowContentNodes > 0) {
        console.log(`3. 审查 ${lowContentNodes} 个内容较少的节点 - 确认是否为正常的简短条目`);
      }

      console.log('\n🎯 总结:');
      console.log(`当前 ${ragCoverage}% 的覆盖率主要原因:`);
      console.log(`- ${categories.empty.length} 个空内容节点`);
      console.log(`- ${categories.minimal.length + categories.short.length} 个内容过短节点`);
      console.log('这些可能是飞书表格、目录页面或权限受限的文档，属于正常情况。');
      
      return {
        totalNodes,
        validForRAG,
        ragCoverage: parseFloat(ragCoverage),
        categories,
        typeAnalysis,
        recommendations: {
          emptyNodes: categories.empty.length,
          shortNodes: categories.minimal.length + categories.short.length,
          basicInfoOnly: basicInfoOnlyNodes.length
        }
      };

    } catch (error) {
      console.error('❌ 分析失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  try {
    const analyzer = new ContentCoverageAnalyzer();
    const result = await analyzer.analyze();
    
    console.log('\n✅ 分析完成');
    
  } catch (error) {
    console.error('💥 分析异常:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ContentCoverageAnalyzer;