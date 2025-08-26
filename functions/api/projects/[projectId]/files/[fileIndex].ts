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
      
      // 返回一个模拟的PDF文件
      const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(这是一个示例文档) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000369 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
449
%%EOF`;
      
      return new Response(mockPdfContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="示例文档_${fileIndex}.pdf"`,
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
        const binaryData = atob(storedFile.data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }

        return new Response(arrayBuffer, {
          status: 200,
          headers: {
            'Content-Type': storedFile.type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${storedFile.originalName || storedFile.name}"`,
            'Content-Length': storedFile.size.toString(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Cache-Control': 'public, max-age=3600'
          }
        });
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
        // 生成示例PDF
        content = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 120
>>
stream
BT
/F1 16 Tf
50 750 Td
(项目: ${project.name || '示例项目'}) Tj
0 -30 Td
(创始人: ${project.founder || '创始人'}) Tj
0 -30 Td
(文件: ${fileName}) Tj
0 -30 Td
(生成时间: ${new Date().toLocaleString('zh-CN')}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000000445 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
525
%%EOF`;
        contentType = 'application/pdf';
        finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
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

    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${finalFileName}"`,
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