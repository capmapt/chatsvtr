/**
 * D1 Query API 测试脚本
 * 测试新的通用查询接口
 */

const API_BASE = 'https://ec600106.chatsvtr.pages.dev';

async function testQuery(description, url) {
  console.log(`\n📋 测试: ${description}`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      console.error(`   ❌ 失败: ${data.error}`);
      return false;
    }

    console.log(`   ✅ 成功: 返回 ${data.data?.length || 0} 条记录`);

    // 显示第一条记录的字段
    if (data.data && data.data.length > 0) {
      const firstRecord = data.data[0];
      console.log(`   字段: ${Object.keys(firstRecord).slice(0, 5).join(', ')}...`);
    }

    // 显示分页信息
    if (data.pagination) {
      console.log(`   分页: offset=${data.pagination.offset}, limit=${data.pagination.limit}, hasMore=${data.pagination.hasMore}`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ 错误: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 开始测试D1 Query API...\n');
  console.log(`API基础URL: ${API_BASE}`);

  const tests = [
    // 基础表查询
    {
      description: '查询knowledge_base_nodes表 (前5条)',
      url: `${API_BASE}/api/d1/query?table=knowledge_base_nodes&limit=5`
    },
    {
      description: '查询companies表',
      url: `${API_BASE}/api/d1/query?table=companies&limit=10`
    },
    {
      description: '查询published_articles表',
      url: `${API_BASE}/api/d1/query?table=published_articles&limit=10`
    },

    // 排序测试
    {
      description: '按融资日期排序的公司',
      url: `${API_BASE}/api/d1/query?table=companies&order_by=last_funding_date&order=desc&limit=10`
    },
    {
      description: '按浏览量排序的文章',
      url: `${API_BASE}/api/d1/query?table=published_articles&order_by=view_count&order=desc&limit=10`
    },

    // 筛选测试
    {
      description: '筛选Series A公司',
      url: `${API_BASE}/api/d1/query?table=companies&latest_stage=Series A&limit=10`
    },
    {
      description: '筛选AI创投观察文章',
      url: `${API_BASE}/api/d1/query?table=published_articles&category=AI创投观察&limit=10`
    },

    // 分页测试
    {
      description: '分页查询 (第2页)',
      url: `${API_BASE}/api/d1/query?table=knowledge_base_nodes&limit=10&offset=10`
    },

    // 预定义视图测试
    {
      description: '热门文章视图',
      url: `${API_BASE}/api/d1/query?view=popular_articles&limit=5`
    },
    {
      description: '融资排行榜视图 (按估值)',
      url: `${API_BASE}/api/d1/query?view=funding_ranking&metric=valuation&limit=10`
    },
    {
      description: '最新融资公告 (30天内)',
      url: `${API_BASE}/api/d1/query?view=recent_funding&days=30&limit=20`
    },

    // 错误处理测试
    {
      description: '无效的表名 (应该返回错误)',
      url: `${API_BASE}/api/d1/query?table=invalid_table`
    },
    {
      description: '无效的排序字段 (应该返回错误)',
      url: `${API_BASE}/api/d1/query?table=companies&order_by=invalid_field`
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testQuery(test.description, test.url);
    if (result) {
      passed++;
    } else {
      failed++;
    }

    // 短暂延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${(passed / (passed + failed) * 100).toFixed(1)}%`);

  if (passed === tests.length) {
    console.log('\n🎉 所有测试通过!');
  } else {
    console.log('\n⚠️  部分测试失败，请检查日志');
  }
}

main();
