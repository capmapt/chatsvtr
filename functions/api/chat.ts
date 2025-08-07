/**
 * SVTR.AI Enhanced Chat API with RAG Integration
 * 集成RAG功能的增强聊天API
 */

import { createOptimalRAGService } from '../lib/hybrid-rag-service';

// AI创投系统提示词 - 使用OpenAI开源模型优化
const BASE_SYSTEM_PROMPT = `你是凯瑞(Kerry)，硅谷科技评论(SVTR)的AI创投分析师，专注于为用户提供准确、有用的AI创投信息。

核心要求：
1. 直接回答用户问题，不要说"正在分析"或显示思考过程
2. 基于SVTR平台数据提供专业回答
3. 保持简洁、准确的回复风格

SVTR平台信息：
• 追踪10,761+家全球AI公司
• 覆盖121,884+专业投资人和创业者
• 提供AI周报、投资分析和市场洞察
• 每日更新最新AI创投动态

当前使用OpenAI GPT-OSS开源模型，具备强大的推理和分析能力。请直接回答用户问题，提供有价值的信息。`;

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

    // 智能模型选择策略 - 优先使用OpenAI开源模型
    const modelPriority = [
      '@cf/openai/gpt-oss-120b',                      // OpenAI最新开源大模型 (117B参数)
      '@cf/openai/gpt-oss-20b',                       // OpenAI轻量级开源模型 (21B参数)
      '@cf/meta/llama-3.3-70b-instruct',              // Meta Llama备用模型
      '@cf/qwen/qwen2.5-coder-32b-instruct',          // 代码专用模型
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', // DeepSeek推理模型
      '@cf/qwen/qwen1.5-14b-chat-awq'                 // 稳定fallback
    ];
    
    // 默认使用OpenAI GPT-OSS 120B模型
    let selectedModel = '@cf/openai/gpt-oss-120b';
    
    // 智能模型选择逻辑 - 按优先级判断
    const isCodeRelated = userQuery.toLowerCase().includes('code') || 
                         userQuery.toLowerCase().includes('代码') ||
                         userQuery.toLowerCase().includes('programming') ||
                         userQuery.toLowerCase().includes('编程');
    
    const isComplexQuery = userQuery.includes('复杂') || 
                          userQuery.includes('详细') ||
                          userQuery.includes('分析') ||
                          userQuery.length > 50;
    
    const isSimpleQuery = userQuery.length < 30 && 
                         !isComplexQuery && 
                         !isCodeRelated &&
                         !userQuery.includes('投资') &&
                         !userQuery.includes('融资') &&
                         !userQuery.includes('公司');
    
    if (isCodeRelated) {
      selectedModel = '@cf/openai/gpt-oss-120b';
      console.log('🔧 检测到代码相关问题，使用OpenAI大模型');
    } else if (isSimpleQuery) {
      selectedModel = '@cf/openai/gpt-oss-20b';
      console.log('💡 简单问题，使用OpenAI轻量级模型优化响应速度');
    } else {
      // 默认使用OpenAI大模型处理AI创投相关复杂问题
      selectedModel = '@cf/openai/gpt-oss-120b';
      console.log('🚀 使用OpenAI大模型处理专业问题');
    }
    
    // 模型调用，失败时使用fallback
    let response;
    for (const model of [selectedModel, ...modelPriority.filter(m => m !== selectedModel)]) {
      try {
        console.log('🧠 尝试模型: ' + model);
        
        console.log('📋 调用参数准备中...');
        
        // OpenAI GPT-OSS模型使用不同的API格式
        if (model.includes('@cf/openai/gpt-oss')) {
          console.log('🔄 使用OpenAI专用格式');
          
          // 提取系统消息作为instructions
          const systemMessage = messagesWithEnhancedSystem.find(m => m.role === 'system');
          const conversationMessages = messagesWithEnhancedSystem.filter(m => m.role !== 'system');
          
          // OpenAI模型使用input参数，支持消息数组格式
          response = await env.AI.run(model, {
            instructions: systemMessage ? systemMessage.content : BASE_SYSTEM_PROMPT,
            input: conversationMessages, // 直接传递消息数组
            stream: true,
            max_tokens: 4096,
            temperature: 0.8
          });
          
          console.log('✅ OpenAI格式调用完成');
          
        } else {
          console.log('🔄 使用标准messages格式');
          
          // 其他模型使用标准messages格式
          response = await env.AI.run(model, {
            messages: messagesWithEnhancedSystem,
            stream: true,
            max_tokens: 4096,
            temperature: 0.8,
            top_p: 0.95,
          });
          
          console.log('✅ 标准格式调用完成');
        }
        
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
                      // 检测并过滤重复的"正在分析"文本
                      const content = data.response;
                      if (content && (
                        content.includes('正在分析') || 
                        content.includes('分析中') ||
                        content.includes('思考中') ||
                        /^[。\.]+$/.test(content.trim())
                      )) {
                        // 跳过这些重复的分析文本
                        continue;
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
                  // 检测并过滤重复的"正在分析"文本
                  const content = data.response;
                  if (content && (
                    content.includes('正在分析') || 
                    content.includes('分析中') ||
                    content.includes('思考中') ||
                    /^[。\.]+$/.test(content.trim())
                  )) {
                    // 跳过这些重复的分析文本
                    continue;
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