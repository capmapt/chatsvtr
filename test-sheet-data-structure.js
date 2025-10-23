/**
 * 测试飞书表格数据结构
 */
require('dotenv').config();

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'tysHBj6njxwafO92dwO1DdttVvqvesf0';
const SPREADSHEET_TOKEN = 'PERPsZO0ph5nZztjBTSctDAdnYg';
const STARTUP_SHEET_ID = 'GvCmOW';

async function getFeishuAccessToken() {
    const response = await fetch(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: FEISHU_APP_ID,
                app_secret: FEISHU_APP_SECRET
            })
        }
    );

    const data = await response.json();
    if (data.code !== 0) {
        throw new Error(`认证失败: ${data.msg}`);
    }

    return data.tenant_access_token;
}

async function main() {
    console.log('=== 测试飞书表格数据结构 ===\n');

    try {
        const accessToken = await getFeishuAccessToken();

        // 只获取前3行数据
        const range = `${STARTUP_SHEET_ID}!A1:E3`;
        const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${SPREADSHEET_TOKEN}/values/${range}`;

        console.log(`请求URL: ${url}\n`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        console.log('完整响应:');
        console.log(JSON.stringify(result, null, 2));

        if (result.code === 0) {
            console.log('\n数据行:');
            const rows = result.data?.valueRange?.values || [];
            rows.forEach((row, i) => {
                console.log(`\n第${i + 1}行:`);
                row.forEach((cell, j) => {
                    console.log(`  列${j + 1} (${typeof cell}):`, cell);
                });
            });
        }

    } catch (error) {
        console.error('错误:', error.message);
    }
}

main();
