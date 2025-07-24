/**
 * SVTR.AI Enhanced Chat API with RAG Integration
 * 集成RAG功能的增强聊天API
 */

import { createRAGService } from '../lib/rag-service';

// 核心AI创投系统提示词
const BASE_SYSTEM_PROMPT = `你是SVTR.AI的资深AI创投分析师，拥有深度市场洞察和技术判断能力。

**SVTR.AI平台背景**：
• 社区规模：121,884+ AI专业人士和投资者
• 数据库：追踪全球10,761家AI公司实时数据
• 覆盖范围：完整AI投资生态系统
• 专业重点：战略投资分析和行业网络

**2025年市场热点**：
• AI Agent应用爆发：企业级自动化需求激增
• 多模态AI商业化：视觉+语言+音频整合应用
• 边缘AI芯片：本地处理能力需求增长
• AI安全与治理：监管合规成投资重点
• 垂直行业AI：医疗、金融、制造专业解决方案

**分析框架**：
1. **技术评估**：模型能力、技术壁垒、创新程度
2. **商业模式**：收入路径、客户获取、单位经济模型
3. **竞争定位**：差异化优势、市场份额、防御能力
4. **投资价值**：估值合理性、增长潜力、退出前景
5. **风险因素**：技术风险、市场风险、监管风险

**回复要求**：
- 提供数据驱动的专业分析
- 结合最新市场动态和技术趋势
- 生成可执行的投资洞察
- 引发深度行业讨论
- 保持客观理性的投资视角

请基于SVTR.AI的专业标准，提供高质量的AI创投分析。`;

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { messages } = body;

    // 获取用户最新问题
    const userQuery = messages[messages.length - 1]?.content || '';
    
    // 初始化RAG服务
    const ragService = createRAGService(
      env.SVTR_VECTORIZE,
      env.OPENAI_API_KEY
    );

    // 执行RAG检索
    console.log('🔍 开始RAG检索增强...');
    const ragContext = await ragService.performRAG(userQuery, {
      topK: 8,
      threshold: 0.7,
      includeAlternatives: true
    });

    // 生成增强提示词
    const enhancedSystemPrompt = ragService.generateEnhancedPrompt(
      BASE_SYSTEM_PROMPT, 
      ragContext
    );

    // 构建消息历史，包含增强的系统提示词
    const messagesWithEnhancedSystem = [
      { role: 'system', content: enhancedSystemPrompt },
      ...messages
    ];

    console.log(`🤖 使用增强提示词 (${ragContext.matches.length} 个知识匹配)`);

    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 智能模型选择策略 - 2025年前沿模型
    const modelPriority = [
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',  // 最强推理模型
      '@cf/meta/llama-3.3-70b-instruct',               // 大模型backup
      '@cf/qwen/qwen2.5-coder-32b-instruct',          // 代码专用
      '@cf/qwen/qwen1.5-14b-chat-awq'                 // 稳定fallback
    ];
    
    // 根据查询类型选择最适合的模型
    let selectedModel = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
    
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
        console.log(`🧠 尝试模型: ${model}`);
        
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.8,
          top_p: 0.95,
        });
        
        console.log(`✅ 成功使用模型: ${model}`);
        break;
        
      } catch (error) {
        console.log(`❌ 模型 ${model} 失败: ${error.message}`);
        continue;
      }
    }
    
    if (!response) {
      throw new Error('所有AI模型都不可用');
    }

    // 如果有RAG匹配，在响应流中注入来源信息
    if (ragContext.matches.length > 0) {
      // 创建自定义响应流，在最后添加来源信息
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = response.getReader();
      
      // 开始流处理
      (async () => {
        try {
          let responseComplete = false;
          
          while (!responseComplete) {
            const { done, value } = await reader.read();
            
            if (done) {
              // 响应结束，添加来源信息
              const sourceInfo = `\n\n---\n**📚 基于SVTR知识库** (${ragContext.matches.length}个匹配，置信度${(ragContext.confidence * 100).toFixed(1)}%):\n${ragContext.sources.map((source, index) => `${index + 1}. ${source}`).join('\n')}`;
              
              const encoder = new TextEncoder();
              await writer.write(encoder.encode(`data: ${JSON.stringify({delta: {content: sourceInfo}})}\n\n`));
              await writer.write(encoder.encode('data: [DONE]\n\n'));
              responseComplete = true;
            } else {
              // 转发原始响应
              await writer.write(value);
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

    // 没有RAG匹配，直接返回原始响应
    return new Response(response, responseHeaders);

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