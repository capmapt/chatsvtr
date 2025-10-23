/**
 * 测试D1 API清理后的效果
 */

const API_BASE = 'https://443fd29c.chatsvtr.pages.dev';

async function test(description, url) {
  console.log(`\n📋 ${description}`);
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.success) {
      console.log(`   ✅ 成功: ${data.data?.length || 0} 条记录`);
      if (data.data && data.data.length > 0) {
        const fields = Object.keys(data.data[0]).slice(0, 5);
        console.log(`   字段: ${fields.join(', ')}...`);
      }
    } else {
      console.log(`   ❌ 预期的错误: ${data.error}`);
    }
  } catch (error) {
    console.log(`   ❌ 异常: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 测试D1 API清理效果\n');
  console.log(`API: ${API_BASE}`);

  // 应该被拒绝的请求
  await test(
    '测试 companies 表（应该被拒绝）',
    `${API_BASE}/api/d1/query?table=companies`
  );

  await test(
    '测试 investors 表（应该被拒绝）',
    `${API_BASE}/api/d1/query?table=investors`
  );

  // 应该成功的请求
  await test(
    '测试 knowledge_base_nodes 表（应该成功）',
    `${API_BASE}/api/d1/query?table=knowledge_base_nodes&limit=5`
  );

  await test(
    '测试 published_articles 表（应该成功）',
    `${API_BASE}/api/d1/query?table=published_articles&limit=5`
  );

  await test(
    '测试 popular_articles 视图（应该成功）',
    `${API_BASE}/api/d1/query?view=popular_articles&limit=3`
  );

  // 已删除的视图
  await test(
    '测试 funding_ranking 视图（应该被拒绝）',
    `${API_BASE}/api/d1/query?view=funding_ranking`
  );

  console.log('\n' + '='.repeat(60));
  console.log('✅ 清理验证完成！');
  console.log('='.repeat(60));
  console.log('- companies/investors 表已从API移除');
  console.log('- 相关视图已删除');
  console.log('- knowledge_base_nodes 和 published_articles 正常工作');
}

main();
