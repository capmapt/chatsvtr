/**
 * SVTR.AI Enhanced Chat API with RAG Integration
 * 集成RAG功能的增强聊天API
 */

import { createOptimalRAGService } from '../lib/hybrid-rag-service';

// SVTR AI创投库查询助手 - 简洁的系统指令
const BASE_SYSTEM_PROMPT = `你是SVTR AI创投库的专业数据查询助手。

核心原则：
1. 仅基于提供的知识库内容回答，禁止编造、推测或补充未在知识库中的信息
2. 数据不足时明确说明，使用"SVTR知识库中暂无相关数据"等表述  
3. 所有数字必须来源于知识库，不得估算或推测任何数值
4. 保持客观中立，提供数据事实，避免主观分析判断

回答要求：
- 准确性优先于完整性
- 承认数据局限性，不过度自信
- 当知识库中没有相关信息时，明确回复"SVTR知识库中暂无该信息"
- 当信息不完整时，说明"据现有数据显示"
- 当需要推测时，明确表示"无法基于现有数据确认"

严格基于SVTR AI创投库提供的知识内容，给出准确、客观的数据回复。`;

/**
 * 判断是否需要显示来源信息
 */
function shouldShowSourceInfo(query: string, ragContext: any): boolean {
  const lowerQuery = query.toLowerCase();
  
  // 触发条件1: 明确询问数据来源
  const sourceKeywords = ['数据来源', '来源', 'source', '从哪', '哪里来', '基于什么'];
  const asksAboutSource = sourceKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // 触发条件2: 询问具体数据（估值、融资等敏感信息）
  const dataKeywords = ['估值', '融资', '投资', '轮次', '多少', '数据', '最新', '价格', '股价'];
  const asksAboutData = dataKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // 触发条件3: 商业相关询问
  const businessKeywords = ['合作', '联系', '咨询', '服务', '项目', '对接', '投资机会'];
  const asksAboutBusiness = businessKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // 触发条件4: 有实时搜索数据
  const hasRealTimeData = ragContext.matches.some(m => m.source === 'web_search' || m.source === 'DuckDuckGo');
  
  // 满足任一条件就显示来源信息
  return asksAboutSource || asksAboutData || asksAboutBusiness || hasRealTimeData;
}

/**
 * 判断是否为商业咨询询问
 */
function isBusinessInquiry(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  const businessKeywords = [
    // 投资相关
    '投资机会', '融资', '项目对接', '合作', '咨询',
    // 交易相关  
    '交易', '并购', '收购', '估值', '尽调',
    // 服务相关
    '服务', '联系', '商务', '业务', '客户'
  ];
  
  return businessKeywords.some(keyword => lowerQuery.includes(keyword));
}

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
    
    // 初始化混合RAG服务 - 传递request上下文解决文件路径问题
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY,
      env.SVTR_CACHE,
      null,
      request
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
    
    // SVTR业务导向的智能模型选择策略 - 优化思考展示
    const query = userQuery.toLowerCase();
    
    // 1. 公司深度分析场景 - 需要思考过程和推理能力（优先级最高）
    const isCompanyAnalysis = query.includes('公司') || query.includes('startup') ||
                             query.includes('创业') || query.includes('团队') ||
                             query.includes('ceo') || query.includes('创始人') ||
                             query.includes('商业模式') || query.includes('竞争') ||
                             query.includes('分析') || query.includes('怎么样') ||
                             query.includes('如何看待') || query.includes('评价');
    
    // 2. AI创投数据查询场景 - 需要准确数字
    const isDataQuery = query.includes('投资') || query.includes('融资') || 
                        query.includes('估值') || query.includes('轮次') ||
                        query.includes('亿') || query.includes('万') || query.includes('$') ||
                        query.includes('独角兽') || query.includes('ipo') ||
                        query.includes('上市') || query.includes('收购') ||
                        query.includes('多少') || query.includes('最新');
    
    // 3. 技术产品分析 - 技术理解能力
    const isTechAnalysis = query.includes('技术') || query.includes('ai模型') ||
                          query.includes('算法') || query.includes('开源') ||
                          query.includes('代码') || query.includes('api');
    
    // 4. 市场趋势分析 - 综合推理
    const isTrendAnalysis = query.includes('趋势') || query.includes('发展') ||
                           query.includes('未来') || query.includes('预测') ||
                           query.includes('市场') || query.includes('行业');
    
    // 5. 简单查询
    const isSimpleQuery = query.length < 20 && !isCompanyAnalysis && !isDataQuery;
    
    // 智能模型分配策略 - 优先事实准确性，避免编造
    if (isDataQuery) {
      // 数据查询最优先准确性，避免编造数字
      selectedModel = '@cf/meta/llama-3.1-8b-instruct';
      console.log('💰 数据查询场景，使用Llama 3.1（数字输出最稳定，避免编造）');
    } else if (isSimpleQuery) {
      // 简单查询使用最稳定模型
      selectedModel = '@cf/meta/llama-3.1-8b-instruct';
      console.log('💡 简单查询，使用Llama 3.1（保守稳定，避免过度发挥）');
    } else if (isTechAnalysis) {
      // 技术分析使用Qwen，但降低创造性
      selectedModel = '@cf/qwen/qwen1.5-14b-chat-awq';
      console.log('🔧 技术分析场景，使用Qwen 1.5（技术理解能力强但保守）');
    } else if (isCompanyAnalysis || isTrendAnalysis) {
      // 分析场景谨慎使用推理模型，但已通过prompt严格约束
      selectedModel = '@cf/meta/llama-3.1-8b-instruct'; // 改为保守模型
      console.log('🏢 分析场景，使用Llama 3.1（避免过度推理和编造）');
    } else {
      // 默认使用最保守的模型，避免编造
      selectedModel = '@cf/meta/llama-3.1-8b-instruct';
      console.log('🚀 默认场景，使用Llama 3.1（最保守稳定，严格基于数据）');
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
          temperature: 0.1,  // 极低temperature确保事实性，避免编造
          top_p: 0.8  // 降低top_p提高确定性
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

    // 智能判断是否需要显示来源信息
    const shouldShow = shouldShowSourceInfo(userQuery, ragContext);
    
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
            // 响应结束，根据条件添加来源信息
            if (ragContext.matches.length > 0 && shouldShow) {
              const hasRealTimeData = ragContext.matches.some(m => m.source === 'web_search' || m.source === 'DuckDuckGo');
              const isBusiness = isBusinessInquiry(userQuery);
              
              let sourceInfo = '\n\n---\n';
              
              // 数据来源信息
              if (hasRealTimeData) {
                sourceInfo += '**🌐 数据来源：SVTR AI创投库 + 实时搜索**\n';
              } else {
                sourceInfo += '**📊 数据来源：SVTR AI创投库**\n';
              }
              
              // 数据规模信息
              sourceInfo += `追踪10,761+家全球AI公司数据\n`;
              
              // 商业咨询引导（仅在相关询问时显示）
              if (isBusiness) {
                sourceInfo += '\n**💼 投资交易咨询**\n';
                sourceInfo += '联系凯瑞微信：**pkcapital2023**';
              }
              
              // 使用与响应内容相同的格式发送来源信息
              const sourceFormat = JSON.stringify({
                response: sourceInfo
              });
              await writer.write(encoder.encode('data: ' + sourceFormat + '\n\n'));
            }
            
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