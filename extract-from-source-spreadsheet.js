/**
 * 从源电子表格提取Startup和Venture数据
 * 源地址: https://c0uiiy15npu.feishu.cn/wiki/E2Yrwyh0MiraFYkInPSc9Vgknwc
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || 'tysHBj6njxwafO92dwO1DdttVvqvesf0';
const SOURCE_NODE_TOKEN = 'E2Yrwyh0MiraFYkInPSc9Vgknwc'; // 源wiki节点token

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

async function getNodeInfo(accessToken, nodeToken) {
    const url = `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${nodeToken}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();
    return result;
}

async function getSheetInfo(accessToken, spreadsheetToken) {
    const url = `https://open.feishu.cn/open-apis/sheets/v3/spreadsheets/${spreadsheetToken}/sheets/query`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();
    return result;
}

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

async function getSheetData(accessToken, spreadsheetToken, sheetId, sheetName) {
    console.log(`📊 获取${sheetName}数据 (Sheet ID: ${sheetId})...`);

    const range = `${sheetId}!A1:AZ500`;
    const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/values/${range}`;

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
    console.log(`✅ ${sheetName}原始数据: ${rows.length}行\n`);

    // 转换为纯文本
    const plainTextRows = rows.map(row => row.map(cell => cellToPlainText(cell)));

    return plainTextRows;
}

function convertToObjects(rows, sheetName) {
    if (rows.length === 0) return [];

    console.log(`🔄 转换${sheetName}数据...`);

    // 查找表头行
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(5, rows.length); i++) {
        const row = rows[i];
        const nonEmptyCells = row.filter(cell =>
            cell && cell.trim() !== '' &&
            !cell.startsWith('IMPORTRANGE') &&
            !cell.startsWith('SORT') &&
            !cell.startsWith('FILTER') &&
            !cell.startsWith('[IMAGE]')
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

    console.log(`   表头列数: ${headers.filter(h => h).length}`);
    console.log(`   表头: ${headers.filter(h => h).slice(0, 10).join(', ')}...`);
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
        const values = Object.values(obj);
        const hasData = values.some(val =>
            val && val.trim() !== '' &&
            !val.startsWith('IMPORTRANGE') &&
            !val.startsWith('SORT') &&
            !val.startsWith('FILTER')
        );
        return hasData;
    });

    console.log(`✅ 有效记录数: ${objects.length}\n`);
    return objects;
}

async function main() {
    console.log('=== 从源电子表格提取数据 ===\n');

    try {
        // 1. 获取Access Token
        console.log('🔐 获取Access Token...');
        const accessToken = await getFeishuAccessToken();
        console.log('✅ Access Token获取成功\n');

        // 2. 获取节点信息以找到spreadsheet token
        console.log(`📋 获取节点信息 (${SOURCE_NODE_TOKEN})...`);
        const nodeInfo = await getNodeInfo(accessToken, SOURCE_NODE_TOKEN);

        if (nodeInfo.code !== 0) {
            console.log('节点信息:', JSON.stringify(nodeInfo, null, 2));
            throw new Error(`获取节点信息失败: ${nodeInfo.msg}`);
        }

        const objToken = nodeInfo.data?.node?.obj_token;
        console.log(`✅ 找到obj_token: ${objToken}\n`);

        // 3. 获取工作表列表
        console.log('📋 获取工作表列表...');
        const sheetInfo = await getSheetInfo(accessToken, objToken);

        if (sheetInfo.code !== 0) {
            throw new Error(`获取工作表列表失败: ${sheetInfo.msg}`);
        }

        const sheets = sheetInfo.data?.sheets || [];
        console.log(`✅ 找到${sheets.length}个工作表:\n`);
        sheets.forEach((sheet, i) => {
            console.log(`   ${i + 1}. ${sheet.title} (ID: ${sheet.sheet_id})`);
        });
        console.log('');

        // 4. 查找Startup和Venture工作表
        const startupSheet = sheets.find(s => s.title === 'Startup');
        const ventureSheet = sheets.find(s => s.title === 'Venture');

        if (!startupSheet) {
            throw new Error('未找到Startup工作表');
        }
        if (!ventureSheet) {
            throw new Error('未找到Venture工作表');
        }

        // 5. 获取Startup数据
        const startupRows = await getSheetData(accessToken, objToken, startupSheet.sheet_id, 'Startup');
        const startupData = convertToObjects(startupRows, 'Startup');

        // 6. 获取Venture数据
        const ventureRows = await getSheetData(accessToken, objToken, ventureSheet.sheet_id, 'Venture');
        const ventureData = convertToObjects(ventureRows, 'Venture');

        // 7. 保存数据
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
                source: '源电子表格 - Startup',
                sourceNodeToken: SOURCE_NODE_TOKEN,
                spreadsheetToken: objToken,
                sheetId: startupSheet.sheet_id
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
                source: '源电子表格 - Venture',
                sourceNodeToken: SOURCE_NODE_TOKEN,
                spreadsheetToken: objToken,
                sheetId: ventureSheet.sheet_id
            },
            data: ventureData
        }, null, 2));
        console.log(`💾 Venture数据已保存: ${ventureFile}`);
        console.log(`   记录数: ${ventureData.length}`);

        // 打印示例数据
        if (startupData.length > 0) {
            console.log('\n📋 Startup示例数据 (第1条):');
            const sampleKeys = Object.keys(startupData[0]).slice(0, 10);
            const sampleData = {};
            sampleKeys.forEach(key => {
                sampleData[key] = startupData[0][key];
            });
            console.log(JSON.stringify(sampleData, null, 2));
        }

        if (ventureData.length > 0) {
            console.log('\n📋 Venture示例数据 (第1条):');
            const sampleKeys = Object.keys(ventureData[0]).slice(0, 10);
            const sampleData = {};
            sampleKeys.forEach(key => {
                sampleData[key] = ventureData[0][key];
            });
            console.log(JSON.stringify(sampleData, null, 2));
        }

        console.log('\n✅ 数据提取完成!');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
