/**
 * SVTR Content Management API
 * 处理内容创作、审核、发布的后端API
 */

export interface Env {
  CONTENT_KV: KVNamespace;
  AI: any;
}

// 内容数据结构
interface Content {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  category: 'startups' | 'public' | 'analysis' | 'investors' | 'weekly';
  tags: string[];
  authorId: string;
  authorName: string;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  rejectionReason?: string;
  featured: boolean;
  views: number;
  likes: number;
  wordCount: number;
  readTime: number; // 预计阅读时间（分钟）
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: string;
  slug?: string;
}

// 审核日志
interface ReviewLog {
  id: string;
  contentId: string;
  reviewerId: string;
  reviewerName: string;
  action: 'approve' | 'reject' | 'request_changes';
  reason?: string;
  changes?: string[];
  timestamp: string;
}

// 用户权限
interface UserPermissions {
  canCreateContent: boolean;
  canReviewContent: boolean;
  canPublishContent: boolean;
  canDeleteContent: boolean;
  canManageUsers: boolean;
  isAdmin: boolean;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/api/content-management', '');
    const method = request.method;

    try {
      // 路由处理
      if (path === '/contents' && method === 'GET') {
        return await handleGetContents(request, env);
      }
      
      if (path === '/contents' && method === 'POST') {
        return await handleCreateContent(request, env);
      }
      
      if (path.match(/^\/contents\/[\w-]+$/) && method === 'GET') {
        const contentId = path.split('/')[2];
        return await handleGetContent(contentId, env);
      }
      
      if (path.match(/^\/contents\/[\w-]+$/) && method === 'PUT') {
        const contentId = path.split('/')[2];
        return await handleUpdateContent(contentId, request, env);
      }
      
      if (path.match(/^\/contents\/[\w-]+$/) && method === 'DELETE') {
        const contentId = path.split('/')[2];
        return await handleDeleteContent(contentId, request, env);
      }
      
      if (path.match(/^\/contents\/[\w-]+\/review$/) && method === 'POST') {
        const contentId = path.split('/')[2];
        return await handleReviewContent(contentId, request, env);
      }
      
      if (path.match(/^\/contents\/[\w-]+\/publish$/) && method === 'POST') {
        const contentId = path.split('/')[2];
        return await handlePublishContent(contentId, request, env);
      }
      
      if (path === '/contents/batch' && method === 'POST') {
        return await handleBatchOperation(request, env);
      }
      
      if (path === '/authors' && method === 'GET') {
        return await handleGetAuthors(env);
      }
      
      if (path === '/stats' && method === 'GET') {
        return await handleGetStats(env);
      }

      return new Response('Not Found', { 
        status: 404,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }
  }
};

// 获取内容列表
async function handleGetContents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const authorId = url.searchParams.get('authorId');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const search = url.searchParams.get('search');

  try {
    // 从KV存储获取内容列表
    const contentsKey = 'svtr:contents:list';
    const contentsData = await env.CONTENT_KV.get(contentsKey);
    let contents: Content[] = contentsData ? JSON.parse(contentsData) : [];

    // 应用筛选
    if (status) {
      contents = contents.filter(c => c.status === status);
    }
    if (category) {
      contents = contents.filter(c => c.category === category);
    }
    if (authorId) {
      contents = contents.filter(c => c.authorId === authorId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      contents = contents.filter(c => 
        c.title.toLowerCase().includes(searchLower) ||
        c.excerpt.toLowerCase().includes(searchLower) ||
        c.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 排序（最新的在前）
    contents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // 分页
    const total = contents.length;
    const offset = (page - 1) * limit;
    const paginatedContents = contents.slice(offset, offset + limit);

    // 统计各状态的数量
    const allContents = contentsData ? JSON.parse(contentsData) : [];
    const stats = {
      pending: allContents.filter(c => c.status === 'pending').length,
      published: allContents.filter(c => c.status === 'published').length,
      draft: allContents.filter(c => c.status === 'draft').length,
      rejected: allContents.filter(c => c.status === 'rejected').length,
      total: allContents.length
    };

    return new Response(JSON.stringify({
      contents: paginatedContents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 创建新内容
async function handleCreateContent(request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.json();
    
    // 生成内容ID和基本信息
    const contentId = generateId();
    const now = new Date().toISOString();
    
    // 计算阅读时间（按300字/分钟计算）
    const wordCount = data.content ? data.content.replace(/<[^>]*>/g, '').length : 0;
    const readTime = Math.max(1, Math.ceil(wordCount / 300));
    
    const newContent: Content = {
      id: contentId,
      title: data.title || '',
      content: data.content || '',
      excerpt: data.excerpt || generateExcerpt(data.content),
      category: data.category || 'analysis',
      tags: data.tags || [],
      authorId: data.authorId || 'unknown',
      authorName: data.authorName || '未知作者',
      status: data.status || 'draft',
      createdAt: now,
      updatedAt: now,
      featured: false,
      views: 0,
      likes: 0,
      wordCount,
      readTime,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      coverImage: data.coverImage,
      slug: data.slug || generateSlug(data.title)
    };

    // 获取现有内容列表
    const contentsKey = 'svtr:contents:list';
    const contentsData = await env.CONTENT_KV.get(contentsKey);
    const contents: Content[] = contentsData ? JSON.parse(contentsData) : [];
    
    // 添加新内容
    contents.unshift(newContent);
    
    // 保存到KV存储
    await env.CONTENT_KV.put(contentsKey, JSON.stringify(contents));
    await env.CONTENT_KV.put(`svtr:content:${contentId}`, JSON.stringify(newContent));

    return new Response(JSON.stringify({
      success: true,
      content: newContent
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 获取单个内容
async function handleGetContent(contentId: string, env: Env): Promise<Response> {
  try {
    const contentData = await env.CONTENT_KV.get(`svtr:content:${contentId}`);
    
    if (!contentData) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const content: Content = JSON.parse(contentData);

    return new Response(JSON.stringify(content), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 更新内容
async function handleUpdateContent(contentId: string, request: Request, env: Env): Promise<Response> {
  try {
    const data = await request.json();
    const contentData = await env.CONTENT_KV.get(`svtr:content:${contentId}`);
    
    if (!contentData) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const content: Content = JSON.parse(contentData);
    const now = new Date().toISOString();
    
    // 更新字段
    const updatedContent: Content = {
      ...content,
      ...data,
      updatedAt: now,
      wordCount: data.content ? data.content.replace(/<[^>]*>/g, '').length : content.wordCount,
      readTime: data.content ? Math.max(1, Math.ceil(data.content.replace(/<[^>]*>/g, '').length / 300)) : content.readTime
    };

    // 如果内容已发布但现在改为草稿，清除发布时间
    if (content.status === 'published' && data.status === 'draft') {
      delete updatedContent.publishedAt;
    }

    // 保存更新的内容
    await env.CONTENT_KV.put(`svtr:content:${contentId}`, JSON.stringify(updatedContent));
    
    // 更新列表中的内容
    await updateContentInList(contentId, updatedContent, env);

    return new Response(JSON.stringify({
      success: true,
      content: updatedContent
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 审核内容
async function handleReviewContent(contentId: string, request: Request, env: Env): Promise<Response> {
  try {
    const { action, reason, reviewerId, reviewerName } = await request.json();
    
    const contentData = await env.CONTENT_KV.get(`svtr:content:${contentId}`);
    if (!contentData) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const content: Content = JSON.parse(contentData);
    const now = new Date().toISOString();

    // 更新内容状态
    const updatedContent: Content = {
      ...content,
      status: action === 'approve' ? 'published' : 'rejected',
      reviewedAt: now,
      reviewerId,
      reviewerName,
      rejectionReason: action === 'reject' ? reason : undefined,
      publishedAt: action === 'approve' ? now : undefined,
      updatedAt: now
    };

    // 保存更新的内容
    await env.CONTENT_KV.put(`svtr:content:${contentId}`, JSON.stringify(updatedContent));
    await updateContentInList(contentId, updatedContent, env);

    // 记录审核日志
    const reviewLog: ReviewLog = {
      id: generateId(),
      contentId,
      reviewerId,
      reviewerName,
      action,
      reason,
      timestamp: now
    };
    await saveReviewLog(reviewLog, env);

    return new Response(JSON.stringify({
      success: true,
      content: updatedContent,
      message: action === 'approve' ? '内容已通过审核并发布' : '内容已被拒绝'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 发布内容
async function handlePublishContent(contentId: string, request: Request, env: Env): Promise<Response> {
  try {
    const contentData = await env.CONTENT_KV.get(`svtr:content:${contentId}`);
    if (!contentData) {
      return new Response(JSON.stringify({ error: 'Content not found' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const content: Content = JSON.parse(contentData);
    const now = new Date().toISOString();

    const updatedContent: Content = {
      ...content,
      status: 'published',
      publishedAt: now,
      updatedAt: now
    };

    await env.CONTENT_KV.put(`svtr:content:${contentId}`, JSON.stringify(updatedContent));
    await updateContentInList(contentId, updatedContent, env);

    return new Response(JSON.stringify({
      success: true,
      content: updatedContent,
      message: '内容已发布'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 批量操作
async function handleBatchOperation(request: Request, env: Env): Promise<Response> {
  try {
    const { operation, contentIds, data } = await request.json();
    
    const results = [];
    
    for (const contentId of contentIds) {
      const contentData = await env.CONTENT_KV.get(`svtr:content:${contentId}`);
      if (!contentData) continue;
      
      const content: Content = JSON.parse(contentData);
      let updatedContent = { ...content };
      
      switch (operation) {
        case 'approve':
          updatedContent.status = 'published';
          updatedContent.publishedAt = new Date().toISOString();
          break;
        case 'reject':
          updatedContent.status = 'rejected';
          updatedContent.rejectionReason = data?.reason || '批量拒绝';
          break;
        case 'delete':
          await env.CONTENT_KV.delete(`svtr:content:${contentId}`);
          await removeContentFromList(contentId, env);
          results.push({ contentId, success: true });
          continue;
        case 'feature':
          updatedContent.featured = true;
          break;
        case 'unfeature':
          updatedContent.featured = false;
          break;
        case 'unpublish':
          updatedContent.status = 'draft';
          delete updatedContent.publishedAt;
          break;
      }
      
      updatedContent.updatedAt = new Date().toISOString();
      
      await env.CONTENT_KV.put(`svtr:content:${contentId}`, JSON.stringify(updatedContent));
      await updateContentInList(contentId, updatedContent, env);
      
      results.push({ contentId, success: true, content: updatedContent });
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `批量操作完成，处理了 ${results.length} 个项目`
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 获取作者列表
async function handleGetAuthors(env: Env): Promise<Response> {
  try {
    const contentsKey = 'svtr:contents:list';
    const contentsData = await env.CONTENT_KV.get(contentsKey);
    const contents: Content[] = contentsData ? JSON.parse(contentsData) : [];

    // 统计作者信息
    const authorsMap = new Map();
    
    contents.forEach(content => {
      if (!authorsMap.has(content.authorId)) {
        authorsMap.set(content.authorId, {
          id: content.authorId,
          name: content.authorName,
          totalArticles: 0,
          publishedArticles: 0,
          totalViews: 0
        });
      }
      
      const author = authorsMap.get(content.authorId);
      author.totalArticles++;
      if (content.status === 'published') {
        author.publishedArticles++;
        author.totalViews += content.views;
      }
    });

    const authors = Array.from(authorsMap.values());

    return new Response(JSON.stringify(authors), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 获取统计数据
async function handleGetStats(env: Env): Promise<Response> {
  try {
    const contentsKey = 'svtr:contents:list';
    const contentsData = await env.CONTENT_KV.get(contentsKey);
    const contents: Content[] = contentsData ? JSON.parse(contentsData) : [];

    const stats = {
      totalContents: contents.length,
      pendingReview: contents.filter(c => c.status === 'pending').length,
      published: contents.filter(c => c.status === 'published').length,
      drafts: contents.filter(c => c.status === 'draft').length,
      rejected: contents.filter(c => c.status === 'rejected').length,
      totalViews: contents.reduce((sum, c) => sum + c.views, 0),
      totalLikes: contents.reduce((sum, c) => sum + c.likes, 0),
      uniqueAuthors: new Set(contents.map(c => c.authorId)).size,
      avgReadTime: contents.length > 0 ? 
        Math.round(contents.reduce((sum, c) => sum + c.readTime, 0) / contents.length) : 0,
      categoryStats: {
        startups: contents.filter(c => c.category === 'startups').length,
        public: contents.filter(c => c.category === 'public').length,
        analysis: contents.filter(c => c.category === 'analysis').length,
        investors: contents.filter(c => c.category === 'investors').length,
        weekly: contents.filter(c => c.category === 'weekly').length
      }
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 辅助函数

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateExcerpt(content: string): string {
  if (!content) return '';
  const text = content.replace(/<[^>]*>/g, '');
  return text.length > 200 ? text.substring(0, 200) + '...' : text;
}

function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function updateContentInList(contentId: string, updatedContent: Content, env: Env) {
  const contentsKey = 'svtr:contents:list';
  const contentsData = await env.CONTENT_KV.get(contentsKey);
  const contents: Content[] = contentsData ? JSON.parse(contentsData) : [];
  
  const index = contents.findIndex(c => c.id === contentId);
  if (index !== -1) {
    contents[index] = updatedContent;
    await env.CONTENT_KV.put(contentsKey, JSON.stringify(contents));
  }
}

async function removeContentFromList(contentId: string, env: Env) {
  const contentsKey = 'svtr:contents:list';
  const contentsData = await env.CONTENT_KV.get(contentsKey);
  const contents: Content[] = contentsData ? JSON.parse(contentsData) : [];
  
  const filteredContents = contents.filter(c => c.id !== contentId);
  await env.CONTENT_KV.put(contentsKey, JSON.stringify(filteredContents));
}

async function saveReviewLog(reviewLog: ReviewLog, env: Env) {
  const logsKey = 'svtr:review:logs';
  const logsData = await env.CONTENT_KV.get(logsKey);
  const logs: ReviewLog[] = logsData ? JSON.parse(logsData) : [];
  
  logs.unshift(reviewLog);
  
  // 保留最近1000条日志
  if (logs.length > 1000) {
    logs.splice(1000);
  }
  
  await env.CONTENT_KV.put(logsKey, JSON.stringify(logs));
}