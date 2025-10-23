#!/usr/bin/env node

/**
 * 直接调用飞书API检查Bitable中的所有表格（包括隐藏的）
 */

async function checkAllBitableTables() {
  console.log('🔍 直接查询飞书API - 检查Bitable中所有表格\n');

  // 获取access token
  const authRes = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: 'cli_a8e2014cbe7d9013',
      app_secret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0'
    })
  });

  const authData = await authRes.json();
  const token = authData.tenant_access_token;
  console.log('✅ 认证成功\n');

  // 已知的2个Bitable
  const bitables = [
    {
      name: '交易精选',
      app_token: 'XCNeb9GjNaQaeYsm7WwcZRSJn1f'
    },
    {
      name: '大模型丨Transformer论文八子',
      app_token: 'JfgqbMPWhakeNpsvP6wcjHIcnml'
    }
  ];

  for (const bitable of bitables) {
    console.log('='.repeat(60));
    console.log(`\n📊 Bitable: ${bitable.name}`);
    console.log(`   App Token: ${bitable.app_token}\n`);

    // 获取所有表格列表
    const tablesRes = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${bitable.app_token}/tables`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const tablesData = await tablesRes.json();

    if (tablesData.code === 0) {
      const tables = tablesData.data?.items || [];
      console.log(`✅ 找到 ${tables.length} 个数据表:\n`);

      for (const table of tables) {
        console.log(`   📋 表 ${tables.indexOf(table) + 1}: ${table.name}`);
        console.log(`      - Table ID: ${table.table_id}`);
        console.log(`      - Revision: ${table.revision || 'N/A'}`);

        // 获取字段列表
        const fieldsRes = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${bitable.app_token}/tables/${table.table_id}/fields`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        const fieldsData = await fieldsRes.json();
        if (fieldsData.code === 0) {
          const fields = fieldsData.data?.items || [];
          console.log(`      - 字段数: ${fields.length}`);

          if (fields.length > 0) {
            console.log(`      - 字段: ${fields.slice(0, 5).map(f => f.field_name).join(', ')}${fields.length > 5 ? '...' : ''}`);
          }
        }

        // 获取记录数（只获取第一页来统计）
        const recordsRes = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${bitable.app_token}/tables/${table.table_id}/records?page_size=500`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );

        const recordsData = await recordsRes.json();
        if (recordsData.code === 0) {
          const records = recordsData.data?.items || [];
          const hasMore = recordsData.data?.has_more || false;
          console.log(`      - 记录数: ${records.length}${hasMore ? '+' : ''} 条`);

          // 显示第一条记录的字段
          if (records.length > 0) {
            const firstRecord = records[0];
            const fieldNames = Object.keys(firstRecord.fields);
            console.log(`      - 实际数据字段: ${fieldNames.slice(0, 3).join(', ')}${fieldNames.length > 3 ? '...' : ''}`);
          }
        }

        console.log('');
      }

      // 检查是否有未同步的表
      console.log(`   🔍 检查隐藏表: ${tables.length > 1 ? '可能存在多个表' : '只有1个表'}`);

    } else {
      console.log(`❌ 获取表格列表失败: ${tablesData.msg}`);
    }

    console.log('');
  }

  console.log('='.repeat(60));
  console.log('\n💡 总结:');
  console.log('   - 如果表格数量 > 同步到D1的数量，说明有隐藏表未同步');
  console.log('   - Bitable API会返回所有表格，包括隐藏的');
  console.log('='.repeat(60));
}

checkAllBitableTables().catch(console.error);
