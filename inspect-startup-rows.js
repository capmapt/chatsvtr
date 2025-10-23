/**
 * 检查Startup表前10行的结构
 */
require('dotenv').config();

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'tysHBj6njxwafO92dwO1DdttVvqvesf0';
const SPREADSHEET_TOKEN = 'PERPsZO0ph5nZztjBTSctDAdnYg';
const STARTUP_SHEET_ID = 'GvCmOW';

function cellToPlainText(cell) {
    if (cell === null || cell === undefined) {
        return '';
    }

    if (typeof cell === 'string') {
        return cell.trim();
    }

    if (Array.isArray(cell)) {
        return cell
            .map(segment => {
                if (segment && typeof segment === 'object') {
                    return segment.text || '';
                }
                return String(segment);
            })
            .join('')
            .trim();
    }

    if (typeof cell === 'object') {
        if (cell.type === 'embed-image') {
            return '[IMAGE]';
        }
        if (cell.type === 'url') {
            return cell.text || cell.link || '';
        }
        if (cell.text) {
            return String(cell.text).trim();
        }
    }

    return String(cell).trim();
}

async function main() {
    console.log('=== 检查Startup表前10行 ===\n');

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

        // 2. 获取前10行数据
        const range = `${STARTUP_SHEET_ID}!A1:Z10`;
        const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${SPREADSHEET_TOKEN}/values/${range}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        const rows = result.data?.valueRange?.values || [];

        rows.forEach((row, i) => {
            console.log(`\n第${i + 1}行:`);
            const plainRow = row.map(cell => cellToPlainText(cell));
            const nonEmptyCount = plainRow.filter(c => c !== '').length;

            console.log(`  非空列数: ${nonEmptyCount}`);
            console.log(`  前10列: ${JSON.stringify(plainRow.slice(0, 10))}`);

            // 检查是否是公式行
            const hasFormula = plainRow.some(c =>
                c.startsWith('IMPORTRANGE') ||
                c.startsWith('SORT') ||
                c.startsWith('FILTER')
            );
            console.log(`  包含公式: ${hasFormula ? '是' : '否'}`);
        });

    } catch (error) {
        console.error('错误:', error.message);
    }
}

main();
