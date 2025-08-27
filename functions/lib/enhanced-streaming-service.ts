/**
 * SVTR.AI 增强流式响应服务
 * 2025年优化版 - 结构化流式响应 + 智能分块
 */

interface StreamChunk {
  type: 'thinking' | 'content' | 'sources' | 'actions' | 'metadata';
  data: any;
  metadata?: {
    confidence: number;
    reasoning?: string;
    progress?: number;
    timestamp: number;
  };
}

interface StreamingConfig {
  enableThinking: boolean;
  enableSources: boolean;
  enableProgress: boolean;
  chunkSize: number;
  maxLatency: number;
}

export class EnhancedStreamingService {
  private config: StreamingConfig;
  private buffer: string = '';
  private chunkBuffer: StreamChunk[] = [];
  
  constructor(config?: Partial<StreamingConfig>) {
    this.config = {
      enableThinking: true,
      enableSources: true,
      enableProgress: true,
      chunkSize: 50,
      maxLatency: 200,
      ...config
    };
  }

  /**
   * 创建增强的流式响应处理器
   */
  createEnhancedStream(originalResponse: ReadableStream, ragContext: any, userQuery: string): ReadableStream {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const self = this;
    return new ReadableStream({
      async start(controller) {
        // 发送初始思考阶段
        if (self.config.enableThinking) {
          await self.sendThinkingPhase(controller, encoder, userQuery, ragContext);
        }
      },
      
      async pull(controller) {
        const reader = originalResponse.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // 发送最终源信息
              if (this.config.enableSources && ragContext.matches.length > 0) {
                await this.sendSourcesPhase(controller, encoder, ragContext);
              }
              
              // 发送完成标记
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              break;
            }
            
            // 处理流式数据
            const chunk = decoder.decode(value, { stream: true });
            await self.processStreamChunk(controller, encoder, chunk);
          }
        } catch (error) {
          console.error('流式处理错误:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  }

  /**
   * 发送思考阶段
   */
  private async sendThinkingPhase(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    userQuery: string,
    ragContext: any
  ): Promise<void> {
    const thinkingSteps = this.generateThinkingSteps(userQuery, ragContext);
    
    for (const step of thinkingSteps) {
      const thinkingChunk: StreamChunk = {
        type: 'thinking',
        data: step.text,
        metadata: {
          confidence: step.confidence,
          reasoning: step.reasoning,
          progress: step.progress,
          timestamp: Date.now()
        }
      };
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinkingChunk)}\n\n`));
      
      // 添加自然延迟模拟思考过程
      await this.sleep(step.delay || 300);
    }
  }

  /**
   * 生成思考步骤
   */
  private generateThinkingSteps(userQuery: string, ragContext: any): any[] {
    const steps = [];
    const query = userQuery.toLowerCase();
    
    // 步骤1: 查询理解
    steps.push({
      text: '正在理解您的查询...',
      confidence: 0.9,
      reasoning: '分析查询意图和关键词',
      progress: 0.2,
      delay: 200
    });

    // 步骤2: 知识检索
    if (ragContext.matches && ragContext.matches.length > 0) {
      steps.push({
        text: `已检索到 ${ragContext.matches.length} 条相关信息...`,
        confidence: ragContext.confidence || 0.8,
        reasoning: '从SVTR知识库匹配相关内容',
        progress: 0.5,
        delay: 300
      });
    }

    // 步骤3: 智能分析
    if (query.includes('分析') || query.includes('如何') || query.includes('为什么')) {
      steps.push({
        text: '正在进行深度分析...',
        confidence: 0.85,
        reasoning: '结合多维度信息进行推理',
        progress: 0.8,
        delay: 400
      });
    }

    // 步骤4: 答案生成
    steps.push({
      text: '正在生成专业回答...',
      confidence: 0.9,
      reasoning: '基于检索信息生成准确回答',
      progress: 1.0,
      delay: 250
    });

    return steps;
  }

  /**
   * 处理流式数据块
   */
  private async processStreamChunk(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    chunk: string
  ): Promise<void> {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    
    // 保留最后一个可能不完整的行
    this.buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.response) {
            const enhancedChunk = await this.enhanceContentChunk(data.response);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(enhancedChunk)}\n\n`));
          }
        } catch (e) {
          // 原样转发无法解析的数据
          controller.enqueue(encoder.encode(`${line}\n`));
        }
      } else if (line.trim()) {
        controller.enqueue(encoder.encode(`${line}\n`));
      }
    }
  }

  /**
   * 增强内容块
   */
  private async enhanceContentChunk(content: string): Promise<StreamChunk> {
    return {
      type: 'content',
      data: {
        response: content,
        enhanced: true
      },
      metadata: {
        confidence: this.calculateContentConfidence(content),
        timestamp: Date.now()
      }
    };
  }

  /**
   * 发送源信息阶段
   */
  private async sendSourcesPhase(
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
    ragContext: any
  ): Promise<void> {
    const sourcesChunk: StreamChunk = {
      type: 'sources',
      data: {
        sources: ragContext.matches.slice(0, 3).map(match => ({
          title: match.title || '知识库',
          confidence: match.score || 0.8,
          type: match.source || 'SVTR知识库'
        })),
        totalMatches: ragContext.matches.length,
        searchTime: ragContext.responseTime || 0
      },
      metadata: {
        confidence: ragContext.confidence || 0.8,
        timestamp: Date.now()
      }
    };

    controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourcesChunk)}\n\n`));
  }

  /**
   * 计算内容置信度
   */
  private calculateContentConfidence(content: string): number {
    let confidence = 0.7; // 基础置信度
    
    // 长度因子
    if (content.length > 100) confidence += 0.1;
    if (content.length > 300) confidence += 0.1;
    
    // 结构化因子
    if (content.includes('•') || content.includes('**')) confidence += 0.05;
    if (content.includes('数据') || content.includes('分析')) confidence += 0.05;
    
    // 数字因子（数据准确性指标）
    if (/\d+/.test(content)) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * 工具方法
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取流式统计信息
   */
  getStats(): any {
    return {
      bufferSize: this.buffer.length,
      chunksProcessed: this.chunkBuffer.length,
      config: this.config
    };
  }
}

/**
 * 创建增强流式服务实例
 */
export function createEnhancedStreaming(config?: Partial<StreamingConfig>) {
  return new EnhancedStreamingService(config);
}