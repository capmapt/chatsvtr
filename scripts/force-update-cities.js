/**
 * 强力更新用户真实城市信息
 * 直接调用ipapi.co API获取所有用户的城市信息
 */

const IPAPI_ENDPOINT = 'https://ipapi.co';
const BATCH_DELAY = 200; // 每次API调用间隔200ms，避免频率限制

// 模拟常见城市的IP地址（用于演示）
const DEMO_IPS_WITH_CITIES = [
    { ip: '39.156.66.10', expectedCity: 'Beijing', expectedCountry: 'China' },
    { ip: '8.8.8.8', expectedCity: 'Mountain View', expectedCountry: 'United States' },
    { ip: '180.76.15.146', expectedCity: 'Beijing', expectedCountry: 'China' },
    { ip: '103.235.46.40', expectedCity: 'Singapore', expectedCountry: 'Singapore' },
    { ip: '168.95.1.1', expectedCity: 'Taipei', expectedCountry: 'Taiwan' },
    { ip: '202.108.22.5', expectedCity: 'Beijing', expectedCountry: 'China' },
    { ip: '134.195.196.26', expectedCity: 'New York', expectedCountry: 'United States' },
    { ip: '210.140.131.199', expectedCity: 'Tokyo', expectedCountry: 'Japan' }
];

async function getLocationFromIP(ip) {
    try {
        console.log(`🔍 查询IP地址: ${ip}`);
        
        const response = await fetch(`${IPAPI_ENDPOINT}/${ip}/json/`, {
            headers: { 'User-Agent': 'SVTR-CityUpdate/1.0' },
            timeout: 8000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.warn(`❌ API错误: ${data.reason || data.error}`);
            return null;
        }
        
        const location = {
            city: data.city || '未知',
            region: data.region || '未知',
            country: data.country_name || '未知',
            timezone: data.timezone || '未知'
        };
        
        console.log(`✅ 获取成功: ${location.city}, ${location.country}`);
        return location;
        
    } catch (error) {
        console.warn(`❌ 查询失败 ${ip}: ${error.message}`);
        return null;
    }
}

async function demonstrateCityQueries() {
    console.log('🌍 演示真实城市信息查询...\n');
    
    let successCount = 0;
    let cityInfoCount = 0;
    
    for (const demo of DEMO_IPS_WITH_CITIES) {
        const location = await getLocationFromIP(demo.ip);
        
        if (location) {
            successCount++;
            if (location.city && location.city !== '未知') {
                cityInfoCount++;
                console.log(`🏙️  ${demo.ip} → ${location.city}, ${location.country}`);
            } else {
                console.log(`🌏  ${demo.ip} → ${location.country} (无具体城市)`);
            }
        } else {
            console.log(`❌  ${demo.ip} → 查询失败`);
        }
        
        // 延迟避免频率限制
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
    
    console.log(`\n📊 演示统计:
- 总查询: ${DEMO_IPS_WITH_CITIES.length} 个IP
- 成功获取: ${successCount} 个
- 有城市信息: ${cityInfoCount} 个
- 成功率: ${((successCount / DEMO_IPS_WITH_CITIES.length) * 100).toFixed(1)}%
- 城市信息率: ${((cityInfoCount / DEMO_IPS_WITH_CITIES.length) * 100).toFixed(1)}%`);
    
    if (cityInfoCount > 0) {
        console.log('\n✅ ipapi.co API 工作正常，可以获取城市级地理位置信息！');
        console.log('💡 用户缺少城市信息的原因可能是：');
        console.log('   1. 现有用户注册时未调用地理位置API');
        console.log('   2. 用户使用的是本地/代理IP地址');
        console.log('   3. 需要为现有用户补充真实的IP地址数据');
    } else {
        console.log('\n⚠️  当前无法获取详细城市信息，可能的原因：');
        console.log('   1. API配额已用完（免费版每天1000次）');
        console.log('   2. 网络连接问题');
        console.log('   3. API服务暂时不可用');
    }
}

async function updateExistingUsersWithCityInfo() {
    console.log('\n🔄 开始为现有用户补充城市信息...');
    
    try {
        // 首先检查用户统计
        const statsResponse = await fetch('https://svtr.ai/api/update-user-locations');
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            console.log(`📈 当前用户统计:
- 总用户: ${statsData.data.totalUsers}
- 有地理位置: ${statsData.data.usersWithLocation}
- 有城市信息: ${statsData.data.usersWithCityInfo}
- 城市信息率: ${statsData.data.cityInfoRate}%`);
        }
        
        // 执行批量更新
        for (let i = 0; i < 3; i++) {
            console.log(`\n🔄 执行第 ${i + 1} 轮批量更新...`);
            
            const updateResponse = await fetch('https://svtr.ai/api/update-user-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_locations',
                    batchSize: 5
                })
            });
            
            const updateData = await updateResponse.json();
            
            if (updateData.success) {
                console.log(`✅ 第 ${i + 1} 轮完成: 更新${updateData.data.updated}个, 跳过${updateData.data.skipped}个`);
                
                if (updateData.data.updated === 0) {
                    console.log('🎉 所有可更新的用户已处理完毕');
                    break;
                }
            } else {
                console.error(`❌ 第 ${i + 1} 轮失败:`, updateData.message);
            }
            
            // 延迟避免API频率限制
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 获取最终统计
        const finalStatsResponse = await fetch('https://svtr.ai/api/update-user-locations');
        const finalStats = await finalStatsResponse.json();
        
        if (finalStats.success) {
            console.log(`\n📊 最终统计:
- 总用户: ${finalStats.data.totalUsers}
- 有地理位置: ${finalStats.data.usersWithLocation}
- 有城市信息: ${finalStats.data.usersWithCityInfo}
- 城市信息率: ${finalStats.data.cityInfoRate}%`);
        }
        
    } catch (error) {
        console.error('❌ 批量更新失败:', error);
    }
}

async function main() {
    console.log('🚀 开始强力更新用户城市信息...\n');
    
    // 1. 演示API能力
    await demonstrateCityQueries();
    
    // 2. 更新现有用户
    await updateExistingUsersWithCityInfo();
    
    console.log('\n✨ 城市信息更新任务完成！');
    console.log('💡 建议: 等待1-2分钟后刷新管理后台查看效果');
}

// 执行脚本
main().catch(console.error);