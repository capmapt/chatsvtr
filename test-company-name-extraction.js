console.log('🧪 测试从企业介绍中提取公司名称...');

const testCases = [
  {
    description: "是石科技，2020年成立于中国浙江省平湖市，超算中心运营维护与\"HPC+AI\"统一计算平台提供商。",
    expected: "是石科技"
  },
  {
    description: "一星机器人，2025年成立于中国江苏省苏州市，面向真实生产场景的具身智能/工业机器人研发商。",
    expected: "一星机器人"
  },
  {
    description: "微分智飞，2024年成立于中国浙江省杭州市，智能无人机与飞行机器人具身智能/群体智能研发商。",
    expected: "微分智飞"
  },
  {
    description: "小茶桌（Teable），2023年成立于中国广东省深圳市，AI多维表格/无代码数据库研发商。",
    expected: "小茶桌"
  },
  {
    description: "Wayve，2017年成立于英国伦敦，开发自动驾驶汽车技术。",
    expected: "Wayve"
  },
  {
    description: "Upscale AI，2023年成立于美国加州Palo Alto，开发开放标准网络基础设施以连接并扩展 AI 计算。",
    expected: "Upscale AI"
  }
];

function extractCompanyName(企业介绍) {
  let companyName = '';
  if (企业介绍) {
    // 模式1: "公司名，20XX年成立" 或 "公司名，成立于"
    const pattern1 = /^([^，,。.!]+?)，(?=20\\d{2}年?成立|成立于)/;
    const match1 = 企业介绍.match(pattern1);

    if (match1) {
      companyName = match1[1].trim();
    } else {
      // 模式2: "公司名（英文名），..."
      const pattern2 = /^([^（）(),]+?)(?:[（(][^）)]*[）)])?，/;
      const match2 = 企业介绍.match(pattern2);

      if (match2) {
        companyName = match2[1].trim();
      } else {
        // 模式3: 从句首提取第一个词作为公司名
        const pattern3 = /^([A-Za-z\\u4e00-\\u9fa5]+)/;
        const match3 = 企业介绍.match(pattern3);

        if (match3) {
          companyName = match3[1].trim();
        }
      }
    }

    // 长度验证和清理
    if (companyName.length > 20) {
      companyName = companyName.substring(0, 20);
    }
  }
  return companyName;
}

console.log('📊 测试结果:');
let successCount = 0;

testCases.forEach((testCase, index) => {
  const extracted = extractCompanyName(testCase.description);
  const isSuccess = extracted === testCase.expected;

  console.log(`\\n测试 ${index + 1}: ${isSuccess ? '✅' : '❌'}`);
  console.log(`描述: ${testCase.description.substring(0, 50)}...`);
  console.log(`期望: "${testCase.expected}"`);
  console.log(`提取: "${extracted}"`);

  if (isSuccess) successCount++;
});

console.log(`\\n📊 总结: ${successCount}/${testCases.length} 个测试通过 (${Math.round(successCount/testCases.length*100)}%)`);

// 测试实际API数据
console.log('\\n🔍 测试实际API数据...');
fetch('https://svtr.ai/api/wiki-funding-sync')
.then(response => response.json())
.then(data => {
  const records = data.records || data.data || [];
  console.log('\\n📋 前5条记录的公司名称提取:');
  records.slice(0, 5).forEach((record, index) => {
    const extracted = extractCompanyName(record.description);
    console.log(`${index + 1}. 当前: "${record.companyName}" → 新提取: "${extracted}"`);
  });
}).catch(console.error);