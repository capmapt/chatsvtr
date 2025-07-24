#!/usr/bin/env node

/**
 * 测试Cloudflare AI模型是否真的被调用
 */

console.log('🧪 测试SVTR.AI聊天API是否真的调用Cloudflare AI模型...\n');

async function testChatAPI() {
    try {
        console.log('📡 发送请求到 http://localhost:3000/api/chat');
        
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: 'Anthropic的投资情况如何？详细分析一下这家公司。' }
                ]
            })
        });

        console.log('📊 响应状态:', response.status);
        console.log('📊 响应头:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('\n🤖 AI响应内容:');
        console.log('=' .repeat(80));

        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            // 处理流式响应
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.response) {
                                process.stdout.write(data.response);
                                fullResponse += data.response;
                            } else if (data.delta?.content) {
                                process.stdout.write(data.delta.content);
                                fullResponse += data.delta.content;
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }

            console.log('\n' + '=' .repeat(80));
            console.log('\n✅ 测试结果分析:');
            
            // 分析响应特征
            const hasSpecificData = fullResponse.includes('60亿美元') || 
                                  fullResponse.includes('Anthropic') || 
                                  fullResponse.includes('投资');
            
            const hasAICharacteristics = fullResponse.length > 100 && 
                                       (fullResponse.includes('分析') || 
                                        fullResponse.includes('建议') ||
                                        fullResponse.includes('评估'));

            const hasRAGInfo = fullResponse.includes('基于SVTR知识库') ||
                              fullResponse.includes('飞书知识库') ||
                              fullResponse.includes('置信度');

            console.log(`📊 响应长度: ${fullResponse.length} 字符`);
            console.log(`🎯 包含具体数据: ${hasSpecificData ? '✅' : '❌'}`);
            console.log(`🤖 具备AI特征: ${hasAICharacteristics ? '✅' : '❌'}`);
            console.log(`📚 显示RAG信息: ${hasRAGInfo ? '✅' : '❌'}`);

            if (hasSpecificData && hasAICharacteristics) {
                console.log('\n🎉 确认：AI模型正在正常工作！');
            } else {
                console.log('\n⚠️  可能问题：响应似乎不是来自真正的AI模型');
            }

        } else {
            // 处理JSON响应
            const data = await response.json();
            console.log(JSON.stringify(data, null, 2));
            
            if (data.error || data.fallback) {
                console.log('\n❌ 检测到：系统回退到演示模式，未调用AI模型');
            }
        }

    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        
        if (error.message.includes('Failed to fetch') || error.code === 'ECONNREFUSED') {
            console.log('\n💡 建议：请确保开发服务器正在运行 (npm run dev)');
        }
    }
}

// 执行测试
testChatAPI();