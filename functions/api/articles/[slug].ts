/**
 * 文章详情API
 * GET /api/articles/:slug
 *
 * 功能:
 * 1. 根据slug获取文章完整内容
 * 2. 更新浏览计数
 * 3. 返回相关文章推荐
 */

export async function onRequest(context: any): Promise<Response> {
  const { params, env } = context;
  const slug = params.slug;

  if (!slug) {
    return Response.json({
      success: false,
      error: '缺少文章slug参数'
    }, { status: 400 });
  }

  try {
    // 查询文章完整信息
    const article = await env.DB.prepare(`
      SELECT
        a.id,
        a.node_token,
        a.slug,
        a.published_url,
        a.meta_title,
        a.meta_description,
        a.meta_keywords,
        a.category,
        a.tags,
        a.view_count,
        a.like_count,
        a.share_count,
        a.is_featured,
        a.publish_date,
        n.title,
        n.obj_type,
        n.content_summary,
        n.search_keywords,
        n.semantic_tags,
        n.rag_score,
        n.feishu_url,
        c.full_content,
        c.content_format
      FROM published_articles a
      JOIN knowledge_base_nodes n ON a.node_token = n.node_token
      JOIN knowledge_base_content c ON a.node_token = c.node_token
      WHERE a.slug = ? AND a.status = 'published'
    `).bind(slug).first();

    if (!article) {
      return Response.json({
        success: false,
        error: '文章未找到',
        slug
      }, {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 异步更新浏览计数（不等待结果）
    context.waitUntil(
      updateViewCount(env, slug, article.node_token)
    );

    // 查询相关文章（同类别，按时间排序）
    const relatedArticles = await env.DB.prepare(`
      SELECT
        a.slug,
        a.meta_title,
        a.category,
        a.publish_date,
        a.view_count,
        n.content_summary
      FROM published_articles a
      JOIN knowledge_base_nodes n ON a.node_token = n.node_token
      WHERE a.status = 'published'
        AND a.slug != ?
        AND a.category = ?
      ORDER BY a.publish_date DESC
      LIMIT 5
    `).bind(slug, article.category).all();

    // 解析JSON字段
    const articleData = {
      ...article,
      tags: JSON.parse(article.tags || '[]'),
      search_keywords: JSON.parse(article.search_keywords || '[]'),
      semantic_tags: JSON.parse(article.semantic_tags || '[]'),
      view_count: article.view_count + 1 // 前端显示时+1
    };

    // 返回响应
    return Response.json({
      success: true,
      data: {
        article: articleData,
        related: relatedArticles.results
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600', // 缓存10分钟
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('文章详情查询失败:', error);

    return Response.json({
      success: false,
      error: '查询失败',
      message: error.message
    }, {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

/**
 * 更新浏览计数（异步执行）
 */
async function updateViewCount(env: any, slug: string, nodeToken: string) {
  try {
    // 更新文章浏览计数
    await env.DB.prepare(`
      UPDATE published_articles
      SET view_count = view_count + 1
      WHERE slug = ?
    `).bind(slug).run();

    // 更新节点浏览计数和最后浏览时间
    await env.DB.prepare(`
      UPDATE knowledge_base_nodes
      SET view_count = view_count + 1,
          last_viewed_at = CURRENT_TIMESTAMP
      WHERE node_token = ?
    `).bind(nodeToken).run();

  } catch (error) {
    console.error('更新浏览计数失败:', error);
    // 不抛出错误，避免影响主请求
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
