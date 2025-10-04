/**
 * 检查被过滤的记录
 */
const FEISHU_CONFIG = {
  APP_ID: 'cli_a8e2014cbe7d9013',
  APP_SECRET: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  APP_TOKEN: 'DsQHbrYrLab84NspgnWcmj44nYe',
  TABLE_ID: 'tblLP6uUyPTKxfyx',
  BASE_URL: 'https://open.feishu.cn/open-apis'
};

async function getAccessToken() {
  const response = await fetch(`${FEISHU_CONFIG.BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_CONFIG.APP_ID,
      app_secret: FEISHU_CONFIG.APP_SECRET
    })
  });
  const data = await response.json();
  return data.tenant_access_token;
}

async function checkAllRecords() {
  const token = await getAccessToken();
  
  let allItems = [];
  let pageToken = undefined;
  let pageNum = 1;
  
  do {
    const url = pageToken
      ? `${FEISHU_CONFIG.BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records?page_size=100&page_token=${pageToken}`
      : `${FEISHU_CONFIG.BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records?page_size=100`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    allItems = allItems.concat(data.data?.items || []);
    pageToken = data.data?.has_more ? data.data.page_token : undefined;
    pageNum++;
  } while (pageToken);
  
  console.log(`📊 飞书原始数据: ${allItems.length} 条\n`);
  
  // 检查哪些记录会被过滤
  const filtered = [];
  const passed = [];
  
  allItems.forEach((item, i) => {
    const fields = item.fields || {};
    const 企业介绍 = fields['企业介绍']?.text || fields['企业介绍'] || '';
    const 细分领域 = fields['细分领域']?.text || fields['细分领域'] || '';
    const 公司官网 = fields['公司官网']?.text || fields['公司官网'] || '';
    
    if (!企业介绍.trim() && !细分领域.trim() && !公司官网.trim()) {
      filtered.push({
        序号: fields['序号'] || (i + 1),
        周报: fields['周报']?.text || fields['周报'] || '无',
        企业介绍: 企业介绍 || '空',
        细分领域: 细分领域 || '空',
        公司官网: 公司官网 || '空',
        团队背景: (fields['团队背景']?.text || fields['团队背景'] || '').substring(0, 50)
      });
    } else {
      passed.push(item);
    }
  });
  
  console.log(`✅ 通过验证: ${passed.length} 条`);
  console.log(`❌ 被过滤: ${filtered.length} 条\n`);
  
  if (filtered.length > 0) {
    console.log('🔍 被过滤的记录详情:\n');
    filtered.forEach(rec => {
      console.log(`序号: ${rec.序号}, 周报: ${rec.周报}`);
      console.log(`  企业介绍: ${rec.企业介绍}`);
      console.log(`  细分领域: ${rec.细分领域}`);
      console.log(`  公司官网: ${rec.公司官网}`);
      console.log(`  团队背景: ${rec.团队背景}\n`);
    });
  }
}

checkAllRecords().catch(console.error);
