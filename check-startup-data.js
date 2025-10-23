const data = require('./assets/data/rag/enhanced-feishu-full-content.json');

console.log('=== 飞书数据结构检查 ===\n');

console.log('1. 顶层keys:', Object.keys(data));
console.log('2. 节点数量:', data.nodes?.length);

const aiNode = data.nodes?.find(n => n.title?.includes('AI创投季度观察'));
console.log('\n3. 找到AI创投季度观察:', aiNode?.title);
console.log('4. 有sheetData:', aiNode?.sheetData ? '是' : '否');

if (aiNode?.sheetData) {
    console.log('\n5. 工作表列表:');
    aiNode.sheetData.forEach((sheet, idx) => {
        console.log(`   ${idx + 1}. ${sheet.sheetTitle} - ${sheet.rows?.length || 0} 行`);
    });

    const startupSheet = aiNode.sheetData.find(s => s.sheetTitle === 'Startup');
    if (startupSheet) {
        console.log('\n6. Startup表详情:');
        console.log('   总行数:', startupSheet.rows.length);
        console.log('   表头:', startupSheet.rows[0].slice(0, 5));
        console.log('   第一条数据:', startupSheet.rows[1]?.slice(0, 5));
    }

    const ventureSheet = aiNode.sheetData.find(s => s.sheetTitle === '投资机构');
    if (ventureSheet) {
        console.log('\n7. 投资机构(Venture)表详情:');
        console.log('   总行数:', ventureSheet.rows.length);
        console.log('   表头:', ventureSheet.rows[0].slice(0, 5));
        console.log('   第一条数据:', ventureSheet.rows[1]?.slice(0, 5));
    }
}
