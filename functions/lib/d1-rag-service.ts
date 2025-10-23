/**
 * D1 Database RAG Service
 * 基于D1数据库的RAG检索服务 - Phase 2.1实施
 *
 * 功能:
 * 1. D1数据库关键词检索
 * 2. Sheet隐藏工作表数据提取
 * 3. 多策略混合检索（D1 + JSON fallback）
 * 4. 查询性能优化
 */

export interface D1RAGOptions {
  maxResults?: number;          // 最大返回结果数（默认8）
  includeHiddenSheets?: boolean; // 是否包含隐藏工作表（默认true）
  searchTables?: string[];       // 要搜索的表（默认所有）
  threshold?: number;            // 相关性阈值（0-1，默认0.3）
  enableCache?: boolean;         // 是否启用缓存（默认true）
}

export interface D1RAGMatch {
  node_token: string;     // 节点ID
  title: string;          // 标题
  obj_type: string;       // 类型（docx/sheet/bitable）
  content: string;        // 内容片段
  summary: string;        // 摘要
  score: number;          // 相关性分数
  source: string;         // 数据源
  worksheet_name?: string; // 工作表名称（仅Sheet）
  is_hidden?: boolean;    // 是否隐藏工作表（仅Sheet）
}

export interface D1RAGResult {
  matches: D1RAGMatch[];
  total: number;
  query: string;
  responseTime: number;
  fromCache: boolean;
  strategy: string;
}

export class D1RAGService {
  private db: D1Database;
  private cache?: KVNamespace;

  constructor(db: D1Database, cache?: KVNamespace) {
    this.db = db;
    this.cache = cache;
  }

  /**
   * 执行D1 RAG检索
   */
  async retrieve(query: string, options: D1RAGOptions = {}): Promise<D1RAGResult> {
    const startTime = Date.now();

    // 设置默认选项
    const opts: Required<D1RAGOptions> = {
      maxResults: options.maxResults || 8,
      includeHiddenSheets: options.includeHiddenSheets !== false,
      searchTables: options.searchTables || ['knowledge_base_content', 'sheet_data_index'],
      threshold: options.threshold || 0.3,
      enableCache: options.enableCache !== false
    };

    console.log('🔍 [D1 RAG] 开始检索:', query);
    console.log('📋 [D1 RAG] 选项:', opts);

    // 尝试从缓存读取
    if (opts.enableCache && this.cache) {
      const cached = await this.getCachedResult(query, opts);
      if (cached) {
        console.log('✅ [D1 RAG] 使用缓存结果');
        return cached;
      }
    }

    // 提取关键词
    const keywords = this.extractKeywords(query);
    console.log('🔑 [D1 RAG] 提取关键词:', keywords);

    // 执行多策略检索
    const results = await Promise.allSettled([
      this.searchKnowledgeBase(keywords, opts),
      opts.includeHiddenSheets ? this.searchSheetData(keywords, opts) : Promise.resolve([])
    ]);

    // 合并结果
    const allMatches: D1RAGMatch[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        const strategyName = index === 0 ? 'knowledge_base' : 'sheet_data';
        console.log(`✅ [D1 RAG] ${strategyName} 检索成功: ${result.value.length}条`);
        allMatches.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`❌ [D1 RAG] 检索策略 ${index} 失败:`, result.reason);
      }
    });

    // 去重和评分
    const deduplicated = this.deduplicateMatches(allMatches);
    const scored = this.scoreMatches(deduplicated, keywords);

    // 过滤低分结果
    const filtered = scored.filter(m => m.score >= opts.threshold);

    // 排序并限制数量
    const finalMatches = filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, opts.maxResults);

    console.log(`📊 [D1 RAG] 最终结果: ${finalMatches.length}/${allMatches.length} (去重前: ${allMatches.length})`);

    const result: D1RAGResult = {
      matches: finalMatches,
      total: allMatches.length,
      query,
      responseTime: Date.now() - startTime,
      fromCache: false,
      strategy: 'd1_hybrid'
    };

    // 缓存结果
    if (opts.enableCache && this.cache && finalMatches.length > 0) {
      await this.cacheResult(query, opts, result);
    }

    return result;
  }

  /**
   * 搜索知识库内容表
   */
  private async searchKnowledgeBase(keywords: string[], options: Required<D1RAGOptions>): Promise<D1RAGMatch[]> {
    const matches: D1RAGMatch[] = [];

    // 构建SQL查询（关键词匹配）- 需要JOIN nodes和content表
    const conditions = keywords.map(() =>
      `(n.title LIKE ? OR c.full_content LIKE ? OR n.content_summary LIKE ?)`
    ).join(' OR ');

    const bindings = keywords.flatMap(kw => {
      const pattern = `%${kw}%`;
      return [pattern, pattern, pattern];
    });

    const sql = `
      SELECT
        n.node_token,
        n.title,
        n.obj_type,
        SUBSTR(c.full_content, 1, 500) as content,
        n.content_summary as summary,
        LENGTH(c.full_content) as content_length
      FROM knowledge_base_nodes n
      INNER JOIN knowledge_base_content c ON n.node_token = c.node_token
      WHERE n.is_public = 1
        AND n.is_indexed = 1
        AND (${conditions})
      ORDER BY content_length DESC
      LIMIT ?
    `;

    try {
      const result = await this.db.prepare(sql)
        .bind(...bindings, options.maxResults * 2) // 多取一些，后续再过滤
        .all();

      if (result.results) {
        result.results.forEach((row: any) => {
          matches.push({
            node_token: row.node_token,
            title: row.title,
            obj_type: row.obj_type,
            content: row.content || '',
            summary: row.summary || '',
            score: 0, // 稍后计算
            source: 'knowledge_base'
          });
        });
      }

      console.log(`✅ [D1 RAG] knowledge_base查询成功: ${matches.length}条`);
    } catch (error) {
      console.error('❌ [D1 RAG] knowledge_base查询失败:', error);
      throw error;
    }

    return matches;
  }

  /**
   * 搜索Sheet类型的数据（包含隐藏工作表）
   */
  private async searchSheetData(keywords: string[], options: Required<D1RAGOptions>): Promise<D1RAGMatch[]> {
    const matches: D1RAGMatch[] = [];

    // 专门搜索Sheet类型的节点
    const conditions = keywords.map(() =>
      `(n.title LIKE ? OR c.sheet_data LIKE ? OR n.content_summary LIKE ?)`
    ).join(' OR ');

    const bindings = keywords.flatMap(kw => {
      const pattern = `%${kw}%`;
      return [pattern, pattern, pattern];
    });

    const sql = `
      SELECT
        n.node_token,
        n.title,
        n.obj_type,
        SUBSTR(c.full_content, 1, 500) as content,
        n.content_summary as summary,
        c.sheet_data,
        LENGTH(c.sheet_data) as sheet_data_size
      FROM knowledge_base_nodes n
      INNER JOIN knowledge_base_content c ON n.node_token = c.node_token
      WHERE n.is_public = 1
        AND n.is_indexed = 1
        AND n.obj_type = 'sheet'
        AND (${conditions})
      ORDER BY sheet_data_size DESC
      LIMIT ?
    `;

    try {
      const result = await this.db.prepare(sql)
        .bind(...bindings, options.maxResults * 2)
        .all();

      if (result.results) {
        result.results.forEach((row: any) => {
          // 尝试解析sheet_data以提取隐藏工作表信息
          let sheetInfo = '';
          let hasHidden = false;

          if (row.sheet_data) {
            try {
              const sheetData = JSON.parse(row.sheet_data);
              if (Array.isArray(sheetData.sheets)) {
                const hiddenSheets = sheetData.sheets.filter((s: any) => s.hidden);
                hasHidden = hiddenSheets.length > 0;
                if (hasHidden) {
                  sheetInfo = ` [含${hiddenSheets.length}个隐藏工作表]`;
                }
              }
            } catch (e) {
              // JSON解析失败，忽略
            }
          }

          matches.push({
            node_token: row.node_token,
            title: row.title + sheetInfo,
            obj_type: row.obj_type,
            content: row.content || '',
            summary: row.summary || '',
            score: 0, // 稍后计算
            source: 'sheet_data',
            is_hidden: hasHidden
          });
        });
      }

      const hiddenCount = matches.filter(m => m.is_hidden).length;
      console.log(`✅ [D1 RAG] sheet_data查询成功: ${matches.length}条 (包含隐藏工作表: ${hiddenCount})`);
    } catch (error) {
      console.error('❌ [D1 RAG] sheet_data查询失败:', error);
      // 不抛出错误，降级为只使用knowledge_base结果
    }

    return matches;
  }

  /**
   * 提取关键词（改进版 - 更好的中文支持）
   */
  private extractKeywords(query: string): string[] {
    // 保留中英文、数字
    const normalized = query
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
      .trim();

    // 中文按字符切分，英文按空格切分
    const chineseChars = normalized.match(/[\u4e00-\u9fa5]+/g) || [];
    const englishWords = normalized.match(/[a-zA-Z0-9]+/g) || [];

    // 停用词（扩展版）
    const stopwords = new Set([
      '的', '了', '是', '在', '有', '和', '与', '或', '吗', '呢', '啊', '吧', '嘛',
      '你', '我', '他', '她', '它', '们', '这', '那', '哪', '什么', '怎么', '为什么',
      'the', 'a', 'an', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'of', 'to', 'in', 'on', 'at',
      'for', 'with', 'from', 'by', 'as', 'do', 'does', 'did', 'can', 'could', 'will', 'would'
    ]);

    const keywords: string[] = [];

    // 处理中文：提取2-4字的词组
    chineseChars.forEach(text => {
      // 单字（跳过）
      if (text.length === 1 && !['融资', '榜', '库'].includes(text)) {
        return;
      }

      // 2字词
      for (let i = 0; i <= text.length - 2; i++) {
        const word = text.substring(i, i + 2);
        if (!stopwords.has(word)) {
          keywords.push(word);
        }
      }

      // 3字词
      for (let i = 0; i <= text.length - 3; i++) {
        const word = text.substring(i, i + 3);
        if (!stopwords.has(word)) {
          keywords.push(word);
        }
      }

      // 完整词组（如果长度4-6）
      if (text.length >= 4 && text.length <= 6) {
        keywords.push(text);
      }
    });

    // 处理英文：按单词
    englishWords.forEach(word => {
      const lower = word.toLowerCase();
      if (lower.length > 1 && !stopwords.has(lower)) {
        keywords.push(lower);
      }
    });

    // 去重
    const unique = [...new Set(keywords)];

    // 优先保留长词（更有意义）
    const sorted = unique.sort((a, b) => b.length - a.length);

    // 返回前15个关键词
    return sorted.slice(0, 15);
  }

  /**
   * 去重（基于node_token）
   */
  private deduplicateMatches(matches: D1RAGMatch[]): D1RAGMatch[] {
    const seen = new Map<string, D1RAGMatch>();

    matches.forEach(match => {
      const key = `${match.node_token}_${match.worksheet_name || ''}`;

      // 如果已存在，保留分数更高的
      const existing = seen.get(key);
      if (!existing || match.score > existing.score) {
        seen.set(key, match);
      }
    });

    return Array.from(seen.values());
  }

  /**
   * 计算匹配分数
   */
  private scoreMatches(matches: D1RAGMatch[], keywords: string[]): D1RAGMatch[] {
    return matches.map(match => {
      let score = 0;

      const searchText = `${match.title} ${match.content} ${match.summary}`.toLowerCase();

      // 关键词匹配计分
      keywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();

        // 标题匹配（权重最高）
        if (match.title.toLowerCase().includes(keywordLower)) {
          score += 0.5;
        }

        // 摘要匹配
        if (match.summary.toLowerCase().includes(keywordLower)) {
          score += 0.3;
        }

        // 内容匹配
        const contentMatches = (searchText.match(new RegExp(keywordLower, 'g')) || []).length;
        score += Math.min(contentMatches * 0.1, 0.4);
      });

      // 关键词覆盖率加分
      const matchedKeywords = keywords.filter(kw =>
        searchText.includes(kw.toLowerCase())
      ).length;
      const coverage = matchedKeywords / keywords.length;
      score += coverage * 0.3;

      // 隐藏工作表加分（因为通常包含更详细的数据）
      if (match.is_hidden) {
        score += 0.1;
      }

      // 类型加权
      if (match.obj_type === 'sheet' || match.obj_type === 'sheet_worksheet') {
        score += 0.1; // Sheet数据通常更结构化
      }

      // 归一化到0-1
      match.score = Math.min(score, 1.0);
      return match;
    });
  }

  /**
   * 从缓存读取结果
   */
  private async getCachedResult(query: string, options: Required<D1RAGOptions>): Promise<D1RAGResult | null> {
    if (!this.cache) return null;

    try {
      const cacheKey = this.getCacheKey(query, options);
      const cached = await this.cache.get(cacheKey, 'json');

      if (cached) {
        return {
          ...cached,
          fromCache: true
        } as D1RAGResult;
      }
    } catch (error) {
      console.warn('[D1 RAG] 缓存读取失败:', error);
    }

    return null;
  }

  /**
   * 缓存结果
   */
  private async cacheResult(query: string, options: Required<D1RAGOptions>, result: D1RAGResult): Promise<void> {
    if (!this.cache) return;

    try {
      const cacheKey = this.getCacheKey(query, options);

      // 缓存1小时
      await this.cache.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 3600
      });

      console.log('✅ [D1 RAG] 结果已缓存:', cacheKey);
    } catch (error) {
      console.warn('[D1 RAG] 缓存写入失败:', error);
    }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(query: string, options: Required<D1RAGOptions>): string {
    const optionsHash = JSON.stringify({
      maxResults: options.maxResults,
      includeHiddenSheets: options.includeHiddenSheets,
      threshold: options.threshold
    });

    // 简单哈希
    const hash = this.simpleHash(query + optionsHash);
    return `d1_rag:${hash}`;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 格式化为AI上下文
   */
  formatForAI(matches: D1RAGMatch[]): string {
    if (matches.length === 0) {
      return '未找到相关知识库内容。';
    }

    return matches.map((match, index) => {
      const hiddenBadge = match.is_hidden ? '🔒隐藏工作表 ' : '';
      const typeLabel = this.getTypeLabel(match.obj_type);

      return `
【${index + 1}】${typeLabel} - ${match.title}
${hiddenBadge}${match.summary || ''}

${match.content.substring(0, 300)}${match.content.length > 300 ? '...' : ''}

---
相关性: ${(match.score * 100).toFixed(1)}%
来源: ${match.source}
${match.worksheet_name ? `工作表: ${match.worksheet_name}` : ''}
`.trim();
    }).join('\n\n');
  }

  /**
   * 获取类型标签
   */
  private getTypeLabel(objType: string): string {
    const labels: Record<string, string> = {
      'docx': '📄 文档',
      'sheet': '📊 表格',
      'sheet_worksheet': '📊 表格工作表',
      'bitable': '📋 多维表',
      'wiki': '📚 Wiki'
    };
    return labels[objType] || '📁 文档';
  }
}

/**
 * 工厂函数：创建D1 RAG服务
 */
export function createD1RAGService(db: D1Database, cache?: KVNamespace): D1RAGService {
  return new D1RAGService(db, cache);
}
