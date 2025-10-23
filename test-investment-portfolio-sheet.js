/**
 * 测试投资组合工作表
 */
require('dotenv').config();

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'tysHBj6njxwafO92dwO1DdttVvqvesf0';
const SPREADSHEET_TOKEN = 'PERPsZO0ph5nZztjBTSctDAdnYg'; // obj_token from AI创投季度观察
const PORTFOLIO_SHEET_ID = 'aa49c5'; // 投资组合 sheet ID from sync log

function cellToPlainText(cell) {
    if (cell === null || cell === undefined) return '';
    if (typeof cell === 'string') return cell.trim();
    if (Array.isArray(cell)) {
        return cell.map(seg => seg && typeof seg === 'object' ? (seg.text || '') : String(seg)).join('').trim();
    }
    if (typeof cell === 'object') {
        if (cell.type === 'embed-image') return '[IMAGE]';
        if (cell.type === 'url') return cell.text || cell.link || '';
        if (cell.text) return String(cell.text).trim();
    }
    return String(cell).trim();
}

async function main() {
    console.log('=== 测试投资组合工作表 ===\n');

    try {
        // 1. 获取access token
        const authResponse = await fetch(
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

        const authData = await authResponse.json();
        const accessToken = authData.tenant_access_token;
        console.log('✅ Access Token获取成功\n');

        // 2. 获取投资组合表前15行数据
        const range = `${PORTFOLIO_SHEET_ID}!A1:Z15`;
        const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${SPREADSHEET_TOKEN}/values/${range}`;

        console.log(`请求URL: ${url}\n`);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.code !== 0) {
            console.log(`❌ API错误: ${result.msg}`);
            return;
        }

        const rows = result.data?.valueRange?.values || [];
        console.log(`总行数: ${rows.length}\n`);

        rows.forEach((row, i) => {
            const plainRow = row.map(cell => cellToPlainText(cell));
            const nonEmptyCount = plainRow.filter(c => c !== '').length;
            const hasFormula = plainRow.some(c =>
                c.startsWith('IMPORTRANGE') || c.startsWith('SORT') || c.startsWith('FILTER')
            );

            console.log(`第${i + 1}行: ${nonEmptyCount}个非空列, 包含公式:${hasFormula ? '是' : '否'}`);
            console.log(`  前10列: ${JSON.stringify(plainRow.slice(0, 10))}\n`);
        });

    } catch (error) {
        console.error('错误:', error.message);
    }
}

main();
