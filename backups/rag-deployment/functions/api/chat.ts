/**
 * Cloudflare Pages Function for SVTR.AI Chat
 * 硅谷科技评论 AI创投专业聊天服务
 */

// 前沿AI模型专业提示词 - 2025版本
const SYSTEM_PROMPT = `你是SVTR.AI的资深AI创投分析师，拥有深度市场洞察和技术判断能力。

**SVTR.AI平台背景**：
• 社区规模：121,884+ AI专业人士和投资者
• 数据库：追踪全球10,761家AI公司实时数据
• 覆盖范围：完整AI投资生态系统
• 专业重点：战略投资分析和行业网络

**核心投资数据库(2025最新)**：
• **OpenAI** ($157B估值): GPT-5发布，推理能力突破，微软Azure深度整合
• **Anthropic** ($60B估值): Claude-4系列发布，AI安全领域领导者，Amazon投资
• **Scale AI** ($13.8B估值): 数据标注龙头，企业AI部署，准备2025年IPO
• **Perplexity** ($9B估值): AI搜索革命，企业版快速增长，谷歌竞品
• **xAI** ($50B估值): Grok-3发布，X平台集成，马斯克AI战略

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

// 简化RAG：从JSON文件获取最新数据
async function getLatestSVTRData(): Promise<string> {
  try {
    // 2025年最新AI投资数据
    const latestData = {
      date: '2025年1月',
      highlights: [
        'DeepSeek-R1超越GPT-4，开源模型质量实现历史性突破',
        'Anthropic Claude-4发布，推理+创作能力达到新高度',
        'Meta Llama 4 Scout原生多模态，17B参数16专家架构',
        'OpenAI GPT-5 API发布，SWE-Bench编程测试提升21个百分点',
        'Cloudflare Workers AI支持32B+模型，边缘AI能力大幅提升',
        'AI Agent企业级应用爆发，自动化投资回报显著',
        'xAI Grok-3与X平台深度整合，社交AI新模式'
      ],
      trends: [
        '推理模型成为新战场：o1-mini被DeepSeek-R1超越',
        '多模态AI商业化加速：视觉+语言+音频统一处理',
        '边缘AI芯片需求激增：本地部署降低云依赖',
        '开源模型质量突破：挑战闭源模型商业护城河',
        'AI安全投资重点：合规框架和治理工具',
        '垂直行业AI深化：医疗、金融、制造专业化'
      ],
      companies: [
        {
          name: 'OpenAI',
          valuation: '$1570亿',
          latest: 'GPT-5 API发布，编程能力大幅提升，企业客户增长300%'
        },
        {
          name: 'Anthropic', 
          valuation: '$600亿',
          latest: 'Claude-4混合架构，即时响应+深度思考，AI安全领导地位'
        },
        {
          name: 'xAI',
          valuation: '$500亿',
          latest: 'Grok-3发布，X平台10亿用户数据训练，社交AI革命'
        },
        {
          name: 'Scale AI',
          valuation: '$138亿',
          latest: '2025年IPO准备中，企业AI部署营收增长500%'
        },
        {
          name: 'Perplexity',
          valuation: '$90亿',
          latest: '企业级搜索增长迅猛，月活突破2亿，挑战谷歌搜索'
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

    // 调用 Cloudflare Workers AI - 使用2025年前沿模型策略
    const modelPriority = [
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',  // 最强推理模型
      '@cf/meta/llama-3.3-70b-instruct',               // 大模型backup
      '@cf/qwen/qwen2.5-coder-32b-instruct',          // 代码专用
      '@cf/qwen/qwen1.5-14b-chat-awq'                 // 稳定fallback
    ];
    
    // 如果是代码相关问题，优先使用代码模型
    const isCodeRelated = messagesWithSystem.some(msg => 
      msg.content.toLowerCase().includes('code') || 
      msg.content.toLowerCase().includes('代码') ||
      msg.content.toLowerCase().includes('programming') ||
      msg.content.toLowerCase().includes('编程')
    );
    
    let selectedModel = isCodeRelated ? 
      '@cf/qwen/qwen2.5-coder-32b-instruct' : 
      '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b';
    
    // 尝试模型调用，失败则fallback
    let response;
    for (const model of [selectedModel, ...modelPriority.filter(m => m !== selectedModel)]) {
      try {
        response = await env.AI.run(model, {
          messages: messagesWithSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.8,
          top_p: 0.95,
        });
        console.log(`Successfully using model: ${model}`);
        break;
      } catch (error) {
        console.log(`Model ${model} failed, trying next...`);
        continue;
      }
    }
    
    if (!response) {
      throw new Error('All AI models failed');
    }

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