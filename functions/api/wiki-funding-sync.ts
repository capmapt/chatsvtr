/**
 * Wiki页面融资数据同步API - 真实飞书数据版本
 * 严格按照飞书源地址数据展示相关信息
 */

interface WikiFundingRecord {
  id: string;
  序号: number;
  周报: string;
  细分领域: string;
  二级分类: string;
  公司官网: string;
  联系方式: string;
  企业介绍: string;
  团队背景: string;
  标签: string;
  SourceID: string;
  sourceUrl: string;
}

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: any;
}

// 严格按照源地址 https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe 的数据
const FEISHU_BITABLE_CONFIG = {
  APP_TOKEN: 'DsQHbrYrLab84NspgnWcmj44nYe',
  TABLE_ID: 'tblLP6uUyPTKxfyx',
  BASE_URL: 'https://open.feishu.cn/open-apis',
  SOURCE_URL: 'https://svtrglobal.feishu.cn/base/DsQHbrYrLab84NspgnWcmj44nYe?from=from_copylink'
};

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(env: Env): Promise<string> {
  const response = await fetch(`${FEISHU_BITABLE_CONFIG.BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: env.FEISHU_APP_ID,
      app_secret: env.FEISHU_APP_SECRET
    })
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书访问令牌失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 从真实飞书数据源获取数据
 */
async function fetchRealFeishuData(env: Env): Promise<WikiFundingRecord[]> {
  console.log('🎯 开始从真实飞书数据源获取数据...');

  try {
    const accessToken = await getFeishuAccessToken(env);
    console.log('✅ 成功获取飞书访问令牌');

    const response = await fetch(
      `${FEISHU_BITABLE_CONFIG.BASE_URL}/bitable/v1/apps/${FEISHU_BITABLE_CONFIG.APP_TOKEN}/tables/${FEISHU_BITABLE_CONFIG.TABLE_ID}/records?page_size=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    console.log(`📊 飞书API返回状态: ${data.code}, 获取到 ${data.data?.items?.length || 0} 条原始记录`);

    if (data.code !== 0) {
      throw new Error(`飞书API调用失败: ${data.msg}`);
    }

    const records: WikiFundingRecord[] = [];
    const items = data.data?.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const fields = item.fields || {};

      // 检查记录是否有基本必要信息（更宽松的验证）
      const 企业介绍 = fields['企业介绍']?.text || fields['企业介绍'] || '';
      const 细分领域 = fields['细分领域']?.text || fields['细分领域'] || '';
      const 公司官网 = fields['公司官网']?.text || fields['公司官网'] || '';

      // 至少需要有细分领域或企业介绍之一
      if (!企业介绍.trim() && !细分领域.trim() && !公司官网.trim()) {
        console.log(`⚠️ 记录 ${i + 1} 缺少关键信息，跳过`);
        continue;
      }

      const record: WikiFundingRecord = {
        id: item.record_id || `feishu_${i + 1}`,
        序号: fields['序号'] || (i + 1),
        周报: fields['周报']?.text || fields['周报'] || '',
        细分领域: 细分领域,
        二级分类: fields['二级分类']?.text || fields['二级分类'] || '',
        公司官网: 公司官网,
        联系方式: fields['联系方式']?.text || fields['联系方式'] || '',
        企业介绍: 企业介绍,
        团队背景: fields['团队背景']?.text || fields['团队背景'] || '',
        标签: fields['标签']?.text || fields['标签'] || '',
        SourceID: fields['SourceID']?.text || fields['SourceID'] || '',
        sourceUrl: FEISHU_BITABLE_CONFIG.SOURCE_URL
      };

      records.push(record);
      console.log(`✅ 处理记录 ${i + 1}: ${record.细分领域} - ${record.企业介绍.substring(0, 50)}...`);
    }

    console.log(`🎉 成功解析 ${records.length} 条真实飞书创投日报记录`);
    return records;

  } catch (error) {
    console.error('❌ 从飞书获取数据失败:', error);
    throw error;
  }
}

/**
 * 处理GET请求
 */
export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  console.log('🚀 Wiki融资日报同步请求开始');

  try {
    const url = new URL(request.url);
    // 支持两种参数名: force=true 或 refresh=true
    const forceRefresh = url.searchParams.get('force') === 'true' || url.searchParams.get('refresh') === 'true';
    const cacheKey = 'wiki-funding-real-data-v3';

    console.log('📊 参数信息:', { forceRefresh });

    // 检查缓存
    if (!forceRefresh && env.SVTR_CACHE) {
      try {
        const cachedData = await env.SVTR_CACHE.get(cacheKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          console.log(`📦 从缓存获取到 ${parsedData.length} 条数据`);

          return new Response(JSON.stringify({
            success: true,
            data: parsedData,
            count: parsedData.length,
            source: 'cache',
            lastUpdate: new Date().toISOString(),
            dataSource: FEISHU_BITABLE_CONFIG.SOURCE_URL,
            message: '数据来源：飞书创投日报Bitable（缓存）'
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (error) {
        console.warn('⚠️ 缓存读取失败:', error.message);
      }
    }

    // 获取真实飞书数据
    console.log('🎯 从真实飞书数据源获取数据...');
    const fundingData = await fetchRealFeishuData(env);

    console.log(`✅ 成功获取到 ${fundingData.length} 条真实AI创投日报数据`);

    // 缓存数据（24小时）
    if (env.SVTR_CACHE && fundingData.length > 0) {
      try {
        await env.SVTR_CACHE.put(cacheKey, JSON.stringify(fundingData), {
          expirationTtl: 24 * 60 * 60 // 24小时
        });
        console.log(`✅ 已缓存 ${fundingData.length} 条Wiki融资数据`);
      } catch (error) {
        console.warn('⚠️ 缓存保存失败:', error.message);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: fundingData,
      count: fundingData.length,
      source: 'real-time',
      lastUpdate: new Date().toISOString(),
      dataSource: FEISHU_BITABLE_CONFIG.SOURCE_URL,
      message: `数据来源：飞书创投日报Bitable（实时获取${fundingData.length}条真实数据）`
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('❌ Wiki融资日报同步失败:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: [],
      count: 0,
      source: 'error',
      lastUpdate: new Date().toISOString(),
      dataSource: FEISHU_BITABLE_CONFIG.SOURCE_URL,
      message: 'API获取失败，请稍后重试'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

console.log('✅ Wiki融资日报同步API已加载，将严格按照飞书源地址返回真实数据');