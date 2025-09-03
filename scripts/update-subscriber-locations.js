/**
 * 批量更新订阅用户地理位置信息脚本
 * 使用ipapi.co API获取详细城市信息
 */

const API_ENDPOINT = 'https://svtr.ai/api/update-user-locations';
const BATCH_SIZE = 5; // 每批处理5个用户，避免API频率限制

async function updateSubscriberLocations() {
    try {
        console.log('🌍 开始批量更新订阅用户地理位置信息...');
        
        // 先获取更新统计
        const statsResponse = await fetch(`${API_ENDPOINT}`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            console.log(`📊 当前统计:
- 总用户数: ${statsData.data.totalUsers}
- 已有地理位置: ${statsData.data.usersWithLocation}
- 具备城市信息: ${statsData.data.usersWithCityInfo}
- 完成率: ${statsData.data.completionRate}%
- 城市信息率: ${statsData.data.cityInfoRate}%`);
        }
        
        let totalUpdated = 0;
        let batchCount = 1;
        
        // 分批次更新，避免API限制
        while (true) {
            console.log(`\n🔄 执行第 ${batchCount} 批次更新...`);
            
            const updateResponse = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_locations',
                    batchSize: BATCH_SIZE
                })
            });
            
            const updateData = await updateResponse.json();
            
            if (updateData.success) {
                const { updated, skipped, errors, total } = updateData.data;
                console.log(`✅ 批次 ${batchCount} 完成:
- 更新: ${updated} 个
- 跳过: ${skipped} 个  
- 错误: ${errors} 个
- 处理: ${total} 个`);
                
                totalUpdated += updated;
                
                // 如果这批次没有更新任何用户，说明已经完成
                if (updated === 0) {
                    console.log('\n🎉 所有用户地理位置信息已更新完成！');
                    break;
                }
                
                batchCount++;
                
                // 添加延迟避免API频率限制
                console.log('⏳ 等待5秒避免API频率限制...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
            } else {
                console.error(`❌ 批次 ${batchCount} 失败:`, updateData.message);
                break;
            }
        }
        
        // 获取最终统计
        console.log('\n📈 获取最终统计...');
        const finalStatsResponse = await fetch(`${API_ENDPOINT}`);
        const finalStats = await finalStatsResponse.json();
        
        if (finalStats.success) {
            console.log(`\n🏁 更新完成统计:
- 总用户数: ${finalStats.data.totalUsers}
- 已有地理位置: ${finalStats.data.usersWithLocation}
- 具备城市信息: ${finalStats.data.usersWithCityInfo}
- 完成率: ${finalStats.data.completionRate}%
- 城市信息率: ${finalStats.data.cityInfoRate}%
- 本次更新总数: ${totalUpdated}`);
        }
        
        console.log('\n✨ 批量更新任务完成！');
        
    } catch (error) {
        console.error('❌ 批量更新失败:', error);
    }
}

// 执行更新
updateSubscriberLocations();