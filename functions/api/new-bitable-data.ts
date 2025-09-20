/**
 * 新的简化Bitable数据API - 直接使用工作的实现
 */

interface WikiFundingRecord {
  id: string;
  companyName: string;
  stage: string;
  amount: number;
  currency: string;
  description: string;
  tags: string[];
  investedAt: string;
  investors: string[];
  sourceUrl?: string;
  website?: string;
  founders?: string[];
  teamInfo?: string;
  category?: string;
  subCategory?: string;
}

interface Env {
  FEISHU_APP_ID: string;
  FEISHU_APP_SECRET: string;
  SVTR_CACHE?: KVNamespace;
}

// 最新的Bitable配置 - AI创投日报
const NEW_BITABLE_CONFIG = {
  APP_TOKEN: 'DsQHbrYrLab84NspgnWcmj44nYe', // 最新的Bitable App Token
  TABLE_ID: 'tblLP6uUyPTKxfyx', // 创投日报表格ID
  VIEW_ID: 'vewv098phD', // 指定视图ID
  BASE_URL: 'https://open.feishu.cn/open-apis'
};

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string> {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret
    })
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取访问令牌失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 工作的fetchNewBitableData函数实现
 */
async function fetchNewBitableData(accessToken: string): Promise<WikiFundingRecord[]> {
  try {
    console.log('🔍 从新的Bitable数据源获取AI创投日报数据...');

    // 获取所有记录
    let allRecords: any[] = [];
    let pageToken = '';
    let hasMore = true;

    while (hasMore) {
      const recordsUrl = `${NEW_BITABLE_CONFIG.BASE_URL}/bitable/v1/apps/${NEW_BITABLE_CONFIG.APP_TOKEN}/tables/${NEW_BITABLE_CONFIG.TABLE_ID}/records?page_size=50${pageToken ? `&page_token=${pageToken}` : ''}${NEW_BITABLE_CONFIG.VIEW_ID ? `&view_id=${NEW_BITABLE_CONFIG.VIEW_ID}` : ''}`;

      const recordsResponse = await fetch(recordsUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (recordsResponse.status !== 200) {
        throw new Error(`获取记录失败: HTTP ${recordsResponse.status}`);
      }

      const recordsData = await recordsResponse.json();
      if (recordsData.code !== 0) {
        throw new Error(`获取记录失败: ${recordsData.msg}`);
      }

      const records = recordsData.data.items || [];
      allRecords = allRecords.concat(records);

      hasMore = recordsData.data.has_more || false;
      pageToken = recordsData.data.page_token || '';
    }

    console.log(`✅ 总共获取到 ${allRecords.length} 条AI创投日报记录`);

    // 转换为WikiFundingRecord格式
    const fundingRecords: WikiFundingRecord[] = [];

    allRecords.forEach((record, index) => {
      try {
        const fields = record.fields || {};

        // 提取字段值的辅助函数
        const getFieldValue = (fieldName: string): string => {
          const value = fields[fieldName];
          if (!value) return '';
          if (typeof value === 'string') return value;
          if (typeof value === 'object' && value.text) return value.text;
          if (typeof value === 'object' && value.name) return value.name;
          if (Array.isArray(value) && value.length > 0) {
            return value.map(v => v.text || v.name || v).join(', ');
          }
          return String(value);
        };

        // 提取核心字段
        const 序号 = getFieldValue('序号');
        const 周报 = getFieldValue('周报');
        const 细分领域 = getFieldValue('细分领域');
        const 二级分类 = getFieldValue('二级分类');
        const 公司官网 = getFieldValue('公司官网');
        const 企业介绍 = getFieldValue('企业介绍');
        const 标签 = getFieldValue('标签');

        // 从公司官网提取公司名称并格式化
        let companyName = '';
        if (公司官网) {
          try {
            const url = new URL(公司官网);
            const hostname = url.hostname.replace('www.', '');
            const baseName = hostname.split('.')[0];

            // 特殊公司名称映射和格式化
            const companyNameMap = {
              'upscaleai': 'Upscale AI',
              'atomionics': 'Atomionics',
              'conduct': 'Conduct AI',
              'markupai': 'Markup AI',
              'numeralhq': 'Numeral',
              'regscale': 'RegScale',
              'ultralytics': 'Ultralytics',
              'vibraniumlabs': 'Vibranium Labs',
              'shengshu-ai': '生数科技',
              'evoluteiq': 'EvoluteIQ',
              'passivelogic': 'PassiveLogic',
              'getaleph': 'Aleph',
              'macroscope': 'Macroscope',
              'metalbear': 'MetalBear',
              'nofence': 'Nofence',
              'turnout': 'Turnout',
              'airbuds': 'Airbuds',
              'creatordb': 'CreatorDB',
              'gridstrong': 'GridStrong',
              'icarusrobotics': 'Icarus Robotics',
              'keplar': 'Keplar',
              'overmind': 'Overmind',
              'plumerai': 'Plumerai',
              'rulebase': 'Rulebase',
              'sonair': 'Sonair',
              'coderabbit': 'CodeRabbit',
              'invisibletech': 'Invisible Technologies',
              'getdianahr': 'Diana HR',
              'ethosphere': 'Ethosphere',
              'fabrix': 'Fabrix Security',
              'irisfinance': 'Iris Finance',
              'microfactory': 'MicroFactory',
              'scalekit': 'Scalekit',
              'suena': 'Suena Energy',
              'uiagent': 'uiAgent'
            };

            companyName = companyNameMap[baseName.toLowerCase()] ||
                         baseName.charAt(0).toUpperCase() + baseName.slice(1);
          } catch {
            companyName = 公司官网.replace('https://', '').replace('http://', '').split('/')[0];
          }
        }

        if (!companyName) {
          return; // 跳过没有公司名称的记录
        }

        // 处理融资金额和轮次
        let amount = 0;
        let currency = 'USD';
        let stage = '未知轮次';

        if (企业介绍) {
          // 改进的融资金额提取逻辑
          const amountPatterns = [
            // 英文金额模式: $100M, $1.2B, $50 million, $1 billion
            /(\$|USD\s*)([0-9,]+(?:\.[0-9]+)?)\s*(million|billion|M|B)/i,
            // 中文金额模式: 1亿美元, 5000万人民币, 1.2亿元
            /([0-9,]+(?:\.[0-9]+)?)\s*(亿|千万|万|百万)?\s*(美元|人民币|元)/i,
            // 数字+货币单位: 100万美元, 5000万欧元
            /([0-9,]+(?:\.[0-9]+)?)\s*(万|千万|亿)?\s*(美元|欧元|EUR)/i,
            // 纯数字+单位: 完成100万美元融资
            /完成.*?([0-9,]+(?:\.[0-9]+)?)\s*(万|千万|亿)?\s*(美元|人民币|元)/i,
            // 英文描述: raised $X million
            /raised\s+\$([0-9,]+(?:\.[0-9]+)?)\s*(million|billion|M|B)/i
          ];

          for (const pattern of amountPatterns) {
            const match = 企业介绍.match(pattern);
            if (match) {
              let baseAmount = parseFloat(match[1].replace(/,/g, ''));
              const unit = match[2]?.toLowerCase() || '';
              const currencyMatch = match[3]?.toLowerCase() || '';

              // 处理单位转换
              if (unit.includes('亿') || unit === 'billion' || unit === 'b') {
                baseAmount *= 100000000; // 1亿
              } else if (unit.includes('千万')) {
                baseAmount *= 10000000; // 1千万
              } else if (unit.includes('百万') || unit === 'million' || unit === 'm') {
                baseAmount *= 1000000; // 1百万
              } else if (unit.includes('万')) {
                baseAmount *= 10000; // 1万
              }

              // 处理货币类型 - 优先检测实际货币单位
              if (currencyMatch.includes('人民币') || (currencyMatch.includes('元') && !currencyMatch.includes('美元'))) {
                currency = 'CNY';
              } else if (currencyMatch.includes('欧元') || currencyMatch.toLowerCase().includes('eur')) {
                currency = 'EUR';
              } else if (currencyMatch.includes('美元') || match[0].includes('$') || match[0].toLowerCase().includes('usd')) {
                currency = 'USD';
              } else {
                // 如果没有明确的货币标识，根据描述内容判断
                if (企业介绍.includes('美元') || 企业介绍.includes('$') || 企业介绍.toLowerCase().includes('usd')) {
                  currency = 'USD';
                } else if (企业介绍.includes('人民币') || 企业介绍.includes('￥')) {
                  currency = 'CNY';
                } else {
                  // 默认使用美元，因为大部分国际融资使用美元
                  currency = 'USD';
                }
              }

              amount = Math.round(baseAmount);
              break;
            }
          }

          // 提取融资轮次
          const stagePatterns = [
            /(种子前|Pre-Seed)/i,
            /(种子轮|Seed)/i,
            /(天使轮|Angel)/i,
            /(Pre-A|A轮前)/i,
            /(A轮|Series A)/i,
            /(A轮后|Post-A)/i,
            /(Pre-B|B轮前)/i,
            /(B轮|Series B)/i,
            /(Pre-C|C轮前)/i,
            /(C轮|Series C)/i,
            /(D轮|Series D)/i,
            /(E轮|Series E)/i,
            /(增长轮|Growth)/i,
            /(IPO|上市)/i
          ];

          for (const stagePattern of stagePatterns) {
            const stageMatch = 企业介绍.match(stagePattern);
            if (stageMatch) {
              stage = stageMatch[1];
              break;
            }
          }
        }

        // 提取创始人信息
        let founders: string[] = [];
        let teamInfo = '';

        if (企业介绍) {
          // 从企业介绍中提取创始人信息 - 改进的匹配模式
          const founderPatterns = [
            /创始人[：:]\s*([^，。；;、]+)/g,
            /CEO[：:]\s*([^，。；;、]+)/g,
            /联合创始人[：:]\s*([^，。；;、]+)/g,
            /创始人兼CEO[：:]\s*([^，。；;、]+)/g,
            /由\s*([^，。；;、]{2,10})\s*(创立|建立|成立|创办)/g,
            /([A-Za-z\u4e00-\u9fa5]{2,8})\s*创立/g,
            /([A-Za-z\u4e00-\u9fa5]{2,8})\s*创办/g,
            /([A-Za-z\u4e00-\u9fa5]{2,8})\s*于\s*\d{4}年/g
          ];

          for (const pattern of founderPatterns) {
            const matches = Array.from(企业介绍.matchAll(pattern));
            matches.forEach(match => {
              if (match[1]) {
                const founderName = match[1].trim();
                if (founderName && !founders.includes(founderName)) {
                  founders.push(founderName);
                }
              }
            });
          }

          // 构建团队信息描述
          if (founders.length > 0) {
            teamInfo = `创始团队：${founders.join('、')}`;
          } else {
            // 如果没有找到具体的创始人名字，尝试提取团队背景信息
            const teamBackgroundPatterns = [
              /团队.*?背景.*?：([^。]+)/g,
              /团队.*?来自.*?([^。]+)/g,
              /核心团队.*?([^。]+)/g,
              /团队成员.*?([^。]+)/g
            ];

            for (const pattern of teamBackgroundPatterns) {
              const match = 企业介绍.match(pattern);
              if (match && match[1]) {
                teamInfo = match[1].trim();
                break;
              }
            }

            // 如果还是没有团队信息，给出通用描述
            if (!teamInfo) {
              teamInfo = `${companyName} 是一家专注于AI领域的创新公司，具备丰富的技术经验和行业背景。`;
            }
          }
        }

        // 构建WikiFundingRecord
        const fundingRecord: WikiFundingRecord = {
          id: `ai_${序号 || (index + 1)}`,
          companyName,
          stage,
          amount,
          currency,
          description: 企业介绍 || '暂无描述',
          tags: 标签 ? 标签.split(',').map(t => t.trim()) : [],
          investedAt: new Date().toISOString(),
          investors: [],
          website: 公司官网 || '',
          founders,
          teamInfo,
          category: 细分领域 || '',
          subCategory: 二级分类 || '',
          sourceUrl: `https://svtrglobal.feishu.cn/base/${NEW_BITABLE_CONFIG.APP_TOKEN}?table=${NEW_BITABLE_CONFIG.TABLE_ID}&view=${NEW_BITABLE_CONFIG.VIEW_ID}`
        };

        fundingRecords.push(fundingRecord);

      } catch (recordError) {
        console.error(`❌ 处理记录 ${index + 1} 时出错:`, recordError);
      }
    });

    // 按序号排序
    fundingRecords.sort((a, b) => {
      const aNum = parseInt(a.id.replace('ai_', '')) || 0;
      const bNum = parseInt(b.id.replace('ai_', '')) || 0;
      return aNum - bNum;
    });

    console.log(`🎯 最终转换了 ${fundingRecords.length} 条有效记录`);
    return fundingRecords;

  } catch (error) {
    console.error('❌ fetchNewBitableData 执行失败:', error);
    throw error;
  }
}

export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    console.log('🚀 新Bitable数据API请求开始', { forceRefresh });

    // 检查缓存 (可以后续实现)
    // if (!forceRefresh && env.SVTR_CACHE) {
    //   // 缓存逻辑
    // }

    // 获取访问令牌
    const accessToken = await getFeishuAccessToken(env.FEISHU_APP_ID, env.FEISHU_APP_SECRET);

    // 获取数据
    const fundingData = await fetchNewBitableData(accessToken);

    const result = {
      success: true,
      data: fundingData,
      source: 'new_bitable',
      count: fundingData.length,
      lastUpdate: new Date().toISOString(),
      note: '✅ 数据来源：新的飞书多维表格AI创投日报',
      dataSourceUrl: `https://svtrglobal.feishu.cn/base/${NEW_BITABLE_CONFIG.APP_TOKEN}?table=${NEW_BITABLE_CONFIG.TABLE_ID}&view=${NEW_BITABLE_CONFIG.VIEW_ID}`
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ 新Bitable数据API失败:', error);

    return new Response(JSON.stringify({
      success: false,
      message: '获取数据失败',
      error: String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

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