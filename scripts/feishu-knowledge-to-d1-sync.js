#!/usr/bin/env node

/**
 * 飞书知识库 → Cloudflare D1 完整同步脚本
 * 功能:
 * 1. 读取 enhanced-feishu-full-content.json
 * 2. 批量同步到D1数据库
 * 3. 生成文章URL映射
 * 4. 记录同步日志
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FeishuKnowledgeToD1Sync {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.sourceFile = path.join(
      this.projectRoot,
      'assets/data/rag/enhanced-feishu-full-content.json'
    );
    this.stats = {
      total: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      startTime: Date.now()
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

      // 2. 生成SQL语句（可以直接执行或通过Wrangler CLI执行）
      await this.generateSyncSQL(knowledgeBase.nodes);

      // 3. 生成统计报告
      this.printStats();

      console.log('\n✅ 同步脚本执行完成！');
      console.log('\n📝 下一步操作：');
      console.log('1. 在Cloudflare Dashboard创建D1数据库 "svtr-production"');
      console.log('2. 执行Schema: npx wrangler d1 execute svtr-production --remote --file=./database/d1-complete-schema.sql');
      console.log('3. 执行同步: npx wrangler d1 execute svtr-production --remote --file=./database/sync-data.sql');

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
    try {
      const raw = await fs.readFile(this.sourceFile, 'utf8');
      const data = JSON.parse(raw);

      console.log('📋 知识库概览:');
      console.log(`  总节点数: ${data.summary.totalNodes}`);
      console.log(`  文档类型分布:`, data.summary.nodesByType);
      console.log(`  平均内容长度: ${data.summary.avgContentLength} 字符`);
      console.log(`  平均RAG评分: ${data.summary.avgRagScore.toFixed(2)}`);
      console.log(`  最后更新: ${data.summary.lastUpdated}\n`);

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error('❌ 未找到飞书知识库数据文件:', this.sourceFile);
        console.log('\n💡 请先运行同步脚本生成数据:');
        console.log('   npm run sync:enhanced');
      }
      throw error;
    }
  }

  /**
   * 生成同步SQL语句
   */
  async generateSyncSQL(nodes) {
    console.log('🔄 生成SQL同步语句...\n');

    const outputFile = path.join(this.projectRoot, 'database/sync-data.sql');
    let sql = '-- 飞书知识库数据同步SQL\n';
    sql += `-- 生成时间: ${new Date().toISOString()}\n`;
    sql += `-- 总节点数: ${nodes.length}\n\n`;

    sql += 'BEGIN TRANSACTION;\n\n';

    // 1. 同步节点元数据
    console.log('📝 处理节点元数据...');
    for (const node of nodes) {
      try {
        const nodeData = this.mapNodeToSchema(node);
        sql += this.generateNodeInsertSQL(nodeData);
        this.stats.total++;
      } catch (error) {
        this.stats.errors.push({
          node: node.nodeToken,
          error: error.message
        });
      }
    }

    // 2. 同步完整内容
    console.log('📝 处理完整内容...');
    for (const node of nodes) {
      try {
        sql += this.generateContentInsertSQL(node);
      } catch (error) {
        this.stats.errors.push({
          node: node.nodeToken,
          error: error.message
        });
      }
    }

    // 3. 同步节点关系
    console.log('📝 处理节点关系...');
    const relations = this.extractRelations(nodes);
    for (const rel of relations) {
      sql += this.generateRelationInsertSQL(rel);
    }

    // 4. 生成文章URL映射
    console.log('📝 生成文章URL映射...');
    const articles = this.extractArticles(nodes);
    for (const article of articles) {
      sql += this.generateArticleInsertSQL(article);
    }

    sql += '\nCOMMIT;\n';

    // 保存SQL文件
    await fs.writeFile(outputFile, sql, 'utf8');
    console.log(`\n✅ SQL文件已生成: ${outputFile}`);
    console.log(`   文件大小: ${(Buffer.byteLength(sql, 'utf8') / 1024).toFixed(2)} KB\n`);
  }

  /**
   * 映射节点到数据库Schema
   */
  mapNodeToSchema(node) {
    return {
      node_token: node.nodeToken,
      obj_token: node.objToken,
      obj_type: node.objType,
      feishu_space_id: '7321328173944340484',
      title: this.escape(node.title),
      node_level: node.level || 0,
      parent_token: node.metadata?.parentToken || null,
      has_child: node.metadata?.hasChild ? 1 : 0,
      content_summary: this.escape((node.content || '').substring(0, 200)),
      content_length: node.contentLength || 0,
      doc_type: node.docType,
      search_keywords: JSON.stringify(node.searchKeywords || []),
      semantic_tags: JSON.stringify(node.semanticTags || []),
      rag_score: node.ragScore || 0,
      is_public: 1,
      feishu_create_time: node.metadata?.createTime || null,
      feishu_owner_id: node.metadata?.owner_id || null,
      feishu_url: node.metadata?.url || null
    };
  }

  /**
   * 生成节点插入SQL
   */
  generateNodeInsertSQL(data) {
    return `INSERT OR REPLACE INTO knowledge_base_nodes (
  node_token, obj_token, obj_type, feishu_space_id, title, node_level,
  parent_token, has_child, content_summary, content_length, doc_type,
  search_keywords, semantic_tags, rag_score, is_public,
  feishu_create_time, feishu_owner_id, feishu_url, synced_at
) VALUES (
  '${data.node_token}',
  '${data.obj_token}',
  '${data.obj_type}',
  '${data.feishu_space_id}',
  '${data.title}',
  ${data.node_level},
  ${data.parent_token ? `'${data.parent_token}'` : 'NULL'},
  ${data.has_child},
  '${data.content_summary}',
  ${data.content_length},
  '${data.doc_type}',
  '${this.escape(data.search_keywords)}',
  '${this.escape(data.semantic_tags)}',
  ${data.rag_score},
  ${data.is_public},
  ${data.feishu_create_time || 'NULL'},
  ${data.feishu_owner_id ? `'${data.feishu_owner_id}'` : 'NULL'},
  ${data.feishu_url ? `'${data.feishu_url}'` : 'NULL'},
  CURRENT_TIMESTAMP
);\n\n`;
  }

  /**
   * 生成内容插入SQL
   */
  generateContentInsertSQL(node) {
    const content = this.escape(node.content || '');
    const contentHash = this.hashContent(node.content || '');

    return `INSERT OR REPLACE INTO knowledge_base_content (
  node_token, full_content, content_format, content_hash, content_size
) VALUES (
  '${node.nodeToken}',
  '${content}',
  'markdown',
  '${contentHash}',
  ${(node.content || '').length}
);\n\n`;
  }

  /**
   * 提取节点关系
   */
  extractRelations(nodes) {
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

    return relations;
  }

  /**
   * 生成关系插入SQL
   */
  generateRelationInsertSQL(rel) {
    return `INSERT OR IGNORE INTO knowledge_base_relations (
  parent_token, child_token, relation_type, weight
) VALUES (
  '${rel.parent_token}',
  '${rel.child_token}',
  '${rel.relation_type}',
  ${rel.weight}
);\n`;
  }

  /**
   * 提取可发布文章
   */
  extractArticles(nodes) {
    return nodes
      .filter(n =>
        n.objType === 'docx' &&
        n.ragScore > 45 &&
        n.contentLength > 500
      )
      .map(node => {
        const slug = this.generateSlug(node.title, node.nodeToken);
        return {
          node_token: node.nodeToken,
          slug,
          published_url: `/pages/articles/${slug}.html`,
          meta_title: this.escape(node.title),
          category: this.extractCategory(node.title),
          tags: JSON.stringify(node.searchKeywords || []),
          publish_date: this.extractPublishDate(node)
        };
      });
  }

  /**
   * 生成文章插入SQL
   */
  generateArticleInsertSQL(article) {
    return `INSERT OR REPLACE INTO published_articles (
  node_token, slug, published_url, meta_title, category, tags, status, publish_date
) VALUES (
  '${article.node_token}',
  '${article.slug}',
  '${article.published_url}',
  '${article.meta_title}',
  '${article.category}',
  '${this.escape(article.tags)}',
  'published',
  '${article.publish_date}'
);\n\n`;
  }

  /**
   * 生成SEO友好的URL slug
   */
  generateSlug(title, nodeToken) {
    const shortToken = nodeToken.substring(nodeToken.length - 8);

    // 移除特殊字符，保留中文、英文、数字
    const cleanTitle = title
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    return `${cleanTitle}-${shortToken}`.toLowerCase();
  }

  /**
   * 提取分类
   */
  extractCategory(title) {
    if (title.includes('AI创投观察') || title.includes('融资')) return 'AI创投观察';
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
   * 生成内容哈希
   */
  hashContent(content) {
    return crypto
      .createHash('sha256')
      .update(content || '')
      .digest('hex');
  }

  /**
   * 转义SQL字符串
   */
  escape(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "''").replace(/\n/g, ' ').replace(/\r/g, '');
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const duration = Date.now() - this.stats.startTime;

    console.log('\n📊 同步统计:');
    console.log(`  总节点数: ${this.stats.total}`);
    console.log(`  错误数量: ${this.stats.errors.length}`);
    console.log(`  耗时: ${(duration / 1000).toFixed(2)} 秒\n`);

    if (this.stats.errors.length > 0) {
      console.log('⚠️  错误详情:');
      this.stats.errors.slice(0, 5).forEach(err => {
        console.log(`  - ${err.node}: ${err.error}`);
      });
      if (this.stats.errors.length > 5) {
        console.log(`  ... 还有 ${this.stats.errors.length - 5} 个错误\n`);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('🤖 SVTR飞书知识库 → D1 数据库同步\n');

  try {
    const syncer = new FeishuKnowledgeToD1Sync();
    await syncer.syncAll();

    process.exit(0);
  } catch (error) {
    console.error('\n💥 同步失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = FeishuKnowledgeToD1Sync;
