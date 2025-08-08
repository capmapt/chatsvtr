#!/usr/bin/env node

/**
 * 诊断chatbot交互质量问题
 * 分析AI模型、RAG检索、Prompt工程等各个环节
 */

const fs = require('fs');
const path = require('path');

class ChatbotQualityDiagnoser {
  constructor() {
    this.dataFile = path.join(__dirname, '../assets/data/rag/enhanced-feishu-full-content.json');
    this.chatApiFile = path.join(__dirname, '../functions/api/chat.ts');
    this.hybridRagFile = path.join(__dirname, '../functions/lib/hybrid-rag-service.ts');
  }

  async diagnose() {
    console.log('🔍 Chatbot质量诊断分析\n');

    const issues = [];
    const recommendations = [];

    // 1. 分析数据质量
    await this.analyzeDataQuality(issues, recommendations);

    // 2. 分析RAG检索逻辑
    await this.analyzeRAGLogic(issues, recommendations);

    // 3. 分析AI模型配置
    await this.analyzeAIModelConfig(issues, recommendations);

    // 4. 分析Prompt工程
    await this.analyzePromptEngineering(issues, recommendations);

    // 5. 分析系统集成
    await this.analyzeSystemIntegration(issues, recommendations);

    // 生成诊断报告
    this.generateDiagnosticReport(issues, recommendations);

    return { issues, recommendations };
  }

  async analyzeDataQuality(issues, recommendations) {
    console.log('📊 1. 数据质量分析...');

    try {
      const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      
      // 检查核心问题数据
      const testQueries = [
        { query: 'SVTR创始人', expectedInfo: 'Min Liu (Allen)' },
        { query: '最新融资信息', expectedInfo: '2024-2025年AI融资数据' },
        { query: 'OpenAI分析', expectedInfo: 'OpenAI公司详细分析' }
      ];

      for (const test of testQueries) {
        const matches = data.nodes?.filter(node => {
          const content = (node.content || '').toLowerCase();
          const title = (node.title || '').toLowerCase();
          const query = test.query.toLowerCase();
          
          return content.includes(query.split(' ')[0]) || title.includes(query.split(' ')[0]);
        }) || [];

        console.log(`  "${test.query}": ${matches.length} 个匹配`);
        
        if (matches.length === 0) {
          issues.push({
            category: 'data_quality',
            severity: 'high',
            issue: `缺少"${test.query}"相关数据`,
            impact: '无法回答用户关于核心信息的问题'
          });
        } else {
          // 检查匹配质量
          const highQualityMatches = matches.filter(m => 
            (m.content || '').length > 100 && 
            (m.content || '').toLowerCase().includes(test.expectedInfo.split(' ')[0].toLowerCase())
          );
          
          if (highQualityMatches.length === 0) {
            issues.push({
              category: 'data_quality',
              severity: 'medium',
              issue: `"${test.query}"数据匹配质量不足`,
              impact: '回答可能不准确或不够详细'
            });
          }
        }
      }

      // 检查内容丰富度
      const validNodes = data.nodes?.filter(n => (n.contentLength || 0) >= 100) || [];
      const avgContentLength = validNodes.length > 0 ? 
        validNodes.reduce((sum, n) => sum + (n.contentLength || 0), 0) / validNodes.length : 0;

      console.log(`  有效内容节点: ${validNodes.length}/${data.nodes?.length || 0}`);
      console.log(`  平均内容长度: ${Math.round(avgContentLength)} 字符\n`);

      if (avgContentLength < 1000) {
        issues.push({
          category: 'data_quality',
          severity: 'medium',
          issue: '平均内容长度较短',
          impact: '回答缺乏深度和详细信息'
        });
        recommendations.push({
          category: 'data_improvement',
          action: '增强飞书内容同步，获取更完整的文档内容',
          priority: 'high'
        });
      }

    } catch (error) {
      issues.push({
        category: 'data_quality',
        severity: 'critical',
        issue: '无法读取数据文件',
        impact: 'RAG系统完全失效'
      });
    }
  }

  async analyzeRAGLogic(issues, recommendations) {
    console.log('🧠 2. RAG检索逻辑分析...');

    try {
      const ragCode = fs.readFileSync(this.hybridRagFile, 'utf8');

      // 检查检索策略
      const hasVectorSearch = ragCode.includes('vectorSearch');
      const hasKeywordSearch = ragCode.includes('keywordSearch') || ragCode.includes('enhancedKeywordSearch');
      const hasSemanticMatch = ragCode.includes('semanticPatternMatch');
      
      console.log(`  向量检索: ${hasVectorSearch ? '✅' : '❌'}`);
      console.log(`  关键词检索: ${hasKeywordSearch ? '✅' : '❌'}`);
      console.log(`  语义匹配: ${hasSemanticMatch ? '✅' : '❌'}`);

      // 检查关键参数
      const topKMatch = ragCode.match(/topK[:=]\s*(\d+)/);
      const thresholdMatch = ragCode.match(/threshold[:=]\s*([\d.]+)/);
      
      const topK = topKMatch ? parseInt(topKMatch[1]) : null;
      const threshold = thresholdMatch ? parseFloat(thresholdMatch[1]) : null;

      console.log(`  检索数量(topK): ${topK || 'undefined'}`);
      console.log(`  相似度阈值: ${threshold || 'undefined'}\n`);

      if (topK && topK < 5) {
        issues.push({
          category: 'rag_logic',
          severity: 'medium',
          issue: 'RAG检索数量过少',
          impact: '可能遗漏相关信息'
        });
        recommendations.push({
          category: 'rag_optimization',
          action: '增加topK到8-12个结果',
          priority: 'medium'
        });
      }

      if (threshold && threshold > 0.8) {
        issues.push({
          category: 'rag_logic',
          severity: 'medium',
          issue: '相似度阈值过高',
          impact: '可能过滤掉相关但不完全匹配的信息'
        });
        recommendations.push({
          category: 'rag_optimization',
          action: '降低相似度阈值到0.6-0.7',
          priority: 'medium'
        });
      }

      // 检查查询扩展
      const hasQueryExpansion = ragCode.includes('queryExpansion') || ragCode.includes('expandQuery');
      if (!hasQueryExpansion) {
        issues.push({
          category: 'rag_logic',
          severity: 'high',
          issue: '缺少查询扩展功能',
          impact: '无法处理同义词和相关概念'
        });
        recommendations.push({
          category: 'rag_enhancement',
          action: '实现查询扩展，支持同义词和相关概念匹配',
          priority: 'high'
        });
      }

    } catch (error) {
      issues.push({
        category: 'rag_logic',
        severity: 'critical',
        issue: '无法分析RAG代码',
        impact: 'RAG系统可能存在实现问题'
      });
    }
  }

  async analyzeAIModelConfig(issues, recommendations) {
    console.log('🤖 3. AI模型配置分析...');

    try {
      const chatCode = fs.readFileSync(this.chatApiFile, 'utf8');

      // 检查模型配置
      const modelMatches = chatCode.match(/@cf\/([\w-]+\/[\w-]+)/g) || [];
      const uniqueModels = [...new Set(modelMatches)];
      
      console.log(`  配置的AI模型: ${uniqueModels.length}个`);
      uniqueModels.forEach(model => console.log(`    - ${model}`));

      // 检查OpenAI模型使用
      const hasOpenAIModels = uniqueModels.some(m => m.includes('openai/gpt-oss'));
      const hasLlamaModels = uniqueModels.some(m => m.includes('llama'));
      const hasQwenModels = uniqueModels.some(m => m.includes('qwen'));

      console.log(`  OpenAI开源模型: ${hasOpenAIModels ? '✅' : '❌'}`);
      console.log(`  Llama模型: ${hasLlamaModels ? '✅' : '❌'}`);
      console.log(`  Qwen模型: ${hasQwenModels ? '✅' : '❌'}`);

      // 检查参数配置
      const temperatureMatch = chatCode.match(/temperature[:=]\s*([\d.]+)/);
      const maxTokensMatch = chatCode.match(/max_tokens[:=]\s*(\d+)/);
      
      const temperature = temperatureMatch ? parseFloat(temperatureMatch[1]) : null;
      const maxTokens = maxTokensMatch ? parseInt(maxTokensMatch[1]) : null;

      console.log(`  Temperature: ${temperature || 'undefined'}`);
      console.log(`  Max Tokens: ${maxTokens || 'undefined'}\n`);

      // 问题诊断
      if (!hasOpenAIModels) {
        issues.push({
          category: 'ai_model',
          severity: 'high',
          issue: '未使用最新的OpenAI开源模型',
          impact: '可能影响回答质量和推理能力'
        });
      }

      if (temperature && (temperature < 0.3 || temperature > 0.9)) {
        issues.push({
          category: 'ai_model',
          severity: 'medium',
          issue: 'Temperature参数不合适',
          impact: '回答可能过于机械化或过于随机'
        });
        recommendations.push({
          category: 'model_optimization',
          action: '调整temperature到0.6-0.8之间',
          priority: 'medium'
        });
      }

      if (maxTokens && maxTokens < 2000) {
        issues.push({
          category: 'ai_model',
          severity: 'medium',
          issue: '最大token数过低',
          impact: '回答可能被截断，缺乏详细信息'
        });
      }

    } catch (error) {
      issues.push({
        category: 'ai_model',
        severity: 'critical',
        issue: '无法分析AI模型配置',
        impact: 'AI模型可能配置错误'
      });
    }
  }

  async analyzePromptEngineering(issues, recommendations) {
    console.log('✍️ 4. Prompt工程分析...');

    try {
      const chatCode = fs.readFileSync(this.chatApiFile, 'utf8');

      // 提取系统提示词
      const systemPromptMatch = chatCode.match(/BASE_SYSTEM_PROMPT\s*=\s*`([^`]+)`/);
      const systemPrompt = systemPromptMatch ? systemPromptMatch[1] : '';

      console.log(`  系统提示词长度: ${systemPrompt.length} 字符`);

      // 分析提示词内容
      const hasRoleDefinition = systemPrompt.includes('凯瑞') || systemPrompt.includes('Kerry');
      const hasDataDescription = systemPrompt.includes('SVTR') && systemPrompt.includes('10,761');
      const hasResponseGuidelines = systemPrompt.includes('直接回答');
      const hasKnowledgeCutoff = systemPrompt.includes('OpenAI') || systemPrompt.includes('最新');

      console.log(`  角色定义: ${hasRoleDefinition ? '✅' : '❌'}`);
      console.log(`  数据描述: ${hasDataDescription ? '✅' : '❌'}`);
      console.log(`  回答指导: ${hasResponseGuidelines ? '✅' : '❌'}`);
      console.log(`  知识更新: ${hasKnowledgeCutoff ? '✅' : '❌'}`);

      // 检查RAG上下文集成
      const hasRAGIntegration = chatCode.includes('generateEnhancedPrompt');
      const hasContextFormatting = chatCode.includes('contextContent');

      console.log(`  RAG集成: ${hasRAGIntegration ? '✅' : '❌'}`);
      console.log(`  上下文格式: ${hasContextFormatting ? '✅' : '❌'}\n`);

      // 问题诊断
      if (!hasRoleDefinition) {
        issues.push({
          category: 'prompt_engineering',
          severity: 'medium',
          issue: '缺少清晰的AI角色定义',
          impact: '回答可能缺乏专业性和一致性'
        });
      }

      if (!hasDataDescription) {
        issues.push({
          category: 'prompt_engineering',
          severity: 'high',
          issue: '未在系统提示中描述数据范围',
          impact: 'AI不了解自己的知识边界'
        });
      }

      if (systemPrompt.length < 200) {
        issues.push({
          category: 'prompt_engineering',
          severity: 'medium',
          issue: '系统提示词过于简短',
          impact: '缺乏足够的行为指导'
        });
        recommendations.push({
          category: 'prompt_optimization',
          action: '丰富系统提示词，添加更多行为指导和上下文',
          priority: 'high'
        });
      }

      // 检查特定问题的处理
      const hasFounderInfo = systemPrompt.includes('Min Liu') || systemPrompt.includes('创始人');
      if (!hasFounderInfo) {
        issues.push({
          category: 'prompt_engineering',
          severity: 'high',
          issue: '系统提示中缺少创始人信息',
          impact: '无法正确回答关于SVTR创始人的问题'
        });
        recommendations.push({
          category: 'prompt_optimization',
          action: '在系统提示中明确SVTR创始人Min Liu (Allen)的信息',
          priority: 'high'
        });
      }

    } catch (error) {
      issues.push({
        category: 'prompt_engineering',
        severity: 'critical',
        issue: '无法分析Prompt配置',
        impact: 'Prompt工程可能存在问题'
      });
    }
  }

  async analyzeSystemIntegration(issues, recommendations) {
    console.log('⚙️ 5. 系统集成分析...');

    try {
      const chatCode = fs.readFileSync(this.chatApiFile, 'utf8');

      // 检查错误处理
      const hasErrorHandling = chatCode.includes('try') && chatCode.includes('catch');
      const hasFallback = chatCode.includes('fallback') || chatCode.includes('备用');
      const hasRetry = chatCode.includes('retry') || chatCode.includes('重试');

      console.log(`  错误处理: ${hasErrorHandling ? '✅' : '❌'}`);
      console.log(`  降级机制: ${hasFallback ? '✅' : '❌'}`);
      console.log(`  重试机制: ${hasRetry ? '✅' : '❌'}`);

      // 检查响应处理
      const hasStreamingResponse = chatCode.includes('TransformStream') && chatCode.includes('text/event-stream');
      const hasContentFiltering = chatCode.includes('正在分析') && chatCode.includes('continue');

      console.log(`  流式响应: ${hasStreamingResponse ? '✅' : '❌'}`);
      console.log(`  内容过滤: ${hasContentFiltering ? '✅' : '❌'}`);

      // 检查性能优化
      const hasModelSelection = chatCode.includes('selectedModel') && chatCode.includes('modelPriority');
      const hasCaching = chatCode.includes('cache') || chatCode.includes('缓存');

      console.log(`  模型选择: ${hasModelSelection ? '✅' : '❌'}`);
      console.log(`  缓存机制: ${hasCaching ? '✅' : '❌'}\n`);

      // 问题诊断
      if (!hasRetry) {
        issues.push({
          category: 'system_integration',
          severity: 'medium',
          issue: '缺少模型调用重试机制',
          impact: '模型失败时可能直接返回错误'
        });
        recommendations.push({
          category: 'system_reliability',
          action: '添加智能重试机制，尝试多个模型',
          priority: 'medium'
        });
      }

      if (!hasCaching) {
        issues.push({
          category: 'system_integration',
          severity: 'low',
          issue: '缺少响应缓存机制',
          impact: '可能影响响应速度'
        });
      }

    } catch (error) {
      issues.push({
        category: 'system_integration',
        severity: 'critical',
        issue: '无法分析系统集成',
        impact: '系统可能存在集成问题'
      });
    }
  }

  generateDiagnosticReport(issues, recommendations) {
    console.log('📋 诊断结果汇总\n');

    // 按严重程度分类问题
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');

    console.log('🚨 问题严重程度统计:');
    console.log(`  Critical: ${criticalIssues.length}个`);
    console.log(`  High: ${highIssues.length}个`);
    console.log(`  Medium: ${mediumIssues.length}个`);
    console.log(`  Low: ${lowIssues.length}个\n`);

    // 重点问题分析
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      console.log('🔥 需要立即解决的问题:');
      [...criticalIssues, ...highIssues].forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
        console.log(`   影响: ${issue.impact}`);
        console.log(`   类别: ${issue.category}\n`);
      });
    }

    // 优先级建议
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high');
    if (highPriorityRecs.length > 0) {
      console.log('⚡ 高优先级改进建议:');
      highPriorityRecs.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.action} (${rec.category})`);
      });
      console.log();
    }

    // 根本原因分析
    console.log('🔍 根本原因分析:');
    
    const dataIssues = issues.filter(i => i.category === 'data_quality').length;
    const ragIssues = issues.filter(i => i.category === 'rag_logic').length;
    const modelIssues = issues.filter(i => i.category === 'ai_model').length;
    const promptIssues = issues.filter(i => i.category === 'prompt_engineering').length;

    if (promptIssues >= 2) {
      console.log('1. 主要问题在于Prompt工程不完善');
      console.log('   - 系统提示词缺乏关键信息');
      console.log('   - 缺少明确的行为指导');
    }

    if (dataIssues >= 2) {
      console.log('2. 数据质量影响回答准确性');
      console.log('   - 关键信息数据缺失或不完整');
      console.log('   - 内容深度不足');
    }

    if (ragIssues >= 2) {
      console.log('3. RAG检索逻辑需要优化');
      console.log('   - 检索参数配置不当');
      console.log('   - 缺少智能查询扩展');
    }

    if (modelIssues >= 2) {
      console.log('4. AI模型配置存在问题');
      console.log('   - 模型选择或参数不当');
      console.log('   - 缺少合适的模型fallback');
    }

    console.log('\n💡 总体建议:');
    console.log('基于诊断结果，chatbot质量问题主要源于:');
    console.log('1. Prompt工程需要加强，特别是系统提示词');
    console.log('2. 需要更丰富和准确的知识库数据');
    console.log('3. RAG检索策略需要精细调优');
    console.log('4. AI模型选择和参数需要针对性优化');

    // 保存诊断报告
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: issues.length,
        criticalIssues: criticalIssues.length,
        highIssues: highIssues.length,
        mediumIssues: mediumIssues.length,
        lowIssues: lowIssues.length
      },
      issues,
      recommendations,
      rootCauses: {
        dataQuality: dataIssues,
        ragLogic: ragIssues,
        aiModel: modelIssues,
        promptEngineering: promptIssues
      }
    };

    try {
      const reportPath = path.join(__dirname, '../logs/chatbot-quality-diagnosis.json');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📊 详细诊断报告已保存: ${reportPath}`);
    } catch (error) {
      console.error('保存报告失败:', error.message);
    }

    return report;
  }
}

// 主函数
async function main() {
  console.log('🔍 SVTR Chatbot质量诊断\n');

  try {
    const diagnoser = new ChatbotQualityDiagnoser();
    const result = await diagnoser.diagnose();
    
    console.log('\n✅ 诊断完成!');
    
  } catch (error) {
    console.error('💥 诊断失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ChatbotQualityDiagnoser;