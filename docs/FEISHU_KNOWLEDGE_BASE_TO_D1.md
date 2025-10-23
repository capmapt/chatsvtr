# 飞书知识库全量同步到D1完整方案

## 一、方案概述

### 当前状态分析
您已经通过 `enhanced-feishu-sync-v2.js` 成功将飞书知识库同步为JSON文件：
- **263个节点**（docx: 192, sheet: 65, slides: 3, bitable: 2, file: 1）
- **完整内容**：平均2580字/节点
- **结构化元数据**：包含标题、类型、层级、创建时间等
- **RAG增强**：语义标签、搜索关键词、RAG评分

### 目标架构：D1 + Vectorize 混合存储

```
飞书知识库 (多种格式)
    ├── Wiki节点 (263个)
    ├── Docx文档 (192个)
    ├── Sheet表格 (65个)
    ├── Slides演示 (3个)
    ├── Bitable多维表 (2个)
    └── File文件 (1个)
         ↓ 同步脚本
D1数据库
    ├── knowledge_base_nodes (结构化元数据)
    ├── knowledge_base_content (完整内容)
    └── knowledge_base_relations (节点关系)
         ↓ 向量化
Cloudflare Vectorize
    └── SVTR_VECTORIZE (语义向量搜索)
         ↓ 前端查询
网站前端
    ├── 文章列表 (从D1读取)
    ├── 内容搜索 (D1 + Vectorize)
    ├── AI聊天 (RAG增强)
    └── 数据榜单 (多维表数据)
```

## 二、D1数据库Schema设计

### 2.1 知识库节点表（核心元数据）

```sql
CREATE TABLE IF NOT EXISTS knowledge_base_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 飞书标识
    node_token TEXT UNIQUE NOT NULL,
    obj_token TEXT NOT NULL,
    obj_type TEXT NOT NULL, -- docx, sheet, slides, bitable, file, wiki
    feishu_space_id TEXT DEFAULT '7321328173944340484',

    -- 基本信息
    title TEXT NOT NULL,
    node_level INTEGER DEFAULT 0,
    parent_token TEXT,
    has_child BOOLEAN DEFAULT 0,

    -- 内容摘要（用于快速预览）
    content_summary TEXT, -- 前200字
    content_length INTEGER DEFAULT 0,
    full_content_id INTEGER, -- 外键关联到 knowledge_base_content

    -- 分类和标签
    doc_type TEXT, -- docx, sheet, slides等
    search_keywords JSON, -- ["ai", "svtr", "创投"]
    semantic_tags JSON, -- ["svtr_platform", "artificial_intelligence"]

    -- RAG增强
    rag_score REAL DEFAULT 0,
    embedding_vector_id TEXT, -- Vectorize中的向量ID

    -- 访问控制
    is_public BOOLEAN DEFAULT 1,
    is_indexed BOOLEAN DEFAULT 1, -- 是否被搜索引擎索引
    visibility TEXT DEFAULT 'public', -- public, member_only, private

    -- 统计信息
    view_count INTEGER DEFAULT 0,
    last_viewed_at DATETIME,

    -- 飞书元数据
    feishu_create_time INTEGER,
    feishu_owner_id TEXT,
    feishu_url TEXT,

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- 索引
    FOREIGN KEY (full_content_id) REFERENCES knowledge_base_content (id)
);

-- 关键索引
CREATE INDEX idx_kb_nodes_type ON knowledge_base_nodes (obj_type, is_public);
CREATE INDEX idx_kb_nodes_level ON knowledge_base_nodes (node_level, parent_token);
CREATE INDEX idx_kb_nodes_rag ON knowledge_base_nodes (rag_score DESC);
CREATE INDEX idx_kb_nodes_sync ON knowledge_base_nodes (synced_at DESC);
CREATE INDEX idx_kb_nodes_token ON knowledge_base_nodes (node_token);
```

### 2.2 完整内容表（大文本分离存储）

```sql
CREATE TABLE IF NOT EXISTS knowledge_base_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_token TEXT UNIQUE NOT NULL,

    -- 完整内容（支持Markdown）
    full_content TEXT NOT NULL,
    content_format TEXT DEFAULT 'markdown', -- markdown, html, plain

    -- 内容元数据
    content_hash TEXT, -- 用于检测内容变更
    content_size INTEGER, -- 字节数

    -- 特殊类型处理
    sheet_data JSON, -- 表格数据（如果是sheet类型）
    bitable_data JSON, -- 多维表数据
    slide_images JSON, -- 演示文稿图片列表

    -- 时间戳
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (node_token) REFERENCES knowledge_base_nodes (node_token)
);

CREATE INDEX idx_kb_content_token ON knowledge_base_content (node_token);
CREATE INDEX idx_kb_content_hash ON knowledge_base_content (content_hash);
```

### 2.3 节点关系表（支持树形结构查询）

```sql
CREATE TABLE IF NOT EXISTS knowledge_base_relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    parent_token TEXT NOT NULL,
    child_token TEXT NOT NULL,
    relation_type TEXT DEFAULT 'parent_child', -- parent_child, related, referenced

    -- 关系权重（用于推荐）
    weight REAL DEFAULT 1.0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_token) REFERENCES knowledge_base_nodes (node_token),
    FOREIGN KEY (child_token) REFERENCES knowledge_base_nodes (node_token),

    UNIQUE(parent_token, child_token, relation_type)
);

CREATE INDEX idx_kb_rel_parent ON knowledge_base_relations (parent_token);
CREATE INDEX idx_kb_rel_child ON knowledge_base_relations (child_token);
```

### 2.4 文章发布表（专门用于内容社区展示）

```sql
CREATE TABLE IF NOT EXISTS published_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    node_token TEXT NOT NULL,

    -- 发布信息
    published_url TEXT, -- /pages/articles/xxx-StZ4wqMc.html
    slug TEXT UNIQUE, -- ai-2025-q2-StZ4wqMc

    -- SEO优化
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    og_image TEXT,

    -- 分类
    category TEXT, -- AI创投观察, 技术深度, 行业报告
    tags JSON,

    -- 互动数据
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,

    -- 状态
    status TEXT DEFAULT 'published', -- draft, published, archived
    is_featured BOOLEAN DEFAULT 0,
    publish_date DATE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (node_token) REFERENCES knowledge_base_nodes (node_token)
);

CREATE INDEX idx_articles_status ON published_articles (status, publish_date DESC);
CREATE INDEX idx_articles_category ON published_articles (category, is_featured);
```

## 三、数据同步脚本实现

### 3.1 核心同步类：scripts/feishu-knowledge-to-d1.js

```javascript
#!/usr/bin/env node

/**
 * 飞书知识库 → Cloudflare D1 完整同步脚本
 * 支持：docx, sheet, slides, bitable, file等多种格式
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FeishuKnowledgeToD1Sync {
  constructor(env) {
    this.env = env; // Cloudflare环境对象
    this.sourceFile = path.join(
      __dirname,
      '../assets/data/rag/enhanced-feishu-full-content.json'
    );
    this.stats = {
      total: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };
  }

  /**
   * 执行完整同步
   */
  async syncAll() {
    console.log('🚀 开始飞书知识库 → D1 同步...\n');

    try {
      // 1. 读取飞书知识库JSON数据
      const knowledgeBase = await this.loadFeishuData();
      console.log(`📚 加载了 ${knowledgeBase.nodes.length} 个知识节点\n`);

      // 2. 同步节点元数据
      await this.syncNodes(knowledgeBase.nodes);

      // 3. 同步完整内容
      await this.syncContent(knowledgeBase.nodes);

      // 4. 同步节点关系（树形结构）
      await this.syncRelations(knowledgeBase.nodes);

      // 5. 更新向量索引（如果启用Vectorize）
      if (this.env.SVTR_VECTORIZE) {
        await this.updateVectorIndex(knowledgeBase.nodes);
      }

      // 6. 生成文章URL映射
      await this.generateArticleURLs(knowledgeBase.nodes);

      console.log('\n✅ 同步完成！');
      console.log(`📊 统计：`);
      console.log(`  总计：${this.stats.total}`);
      console.log(`  新增：${this.stats.inserted}`);
      console.log(`  更新：${this.stats.updated}`);
      console.log(`  跳过：${this.stats.skipped}`);
      console.log(`  错误：${this.stats.errors.length}`);

      return this.stats;

    } catch (error) {
      console.error('❌ 同步失败:', error);
      throw error;
    }
  }

  /**
   * 加载飞书知识库JSON数据
   */
  async loadFeishuData() {
    const raw = await fs.readFile(this.sourceFile, 'utf8');
    const data = JSON.parse(raw);

    console.log('📋 知识库概览:');
    console.log(`  总节点数: ${data.summary.totalNodes}`);
    console.log(`  文档类型分布:`, data.summary.nodesByType);
    console.log(`  最后更新: ${data.summary.lastUpdated}\n`);

    return data;
  }

  /**
   * 同步节点元数据
   */
  async syncNodes(nodes) {
    console.log('🔄 同步节点元数据...');

    const batchSize = 500;
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);

      const statements = batch.map(node => {
        const data = this.mapNodeToSchema(node);

        return this.env.DB.prepare(`
          INSERT INTO knowledge_base_nodes (
            node_token, obj_token, obj_type, feishu_space_id,
            title, node_level, parent_token, has_child,
            content_summary, content_length,
            doc_type, search_keywords, semantic_tags,
            rag_score, is_public,
            feishu_create_time, feishu_owner_id, feishu_url,
            synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(node_token) DO UPDATE SET
            title = excluded.title,
            content_summary = excluded.content_summary,
            content_length = excluded.content_length,
            search_keywords = excluded.search_keywords,
            semantic_tags = excluded.semantic_tags,
            rag_score = excluded.rag_score,
            updated_at = CURRENT_TIMESTAMP,
            synced_at = CURRENT_TIMESTAMP
        `).bind(
          data.node_token,
          data.obj_token,
          data.obj_type,
          data.feishu_space_id,
          data.title,
          data.node_level,
          data.parent_token,
          data.has_child,
          data.content_summary,
          data.content_length,
          data.doc_type,
          data.search_keywords,
          data.semantic_tags,
          data.rag_score,
          data.is_public,
          data.feishu_create_time,
          data.feishu_owner_id,
          data.feishu_url
        );
      });

      await this.env.DB.batch(statements);

      this.stats.total += batch.length;
      console.log(`  已同步 ${Math.min(i + batchSize, nodes.length)} / ${nodes.length} 节点`);
    }

    console.log('✅ 节点元数据同步完成\n');
  }

  /**
   * 同步完整内容
   */
  async syncContent(nodes) {
    console.log('🔄 同步完整内容...');

    const batchSize = 100; // 内容较大，减少批次大小
    for (let i = 0; i < nodes.length; i += batchSize) {
      const batch = nodes.slice(i, i + batchSize);

      const statements = batch.map(node => {
        const contentHash = this.hashContent(node.content);

        return this.env.DB.prepare(`
          INSERT INTO knowledge_base_content (
            node_token, full_content, content_format,
            content_hash, content_size,
            sheet_data, bitable_data
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(node_token) DO UPDATE SET
            full_content = excluded.full_content,
            content_hash = excluded.content_hash,
            content_size = excluded.content_size,
            sheet_data = excluded.sheet_data,
            bitable_data = excluded.bitable_data,
            updated_at = CURRENT_TIMESTAMP
        `).bind(
          node.nodeToken,
          node.content || '',
          'markdown',
          contentHash,
          (node.content || '').length,
          node.objType === 'sheet' ? JSON.stringify(node.metadata?.sheetInfo || {}) : null,
          node.objType === 'bitable' ? JSON.stringify(node.metadata?.bitableInfo || {}) : null
        );
      });

      await this.env.DB.batch(statements);
      console.log(`  已同步 ${Math.min(i + batchSize, nodes.length)} / ${nodes.length} 内容`);
    }

    console.log('✅ 完整内容同步完成\n');
  }

  /**
   * 同步节点关系
   */
  async syncRelations(nodes) {
    console.log('🔄 同步节点关系...');

    const relations = [];

    nodes.forEach(node => {
      if (node.metadata?.parentToken) {
        relations.push({
          parent_token: node.metadata.parentToken,
          child_token: node.nodeToken,
          relation_type: 'parent_child',
          weight: 1.0
        });
      }
    });

    if (relations.length === 0) {
      console.log('⚠️  未发现节点关系\n');
      return;
    }

    const batchSize = 500;
    for (let i = 0; i < relations.length; i += batchSize) {
      const batch = relations.slice(i, i + batchSize);

      const statements = batch.map(rel => {
        return this.env.DB.prepare(`
          INSERT INTO knowledge_base_relations (
            parent_token, child_token, relation_type, weight
          ) VALUES (?, ?, ?, ?)
          ON CONFLICT(parent_token, child_token, relation_type) DO NOTHING
        `).bind(
          rel.parent_token,
          rel.child_token,
          rel.relation_type,
          rel.weight
        );
      });

      await this.env.DB.batch(statements);
    }

    console.log(`✅ 已同步 ${relations.length} 个节点关系\n`);
  }

  /**
   * 更新向量索引（用于RAG语义搜索）
   */
  async updateVectorIndex(nodes) {
    console.log('🔄 更新Vectorize向量索引...');

    // 过滤出高质量内容节点（RAG分数 > 40）
    const highQualityNodes = nodes.filter(n =>
      n.ragScore > 40 && n.content && n.content.length > 100
    );

    console.log(`  筛选出 ${highQualityNodes.length} 个高质量节点用于向量化`);

    for (const node of highQualityNodes) {
      try {
        // 生成embedding向量
        const embedding = await this.generateEmbedding(node.content);

        // 存储到Vectorize
        await this.env.SVTR_VECTORIZE.upsert([{
          id: node.nodeToken,
          values: embedding,
          metadata: {
            title: node.title,
            doc_type: node.docType,
            rag_score: node.ragScore,
            url: this.generateNodeURL(node)
          }
        }]);

        // 更新D1中的向量ID引用
        await this.env.DB.prepare(`
          UPDATE knowledge_base_nodes
          SET embedding_vector_id = ?
          WHERE node_token = ?
        `).bind(node.nodeToken, node.nodeToken).run();

      } catch (error) {
        console.warn(`  向量化失败: ${node.title} - ${error.message}`);
        this.stats.errors.push({
          node: node.nodeToken,
          error: error.message
        });
      }
    }

    console.log('✅ 向量索引更新完成\n');
  }

  /**
   * 生成文章URL映射（用于内容社区）
   */
  async generateArticleURLs(nodes) {
    console.log('🔄 生成文章URL映射...');

    // 筛选出文章类型节点（docx + 高质量分数）
    const articleNodes = nodes.filter(n =>
      n.objType === 'docx' &&
      n.ragScore > 45 &&
      n.contentLength > 500
    );

    console.log(`  发现 ${articleNodes.length} 篇可发布文章`);

    const statements = articleNodes.map(node => {
      const slug = this.generateSlug(node.title, node.nodeToken);
      const url = `/pages/articles/${slug}.html`;

      return this.env.DB.prepare(`
        INSERT INTO published_articles (
          node_token, published_url, slug,
          meta_title, category, tags,
          status, publish_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          meta_title = excluded.meta_title,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        node.nodeToken,
        url,
        slug,
        node.title,
        this.extractCategory(node),
        JSON.stringify(node.searchKeywords || []),
        'published',
        this.extractPublishDate(node)
      );
    });

    await this.env.DB.batch(statements);

    console.log('✅ 文章URL映射生成完成\n');
  }

  /**
   * 映射节点到数据库Schema
   */
  mapNodeToSchema(node) {
    return {
      node_token: node.nodeToken,
      obj_token: node.objToken,
      obj_type: node.objType,
      feishu_space_id: node.metadata?.spaceId || '7321328173944340484',
      title: node.title,
      node_level: node.level || 0,
      parent_token: node.metadata?.parentToken || null,
      has_child: node.metadata?.hasChild || false,
      content_summary: (node.content || '').substring(0, 200),
      content_length: node.contentLength || 0,
      doc_type: node.docType,
      search_keywords: JSON.stringify(node.searchKeywords || []),
      semantic_tags: JSON.stringify(node.semanticTags || []),
      rag_score: node.ragScore || 0,
      is_public: true,
      feishu_create_time: node.metadata?.createTime || null,
      feishu_owner_id: node.metadata?.owner_id || null,
      feishu_url: node.metadata?.url || null
    };
  }

  /**
   * 生成内容哈希（用于检测变更）
   */
  hashContent(content) {
    return crypto
      .createHash('sha256')
      .update(content || '')
      .digest('hex');
  }

  /**
   * 生成Embedding向量（使用Cloudflare Workers AI）
   */
  async generateEmbedding(text) {
    const response = await this.env.AI.run(
      '@cf/baai/bge-base-en-v1.5',
      { text: text.substring(0, 512) } // 限制长度
    );

    return response.data[0];
  }

  /**
   * 生成SEO友好的URL slug
   */
  generateSlug(title, nodeToken) {
    const shortToken = nodeToken.substring(nodeToken.length - 8);
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    return `${cleanTitle}-${shortToken}`;
  }

  /**
   * 提取分类
   */
  extractCategory(node) {
    const title = node.title.toLowerCase();
    if (title.includes('ai创投观察') || title.includes('融资')) return 'AI创投观察';
    if (title.includes('技术') || title.includes('模型')) return '技术深度';
    if (title.includes('报告') || title.includes('数据')) return '行业报告';
    return '综合分析';
  }

  /**
   * 提取发布日期
   */
  extractPublishDate(node) {
    // 从标题提取日期：如 "AI创投观察丨2025 Q3"
    const match = node.title.match(/20\d{2}[\s-]?Q[1-4]/i);
    if (match) {
      const year = match[0].substring(0, 4);
      const quarter = match[0].match(/Q(\d)/)[1];
      const month = (parseInt(quarter) - 1) * 3 + 1;
      return `${year}-${month.toString().padStart(2, '0')}-01`;
    }
    return node.lastUpdated || new Date().toISOString().split('T')[0];
  }

  /**
   * 生成节点URL
   */
  generateNodeURL(node) {
    return node.metadata?.url || `https://svtr.ai/kb/${node.nodeToken}`;
  }
}

// Worker入口（定时任务）
export default {
  async scheduled(event, env, ctx) {
    const syncer = new FeishuKnowledgeToD1Sync(env);
    await syncer.syncAll();
  }
};

// CLI入口
if (typeof module !== 'undefined' && require.main === module) {
  console.log('请使用 Cloudflare Workers 定时任务执行此脚本');
  console.log('或通过 wrangler dev 测试');
}

module.exports = FeishuKnowledgeToD1Sync;
```

## 四、前端API集成示例

### 4.1 文章列表API：functions/api/articles/list.ts

```typescript
export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // 查询参数
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  // SQL查询
  const query = `
    SELECT
      a.id,
      a.slug,
      a.published_url,
      a.meta_title,
      a.category,
      a.tags,
      a.view_count,
      a.publish_date,
      n.title,
      n.content_summary,
      n.rag_score,
      n.doc_type
    FROM published_articles a
    JOIN knowledge_base_nodes n ON a.node_token = n.node_token
    WHERE a.status = 'published'
      ${category ? 'AND a.category = ?' : ''}
    ORDER BY a.publish_date DESC, a.is_featured DESC
    LIMIT ? OFFSET ?
  `;

  const params = category
    ? [category, limit, offset]
    : [limit, offset];

  const results = await env.DB.prepare(query)
    .bind(...params)
    .all();

  // 获取总数
  const countQuery = `
    SELECT COUNT(*) as total
    FROM published_articles
    WHERE status = 'published'
      ${category ? 'AND category = ?' : ''}
  `;

  const countParams = category ? [category] : [];
  const { total } = await env.DB.prepare(countQuery)
    .bind(...countParams)
    .first();

  return Response.json({
    success: true,
    data: {
      articles: results.results,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    }
  });
}
```

### 4.2 知识库搜索API：functions/api/knowledge/search.ts

```typescript
export async function onRequest(context) {
  const { env, request } = context;
  const { query, type, minScore } = await request.json();

  // 方案1: 简单文本搜索（使用LIKE）
  const simpleResults = await env.DB.prepare(`
    SELECT
      node_token,
      title,
      content_summary,
      doc_type,
      rag_score,
      search_keywords,
      semantic_tags
    FROM knowledge_base_nodes
    WHERE is_public = 1
      AND (
        title LIKE ?
        OR content_summary LIKE ?
        OR search_keywords LIKE ?
      )
      ${type ? 'AND doc_type = ?' : ''}
      ${minScore ? 'AND rag_score >= ?' : ''}
    ORDER BY rag_score DESC
    LIMIT 50
  `).bind(
    `%${query}%`,
    `%${query}%`,
    `%${query}%`,
    ...(type ? [type] : []),
    ...(minScore ? [minScore] : [])
  ).all();

  // 方案2: 语义搜索（使用Vectorize）
  let semanticResults = [];
  if (env.SVTR_VECTORIZE) {
    const queryEmbedding = await env.AI.run(
      '@cf/baai/bge-base-en-v1.5',
      { text: query }
    );

    const vectorMatches = await env.SVTR_VECTORIZE.query(
      queryEmbedding.data[0],
      { topK: 10 }
    );

    semanticResults = vectorMatches.matches.map(m => ({
      node_token: m.id,
      ...m.metadata,
      similarity: m.score
    }));
  }

  return Response.json({
    success: true,
    data: {
      text_search: simpleResults.results,
      semantic_search: semanticResults,
      query
    }
  });
}
```

### 4.3 文章内容获取API：functions/api/articles/[slug].ts

```typescript
export async function onRequest(context) {
  const { env, params } = context;
  const slug = params.slug;

  // 查询文章完整信息
  const article = await env.DB.prepare(`
    SELECT
      a.*,
      n.title,
      n.doc_type,
      n.search_keywords,
      n.semantic_tags,
      n.rag_score,
      c.full_content,
      c.content_format
    FROM published_articles a
    JOIN knowledge_base_nodes n ON a.node_token = n.node_token
    JOIN knowledge_base_content c ON a.node_token = c.node_token
    WHERE a.slug = ? AND a.status = 'published'
  `).bind(slug).first();

  if (!article) {
    return new Response('文章未找到', { status: 404 });
  }

  // 增加浏览计数
  await env.DB.prepare(`
    UPDATE published_articles
    SET view_count = view_count + 1
    WHERE slug = ?
  `).bind(slug).run();

  await env.DB.prepare(`
    UPDATE knowledge_base_nodes
    SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP
    WHERE node_token = ?
  `).bind(article.node_token).run();

  // 获取相关文章（基于标签）
  const relatedArticles = await env.DB.prepare(`
    SELECT slug, meta_title, category, publish_date
    FROM published_articles
    WHERE status = 'published'
      AND slug != ?
      AND category = ?
    ORDER BY publish_date DESC
    LIMIT 5
  `).bind(slug, article.category).all();

  return Response.json({
    success: true,
    data: {
      article: {
        ...article,
        search_keywords: JSON.parse(article.search_keywords),
        semantic_tags: JSON.parse(article.semantic_tags),
        tags: JSON.parse(article.tags)
      },
      related: relatedArticles.results
    }
  });
}
```

## 五、定时同步配置

### 5.1 wrangler.toml配置

```toml
# D1数据库绑定
[[d1_databases]]
binding = "DB"
database_name = "svtr-production"
database_id = "your-database-id"

# Vectorize绑定（已有）
[[vectorize]]
binding = "SVTR_VECTORIZE"
index_name = "autorag-svtr-knowledge-base-ai"

# AI绑定（已有）
[ai]
binding = "AI"

# 定时任务：每天凌晨2点同步知识库
[triggers]
crons = [
  "0 2 * * *"  # UTC时间
]
```

### 5.2 Worker入口：workers/knowledge-sync-worker.js

```javascript
import { FeishuKnowledgeToD1Sync } from '../scripts/feishu-knowledge-to-d1.js';

export default {
  async scheduled(event, env, ctx) {
    console.log('⏰ 定时任务触发：飞书知识库同步');

    const syncer = new FeishuKnowledgeToD1Sync(env);
    const result = await syncer.syncAll();

    console.log('✅ 同步完成:', result);

    // 发送通知（可选）
    if (result.errors.length > 0) {
      console.warn(`⚠️ 同步过程中有 ${result.errors.length} 个错误`);
    }
  }
};
```

## 六、使用场景对比

### 场景1：内容社区文章列表

**之前（JSON文件）**：
```javascript
// 前端需要下载整个263个节点的JSON (>600KB)
const response = await fetch('/assets/data/rag/enhanced-feishu-full-content.json');
const data = await response.json();
const articles = data.nodes.filter(n => n.objType === 'docx');
```

**现在（D1数据库）**：
```javascript
// 前端只请求需要的20篇文章 (<10KB)
const response = await fetch('/api/articles/list?limit=20&category=AI创投观察');
const { articles } = await response.json();
```

**性能提升**：60倍+（600KB → 10KB）

---

### 场景2：文章搜索

**之前（JSON文件）**：
```javascript
// 客户端全量搜索，无法使用索引
const results = data.nodes.filter(n =>
  n.title.includes(query) || n.content.includes(query)
);
```

**现在（D1 + Vectorize）**：
```javascript
// 服务端索引搜索 + 语义理解
const response = await fetch('/api/knowledge/search', {
  method: 'POST',
  body: JSON.stringify({ query: '2025年AI融资趋势' })
});
const { text_search, semantic_search } = await response.json();
```

**性能提升**：100倍+（客户端扫描 → 服务端索引查询）

---

### 场景3：AI聊天RAG增强

**之前（JSON文件）**：
```javascript
// 需要把整个JSON传给AI（token消耗巨大）
const context = JSON.stringify(data.nodes);
const aiResponse = await ai.run({ context, query });
```

**现在（D1 + Vectorize）**：
```javascript
// 只传递相关的3-5个文档片段
const relevantDocs = await vectorize.query(queryEmbedding, { topK: 5 });
const context = relevantDocs.map(d => d.metadata.content_summary).join('\n');
const aiResponse = await ai.run({ context, query });
```

**Token节省**：90%+（10万token → 1万token）

## 七、实施计划

### 第1步：创建D1数据库和Schema（1天）
```bash
npx wrangler d1 create svtr-production
npx wrangler d1 execute svtr-production --remote --file=./database/knowledge-base-schema.sql
```

### 第2步：开发同步脚本（2天）
- 实现 `FeishuKnowledgeToD1Sync` 类
- 测试节点、内容、关系同步
- 验证数据完整性

### 第3步：配置定时任务（0.5天）
- 更新 `wrangler.toml`
- 部署Worker
- 测试定时执行

### 第4步：开发API端点（2天）
- 文章列表API
- 搜索API
- 文章详情API
- 分类/标签API

### 第5步：前端集成（2天）
- 更新内容社区页面
- 集成文章列表组件
- 添加搜索功能
- 优化SEO

### 总计：7.5天完成

## 八、数据迁移策略

### 方案A：一次性全量迁移（推荐）
- 适合首次上线
- 停机时间：~10分钟
- 步骤：运行一次完整同步 → 验证数据 → 切换前端

### 方案B：增量迁移（风险低）
- 适合平滑过渡
- 双写模式：同时写JSON和D1
- 步骤：
  1. 启用D1同步（JSON仍然工作）
  2. 验证D1数据正确性（1周）
  3. 前端逐步切换到D1 API
  4. 弃用JSON文件

## 九、成本估算

### D1存储成本
- 263个节点 × 平均2.5KB = 658KB（远低于5GB免费额度）
- 每日同步1次 × 30天 = 30次（远低于10万次免费额度）
- **成本：$0（完全免费）**

### Vectorize成本
- 263个向量 × 768维度 = 202,944个值（低于1000万免费额度）
- **成本：$0（完全免费）**

### Workers AI成本
- 每天生成263个embedding × 30天 = 7,890次（低于1万次免费额度）
- **成本：$0（完全免费）**

## 十、监控和维护

### 同步健康监控
```sql
-- 检查最近同步状态
SELECT
  DATE(synced_at) as sync_date,
  COUNT(*) as nodes_synced,
  AVG(rag_score) as avg_quality
FROM knowledge_base_nodes
WHERE synced_at > datetime('now', '-7 days')
GROUP BY DATE(synced_at)
ORDER BY sync_date DESC;
```

### 数据完整性检查
```sql
-- 检查缺失内容的节点
SELECT COUNT(*) as nodes_without_content
FROM knowledge_base_nodes n
LEFT JOIN knowledge_base_content c ON n.node_token = c.node_token
WHERE c.id IS NULL;
```

### 性能监控
```sql
-- 查看最热门内容
SELECT title, view_count, last_viewed_at
FROM knowledge_base_nodes
WHERE is_public = 1
ORDER BY view_count DESC
LIMIT 20;
```

## 十一、FAQ

### Q1: JSON文件还需要保留吗？
**A**: 建议保留作为备份，但前端不再使用。同步脚本仍然从JSON读取数据。

### Q2: 如果飞书内容更新，多久能在网站看到？
**A**:
- 定时任步：每天凌晨2点自动更新
- 手动触发：随时可以手动执行同步脚本
- Webhook实时更新（可选）：配置飞书Webhook可实现实时推送

### Q3: D1能否支持263个节点的并发查询？
**A**: 完全可以。D1基于SQLite，支持数千QPS并发查询，263个节点量级非常小。

### Q4: 搜索性能如何？
**A**:
- 简单文本搜索：<50ms
- 语义向量搜索：<100ms
- 远优于客户端JSON全文扫描（>500ms）

### Q5: 是否支持多语言内容？
**A**: 完全支持。UTF-8编码，中英文混合检索无问题。

## 十二、下一步扩展

完成知识库同步后，可以进一步扩展：

1. **实时更新**：配置飞书Webhook，内容修改后立即同步
2. **全文搜索**：引入Cloudflare Workers Search（Beta）
3. **内容推荐**：基于用户浏览历史和向量相似度推荐
4. **数据分析**：统计热门内容、用户阅读时长等
5. **多语言支持**：使用Workers AI翻译内容
6. **评论系统**：在D1中添加评论表
7. **版本控制**：记录内容修改历史

---

**总结**：将飞书知识库同步到D1是一个**性能、成本、可扩展性全面优于JSON文件**的方案，强烈推荐实施！
