/**
 * 测试飞书API分页,确认是否有超过50条数据
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
  if (data.code !== 0) {
    throw new Error(`获取token失败: ${data.msg}`);
  }
  
  return data.tenant_access_token;
}

async function checkTotalRecords() {
  const token = await getAccessToken();
  console.log('✅ 获取到访问令牌');
  
  const response = await fetch(
    `${FEISHU_CONFIG.BASE_URL}/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records?page_size=50`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  const data = await response.json();
  
  console.log('\n📊 飞书API响应信息:');
  console.log('状态码:', data.code);
  console.log('返回记录数:', data.data?.items?.length || 0);
  console.log('是否有更多数据 (has_more):', data.data?.has_more);
  console.log('页面令牌 (page_token):', data.data?.page_token || '无');
  console.log('总数 (total):', data.data?.total || '未提供');
  
  if (data.data?.has_more) {
    console.log('\n⚠️ 检测到还有更多数据!需要实现分页获取');
    console.log('下一页token:', data.data.page_token);
  } else {
    console.log('\n✅ 所有数据已全部返回,共', data.data?.items?.length, '条');
  }
}

checkTotalRecords().catch(console.error);
