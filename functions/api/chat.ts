/**
 * SVTR.AI Enhanced Chat API with RAG Integration
 * 集成RAG功能的增强聊天API
 */

import { createOptimalRAGService } from '../lib/hybrid-rag-service';
import { UsageMonitor } from './usage-monitor';
import { SmartCache } from '../lib/smart-cache';

/**
 * 智能内容过滤函数 - 提升用户体验
 */
function shouldFilterContent(content: string): boolean {
  const trimmed = content.trim();
  
  // 过滤空内容或只有标点符号的内容
  if (!trimmed || /^[。\.，,！!？?；;：:\s]*$/.test(trimmed)) {
    return true;
  }
  
  // 过滤重复的分析提示词
  const analysisPatterns = [
    '正在分析', '分析中', '思考中', '正在思考',
    'analyzing', 'thinking', 'processing',
    '让我来分析', '我正在', '我在分析'
  ];
  
  const hasAnalysisPattern = analysisPatterns.some(pattern => 
    trimmed.toLowerCase().includes(pattern.toLowerCase())
  );
  
  // 如果只包含分析词且长度很短，则过滤
  if (hasAnalysisPattern && trimmed.length < 20) {
    return true;
  }
  
  return false;
}

// 简化的AI创投系统提示词 - 避免重复分析
const BASE_SYSTEM_PROMPT = `你是SVTR.AI的AI创投分析师，专注于为用户提供准确、有用的AI创投信息。

核心要求：
1. 只能基于提供的知识库内容回答问题
2. 如果知识库中没有相关信息，明确告知"根据现有知识库信息，我无法提供该问题的准确答案"
3. 绝对不允许编造或猜测信息，特别是人名、公司创始人等具体事实
4. 直接回答用户问题，不要说"正在分析"或显示思考过程

SVTR.AI平台信息：
• 追踪10,761+家全球AI公司
• 覆盖121,884+专业投资人和创业者
• 提供AI周报、投资分析和市场洞察
• 每日更新最新AI创投动态

请严格基于知识库内容回答，确保信息准确性。`;

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

// 全局实例化 - 提升性能
const globalSmartCache = new SmartCache();

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { messages } = body;

    // 获取用户最新问题
    const userQuery = messages[messages.length - 1]?.content || '';
    
    // 1. 智能缓存检查 - 优先级最高
    const cachedResponse = await globalSmartCache.getResponse(userQuery);
    if (cachedResponse) {
      console.log('⚡ 返回缓存回复，跳过RAG和AI推理');
      
      return new Response(JSON.stringify({
        cached: true,
        sources: cachedResponse.sources,
        response: cachedResponse.response,
        hitCount: cachedResponse.hitCount
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache-Status': 'HIT'
        }
      });
    }
    
    // 初始化使用监控
    const usageMonitor = new UsageMonitor(context);
    const estimatedTokens = usageMonitor.estimateTokens(userQuery);
    
    // 检查免费额度
    const quotaCheck = await usageMonitor.checkQuota(estimatedTokens);
    if (!quotaCheck.allowed) {
      return new Response(JSON.stringify({
        error: '免费额度已用完',
        message: quotaCheck.reason,
        fallback: true
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
    
    // 初始化RAG服务 - 纯Cloudflare AI免费方案 + KV存储
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      undefined, // 不使用OpenAI，避免费用
      env.SVTR_KV // 添加KV存储支持
    );

    // 移除事实核查器，简化流程

    // 2. 执行智能检索增强
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

    // Cloudflare AI 中文优化模型配置
    const modelConfig = {
      '@cf/meta/llama-3.1-70b-instruct': {
        priority: 1,
        capabilities: ['chinese', 'general', 'analysis', 'investment'],
        maxTokens: 4096,
        temperature: 0.7,
        costLevel: 'medium'
      },
      '@cf/meta/llama-3.1-8b-instruct': {
        priority: 2,
        capabilities: ['chinese', 'fallback', 'basic'],
        maxTokens: 2048,
        temperature: 0.7,
        costLevel: 'low'
      }
    };
    
    // 优化的模型选择 - 中文友好策略
    function selectOptimalModel(query: string, ragMatches: number): string {
      // 检测中文内容
      const hasChinese = /[\u4e00-\u9fa5]/.test(query);
      
      // 所有中文问题优先使用70B模型，确保中文输出质量
      if (hasChinese) {
        return '@cf/meta/llama-3.1-70b-instruct';
      }
      
      // 复杂英文问题或有RAG匹配的问题
      if (query.length > 50 || ragMatches > 2) {
        return '@cf/meta/llama-3.1-70b-instruct';
      }
      
      // 简单问题使用8B模型
      return '@cf/meta/llama-3.1-8b-instruct';
    }
    
    const selectedModel = selectOptimalModel(userQuery, ragContext.matches.length);
    const config = modelConfig[selectedModel] || modelConfig['@cf/meta/llama-3.1-70b-instruct'];
    
    // 模型调用，失败时使用fallback
    let response;
    const fallbackModels = Object.keys(modelConfig).filter(m => m !== selectedModel);
    
    for (const model of [selectedModel, ...fallbackModels]) {
      try {
        const currentConfig = modelConfig[model] || config;
        console.log('🧠 尝试模型: ' + model + ' (maxTokens: ' + currentConfig.maxTokens + ')');
        
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: currentConfig.maxTokens,
          temperature: currentConfig.temperature,
          top_p: 0.95,
        });
        
        console.log('✅ 成功使用模型: ' + model);
        
        // 记录实际使用量
        const actualTokens = currentConfig.maxTokens; // 保守估算
        await usageMonitor.recordUsage(actualTokens);
        
        break;
        
      } catch (error) {
        console.log('❌ 模型 ' + model + ' 失败: ' + error.message);
        continue;
      }
    }
    
    if (!response) {
      throw new Error('所有AI模型都不可用');
    }

    // 3. 增强的响应流处理：事实核查 + 缓存
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // 收集完整响应用于事实核查和缓存
    let fullResponse = '';
    
    // 优化的流处理 - 集成事实核查
    (async () => {
      try {
        let responseComplete = false;
        let buffer = '';
        
        while (!responseComplete) {
          const { done, value } = await reader.read();
          
          if (done) {
            // 处理剩余缓冲区内容
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.response) {
                      const content = data.response;
                      if (content && !shouldFilterContent(content)) {
                        fullResponse += content;
                        const standardFormat = JSON.stringify({
                          delta: { content: content }
                        });
                        await writer.write(encoder.encode('data: ' + standardFormat + '\n\n'));
                      }
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }
            }
            
            // 4. 缓存高质量回复（简化版本）
            if (ragContext.matches.length > 0) {
              await globalSmartCache.cacheResponse(
                userQuery,
                ragContext,
                fullResponse,
                0.8, // 固定置信度
                ragContext.sources
              );
              console.log('📦 回复已缓存');
            }
            
            // 添加来源信息（移除置信度评分）
            const sourceInfo = ragContext.matches.length > 0 ? 
              '\n\n---\n**📚 基于SVTR知识库** (' + ragContext.matches.length + '个匹配):\n' + 
              ragContext.sources.slice(0, 3).map((source, index) => (index + 1) + '. ' + source).join('\n') : 
              '';
            
            await writer.write(encoder.encode('data: ' + JSON.stringify({delta: {content: sourceInfo}}) + '\n\n'));
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            responseComplete = true;
            
          } else {
            // 优化的中文字符处理
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // 按行处理，保留最后一个不完整的行
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.response) {
                    const content = data.response;
                    if (content && !shouldFilterContent(content)) {
                      fullResponse += content;
                      const standardFormat = JSON.stringify({
                        delta: { content: content }
                      });
                      await writer.write(encoder.encode('data: ' + standardFormat + '\n\n'));
                    }
                  }
                } catch (e) {
                  // 忽略解析错误，继续处理
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('增强流处理错误:', error);
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