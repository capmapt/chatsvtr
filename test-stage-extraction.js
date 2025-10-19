#!/usr/bin/env node
/**
 * 融资轮次提取规则测试脚本
 * 用于分析实际数据中的轮次识别情况
 */

const https = require('https');

// 融资阶段标签映射
const stageLabels = {
  'Pre-Seed': '种子前',
  'Pre-seed': '种子前',
  'Seed': '种子轮',
  'Pre-A': 'Pre-A轮',
  'A轮': 'A轮',
  'B轮': 'B轮',
  'C轮': 'C轮',
  'D轮': 'D轮',
  'E轮': 'E轮',
  'F轮': 'F轮',
  'Series A': 'A轮',
  'Series B': 'B轮',
  'Series C': 'C轮',
  'Series D': 'D轮',
  'Series E': 'E轮',
  'Series F': 'F轮',
  'IPO': 'IPO',
  'Strategic': '战略投资',
  'SAFE': 'SAFE',
  'M&A': '并购',
  '可转债': '可转债',
  'Unknown': '未知',
  '未知': '未知'
};

// 从企业介绍中提取融资轮次 (当前实现)
function extractStage(description) {
  // 优先提取"完成XX轮"格式（最近融资轮次）
  const currentRoundPatterns = [
    // Pre系列 + SAFE组合（最高优先级）
    { pattern: /完成[^。]*?Pre-seed\s*SAFE/i, stage: 'Pre-seed SAFE' },
    { pattern: /完成[^。]*?pre-Series\s*([A-Z])\s*SAFE/i, stage: (match) => {
      const letterMatch = match[0].match(/pre-Series\s*([A-Z])/i);
      if (!letterMatch || !letterMatch[1]) return 'SAFE';
      const letter = letterMatch[1].toUpperCase();
      return `Pre-${letter} SAFE`;
    }},

    // Pre系列轮次
    { pattern: /完成[^。]*?Pre-seed|完成[^。]*?种子前/i, stage: 'Pre-seed' },
    { pattern: /完成[^。]*?Pre-Series\s*([A-Z])|完成[^。]*?pre-Series\s*([A-Z])/i, stage: (match) => {
      const letterMatch = match[0].match(/Pre-Series\s*([A-Z])|pre-Series\s*([A-Z])/i);
      if (!letterMatch) return 'Pre-A';
      const letter = letterMatch[1] || letterMatch[2];
      return letter ? `Pre-${letter.toUpperCase()}` : 'Pre-A';
    }},
    { pattern: /完成[^。]*?Pre-[A-Z]\+?轮|完成[^。]*?PreA/i, stage: 'Pre-A' },

    // 早期轮次
    { pattern: /完成[^。]*?天使轮|完成[^。]*?天使/, stage: 'Seed' },
    { pattern: /完成[^。]*?种子轮/, stage: 'Seed' },

    // 标准轮次 (A-Z轮，支持+ ++号) - 增强版：支持"完成2,300万美元A轮融资"、"A++轮"、"B+ 轮"(带空格)
    { pattern: /完成[^。]*?([A-Z])\s*\+{1,2}\s*轮\s*融资/i, stage: (matchedString) => {
      const letterMatch = matchedString.match(/([A-Z])\s*(\+{1,2})\s*轮/i);
      if (letterMatch) {
        const letter = letterMatch[1];
        const plusCount = (letterMatch[2] || '').length;
        if (plusCount === 2) return `${letter.toUpperCase()}++`;
        if (plusCount === 1) return `${letter.toUpperCase()}+`;
        return `${letter.toUpperCase()}轮`;
      }
      return 'Unknown';
    }},

    // 无加号的标准轮次 (支持"D 轮 融资"这种带空格的格式)
    { pattern: /完成[^。]*?([A-Z])\s*轮\s*融资/i, stage: (matchedString) => {
      const letterMatch = matchedString.match(/([A-Z])\s*轮/i);
      if (letterMatch) {
        return `${letterMatch[1].toUpperCase()}轮`;
      }
      return 'Unknown';
    }},

    // 特殊融资类型
    { pattern: /完成[^。]*?SAFE轮/i, stage: 'SAFE' },
    { pattern: /完成[^。]*?可转债|完成[^。]*?可转换债券/, stage: '可转债' },
    { pattern: /完成[^。]*?战略投资|完成[^。]*?战略融资/, stage: 'Strategic' },
    { pattern: /完成[^。]*?IPO|完成[^。]*?上市/, stage: 'IPO' },
    { pattern: /完成[^。]*?并购|完成[^。]*?收购/, stage: 'M&A' },
  ];

  // 先尝试匹配"完成XX轮"格式
  for (const { pattern, stage } of currentRoundPatterns) {
    const match = description.match(pattern);
    if (match) {
      const extractedStage = typeof stage === 'function' ? stage(match[0]) : stage;
      return { stage: stageLabels[extractedStage] || extractedStage, method: '完成模式', matched: match[0] };
    }
  }

  // 通用模式（保留原逻辑）
  const generalPatterns = [
    { pattern: /Pre-seed\s*SAFE/i, stage: 'Pre-seed SAFE' },
    { pattern: /Pre-seed|种子前/i, stage: 'Pre-seed' },
    { pattern: /Pre-[A-Z]\+?轮|PreA/i, stage: 'Pre-A' },
    { pattern: /天使轮|天使/, stage: 'Seed' },
    { pattern: /种子轮/, stage: 'Seed' },
    { pattern: /([A-Z])\+?轮融资|([A-Z])\+?轮/i, stage: (matchedString) => {
      const letterMatch = matchedString.match(/([A-Z])\+?轮/i);
      if (letterMatch) {
        const letter = letterMatch[1];
        const hasPlus = matchedString.includes('+');
        return hasPlus ? `${letter.toUpperCase()}+` : `${letter.toUpperCase()}轮`;
      }
      return 'Unknown';
    }},
    { pattern: /SAFE轮/i, stage: 'SAFE' },
    { pattern: /可转债|可转换债券/, stage: '可转债' },
    { pattern: /战略投资|战略融资/, stage: 'Strategic' },
    { pattern: /IPO|上市/, stage: 'IPO' },
    { pattern: /并购|收购/, stage: 'M&A' },
  ];

  for (const { pattern, stage } of generalPatterns) {
    const match = description.match(pattern);
    if (match) {
      const extractedStage = typeof stage === 'function' ? stage(match[0]) : stage;
      return { stage: stageLabels[extractedStage] || extractedStage, method: '通用模式', matched: match[0] };
    }
  }

  return { stage: '未知', method: '未识别', matched: null };
}

// 获取数据
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON解析失败: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// 主测试函数
async function testStageExtraction() {
  console.log('\n🔍 开始测试融资轮次提取规则...\n');

  try {
    const result = await fetchData('https://svtr.ai/api/wiki-funding-sync?force=true&refresh=true');

    if (!result || !result.data) {
      console.error('❌ 未获取到数据');
      return;
    }

    console.log(`📊 总数据量: ${result.data.length} 条\n`);

    // 统计
    const stats = {
      total: result.data.length,
      unknown: 0,
      recognized: 0,
      byStage: {},
      byMethod: {}
    };

    const unknownSamples = [];

    // 分析每条数据
    result.data.forEach((item, index) => {
      const description = item['企业介绍'] || '';
      const extractionResult = extractStage(description);

      // 统计轮次分布
      if (!stats.byStage[extractionResult.stage]) {
        stats.byStage[extractionResult.stage] = 0;
      }
      stats.byStage[extractionResult.stage]++;

      // 统计识别方法
      if (!stats.byMethod[extractionResult.method]) {
        stats.byMethod[extractionResult.method] = 0;
      }
      stats.byMethod[extractionResult.method]++;

      // 收集未知轮次样本
      if (extractionResult.stage === '未知') {
        stats.unknown++;
        if (unknownSamples.length < 10) {
          unknownSamples.push({
            index: index + 1,
            company: description.substring(0, 100),
            fullDesc: description
          });
        }
      } else {
        stats.recognized++;
      }
    });

    // 输出统计结果
    console.log('📈 识别统计:');
    console.log(`  ✅ 已识别: ${stats.recognized} 条 (${(stats.recognized / stats.total * 100).toFixed(1)}%)`);
    console.log(`  ❓ 未识别: ${stats.unknown} 条 (${(stats.unknown / stats.total * 100).toFixed(1)}%)\n`);

    console.log('🏷️  轮次分布:');
    Object.entries(stats.byStage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([stage, count]) => {
        const icon = stage === '未知' ? '❓' : '✅';
        console.log(`  ${icon} ${stage}: ${count} 条 (${(count / stats.total * 100).toFixed(1)}%)`);
      });

    console.log('\n🔧 识别方法分布:');
    Object.entries(stats.byMethod)
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        console.log(`  - ${method}: ${count} 条 (${(count / stats.total * 100).toFixed(1)}%)`);
      });

    // 输出未识别样本
    if (unknownSamples.length > 0) {
      console.log('\n\n⚠️  未识别轮次样本 (前10条):');
      console.log('='.repeat(80));
      unknownSamples.forEach(sample => {
        console.log(`\n[样本 ${sample.index}]`);
        console.log(`企业介绍: ${sample.company}${sample.company.length < sample.fullDesc.length ? '...' : ''}`);
        console.log(`完整描述: ${sample.fullDesc}`);
        console.log('-'.repeat(80));
      });
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 执行测试
if (require.main === module) {
  testStageExtraction().then(() => {
    console.log('\n✅ 测试完成\n');
    process.exit(0);
  }).catch(err => {
    console.error('\n❌ 测试异常:', err);
    process.exit(1);
  });
}

module.exports = { extractStage };
