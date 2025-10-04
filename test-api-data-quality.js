#!/usr/bin/env node

/**
 * AI创投日报API数据质量检查
 */

const fs = require('fs');

// 读取API响应
const apiData = JSON.parse(fs.readFileSync('c:/Projects/chatsvtr/api-response.json', 'utf8'));

console.log('📊 AI创投日报API数据质量检查\n');
console.log('✅ API状态:', apiData.success ? '成功' : '失败');
console.log('📍 数据来源:', apiData.source);
console.log('📦 数据总数:', apiData.count);
console.log('⏰ 最后更新:', apiData.lastUpdate);

console.log('\n🔍 数据字段完整性分析:\n');

const fieldStats = {
  '企业介绍': 0,
  '团队背景': 0,
  '公司官网': 0,
  '联系方式': 0,
  '细分领域': 0,
  '二级分类': 0,
  '标签': 0
};

const emptyFields = {
  '企业介绍': [],
  '团队背景': [],
  '公司官网': [],
  '联系方式': []
};

apiData.data.forEach((item, index) => {
  Object.keys(fieldStats).forEach(field => {
    if (item[field] && item[field].trim() !== '') {
      fieldStats[field]++;
    } else if (field !== '标签' && field !== '二级分类') {
      emptyFields[field].push(`#${item['序号']} ${item['企业介绍']?.substring(0, 30) || '未知'}...`);
    }
  });
});

Object.entries(fieldStats).forEach(([field, count]) => {
  const percentage = ((count / apiData.count) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(percentage / 5));
  console.log(`${field.padEnd(10)}: ${bar.padEnd(20)} ${count}/${apiData.count} (${percentage}%)`);
});

console.log('\n⚠️ 缺失字段统计:\n');
Object.entries(emptyFields).forEach(([field, items]) => {
  if (items.length > 0) {
    console.log(`${field} (${items.length}条缺失):`);
    items.slice(0, 3).forEach(item => console.log(`  - ${item}`));
    if (items.length > 3) console.log(`  ...还有${items.length - 3}条`);
  }
});

console.log('\n💡 前端数据提取测试:\n');

// 模拟前端extractCompanyName函数（修复后）
function extractCompanyName(description) {
  const patterns = [
    /^([A-Za-z][\w\s&.-]*[A-Za-z\d])，/, // 英文公司名（最优先）
    /^([^，。,\s]{2,30})，\d{4}年/, // 中文公司名+年份模式
    /^([^，。,\s]{2,20})，/, // 句首到第一个逗号的部分
    /^([A-Za-z\u4e00-\u9fa5\s]+?)（/, // 括号前的部分
    /([A-Za-z\u4e00-\u9fa5]+)\s*，.*?成立/, // "xxx，成立"模式
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // 过滤掉明显不是公司名的结果
      if (name.length > 1 && name.length < 50 && !name.includes('年')) {
        return name;
      }
    }
  }
  return null;
}

// 模拟前端extractAmount函数
function extractAmount(description) {
  const currentRoundPatterns = [
    /完成[^,。]*?(\d+(?:\.\d+)?)\s*亿美元[^,。]*?融资/,
    /完成[^,。]*?(\d+(?:\.\d+)?)\s*亿元[^,。]*?融资/,
    /完成[^,。]*?(\d+(?:\.\d+)?)\s*千万美元[^,。]*?融资/,
  ];

  for (const pattern of currentRoundPatterns) {
    const match = description.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      const text = match[0];

      if (text.includes('亿美元')) return amount * 100000000;
      if (text.includes('亿元')) return amount * 100000000 / 7;
      if (text.includes('千万美元')) return amount * 10000000;
    }
  }
  return 10000000; // 默认值
}

// 测试前5条数据
console.log('前5条数据提取结果:\n');
apiData.data.slice(0, 5).forEach((item, i) => {
  const description = item['企业介绍'] || '';
  const companyName = extractCompanyName(description);
  const amount = extractAmount(description);
  const amountM = (amount / 1000000).toFixed(1);

  console.log(`[${i + 1}] 序号: ${item['序号']}`);
  console.log(`    提取公司名: ${companyName || '❌ 提取失败'}`);
  console.log(`    提取金额: $${amountM}M`);
  console.log(`    团队背景: ${item['团队背景'] ? '✅ 有' : '❌ 无'}`);
  console.log(`    公司官网: ${item['公司官网'] || '❌ 无'}`);
  console.log('');
});

console.log('✅ 数据质量检查完成!');
