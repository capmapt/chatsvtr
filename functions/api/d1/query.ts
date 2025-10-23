/**
 * Universal D1 Query API
 * 通用D1查询接口 - 支持多表查询、筛选、排序、分页
 *
 * 用法示例:
 * - GET /api/d1/query?table=companies&limit=100&order_by=last_funding_date
 * - GET /api/d1/query?table=companies&latest_stage=Series A
 * - GET /api/d1/query?view=companies_with_investors&company_id=123
 */

interface Env {
  DB: D1Database;
  SVTR_CACHE?: KVNamespace;
}

// 允许查询的表白名单
const ALLOWED_TABLES = [
  'published_articles',
  'knowledge_base_nodes'
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

// 每个表允许排序的字段白名单
const ALLOWED_ORDER_BY: Record<AllowedTable, string[]> = {
  published_articles: ['id', 'publish_date', 'view_count', 'like_count'],
  knowledge_base_nodes: ['id', 'updated_at', 'title', 'obj_type']
};

/**
 * GET /api/d1/query
 *
 * 查询参数:
 * - table: 表名 (必需，除非使用view)
 * - view: 预定义视图名 (可选，与table互斥)
 * - limit: 每页记录数 (默认100，最大500)
 * - offset: 分页偏移量 (默认0)
 * - order_by: 排序字段 (默认id)
 * - order: 排序方向 asc/desc (默认desc)
 * - 其他字段: 用于筛选条件 (如latest_stage=Series A)
 */
export async function onRequestGet(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  try {
    // 检查是否使用预定义视图
    const view = url.searchParams.get('view');
    if (view) {
      return await handleView(env.DB, view, url.searchParams);
    }

    // 标准表查询
    const table = url.searchParams.get('table');
    if (!table || !ALLOWED_TABLES.includes(table as AllowedTable)) {
      return jsonError('Invalid table. Allowed: ' + ALLOWED_TABLES.join(', '), 400);
    }

    // 解析分页参数
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '100'),
      500
    );
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 解析排序参数
    const orderBy = url.searchParams.get('order_by') || 'id';
    const order = (url.searchParams.get('order') || 'desc').toUpperCase();

    // 验证排序字段
    const typedTable = table as AllowedTable;
    if (!ALLOWED_ORDER_BY[typedTable]?.includes(orderBy)) {
      return jsonError(
        `Invalid order_by field for ${table}. Allowed: ${ALLOWED_ORDER_BY[typedTable].join(', ')}`,
        400
      );
    }

    // 验证排序方向
    if (order !== 'ASC' && order !== 'DESC') {
      return jsonError('Invalid order. Must be asc or desc', 400);
    }

    // 构建SQL查询
    let sql = `SELECT * FROM ${table} WHERE 1=1`;
    const bindings: any[] = [];

    // 添加表特定的默认筛选条件
    if (table === 'published_articles') {
      const category = url.searchParams.get('category');
      if (category) {
        sql += ` AND category = ?`;
        bindings.push(category);
      }

      const status = url.searchParams.get('status');
      if (status) {
        sql += ` AND status = ?`;
        bindings.push(status);
      } else {
        // 默认只返回已发布的文章
        sql += ` AND status = 'published'`;
      }
    }

    if (table === 'knowledge_base_nodes') {
      const objType = url.searchParams.get('obj_type');
      if (objType) {
        sql += ` AND obj_type = ?`;
        bindings.push(objType);
      }

      // 默认只返回公开且已索引的节点
      sql += ` AND is_public = 1 AND is_indexed = 1`;
    }

    // 添加排序和分页
    sql += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
    bindings.push(limit, offset);

    console.log('[D1 Query] SQL:', sql);
    console.log('[D1 Query] Bindings:', bindings);

    // 执行查询
    const result = await env.DB.prepare(sql).bind(...bindings).all();

    return jsonSuccess({
      data: result.results,
      pagination: {
        total: result.results.length,
        limit,
        offset,
        hasMore: result.results.length === limit
      }
    });

  } catch (error: any) {
    console.error('[D1 Query] Error:', error);
    return jsonError(error.message || 'Query failed', 500);
  }
}

/**
 * 预定义视图处理
 */
async function handleView(
  db: D1Database,
  view: string,
  params: URLSearchParams
): Promise<Response> {
  const views: Record<string, () => Promise<any>> = {
    // 热门文章
    popular_articles: async () => {
      const limit = parseInt(params.get('limit') || '10');
      const sql = `
        SELECT
          a.*,
          n.title,
          n.content_summary
        FROM published_articles a
        INNER JOIN knowledge_base_nodes n ON a.node_token = n.node_token
        WHERE a.status = 'published'
        ORDER BY a.view_count DESC
        LIMIT ?
      `;

      const result = await db.prepare(sql).bind(limit).all();
      return result.results;
    }
  };

  if (!views[view]) {
    return jsonError(`Invalid view: ${view}. Available: ${Object.keys(views).join(', ')}`, 400);
  }

  try {
    const result = await views[view]();
    return jsonSuccess({ data: result });
  } catch (error: any) {
    console.error('[D1 Query] View error:', error);
    return jsonError(error.message || 'View query failed', 500);
  }
}

/**
 * 辅助函数: 成功响应
 */
function jsonSuccess(data: any): Response {
  return new Response(JSON.stringify({ success: true, ...data }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300' // 5分钟缓存
    }
  });
}

/**
 * 辅助函数: 错误响应
 */
function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * OPTIONS 请求处理 (CORS预检)
 */
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
