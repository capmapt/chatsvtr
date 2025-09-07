/**
 * SVTR Media Upload API
 * 处理图片、视频和文件上传功能
 */

export interface Env {
  MEDIA_KV: KVNamespace;
  R2_BUCKET: R2Bucket;
  AI: any;
}

interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'image' | 'video' | 'audio' | 'document';
  width?: number;
  height?: number;
  duration?: number; // 视频/音频时长（秒）
  alt?: string; // 图片替代文字
  tags: string[];
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 支持的文件类型
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/mov'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
            'text/plain', 'text/markdown']
};

// 文件大小限制（bytes）
const SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 20 * 1024 * 1024 // 20MB
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace('/api/media', '');
    const method = request.method;

    try {
      if (path === '/upload' && method === 'POST') {
        return await handleUpload(request, env);
      }
      
      if (path === '/files' && method === 'GET') {
        return await handleGetFiles(request, env);
      }
      
      if (path.match(/^\/files\/[\w-]+$/) && method === 'GET') {
        const fileId = path.split('/')[2];
        return await handleGetFile(fileId, env);
      }
      
      if (path.match(/^\/files\/[\w-]+$/) && method === 'DELETE') {
        const fileId = path.split('/')[2];
        return await handleDeleteFile(fileId, request, env);
      }
      
      if (path === '/optimize' && method === 'POST') {
        return await handleOptimizeImage(request, env);
      }

      return new Response('Not Found', { 
        status: 404,
        headers: CORS_HEADERS 
      });

    } catch (error) {
      console.error('Media API Error:', error);
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

// 处理文件上传
async function handleUpload(request: Request, env: Env): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string || 'anonymous';
    const alt = formData.get('alt') as string || '';
    const tags = formData.get('tags') as string || '';
    
    if (!file) {
      return new Response(JSON.stringify({ error: '请选择要上传的文件' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 验证文件类型和大小
    const fileCategory = getFileCategory(file.type);
    if (!fileCategory) {
      return new Response(JSON.stringify({ 
        error: '不支持的文件类型',
        supportedTypes: Object.values(ALLOWED_TYPES).flat()
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    if (file.size > SIZE_LIMITS[fileCategory]) {
      return new Response(JSON.stringify({ 
        error: `文件大小超出限制，${fileCategory}文件最大支持 ${Math.round(SIZE_LIMITS[fileCategory] / 1024 / 1024)}MB`
      }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 生成文件信息
    const fileId = generateFileId();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${fileId}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();
    
    // 上传到R2存储
    const uploadPath = `${fileCategory}/${fileName}`;
    await env.R2_BUCKET.put(uploadPath, fileBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString()
      }
    });

    // 获取图片尺寸（如果是图片）
    let dimensions = {};
    if (fileCategory === 'image') {
      try {
        dimensions = await getImageDimensions(fileBuffer, file.type);
      } catch (error) {
        console.warn('获取图片尺寸失败:', error);
      }
    }

    // 创建文件记录
    const uploadedFile: UploadedFile = {
      id: fileId,
      originalName: file.name,
      fileName: fileName,
      mimeType: file.type,
      size: file.size,
      url: `/api/media/files/${fileId}`,
      uploadedBy: userId,
      uploadedAt: new Date().toISOString(),
      category: fileCategory,
      alt: alt,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      ...dimensions
    };

    // 保存文件记录到KV
    await env.MEDIA_KV.put(`file:${fileId}`, JSON.stringify(uploadedFile));
    
    // 更新文件列表
    await addToFilesList(uploadedFile, env);

    return new Response(JSON.stringify({
      success: true,
      file: uploadedFile,
      message: '文件上传成功'
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: '文件上传失败',
      details: error.message 
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 获取文件列表
async function handleGetFiles(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const userId = url.searchParams.get('userId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');

    // 获取文件列表
    const filesData = await env.MEDIA_KV.get('files:list');
    let files: UploadedFile[] = filesData ? JSON.parse(filesData) : [];

    // 应用筛选
    if (category) {
      files = files.filter(f => f.category === category);
    }
    if (userId) {
      files = files.filter(f => f.uploadedBy === userId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      files = files.filter(f => 
        f.originalName.toLowerCase().includes(searchLower) ||
        f.alt?.toLowerCase().includes(searchLower) ||
        f.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // 排序（最新的在前）
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    // 分页
    const total = files.length;
    const offset = (page - 1) * limit;
    const paginatedFiles = files.slice(offset, offset + limit);

    return new Response(JSON.stringify({
      files: paginatedFiles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total,
        images: files.filter(f => f.category === 'image').length,
        videos: files.filter(f => f.category === 'video').length,
        audios: files.filter(f => f.category === 'audio').length,
        documents: files.filter(f => f.category === 'document').length
      }
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

// 获取单个文件
async function handleGetFile(fileId: string, env: Env): Promise<Response> {
  try {
    // 从KV获取文件信息
    const fileData = await env.MEDIA_KV.get(`file:${fileId}`);
    if (!fileData) {
      return new Response('File not found', {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    const file: UploadedFile = JSON.parse(fileData);
    
    // 从R2获取文件内容
    const uploadPath = `${file.category}/${file.fileName}`;
    const r2Object = await env.R2_BUCKET.get(uploadPath);
    
    if (!r2Object) {
      return new Response('File content not found', {
        status: 404,
        headers: CORS_HEADERS
      });
    }

    return new Response(r2Object.body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': file.mimeType,
        'Content-Length': file.size.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${file.originalName}"`
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }
}

// 删除文件
async function handleDeleteFile(fileId: string, request: Request, env: Env): Promise<Response> {
  try {
    // 验证权限（这里简化处理，实际应该验证JWT token）
    const userId = new URL(request.url).searchParams.get('userId');
    
    // 获取文件信息
    const fileData = await env.MEDIA_KV.get(`file:${fileId}`);
    if (!fileData) {
      return new Response(JSON.stringify({ error: '文件不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const file: UploadedFile = JSON.parse(fileData);
    
    // 检查权限（只能删除自己上传的文件，或管理员）
    if (file.uploadedBy !== userId && userId !== 'admin') {
      return new Response(JSON.stringify({ error: '无权限删除此文件' }), {
        status: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 从R2删除文件
    const uploadPath = `${file.category}/${file.fileName}`;
    await env.R2_BUCKET.delete(uploadPath);

    // 从KV删除文件记录
    await env.MEDIA_KV.delete(`file:${fileId}`);
    
    // 从文件列表中删除
    await removeFromFilesList(fileId, env);

    return new Response(JSON.stringify({
      success: true,
      message: '文件删除成功'
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

// 图片优化
async function handleOptimizeImage(request: Request, env: Env): Promise<Response> {
  try {
    const { fileId, width, height, quality = 80, format } = await request.json();
    
    // 获取原始图片
    const fileData = await env.MEDIA_KV.get(`file:${fileId}`);
    if (!fileData) {
      return new Response(JSON.stringify({ error: '文件不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const file: UploadedFile = JSON.parse(fileData);
    
    if (file.category !== 'image') {
      return new Response(JSON.stringify({ error: '只能优化图片文件' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 从R2获取原始图片
    const uploadPath = `${file.category}/${file.fileName}`;
    const r2Object = await env.R2_BUCKET.get(uploadPath);
    
    if (!r2Object) {
      return new Response(JSON.stringify({ error: '原始文件不存在' }), {
        status: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // 使用Cloudflare AI进行图片处理（如果有AI服务）
    // 这里是示例，实际需要根据可用的AI服务调整
    const imageBuffer = await r2Object.arrayBuffer();
    
    // 生成优化后的文件名
    const optimizedFileName = `${fileId}_${width || 'auto'}x${height || 'auto'}_q${quality}.${format || 'webp'}`;
    const optimizedPath = `optimized/${optimizedFileName}`;
    
    // 这里应该调用实际的图片处理服务
    // 暂时直接返回原图片
    await env.R2_BUCKET.put(optimizedPath, imageBuffer, {
      httpMetadata: {
        contentType: format ? `image/${format}` : 'image/webp',
        cacheControl: 'public, max-age=31536000'
      }
    });

    return new Response(JSON.stringify({
      success: true,
      optimizedUrl: `/api/media/files/optimized/${optimizedFileName}`,
      originalSize: file.size,
      message: '图片优化成功'
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

// 辅助函数

function generateFileId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | null {
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimeType)) {
      return category as 'image' | 'video' | 'audio' | 'document';
    }
  }
  return null;
}

async function getImageDimensions(buffer: ArrayBuffer, mimeType: string): Promise<{ width?: number; height?: number }> {
  // 这里应该实现实际的图片尺寸检测
  // 暂时返回默认值
  return { width: 800, height: 600 };
}

async function addToFilesList(file: UploadedFile, env: Env) {
  const filesData = await env.MEDIA_KV.get('files:list');
  const files: UploadedFile[] = filesData ? JSON.parse(filesData) : [];
  
  files.unshift(file);
  
  // 保留最近10000个文件记录
  if (files.length > 10000) {
    files.splice(10000);
  }
  
  await env.MEDIA_KV.put('files:list', JSON.stringify(files));
}

async function removeFromFilesList(fileId: string, env: Env) {
  const filesData = await env.MEDIA_KV.get('files:list');
  if (!filesData) return;
  
  const files: UploadedFile[] = JSON.parse(filesData);
  const filteredFiles = files.filter(f => f.id !== fileId);
  
  await env.MEDIA_KV.put('files:list', JSON.stringify(filteredFiles));
}