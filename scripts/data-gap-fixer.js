#!/usr/bin/env node

/**
 * 数据缺失修复工具
 * 自动修复"Anthropic融资xx亿元"等数据空格问题
 * 基于实际数据补充缺失信息
 */

const fs = require('fs');
const path = require('path');

class DataGapFixer {
  constructor() {
    this.dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    this.backupFile = this.dataFile.replace('.json', `-backup-${Date.now()}.json`);
    this.logFile = path.join(__dirname, '../logs/data-fix-log.json');
    
    // 注意：此数据填充库应该被网络搜索或RAG系统替代
    // 当前使用基于2025年8月最新搜索的真实数据
    this.realDataFixes = {
      'anthropic': {
        '融资': '35亿美元',
        '轮次': 'Series E',
        '投资方': 'Lightspeed Venture Partners、Amazon等',
        '估值': '615亿美元',
        '时间': '2025年3月',
        '详情': 'Anthropic在2025年3月完成35亿美元Series E融资，估值615亿美元，可能进行1700亿美元新轮融资'
      },
      'openai': {
        '融资': '400亿美元',
        '轮次': 'SoftBank领投轮',
        '投资方': 'SoftBank、Microsoft、Thrive Capital等', 
        '估值': '3000亿美元',
        '时间': '2025年3月',
        '详情': 'OpenAI在2025年3月完成400亿美元融资，估值3000亿美元，成为最有价值私营科技公司之一'
      },
      'svtr': {
        '创始人': 'Min Liu (Allen)',
        '成立时间': '2023年',
        '定位': '全球AI创投行业生态系统建设',
        '数据规模': '追踪10,761+家全球AI公司，覆盖121,884+专业投资人和创业者',
        '核心产品': 'AI创投库、AI创投会、AI创投营',
        '详情': 'SVTR由Min Liu (Allen)在美国硅谷创立，专注全球AI创投行业生态系统建设'
      },
      '2025年ai融资': {
        '总额': '1,481亿美元',
        '交易数': '1,151起',
        '季度': 'Q1-Q2',
        '趋势': '企业级AI应用成为投资重点',
        '详情': '2025年Q1-Q2全球AI融资总额达1,481亿美元，共1,151起交易'
      }
    };

    this.fixPatterns = [
      {
        pattern: /(\w+)最近融资\s*xx\s*亿元/gi,
        fix: (match, company) => this.fixFundingAmount(company, match)
      },
      {
        pattern: /(\w+)\s*融资\s*xx\s*[万千亿]/gi,
        fix: (match, company) => this.fixFundingAmount(company, match)
      },
      {
        pattern: /SVTR\s*创始人\s*[:：]\s*$/gmi,
        fix: () => 'SVTR创始人：Min Liu (Allen)'
      },
      {
        pattern: /OpenAI\s*分析\s*[:：]\s*$/gmi,
        fix: () => 'OpenAI分析：作为全球最具影响力的AI公司，OpenAI在2024年估值达1570亿美元'
      },
      {
        pattern: /轮次\s*[:：]\s*$/gmi,
        fix: (match, context) => this.fixRoundInfo(context)
      },
      {
        pattern: /估值\s*[:：]\s*xx\s*[万千亿]/gi,
        fix: (match, company) => this.fixValuation(company, match)
      }
    ];
  }

  async fix() {
    console.log('🔧 开始数据缺失修复...\n');

    const fixLog = {
      timestamp: new Date().toISOString(),
      summary: {
        totalNodes: 0,
        nodesFixed: 0,
        patternsFixed: 0
      },
      fixes: [],
      errors: []
    };

    try {
      // 1. 创建备份
      await this.createBackup();
      
      // 2. 读取数据
      const rawData = fs.readFileSync(this.dataFile, 'utf8');
      const data = JSON.parse(rawData);
      
      if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('数据格式不正确');
      }

      fixLog.summary.totalNodes = data.nodes.length;
      console.log(`📊 准备修复 ${data.nodes.length} 个节点`);

      // 3. 逐个修复节点
      for (let i = 0; i < data.nodes.length; i++) {
        const node = data.nodes[i];
        const fixes = await this.fixNode(node, i);
        
        if (fixes.length > 0) {
          fixLog.summary.nodesFixed++;
          fixLog.summary.patternsFixed += fixes.length;
          fixLog.fixes.push({
            nodeId: node.id || `node-${i}`,
            title: node.title?.substring(0, 50),
            fixes: fixes
          });
        }
        
        // 进度显示
        if ((i + 1) % 50 === 0) {
          console.log(`   修复进度: ${i + 1}/${data.nodes.length} (已修复${fixLog.summary.nodesFixed}个节点)`);
        }
      }

      // 4. 保存修复后的数据
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
      
      // 5. 保存修复日志
      await this.saveFixLog(fixLog);

      // 6. 显示修复结果
      this.displayResults(fixLog);

      return fixLog;

    } catch (error) {
      fixLog.errors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      
      console.error('❌ 修复失败:', error.message);
      
      // 尝试恢复备份
      await this.restoreFromBackup();
      throw error;
    }
  }

  async fixNode(node, index) {
    const fixes = [];
    const originalContent = node.content || '';
    let fixedContent = originalContent;
    const nodeId = node.id || `node-${index}`;

    // 应用所有修复模式
    this.fixPatterns.forEach((pattern, patternIndex) => {
      const matches = fixedContent.match(pattern.pattern);
      if (matches) {
        matches.forEach(match => {
          try {
            let replacement;
            
            // 提取公司名或上下文
            const context = this.extractContext(fixedContent, match, 200);
            const companyName = this.extractCompanyName(match, context);
            
            if (typeof pattern.fix === 'function') {
              replacement = pattern.fix(match, companyName, context);
            } else {
              replacement = pattern.fix;
            }
            
            if (replacement && replacement !== match) {
              fixedContent = fixedContent.replace(match, replacement);
              fixes.push({
                pattern: pattern.pattern.toString(),
                original: match,
                fixed: replacement,
                context: context.substring(0, 100) + '...'
              });
            }
          } catch (error) {
            console.warn(`修复模式${patternIndex}失败:`, error.message);
          }
        });
      }
    });

    // 通用清理
    const cleanedContent = this.performGeneralCleaning(fixedContent);
    if (cleanedContent !== fixedContent) {
      fixes.push({
        pattern: 'general_cleaning',
        original: '格式清理',
        fixed: '已优化格式和空白字符',
        context: ''
      });
      fixedContent = cleanedContent;
    }

    // 更新节点内容
    if (fixes.length > 0) {
      node.content = fixedContent;
      
      // 更新元数据
      if (!node.metadata) node.metadata = {};
      node.metadata.lastFixed = new Date().toISOString();
      node.metadata.fixedPatterns = fixes.length;
    }

    return fixes;
  }

  fixFundingAmount(companyName, originalMatch) {
    if (!companyName) return originalMatch;
    
    const companyLower = companyName.toLowerCase();
    
    // 查找匹配的真实数据
    for (const [key, data] of Object.entries(this.realDataFixes)) {
      if (companyLower.includes(key) && data.融资) {
        return originalMatch.replace(/xx\s*[万千亿][美元元]?/, data.融资);
      }
    }
    
    // 通用修复：移除"xx"标记
    return originalMatch.replace(/xx\s*/, '[待补充]');
  }

  fixValuation(companyName, originalMatch) {
    if (!companyName) return originalMatch;
    
    const companyLower = companyName.toLowerCase();
    
    for (const [key, data] of Object.entries(this.realDataFixes)) {
      if (companyLower.includes(key) && data.估值) {
        return originalMatch.replace(/xx\s*[万千亿][美元元]?/, data.估值);
      }
    }
    
    return originalMatch.replace(/xx\s*/, '[待补充]');
  }

  fixRoundInfo(context) {
    const contextLower = (context || '').toLowerCase();
    
    if (contextLower.includes('anthropic')) {
      return '轮次：C轮';
    }
    if (contextLower.includes('openai')) {
      return '轮次：后期融资';
    }
    
    return '轮次：[待补充]';
  }

  extractCompanyName(match, context) {
    // 从匹配文本中提取公司名
    const companyMatch = match.match(/(\w+)(?=最近融资|融资|估值)/);
    if (companyMatch) {
      return companyMatch[1];
    }
    
    // 从上下文中提取
    const contextMatch = context.match(/(\w+)(?:公司|企业|AI|科技)/gi);
    if (contextMatch && contextMatch.length > 0) {
      return contextMatch[0].replace(/公司|企业|AI|科技/gi, '');
    }
    
    return null;
  }

  extractContext(content, match, contextLength = 200) {
    const index = content.indexOf(match);
    if (index === -1) return '';
    
    const start = Math.max(0, index - contextLength / 2);
    const end = Math.min(content.length, index + match.length + contextLength / 2);
    
    return content.substring(start, end);
  }

  performGeneralCleaning(content) {
    let cleaned = content;
    
    // 移除多余空白字符
    cleaned = cleaned.replace(/[\u00A0\u2000-\u200F\u2028-\u202F\u3000]/g, ' ');
    
    // 规范空格
    cleaned = cleaned.replace(/\s{3,}/g, ' ');
    
    // 规范换行
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    // 移除行首尾空格
    cleaned = cleaned.replace(/^\s+|\s+$/gm, '');
    
    // 规范标点
    cleaned = cleaned.replace(/[。！？]{2,}/g, '。');
    
    return cleaned;
  }

  async createBackup() {
    try {
      const originalData = fs.readFileSync(this.dataFile);
      fs.writeFileSync(this.backupFile, originalData);
      console.log(`💾 数据备份已创建: ${path.basename(this.backupFile)}`);
    } catch (error) {
      throw new Error(`创建备份失败: ${error.message}`);
    }
  }

  async restoreFromBackup() {
    try {
      if (fs.existsSync(this.backupFile)) {
        const backupData = fs.readFileSync(this.backupFile);
        fs.writeFileSync(this.dataFile, backupData);
        console.log('📁 已从备份恢复数据');
      }
    } catch (error) {
      console.error('恢复备份失败:', error.message);
    }
  }

  async saveFixLog(fixLog) {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      fs.writeFileSync(this.logFile, JSON.stringify(fixLog, null, 2));
      console.log(`📝 修复日志已保存: ${this.logFile}`);
    } catch (error) {
      console.warn('保存日志失败:', error.message);
    }
  }

  displayResults(fixLog) {
    console.log('\n🎯 数据修复结果摘要');
    console.log('='*40);
    console.log(`📊 总节点数: ${fixLog.summary.totalNodes}`);
    console.log(`✅ 已修复节点: ${fixLog.summary.nodesFixed}`);
    console.log(`🔧 修复模式数: ${fixLog.summary.patternsFixed}`);
    console.log(`⚠️  错误数量: ${fixLog.errors.length}\n`);

    if (fixLog.fixes.length > 0) {
      console.log('📋 修复示例 (前5个):');
      fixLog.fixes.slice(0, 5).forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.title || 'Untitled'}`);
        fix.fixes.forEach(f => {
          console.log(`   - ${f.original} → ${f.fixed}`);
        });
      });
      console.log();
    }

    if (fixLog.errors.length > 0) {
      console.log('❌ 错误详情:');
      fixLog.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.error}`);
      });
      console.log();
    }

    console.log('✨ 数据修复完成！建议运行以下命令验证结果:');
    console.log('   npm run scan:data-quality');
  }
}

// 主函数
async function main() {
  console.log('🔧 SVTR 数据缺失修复工具启动\n');

  try {
    const fixer = new DataGapFixer();
    const result = await fixer.fix();
    
    console.log('\n🎉 修复任务完成！');
    
    // 建议后续操作
    if (result.summary.nodesFixed > 0) {
      console.log('\n📌 建议后续操作:');
      console.log('1. npm run scan:data-quality  # 验证修复效果');
      console.log('2. npm run test:e2e          # 测试聊天功能');
      console.log('3. npm run deploy:cloudflare # 部署更新');
    }
    
  } catch (error) {
    console.error('💥 修复失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataGapFixer;