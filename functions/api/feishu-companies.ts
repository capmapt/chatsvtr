/**
 * Feishu Companies & Investors API
 * 实时从飞书"AI创投季度观察"表格获取Startup和Venture数据
 */

interface Env {
    FEISHU_APP_ID: string;
    FEISHU_APP_SECRET: string;
}

const FEISHU_SPREADSHEET_TOKEN = 'N7gZshPmZhkbRVtQm1ncV5eQnRf'; // AI创投季度观察
const STARTUP_SHEET_ID = 'GvCmOW'; // Startup工作表
const VENTURE_SHEET_ID = 'E7NU3J'; // 投资机构工作表

/**
 * GET /api/feishu-companies?type=startup|investors&limit=100
 */
export async function onRequestGet(context: {
    request: Request;
    env: Env;
}): Promise<Response> {
    const { request, env } = context;
    const url = new URL(request.url);

    try {
        // 获取查询参数
        const type = url.searchParams.get('type') || 'startup'; // startup or investors
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 1000);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // 获取飞书access token
        const accessToken = await getFeishuAccessToken(env);

        // 根据类型选择对应的工作表
        const sheetId = type === 'investors' ? VENTURE_SHEET_ID : STARTUP_SHEET_ID;

        // 获取表格数据
        const sheetData = await getFeishuSheetData(
            accessToken,
            FEISHU_SPREADSHEET_TOKEN,
            sheetId,
            limit
        );

        if (!sheetData || sheetData.length === 0) {
            return jsonError('No data found', 404);
        }

        // 解析数据
        const headers = sheetData[0];
        const rows = sheetData.slice(1 + offset, limit + offset + 1);

        const records = rows.map((row: string[]) => {
            const record: any = {};
            headers.forEach((header: string, index: number) => {
                record[header] = row[index] || '';
            });
            return record;
        });

        return jsonSuccess({
            type,
            total: sheetData.length - 1,
            limit,
            offset,
            data: records
        });

    } catch (error: any) {
        console.error('[Feishu Companies API] Error:', error);
        return jsonError(error.message || 'Failed to fetch data', 500);
    }
}

/**
 * 获取飞书Access Token
 */
async function getFeishuAccessToken(env: Env): Promise<string> {
    const response = await fetch(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                app_id: env.FEISHU_APP_ID,
                app_secret: env.FEISHU_APP_SECRET
            })
        }
    );

    const data = await response.json() as any;

    if (data.code !== 0) {
        throw new Error(`Feishu auth failed: ${data.msg}`);
    }

    return data.tenant_access_token;
}

/**
 * 获取飞书表格数据
 */
async function getFeishuSheetData(
    accessToken: string,
    spreadsheetToken: string,
    sheetId: string,
    limit: number
): Promise<string[][]> {
    // 计算需要的行数范围 (格式: sheetId!A1:AZ500)
    const endRow = Math.min(limit + 1, 500); // +1 for header
    const range = `${sheetId}!A1:AZ${endRow}`;

    const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${range}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json() as any;

    if (data.code !== 0) {
        throw new Error(`Feishu API error: ${data.msg}`);
    }

    return data.data?.valueRange?.values || [];
}

/**
 * 成功响应
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
 * 错误响应
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
 * CORS预检
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
