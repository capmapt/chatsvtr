console.log('🧪 测试精确超链接功能...');

const teamBackground = "Barun Kar，Upscale AI联合创始人、总裁兼首席执行官。曾是Auradine创始人兼首席运营官，曾是Palo Alto Networks（帕洛阿尔托网络公司）工程高级副总裁，曾在Juniper Networks（瞻博网络）担任高级系统经理，曾在LuxN担任硬件经理。1990年毕业于印度理工学院卡拉格布尔分校，获得电子与电气工程学士学位；1993年毕业于马萨诸塞大学阿默斯特分校，获得计算机工程博士学位。";
const contactInfo = "https://www.linkedin.com/in/barun-k-ba48b01/";

function addLinksToTeamBackground(teamBackground, contactInfo) {
  if (!teamBackground || !contactInfo) return teamBackground;

  let enhancedText = teamBackground;

  // 只为句首的人名（通常是创始人）添加超链接
  // 匹配句首的中英文姓名，后面跟着职位描述
  const founderPattern = /^([A-Za-z\u4e00-\u9fa5\s]{2,20})，(?=.{0,50}?(创始人|CEO|CTO|总裁|首席|联合创始人))/;
  const founderMatch = enhancedText.match(founderPattern);

  if (founderMatch) {
    const founderName = founderMatch[1].trim();
    console.log(`🎯 找到创始人: "${founderName}"`);
    enhancedText = enhancedText.replace(founderPattern,
      `<a href="${contactInfo}" target="_blank" class="founder-link" title="访问 ${founderName} 的联系方式">${founderName}</a>，`
    );
  } else {
    console.log('❌ 没有找到符合模式的创始人姓名');
  }

  return enhancedText;
}

console.log('🎯 原始文本:');
console.log(teamBackground);

console.log('\n🔗 处理后:');
const result = addLinksToTeamBackground(teamBackground, contactInfo);
console.log(result);

console.log('\n📊 检查结果:');
console.log('- 包含 Barun Kar 链接:', result.includes('Barun Kar</a>'));
console.log('- 包含其他不当链接:',
  result.includes('运营官</a>') ||
  result.includes('副总裁</a>') ||
  result.includes('经理</a>') ||
  result.includes('分校</a>')
);

// 测试没有联系方式的情况
console.log('\n🧪 测试没有联系方式的情况:');
const noContactResult = addLinksToTeamBackground(teamBackground, null);
console.log('返回原始文本:', noContactResult === teamBackground);

// 测试其他创始人模式
const otherFounder = "张三，某公司联合创始人兼CEO。拥有15年技术经验。";
console.log('\n🧪 测试其他创始人模式:');
const otherResult = addLinksToTeamBackground(otherFounder, contactInfo);
console.log('其他创始人结果:', otherResult);
console.log('包含张三链接:', otherResult.includes('张三</a>'));