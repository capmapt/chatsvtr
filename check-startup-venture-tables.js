/**
 * 检查D1数据库中的startup和Venture表
 */

async function checkD1Tables() {
    const baseUrl = 'https://svtr.ai';

    console.log('=== 检查D1数据库表结构 ===\n');

    // 尝试查询startup表
    console.log('1. 查询startup表...');
    try {
        const startupResponse = await fetch(`${baseUrl}/api/d1/query?table=startup&limit=5`);
        const startupText = await startupResponse.text();
        console.log('startup表响应:', startupText.substring(0, 500));

        if (startupResponse.ok) {
            const startupData = JSON.parse(startupText);
            console.log('✓ startup表可访问');
            console.log('  记录数示例:', startupData.data?.length || 0);
            if (startupData.data?.[0]) {
                console.log('  字段结构:', Object.keys(startupData.data[0]));
            }
        }
    } catch (error) {
        console.log('✗ startup表错误:', error.message);
    }

    console.log('\n2. 查询Venture表...');
    try {
        const ventureResponse = await fetch(`${baseUrl}/api/d1/query?table=Venture&limit=5`);
        const ventureText = await ventureResponse.text();
        console.log('Venture表响应:', ventureText.substring(0, 500));

        if (ventureResponse.ok) {
            const ventureData = JSON.parse(ventureText);
            console.log('✓ Venture表可访问');
            console.log('  记录数示例:', ventureData.data?.length || 0);
            if (ventureData.data?.[0]) {
                console.log('  字段结构:', Object.keys(ventureData.data[0]));
            }
        }
    } catch (error) {
        console.log('✗ Venture表错误:', error.message);
    }

    // 检查现有可访问的表
    console.log('\n3. 检查已知可访问的表...');
    const knownTables = ['published_articles', 'knowledge_base_nodes'];
    for (const table of knownTables) {
        try {
            const response = await fetch(`${baseUrl}/api/d1/query?table=${table}&limit=1`);
            if (response.ok) {
                const data = await response.json();
                console.log(`✓ ${table}: ${data.data?.length || 0} 条记录`);
            }
        } catch (error) {
            console.log(`✗ ${table}: ${error.message}`);
        }
    }
}

checkD1Tables().catch(console.error);
