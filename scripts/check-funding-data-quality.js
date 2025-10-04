#!/usr/bin/env node
/**
 * AI创投日报数据质量检查
 * 用于检测数据提取、缓存刷新、字段映射等问题
 */

const https = require('https');

// 配置
const CONFIG = {
  API_URL: 'https://svtr.ai/api/wiki-funding-sync?force=true&refresh=true',
  MIN_RECORDS: 30,           // 最少记录数
  MIN_VALID_TEAM_RATIO: 0.5, // 团队背景有效率阈值 (50%)
  MAX_DEFAULT_AMOUNT_COUNT: 5 // 最多允许多少条使用默认金额
};

// ANSI颜色
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

// 检查团队背景有效性
function isInvalidTeamBackground(teamBackground) {
  if (!teamBackground || typeof teamBackground !== 'string') return true;

  const trimmed = teamBackground.trim();
  const invalidPatterns = [
    /^\d+月\d+日$/,
    /^20\d{2}年\d+月\d+日$/,
    /^[\d月日年]+$/,
    /^无$|^暂无$|^待补充$/,
    /^[\s\-_]+$/,
  ];

  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmed)) return true;
  }

  if (trimmed.length < 5) return true;
  return false;
}

// 检查融资金额提取
function checkAmountExtraction(record) {
  const desc = record['企业介绍'] || '';

  // 检查描述中是否包含融资金额
  const hasAmount = /\d+(?:,\d+)?(?:\.\d+)?\s*(亿|千万|万).*(美元|元)|完成[^，。]*?\$?\d+(?:,\d+)?(?:\.\d+)?\s*[MB]/.test(desc);

  // 如果有融资金额但提取结果是默认值,则可能有问题
  return {
    hasAmount,
    isDefault: record.amount === 10000000,
    suspicious: hasAmount && record.amount === 10000000
  };
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

// 主检查函数
async function checkDataQuality() {
  log('\n🔍 开始数据质量检查...\n', 'cyan');

  try {
    const result = await fetchData(CONFIG.API_URL);

    // 检查1: 数据来源
    log('【检查1】数据来源', 'blue');
    if (result.source === 'cache') {
      log('❌ 警告: 使用force=true&refresh=true仍返回缓存数据!', 'red');
      log('   建议: 检查API参数处理逻辑', 'yellow');
      return false;
    }
    log(`✅ 来源: ${result.source} (real-time)`, 'green');

    // 检查2: 数据数量
    log('\n【检查2】数据数量', 'blue');
    const count = result.count || result.data?.length || 0;
    if (count < CONFIG.MIN_RECORDS) {
      log(`❌ 错误: 仅获取到 ${count} 条数据 (最少需要 ${CONFIG.MIN_RECORDS} 条)`, 'red');
      return false;
    }
    log(`✅ 数据量: ${count} 条`, 'green');

    // 检查3: 团队背景质量
    log('\n【检查3】团队背景质量', 'blue');
    const data = result.data || [];
    const teamStats = {
      valid: 0,
      invalid: 0,
      samples: []
    };

    data.forEach((record, i) => {
      const tb = record['团队背景'] || '';
      const isInvalid = isInvalidTeamBackground(tb);

      if (isInvalid) {
        teamStats.invalid++;
        if (teamStats.samples.length < 3) {
          teamStats.samples.push({
            index: i + 1,
            company: record['企业介绍']?.substring(0, 30) || '未知',
            teamBg: tb || '【空】'
          });
        }
      } else {
        teamStats.valid++;
      }
    });

    const validRatio = teamStats.valid / count;
    if (validRatio < CONFIG.MIN_VALID_TEAM_RATIO) {
      log(`❌ 错误: 团队背景有效率 ${(validRatio * 100).toFixed(1)}% (低于 ${CONFIG.MIN_VALID_TEAM_RATIO * 100}%)`, 'red');
      log(`   有效: ${teamStats.valid} 条, 无效: ${teamStats.invalid} 条`, 'yellow');
      if (teamStats.samples.length > 0) {
        log('   无效样例:', 'yellow');
        teamStats.samples.forEach(s => {
          log(`   - [${s.index}] ${s.company}... → "${s.teamBg}"`, 'yellow');
        });
      }
      return false;
    }
    log(`✅ 有效率: ${(validRatio * 100).toFixed(1)}% (${teamStats.valid}/${count})`, 'green');

    // 检查4: 融资金额提取
    log('\n【检查4】融资金额提取', 'blue');
    const amountStats = {
      total: 0,
      suspicious: [],
      defaultCount: 0
    };

    data.forEach((record, i) => {
      const check = checkAmountExtraction(record);
      if (check.suspicious) {
        amountStats.suspicious.push({
          index: i + 1,
          company: record['企业介绍']?.substring(0, 40) || '未知',
          amount: record.amount
        });
      }
      if (check.isDefault) {
        amountStats.defaultCount++;
      }
    });

    if (amountStats.defaultCount > CONFIG.MAX_DEFAULT_AMOUNT_COUNT) {
      log(`⚠️  警告: ${amountStats.defaultCount} 条记录使用默认金额 (超过阈值 ${CONFIG.MAX_DEFAULT_AMOUNT_COUNT})`, 'yellow');
      if (amountStats.suspicious.length > 0) {
        log('   可疑记录 (描述有金额但提取失败):', 'yellow');
        amountStats.suspicious.slice(0, 3).forEach(s => {
          log(`   - [${s.index}] ${s.company}...`, 'yellow');
        });
      }
    } else {
      log(`✅ 默认金额记录: ${amountStats.defaultCount} 条`, 'green');
    }

    // 检查5: 字段完整性
    log('\n【检查5】字段完整性', 'blue');
    const fieldStats = {
      企业介绍: 0,
      公司官网: 0,
      二级分类: 0,
      标签: 0
    };

    data.forEach(record => {
      if (record['企业介绍']?.trim()) fieldStats.企业介绍++;
      if (record['公司官网']?.trim()) fieldStats.公司官网++;
      if (record['二级分类']?.trim()) fieldStats.二级分类++;
      if (record['标签']?.trim()) fieldStats.标签++;
    });

    Object.entries(fieldStats).forEach(([field, count]) => {
      const ratio = (count / data.length * 100).toFixed(1);
      const symbol = count === data.length ? '✅' : (count > data.length * 0.8 ? '⚠️ ' : '❌');
      log(`${symbol} ${field}: ${count}/${data.length} (${ratio}%)`, count === data.length ? 'green' : 'yellow');
    });

    // 总结
    log('\n' + '='.repeat(50), 'cyan');
    log('✅ 数据质量检查通过!', 'green');
    log('='.repeat(50) + '\n', 'cyan');

    return true;

  } catch (error) {
    log(`\n❌ 检查失败: ${error.message}`, 'red');
    return false;
  }
}

// 执行检查
if (require.main === module) {
  checkDataQuality().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkDataQuality, isInvalidTeamBackground, checkAmountExtraction };
