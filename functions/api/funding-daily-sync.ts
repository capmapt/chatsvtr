/**
 * 融资日报同步API
 * 从飞书多维表格获取真实的融资数据，并转换为前端可用格式
 */

interface FeishuRecord {
  record_id: string;
  fields: {
    [fieldName: string]: any;
  };
  created_time?: number;
  last_modified_time?: number;
}

interface FundingRecord {
  id: string;
  companyName: string;
  stage: string;
  amount: number;
  currency: string;
  description: string;
  tags: string[];
  investedAt: string;
  investors: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: KVNamespace;
}

// 飞书多维表格配置
const FEISHU_CONFIG = {
  APP_TOKEN: 'V2JnwfmvtiBUTdkc32rcQrXWn4g', // 从URL中提取
  TABLE_ID: 'GvCmOW', // sheet参数
  // 字段映射 - 需要根据实际飞书表格字段调整
  FIELD_MAPPING: {
    companyName: '公司名称',
    stage: '融资阶段',
    amount: '融资金额',
    currency: '货币',
    description: '公司描述',
    tags: '标签',
    investors: '投资方',
    investedAt: '投资日期'
  }
};

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string> {
  try {
    // 设置10秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
          app_id: appId,
          app_secret: appSecret,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.code === 0) {
        return result.tenant_access_token;
      } else {
        throw new Error(`获取访问令牌失败: ${result.msg || result.message || result.code}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('获取访问令牌超时');
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ 获取飞书访问令牌失败:', error);
    throw error;
  }
}

/**
 * 从飞书多维表格获取融资数据
 */
async function fetchFeishuRecords(accessToken: string): Promise<FeishuRecord[]> {
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_CONFIG.APP_TOKEN}/tables/${FEISHU_CONFIG.TABLE_ID}/records`;

    console.log('🔍 正在获取飞书数据:', url);

    // 设置5秒超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.code === 0) {
        console.log(`✅ 成功获取 ${result.data.items.length} 条记录`);
        return result.data.items;
      } else {
        throw new Error(`获取数据失败: ${result.msg || result.message || result.code}`);
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('飞书API请求超时');
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ 获取飞书记录失败:', error);
    throw error;
  }
}

/**
 * 转换飞书记录为标准格式
 */
function transformFeishuRecord(record: FeishuRecord): FundingRecord | null {
  try {
    const fields = record.fields;
    const mapping = FEISHU_CONFIG.FIELD_MAPPING;

    // 检查必要字段
    if (!fields[mapping.companyName] || !fields[mapping.amount]) {
      console.warn('⚠️ 跳过不完整的记录:', record.record_id);
      return null;
    }

    // 解析金额（支持各种格式：100万、$5M、5000000等）
    const amountText = String(fields[mapping.amount] || '0');
    let amount = 0;

    if (amountText.includes('万')) {
      amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 10000;
    } else if (amountText.includes('M') || amountText.includes('百万')) {
      amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 1000000;
    } else if (amountText.includes('B') || amountText.includes('十亿')) {
      amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) * 1000000000;
    } else {
      amount = parseFloat(amountText.replace(/[^0-9.]/g, '')) || 0;
    }

    // 解析标签（支持逗号分隔的字符串或数组）
    let tags: string[] = [];
    const tagsField = fields[mapping.tags];
    if (Array.isArray(tagsField)) {
      tags = tagsField.map(tag => String(tag).trim()).filter(Boolean);
    } else if (typeof tagsField === 'string') {
      tags = tagsField.split(/[,，、]/).map(tag => tag.trim()).filter(Boolean);
    }

    // 解析投资方
    let investors: string[] = [];
    const investorsField = fields[mapping.investors];
    if (Array.isArray(investorsField)) {
      investors = investorsField.map(inv => String(inv).trim()).filter(Boolean);
    } else if (typeof investorsField === 'string') {
      investors = investorsField.split(/[,，、]/).map(inv => inv.trim()).filter(Boolean);
    }

    // 解析日期
    let investedAt = new Date().toISOString();
    const dateField = fields[mapping.investedAt];
    if (dateField) {
      if (typeof dateField === 'number') {
        investedAt = new Date(dateField).toISOString();
      } else if (typeof dateField === 'string') {
        investedAt = new Date(dateField).toISOString();
      }
    }

    return {
      id: record.record_id,
      companyName: String(fields[mapping.companyName]).trim(),
      stage: String(fields[mapping.stage] || 'Unknown').trim(),
      amount: amount,
      currency: String(fields[mapping.currency] || 'USD').trim(),
      description: String(fields[mapping.description] || '').trim(),
      tags: tags,
      investors: investors,
      investedAt: investedAt,
      createdAt: record.created_time ? new Date(record.created_time).toISOString() : undefined,
      updatedAt: record.last_modified_time ? new Date(record.last_modified_time).toISOString() : undefined,
    };
  } catch (error) {
    console.error('❌ 转换记录失败:', record.record_id, error);
    return null;
  }
}

/**
 * 缓存融资数据
 */
async function cacheFundingData(env: Env, data: FundingRecord[]): Promise<void> {
  if (!env.SVTR_CACHE) {
    console.warn('⚠️ KV存储未配置，跳过缓存');
    return;
  }

  try {
    const cacheKey = 'funding_daily_data';
    const cacheData = {
      data: data,
      lastUpdate: new Date().toISOString(),
      count: data.length
    };

    await env.SVTR_CACHE.put(cacheKey, JSON.stringify(cacheData), {
      expirationTtl: 24 * 60 * 60 // 24小时过期
    });

    console.log(`✅ 已缓存 ${data.length} 条融资数据`);
  } catch (error) {
    console.error('❌ 缓存数据失败:', error);
  }
}

/**
 * 从缓存获取融资数据
 */
async function getCachedFundingData(env: Env): Promise<FundingRecord[] | null> {
  if (!env.SVTR_CACHE) {
    return null;
  }

  try {
    const cacheKey = 'funding_daily_data';
    const cached = await env.SVTR_CACHE.get(cacheKey);

    if (cached) {
      const cacheData = JSON.parse(cached);
      console.log(`📦 使用缓存数据: ${cacheData.count} 条记录, 更新时间: ${cacheData.lastUpdate}`);
      return cacheData.data;
    }
  } catch (error) {
    console.error('❌ 获取缓存数据失败:', error);
  }

  return null;
}

/**
 * 主要的GET请求处理函数
 */
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    console.log('🚀 融资日报同步请求开始', { forceRefresh });

    // 如果不强制刷新，先尝试使用缓存
    if (!forceRefresh) {
      const cachedData = await getCachedFundingData(env);
      if (cachedData && cachedData.length > 0) {
        return new Response(JSON.stringify({
          success: true,
          data: cachedData,
          source: 'cache',
          count: cachedData.length
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 检查必要的环境变量
    if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
      console.error('❌ 飞书API配置不完整');
      return new Response(JSON.stringify({
        success: false,
        message: '飞书API配置不完整',
        error: 'Missing FEISHU_APP_ID or FEISHU_APP_SECRET'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 获取访问令牌
    const accessToken = await getFeishuAccessToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);

    // 获取飞书数据
    const records = await fetchFeishuRecords(accessToken);

    // 转换数据
    const fundingData: FundingRecord[] = records
      .map(transformFeishuRecord)
      .filter((record): record is FundingRecord => record !== null)
      .sort((a, b) => new Date(b.investedAt).getTime() - new Date(a.investedAt).getTime()); // 按投资日期降序

    // 缓存数据
    await cacheFundingData(env, fundingData);

    console.log(`✅ 融资日报同步完成: ${fundingData.length} 条记录`);

    return new Response(JSON.stringify({
      success: true,
      data: fundingData,
      source: 'feishu',
      count: fundingData.length,
      lastUpdate: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ 融资日报同步失败:', error);

    return new Response(JSON.stringify({
      success: false,
      message: '同步失败，请稍后重试',
      error: String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

/**
 * 处理CORS预检请求
 */
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}