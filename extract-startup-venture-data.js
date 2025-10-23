/**
 * 提取飞书"AI创投季度观察"的Startup和Venture数据
 */
require('dotenv').config();

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'tysHBj6njxwafO92dwO1DdttVvqvesf0';
const SPREADSHEET_TOKEN = 'PERPsZO0ph5nZztjBTSctDAdnYg'; // obj_token from AI创投季度观察
const STARTUP_SHEET_ID = 'GvCmOW';
const VENTURE_SHEET_ID = 'E7NU3J';

async function getFeishuAccessToken() {
    console.log('🔐 获取飞书Access Token...');
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

    console.log('✅ Access Token获取成功\n');
    return data.tenant_access_token;
}

/**
 * 将富文本单元格转换为纯文本
 */
function cellToPlainText(cell) {
    if (cell === null || cell === undefined) {
        return '';
    }

    // 如果已经是字符串，直接返回
    if (typeof cell === 'string') {
        return cell.trim();
    }

    // 如果是数组（富文本）
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

    // 如果是对象
    if (typeof cell === 'object') {
        // 图片类型
        if (cell.type === 'embed-image') {
            return '[IMAGE]';
        }
        // URL类型
        if (cell.type === 'url') {
            return cell.text || cell.link || '';
        }
        // 其他对象类型，尝试提取text字段
        if (cell.text) {
            return String(cell.text).trim();
        }
    }

    // 默认转字符串
    return String(cell).trim();
}

async function getSheetData(accessToken, sheetId, sheetName) {
    console.log(`📊 获取${sheetName}数据 (Sheet ID: ${sheetId})...`);

    // 获取所有数据 (A1:AZ500)
    const range = `${sheetId}!A1:AZ500`;
    // 添加valueRenderOption=ToString来获取纯文本
    const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${SPREADSHEET_TOKEN}/values/${range}?valueRenderOption=ToString`;

    console.log(`   请求URL: ${url}`);

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();

    if (result.code !== 0) {
        throw new Error(`获取${sheetName}失败: ${result.msg}`);
    }

    const rows = result.data?.valueRange?.values || [];
    console.log(`✅ ${sheetName}数据获取成功: ${rows.length}行\n`);

    // 转换所有单元格为纯文本
    const plainTextRows = rows.map(row =>
        row.map(cell => cellToPlainText(cell))
    );

    return plainTextRows;
}

function convertToObjects(rows, sheetName) {
    if (rows.length === 0) return [];

    console.log(`🔄 转换${sheetName}数据...`);
    console.log(`   总行数: ${rows.length}`);

    // 查找表头行 (跳过前面可能的说明行)
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i];
        // 检查是否是有效的表头行（包含至少3个非空列，且不是公式）
        const nonEmptyCells = row.filter(cell =>
            cell &&
            cell.trim() !== '' &&
            !cell.startsWith('IMPORTRANGE') &&
            !cell.startsWith('SORT') &&
            !cell.startsWith('FILTER') &&
            cell !== '[IMAGE]'
        );

        if (nonEmptyCells.length >= 3) {
            headerRowIndex = i;
            console.log(`   找到表头行: 第${i + 1}行`);
            break;
        }
    }

    if (headerRowIndex === -1) {
        console.log(`⚠️ 未找到有效的表头行`);
        return [];
    }

    const headers = rows[headerRowIndex];
    const data = rows.slice(headerRowIndex + 1);

    console.log(`   表头 (${headers.length}列): ${headers.filter(h => h).slice(0, 10).join(', ')}...`);
    console.log(`   数据行数: ${data.length}`);

    const objects = data.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            if (header && header.trim() !== '') {
                obj[header.trim()] = row[index] || '';
            }
        });
        return obj;
    }).filter(obj => {
        // 过滤掉空行和只有公式的行
        const values = Object.values(obj);
        const hasData = values.some(val =>
            val &&
            val.trim() !== '' &&
            !val.startsWith('IMPORTRANGE') &&
            !val.startsWith('SORT') &&
            !val.startsWith('FILTER')
        );
        return hasData;
    });

    console.log(`✅ 转换完成: ${objects.length}条有效记录\n`);
    return objects;
}

async function main() {
    console.log('=== 提取AI创投季度观察数据 ===\n');

    try {
        // 1. 获取Access Token
        const accessToken = await getFeishuAccessToken();

        // 2. 获取Startup数据
        const startupRows = await getSheetData(accessToken, STARTUP_SHEET_ID, 'Startup');
        const startupData = convertToObjects(startupRows, 'Startup');

        // 3. 获取Venture数据
        const ventureRows = await getSheetData(accessToken, VENTURE_SHEET_ID, '投资机构');
        const ventureData = convertToObjects(ventureRows, '投资机构');

        // 4. 保存数据
        const fs = require('fs');
        const path = require('path');

        const outputDir = path.join(__dirname, 'assets', 'data');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 保存Startup数据
        const startupFile = path.join(outputDir, 'startup-companies.json');
        fs.writeFileSync(startupFile, JSON.stringify({
            summary: {
                lastUpdated: new Date().toISOString(),
                totalRecords: startupData.length,
                source: 'AI创投季度观察 - Startup',
                spreadsheetToken: SPREADSHEET_TOKEN,
                sheetId: STARTUP_SHEET_ID
            },
            data: startupData
        }, null, 2));
        console.log(`💾 Startup数据已保存: ${startupFile}`);
        console.log(`   记录数: ${startupData.length}`);

        // 保存Venture数据
        const ventureFile = path.join(outputDir, 'venture-investors.json');
        fs.writeFileSync(ventureFile, JSON.stringify({
            summary: {
                lastUpdated: new Date().toISOString(),
                totalRecords: ventureData.length,
                source: 'AI创投季度观察 - 投资机构',
                spreadsheetToken: SPREADSHEET_TOKEN,
                sheetId: VENTURE_SHEET_ID
            },
            data: ventureData
        }, null, 2));
        console.log(`💾 Venture数据已保存: ${ventureFile}`);
        console.log(`   记录数: ${ventureData.length}`);

        // 打印示例数据
        if (startupData.length > 0) {
            console.log('\n📋 Startup示例数据:');
            console.log(JSON.stringify(startupData[0], null, 2).substring(0, 500) + '...');
        }

        if (ventureData.length > 0) {
            console.log('\n📋 Venture示例数据:');
            console.log(JSON.stringify(ventureData[0], null, 2).substring(0, 500) + '...');
        }

        console.log('\n✅ 数据提取完成!');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

main();
