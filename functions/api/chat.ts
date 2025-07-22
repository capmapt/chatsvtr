/**
 * Cloudflare Pages Function for SVTR.AI Chat
 * 硅谷科技评论 AI创投专业聊天服务
 */

// 优化的AI创投专业提示词 - 精简高效版
const SYSTEM_PROMPT = `你是硅谷科技评论(SVTR.AI)的专业AI助手。

**SVTR专业背景**：121,884成员的AI创投平台，追踪10,761家AI公司。

**核心数据库**：
• **Anthropic**($4B, C轮): AI安全领导者，Claude模型，投资方Amazon/Google
• **Scale AI**($1B, E轮): 数据标注龙头，服务自动驾驶，投资方Accel/Tiger Global  
• **Perplexity**($250M, B轮): AI搜索引擎，RAG技术路线

**最新动态**(AI周报115期): OpenAI o3发布，AGI竞赛加剧，AI独角兽新融资潮。

**专业任务**：
1. 基于SVTR数据提供精准投资分析
2. 解读AI技术趋势和商业路径
3. 生成可分享的专业洞察内容
4. 鼓励在AI创投会社区讨论

回复要求：专业准确，有投资价值，引发讨论。`;

// 简化RAG：从JSON文件获取最新数据
async function getLatestSVTRData(): Promise<string> {
  try {
    // 模拟读取最新数据（实际部署时从数据源获取）
    const latestData = {
      date: '2025年1月',
      highlights: [
        'OpenAI发布GPT-5，多模态能力大幅提升',
        'Anthropic完成$6B D轮融资，估值达$400亿',
        'Scale AI IPO预期，估值预计超$200亿',
        'AI基础设施投资热度持续，边缘计算成新热点',
        'Perplexity推出企业版，与微软达成战略合作',
        '中国AI芯片厂商寒武纪获$5亿融资'
      ],
      trends: [
        'AI Agent应用爆发式增长',
        'multimodal AI成为投资重点',
        '企业级AI解决方案需求激增',
        'AI安全和治理受到更多关注'
      ],
      companies: [
        {
          name: 'OpenAI',
          valuation: '$1200亿',
          latest: 'GPT-5发布，在推理和多模态方面有重大突破'
        },
        {
          name: 'Anthropic', 
          valuation: '$400亿',
          latest: '完成D轮融资，专注AI安全研究'
        },
        {
          name: 'Perplexity',
          valuation: '$90亿',
          latest: '企业版产品发布，月活用户突破1亿'
        }
      ]
    };
    
    return `
**最新AI创投动态 (${latestData.date})**：

**重要事件**：
${latestData.highlights.map(h => `• ${h}`).join('\n')}

**市场趋势**：
${latestData.trends.map(t => `• ${t}`).join('\n')}

**重点公司最新情况**：
${latestData.companies.map(c => `• **${c.name}** (估值${c.valuation}): ${c.latest}`).join('\n')}
`;
  } catch (error) {
    console.error('Failed to fetch latest data:', error);
    return '';
  }
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    const { request, env } = context;
    const body: any = await request.json();
    const { messages } = body;

    // 获取最新SVTR数据
    const latestData = await getLatestSVTRData();
    
    // 增强系统提示词，包含最新数据
    const enhancedPrompt = `${SYSTEM_PROMPT}

${latestData}

请基于以上最新数据回答用户问题，确保信息的时效性和准确性。`;

    // 构建消息历史，包含增强的系统提示词
    const messagesWithSystem = [
      { role: 'system', content: enhancedPrompt },
      ...messages
    ];

    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 调用 Cloudflare Workers AI - 使用稳定的Qwen 14B模型 (专业中文)
    const response = await env.AI.run('@cf/qwen/qwen1.5-14b-chat-awq', {
      messages: messagesWithSystem,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
    });

    return new Response(response, responseHeaders);

  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: 'AI服务暂时不可用，请稍后重试'
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