/**
 * SVTR 文件管理API端点
 * 处理项目文件的上传、下载和管理功能
 */

interface StoredFile {
  id: string;
  projectId: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  data: string; // Base64编码的文件内容
}

// 生成文件ID
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 处理文件上传 - POST请求
export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少项目ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 检查KV存储是否可用
    if (!env.SVTR_CACHE) {
      return new Response(JSON.stringify({
        success: false,
        message: 'KV存储未配置，无法上传文件'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const contentType = request.headers.get('content-type');
    let fileData: any;

    if (contentType?.includes('multipart/form-data')) {
      // 处理multipart/form-data上传
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return new Response(JSON.stringify({
          success: false,
          message: '未找到文件'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 文件大小限制 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({
          success: false,
          message: '文件大小不能超过10MB'
        }), {
          status: 413,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // 将文件转为ArrayBuffer然后转为Base64
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      fileData = {
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Data
      };
    } else {
      // 处理JSON格式的文件数据
      const jsonData = await request.json();
      fileData = jsonData;
    }

    if (!fileData.name || !fileData.data) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件数据不完整'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 创建文件记录
    const fileId = generateFileId();
    const storedFile: StoredFile = {
      id: fileId,
      projectId,
      name: fileData.name,
      originalName: fileData.name,
      size: fileData.size || 0,
      type: fileData.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      data: fileData.data
    };

    // 保存文件到KV存储
    await env.SVTR_CACHE.put(`file_${fileId}`, JSON.stringify(storedFile));

    // 更新项目的文件列表
    const projectData = await env.SVTR_CACHE.get(`project_${projectId}`);
    if (projectData) {
      const project = JSON.parse(projectData);
      if (!project.files) {
        project.files = [];
      }
      
      project.files.push({
        id: fileId,
        name: storedFile.name,
        size: storedFile.size,
        type: storedFile.type,
        uploadTime: storedFile.uploadedAt
      });

      await env.SVTR_CACHE.put(`project_${projectId}`, JSON.stringify(project));
    }

    return new Response(JSON.stringify({
      success: true,
      message: '文件上传成功',
      data: {
        fileId,
        name: storedFile.name,
        size: storedFile.size,
        type: storedFile.type
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '文件上传失败',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理文件下载 - GET请求
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    const projectId = url.searchParams.get('projectId');
    
    if (!fileId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少文件ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 检查KV存储是否可用
    if (!env.SVTR_CACHE) {
      return new Response(JSON.stringify({
        success: false,
        message: 'KV存储未配置，无法下载文件'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 从KV存储获取文件
    const fileData = await env.SVTR_CACHE.get(`file_${fileId}`);
    if (!fileData) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const file: StoredFile = JSON.parse(fileData);

    // 验证项目权限（如果提供了projectId）
    if (projectId && file.projectId !== projectId) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件访问权限不足'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 将Base64数据转换为二进制
    const binaryData = atob(file.data);
    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }

    // 返回文件内容
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.size.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=3600'
      }
    });

  } catch (error) {
    console.error('文件下载失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '文件下载失败',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理文件删除 - DELETE请求
export async function onRequestDelete(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    const projectId = url.searchParams.get('projectId');
    
    if (!fileId) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少文件ID'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 检查KV存储是否可用
    if (!env.SVTR_CACHE) {
      return new Response(JSON.stringify({
        success: false,
        message: 'KV存储未配置，无法删除文件'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 获取文件信息进行验证
    const fileData = await env.SVTR_CACHE.get(`file_${fileId}`);
    if (!fileData) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const file: StoredFile = JSON.parse(fileData);

    // 验证项目权限
    if (projectId && file.projectId !== projectId) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件删除权限不足'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 删除文件
    await env.SVTR_CACHE.delete(`file_${fileId}`);

    // 从项目文件列表中移除
    if (file.projectId) {
      const projectData = await env.SVTR_CACHE.get(`project_${file.projectId}`);
      if (projectData) {
        const project = JSON.parse(projectData);
        if (project.files) {
          project.files = project.files.filter((f: any) => f.id !== fileId);
          await env.SVTR_CACHE.put(`project_${file.projectId}`, JSON.stringify(project));
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: '文件删除成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('文件删除失败:', error);
    return new Response(JSON.stringify({
      success: false,
      message: '文件删除失败',
      error: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// 处理OPTIONS请求 - CORS
export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}