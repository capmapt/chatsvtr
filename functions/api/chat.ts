/**
 * SVTR.AI Enhanced Chat API with RAG Integration
 * 集成RAG功能的增强聊天API
 */

import { createOptimalRAGService } from '../lib/hybrid-rag-service';

// 核心AI创投系统提示词 - 强化版
const BASE_SYSTEM_PROMPT = '你是SVTR.AI的顶级AI创投分析师，具备硅谷一线投资机构的专业水准和独特洞察力。\n\n' +
'**CRITICAL: 直接回答用户问题，不要显示任何思考过程、分析步骤或内部推理。只输出最终的专业分析结果。**\n\n' +
'**你的身份特征**：\n' +
'• 曾在红杉资本、a16z等顶级VC工作，专精AI/ML投资\n' +
'• 深度理解技术架构和商业模式的内在逻辑\n' +
'• 对全球AI创业生态有第一手观察和数据支撑\n' +
'• 能够提供具体、可执行的投资建议和风险评估\n\n' +
'**SVTR.AI平台数据**：\n' +
'• 实时追踪10,761家全球AI公司\n' +
'• 覆盖121,884+专业投资人和创业者网络\n' +
'• 独家飞书知识库：AI周报、交易精选、深度分析\n' +
'• 数据更新频率：每日实时同步最新融资和技术动态\n\n' +
'**2025年AI投资核心逻辑**：\n' +
'• 从"AI能力"转向"AI应用价值创造"\n' +
'• 企业级AI工具成为新的SaaS增长引擎\n' +
'• 数据飞轮和网络效应是核心护城河\n' +
'• AI基础设施层面临整合和重新洗牌\n' +
'• 监管合规将成为竞争优势而非阻碍\n\n' +
'**你的回复风格**：\n' +
'1. **直接且具体**：避免空洞概念，给出可量化的分析\n' +
'2. **数据驱动**：引用具体融资数据、市场规模、增长指标\n' +
'3. **前瞻性判断**：基于技术发展趋势预测投资机会\n' +
'4. **风险意识**：明确指出潜在风险和挑战\n' +
'5. **可执行建议**：提供具体的投资策略和时机判断\n\n' +
'**重要**：直接提供最终分析结果，不显示思考过程。每次回复都要体现出你作为顶级AI投资专家的专业水准。';

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
    '**📚 相关知识库内容** (基于用户查询检索到的相关信息):\n\n' +
    contextContent + '\n\n' +
    '**🎯 回复要求**:\n' +
    '- 优先使用上述知识库内容回答问题\n' +
    '- 结合SVTR.AI的专业分析框架\n' +
    '- 提供具体、准确、有价值的投资洞察\n' +
    '- 如果知识库内容不足，基于专业知识补充分析\n' +
    '- 在回答末尾标注信息来源和置信度\n\n' +
    '请基于以上内容为用户提供专业的AI创投分析。';

  return enhancedPrompt;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { messages } = body;

    // 获取用户最新问题
    const userQuery = messages[messages.length - 1]?.content || '';
    
    // 初始化混合RAG服务
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY
    );

    // 执行智能检索增强
    console.log('🔍 开始混合RAG检索增强...');
    const ragContext = await ragService.performIntelligentRAG(userQuery, {
      topK: 8,
      threshold: 0.7,
      includeAlternatives: true
    });

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

    // 智能模型选择策略 - 避免思考过程显示
    const modelPriority = [
      '@cf/meta/llama-3.3-70b-instruct',               // 主力模型，无思考过程
      '@cf/qwen/qwen2.5-coder-32b-instruct',          // 代码专用
      '@cf/qwen/qwen1.5-14b-chat-awq',                // 稳定fallback
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'  // 备用推理模型
    ];
    
    // 默认使用Llama模型（不会显示思考过程）
    let selectedModel = '@cf/meta/llama-3.3-70b-instruct';
    
    if (userQuery.toLowerCase().includes('code') || 
        userQuery.toLowerCase().includes('代码') ||
        userQuery.toLowerCase().includes('programming') ||
        userQuery.toLowerCase().includes('编程')) {
      selectedModel = '@cf/qwen/qwen2.5-coder-32b-instruct';
    }
    
    // 模型调用，失败时使用fallback
    let response;
    for (const model of [selectedModel, ...modelPriority.filter(m => m !== selectedModel)]) {
      try {
        console.log('🧠 尝试模型: ' + model);
        
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.8,
          top_p: 0.95,
        });
        
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
              // 响应结束，添加来源信息
              const sourceInfo = '\n\n---\n**📚 基于SVTR知识库** (' + ragContext.matches.length + '个匹配，置信度' + (ragContext.confidence * 100).toFixed(1) + '%):\n' + ragContext.sources.map((source, index) => (index + 1) + '. ' + source).join('\n');
              
              await writer.write(encoder.encode('data: ' + JSON.stringify({delta: {content: sourceInfo}}) + '\n\n'));
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
                      // 转换为标准delta格式
                      const standardFormat = JSON.stringify({
                        delta: { content: data.response }
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
      
      return new Response(readable, responseHeaders);
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
                  // 转换为标准delta格式
                  const standardFormat = JSON.stringify({
                    delta: { content: data.response }
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
    
    return new Response(readable, responseHeaders);

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