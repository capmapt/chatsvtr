/**
 * 测试飞书Companies API
 */

async function testFeishuCompaniesAPI() {
    const baseUrl = 'https://c1f5e31d.chatsvtr.pages.dev';

    console.log('=== 测试飞书Companies API ===\n');

    // 测试1: 获取Startup数据
    console.log('1. 测试Startup数据...');
    try {
        const response1 = await fetch(`${baseUrl}/api/feishu-companies?type=startup&limit=10`);
        const data1 = await response1.json();

        console.log('   状态:', response1.status);
        console.log('   成功:', data1.success);
        console.log('   数据类型:', data1.type);
        console.log('   总数:', data1.total);
        console.log('   返回数量:', data1.data?.length);

        if (data1.data?.[0]) {
            console.log('   第一条记录字段:', Object.keys(data1.data[0]).slice(0, 10));
            console.log('   第一条记录:', JSON.stringify(data1.data[0], null, 2).substring(0, 500));
        }
    } catch (error) {
        console.log('   ✗ 错误:', error.message);
    }

    console.log('\n2. 测试Investors数据...');
    try {
        const response2 = await fetch(`${baseUrl}/api/feishu-companies?type=investors&limit=10`);
        const data2 = await response2.json();

        console.log('   状态:', response2.status);
        console.log('   成功:', data2.success);
        console.log('   数据类型:', data2.type);
        console.log('   总数:', data2.total);
        console.log('   返回数量:', data2.data?.length);

        if (data2.data?.[0]) {
            console.log('   第一条记录字段:', Object.keys(data2.data[0]).slice(0, 10));
        }
    } catch (error) {
        console.log('   ✗ 错误:', error.message);
    }
}

testFeishuCompaniesAPI().catch(console.error);
