/**
 * Cloudflare Pages 中间件
 * 设置安全头、性能优化和SSR融资数据
 */

interface Env {
  CLOUDFLARE_WORKERS_URL?: string;
  API_SECRET?: string;
}

interface FundingRecord {
  id: string;
  companyName: string;
  stage: string;
  amount: number;
  currency: string;
  description: string;
  tags: string[];
  date?: string;
  investors?: string[];
}

/**
 * 格式化金额显示
 */
function formatAmount(amount: number, currency: string = 'USD'): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}亿${currency === 'CNY' ? '元' : '美元'}`;
  } else if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}万${currency === 'CNY' ? '元' : '美元'}`;
  } else {
    return `${amount}${currency === 'CNY' ? '元' : '美元'}`;
  }
}

/**
 * 从企业介绍中提取公司名称
 */
function extractCompanyName(description: string): string | null {
  const patterns = [
    /^([A-Za-z][\w\s&.-]*[A-Za-z\d])，/, // 英文公司名（最优先）
    /^([^，。,\s]{2,30})，\d{4}年/, // 中文公司名+年份模式
    /^([^，。,\s]{2,20})，/, // 句首到第一个逗号的部分
    /^([A-Za-z\u4e00-\u9fa5\s]+?)（/, // 括号前的部分
    /([A-Za-z\u4e00-\u9fa5]+)\s*，.*?成立/, // "xxx，成立"模式
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim();
      // 过滤掉明显不是公司名的结果
      if (name.length > 1 && name.length < 50 && !name.includes('年')) {
        return name;
      }
    }
  }
  return null;
}

/**
 * 从企业介绍中提取融资金额
 */
function extractAmount(description: string): number {
  // 先尝试提取本轮融资金额（通常在"完成"后面，"累计"前面）
  const currentRoundPatterns = [
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*亿美元[^，。]*?融资/,
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*亿元[^，。]*?融资/,
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*千万美元[^，。]*?融资/,
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*千万元[^，。]*?融资/,
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*万美元[^，。]*?融资/,
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*万元[^，。]*?融资/,
    /完成[^，。]*?\$(\d+(?:\.\d+)?)\s*[MB][^，。]*?融资/,
    /完成[^，。]*?(\d+(?:\.\d+)?)\s*[MB][^，。]*?融资/,
  ];

  // 检查本轮融资模式
  for (const pattern of currentRoundPatterns) {
    const match = description.match(pattern);
    if (match) {
      const amount = parseFloat(match[1]);
      const text = match[0];

      if (text.includes('亿美元')) return amount * 100000000;
      if (text.includes('亿元')) return amount * 100000000 / 7;
      if (text.includes('千万美元')) return amount * 10000000;
      if (text.includes('千万元')) return amount * 10000000 / 7;
      if (text.includes('万美元')) return amount * 10000;
      if (text.includes('万元')) return amount * 10000 / 7;
      if (text.includes('$') && text.includes('M')) return amount * 1000000;
      if (text.includes('$') && text.includes('B')) return amount * 1000000000;
      if (text.includes('M')) return amount * 1000000;
      if (text.includes('B')) return amount * 1000000000;
    }
  }

  // 如果没有找到明确的本轮融资，尝试通用模式（但排除累计相关文本）
  const generalPatterns = [
    /(\d+(?:\.\d+)?)\s*亿美元/g,
    /(\d+(?:\.\d+)?)\s*亿元/g,
    /(\d+(?:\.\d+)?)\s*千万美元/g,
    /(\d+(?:\.\d+)?)\s*千万元/g,
    /(\d+(?:\.\d+)?)\s*万美元/g,
    /(\d+(?:\.\d+)?)\s*万元/g,
    /\$(\d+(?:\.\d+)?)\s*[MB]/g,
    /(\d+(?:\.\d+)?)\s*[MB]/g,
  ];

  for (const pattern of generalPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const amount = parseFloat(match[1]);
      const text = match[0];
      const beforeText = description.substring(Math.max(0, match.index - 20), match.index);
      const afterText = description.substring(match.index, Math.min(description.length, match.index + 50));

      // 跳过包含"累计"的融资金额
      if (beforeText.includes('累计') || afterText.includes('累计')) {
        continue;
      }

      if (text.includes('亿美元')) return amount * 100000000;
      if (text.includes('亿元')) return amount * 100000000 / 7;
      if (text.includes('千万美元')) return amount * 10000000;
      if (text.includes('千万元')) return amount * 10000000 / 7;
      if (text.includes('万美元')) return amount * 10000;
      if (text.includes('万元')) return amount * 10000 / 7;
      if (text.includes('$') && text.includes('M')) return amount * 1000000;
      if (text.includes('$') && text.includes('B')) return amount * 1000000000;
      if (text.includes('M')) return amount * 1000000;
      if (text.includes('B')) return amount * 1000000000;
    }
  }

  return 10000000; // 默认1000万美元
}

/**
 * 从企业介绍中提取融资轮次
 */
function extractStage(description: string): string {
  const stagePatterns = [
    { pattern: /天使轮|天使/, stage: 'Seed' },
    { pattern: /种子轮/, stage: 'Seed' },
    { pattern: /Pre-A\+?轮|PreA/, stage: 'Pre-A' },
    { pattern: /A\+?轮融资|A轮/, stage: 'Series A' },
    { pattern: /B\+?轮融资|B轮/, stage: 'Series B' },
    { pattern: /C\+?轮融资|C轮/, stage: 'Series C' },
    { pattern: /D\+?轮融资|D轮/, stage: 'Series D' },
    { pattern: /IPO|上市/, stage: 'IPO' },
    { pattern: /战略投资/, stage: 'Strategic' },
  ];

  for (const { pattern, stage } of stagePatterns) {
    if (pattern.test(description)) {
      return stage;
    }
  }
  return 'Seed';
}

/**
 * 从企业介绍中提取投资方
 */
function extractInvestors(description: string): string[] {
  const patterns = [
    /投资方为\s*([^。，]+)/,
    /投资人包括\s*([^。，]+)/,
    /由\s*([^。，]*资本[^。，]*)\s*领投/,
    /([^。，]*资本|[^。，]*投资|[^。，]*基金)/g,
  ];

  let investors: string[] = [];
  for (const pattern of patterns) {
    const matches = description.match(pattern);
    if (matches) {
      if (pattern.global) {
        investors = investors.concat(matches);
      } else if (matches[1]) {
        investors.push(matches[1]);
      }
    }
  }

  // 清理和去重
  investors = investors
    .map(inv => inv.replace(/、|等|投资方为|由|领投/g, '').trim())
    .filter(inv => inv.length > 1 && inv.length < 30)
    .slice(0, 3); // 最多取3个

  return investors.length > 0 ? investors : [];
}

/**
 * 应用安全头到响应
 */
function applySecurityHeaders(response: Response, url: URL): Response {
  const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  };

  // 仅在HTTPS下设置HSTS
  if (url.protocol === 'https:') {
    securityHeaders['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  // CSP策略
  const cspPolicy = [
    "default-src 'self' https:",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://c0uiiy15npu.feishu.cn https://static.cloudflareinsights.com https://*.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: https://cloudflareinsights.com https://*.cloudflareinsights.com",
    "frame-src 'self' https://c0uiiy15npu.feishu.cn",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');

  securityHeaders['Content-Security-Policy'] = cspPolicy;

  // 应用所有安全头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * 生成融资卡片静态HTML
 */
function generateFundingHTML(records: FundingRecord[]): string {
  return records.map(record => {
    // 安全处理tags数组
    const tags = Array.isArray(record.tags) ? record.tags : [];
    const tagsHTML = tags
      .slice(0, 3)
      .map(tag => `<span class="funding-tag">${tag || ''}</span>`)
      .join('');

    const investorsHTML = Array.isArray(record.investors) && record.investors.length > 0
      ? `<div class="funding-investors">
           <strong>投资方:</strong> ${record.investors.join(', ')}
         </div>`
      : '';

    // 安全处理可能为空的字段
    const companyName = record.companyName || '未知公司';
    const stage = record.stage || 'Unknown';
    const description = record.description || '';

    return `
    <article class="funding-card" itemscope itemtype="http://schema.org/Organization" data-id="${record.id || ''}">
      <div class="funding-card-inner">
        <div class="funding-card-front">
          <div class="funding-header">
            <h3 class="funding-company" itemprop="name">${companyName}</h3>
            <div class="funding-meta">
              <span class="funding-stage">${stage}</span>
              <span class="funding-amount" itemprop="amount">
                ${formatAmount(record.amount || 0, record.currency || 'USD')}
              </span>
            </div>
          </div>
          <div class="funding-tags">
            ${tagsHTML}
          </div>
        </div>
        <div class="funding-card-back">
          <div class="funding-description" itemprop="description">
            ${description}
          </div>
          ${investorsHTML}
          ${record.date ? `<time datetime="${record.date}" class="funding-date">${record.date}</time>` : ''}
        </div>
      </div>
    </article>
    `.trim();
  }).join('\n');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // === SSR融资数据注入（仅主页） ===
  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      console.log('🎯 SSR中间件: 开始处理主页请求');

      // 1. 获取最新融资数据
      // 使用绝对URL构造，避免相对路径问题
      const baseUrl = new URL(context.request.url);
      const apiUrl = `${baseUrl.protocol}//${baseUrl.host}/api/wiki-funding-sync`;

      console.log(`📡 SSR中间件: API URL = ${apiUrl}`);

      const apiResponse = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        cf: { cacheTtl: 0, cacheEverything: false }
      });

      if (apiResponse.ok) {
        const apiData: any = await apiResponse.json();
        console.log(`📦 SSR中间件: API响应 = `, JSON.stringify(apiData).substring(0, 200));

        if (apiData.success && Array.isArray(apiData.data) && apiData.data.length > 0) {
          console.log(`✅ SSR中间件: 获取到 ${apiData.data.length} 条融资记录`);

          // 2. 转换数据：从中文字段到英文字段
          const transformedRecords: FundingRecord[] = apiData.data
            .map((item: any, index: number) => {
              // 从企业介绍中提取融资信息
              const description = item['企业介绍'] || '';
              const companyName = extractCompanyName(description);
              const amount = extractAmount(description);
              const stage = extractStage(description);
              const investors = extractInvestors(description);

              // 构建标签数组: 二级分类 + 标签字段(拆分)
              const tags: string[] = [];

              // 添加二级分类
              if (item['二级分类'] && item['二级分类'].trim()) {
                tags.push(item['二级分类'].trim());
              }

              // 添加标签字段(可能有多个,用逗号分隔)
              if (item['标签'] && item['标签'].trim()) {
                const additionalTags = item['标签'].split(',')
                  .map((tag: string) => tag.trim())
                  .filter((tag: string) => tag.length > 0);
                tags.push(...additionalTags);
              }

              return {
                id: item.id || `feishu_${index + 1}`,
                companyName: companyName || '',
                stage: stage || 'Seed',
                amount: amount || 10000000,
                currency: 'USD',
                description: description,
                tags: tags.length > 0 ? tags : ['科技创新'],
                date: item['周报'] || '',
                investors: investors.length > 0 ? investors : undefined,
              };
            })
            .filter((item: FundingRecord) => {
              // 过滤掉无效公司名的记录
              const isValidCompanyName = item.companyName &&
                                       item.companyName.trim() !== '' &&
                                       item.companyName !== '0';
              return isValidCompanyName;
            });

          console.log(`🔄 SSR中间件: 转换后有效记录数 = ${transformedRecords.length}`);

          // 3. 生成静态HTML（前20条）
          const latestRecords = transformedRecords.slice(0, 20);
          const staticHTML = generateFundingHTML(latestRecords);

          // 3. 获取原始响应并修改HTML
          const response = await context.next();
          let html = await response.text();

          // 4. 注入静态HTML
          const loadingPattern = /<div class="funding-loading">[\s\S]*?<\/div>/;

          if (loadingPattern.test(html)) {
            console.log('✅ 找到目标DOM，准备注入...');

            html = html.replace(
              loadingPattern,
              `<!-- SSR渲染: ${latestRecords.length}条融资记录 -->
<div class="funding-cards-ssr">
${staticHTML}
</div>
<div class="funding-loading" style="display:none;">
  <span class="loading-icon">⏳</span>
  <span>正在加载更多融资信息...</span>
</div>`
            );

            console.log(`🎉 SSR中间件: 成功注入 ${latestRecords.length} 条融资记录`);

            // 5. 创建增强后的响应并应用安全头
            const newResponse = new Response(html, response);
            newResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
            newResponse.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600');
            newResponse.headers.set('X-SSR-Enabled', 'true');
            newResponse.headers.set('X-SSR-Records', latestRecords.length.toString());
            newResponse.headers.set('X-SSR-Generated', new Date().toISOString());

            // 应用安全头并返回
            return applySecurityHeaders(newResponse, url);
          } else {
            console.warn('⚠️ SSR中间件: 未找到目标DOM (.funding-loading)');
          }
        }
      }
    } catch (error) {
      console.error('❌ SSR中间件错误:', error);
    }
  }

  // === 原有安全头和缓存逻辑 ===
  const response = await context.next();

  // 创建新的响应对象以添加头部
  const newResponse = new Response(response.body, response);

  // 缓存策略
  const pathname = url.pathname;

  if (pathname.startsWith('/assets/')) {
    // 静态资源：长期缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.endsWith('.html') || pathname === '/') {
    // HTML文件：短期缓存（SSR已设置则不覆盖）
    if (!newResponse.headers.has('X-SSR-Enabled')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
    }
  } else if (pathname === '/sw.js') {
    // Service Worker：不缓存
    newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  } else if (pathname.startsWith('/api/')) {
    // API：不缓存
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    newResponse.headers.set('Pragma', 'no-cache');
  }

  // CORS头（如果需要）
  if (pathname.startsWith('/api/')) {
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // 应用安全头并返回
  return applySecurityHeaders(newResponse, url);
};