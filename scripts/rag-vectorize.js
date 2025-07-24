#!/usr/bin/env node

/**
 * SVTR.AI RAG向量化处理系统
 * 将知识库文档转换为向量并存储到Cloudflare Vectorize
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

class SVTRVectorizer {
  constructor() {
    this.config = {
      openaiApiKey: process.env.OPENAI_API_KEY,
      cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN,
      vectorizeIndexName: 'svtr-knowledge-base',
      
      // 分块配置
      chunkSize: 1000,        // 每个chunk的最大字符数
      chunkOverlap: 200,      // chunk之间的重叠字符数
      minChunkSize: 100,      // 最小chunk大小
      
      // Embedding配置
      embeddingModel: 'text-embedding-3-small', // OpenAI embedding模型
      embeddingDimensions: 1536,                 // 向量维度
      
      // 批处理配置
      batchSize: 20,          // 每批处理的文档数
      rateLimitDelay: 1000    // API调用间隔 (ms)
    };
    
    this.knowledgeBase = null;
    this.chunks = [];
    this.vectors = [];
    
    this.dataDir = path.join(__dirname, '../assets/data/rag');
    this.outputDir = path.join(__dirname, '../assets/data/vectors');
  }

  /**
   * 加载知识库数据
   */
  async loadKnowledgeBase() {
    const knowledgeFile = path.join(this.dataDir, 'knowledge-base.json');
    
    try {
      const data = await fs.readFile(knowledgeFile, 'utf8');
      this.knowledgeBase = JSON.parse(data);
      console.log(`✅ 加载知识库: ${this.knowledgeBase.documents.length} 个文档`);
      return true;
    } catch (error) {
      console.error('❌ 无法加载知识库文件，请先运行 npm run rag:sync');
      throw error;
    }
  }

  /**
   * 智能文档分块器
   */
  chunkDocument(document) {
    const { content, title, id } = document;
    const chunks = [];
    
    if (content.length <= this.config.chunkSize) {
      // 文档较小，不需要分块
      chunks.push({
        id: `${id}_chunk_0`,
        content: content,
        title: title,
        chunkIndex: 0,
        documentId: id,
        metadata: {
          ...document.metadata,
          isFullDocument: true,
          chunkCount: 1
        }
      });
      return chunks;
    }
    
    // 按段落分割
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      
      // 如果添加这个段落不会超过大小限制
      if ((currentChunk + '\n\n' + paragraph).length <= this.config.chunkSize) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
      } else {
        // 保存当前chunk
        if (currentChunk.length >= this.config.minChunkSize) {
          chunks.push({
            id: `${id}_chunk_${chunkIndex}`,
            content: currentChunk,
            title: `${title} (第${chunkIndex + 1}部分)`,
            chunkIndex: chunkIndex,
            documentId: id,
            metadata: {
              ...document.metadata,
              isFullDocument: false,
              paragraphStart: Math.max(0, i - currentChunk.split('\n\n').length),
              paragraphEnd: i - 1
            }
          });
          chunkIndex++;
        }
        
        // 开始新的chunk，包含重叠内容
        if (chunkIndex > 0 && this.config.chunkOverlap > 0) {
          const overlapText = this.getOverlapText(currentChunk, this.config.chunkOverlap);
          currentChunk = overlapText + '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
        }
      }
    }
    
    // 处理最后一个chunk
    if (currentChunk.length >= this.config.minChunkSize) {
      chunks.push({
        id: `${id}_chunk_${chunkIndex}`,
        content: currentChunk,
        title: `${title} (第${chunkIndex + 1}部分)`,
        chunkIndex: chunkIndex,
        documentId: id,
        metadata: {
          ...document.metadata,
          isFullDocument: false
        }
      });
    }
    
    return chunks;
  }

  /**
   * 获取重叠文本
   */
  getOverlapText(text, overlapSize) {
    if (text.length <= overlapSize) return text;
    
    // 尝试在句子边界处切割
    const sentences = text.split(/[。！？.!?]/);
    let overlap = '';
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const candidate = sentences.slice(i).join('。');
      if (candidate.length <= overlapSize) {
        overlap = candidate;
        break;
      }
    }
    
    return overlap || text.slice(-overlapSize);
  }

  /**
   * 处理所有文档分块
   */
  async processAllDocuments() {
    console.log('📝 开始文档分块处理...');
    
    for (const document of this.knowledgeBase.documents) {
      const docChunks = this.chunkDocument(document);
      this.chunks.push(...docChunks);
    }
    
    console.log(`✅ 文档分块完成: ${this.chunks.length} 个chunks`);
    
    // 保存分块结果
    await this.saveChunks();
  }

  /**
   * 保存分块结果
   */
  async saveChunks() {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const chunksFile = path.join(this.outputDir, 'document-chunks.json');
    const output = {
      metadata: {
        totalChunks: this.chunks.length,
        totalDocuments: this.knowledgeBase.documents.length,
        chunkConfig: {
          chunkSize: this.config.chunkSize,
          chunkOverlap: this.config.chunkOverlap,
          minChunkSize: this.config.minChunkSize
        },
        createdAt: new Date().toISOString()
      },
      chunks: this.chunks
    };
    
    await fs.writeFile(chunksFile, JSON.stringify(output, null, 2));
    console.log(`💾 分块结果已保存: ${chunksFile}`);
  }

  /**
   * 调用OpenAI Embedding API
   */
  async getEmbeddings(texts) {
    if (!this.config.openaiApiKey) {
      throw new Error('缺少 OPENAI_API_KEY 环境变量');
    }
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.embeddingModel,
        input: texts,
        dimensions: this.config.embeddingDimensions
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API 错误: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.data.map(item => item.embedding);
  }

  /**
   * 批量向量化处理
   */
  async vectorizeChunks() {
    console.log('🧮 开始向量化处理...');
    
    const batches = [];
    for (let i = 0; i < this.chunks.length; i += this.config.batchSize) {
      batches.push(this.chunks.slice(i, i + this.config.batchSize));
    }
    
    console.log(`📦 将处理 ${batches.length} 个批次`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const texts = batch.map(chunk => chunk.content);
      
      try {
        console.log(`⏳ 处理批次 ${batchIndex + 1}/${batches.length} (${batch.length} 个chunks)`);
        
        // 调用embedding API
        const embeddings = await this.getEmbeddings(texts);
        
        // 创建向量条目
        for (let i = 0; i < batch.length; i++) {
          const chunk = batch[i];
          const embedding = embeddings[i];
          
          this.vectors.push({
            id: chunk.id,
            values: embedding,
            metadata: {
              content: chunk.content,
              title: chunk.title,
              documentId: chunk.documentId,
              chunkIndex: chunk.chunkIndex,
              type: chunk.metadata?.type || 'unknown',
              source: chunk.metadata?.source || 'unknown',
              ...chunk.metadata
            }
          });
        }
        
        console.log(`✅ 批次 ${batchIndex + 1} 完成`);
        
        // 避免API频率限制
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay));
        }
        
      } catch (error) {
        console.error(`❌ 批次 ${batchIndex + 1} 失败:`, error.message);
        throw error;
      }
    }
    
    console.log(`🎉 向量化完成: ${this.vectors.length} 个向量`);
  }

  /**
   * 上传向量到Cloudflare Vectorize
   */
  async uploadToVectorize() {
    if (!this.config.cloudflareAccountId || !this.config.cloudflareApiToken) {
      console.log('⚠️ 缺少Cloudflare配置，跳过向量上传');
      return;
    }
    
    console.log('☁️ 开始上传到Cloudflare Vectorize...');
    
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.config.cloudflareAccountId}/vectorize/indexes/${this.config.vectorizeIndexName}/upsert`;
    
    // 分批上传 (Vectorize API限制)
    const uploadBatchSize = 100;
    const uploadBatches = [];
    
    for (let i = 0; i < this.vectors.length; i += uploadBatchSize) {
      uploadBatches.push(this.vectors.slice(i, i + uploadBatchSize));
    }
    
    for (let batchIndex = 0; batchIndex < uploadBatches.length; batchIndex++) {
      const batch = uploadBatches[batchIndex];
      
      try {
        console.log(`⬆️ 上传批次 ${batchIndex + 1}/${uploadBatches.length}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.cloudflareApiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vectors: batch
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Vectorize API 错误: ${error.errors?.[0]?.message || response.statusText}`);
        }
        
        console.log(`✅ 批次 ${batchIndex + 1} 上传成功`);
        
      } catch (error) {
        console.error(`❌ 上传批次 ${batchIndex + 1} 失败:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 向量上传完成！');
  }

  /**
   * 保存向量数据到本地
   */
  async saveVectors() {
    const vectorsFile = path.join(this.outputDir, 'vectors.json');
    
    const output = {
      metadata: {
        totalVectors: this.vectors.length,
        embeddingModel: this.config.embeddingModel,
        dimensions: this.config.embeddingDimensions,
        createdAt: new Date().toISOString()
      },
      vectors: this.vectors
    };
    
    await fs.writeFile(vectorsFile, JSON.stringify(output, null, 2));
    console.log(`💾 向量数据已保存: ${vectorsFile}`);
  }

  /**
   * 主处理流程
   */
  async process() {
    try {
      console.log('🚀 SVTR RAG向量化处理开始...\n');
      
      // 1. 加载知识库
      await this.loadKnowledgeBase();
      
      // 2. 文档分块
      await this.processAllDocuments();
      
      // 3. 向量化
      await this.vectorizeChunks();
      
      // 4. 保存到本地
      await this.saveVectors();
      
      // 5. 上传到Cloudflare Vectorize
      await this.uploadToVectorize();
      
      console.log('\n🎉 RAG向量化处理完成！');
      console.log(`📊 统计信息:`);
      console.log(`  - 原始文档: ${this.knowledgeBase.documents.length}`);
      console.log(`  - 文档分块: ${this.chunks.length}`);
      console.log(`  - 向量数量: ${this.vectors.length}`);
      
    } catch (error) {
      console.error('\n❌ 向量化处理失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const vectorizer = new SVTRVectorizer();
  
  try {
    await vectorizer.process();
  } catch (error) {
    console.error('处理失败:', error.message);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  main();
}

module.exports = { SVTRVectorizer };