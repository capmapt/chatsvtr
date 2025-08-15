# SVTR.AI RAG系统实现设计

## 🏗️ 系统架构设计

### 当前状态分析
✅ **现有基础**：
- 飞书API集成脚本 (`sync-feishu-data.js`) 
- Cloudflare Workers AI聊天API (`functions/api/chat.ts`)
- 前端聊天组件 (`assets/js/chat.js`)
- 硬编码的AI创投数据（需要替换为真实RAG）

### 📊 数据流设计

```
飞书知识库    →    数据ETL    →    向量化    →    Cloudflare Vectorize
    ↓                ↓             ↓              ↓
知识库文档    →    结构化清理  →    Embeddings  →    语义检索
多维表格     →    JSON转换   →    文档分块    →    相关性匹配
AI创投库     →    去重去噪   →    元数据标注   →    上下文增强
```

### 🔧 技术架构

#### 数据层 (Data Layer)
```typescript
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  type: 'wiki' | 'bitable' | 'doc';
  source: string;
  lastUpdated: string;
  tags: string[];
  metadata: {
    company?: string;
    round?: string;
    valuation?: string;
    industry?: string;
  };
}
```

#### 向量层 (Vector Layer)
```typescript
interface VectorEntry {
  id: string;
  vector: number[]; // 768维向量 (OpenAI ada-002)
  metadata: {
    documentId: string;
    chunkIndex: number;
    content: string;
    title: string;
    type: string;
    relevanceScore?: number;
  };
}
```

#### 检索层 (Retrieval Layer)
```typescript
interface RAGContext {
  query: string;
  matches: VectorMatch[];
  enhancedPrompt: string;
  sources: string[];
}
```

## 🚀 实施计划

### Phase 1: 数据管道增强 (2-3天)
**目标**: 扩展现有飞书同步，支持全量知识库数据

**任务**:
1. **扩展飞书同步脚本**
   ```bash
   # 新增同步功能
   npm run sync:knowledge  # 同步完整知识库
   npm run sync:companies  # 同步AI创投库
   npm run sync:all        # 全量同步
   ```

2. **数据清洗和结构化**
   - 文档去重和去噪
   - 统一格式化输出
   - 元数据提取和标注

3. **增量更新机制**
   - 检测文档变更
   - 智能增量同步
   - 版本控制和回滚

### Phase 2: 向量化系统 (2-3天) 
**目标**: 实现文档向量化和Cloudflare Vectorize集成

**任务**:
1. **配置Cloudflare Vectorize**
   ```toml
   # wrangler.toml
   [[vectorize]]
   binding = "SVTR_VECTORIZE" 
   index_name = "svtr-knowledge-base"
   dimensions = 1536  # OpenAI ada-002
   metric = "cosine"
   ```

2. **实现向量化管道**
   ```typescript
   // 文档分块策略
   const chunkDocument = (doc: string) => {
     // 智能分块：保持语义完整性
     // 重叠策略：避免信息丢失
     // 大小控制：适配embedding模型
   };
   ```

3. **批量向量化处理**
   - OpenAI Embeddings API集成
   - 批量处理优化
   - 错误处理和重试

### Phase 3: RAG检索引擎 (2天)
**目标**: 实现智能语义检索和上下文增强

**任务**:
1. **语义检索算法**
   ```typescript
   async function semanticSearch(
     query: string, 
     options: { topK: number; threshold: number }
   ): Promise<SearchResult[]> {
     // 查询向量化
     // 相似度搜索  
     // 结果排序和过滤
   }
   ```

2. **上下文增强策略**
   - 多文档信息融合
   - 重复信息去除
   - 来源标注和可信度

3. **检索优化**
   - 查询扩展和改写
   - 混合检索策略
   - 缓存和性能优化

### Phase 4: Chat API集成 (1天)
**目标**: 将RAG功能集成到现有聊天API

**任务**:
1. **增强现有Chat API**
   ```typescript
   // functions/api/chat.ts 升级
   async function enhancedChatAPI(messages: Message[]) {
     const userQuery = messages[messages.length - 1].content;
     
     // RAG检索
     const ragContext = await performRAGSearch(userQuery);
     
     // 提示词增强
     const enhancedPrompt = buildEnhancedPrompt(ragContext);
     
     // LLM生成
     return generateResponse(enhancedPrompt, messages);
   }
   ```

2. **提示词工程优化**
   - RAG-aware系统提示词
   - 动态上下文注入
   - 来源引用格式

## 💡 核心技术实现

### 智能文档分块
```typescript
class DocumentChunker {
  private maxChunkSize = 1000;
  private overlapSize = 200;
  
  chunkDocument(doc: KnowledgeDocument): DocumentChunk[] {
    // 1. 按段落和语义边界分割
    // 2. 保持重要信息完整性
    // 3. 添加上下文重叠
    // 4. 生成有意义的chunk标题
  }
}
```

### 混合检索策略
```typescript
class HybridRetriever {
  async search(query: string): Promise<SearchResult[]> {
    // 1. 语义向量检索 (主要)
    const semanticResults = await this.vectorSearch(query);
    
    // 2. 关键词匹配 (补充)
    const keywordResults = await this.keywordSearch(query);
    
    // 3. 结果融合和排序
    return this.fuseResults(semanticResults, keywordResults);
  }
}
```

### 上下文质量控制
```typescript
class ContextBuilder {
  buildContext(results: SearchResult[]): EnhancedContext {
    // 1. 去重和去噪
    const deduped = this.deduplicateContent(results);
    
    // 2. 相关性过滤
    const filtered = this.filterByRelevance(deduped, 0.7);
    
    // 3. 信息密度排序
    const ranked = this.rankByInformationDensity(filtered);
    
    // 4. 构建结构化上下文
    return this.buildStructuredContext(ranked);
  }
}
```

## 📈 预期效果

### 质量提升指标
- **专业度**: 90%+ 基于SVTR真实数据回答
- **准确性**: 减少80%的事实性错误
- **时效性**: 24小时内数据同步更新
- **相关性**: 85%+ 用户满意度

### 技术性能指标  
- **检索延迟**: <200ms (P95)
- **生成延迟**: <3s (端到端)
- **成本控制**: <$100/月 (预估)
- **可用性**: 99.5%+ SLA

## 🔒 安全和隐私

### 数据安全
- 飞书API密钥加密存储
- 向量数据脱敏处理
- 用户查询日志保护

### 内容控制
- 敏感信息过滤
- 商业机密保护
- 合规性检查机制

## 📊 监控和运维

### 关键指标监控
```typescript
interface RAGMetrics {
  searchLatency: number;
  retrievalAccuracy: number;
  userSatisfaction: number;
  dataFreshness: number;
  costPerQuery: number;
}
```

### 运维自动化
- 数据同步状态监控
- 向量索引健康检查
- 异常恢复机制
- 性能优化建议

---

**实施优先级**: 🚀 High Priority
**预估工作量**: 7-9个开发日
**技术风险**: 🟡 Medium (Cloudflare Vectorize依赖)
**预期ROI**: 显著提升用户体验和专业度