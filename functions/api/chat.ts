/**
 * SVTR.AI Enhanced Chat API with RAG Integration
 * 集成RAG功能的增强聊天API
 */

import { createOptimalRAGService } from '../lib/hybrid-rag-service';

// AI创投系统提示词 - 强化结构化输出
const BASE_SYSTEM_PROMPT = `你是凯瑞(Kerry)，硅谷科技评论(SVTR)的AI创投分析师，专注于为用户提供准确、有用的AI创投信息。

核心要求：
1. 直接回答用户问题，不要说"正在分析"或显示思考过程
2. 基于SVTR平台数据和最新网络信息提供专业回答
3. **使用结构化格式输出，提升专业性和可读性**

输出格式要求：
• 对于数值查询（估值、融资等）：提供具体数字和时间节点
• 对于趋势分析：使用要点列表或表格形式
• 对于公司对比：提供对比表格或分点说明
• 包含数据来源说明和时间范围
• 重要信息用**粗体**标注，关键数字突出显示

SVTR平台信息：
• 追踪10,761+家全球AI公司
• 覆盖121,884+专业投资人和创业者
• 提供AI周报、投资分析和市场洞察
• 每日更新最新AI创投动态
• 创始人：Min Liu (Allen)

专业回复模板：
对于估值/融资查询，请按以下格式回复：
**最新估值概览**
1. **XXX亿美元** — 已确认的最新估值
2. 融资时间：XXXX年XX月
3. 投资方：主要投资机构名单
4. 估值变化：与上轮对比情况

联系方式引导：
当用户询问投资机会、融资需求、项目对接、商业合作等敏感信息时，引导添加凯瑞微信：pkcapital2023，获得专业一对一服务。

使用最先进的AI模型和实时数据，确保信息准确性和时效性。请提供结构化、专业的回复。`;

/**
 * 生成增强的系统提示词
 */
function generateEnhancedPrompt(basePrompt: string, ragContext: any): string {
  if (!ragContext.matches || ragContext.matches.length === 0) {
    return basePrompt;
  }

  const contextContent = ragContext.matches
    .map((match: any, index: number) => {
      const title = match.title || '知识点';
      const content = match.content || match.metadata?.content || '';
      return (index + 1) + '. **' + title + '**:\n' + content;
    })
    .join('\n\n');

  const enhancedPrompt = basePrompt + '\n\n' +
    '参考知识库内容:\n' +
    contextContent + '\n\n' +
    '请基于以上知识库内容直接回答用户问题。';

  return enhancedPrompt;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { messages } = body;

    // 获取或生成临时会话ID（无需用户注册）
    const sessionId = request.headers.get('x-session-id') || 
                     request.headers.get('cf-ray') || 
                     `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 获取用户最新问题
    const userQuery = messages[messages.length - 1]?.content || '';
    
    // KV缓存检查 - RAG查询缓存（无需用户身份）  
    const queryBytes = new TextEncoder().encode(userQuery);
    const cacheKey = `rag:${btoa(String.fromCharCode(...queryBytes)).substring(0, 32)}`;
    let ragContext;
    
    if (env.SVTR_CACHE) {
      try {
        const cachedRAG = await env.SVTR_CACHE.get(cacheKey);
        if (cachedRAG) {
          ragContext = JSON.parse(cachedRAG);
          console.log('🎯 使用缓存的RAG结果');
        }
      } catch (cacheError) {
        console.log('⚠️ RAG缓存读取失败:', cacheError.message);
      }
    }
    
    // 初始化混合RAG服务
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY
    );

    // 执行智能检索增强（如果没有缓存）
    if (!ragContext) {
      console.log('🔍 开始混合RAG检索增强...');
      ragContext = await ragService.performIntelligentRAG(userQuery, {
        topK: 8,
        threshold: 0.7,
        includeAlternatives: true
      });
      
      // 缓存RAG结果（24小时有效期）
      if (env.SVTR_CACHE && ragContext.matches.length > 0) {
        try {
          await env.SVTR_CACHE.put(cacheKey, JSON.stringify(ragContext), {
            expirationTtl: 24 * 60 * 60 // 24小时
          });
          console.log('💾 RAG结果已缓存');
        } catch (cacheError) {
          console.log('⚠️ RAG缓存写入失败:', cacheError.message);
        }
      }
    }

    // 生成增强提示词
    const enhancedSystemPrompt = generateEnhancedPrompt(
      BASE_SYSTEM_PROMPT, 
      ragContext
    );

    // 构建消息历史，包含增强的系统提示词
    const messagesWithEnhancedSystem = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages
    ];

    console.log('🤖 使用增强提示词 (' + ragContext.matches.length + ' 个知识匹配)');

    // 响应头 - 确保流式响应格式
    const responseHeaders = new Headers({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Accel-Buffering': 'no',
    });

    // 智能模型选择策略 - 修复数字显示问题，使用数字输出稳定的模型
    const modelPriority = [
      '@cf/meta/llama-3.1-8b-instruct',               // Meta Llama 3.1稳定模型 (数字输出正常)
      '@cf/qwen/qwen1.5-14b-chat-awq',                // Qwen 1.5稳定版本 (数字处理良好)
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', // DeepSeek推理模型
      '@cf/meta/llama-3.3-70b-instruct',              // Meta Llama 3.3 (可能不存在)
      '@cf/qwen/qwen2.5-coder-32b-instruct',          // Qwen代码模型 (数字输出异常)
      '@cf/openai/gpt-oss-120b'                       // OpenAI开源模型 (数字输出异常)
    ];
    
    // 默认使用Llama 3.1模型（数字输出稳定且可用）
    let selectedModel = '@cf/meta/llama-3.1-8b-instruct';
    
    // SVTR业务导向的智能模型选择策略
    const query = userQuery.toLowerCase();
    
    // 1. AI创投数据分析场景 - 需要准确数字和专业分析
    const isInvestmentAnalysis = query.includes('投资') || query.includes('融资') || 
                                query.includes('估值') || query.includes('轮次') ||
                                query.includes('亿') || query.includes('万') || query.includes('$') ||
                                query.includes('独角兽') || query.includes('ipo') ||
                                query.includes('上市') || query.includes('收购');
    
    // 2. 公司研究和市场分析 - 需要深度推理能力
    const isCompanyResearch = query.includes('公司') || query.includes('startup') ||
                             query.includes('创业') || query.includes('团队') ||
                             query.includes('ceo') || query.includes('创始人') ||
                             query.includes('商业模式') || query.includes('竞争');
    
    // 3. 技术和产品分析 - 代码和技术相关
    const isTechAnalysis = query.includes('技术') || query.includes('ai模型') ||
                          query.includes('算法') || query.includes('开源') ||
                          query.includes('代码') || query.includes('programming') ||
                          query.includes('api') || query.includes('github');
    
    // 4. 行业趋势和宏观分析 - 需要综合推理
    const isTrendAnalysis = query.includes('趋势') || query.includes('发展') ||
                           query.includes('未来') || query.includes('预测') ||
                           query.includes('市场') || query.includes('行业') ||
                           query.includes('报告') || query.includes('分析');
    
    // 5. 简单咨询和FAQ
    const isSimpleQuery = query.length < 30 && 
                         !isInvestmentAnalysis && !isCompanyResearch && 
                         !isTechAnalysis && !isTrendAnalysis;
    
    // 智能模型分配策略
    if (isInvestmentAnalysis) {
      // 投资分析优先数字稳定性，使用Llama 3.1
      selectedModel = '@cf/meta/llama-3.1-8b-instruct';
      console.log('💰 投资分析场景，使用Llama 3.1（数字输出稳定）');
    } else if (isTechAnalysis) {
      // 技术分析使用Qwen，代码理解能力强
      selectedModel = '@cf/qwen/qwen1.5-14b-chat-awq';
      console.log('🔧 技术分析场景，使用Qwen 1.5（技术理解优秀）');
    } else if (isCompanyResearch || isTrendAnalysis) {
      // 复杂分析使用DeepSeek，推理能力强
      selectedModel = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
      console.log('📊 深度分析场景，使用DeepSeek R1（推理能力强）');
    } else if (isSimpleQuery) {
      // 简单查询使用Llama 3.1，响应快且稳定
      selectedModel = '@cf/meta/llama-3.1-8b-instruct';
      console.log('💡 简单咨询，使用Llama 3.1（响应迅速）');
    } else {
      // 默认场景使用Llama 3.1，平衡性能和稳定性
      selectedModel = '@cf/meta/llama-3.1-8b-instruct';
      console.log('🚀 默认场景，使用Llama 3.1（综合表现最佳）');
    }
    
    // 模型调用，失败时使用fallback
    let response;
    for (const model of [selectedModel, ...modelPriority.filter(m => m !== selectedModel)]) {
      try {
        console.log('🧠 尝试模型: ' + model + ' (通过AI Gateway监控)');
        
        console.log('📋 调用参数准备中...');
        
        console.log('🔄 使用标准messages格式');
        
        // 所有模型统一使用标准messages格式，AI Gateway自动监控
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.7,  // 降低temperature提高数字输出稳定性
          top_p: 0.95
        });
        
        console.log('✅ 标准格式调用完成，模型: ' + model);
        
        console.log('✅ 成功使用模型: ' + model);
        break;
        
      } catch (error) {
        console.log('❌ 模型 ' + model + ' 失败: ' + error.message);
        continue;
      }
    }
    
    if (!response) {
      throw new Error('所有AI模型都不可用');
    }

    // 保存会话上下文（可选，用于对话连贯性）
    if (env.SVTR_SESSIONS) {
      try {
        const sessionData = {
          query: userQuery,
          timestamp: Date.now(),
          ragMatches: ragContext.matches.length
        };
        await env.SVTR_SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionData), {
          expirationTtl: 2 * 60 * 60 // 2小时会话有效期
        });
      } catch (sessionError) {
        console.log('⚠️ 会话保存失败:', sessionError.message);
      }
    }

    // 如果有RAG匹配，在响应流中注入来源信息
    if (ragContext.matches.length > 0) {
      // 创建自定义响应流，转换为标准流式格式
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = response.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      
      // 开始流处理
      (async () => {
        try {
          let responseComplete = false;
          
          while (!responseComplete) {
            const { done, value } = await reader.read();
            
            if (done) {
              // 响应结束，添加增强的来源信息 - GPT-5风格
              const webSources = ragContext.matches.filter(m => m.source === 'web_search');
              const knowledgeSources = ragContext.matches.filter(m => m.source !== 'web_search');
              
              let sourceInfo = '\n\n---\n';
              
              // 如果有网络搜索结果，优先展示
              if (webSources.length > 0) {
                sourceInfo += '**🌐 实时数据来源**\n';
                webSources.forEach((source, index) => {
                  sourceInfo += `${index + 1}. **${source.title || '最新报道'}**`;
                  if (source.publishDate) {
                    sourceInfo += ` (${source.publishDate})`;
                  }
                  if (source.url) {
                    sourceInfo += ` - [查看原文](${source.url})`;
                  }
                  sourceInfo += '\n';
                });
                sourceInfo += '\n';
              }
              
              // SVTR知识库来源
              if (knowledgeSources.length > 0) {
                sourceInfo += '**📚 SVTR知识库** (';
                sourceInfo += knowledgeSources.length + '个匹配，置信度' + (ragContext.confidence * 100).toFixed(1) + '%)\n';
                ragContext.sources.slice(0, 5).forEach((source, index) => {
                  sourceInfo += `${index + 1}. ${source}\n`;
                });
              }
              
              // 数据质量标识
              if (ragContext.fromCache) {
                sourceInfo += '\n*⚡ 缓存加速响应*';
              }
              if (ragContext.isRealtime) {
                sourceInfo += '\n*🔄 包含实时网络数据*';
              }
              
              // 使用与响应内容相同的格式发送来源信息
              const sourceFormat = JSON.stringify({
                response: sourceInfo
              });
              await writer.write(encoder.encode('data: ' + sourceFormat + '\n\n'));
              await writer.write(encoder.encode('data: [DONE]\n\n'));
              responseComplete = true;
            } else {
              // 解析Cloudflare AI响应并转换为标准格式
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.response) {
                      // 数字输出调试 - 详细记录AI响应
                      const content = data.response;
                      const hasNumbers = /\d/.test(content);
                      if (hasNumbers) {
                        const numbers = content.match(/\d+/g) || [];
                        console.log('🔢 AI模型输出包含数字:', content);
                        console.log('🔢 提取到的数字:', numbers.join(', '));
                      } else if (content && content.length > 5) {
                        console.log('⚠️ AI模型输出不含数字 (长度' + content.length + '):', content.substring(0, 50) + '...');
                      }
                      
                      // 转换为前端期望的格式
                      const standardFormat = JSON.stringify({
                        response: content
                      });
                      await writer.write(encoder.encode('data: ' + standardFormat + '\n\n'));
                    }
                  } catch (e) {
                    // 如果解析失败，直接转发原始数据
                    await writer.write(value);
                  }
                } else if (line.includes('[DONE]')) {
                  // 不要转发原始的[DONE]，我们会在最后添加
                  continue;
                } else if (line.trim()) {
                  await writer.write(encoder.encode(line + '\n'));
                }
              }
            }
          }
        } catch (error) {
          console.error('流处理错误:', error);
        } finally {
          await writer.close();
        }
      })();
      
      return new Response(readable, {
      headers: responseHeaders
    });
    }

    // 没有RAG匹配，转换为标准格式后返回
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // 转换响应格式
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            break;
          }
          
          // 解析Cloudflare AI响应并转换为标准格式
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && !line.includes('[DONE]')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.response) {
                  // 数字输出调试 - 详细记录AI响应（无RAG版本）
                  const content = data.response;
                  const hasNumbers = /\d/.test(content);
                  if (hasNumbers) {
                    const numbers = content.match(/\d+/g) || [];
                    console.log('🔢 AI模型输出包含数字:', content);
                    console.log('🔢 提取到的数字:', numbers.join(', '));
                  } else if (content && content.length > 5) {
                    console.log('⚠️ AI模型输出不含数字 (长度' + content.length + '):', content.substring(0, 50) + '...');
                  }
                  
                  // 转换为前端期望的格式
                  const standardFormat = JSON.stringify({
                    response: content
                  });
                  await writer.write(encoder.encode('data: ' + standardFormat + '\n\n'));
                }
              } catch (e) {
                // 如果解析失败，直接转发原始数据
                await writer.write(value);
              }
            } else if (!line.includes('[DONE]') && line.trim()) {
              await writer.write(encoder.encode(line + '\n'));
            }
          }
        }
      } catch (error) {
        console.error('流格式转换错误:', error);
      } finally {
        await writer.close();
      }
    })();
    
    return new Response(readable, {
      headers: responseHeaders
    });

  } catch (error) {
    console.error('Enhanced Chat API Error:', error);
    
    // 错误时回退到基础模式
    return new Response(JSON.stringify({ 
      error: 'AI服务暂时不可用',
      message: '正在尝试恢复RAG增强功能，请稍后重试',
      fallback: true
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}