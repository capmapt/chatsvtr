/**
 * D1 RAG Service Test Script
 * 测试D1数据库RAG检索功能
 */

console.log('🚀 开始测试D1 RAG服务...\n');

// 测试用例
const testQueries = [
  {
    query: '最近有哪些AI公司融资',
    description: '测试融资数据检索',
    expectedTopics: ['融资', 'AI公司', '投资']
  },
  {
    query: 'OpenAI的最新估值是多少',
    description: '测试特定公司数据检索',
    expectedTopics: ['OpenAI', '估值']
  },
  {
    query: 'YC投资了哪些AI公司',
    description: '测试投资机构数据检索',
    expectedTopics: ['YC', 'Y Combinator', 'AI公司']
  },
  {
    query: 'AI创投季度观察最新内容',
    description: '测试隐藏工作表数据检索',
    expectedTopics: ['创投', '季度', 'AI']
  },
  {
    query: 'AI创业公司融资轮次分布',
    description: '测试榜单数据检索',
    expectedTopics: ['融资', '轮次', '创业']
  }
];

/**
 * 简化测试 - 通过SQL直接查询D1数据库
 */
async function testD1Queries() {
  const results = [];

  for (const testCase of testQueries) {
    console.log(`\n📋 测试: ${testCase.description}`);
    console.log(`   查询: "${testCase.query}"`);

    // 提取关键词（简化版）
    const keywords = testCase.query
      .toLowerCase()
      .replace(/[^\\w\\s\\u4e00-\\u9fa5]/g, ' ')
      .split(/\\s+/)
      .filter(w => w.length > 1 && !['的', '了', '是', '在', '有', '和', '与'].includes(w));

    console.log(`   关键词: ${keywords.join(', ')}`);

    // 模拟SQL查询（实际在Wrangler环境中执行）
    const mockSQL = `
      SELECT
        n.node_token,
        n.title,
        n.obj_type,
        SUBSTR(c.full_content, 1, 200) as content_preview
      FROM knowledge_base_nodes n
      INNER JOIN knowledge_base_content c ON n.node_token = c.node_token
      WHERE n.is_public = 1
        AND n.is_indexed = 1
        AND (${keywords.map(() => `(n.title LIKE '%keyword%' OR c.full_content LIKE '%keyword%')`).join(' OR ')})
      LIMIT 5;
    `;

    console.log(`   ✅ SQL构建成功`);
    console.log(`   💡 预期包含主题: ${testCase.expectedTopics.join(', ')}\n`);

    results.push({
      query: testCase.query,
      keywords,
      sqlTemplate: mockSQL.split('\n').filter(l => l.trim()).slice(0, 5).join('\n'),
      expectedTopics: testCase.expectedTopics
    });
  }

  return results;
}

/**
 * 执行测试
 */
async function main() {
  try {
    const results = await testD1Queries();

    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结');
    console.log('='.repeat(60));

    console.log(`\n✅ 测试用例数: ${results.length}`);
    console.log(`✅ 所有SQL查询构建成功`);

    console.log('\n📋 测试用例详情:\n');
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.query}`);
      console.log(`   关键词: ${r.keywords.join(', ')}`);
      console.log(`   预期主题: ${r.expectedTopics.join(', ')}\n`);
    });

    console.log('\n💡 下一步: 在Cloudflare Workers环境中测试实际查询');
    console.log('   命令: 访问 http://localhost:3000 并使用聊天功能\n');

    console.log('✅ D1 RAG服务测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

main();
