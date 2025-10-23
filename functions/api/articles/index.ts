/**
 * 文章列表API
 * GET /api/articles
 *
 * 查询参数:
 * - category: 分类筛选（AI创投观察、技术深度、行业报告）
 * - limit: 每页数量（默认20，最大100）
 * - offset: 偏移量（分页用）
 * - sort: 排序方式（date, views, featured）
 */

interface ArticleListParams {
  category?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export async function onRequest(context: any): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // 解析查询参数
  const params: ArticleListParams = {
    category: url.searchParams.get('category') || undefined,
    limit: parseInt(url.searchParams.get('limit') || '20'),
    offset: parseInt(url.searchParams.get('offset') || '0'),
    sort: url.searchParams.get('sort') || 'date'
  };

  // 验证参数
  if (params.limit! > 100) params.limit = 100;
  if (params.limit! < 1) params.limit = 20;
  if (params.offset! < 0) params.offset = 0;

  try {
    // 构建SQL查询
    let query = `
      SELECT
        a.id,
        a.slug,
        a.published_url,
        a.meta_title,
        a.meta_description,
        a.category,
        a.tags,
        a.view_count,
        a.is_featured,
        a.publish_date,
        n.content_summary,
        n.rag_score,
        n.obj_type
      FROM published_articles a
      JOIN knowledge_base_nodes n ON a.node_token = n.node_token
      WHERE a.status = 'published'
        ${params.category ? 'AND a.category = ?' : ''}
    `;

    // 排序
    switch (params.sort) {
      case 'views':
        query += ' ORDER BY a.view_count DESC, a.publish_date DESC';
        break;
      case 'featured':
        query += ' ORDER BY a.is_featured DESC, a.publish_date DESC';
        break;
      case 'date':
      default:
        query += ' ORDER BY a.publish_date DESC';
    }

    query += ` LIMIT ? OFFSET ?`;

    // 准备参数
    const bindParams = params.category
      ? [params.category, params.limit, params.offset]
      : [params.limit, params.offset];

    // 执行查询
    const results = await env.DB.prepare(query)
      .bind(...bindParams)
      .all();

    // 获取总数（用于分页）
    const countQuery = `
      SELECT COUNT(*) as total
      FROM published_articles
      WHERE status = 'published'
        ${params.category ? 'AND category = ?' : ''}
    `;

    const countParams = params.category ? [params.category] : [];
    const { total } = await env.DB.prepare(countQuery)
      .bind(...countParams)
      .first() as { total: number };

    // 解析JSON字段
    const articles = results.results.map((article: any) => ({
      ...article,
      tags: JSON.parse(article.tags || '[]')
    }));

    // 计算分页信息
    const totalPages = Math.ceil(total / params.limit!);
    const currentPage = Math.floor(params.offset! / params.limit!) + 1;
    const hasMore = params.offset! + params.limit! < total;

    // 返回响应
    return Response.json({
      success: true,
      data: {
        articles,
        pagination: {
          total,
          limit: params.limit,
          offset: params.offset,
          currentPage,
          totalPages,
          hasMore
        },
        filters: {
          category: params.category || null,
          sort: params.sort
        }
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 缓存5分钟
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('文章列表查询失败:', error);

    return Response.json({
      success: false,
      error: '查询失败',
      message: error.message
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 支持CORS预检请求
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
