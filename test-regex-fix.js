console.log('🧪 测试正则表达式修复...');

const teamBackground = "Barun Kar，Upscale AI联合创始人、总裁兼首席执行官。曾是Auradine创始人兼首席运营官，曾是Palo Alto Networks（帕洛阿尔托网络公司）工程高级副总裁，曾在Juniper Networks（瞻博网络）担任高级系统经理，曾在LuxN担任硬件经理。1990年毕业于印度理工学院卡拉格布尔分校，获得电子与电气工程学士学位；1993年毕业于马萨诸塞大学阿默斯特分校，获得计算机工程博士学位。";
const contactInfo = "https://www.linkedin.com/in/barun-k-ba48b01/";

function addLinksToTeamBackground(teamBackground, contactInfo) {
  if (!teamBackground) return '';

  let enhancedText = teamBackground;

  // 如果有联系方式链接，为创始人姓名添加超链接
  if (contactInfo) {
    // 匹配英文姓名模式 (First Last)
    const englishNamePattern = /([A-Z][a-z]+\s+[A-Z][a-z]+)/g;
    enhancedText = enhancedText.replace(englishNamePattern, (match, name) => {
      const cleanName = name.trim();
      console.log(`🔍 匹配到英文姓名: "${cleanName}"`);
      return `<a href="${contactInfo}" target="_blank" class="founder-link" title="访问 ${cleanName} 的联系方式">${cleanName}</a>`;
    });

    console.log('📄 英文姓名处理后:', enhancedText.substring(0, 100) + '...');

    // 匹配中文或混合姓名模式，但排除已经被链接包围的文本
    const namePattern = /([A-Za-z\u4e00-\u9fa5]{2,4})\s*，/g;
    enhancedText = enhancedText.replace(namePattern, (match, name) => {
      const cleanName = name.trim();
      console.log(`🔍 匹配到姓名模式: "${match}" -> 姓名: "${cleanName}"`);

      // 检查这个名字是否已经在链接中
      if (match.includes('<a href') || match.includes('</a>')) {
        console.log(`⚠️ ${cleanName} 已经是链接，跳过`);
        return match;
      }
      console.log(`✅ 为 ${cleanName} 添加链接`);
      return `<a href="${contactInfo}" target="_blank" class="founder-link" title="访问 ${cleanName} 的联系方式">${cleanName}</a>，`;
    });
  }

  return enhancedText;
}

console.log('🎯 原始文本:');
console.log(teamBackground.substring(0, 100) + '...');

console.log('\n🔗 处理后:');
const result = addLinksToTeamBackground(teamBackground, contactInfo);
console.log(result.substring(0, 300) + '...');

console.log('\n🔍 检查是否包含超链接标签:');
console.log('包含 <a href:', result.includes('<a href'));
console.log('包含 Barun Kar 链接:', result.includes('Barun Kar</a>'));