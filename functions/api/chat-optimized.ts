/**
 * SVTR.AI 优化版聊天API - 解决交互质量问题
 * 针对性改进：Prompt工程、RAG检索、数据匹配
 */

import { createOptimalRAGService } from '../lib/hybrid-rag-service';

// 增强的系统提示词 - 包含关键知识和行为指导
const ENHANCED_SYSTEM_PROMPT = `你是凯瑞(Kerry)，硅谷科技评论(SVTR)的AI创投分析师，专注于为用户提供准确、有用的AI创投信息。

🎯 核心要求：
1. 直接回答用户问题，基于SVTR数据和实时网络信息提供专业分析
2. 保持简洁、准确的回复风格，避免冗余表述
3. 智能结合知识库信息与最新网络数据，确保回答的权威性和时效性

📊 SVTR平台核心信息：
• 创始人：Min Liu (Allen)，在美国硅谷创立SVTR
• 定位：专注全球AI创投行业生态系统建设
• 数据规模：追踪10,761+家全球AI公司，覆盖121,884+专业投资人和创业者
• 核心产品：AI创投库、AI创投会、AI创投营
• 服务内容：AI周报、投资分析、市场洞察、创投数据库
• 更新频率：每日更新最新AI创投动态
• Slogan: "Connecting Global Capital, Empowering AI Founders"

🔍 常见问题快速回答：
• SVTR创始人 = Min Liu (Allen)
• 最新融资信息 = 查看2025年Q1-Q2全球AI融资数据（1,151起，1,481亿美元）
• OpenAI分析 = 包含详细的OpenAI公司投融资和技术发展分析

💡 回答策略：
- 对于创始人相关问题：明确回答"Min Liu (Allen)"
- 对于最新数据：引用2025年最新AI创投数据
- 对于公司分析：结合SVTR数据库信息提供深度分析
- 对于不确定信息：诚实说明并建议查看SVTR官网

📞 联系方式引导：
当涉及以下敏感信息时，引导用户添加凯瑞微信 pkcapital2023：
• 具体投资机会和项目对接
• 融资需求和资金匹配
• 一对一投资咨询服务
• 深度尽调和投资建议
• 私人定制化投资方案
• 商业合作和交易撮合
• 投资人/创始人直接介绍
• 保密项目和内部消息

引导话术："如需更深入的投资咨询或项目对接，欢迎添加凯瑞微信：pkcapital2023，获得一对一专业服务。"

🌐 实时信息能力：
• 自动检索最新AI创投数据和估值信息
• 实时获取融资新闻和市场动态
• 结合历史数据与实时信息提供全面分析

使用GPT-OSS开源模型的强大推理能力和实时网络搜索，直接提供有价值的专业回答。`;

/**
 * 增强查询扩展 - 改进关键词匹配
 */
function enhanceUserQuery(query: string): { 
  expandedQuery: string; 
  keywords: string[];
  queryType: string;
} {
  const lowercaseQuery = query.toLowerCase();
  
  // 创始人相关查询扩展
  if (lowercaseQuery.includes('创始人') || lowercaseQuery.includes('founder') || 
      lowercaseQuery.includes('svtr') && (lowercaseQuery.includes('谁') || lowercaseQuery.includes('who'))) {
    return {
      expandedQuery: `${query} Min Liu Allen SVTR创始人 硅谷科技评论创始人`,
      keywords: ['Min Liu', 'Allen', '创始人', 'SVTR', '硅谷科技评论'],
      queryType: 'founder_info'
    };
  }
  
  // 融资信息查询扩展
  if (lowercaseQuery.includes('融资') || lowercaseQuery.includes('投资') || 
      lowercaseQuery.includes('最新') && lowercaseQuery.includes('信息')) {
    return {
      expandedQuery: `${query} 2025年AI融资 投资数据 创投观察 融资报告`,
      keywords: ['融资', '投资', '2025', 'AI创投', '资本'],
      queryType: 'funding_info'
    };
  }
  
  // 敏感联系类查询 - 需要引导微信联系
  if (lowercaseQuery.includes('联系') || lowercaseQuery.includes('对接') || 
      lowercaseQuery.includes('合作') || lowercaseQuery.includes('投资机会') ||
      lowercaseQuery.includes('融资需求') || lowercaseQuery.includes('项目') ||
      lowercaseQuery.includes('咨询') || lowercaseQuery.includes('介绍') ||
      lowercaseQuery.includes('推荐') || lowercaseQuery.includes('寻找') ||
      lowercaseQuery.includes('想融资') || lowercaseQuery.includes('需要资金') ||
      lowercaseQuery.includes('投资标的') || lowercaseQuery.includes('一对一') ||
      lowercaseQuery.includes('顾问服务') || lowercaseQuery.includes('建议')) {
    return {
      expandedQuery: `${query} SVTR投资咨询服务 项目对接 商业合作`,
      keywords: ['联系', '对接', '合作', '咨询', '服务', '推荐', '建议'],
      queryType: 'contact_sensitive'
    };
  }
  
  // OpenAI分析查询扩展  
  if (lowercaseQuery.includes('openai') || lowercaseQuery.includes('chatgpt')) {
    return {
      expandedQuery: `${query} OpenAI分析 ChatGPT GPT模型 AI公司`,
      keywords: ['OpenAI', 'ChatGPT', 'GPT', 'AI模型'],
      queryType: 'company_analysis'
    };
  }
  
  // 通用查询
  return {
    expandedQuery: query,
    keywords: query.split(/\s+/).filter(word => word.length > 1),
    queryType: 'general'
  };
}

/**
 * 改进的RAG上下文生成
 */
function generateSmartPrompt(basePrompt: string, ragContext: any, queryInfo: any): string {
  // 对敏感联系类查询的特殊处理
  if (queryInfo.queryType === 'contact_sensitive') {
    return basePrompt + `\n\n当前查询："${queryInfo.expandedQuery}"\n\n🚨 特别提醒：此查询涉及敏感信息，请在回答中适当引导用户添加凯瑞微信：pkcapital2023 获得专业一对一服务。`;
  }

  if (!ragContext.matches || ragContext.matches.length === 0) {
    return basePrompt + `\n\n当前查询："${queryInfo.expandedQuery}"\n请基于你的SVTR知识库信息直接回答。`;
  }

  // 按相关性和内容质量排序匹配结果
  const sortedMatches = ragContext.matches
    .filter(match => match.content && match.content.length > 50)
    .sort((a, b) => {
      // 优先显示包含关键词的内容
      const aScore = queryInfo.keywords.reduce((score, keyword) => 
        (a.content || '').toLowerCase().includes(keyword.toLowerCase()) ? score + 1 : score, 0);
      const bScore = queryInfo.keywords.reduce((score, keyword) => 
        (b.content || '').toLowerCase().includes(keyword.toLowerCase()) ? score + 1 : score, 0);
      
      if (aScore !== bScore) return bScore - aScore;
      return (b.content?.length || 0) - (a.content?.length || 0);
    })
    .slice(0, 5); // 取最相关的5个结果

  const contextContent = sortedMatches
    .map((match, index) => {
      const title = match.title || '知识点';
      const content = match.content.substring(0, 800) + (match.content.length > 800 ? '...' : '');
      return `${index + 1}. **${title}**\n${content}`;
    })
    .join('\n\n');

  const enhancedPrompt = basePrompt + '\n\n' +
    `📚 相关知识库内容 (${sortedMatches.length}个匹配，查询类型: ${queryInfo.queryType}):\n` +
    contextContent + '\n\n' +
    `🎯 用户问题: "${queryInfo.expandedQuery}"\n` +
    `请基于以上知识库内容，提供准确、专业的回答。如果涉及创始人问题，请明确提及Min Liu (Allen)。`;

  return enhancedPrompt;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { messages } = body;

    // 获取用户最新问题
    const userQuery = messages[messages.length - 1]?.content || '';
    
    console.log(`🔍 用户查询: "${userQuery}"`);
    
    // 查询增强处理
    const queryInfo = enhanceUserQuery(userQuery);
    console.log(`📈 查询增强: 类型=${queryInfo.queryType}, 关键词=[${queryInfo.keywords.join(', ')}]`);
    
    // 初始化RAG服务（含网络搜索能力）
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY,
      undefined, // KV namespace
      { 
        searchApiKey: env.GOOGLE_SEARCH_API_KEY,
        searchEngineId: env.GOOGLE_SEARCH_ENGINE_ID,
        fallbackEnabled: true
      }
    );

    // 执行增强的RAG检索
    console.log('🧠 开始增强RAG检索...');
    const ragContext = await ragService.performIntelligentRAG(queryInfo.expandedQuery, {
      topK: 12,         // 增加检索数量
      threshold: 0.5,   // 降低阈值，包含更多相关结果
      includeAlternatives: true,
      originalQuery: userQuery,
      queryType: queryInfo.queryType,
      keywords: queryInfo.keywords
    });

    console.log(`✅ RAG检索完成: ${ragContext.matches?.length || 0}个匹配，置信度${(ragContext.confidence * 100).toFixed(1)}%`);

    // 生成智能提示词
    const smartPrompt = generateSmartPrompt(
      ENHANCED_SYSTEM_PROMPT, 
      ragContext,
      queryInfo
    );

    // 构建消息历史
    const messagesWithEnhancedSystem = [
      { role: 'system', content: smartPrompt },
      ...messages.slice(-3) // 只保留最近3轮对话，减少token消耗
    ];

    // 响应头配置
    const responseHeaders = new Headers({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Accel-Buffering': 'no',
    });

    // 智能模型选择 - 优先使用OpenAI开源模型
    let selectedModel = '@cf/openai/gpt-oss-120b'; // 默认使用最强模型
    
    // 针对不同查询类型选择模型
    if (queryInfo.queryType === 'founder_info' || queryInfo.queryType === 'company_analysis') {
      selectedModel = '@cf/openai/gpt-oss-120b'; // 事实类问题用大模型
      console.log('🎯 使用GPT-OSS-120B处理事实查询');
    } else if (queryInfo.queryType === 'funding_info') {
      selectedModel = '@cf/openai/gpt-oss-120b'; // 数据分析用大模型
      console.log('📊 使用GPT-OSS-120B处理数据分析');
    } else {
      selectedModel = '@cf/openai/gpt-oss-20b'; // 一般问题用轻量模型
      console.log('💡 使用GPT-OSS-20B处理一般查询');
    }
    
    // 模型调用参数优化
    const modelParams = {
      temperature: 0.3,        // 降低温度，提高准确性
      max_tokens: 2048,       // 减少token使用
      top_p: 0.9,            // 提高一致性
      stream: true
    };

    // 尝试调用模型，失败时fallback
    const modelPriority = [
      selectedModel,
      '@cf/openai/gpt-oss-120b',
      '@cf/openai/gpt-oss-20b',
      '@cf/meta/llama-3.3-70b-instruct',
      '@cf/qwen/qwen2.5-coder-32b-instruct'
    ].filter((model, index, arr) => arr.indexOf(model) === index); // 去重

    let response;
    for (const model of modelPriority) {
      try {
        console.log(`🤖 尝试模型: ${model}`);
        
        if (model.includes('@cf/openai/gpt-oss')) {
          // OpenAI模型使用特殊格式
          const systemMessage = messagesWithEnhancedSystem.find(m => m.role === 'system');
          const conversationMessages = messagesWithEnhancedSystem.filter(m => m.role !== 'system');
          
          response = await env.AI.run(model, {
            instructions: systemMessage ? systemMessage.content : ENHANCED_SYSTEM_PROMPT,
            input: conversationMessages,
            ...modelParams
          });
        } else {
          // 其他模型使用标准格式
          response = await env.AI.run(model, {
            messages: messagesWithEnhancedSystem,
            ...modelParams
          });
        }
        
        console.log(`✅ 成功调用模型: ${model}`);
        break;
        
      } catch (error) {
        console.log(`❌ 模型 ${model} 失败: ${error.message}`);
        if (model === modelPriority[modelPriority.length - 1]) {
          throw new Error('所有AI模型都不可用');
        }
        continue;
      }
    }

    // 创建优化的响应流
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // 流处理逻辑
    (async () => {
      try {
        let responseComplete = false;
        let hasContent = false;
        
        while (!responseComplete) {
          const { done, value } = await reader.read();
          
          if (done) {
            // 响应结束，添加来源信息（如果有RAG匹配）
            if (ragContext.matches.length > 0 && hasContent) {
              // 检查是否包含网络搜索结果
              const webSearchResults = ragContext.matches.filter(match => match.source === 'web_search');
              const knowledgeBaseResults = ragContext.matches.filter(match => match.source !== 'web_search');
              
              let sourceInfo = `\n\n---\n📚 **信息来源**: `;
              
              if (webSearchResults.length > 0) {
                sourceInfo += `🌐 实时网络数据 (${webSearchResults.length}个)`;
                if (knowledgeBaseResults.length > 0) {
                  sourceInfo += ` + SVTR知识库 (${knowledgeBaseResults.length}个)`;
                }
              } else {
                sourceInfo += `SVTR知识库 (${ragContext.matches.length}个匹配)`;
              }
              
              sourceInfo += `\n🔍 **查询类型**: ${queryInfo.queryType}`;
              sourceInfo += `\n💡 **置信度**: ${(ragContext.confidence * 100).toFixed(1)}%`;
              
              if (webSearchResults.length > 0) {
                sourceInfo += `\n⚡ **实时性**: 包含最新网络数据`;
              }
              
              await writer.write(encoder.encode('data: ' + JSON.stringify({
                delta: { content: sourceInfo }
              }) + '\n\n'));
            }
            
            await writer.write(encoder.encode('data: [DONE]\n\n'));
            responseComplete = true;
          } else {
            // 处理流式响应数据
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.response) {
                    const content = data.response;
                    
                    // 过滤无用内容
                    if (content && !content.match(/^(正在分析|分析中|思考中|\.|。)+$/)) {
                      hasContent = true;
                      
                      // 转换为标准格式
                      const standardFormat = JSON.stringify({
                        response: content
                      });
                      await writer.write(encoder.encode('data: ' + standardFormat + '\n\n'));
                    }
                  }
                } catch (e) {
                  // 解析失败，直接转发
                  await writer.write(value);
                }
              } else if (!line.includes('[DONE]') && line.trim()) {
                await writer.write(encoder.encode(line + '\n'));
              }
            }
          }
        }
      } catch (error) {
        console.error('流处理错误:', error);
        
        // 发送错误信息
        const errorMessage = JSON.stringify({
          response: '\n\n抱歉，AI服务暂时遇到问题。请稍后重试，或者访问 SVTR.AI 官网获取最新信息。\n\n💡 提示：你可以尝试重新表述问题，比如询问"SVTR的创始人是谁"或"最新的AI投资趋势"。'
        });
        await writer.write(encoder.encode('data: ' + errorMessage + '\n\n'));
        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } finally {
        await writer.close();
      }
    })();
    
    return new Response(readable, responseHeaders);

  } catch (error) {
    console.error('Enhanced Chat API Error:', error);
    
    // 错误响应
    return new Response(JSON.stringify({ 
      error: 'AI服务暂时不可用',
      message: '正在尝试恢复增强功能，请稍后重试。如需最新信息，请访问 SVTR.AI 官网。',
      suggestions: [
        '尝试重新表述问题',
        '询问具体的创投信息',
        '查询特定公司或投资数据'
      ]
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