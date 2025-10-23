# 飞书表格同步到D1完整指南

## 概述
本指南详细说明如何将飞书多维表格数据（包括隐藏表格）同步到Cloudflare D1数据库。

## 1. 飞书API权限确认

### 隐藏表格的访问
**重要结论**：飞书的"隐藏表格"只是UI层面隐藏，API完全可以访问！

- 隐藏表格仍然有唯一的 `table_id`
- 只要应用有多维表格权限，API可以读取所有表格
- 不需要任何特殊配置

### 获取所有表格ID（包括隐藏表格）
```bash
curl -X GET \
  "https://open.feishu.cn/open-apis/bitable/v1/apps/YOUR_APP_TOKEN/tables" \
  -H "Authorization: Bearer YOUR_TENANT_ACCESS_TOKEN"
```

响应示例：
```json
{
  "data": {
    "items": [
      {
        "table_id": "tblxxxxxx",
        "name": "AI公司数据库",
        "is_hidden": false
      },
      {
        "table_id": "tbl123456",
        "name": "内部评分表",
        "is_hidden": true  // 隐藏表格仍然可访问
      }
    ]
  }
}
```

## 2. D1数据库创建步骤

### 步骤1: 创建D1数据库
```bash
# 创建生产环境数据库
npx wrangler d1 create svtr-production

# 命令会返回database_id，复制备用
# 输出示例:
# Created database svtr-production
# database_id: abc123def456...
```

### 步骤2: 更新wrangler.toml配置
在 `wrangler.toml` 添加D1绑定：
```toml
[[d1_databases]]
binding = "DB"
database_name = "svtr-production"
database_id = "your-database-id-from-step1"
```

### 步骤3: 扩展数据库Schema
创建 `database/d1-rankings-schema.sql`：
```sql
-- AI公司数据表
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feishu_record_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    company_name_en TEXT,
    website TEXT,
    founded_year INTEGER,
    location TEXT,
    location_cn TEXT,

    -- 融资信息
    latest_stage TEXT,
    latest_amount_usd REAL,
    latest_valuation_usd REAL,
    total_funding_usd REAL,
    last_funding_date DATE,

    -- 分类和标签
    primary_category TEXT,
    secondary_category TEXT,
    tags JSON, -- ["多模态", "AI100", "Unicorn"]

    -- 业务数据
    arr_usd REAL,
    monthly_revenue_usd REAL,
    user_count INTEGER,

    -- 创始团队
    founders_info JSON,
    team_background TEXT,

    -- 评分和排名
    svtr_score REAL,
    market_score REAL,
    tech_score REAL,
    team_score REAL,

    -- 搜索和索引
    search_vector TEXT, -- 用于全文搜索

    -- 状态控制
    is_active BOOLEAN DEFAULT 1,
    is_public BOOLEAN DEFAULT 1,
    data_quality_score INTEGER DEFAULT 0,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    feishu_sync_at DATETIME
);

-- 投资机构表
CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feishu_record_id TEXT UNIQUE NOT NULL,
    investor_name TEXT NOT NULL,
    investor_name_en TEXT,
    investor_type TEXT, -- VC, CVC, Angel, PE

    -- 基本信息
    website TEXT,
    founded_year INTEGER,
    location TEXT,
    aum_usd REAL, -- Assets Under Management

    -- 投资偏好
    typical_stage TEXT, -- Seed, Series A, B, C, etc.
    focus_sectors JSON,
    avg_check_size_usd REAL,

    -- 活跃度
    investments_count INTEGER DEFAULT 0,
    exits_count INTEGER DEFAULT 0,

    -- 搜索和索引
    search_vector TEXT,

    -- 状态控制
    is_active BOOLEAN DEFAULT 1,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    feishu_sync_at DATETIME
);

-- 投资记录表
CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feishu_record_id TEXT UNIQUE,
    company_id INTEGER NOT NULL,
    investor_id INTEGER NOT NULL,

    -- 投资详情
    funding_round TEXT,
    investment_date DATE,
    amount_usd REAL,
    valuation_usd REAL,
    is_lead BOOLEAN DEFAULT 0,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id) REFERENCES companies (id),
    FOREIGN KEY (investor_id) REFERENCES investors (id)
);

-- 排名缓存表（提升查询性能）
CREATE TABLE IF NOT EXISTS rankings_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ranking_type TEXT NOT NULL, -- funding_top100, unicorn_list, active_investors
    ranking_data JSON NOT NULL,
    filters_hash TEXT, -- 用于区分不同过滤条件的排名
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- 创建索引
CREATE INDEX idx_companies_category ON companies (primary_category, is_active);
CREATE INDEX idx_companies_funding ON companies (latest_amount_usd DESC);
CREATE INDEX idx_companies_stage ON companies (latest_stage);
CREATE INDEX idx_companies_tags ON companies (tags); -- JSON数组索引
CREATE INDEX idx_investors_type ON investors (investor_type, is_active);
CREATE INDEX idx_investments_company ON investments (company_id);
CREATE INDEX idx_investments_investor ON investments (investor_id);
CREATE INDEX idx_investments_date ON investments (investment_date DESC);
CREATE INDEX idx_rankings_type ON rankings_cache (ranking_type, filters_hash);
```

### 步骤4: 执行Schema创建
```bash
# 在本地执行（测试用）
npx wrangler d1 execute svtr-production --local --file=./database/d1-rankings-schema.sql

# 在远程执行（生产环境）
npx wrangler d1 execute svtr-production --remote --file=./database/d1-rankings-schema.sql
```

## 3. 同步脚本实现

### 核心同步脚本：scripts/feishu-to-d1-sync.js

```javascript
/**
 * 飞书多维表格 → Cloudflare D1 同步脚本
 * 支持：
 * 1. 隐藏表格同步
 * 2. 批量插入（1000条/批）
 * 3. 增量更新
 * 4. 数据验证
 */

// 飞书API配置
const FEISHU_CONFIG = {
  appId: process.env.FEISHU_APP_ID || 'cli_a8e2014cbe7d9013',
  appSecret: process.env.FEISHU_APP_SECRET,
  apiBase: 'https://open.feishu.cn/open-apis'
};

// 表格映射配置
const TABLE_MAPPINGS = {
  companies: {
    feishu_app_token: 'YOUR_APP_TOKEN',
    feishu_table_id: 'tblxxxxxx', // 公司表格ID（可以是隐藏的）
    d1_table: 'companies'
  },
  investors: {
    feishu_app_token: 'YOUR_APP_TOKEN',
    feishu_table_id: 'tblyyyyyy', // 投资人表格ID
    d1_table: 'investors'
  },
  investments: {
    feishu_app_token: 'YOUR_APP_TOKEN',
    feishu_table_id: 'tblzzzzzz', // 投资记录表格ID
    d1_table: 'investments'
  }
};

class FeishuToD1Sync {
  constructor(env) {
    this.env = env; // Cloudflare环境对象
    this.accessToken = null;
  }

  /**
   * 获取飞书访问令牌
   */
  async getAccessToken() {
    if (this.accessToken) return this.accessToken;

    const response = await fetch(
      `${FEISHU_CONFIG.apiBase}/auth/v3/tenant_access_token/internal`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: FEISHU_CONFIG.appId,
          app_secret: FEISHU_CONFIG.appSecret
        })
      }
    );

    const data = await response.json();
    this.accessToken = data.tenant_access_token;
    return this.accessToken;
  }

  /**
   * 获取飞书表格所有记录（支持分页）
   */
  async fetchFeishuRecords(appToken, tableId) {
    const token = await this.getAccessToken();
    const allRecords = [];
    let pageToken = null;

    do {
      const url = new URL(
        `${FEISHU_CONFIG.apiBase}/bitable/v1/apps/${appToken}/tables/${tableId}/records`
      );
      url.searchParams.set('page_size', '500'); // 最大500条/页
      if (pageToken) {
        url.searchParams.set('page_token', pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`飞书API错误: ${data.msg}`);
      }

      allRecords.push(...data.data.items);
      pageToken = data.data.has_more ? data.data.page_token : null;

      console.log(`已获取 ${allRecords.length} 条记录...`);
    } while (pageToken);

    return allRecords;
  }

  /**
   * 清洗和映射公司数据
   */
  cleanCompanyData(feishuRecord) {
    const fields = feishuRecord.fields;

    return {
      feishu_record_id: feishuRecord.record_id,
      company_name: fields['公司名称']?.[0]?.text || '',
      company_name_en: fields['Company Name EN']?.[0]?.text || null,
      website: fields['官网']?.[0]?.link || null,
      founded_year: fields['成立年份'] || null,
      location: fields['总部地点']?.[0]?.text || null,
      latest_stage: fields['最新融资轮次']?.[0]?.text || null,
      latest_amount_usd: this.parseAmount(fields['最新融资金额']),
      latest_valuation_usd: this.parseAmount(fields['估值']),
      total_funding_usd: this.parseAmount(fields['累计融资']),
      last_funding_date: this.parseDate(fields['最新融资时间']),
      primary_category: fields['主类别']?.[0]?.text || null,
      secondary_category: fields['副类别']?.[0]?.text || null,
      tags: JSON.stringify(
        fields['标签']?.map(tag => tag.text) || []
      ),
      arr_usd: this.parseAmount(fields['ARR']),
      founders_info: JSON.stringify(fields['创始人信息'] || []),
      team_background: fields['团队背景']?.[0]?.text || null,
      svtr_score: fields['SVTR评分'] || null,
      search_vector: this.buildSearchVector(fields),
      is_public: fields['是否公开'] !== false,
      feishu_sync_at: new Date().toISOString()
    };
  }

  /**
   * 批量同步公司数据到D1
   */
  async syncCompanies() {
    console.log('开始同步公司数据...');

    const config = TABLE_MAPPINGS.companies;
    const feishuRecords = await this.fetchFeishuRecords(
      config.feishu_app_token,
      config.feishu_table_id
    );

    console.log(`从飞书获取到 ${feishuRecords.length} 家公司数据`);

    // 清洗数据
    const cleanedData = feishuRecords
      .map(record => this.cleanCompanyData(record))
      .filter(data => data.company_name); // 过滤空名称

    // 批量插入（每次1000条）
    const batchSize = 1000;
    for (let i = 0; i < cleanedData.length; i += batchSize) {
      const batch = cleanedData.slice(i, i + batchSize);

      const statements = batch.map(company => {
        return this.env.DB.prepare(`
          INSERT INTO companies (
            feishu_record_id, company_name, company_name_en, website,
            founded_year, location, latest_stage, latest_amount_usd,
            latest_valuation_usd, total_funding_usd, last_funding_date,
            primary_category, secondary_category, tags, arr_usd,
            founders_info, team_background, svtr_score, search_vector,
            is_public, feishu_sync_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(feishu_record_id) DO UPDATE SET
            company_name = excluded.company_name,
            latest_amount_usd = excluded.latest_amount_usd,
            latest_stage = excluded.latest_stage,
            tags = excluded.tags,
            updated_at = CURRENT_TIMESTAMP,
            feishu_sync_at = excluded.feishu_sync_at
        `).bind(
          company.feishu_record_id,
          company.company_name,
          company.company_name_en,
          company.website,
          company.founded_year,
          company.location,
          company.latest_stage,
          company.latest_amount_usd,
          company.latest_valuation_usd,
          company.total_funding_usd,
          company.last_funding_date,
          company.primary_category,
          company.secondary_category,
          company.tags,
          company.arr_usd,
          company.founders_info,
          company.team_background,
          company.svtr_score,
          company.search_vector,
          company.is_public,
          company.feishu_sync_at
        );
      });

      await this.env.DB.batch(statements);
      console.log(`已同步 ${Math.min((i + batchSize), cleanedData.length)} / ${cleanedData.length} 家公司`);
    }

    // 记录同步日志
    await this.logSync('companies', cleanedData.length, 'success');

    console.log('✅ 公司数据同步完成！');
    return { success: true, count: cleanedData.length };
  }

  /**
   * 同步投资人数据（类似逻辑）
   */
  async syncInvestors() {
    // 实现类似 syncCompanies 的逻辑
    console.log('开始同步投资人数据...');
    // ... 省略具体实现
  }

  /**
   * 同步投资记录（需要先同步公司和投资人）
   */
  async syncInvestments() {
    // 实现类似逻辑，需要处理外键关联
    console.log('开始同步投资记录...');
    // ... 省略具体实现
  }

  /**
   * 全量同步
   */
  async syncAll() {
    const startTime = Date.now();

    try {
      // 按顺序同步（因为investments依赖公司和投资人ID）
      await this.syncCompanies();
      await this.syncInvestors();
      await this.syncInvestments();

      const duration = Date.now() - startTime;
      console.log(`🎉 全量同步完成，耗时: ${(duration / 1000).toFixed(2)}秒`);

      return { success: true, duration };
    } catch (error) {
      console.error('同步失败:', error);
      await this.logSync('all', 0, 'failed', error.message);
      throw error;
    }
  }

  /**
   * 工具函数：解析金额
   */
  parseAmount(value) {
    if (!value) return null;
    if (typeof value === 'number') return value;

    const numStr = value.toString().replace(/[^\d.]/g, '');
    const num = parseFloat(numStr);

    // 处理单位（亿、万）
    if (value.includes('亿')) return num * 100000000;
    if (value.includes('万')) return num * 10000;
    if (value.includes('B')) return num * 1000000000;
    if (value.includes('M')) return num * 1000000;

    return num;
  }

  /**
   * 工具函数：解析日期
   */
  parseDate(value) {
    if (!value) return null;
    try {
      const date = new Date(value);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * 工具函数：构建搜索向量（简化版全文搜索）
   */
  buildSearchVector(fields) {
    const searchableFields = [
      fields['公司名称']?.[0]?.text,
      fields['Company Name EN']?.[0]?.text,
      fields['主类别']?.[0]?.text,
      fields['标签']?.map(t => t.text).join(' ')
    ].filter(Boolean);

    return searchableFields.join(' ').toLowerCase();
  }

  /**
   * 记录同步日志
   */
  async logSync(syncType, recordsProcessed, status, errorMessage = null) {
    await this.env.DB.prepare(`
      INSERT INTO sync_logs (sync_type, status, records_processed, error_message, end_time)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(syncType, status, recordsProcessed, errorMessage).run();
  }
}

// Worker入口（用于定时任务）
export default {
  async scheduled(event, env, ctx) {
    const syncer = new FeishuToD1Sync(env);
    await syncer.syncAll();
  }
};

// CLI入口（用于手动执行）
if (typeof module !== 'undefined' && require.main === module) {
  (async () => {
    // 注意：CLI模式需要提供env对象
    console.log('请使用 wrangler dev 或部署为Worker后使用定时任务执行');
  })();
}
```

## 4. 定时任务配置

### 方法1: 使用Cloudflare Cron Triggers（推荐）

在 `wrangler.toml` 添加：
```toml
[triggers]
crons = [
  "0 2 * * *"  # 每天凌晨2点执行同步（UTC时间）
]
```

创建 `workers/feishu-sync-worker.js`：
```javascript
import { FeishuToD1Sync } from '../scripts/feishu-to-d1-sync.js';

export default {
  async scheduled(event, env, ctx) {
    console.log('定时任务触发，开始同步飞书数据...');

    const syncer = new FeishuToD1Sync(env);
    const result = await syncer.syncAll();

    console.log('同步结果:', result);
  }
};
```

部署定时任务：
```bash
npx wrangler deploy workers/feishu-sync-worker.js
```

### 方法2: 使用GitHub Actions（备选方案）

创建 `.github/workflows/feishu-sync.yml`：
```yaml
name: Daily Feishu Sync

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点
  workflow_dispatch:  # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run Feishu sync
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: npx wrangler d1 execute svtr-production --remote --command="$(node scripts/feishu-to-d1-sync.js)"
```

## 5. 测试同步

### 手动触发测试
```bash
# 本地测试（使用本地D1）
npx wrangler dev workers/feishu-sync-worker.js

# 在浏览器访问
# http://localhost:8787/__scheduled

# 远程测试（一次性执行）
npx wrangler dev workers/feishu-sync-worker.js --remote
```

### 验证数据
```bash
# 查询公司数量
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT COUNT(*) as total FROM companies"

# 查看最新同步的公司
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT company_name, latest_amount_usd, feishu_sync_at FROM companies ORDER BY feishu_sync_at DESC LIMIT 10"

# 检查同步日志
npx wrangler d1 execute svtr-production --remote \
  --command="SELECT * FROM sync_logs ORDER BY start_time DESC LIMIT 5"
```

## 6. 监控和维护

### 同步状态监控
创建 `functions/api/sync-status.ts`：
```typescript
export async function onRequest(context) {
  const { env } = context;

  // 查询最近7天同步状态
  const logs = await env.DB.prepare(`
    SELECT
      sync_type,
      status,
      records_processed,
      start_time,
      end_time,
      duration_ms,
      error_message
    FROM sync_logs
    WHERE start_time > datetime('now', '-7 days')
    ORDER BY start_time DESC
  `).all();

  return Response.json({
    success: true,
    sync_history: logs.results
  });
}
```

### 数据质量检查
```javascript
async function checkDataQuality(env) {
  const checks = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN company_name IS NULL THEN 1 ELSE 0 END) as missing_name,
      SUM(CASE WHEN latest_amount_usd IS NULL THEN 1 ELSE 0 END) as missing_funding,
      AVG(data_quality_score) as avg_quality_score
    FROM companies
    WHERE is_active = 1
  `).first();

  console.log('数据质量报告:', checks);
  return checks;
}
```

## 7. 常见问题解决

### Q1: 同步速度慢怎么办？
**A**:
- 使用批量插入（1000条/批）
- 调整飞书API page_size到500
- 使用D1的批处理API（batch）

### Q2: 飞书API限流怎么办？
**A**:
- 飞书限制：8000请求/小时
- 实现请求间隔控制（sleep 450ms）
- 使用增量同步而非全量同步

### Q3: 数据冲突怎么处理？
**A**:
- 使用 `ON CONFLICT(feishu_record_id) DO UPDATE`
- feishu_record_id作为唯一标识
- 保留created_at，更新updated_at

### Q4: 如何回滚错误的同步？
**A**:
```sql
-- 删除最近一次同步的数据
DELETE FROM companies
WHERE feishu_sync_at = (
  SELECT MAX(feishu_sync_at) FROM companies
);
```

## 8. 下一步集成

同步完成后，您可以：

1. **创建API端点** (`functions/api/rankings/*.ts`)
2. **构建前端页面** (`pages/rankings/*.html`)
3. **集成ECharts图表**
4. **添加AI chatbot查询功能**

详见：[数据榜单开发指南](./DATA_RANKINGS_IMPLEMENTATION.md)
