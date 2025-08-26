/**
 * SVTR 项目文件下载API端点
 * 路径: /api/projects/[projectId]/files/[fileIndex]
 * 处理项目文件的下载功能
 */

// 处理文件下载 - GET请求
export async function onRequestGet(context: any): Promise<Response> {
  try {
    const { request, env, params } = context;
    const { projectId, fileIndex } = params;
    
    console.log('文件下载请求:', { projectId, fileIndex });
    
    if (!projectId || fileIndex === undefined) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少项目ID或文件索引'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 检查KV存储是否可用
    if (!env.SVTR_CACHE) {
      console.warn('KV存储未配置，返回模拟文件');
      
      // 返回一个简单的文本文件
      const mockContent = `SVTR 项目管理系统 - 示例文档

这是一个示例文档文件。

文档编号: ${fileIndex}
生成时间: ${new Date().toLocaleString('zh-CN')}

注意：实际的项目文档需要通过项目申请表单上传。
此文件仅为演示目的。

---
SVTR 硅谷科技评论
AI创投生态系统
`;
      
      const encoder = new TextEncoder();
      const contentBytes = encoder.encode(mockContent);
      
      return new Response(contentBytes, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(`示例文档_${fileIndex}.txt`)}"`,
          'Content-Length': contentBytes.length.toString(),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        }
      });
    }

    // 获取项目数据
    const projectData = await env.SVTR_CACHE.get(`project_${projectId}`);
    if (!projectData) {
      return new Response(JSON.stringify({
        success: false,
        message: '项目不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const project = JSON.parse(projectData);
    const fileIndexNum = parseInt(fileIndex as string, 10);
    
    if (!project.files || !project.files[fileIndexNum]) {
      return new Response(JSON.stringify({
        success: false,
        message: '文件不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const fileInfo = project.files[fileIndexNum];
    
    // 如果文件有ID，尝试从文件存储中获取实际文件内容
    if (fileInfo.id) {
      const fileData = await env.SVTR_CACHE.get(`file_${fileInfo.id}`);
      if (fileData) {
        const storedFile = JSON.parse(fileData);
        
        // 将Base64数据转换为二进制
        try {
          const binaryString = atob(storedFile.data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          return new Response(bytes.buffer, {
            status: 200,
            headers: {
              'Content-Type': storedFile.type || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${encodeURIComponent(storedFile.originalName || storedFile.name)}"`,
              'Content-Length': storedFile.size.toString(),
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Cache-Control': 'public, max-age=3600'
            }
          });
        } catch (error) {
          console.error('Base64解码失败:', error);
          return new Response(JSON.stringify({
            success: false,
            message: '文件数据损坏，无法解码'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
      }
    }

    // 如果没有实际文件内容，生成一个示例文件
    const fileName = fileInfo.name || `项目文档_${fileIndex + 1}`;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'txt';
    
    let content: string;
    let contentType: string;
    let finalFileName: string;

    switch (fileExtension) {
      case 'pdf':
        // 由于PDF格式复杂且容易出现编码问题，改为生成HTML格式但保持.pdf扩展名
        content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>SVTR 项目文档 - ${project.name || '示例项目'}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        h2 { color: #4a5568; margin-top: 30px; }
        .info-table { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #2d3748; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px; }
    </style>
</head>
<body>
    <h1>SVTR 项目文档</h1>
    
    <div class="info-table">
        <div class="info-row"><span class="label">项目名称:</span> ${project.name || '示例项目'}</div>
        <div class="info-row"><span class="label">创始人:</span> ${project.founder || '创始人'}</div>
        <div class="info-row"><span class="label">项目类别:</span> ${project.category || '未分类'}</div>
        <div class="info-row"><span class="label">项目状态:</span> ${project.status || '未知'}</div>
        <div class="info-row"><span class="label">创建时间:</span> ${project.createdAt || new Date().toISOString()}</div>
    </div>
    
    <h2>项目描述</h2>
    <p>${project.description || '这是一个示例项目文档。实际的项目文档内容需要通过项目申请表单上传。'}</p>
    
    <h2>需求清单</h2>
    ${project.needs && project.needs.length > 0 ? 
      `<ul>${project.needs.map((need: string) => `<li>${need}</li>`).join('')}</ul>` : 
      '<p>暂无需求信息</p>'
    }
    
    <div class="footer">
        <p>此文档生成于: ${new Date().toLocaleString('zh-CN')}</p>
        <p>SVTR 硅谷科技评论 - AI创投生态系统</p>
    </div>
</body>
</html>`;
        contentType = 'text/html; charset=utf-8';
        finalFileName = fileName.endsWith('.pdf') ? fileName.replace('.pdf', '.html') : `${fileName}.html`;
        break;

      case 'txt':
        content = `SVTR 项目文档

项目名称: ${project.name || '示例项目'}
创始人: ${project.founder || '创始人'}
项目类别: ${project.category || '未分类'}
项目状态: ${project.status || '未知'}
创建时间: ${project.createdAt || new Date().toISOString()}

项目描述:
${project.description || '这是一个示例项目文档。实际的项目文档内容需要通过项目申请表单上传。'}

需求清单:
${project.needs && project.needs.length > 0 ? project.needs.map((need: string, index: number) => `${index + 1}. ${need}`).join('\n') : '暂无需求信息'}

---
此文档生成于: ${new Date().toLocaleString('zh-CN')}
SVTR 硅谷科技评论 - AI创投生态系统
`;
        contentType = 'text/plain; charset=utf-8';
        finalFileName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;
        break;

      default:
        content = `项目文件: ${fileName}
项目: ${project.name || '示例项目'}
创始人: ${project.founder || '创始人'}

注意: 这是一个示例文件。实际的项目文档需要通过项目申请表单上传。

生成时间: ${new Date().toLocaleString('zh-CN')}
`;
        contentType = 'text/plain; charset=utf-8';
        finalFileName = `${fileName}.txt`;
        break;
    }

    // 将内容转换为UTF-8字节数组
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);
    
    return new Response(contentBytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(finalFileName)}"`,
        'Content-Length': contentBytes.length.toString(),
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

// 处理OPTIONS请求 - CORS
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