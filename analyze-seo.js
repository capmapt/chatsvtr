#!/usr/bin/env node

/**
 * AI创投日报SEO分析工具
 */

const fs = require('fs');
const html = fs.readFileSync('c:/Projects/chatsvtr/svtr-homepage.html', 'utf8');

console.log('🔍 AI创投日报SEO深度分析\n');
console.log('='.repeat(60));

// 1. 内容可索引性
console.log('\n📄 1. 内容可索引性 (最关键)');
console.log('-'.repeat(60));

const hasJSContent = html.includes('fundingHighlights');
const hasStaticFundingCards = html.includes('class="funding-item"') || html.includes('class="funding-card"');
const hasDynamicLoadingOnly = html.includes('正在加载最新融资信息') && !hasStaticFundingCards;

console.log('容器存在:', hasJSContent ? '✅' : '❌');
console.log('静态内容:', hasStaticFundingCards ? '✅ 有预渲染' : '❌ 缺失');
console.log('渲染方式:', hasDynamicLoadingOnly ? '⚠️ 纯客户端渲染 (CSR)' : '✅ 服务端渲染 (SSR)');

if (hasDynamicLoadingOnly) {
  console.log('\n❌ 关键SEO问题:');
  console.log('   - 搜索引擎爬虫看不到融资数据内容');
  console.log('   - 内容100%依赖JavaScript渲染');
  console.log('   - Google可能索引,但其他搜索引擎(百度/360)会遗漏');
}

// 2. 结构化数据
console.log('\n📊 2. 结构化数据 (Schema.org)');
console.log('-'.repeat(60));

const hasJSONLD = html.includes('application/ld+json');
const hasMicrodata = html.includes('itemscope');
console.log('JSON-LD:', hasJSONLD ? '✅' : '❌ 缺失 - 应添加融资事件结构化数据');
console.log('Microdata:', hasMicrodata ? '✅' : '❌');

if (!hasJSONLD) {
  console.log('\n建议添加的Schema类型:');
  console.log('   - Organization (公司信息)');
  console.log('   - Article (融资新闻)');
  console.log('   - Event (融资事件)');
  console.log('   - MonetaryGrant (融资轮次)');
}

// 3. 语义化HTML
console.log('\n🏷️ 3. 语义化HTML结构');
console.log('-'.repeat(60));

const h1Count = (html.match(/<h1[^>]*>/g) || []).length;
const h2Count = (html.match(/<h2[^>]*>/g) || []).length;
const h3Count = (html.match(/<h3[^>]*>/g) || []).length;
const articleTags = (html.match(/<article[^>]*>/g) || []).length;
const timeTags = (html.match(/<time[^>]*>/g) || []).length;

console.log(`H1标签: ${h1Count} 个 ${h1Count === 1 ? '✅' : h1Count === 0 ? '❌' : '⚠️ 过多'}`);
console.log(`H2标签: ${h2Count} 个 ${h2Count > 0 ? '✅' : '❌'}`);
console.log(`H3标签: ${h3Count} 个`);
console.log(`<article>: ${articleTags} 个 ${articleTags > 0 ? '✅' : '⚠️ 建议为每条融资用<article>'}`);
console.log(`<time>: ${timeTags} 个 ${timeTags > 0 ? '✅' : '⚠️ 建议添加时间标签'}`);

// 4. 元数据完整性
console.log('\n📝 4. 页面元数据');
console.log('-'.repeat(60));

const hasTitle = html.includes('<title');
const hasDescription = html.includes('name="description"');
const hasKeywords = html.includes('name="keywords"');
const hasOG = html.includes('property="og:');
const hasCanonical = html.includes('rel="canonical"');

console.log('Title标签:', hasTitle ? '✅' : '❌');
console.log('Description:', hasDescription ? '✅' : '❌');
console.log('Keywords:', hasKeywords ? '✅' : '❌');
console.log('Open Graph:', hasOG ? '✅' : '❌');
console.log('Canonical:', hasCanonical ? '✅' : '❌');

// 5. 内容更新频率标识
console.log('\n⏰ 5. 内容新鲜度信号');
console.log('-'.repeat(60));

const hasUpdateTime = html.includes('fundingUpdateTime');
const hasLastModified = html.includes('last-modified') || html.includes('dateModified');
const hasPubDate = html.includes('datePublished');

console.log('更新时间显示:', hasUpdateTime ? '✅' : '❌');
console.log('lastModified:', hasLastModified ? '✅' : '⚠️ 建议添加');
console.log('datePublished:', hasPubDate ? '✅' : '⚠️ 建议添加');

// 6. 内部链接
console.log('\n🔗 6. 内部链接结构');
console.log('-'.repeat(60));

const companyLinks = (html.match(/href="[^"]*company[^"]*"/gi) || []).length;
const investorLinks = (html.match(/href="[^"]*investor[^"]*"/gi) || []).length;
const internalLinks = (html.match(/href="\/[^"]*"/g) || []).length;

console.log(`公司详情页链接: ${companyLinks} 个`);
console.log(`投资人详情页: ${investorLinks} 个`);
console.log(`内部链接总数: ${internalLinks} 个`);

if (companyLinks === 0) {
  console.log('⚠️ 建议: 为每家融资公司创建详情页并建立内链');
}

// 7. sitemap和robots
console.log('\n🤖 7. 爬虫引导文件');
console.log('-'.repeat(60));
console.log('需要检查:');
console.log('   - /robots.txt');
console.log('   - /sitemap.xml');
console.log('   - 建议: 动态生成sitemap包含所有融资记录');

// 8. 性能指标
console.log('\n⚡ 8. 页面性能');
console.log('-'.repeat(60));

const htmlSize = fs.statSync('c:/Projects/chatsvtr/svtr-homepage.html').size;
console.log(`HTML大小: ${(htmlSize / 1024).toFixed(1)} KB`);
console.log(`评估: ${htmlSize < 100000 ? '✅ 良好' : htmlSize < 200000 ? '⚠️ 中等' : '❌ 过大'}`);

// SEO综合评分
console.log('\n' + '='.repeat(60));
console.log('📊 SEO综合评分');
console.log('='.repeat(60));

let score = 0;
let maxScore = 0;

// 评分项
const scoreItems = [
  { name: '内容可索引', current: hasStaticFundingCards ? 1 : 0, max: 1, weight: 10 },
  { name: '结构化数据', current: hasJSONLD ? 1 : 0, max: 1, weight: 8 },
  { name: '语义化HTML', current: (h1Count === 1 && h2Count > 0 ? 1 : 0), max: 1, weight: 6 },
  { name: '元数据完整', current: (hasTitle && hasDescription && hasOG ? 1 : 0), max: 1, weight: 5 },
  { name: '新鲜度信号', current: hasUpdateTime ? 1 : 0, max: 1, weight: 4 },
];

scoreItems.forEach(item => {
  const weighted = item.current * item.weight;
  const maxWeighted = item.max * item.weight;
  score += weighted;
  maxScore += maxWeighted;

  const percentage = item.max > 0 ? (item.current / item.max * 100).toFixed(0) : 0;
  const bar = '█'.repeat(Math.floor(percentage / 10));
  console.log(`${item.name.padEnd(12)} [${bar.padEnd(10)}] ${percentage}% (${weighted}/${maxWeighted}分)`);
});

const finalScore = (score / maxScore * 100).toFixed(1);
console.log('\n总分:', `${score}/${maxScore} (${finalScore}%)`);
console.log('等级:', finalScore >= 80 ? '🏆 优秀' : finalScore >= 60 ? '✅ 良好' : finalScore >= 40 ? '⚠️ 及格' : '❌ 需改进');

console.log('\n' + '='.repeat(60));
console.log('✅ SEO分析完成!');
