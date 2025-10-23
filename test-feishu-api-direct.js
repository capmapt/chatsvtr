/**
 * 直接测试飞书API
 */

const FEISHU_APP_ID = 'cli_a8e2014cbe7d9013';
const FEISHU_APP_SECRET = 'tysHBj6njxwafO92dwO1DdttVvqvesf0';
const SPREADSHEET_TOKEN = 'N7gZshPmZhkbRVtQm1ncV5eQnRf';
const STARTUP_SHEET_ID = 'GvCmOW';

async function testFeishuAPI() {
    console.log('=== 测试飞书API直接访问 ===\n');

    // 1. 获取access token
    console.log('1. 获取access token...');
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
    console.log('   Auth response:', authData);

    if (authData.code !== 0) {
        console.log('   ✗ 认证失败');
        return;
    }

    const accessToken = authData.tenant_access_token;
    console.log('   ✓ Access token获取成功\n');

    // 2. 测试查询Startup工作表
    console.log('2. 查询Startup工作表...');
    const range = `${STARTUP_SHEET_ID}!A1:AZ10`;
    const url = `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${SPREADSHEET_TOKEN}/values/${range}`;

    console.log(`   URL: ${url}`);

    const dataResponse = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    const dataText = await dataResponse.text();
    console.log(`   Status: ${dataResponse.status}`);
    console.log(`   Response (first 500 chars): ${dataText.substring(0, 500)}`);

    try {
        const data = JSON.parse(dataText);
        if (data.code === 0) {
            console.log('\n   ✓ 数据获取成功!');
            console.log(`   行数: ${data.data?.valueRange?.values?.length || 0}`);
            if (data.data?.valueRange?.values?.[0]) {
                console.log(`   表头: ${data.data.valueRange.values[0].slice(0, 10)}`);
            }
        } else {
            console.log(`\n   ✗ API错误: ${data.msg}`);
        }
    } catch (e) {
        console.log(`\n   ✗ JSON解析失败: ${e.message}`);
    }
}

testFeishuAPI().catch(console.error);
