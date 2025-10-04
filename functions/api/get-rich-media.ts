/**
 * 飞书富媒体内容获取API
 * 实时获取图片URL和表格数据
 */

interface Env {
  // Cloudflare环境变量
}

// 飞书API配置
const FEISHU_CONFIG = {
  appId: 'cli_a8e2014cbe7d9013',
  appSecret: 'tysHBj6njxwafO92dwO1DdttVvqvesf0',
  apiBase: 'https://open.feishu.cn/open-apis'
};

/**
 * 获取飞书access_token
 */
async function getFeishuAccessToken(): Promise<string> {
  const response = await fetch(`${FEISHU_CONFIG.apiBase}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({
      app_id: FEISHU_CONFIG.appId,
      app_secret: FEISHU_CONFIG.appSecret
    })
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取token失败: ${data.msg}`);
  }

  return data.tenant_access_token;
}

/**
 * 获取图片Response
 */
async function getImageResponse(token: string, imageToken: string): Promise<Response> {
  const url = `${FEISHU_CONFIG.apiBase}/drive/v1/medias/${imageToken}/download`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`获取图片失败: ${response.status} ${response.statusText}`);
  }

  return response;
}

/**
 * 获取表格数据
 */
async function getTableData(token: string, documentId: string, tableId: string): Promise<any> {
  const url = `${FEISHU_CONFIG.apiBase}/docx/v1/documents/${documentId}/blocks/${tableId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取表格失败: ${data.msg}`);
  }

  return data.data;
}

/**
 * 主处理函数
 */
export async function onRequest(context: any): Promise<Response> {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'image' or 'table'
    const documentId = url.searchParams.get('documentId');
    const resourceToken = url.searchParams.get('token'); // imageToken or tableId

    if (!type || !documentId || !resourceToken) {
      return new Response(JSON.stringify({
        code: 400,
        msg: '缺少必要参数: type, documentId, token'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取飞书access_token
    const accessToken = await getFeishuAccessToken();

    let result: any;

    if (type === 'image') {
      // 获取图片并直接返回
      const imageResponse = await getImageResponse(accessToken, resourceToken);

      // 直接返回图片二进制数据
      return new Response(imageResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': imageResponse.headers.get('Content-Type') || 'image/png',
          'Cache-Control': 'public, max-age=86400, immutable', // 缓存24小时
          'CDN-Cache-Control': 'max-age=86400',
          'Cloudflare-CDN-Cache-Control': 'max-age=86400'
        }
      });

    } else if (type === 'table') {
      // 获取表格数据
      result = await getTableData(accessToken, documentId, resourceToken);

      return new Response(JSON.stringify({
        code: 0,
        msg: 'success',
        data: result
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        code: 400,
        msg: '不支持的类型: ' + type
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('富媒体获取错误:', error);

    return new Response(JSON.stringify({
      code: 500,
      msg: error.message || '服务器错误',
      error: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
