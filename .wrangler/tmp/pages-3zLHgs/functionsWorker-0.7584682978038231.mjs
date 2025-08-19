var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-Uo97hg/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// lib/hybrid-rag-service.ts
var HybridRAGService = class {
  static {
    __name(this, "HybridRAGService");
  }
  config;
  vectorize;
  ai;
  openaiApiKey;
  requestContext;
  constructor(vectorize, ai, openaiApiKey, kvNamespace, webSearchConfig, requestContext) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    this.requestContext = requestContext;
    this.config = {
      useOpenAI: !!openaiApiKey,
      useCloudflareAI: !!ai,
      useKeywordSearch: true,
      useWebSearch: true,
      // 启用改进的网络搜索
      fallbackEnabled: true
    };
  }
  /**
   * 智能检索：增强错误处理版本
   */
  async performIntelligentRAG(query, options = {}) {
    const startTime = Date.now();
    console.log("\u{1F50D} \u5F00\u59CBRAG\u68C0\u7D22...");
    try {
      if (!query || typeof query !== "string" || query.trim().length === 0) {
        throw new Error("\u67E5\u8BE2\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
      }
      const isContactQuery = this.isContactInfoQuery(query);
      if (isContactQuery) {
        console.log("\u{1F4DE} \u68C0\u6D4B\u5230\u8054\u7CFB\u65B9\u5F0F\u67E5\u8BE2\uFF0C\u542F\u7528\u7279\u6B8A\u8FC7\u6EE4\u903B\u8F91");
        options.contactInfoQuery = true;
        options.strictFiltering = true;
      }
      const strategies = [];
      if (this.config.useOpenAI || this.config.useCloudflareAI) {
        strategies.push(this.vectorSearch(query, options));
      }
      strategies.push(this.keywordSearch(query, options));
      strategies.push(this.semanticPatternMatch(query, options));
      if (strategies.length === 0) {
        throw new Error("\u6CA1\u6709\u53EF\u7528\u7684\u68C0\u7D22\u7B56\u7565");
      }
      const results = await Promise.allSettled(strategies);
      const successfulResults = results.filter((r) => r.status === "fulfilled");
      if (successfulResults.length === 0) {
        console.warn("\u6240\u6709\u68C0\u7D22\u7B56\u7565\u90FD\u5931\u8D25\u4E86\uFF0C\u8FD4\u56DE\u9ED8\u8BA4\u54CD\u5E94");
        return this.getDefaultResponse(query);
      }
      const mergedResults = this.mergeResults(results, query);
      const finalResults = {
        ...mergedResults,
        searchQuery: query,
        fromCache: false,
        responseTime: Date.now() - startTime,
        enhancedFeatures: {
          multiStrategyRetrieval: true,
          successfulStrategies: successfulResults.length,
          totalStrategies: strategies.length
        }
      };
      return finalResults;
    } catch (error) {
      console.error("RAG\u68C0\u7D22\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF:", error);
      return this.getErrorResponse(query, error.message);
    }
  }
  /**
   * 向量检索（支持多模型）
   */
  async vectorSearch(query, options) {
    try {
      let queryVector;
      if (this.config.useOpenAI) {
        queryVector = await this.getOpenAIEmbedding(query);
      } else if (this.config.useCloudflareAI) {
        queryVector = await this.getCloudflareEmbedding(query);
      } else {
        throw new Error("No embedding service available");
      }
      return await this.vectorize.query(queryVector, {
        topK: options.topK || 5,
        returnMetadata: "all"
      });
    } catch (error) {
      console.log("\u5411\u91CF\u68C0\u7D22\u5931\u8D25\uFF0C\u4F7F\u7528\u5907\u7528\u65B9\u6848");
      return { matches: [], source: "vector-failed" };
    }
  }
  /**
   * 关键词检索（纯文本匹配）
   */
  async keywordSearch(query, options) {
    const keywords = this.extractKeywords(query);
    const matches = await this.findKeywordMatches(keywords);
    return {
      matches: matches.map((match2) => ({
        ...match2,
        score: match2.keywordScore,
        source: "keyword"
      })),
      source: "keyword"
    };
  }
  /**
   * 语义模式匹配
   */
  async semanticPatternMatch(query, options) {
    const patterns = {
      investment: ["\u6295\u8D44", "\u878D\u8D44", "\u8F6E\u6B21", "vc", "funding"],
      startup: ["\u516C\u53F8", "\u521B\u4E1A", "\u4F01\u4E1A", "startup", "company"],
      trend: ["\u8D8B\u52BF", "\u5E02\u573A", "\u524D\u666F", "trend", "market"],
      technology: ["\u6280\u672F", "ai", "\u4EBA\u5DE5\u667A\u80FD", "tech"]
    };
    const queryLower = query.toLowerCase();
    const scores = {};
    for (const [category, keywords] of Object.entries(patterns)) {
      scores[category] = keywords.reduce((score, keyword) => {
        return score + (queryLower.includes(keyword) ? 1 : 0);
      }, 0);
    }
    const bestCategory = Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0];
    return {
      matches: await this.getCategoryContent(bestCategory),
      source: "pattern",
      category: bestCategory
    };
  }
  /**
   * 结果合并和排序
   */
  mergeResults(results, query) {
    const allMatches = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.matches) {
        result.value.matches.forEach((match2) => {
          allMatches.push({
            ...match2,
            strategy: result.value.source,
            strategyIndex: index
          });
        });
      }
    });
    const deduplicated = this.deduplicateMatches(allMatches);
    const scored = this.rescoreMatches(deduplicated, query);
    return {
      matches: scored.slice(0, 8),
      // 返回top 8
      sources: this.extractSources(scored),
      confidence: this.calculateConfidence(scored),
      strategies: results.length
    };
  }
  /**
   * 提取关键词
   */
  extractKeywords(query) {
    return query.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, "").split(/\s+/).filter((word) => word.length > 1);
  }
  /**
   * 基于预存内容的关键词匹配
   */
  async findKeywordMatches(keywords) {
    const documents = await this.getStoredDocuments();
    return documents.filter((doc) => {
      const content = (doc.content || "").toLowerCase();
      return keywords.some((keyword) => content.includes(keyword));
    }).map((doc) => ({
      ...doc,
      keywordScore: this.calculateKeywordScore(doc.content, keywords)
    }));
  }
  /**
   * 获取分类内容（基于语义模式）
   */
  async getCategoryContent(category) {
    const allDocs = await this.getStoredDocuments();
    const categoryKeywords = {
      investment: ["\u6295\u8D44", "\u878D\u8D44", "\u8D44\u91D1", "\u8F6E\u6B21", "\u4F30\u503C", "vc", "\u57FA\u91D1"],
      startup: ["\u516C\u53F8", "\u521D\u521B", "\u521B\u4E1A", "\u4F01\u4E1A", "\u56E2\u961F", "\u72EC\u89D2\u517D"],
      trend: ["\u8D8B\u52BF", "\u5E02\u573A", "\u53D1\u5C55", "\u524D\u666F", "\u9884\u6D4B", "\u672A\u6765"],
      technology: ["\u6280\u672F", "ai", "\u4EBA\u5DE5\u667A\u80FD", "\u7B97\u6CD5", "\u6A21\u578B"]
    };
    const keywords = categoryKeywords[category] || [];
    if (keywords.length === 0) return [];
    const relevantDocs = allDocs.map((doc) => ({
      ...doc,
      categoryScore: this.calculateCategoryScore(doc, keywords)
    })).filter((doc) => doc.categoryScore > 0.3).sort((a, b) => b.categoryScore - a.categoryScore).slice(0, 5);
    return relevantDocs.map((doc) => ({
      id: doc.id,
      content: doc.content,
      title: doc.title,
      score: doc.categoryScore,
      source: doc.source,
      type: doc.type
    }));
  }
  /**
   * 计算分类相关性分数
   */
  calculateCategoryScore(doc, categoryKeywords) {
    const content = (doc.content || "").toLowerCase();
    const title = (doc.title || "").toLowerCase();
    const keywords = doc.keywords || [];
    let score = 0;
    let matches = 0;
    categoryKeywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      if (content.includes(keywordLower)) {
        score += 0.3;
        matches++;
      }
      if (title.includes(keywordLower)) {
        score += 0.5;
        matches++;
      }
    });
    keywords.forEach((keyword) => {
      if (categoryKeywords.some(
        (ck) => ck.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(ck.toLowerCase())
      )) {
        score += 0.4;
        matches++;
      }
    });
    return Math.min(score + matches / categoryKeywords.length * 0.2, 1);
  }
  /**
   * 去重匹配结果
   */
  deduplicateMatches(matches) {
    const seen = /* @__PURE__ */ new Set();
    return matches.filter((match2) => {
      const key = match2.id || match2.content?.substring(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  /**
   * 重新评分
   */
  rescoreMatches(matches, query) {
    return matches.map((match2) => ({
      ...match2,
      finalScore: this.calculateFinalScore(match2, query)
    })).sort((a, b) => b.finalScore - a.finalScore);
  }
  /**
   * 计算最终分数
   */
  calculateFinalScore(match2, query) {
    let score = match2.score || 0.5;
    if (match2.strategy === "vector") score *= 1.2;
    if (match2.strategy === "keyword") score *= 1;
    if (match2.strategy === "pattern") score *= 0.8;
    if (match2.content && match2.content.length > 200) score *= 1.1;
    return Math.min(score, 1);
  }
  /**
   * 计算置信度
   */
  calculateConfidence(matches) {
    if (matches.length === 0) return 0;
    const avgScore = matches.reduce((sum, m) => sum + m.finalScore, 0) / matches.length;
    const hasMultipleStrategies = new Set(matches.map((m) => m.strategy)).size > 1;
    return Math.min(avgScore * (hasMultipleStrategies ? 1.2 : 1), 1);
  }
  /**
   * 提取来源信息
   */
  extractSources(matches) {
    const sources = new Set(matches.map((m) => m.title || m.source || "\u77E5\u8BC6\u5E93"));
    return Array.from(sources);
  }
  /**
   * 获取存储的文档（仅从飞书真实同步数据）
   */
  async getStoredDocuments() {
    try {
      const documents = [];
      try {
        const feishuData = await this.loadFeishuKnowledgeBase();
        documents.push(...feishuData);
      } catch (e) {
        console.log("\u98DE\u4E66\u77E5\u8BC6\u5E93\u6570\u636E\u8BFB\u53D6\u5931\u8D25:", e.message);
      }
      if (documents.length === 0) {
        documents.push(...this.getDefaultKnowledgeBase());
      }
      return documents;
    } catch (error) {
      console.log("\u83B7\u53D6\u6587\u6863\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u77E5\u8BC6\u5E93");
      return this.getDefaultKnowledgeBase();
    }
  }
  /**
   * 加载飞书知识库数据 - 修复Cloudflare Workers环境下的文件访问
   */
  async loadFeishuKnowledgeBase() {
    try {
      const baseUrl = this.getBaseUrl();
      let response = await fetch(`${baseUrl}/assets/data/rag/enhanced-feishu-full-content.json`).catch(() => null);
      if (!response || !response.ok) {
        response = await fetch(`${baseUrl}/assets/data/rag/real-feishu-content.json`).catch(() => null);
      }
      if (!response || !response.ok) {
        response = await fetch(`${baseUrl}/assets/data/rag/improved-feishu-knowledge-base.json`).catch(() => null);
      }
      if (!response || !response.ok) {
        throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u98DE\u4E66\u77E5\u8BC6\u5E93\u6570\u636E - \u6240\u6709\u6570\u636E\u6E90\u90FD\u4E0D\u53EF\u7528");
      }
      const data = await response.json();
      const documents = [];
      if (data.nodes && Array.isArray(data.nodes) && data.summary?.apiVersion === "v2_enhanced") {
        console.log("\u2705 \u4F7F\u7528\u589E\u5F3A\u7248\u5B8C\u6574\u540C\u6B65\u6570\u636E (V2)");
        console.log(`\u{1F4CA} \u8282\u70B9\u6570\u91CF: ${data.nodes.length}, \u5E73\u5747\u5185\u5BB9\u957F\u5EA6: ${data.summary.avgContentLength}\u5B57\u7B26`);
        data.nodes.forEach((node) => {
          if (node.content && node.content.trim().length > 20) {
            documents.push({
              id: node.id,
              content: node.content,
              title: node.title,
              type: node.type || "wiki_node",
              source: node.source || "SVTR\u98DE\u4E66\u77E5\u8BC6\u5E93",
              keywords: node.searchKeywords || [],
              ragScore: node.ragScore || 0,
              verified: true,
              // 增强版数据已验证
              lastUpdated: node.lastUpdated,
              level: node.level || 0,
              nodeToken: node.nodeToken,
              contentLength: node.contentLength || 0,
              docType: node.docType || node.objType,
              semanticTags: node.semanticTags || []
            });
          }
        });
      } else if (data.documents && Array.isArray(data.documents) && data.summary?.syncMethod === "real_content_api") {
        console.log("\u2705 \u4F7F\u7528\u771F\u5B9E\u98DE\u4E66API\u5185\u5BB9");
        data.documents.forEach((doc) => {
          documents.push({
            id: doc.id,
            content: doc.content,
            title: doc.title,
            type: doc.type,
            source: doc.source,
            keywords: doc.keywords || doc.searchKeywords || [],
            ragScore: doc.ragScore || 0,
            verified: doc.metadata?.verified || false,
            lastUpdated: doc.lastUpdated
          });
        });
      } else if (data.documents && Array.isArray(data.documents)) {
        console.log("\u26A0\uFE0F \u4F7F\u7528\u5907\u7528\u77E5\u8BC6\u5E93\u5185\u5BB9");
        data.documents.forEach((doc) => {
          documents.push({
            id: doc.id || `feishu-${Math.random().toString(36).substr(2, 9)}`,
            content: doc.content || "",
            title: doc.title || "\u98DE\u4E66\u6587\u6863",
            type: doc.type || "feishu_doc",
            source: "\u98DE\u4E66\u77E5\u8BC6\u5E93",
            keywords: doc.keywords || [],
            ragScore: doc.ragScore || 0,
            verified: false
          });
        });
      }
      console.log(`\u{1F4CA} \u5DF2\u52A0\u8F7D ${documents.length} \u4E2A\u98DE\u4E66\u6587\u6863 (${documents.filter((d) => d.verified).length} \u4E2A\u5DF2\u9A8C\u8BC1)`);
      return documents;
    } catch (error) {
      console.log("\u8BFB\u53D6\u98DE\u4E66\u77E5\u8BC6\u5E93\u5931\u8D25:", error.message);
      return [];
    }
  }
  /**
   * 获取默认知识库
   */
  getDefaultKnowledgeBase() {
    return [
      {
        id: "kb-investment-trends",
        content: `2024\u5E74AI\u6295\u8D44\u8D8B\u52BF\u5206\u6790\uFF1A\u5168\u7403AI\u521B\u6295\u5E02\u573A\u5448\u73B0\u5206\u5316\u8D8B\u52BF\uFF0C\u4F01\u4E1A\u7EA7\u5E94\u7528\u6210\u4E3A\u6295\u8D44\u91CD\u70B9\u3002
        \u8D44\u91D1\u6D41\u5411\uFF1AB2B AI\u89E3\u51B3\u65B9\u6848\u83B7\u5F9760%\u7684\u6295\u8D44\u4EFD\u989D\uFF0C\u6D88\u8D39\u7EA7AI\u5E94\u7528\u6295\u8D44\u4E0B\u964D30%\u3002
        \u5730\u7406\u5206\u5E03\uFF1A\u7F8E\u56FD\u4FDD\u630145%\u5E02\u573A\u4EFD\u989D\uFF0C\u4E2D\u56FD25%\uFF0C\u6B27\u6D3215%\uFF0C\u5176\u4ED6\u5730\u533A15%\u3002
        \u8F6E\u6B21\u5206\u5E03\uFF1AA\u8F6E\u548CB\u8F6E\u6700\u4E3A\u6D3B\u8DC3\uFF0C\u79CD\u5B50\u8F6E\u6295\u8D44\u8D8B\u4E8E\u8C28\u614E\uFF0CC\u8F6E\u53CA\u4EE5\u540E\u91CD\u70B9\u5173\u6CE8\u6536\u5165\u589E\u957F\u3002`,
        title: "AI\u6295\u8D44\u8D8B\u52BF\u5206\u6790",
        type: "analysis",
        source: "SVTR\u77E5\u8BC6\u5E93",
        keywords: ["\u6295\u8D44\u8D8B\u52BF", "B2B AI", "\u4F01\u4E1A\u7EA7\u5E94\u7528", "\u5730\u7406\u5206\u5E03", "\u8F6E\u6B21\u5206\u6790"]
      },
      {
        id: "kb-startup-success",
        content: `AI\u521D\u521B\u4F01\u4E1A\u6210\u529F\u8981\u7D20\u7814\u7A76\uFF1A\u57FA\u4E8ESVTR.AI\u8FFD\u8E2A\u768410761\u5BB6AI\u516C\u53F8\u6570\u636E\u5206\u6790\u3002
        \u6280\u672F\u8981\u7D20\uFF1A\u62E5\u6709PhD\u7EA7\u522B\u6280\u672F\u56E2\u961F\u7684\u516C\u53F8\u6210\u529F\u7387\u9AD8\u51FA3\u500D\uFF0C\u4E13\u6709\u6570\u636E\u4F18\u52BF\u662F\u5173\u952E\u62A4\u57CE\u6CB3\u3002
        \u5546\u4E1A\u8981\u7D20\uFF1A\u6E05\u6670\u7684\u4F01\u4E1A\u7EA7\u6536\u5165\u6A21\u5F0F\u3001\u5408\u7406\u7684\u5BA2\u6237\u83B7\u53D6\u6210\u672C\u3001\u5F3A\u5927\u7684\u9500\u552E\u6267\u884C\u80FD\u529B\u3002
        \u8D44\u672C\u8981\u7D20\uFF1A\u9002\u5EA6\u7684\u878D\u8D44\u8282\u594F\u3001\u660E\u786E\u7684\u91CC\u7A0B\u7891\u8BBE\u5B9A\u3001\u6295\u8D44\u4EBA\u7684\u6218\u7565\u4EF7\u503C\u8D21\u732E\u3002`,
        title: "AI\u521D\u521B\u4F01\u4E1A\u6210\u529F\u8981\u7D20",
        type: "research",
        source: "SVTR\u77E5\u8BC6\u5E93",
        keywords: ["\u521D\u521B\u4F01\u4E1A", "\u6210\u529F\u8981\u7D20", "PhD\u56E2\u961F", "\u4E13\u6709\u6570\u636E", "\u4F01\u4E1A\u7EA7\u6536\u5165"]
      }
    ];
  }
  /**
   * OpenAI Embedding实现
   */
  async getOpenAIEmbedding(query) {
    if (!this.openaiApiKey) {
      throw new Error("OpenAI API\u5BC6\u94A5\u672A\u914D\u7F6E");
    }
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
        dimensions: 1536
      })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API\u9519\u8BEF: ${error.error?.message}`);
    }
    const data = await response.json();
    return data.data[0].embedding;
  }
  /**
   * Cloudflare AI Embedding实现
   */
  async getCloudflareEmbedding(query) {
    if (!this.ai) {
      throw new Error("Cloudflare AI\u672A\u914D\u7F6E");
    }
    try {
      const response = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
        text: query
      });
      return response.data[0];
    } catch (error) {
      throw new Error(`Cloudflare AI\u9519\u8BEF: ${error.message}`);
    }
  }
  /**
   * 关键词评分算法
   */
  calculateKeywordScore(content, keywords) {
    if (!content || keywords.length === 0) return 0;
    const contentLower = content.toLowerCase();
    const totalWords = content.split(/\s+/).length;
    let score = 0;
    let matchedKeywords = 0;
    keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, "gi");
      const matches = (contentLower.match(regex) || []).length;
      if (matches > 0) {
        matchedKeywords++;
        const tf = matches / totalWords;
        const boost = keyword.length > 2 ? 1.2 : 1;
        score += tf * boost;
      }
    });
    const coverageBonus = matchedKeywords / keywords.length;
    return Math.min((score + coverageBonus * 0.3) * 2, 1);
  }
  /**
   * 检测是否为联系方式查询
   */
  isContactInfoQuery(query) {
    const queryLower = query.toLowerCase();
    const contactKeywords = [
      "\u8054\u7CFB\u65B9\u5F0F",
      "\u8054\u7CFB",
      "contact",
      "\u8054\u7CFB\u6211\u4EEC",
      "\u8054\u7CFB\u4FE1\u606F",
      "\u7535\u8BDD",
      "phone",
      "\u624B\u673A",
      "mobile",
      "tel",
      "\u90AE\u7BB1",
      "email",
      "\u90AE\u4EF6",
      "mail",
      "\u5730\u5740",
      "address",
      "\u4F4D\u7F6E",
      "location",
      "\u5FAE\u4FE1",
      "wechat",
      "wx",
      "\u5B98\u7F51",
      "website",
      "site",
      "url",
      "\u5982\u4F55\u8054\u7CFB",
      "how to contact",
      "\u600E\u4E48\u8054\u7CFB",
      "svtr\u8054\u7CFB",
      "svtr contact",
      "\u7845\u8C37\u79D1\u6280\u8BC4\u8BBA\u8054\u7CFB"
    ];
    return contactKeywords.some((keyword) => queryLower.includes(keyword));
  }
  /**
   * 检测内容是否包含第三方公司联系信息（需要过滤掉）
   */
  containsThirdPartyContactInfo(content, title) {
    const fullText = `${content} ${title}`.toLowerCase();
    const thirdPartyCompanies = [
      "glean",
      "kleiner perkins",
      "menlo park",
      "palo alto",
      "\u51EF\u9E4F\u534E\u76C8",
      "\u95E8\u6D1B\u5E15\u514B",
      "carta",
      "discord",
      "consensus",
      "5400 sand hill",
      "sand hill road",
      "650 543 4800",
      "info@svtr.ai",
      // 这个邮箱在代码中未找到，可能是错误信息
      "openai",
      "anthropic",
      "meta",
      "google"
    ];
    const thirdPartyAddressPatterns = [
      /menlo park.*ca.*94025/i,
      /5400.*sand.*hill.*rd/i,
      /suite.*200.*menlo.*park/i
    ];
    const hasThirdPartyCompany = thirdPartyCompanies.some(
      (company) => fullText.includes(company.toLowerCase())
    );
    const hasThirdPartyAddress = thirdPartyAddressPatterns.some(
      (pattern) => pattern.test(fullText)
    );
    return hasThirdPartyCompany || hasThirdPartyAddress;
  }
  /**
   * 检测内容是否包含SVTR官方联系信息
   */
  containsSVTRContactInfo(content, title) {
    const fullText = `${content} ${title}`.toLowerCase();
    const svtrOfficialKeywords = [
      "pkcapital2023",
      // 官方微信号
      "svtr.ai",
      // 官网
      "https://svtr.ai",
      // 官网完整URL
      "contact@svtr.ai",
      // 官方邮箱
      "svtr",
      "svtr.ai",
      // 品牌名称
      "\u7845\u8C37\u79D1\u6280\u8BC4\u8BBA",
      "\u51EF\u745E",
      // 中文品牌名
      "\u8054\u7CFB\u6211\u4EEC",
      "\u8054\u7CFB\u65B9\u5F0F"
      // 通用联系页面
    ];
    const hasSVTRKeywords = svtrOfficialKeywords.some(
      (keyword) => fullText.includes(keyword.toLowerCase())
    );
    const isSVTRContext = fullText.includes("svtr") || fullText.includes("\u7845\u8C37\u79D1\u6280\u8BC4\u8BBA") || fullText.includes("pkcapital");
    return hasSVTRKeywords && isSVTRContext;
  }
  /**
   * 获取基础URL - 解决Cloudflare Workers环境下的文件访问问题
   */
  getBaseUrl() {
    if (this.requestContext) {
      const url = new URL(this.requestContext.url);
      return url.origin;
    }
    if (typeof globalThis !== "undefined" && globalThis.location) {
      return globalThis.location.origin;
    }
    if (typeof globalThis !== "undefined" && globalThis.request) {
      const request = globalThis.request;
      const url = new URL(request.url);
      return url.origin;
    }
    if (typeof process !== "undefined" && false) {
      return "http://localhost:3000";
    }
    return "https://chat.svtr.ai";
  }
  /**
   * 验证内容质量 - 防止无关内容进入AI输入，避免编造
   */
  validateContentQuality(matches, query) {
    if (!matches || matches.length === 0) return false;
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    if (queryKeywords.length === 0) return false;
    let relevantMatches = 0;
    matches.forEach((match2) => {
      const content = (match2.content || "").toLowerCase();
      const title = (match2.title || "").toLowerCase();
      const keywordMatches = queryKeywords.filter(
        (keyword) => content.includes(keyword) || title.includes(keyword)
      ).length;
      const matchRate = keywordMatches / queryKeywords.length;
      if (matchRate >= 0.3 && (match2.content || "").length >= 50) {
        relevantMatches++;
      }
    });
    const relevancyRate = relevantMatches / matches.length;
    const isQualityGood = relevancyRate >= 0.5;
    if (!isQualityGood) {
      console.log(`\u26A0\uFE0F \u5185\u5BB9\u8D28\u91CF\u9A8C\u8BC1\u5931\u8D25: ${relevantMatches}/${matches.length} \u76F8\u5173\u5339\u914D\u7387=${(relevancyRate * 100).toFixed(1)}%`);
    }
    return isQualityGood;
  }
  /**
   * 获取默认响应（当所有策略都失败时）
   */
  getDefaultResponse(query) {
    return {
      matches: [],
      sources: ["\u7CFB\u7EDF\u9ED8\u8BA4"],
      confidence: 0.1,
      strategies: 0,
      searchQuery: query,
      fromCache: false,
      responseTime: 0,
      error: true,
      message: "\u62B1\u6B49\uFF0C\u5F53\u524D\u65E0\u6CD5\u83B7\u53D6\u76F8\u5173\u4FE1\u606F\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002",
      enhancedFeatures: {
        multiStrategyRetrieval: false,
        successfulStrategies: 0,
        totalStrategies: 0
      }
    };
  }
  /**
   * 获取错误响应（当发生异常时）
   */
  getErrorResponse(query, errorMessage) {
    return {
      matches: [],
      sources: ["\u9519\u8BEF\u5904\u7406"],
      confidence: 0,
      strategies: 0,
      searchQuery: query,
      fromCache: false,
      responseTime: 0,
      error: true,
      message: `\u641C\u7D22\u8FC7\u7A0B\u4E2D\u53D1\u751F\u9519\u8BEF\uFF1A${errorMessage}`,
      enhancedFeatures: {
        multiStrategyRetrieval: false,
        successfulStrategies: 0,
        totalStrategies: 0,
        errorDetails: errorMessage
      }
    };
  }
  /**
   * 检测联系方式查询
   */
  isContactInfoQuery(query) {
    const contactKeywords = ["\u8054\u7CFB", "\u90AE\u7BB1", "\u7535\u8BDD", "\u5FAE\u4FE1", "\u5730\u5740", "contact", "email", "phone"];
    const lowerQuery = query.toLowerCase();
    return contactKeywords.some((keyword) => lowerQuery.includes(keyword));
  }
  /**
   * 获取OpenAI嵌入向量
   */
  async getOpenAIEmbedding(text) {
    if (!this.openaiApiKey) {
      throw new Error("OpenAI API key not available");
    }
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.openaiApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: text,
          model: "text-embedding-ada-002"
        })
      });
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("OpenAI embedding failed:", error);
      throw error;
    }
  }
  /**
   * 获取Cloudflare AI嵌入向量
   */
  async getCloudflareEmbedding(text) {
    if (!this.ai) {
      throw new Error("Cloudflare AI not available");
    }
    try {
      const response = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
        text
      });
      return response.data[0];
    } catch (error) {
      console.error("Cloudflare AI embedding failed:", error);
      throw error;
    }
  }
  /**
   * 计算关键词评分
   */
  calculateKeywordScore(content, keywords) {
    if (!content || keywords.length === 0) return 0;
    const lowerContent = content.toLowerCase();
    let score = 0;
    let matches = 0;
    keywords.forEach((keyword) => {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerContent.includes(lowerKeyword)) {
        matches++;
        score += keyword.length > 3 ? 2 : 1;
      }
    });
    return Math.min(score / keywords.length * (matches / keywords.length), 1);
  }
  /**
   * 获取默认知识库（当飞书数据不可用时）
   */
  getDefaultKnowledgeBase() {
    return [
      {
        id: "default-1",
        title: "SVTR.AI - \u7845\u8C37\u79D1\u6280\u8BC4\u8BBA",
        content: "SVTR.AI\u662F\u4E13\u6CE8\u4E8EAI\u521B\u6295\u9886\u57DF\u7684\u4E13\u4E1A\u5206\u6790\u5E73\u53F0\uFF0C\u63D0\u4F9BAI\u521B\u6295\u5E93\u3001AI\u521B\u6295\u4F1A\u3001AI\u521B\u6295\u8425\u7B49\u670D\u52A1\u3002",
        source: "\u9ED8\u8BA4\u77E5\u8BC6\u5E93",
        type: "info",
        keywords: ["SVTR", "AI", "\u521B\u6295", "\u7845\u8C37\u79D1\u6280\u8BC4\u8BBA"]
      },
      {
        id: "default-2",
        title: "\u8054\u7CFB\u65B9\u5F0F",
        content: "\u90AE\u7BB1\uFF1Acontact@svtr.ai\uFF0C\u66F4\u591A\u4FE1\u606F\u8BF7\u8BBF\u95EE https://svtr.ai",
        source: "\u9ED8\u8BA4\u77E5\u8BC6\u5E93",
        type: "contact",
        keywords: ["\u8054\u7CFB", "\u90AE\u7BB1", "contact"]
      }
    ];
  }
};
function createOptimalRAGService(vectorize, ai, openaiApiKey, kvNamespace, webSearchConfig, requestContext) {
  return new HybridRAGService(vectorize, ai, openaiApiKey, kvNamespace, webSearchConfig, requestContext);
}
__name(createOptimalRAGService, "createOptimalRAGService");

// api/chat.ts
var BASE_SYSTEM_PROMPT = `\u4F60\u662FSVTR AI\u521B\u6295\u5E93\u7684\u4E13\u4E1A\u6570\u636E\u67E5\u8BE2\u52A9\u624B\u3002

\u6838\u5FC3\u539F\u5219\uFF1A
1. \u4EC5\u57FA\u4E8E\u63D0\u4F9B\u7684\u77E5\u8BC6\u5E93\u5185\u5BB9\u56DE\u7B54\uFF0C\u7981\u6B62\u7F16\u9020\u3001\u63A8\u6D4B\u6216\u8865\u5145\u672A\u5728\u77E5\u8BC6\u5E93\u4E2D\u7684\u4FE1\u606F
2. \u6570\u636E\u4E0D\u8DB3\u65F6\u660E\u786E\u8BF4\u660E\uFF0C\u4F7F\u7528"SVTR\u77E5\u8BC6\u5E93\u4E2D\u6682\u65E0\u76F8\u5173\u6570\u636E"\u7B49\u8868\u8FF0  
3. \u6240\u6709\u6570\u5B57\u5FC5\u987B\u6765\u6E90\u4E8E\u77E5\u8BC6\u5E93\uFF0C\u4E0D\u5F97\u4F30\u7B97\u6216\u63A8\u6D4B\u4EFB\u4F55\u6570\u503C
4. \u4FDD\u6301\u5BA2\u89C2\u4E2D\u7ACB\uFF0C\u63D0\u4F9B\u6570\u636E\u4E8B\u5B9E\uFF0C\u907F\u514D\u4E3B\u89C2\u5206\u6790\u5224\u65AD

\u56DE\u7B54\u8981\u6C42\uFF1A
- \u51C6\u786E\u6027\u4F18\u5148\u4E8E\u5B8C\u6574\u6027
- \u627F\u8BA4\u6570\u636E\u5C40\u9650\u6027\uFF0C\u4E0D\u8FC7\u5EA6\u81EA\u4FE1
- \u5F53\u77E5\u8BC6\u5E93\u4E2D\u6CA1\u6709\u76F8\u5173\u4FE1\u606F\u65F6\uFF0C\u660E\u786E\u56DE\u590D"SVTR\u77E5\u8BC6\u5E93\u4E2D\u6682\u65E0\u8BE5\u4FE1\u606F"
- \u5F53\u4FE1\u606F\u4E0D\u5B8C\u6574\u65F6\uFF0C\u8BF4\u660E"\u636E\u73B0\u6709\u6570\u636E\u663E\u793A"
- \u5F53\u9700\u8981\u63A8\u6D4B\u65F6\uFF0C\u660E\u786E\u8868\u793A"\u65E0\u6CD5\u57FA\u4E8E\u73B0\u6709\u6570\u636E\u786E\u8BA4"

\u4E25\u683C\u57FA\u4E8ESVTR AI\u521B\u6295\u5E93\u63D0\u4F9B\u7684\u77E5\u8BC6\u5185\u5BB9\uFF0C\u7ED9\u51FA\u51C6\u786E\u3001\u5BA2\u89C2\u7684\u6570\u636E\u56DE\u590D\u3002`;
function shouldShowSourceInfo(query, ragContext) {
  const lowerQuery = query.toLowerCase();
  const sourceKeywords = ["\u6570\u636E\u6765\u6E90", "\u6765\u6E90", "source", "\u4ECE\u54EA", "\u54EA\u91CC\u6765", "\u57FA\u4E8E\u4EC0\u4E48"];
  const asksAboutSource = sourceKeywords.some((keyword) => lowerQuery.includes(keyword));
  const dataKeywords = ["\u4F30\u503C", "\u878D\u8D44", "\u6295\u8D44", "\u8F6E\u6B21", "\u591A\u5C11", "\u6570\u636E", "\u6700\u65B0", "\u4EF7\u683C", "\u80A1\u4EF7"];
  const asksAboutData = dataKeywords.some((keyword) => lowerQuery.includes(keyword));
  const businessKeywords = ["\u5408\u4F5C", "\u8054\u7CFB", "\u54A8\u8BE2", "\u670D\u52A1", "\u9879\u76EE", "\u5BF9\u63A5", "\u6295\u8D44\u673A\u4F1A"];
  const asksAboutBusiness = businessKeywords.some((keyword) => lowerQuery.includes(keyword));
  const hasRealTimeData = ragContext.matches.some((m) => m.source === "web_search" || m.source === "DuckDuckGo");
  return asksAboutSource || asksAboutData || asksAboutBusiness || hasRealTimeData;
}
__name(shouldShowSourceInfo, "shouldShowSourceInfo");
function isBusinessInquiry(query) {
  const lowerQuery = query.toLowerCase();
  const businessKeywords = [
    // 投资相关
    "\u6295\u8D44\u673A\u4F1A",
    "\u878D\u8D44",
    "\u9879\u76EE\u5BF9\u63A5",
    "\u5408\u4F5C",
    "\u54A8\u8BE2",
    // 交易相关  
    "\u4EA4\u6613",
    "\u5E76\u8D2D",
    "\u6536\u8D2D",
    "\u4F30\u503C",
    "\u5C3D\u8C03",
    // 服务相关
    "\u670D\u52A1",
    "\u8054\u7CFB",
    "\u5546\u52A1",
    "\u4E1A\u52A1",
    "\u5BA2\u6237"
  ];
  return businessKeywords.some((keyword) => lowerQuery.includes(keyword));
}
__name(isBusinessInquiry, "isBusinessInquiry");
function generateEnhancedPrompt(basePrompt, ragContext) {
  if (!ragContext.matches || ragContext.matches.length === 0) {
    return basePrompt;
  }
  const contextContent = ragContext.matches.map((match2, index) => {
    const title = match2.title || "\u77E5\u8BC6\u70B9";
    const content = match2.content || match2.metadata?.content || "";
    return index + 1 + ". **" + title + "**:\n" + content;
  }).join("\n\n");
  const enhancedPrompt = basePrompt + "\n\n\u53C2\u8003\u77E5\u8BC6\u5E93\u5185\u5BB9:\n" + contextContent + "\n\n\u8BF7\u57FA\u4E8E\u4EE5\u4E0A\u77E5\u8BC6\u5E93\u5185\u5BB9\u76F4\u63A5\u56DE\u7B54\u7528\u6237\u95EE\u9898\u3002";
  return enhancedPrompt;
}
__name(generateEnhancedPrompt, "generateEnhancedPrompt");
async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { messages } = body;
    const sessionId = request.headers.get("x-session-id") || request.headers.get("cf-ray") || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userQuery = messages[messages.length - 1]?.content || "";
    const queryBytes = new TextEncoder().encode(userQuery);
    const cacheKey = `rag:${btoa(String.fromCharCode(...queryBytes)).substring(0, 32)}`;
    let ragContext;
    if (env.SVTR_CACHE) {
      try {
        const cachedRAG = await env.SVTR_CACHE.get(cacheKey);
        if (cachedRAG) {
          ragContext = JSON.parse(cachedRAG);
          console.log("\u{1F3AF} \u4F7F\u7528\u7F13\u5B58\u7684RAG\u7ED3\u679C");
        }
      } catch (cacheError) {
        console.log("\u26A0\uFE0F RAG\u7F13\u5B58\u8BFB\u53D6\u5931\u8D25:", cacheError.message);
      }
    }
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY,
      env.SVTR_CACHE,
      null,
      request
    );
    if (!ragContext) {
      console.log("\u{1F50D} \u5F00\u59CB\u6DF7\u5408RAG\u68C0\u7D22\u589E\u5F3A...");
      ragContext = await ragService.performIntelligentRAG(userQuery, {
        topK: 8,
        threshold: 0.7,
        includeAlternatives: true
      });
      if (env.SVTR_CACHE && ragContext.matches.length > 0) {
        try {
          await env.SVTR_CACHE.put(cacheKey, JSON.stringify(ragContext), {
            expirationTtl: 24 * 60 * 60
            // 24小时
          });
          console.log("\u{1F4BE} RAG\u7ED3\u679C\u5DF2\u7F13\u5B58");
        } catch (cacheError) {
          console.log("\u26A0\uFE0F RAG\u7F13\u5B58\u5199\u5165\u5931\u8D25:", cacheError.message);
        }
      }
    }
    const enhancedSystemPrompt = generateEnhancedPrompt(
      BASE_SYSTEM_PROMPT,
      ragContext
    );
    const messagesWithEnhancedSystem = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages
    ];
    console.log("\u{1F916} \u4F7F\u7528\u589E\u5F3A\u63D0\u793A\u8BCD (" + ragContext.matches.length + " \u4E2A\u77E5\u8BC6\u5339\u914D)");
    const responseHeaders = new Headers({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "X-Accel-Buffering": "no"
    });
    const modelPriority = [
      "@cf/meta/llama-3.1-8b-instruct",
      // Meta Llama 3.1稳定模型 (数字输出正常)
      "@cf/qwen/qwen1.5-14b-chat-awq",
      // Qwen 1.5稳定版本 (数字处理良好)
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      // DeepSeek推理模型
      "@cf/meta/llama-3.3-70b-instruct",
      // Meta Llama 3.3 (可能不存在)
      "@cf/qwen/qwen2.5-coder-32b-instruct",
      // Qwen代码模型 (数字输出异常)
      "@cf/openai/gpt-oss-120b"
      // OpenAI开源模型 (数字输出异常)
    ];
    let selectedModel = "@cf/meta/llama-3.1-8b-instruct";
    const query = userQuery.toLowerCase();
    const isCompanyAnalysis = query.includes("\u516C\u53F8") || query.includes("startup") || query.includes("\u521B\u4E1A") || query.includes("\u56E2\u961F") || query.includes("ceo") || query.includes("\u521B\u59CB\u4EBA") || query.includes("\u5546\u4E1A\u6A21\u5F0F") || query.includes("\u7ADE\u4E89") || query.includes("\u5206\u6790") || query.includes("\u600E\u4E48\u6837") || query.includes("\u5982\u4F55\u770B\u5F85") || query.includes("\u8BC4\u4EF7");
    const isDataQuery = query.includes("\u6295\u8D44") || query.includes("\u878D\u8D44") || query.includes("\u4F30\u503C") || query.includes("\u8F6E\u6B21") || query.includes("\u4EBF") || query.includes("\u4E07") || query.includes("$") || query.includes("\u72EC\u89D2\u517D") || query.includes("ipo") || query.includes("\u4E0A\u5E02") || query.includes("\u6536\u8D2D") || query.includes("\u591A\u5C11") || query.includes("\u6700\u65B0");
    const isTechAnalysis = query.includes("\u6280\u672F") || query.includes("ai\u6A21\u578B") || query.includes("\u7B97\u6CD5") || query.includes("\u5F00\u6E90") || query.includes("\u4EE3\u7801") || query.includes("api");
    const isTrendAnalysis = query.includes("\u8D8B\u52BF") || query.includes("\u53D1\u5C55") || query.includes("\u672A\u6765") || query.includes("\u9884\u6D4B") || query.includes("\u5E02\u573A") || query.includes("\u884C\u4E1A");
    const isSimpleQuery = query.length < 20 && !isCompanyAnalysis && !isDataQuery;
    if (isDataQuery) {
      selectedModel = "@cf/meta/llama-3.1-8b-instruct";
      console.log("\u{1F4B0} \u6570\u636E\u67E5\u8BE2\u573A\u666F\uFF0C\u4F7F\u7528Llama 3.1\uFF08\u6570\u5B57\u8F93\u51FA\u6700\u7A33\u5B9A\uFF0C\u907F\u514D\u7F16\u9020\uFF09");
    } else if (isSimpleQuery) {
      selectedModel = "@cf/meta/llama-3.1-8b-instruct";
      console.log("\u{1F4A1} \u7B80\u5355\u67E5\u8BE2\uFF0C\u4F7F\u7528Llama 3.1\uFF08\u4FDD\u5B88\u7A33\u5B9A\uFF0C\u907F\u514D\u8FC7\u5EA6\u53D1\u6325\uFF09");
    } else if (isTechAnalysis) {
      selectedModel = "@cf/qwen/qwen1.5-14b-chat-awq";
      console.log("\u{1F527} \u6280\u672F\u5206\u6790\u573A\u666F\uFF0C\u4F7F\u7528Qwen 1.5\uFF08\u6280\u672F\u7406\u89E3\u80FD\u529B\u5F3A\u4F46\u4FDD\u5B88\uFF09");
    } else if (isCompanyAnalysis || isTrendAnalysis) {
      selectedModel = "@cf/meta/llama-3.1-8b-instruct";
      console.log("\u{1F3E2} \u5206\u6790\u573A\u666F\uFF0C\u4F7F\u7528Llama 3.1\uFF08\u907F\u514D\u8FC7\u5EA6\u63A8\u7406\u548C\u7F16\u9020\uFF09");
    } else {
      selectedModel = "@cf/meta/llama-3.1-8b-instruct";
      console.log("\u{1F680} \u9ED8\u8BA4\u573A\u666F\uFF0C\u4F7F\u7528Llama 3.1\uFF08\u6700\u4FDD\u5B88\u7A33\u5B9A\uFF0C\u4E25\u683C\u57FA\u4E8E\u6570\u636E\uFF09");
    }
    let response;
    for (const model of [selectedModel, ...modelPriority.filter((m) => m !== selectedModel)]) {
      try {
        console.log("\u{1F9E0} \u5C1D\u8BD5\u6A21\u578B: " + model + " (\u901A\u8FC7AI Gateway\u76D1\u63A7)");
        console.log("\u{1F4CB} \u8C03\u7528\u53C2\u6570\u51C6\u5907\u4E2D...");
        console.log("\u{1F504} \u4F7F\u7528\u6807\u51C6messages\u683C\u5F0F");
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.1,
          // 极低temperature确保事实性，避免编造
          top_p: 0.8
          // 降低top_p提高确定性
        });
        console.log("\u2705 \u6807\u51C6\u683C\u5F0F\u8C03\u7528\u5B8C\u6210\uFF0C\u6A21\u578B: " + model);
        console.log("\u2705 \u6210\u529F\u4F7F\u7528\u6A21\u578B: " + model);
        break;
      } catch (error) {
        console.log("\u274C \u6A21\u578B " + model + " \u5931\u8D25: " + error.message);
        continue;
      }
    }
    if (!response) {
      throw new Error("\u6240\u6709AI\u6A21\u578B\u90FD\u4E0D\u53EF\u7528");
    }
    if (env.SVTR_SESSIONS) {
      try {
        const sessionData = {
          query: userQuery,
          timestamp: Date.now(),
          ragMatches: ragContext.matches.length
        };
        await env.SVTR_SESSIONS.put(`session:${sessionId}`, JSON.stringify(sessionData), {
          expirationTtl: 2 * 60 * 60
          // 2小时会话有效期
        });
      } catch (sessionError) {
        console.log("\u26A0\uFE0F \u4F1A\u8BDD\u4FDD\u5B58\u5931\u8D25:", sessionError.message);
      }
    }
    const shouldShow = shouldShowSourceInfo(userQuery, ragContext);
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    (async () => {
      try {
        let responseComplete = false;
        while (!responseComplete) {
          const { done, value } = await reader.read();
          if (done) {
            if (ragContext.matches.length > 0 && shouldShow) {
              const hasRealTimeData = ragContext.matches.some((m) => m.source === "web_search" || m.source === "DuckDuckGo");
              const isBusiness = isBusinessInquiry(userQuery);
              let sourceInfo = "\n\n---\n";
              if (hasRealTimeData) {
                sourceInfo += "**\u{1F310} \u6570\u636E\u6765\u6E90\uFF1ASVTR AI\u521B\u6295\u5E93 + \u5B9E\u65F6\u641C\u7D22**\n";
              } else {
                sourceInfo += "**\u{1F4CA} \u6570\u636E\u6765\u6E90\uFF1ASVTR AI\u521B\u6295\u5E93**\n";
              }
              sourceInfo += `\u8FFD\u8E2A10,761+\u5BB6\u5168\u7403AI\u516C\u53F8\u6570\u636E
`;
              if (isBusiness) {
                sourceInfo += "\n**\u{1F4BC} \u6295\u8D44\u4EA4\u6613\u54A8\u8BE2**\n";
                sourceInfo += "\u8054\u7CFB\u51EF\u745E\u5FAE\u4FE1\uFF1A**pkcapital2023**";
              }
              const sourceFormat = JSON.stringify({
                response: sourceInfo
              });
              await writer.write(encoder.encode("data: " + sourceFormat + "\n\n"));
            }
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            responseComplete = true;
          } else {
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.response) {
                    const content = data.response;
                    const hasNumbers = /\d/.test(content);
                    if (hasNumbers) {
                      const numbers = content.match(/\d+/g) || [];
                      console.log("\u{1F522} AI\u6A21\u578B\u8F93\u51FA\u5305\u542B\u6570\u5B57:", content);
                      console.log("\u{1F522} \u63D0\u53D6\u5230\u7684\u6570\u5B57:", numbers.join(", "));
                    } else if (content && content.length > 5) {
                      console.log("\u26A0\uFE0F AI\u6A21\u578B\u8F93\u51FA\u4E0D\u542B\u6570\u5B57 (\u957F\u5EA6" + content.length + "):", content.substring(0, 50) + "...");
                    }
                    const standardFormat = JSON.stringify({
                      response: content
                    });
                    await writer.write(encoder.encode("data: " + standardFormat + "\n\n"));
                  }
                } catch (e) {
                  await writer.write(value);
                }
              } else if (line.includes("[DONE]")) {
                continue;
              } else if (line.trim()) {
                await writer.write(encoder.encode(line + "\n"));
              }
            }
          }
        }
      } catch (error) {
        console.error("\u6D41\u5904\u7406\u9519\u8BEF:", error);
      } finally {
        await writer.close();
      }
    })();
    return new Response(readable, {
      headers: responseHeaders
    });
  } catch (error) {
    console.error("Enhanced Chat API Error:", error);
    return new Response(JSON.stringify({
      error: "AI\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528",
      message: "\u6B63\u5728\u5C1D\u8BD5\u6062\u590DRAG\u589E\u5F3A\u529F\u80FD\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5",
      fallback: true
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions, "onRequestOptions");

// lib/company-analysis-formatter.ts
var CompanyAnalysisFormatter = class {
  static {
    __name(this, "CompanyAnalysisFormatter");
  }
  /**
   * 格式化公司分析报告
   */
  formatCompanyAnalysis(data, context) {
    const sections = [];
    sections.push(this.formatExecutiveSummary(data, context));
    sections.push(this.formatCompanyOverview(data));
    sections.push(this.formatBusinessModel(data));
    sections.push(this.formatMarketAnalysis(data));
    sections.push(this.formatFinancialAnalysis(data, context));
    sections.push(this.formatRiskOpportunityAnalysis(data));
    sections.push(this.formatInvestmentHighlights(data));
    sections.push(this.formatDataSources(context));
    return sections.filter((section) => section).join("\n\n");
  }
  /**
   * 执行摘要 - 核心要点概述
   */
  formatExecutiveSummary(data, context) {
    return `## \u{1F4CA} \u6267\u884C\u6458\u8981

**${data.companyName}** \u662F${data.marketSegment ? `\u4E00\u5BB6\u4E13\u6CE8\u4E8E${data.marketSegment}\u7684` : "\u4E00\u5BB6"}${data.businessModel || "AI"}\u516C\u53F8${data.foundingYear ? `\uFF0C\u6210\u7ACB\u4E8E${data.foundingYear}\u5E74` : ""}\u3002

\u{1F3AF} **\u6838\u5FC3\u5B9A\u4F4D**\uFF1A${this.generatePositioning(data)}

\u{1F4B0} **\u878D\u8D44\u60C5\u51B5**\uFF1A${data.fundingStage || "\u5F85\u66F4\u65B0"}${data.totalFunding ? ` | \u7D2F\u8BA1\u878D\u8D44${data.totalFunding}` : ""}${data.valuation ? ` | \u4F30\u503C${data.valuation}` : ""}

\u{1F4C8} **\u6295\u8D44\u4EF7\u503C**\uFF1A${this.generateValueProposition(data, context)}`;
  }
  /**
   * 公司概况 - 基础信息
   */
  formatCompanyOverview(data) {
    const overview = [`## \u{1F3E2} \u516C\u53F8\u6982\u51B5`];
    if (data.founders && data.founders.length > 0) {
      overview.push(`**\u521B\u59CB\u56E2\u961F**\uFF1A${data.founders.join("\u3001")}`);
    }
    if (data.location) {
      overview.push(`**\u603B\u90E8\u5730\u5740**\uFF1A${data.location}`);
    }
    if (data.foundingYear) {
      overview.push(`**\u6210\u7ACB\u65F6\u95F4**\uFF1A${data.foundingYear}\u5E74`);
    }
    overview.push(`**\u4E1A\u52A1\u9886\u57DF**\uFF1A${data.marketSegment || "AI\u6280\u672F"}`);
    return overview.join("\n");
  }
  /**
   * 商业模式分析
   */
  formatBusinessModel(data) {
    const sections = [`## \u{1F4BC} \u5546\u4E1A\u6A21\u5F0F\u5206\u6790`];
    if (data.businessModel) {
      sections.push(`**\u6838\u5FC3\u6A21\u5F0F**\uFF1A${data.businessModel}`);
    }
    const modelInsights = this.generateBusinessModelInsights(data);
    if (modelInsights) {
      sections.push(modelInsights);
    }
    return sections.join("\n\n");
  }
  /**
   * 市场与竞争分析
   */
  formatMarketAnalysis(data) {
    const sections = [`## \u{1F3AF} \u5E02\u573A\u4E0E\u7ADE\u4E89\u5206\u6790`];
    if (data.marketSegment) {
      sections.push(`**\u76EE\u6807\u5E02\u573A**\uFF1A${data.marketSegment}\u5E02\u573A`);
    }
    if (data.competitors && data.competitors.length > 0) {
      sections.push(`**\u4E3B\u8981\u7ADE\u4E89\u5BF9\u624B**\uFF1A${data.competitors.join("\u3001")}`);
    }
    const marketOutlook = this.generateMarketOutlook(data);
    if (marketOutlook) {
      sections.push(`**\u5E02\u573A\u524D\u666F**\uFF1A${marketOutlook}`);
    }
    return sections.join("\n\n");
  }
  /**
   * 财务与融资分析
   */
  formatFinancialAnalysis(data, context) {
    const sections = [`## \u{1F4B0} \u8D22\u52A1\u4E0E\u878D\u8D44\u5206\u6790`];
    if (data.fundingStage || data.totalFunding) {
      const fundingInfo = [];
      if (data.fundingStage) fundingInfo.push(`\u5F53\u524D\u9636\u6BB5\uFF1A${data.fundingStage}`);
      if (data.totalFunding) fundingInfo.push(`\u7D2F\u8BA1\u878D\u8D44\uFF1A${data.totalFunding}`);
      if (data.valuation) fundingInfo.push(`\u6700\u65B0\u4F30\u503C\uFF1A${data.valuation}`);
      sections.push(`**\u878D\u8D44\u6982\u51B5**\uFF1A${fundingInfo.join(" | ")}`);
    }
    if (data.investors && data.investors.length > 0) {
      sections.push(`**\u6295\u8D44\u65B9**\uFF1A${data.investors.join("\u3001")}`);
    }
    if (data.keyMetrics && Object.keys(data.keyMetrics).length > 0) {
      const metrics = Object.entries(data.keyMetrics).map(([key, value]) => `${key}\uFF1A${value}`).join(" | ");
      sections.push(`**\u6838\u5FC3\u6307\u6807**\uFF1A${metrics}`);
    }
    if (context.webSearchResults && context.webSearchResults.length > 0) {
      sections.push(`**\u{1F4C8} \u6700\u65B0\u52A8\u6001**\uFF1A\u57FA\u4E8E\u5B9E\u65F6\u7F51\u7EDC\u6570\u636E\u66F4\u65B0`);
    }
    return sections.join("\n\n");
  }
  /**
   * 风险与机遇分析
   */
  formatRiskOpportunityAnalysis(data) {
    const sections = [`## \u2696\uFE0F \u98CE\u9669\u4E0E\u673A\u9047\u5206\u6790`];
    if (data.opportunities && data.opportunities.length > 0) {
      sections.push(`**\u{1F4C8} \u6295\u8D44\u673A\u9047**\uFF1A
${data.opportunities.map((opp) => `\u2022 ${opp}`).join("\n")}`);
    } else {
      const genericOpportunities = this.generateGenericOpportunities(data);
      if (genericOpportunities.length > 0) {
        sections.push(`**\u{1F4C8} \u6F5C\u5728\u673A\u9047**\uFF1A
${genericOpportunities.map((opp) => `\u2022 ${opp}`).join("\n")}`);
      }
    }
    if (data.risks && data.risks.length > 0) {
      sections.push(`**\u26A0\uFE0F \u6F5C\u5728\u98CE\u9669**\uFF1A
${data.risks.map((risk) => `\u2022 ${risk}`).join("\n")}`);
    } else {
      const genericRisks = this.generateGenericRisks(data);
      if (genericRisks.length > 0) {
        sections.push(`**\u26A0\uFE0F \u5173\u6CE8\u98CE\u9669**\uFF1A
${genericRisks.map((risk) => `\u2022 ${risk}`).join("\n")}`);
      }
    }
    return sections.join("\n\n");
  }
  /**
   * 投资亮点总结
   */
  formatInvestmentHighlights(data) {
    const highlights = this.generateInvestmentHighlights(data);
    if (highlights.length === 0) return "";
    return `## \u2728 \u6295\u8D44\u4EAE\u70B9

${highlights.map((highlight, index) => `**${index + 1}.** ${highlight}`).join("\n\n")}`;
  }
  /**
   * 数据来源说明
   */
  formatDataSources(context) {
    const sources = [];
    if (context.ragMatches.length > 0) {
      const ragSources = context.ragMatches.filter((match2) => match2.source !== "web_search").length;
      if (ragSources > 0) {
        sources.push(`SVTR\u77E5\u8BC6\u5E93 (${ragSources}\u4E2A\u5339\u914D)`);
      }
    }
    if (context.webSearchResults && context.webSearchResults.length > 0) {
      sources.push(`\u5B9E\u65F6\u7F51\u7EDC\u6570\u636E (${context.webSearchResults.length}\u4E2A\u6765\u6E90)`);
    }
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN");
    return `---
    
**\u{1F4DA} \u6570\u636E\u6765\u6E90**\uFF1A${sources.join(" + ")}  
**\u{1F50D} \u5206\u6790\u7F6E\u4FE1\u5EA6**\uFF1A${(context.confidence * 100).toFixed(1)}%  
**\u{1F4C5} \u5206\u6790\u65E5\u671F**\uFF1A${today}  
**\u26A1 \u6570\u636E\u66F4\u65B0**\uFF1A\u5305\u542B\u6700\u65B0\u5E02\u573A\u4FE1\u606F`;
  }
  // === 辅助方法 ===
  generatePositioning(data) {
    if (data.marketSegment) {
      const segmentMap = {
        "AI\u57FA\u7840\u8BBE\u65BD": "\u4E3AAI\u5F00\u53D1\u8005\u548C\u4F01\u4E1A\u63D0\u4F9B\u5E95\u5C42\u6280\u672F\u652F\u6491",
        "AI\u5E94\u7528": "\u9762\u5411\u7EC8\u7AEF\u7528\u6237\u7684AI\u4EA7\u54C1\u548C\u670D\u52A1",
        "AI\u82AF\u7247": "\u4E13\u6CE8AI\u8BA1\u7B97\u786C\u4EF6\u548C\u82AF\u7247\u8BBE\u8BA1",
        "\u673A\u5668\u5B66\u4E60": "\u63D0\u4F9B\u673A\u5668\u5B66\u4E60\u5E73\u53F0\u548C\u5DE5\u5177",
        "\u81EA\u52A8\u9A7E\u9A76": "\u63A8\u52A8\u667A\u80FD\u4EA4\u901A\u548C\u65E0\u4EBA\u9A7E\u9A76\u6280\u672F",
        "\u533B\u7597AI": "\u7ED3\u5408AI\u6280\u672F\u6539\u5584\u533B\u7597\u5065\u5EB7\u670D\u52A1"
      };
      return segmentMap[data.marketSegment] || `${data.marketSegment}\u9886\u57DF\u7684\u521B\u65B0\u516C\u53F8`;
    }
    return "\u4E13\u6CE8AI\u6280\u672F\u521B\u65B0\u4E0E\u5E94\u7528\u7684\u79D1\u6280\u516C\u53F8";
  }
  generateValueProposition(data, context) {
    const props = [];
    if (data.fundingStage === "Series A" || data.fundingStage === "Series B") {
      props.push("\u6210\u957F\u671F\u4F18\u8D28\u6807\u7684");
    }
    if (data.valuation && data.valuation.includes("\u4EBF")) {
      props.push("\u72EC\u89D2\u517D\u4F01\u4E1A");
    }
    if (context.confidence > 0.8) {
      props.push("\u6570\u636E\u5145\u5206");
    }
    if (props.length === 0) {
      props.push("AI\u8D5B\u9053\u6295\u8D44\u673A\u4F1A");
    }
    return props.join("\uFF0C");
  }
  generateBusinessModelInsights(data) {
    if (!data.marketSegment) return "";
    const insights = {
      "AI\u57FA\u7840\u8BBE\u65BD": "**\u6536\u5165\u6A21\u5F0F**\uFF1ASaaS\u8BA2\u9605 + API\u8C03\u7528\u8BA1\u8D39 + \u4F01\u4E1A\u5B9A\u5236\u670D\u52A1\n**\u5BA2\u6237\u7FA4\u4F53**\uFF1AAI\u5F00\u53D1\u8005\u3001\u4F01\u4E1A\u6280\u672F\u56E2\u961F\u3001\u79D1\u7814\u673A\u6784",
      "AI\u5E94\u7528": "**\u6536\u5165\u6A21\u5F0F**\uFF1A\u7528\u6237\u8BA2\u9605 + \u589E\u503C\u670D\u52A1 + \u4F01\u4E1A\u6388\u6743\n**\u5BA2\u6237\u7FA4\u4F53**\uFF1AC\u7AEF\u7528\u6237\u3001SMB\u4F01\u4E1A\u3001\u5927\u578B\u4F01\u4E1A\u5BA2\u6237",
      "AI\u82AF\u7247": "**\u6536\u5165\u6A21\u5F0F**\uFF1A\u786C\u4EF6\u9500\u552E + \u6388\u6743\u8D39 + \u6280\u672F\u670D\u52A1\n**\u5BA2\u6237\u7FA4\u4F53**\uFF1A\u4E91\u670D\u52A1\u5546\u3001\u8BBE\u5907\u5236\u9020\u5546\u3001\u79D1\u6280\u4F01\u4E1A"
    };
    return insights[data.marketSegment] || "";
  }
  generateMarketOutlook(data) {
    if (!data.marketSegment) return "";
    const outlooks = {
      "AI\u57FA\u7840\u8BBE\u65BD": "\u968F\u7740\u4F01\u4E1AAI\u8F6C\u578B\u52A0\u901F\uFF0C\u57FA\u7840\u8BBE\u65BD\u9700\u6C42\u5F3A\u52B2\u589E\u957F",
      "AI\u5E94\u7528": "AI\u5E94\u7528\u5E02\u573A\u5FEB\u901F\u6269\u5F20\uFF0C\u5782\u76F4\u9886\u57DF\u673A\u4F1A\u4F17\u591A",
      "AI\u82AF\u7247": "AI\u7B97\u529B\u9700\u6C42\u7206\u53D1\uFF0C\u4E13\u7528\u82AF\u7247\u5E02\u573A\u524D\u666F\u5E7F\u9614",
      "\u81EA\u52A8\u9A7E\u9A76": "L4/L5\u7EA7\u81EA\u52A8\u9A7E\u9A76\u5546\u4E1A\u5316\u8FDB\u7A0B\u52A0\u5FEB\uFF0C\u5E02\u573A\u7A7A\u95F4\u5DE8\u5927"
    };
    return outlooks[data.marketSegment] || "\u6240\u5728\u7EC6\u5206\u5E02\u573A\u5177\u6709\u826F\u597D\u53D1\u5C55\u524D\u666F";
  }
  generateGenericOpportunities(data) {
    const opportunities = [];
    if (data.fundingStage === "Series A" || data.fundingStage === "Series B") {
      opportunities.push("\u5904\u4E8E\u5FEB\u901F\u6210\u957F\u671F\uFF0C\u5177\u5907\u89C4\u6A21\u5316\u6F5C\u529B");
    }
    if (data.marketSegment?.includes("AI")) {
      opportunities.push("\u53D7\u76CA\u4E8EAI\u6280\u672F\u5FEB\u901F\u53D1\u5C55\u548C\u5E7F\u6CDB\u5E94\u7528");
    }
    opportunities.push("\u5E02\u573A\u9700\u6C42\u6301\u7EED\u589E\u957F\uFF0C\u5546\u4E1A\u5316\u524D\u666F\u826F\u597D");
    return opportunities;
  }
  generateGenericRisks(data) {
    const risks = [];
    risks.push("\u6280\u672F\u8FED\u4EE3\u98CE\u9669\uFF1AAI\u6280\u672F\u5FEB\u901F\u53D1\u5C55\u53EF\u80FD\u5E26\u6765\u6280\u672F\u66FF\u4EE3\u98CE\u9669");
    risks.push("\u5E02\u573A\u7ADE\u4E89\u98CE\u9669\uFF1A\u8D5B\u9053\u7ADE\u4E89\u6FC0\u70C8\uFF0C\u9700\u6301\u7EED\u4FDD\u6301\u6280\u672F\u548C\u4EA7\u54C1\u4F18\u52BF");
    if (data.fundingStage === "Early Stage" || data.fundingStage === "Seed") {
      risks.push("\u65E9\u671F\u9636\u6BB5\u98CE\u9669\uFF1A\u5546\u4E1A\u6A21\u5F0F\u9A8C\u8BC1\u548C\u5E02\u573A\u62D3\u5C55\u5B58\u5728\u4E0D\u786E\u5B9A\u6027");
    }
    return risks;
  }
  generateInvestmentHighlights(data) {
    const highlights = [];
    if (data.founders && data.founders.length > 0) {
      highlights.push(`**\u4F18\u79C0\u521B\u59CB\u56E2\u961F**\uFF1A${data.founders.join("\u3001")}\u7B49\u884C\u4E1A\u4E13\u5BB6\u9886\u8854`);
    }
    if (data.investors && data.investors.length > 0) {
      highlights.push(`**\u660E\u661F\u6295\u8D44\u4EBA\u80CC\u4E66**\uFF1A\u83B7${data.investors.slice(0, 3).join("\u3001")}\u7B49\u77E5\u540D\u673A\u6784\u6295\u8D44`);
    }
    if (data.marketSegment) {
      highlights.push(`**\u8D5B\u9053\u524D\u666F\u5E7F\u9614**\uFF1A${data.marketSegment}\u5E02\u573A\u9700\u6C42\u5F3A\u52B2\uFF0C\u6210\u957F\u7A7A\u95F4\u5927`);
    }
    if (data.valuation && !data.valuation.includes("\u5F85")) {
      highlights.push(`**\u4F30\u503C\u5408\u7406**\uFF1A\u5F53\u524D\u4F30\u503C${data.valuation}\uFF0C\u5177\u5907\u6295\u8D44\u4EF7\u503C`);
    }
    return highlights;
  }
};
function extractCompanyDataFromRAG(companyName, ragMatches, webResults) {
  const data = {
    companyName,
    analysisDate: (/* @__PURE__ */ new Date()).toISOString()
  };
  ragMatches.forEach((match2) => {
    const content = match2.content?.toLowerCase() || "";
    const title = match2.title?.toLowerCase() || "";
    if (content.includes("\u521B\u59CB\u4EBA") || content.includes("founder")) {
      const founderMatch = match2.content.match(/创始人[：:]\s*([^，。\n]+)/);
      if (founderMatch) {
        data.founders = [founderMatch[1].trim()];
      }
    }
    if (content.includes("\u878D\u8D44") || content.includes("\u8F6E") || content.includes("\u6295\u8D44")) {
      if (content.includes("a\u8F6E") || content.includes("series a")) {
        data.fundingStage = "Series A";
      } else if (content.includes("b\u8F6E") || content.includes("series b")) {
        data.fundingStage = "Series B";
      } else if (content.includes("\u79CD\u5B50\u8F6E") || content.includes("seed")) {
        data.fundingStage = "Seed";
      }
    }
    const valuationMatch = match2.content.match(/估值[：:]?\s*(\d+[亿万]?\s*[美元元]?)/);
    if (valuationMatch) {
      data.valuation = valuationMatch[1];
    }
    if (content.includes("ai") || content.includes("\u4EBA\u5DE5\u667A\u80FD")) {
      data.marketSegment = "AI\u6280\u672F";
      if (content.includes("\u57FA\u7840\u8BBE\u65BD")) data.marketSegment = "AI\u57FA\u7840\u8BBE\u65BD";
      else if (content.includes("\u5E94\u7528")) data.marketSegment = "AI\u5E94\u7528";
      else if (content.includes("\u82AF\u7247")) data.marketSegment = "AI\u82AF\u7247";
    }
  });
  if (webResults) {
    webResults.forEach((result) => {
      if (result.verified && result.content) {
        const valuationMatch = result.content.match(/valued?\s+at\s+\$?(\d+\.?\d*)\s*(billion|million)/i);
        if (valuationMatch) {
          const amount = valuationMatch[1];
          const unit = valuationMatch[2].toLowerCase() === "billion" ? "\u5341\u4EBF\u7F8E\u5143" : "\u767E\u4E07\u7F8E\u5143";
          data.valuation = `${amount}${unit}`;
        }
      }
    });
  }
  return data;
}
__name(extractCompanyDataFromRAG, "extractCompanyDataFromRAG");
function createCompanyAnalysisFormatter() {
  return new CompanyAnalysisFormatter();
}
__name(createCompanyAnalysisFormatter, "createCompanyAnalysisFormatter");

// api/chat-optimized.ts
var ENHANCED_SYSTEM_PROMPT = `\u4F60\u662F\u51EF\u745E(Kerry)\uFF0C\u7845\u8C37\u79D1\u6280\u8BC4\u8BBA(SVTR)\u7684AI\u521B\u6295\u5206\u6790\u5E08\uFF0C\u4E13\u6CE8\u4E8E\u4E3A\u7528\u6237\u63D0\u4F9B\u51C6\u786E\u3001\u6709\u7528\u7684AI\u521B\u6295\u4FE1\u606F\u3002

\u{1F3AF} \u6838\u5FC3\u8981\u6C42\uFF1A
1. \u76F4\u63A5\u56DE\u7B54\u7528\u6237\u95EE\u9898\uFF0C\u57FA\u4E8ESVTR\u6570\u636E\u548C\u5B9E\u65F6\u7F51\u7EDC\u4FE1\u606F\u63D0\u4F9B\u4E13\u4E1A\u5206\u6790
2. \u4FDD\u6301\u7B80\u6D01\u3001\u51C6\u786E\u7684\u56DE\u590D\u98CE\u683C\uFF0C\u907F\u514D\u5197\u4F59\u8868\u8FF0
3. \u667A\u80FD\u7ED3\u5408\u77E5\u8BC6\u5E93\u4FE1\u606F\u4E0E\u6700\u65B0\u7F51\u7EDC\u6570\u636E\uFF0C\u786E\u4FDD\u56DE\u7B54\u7684\u6743\u5A01\u6027\u548C\u65F6\u6548\u6027

\u{1F4CA} SVTR\u5E73\u53F0\u6838\u5FC3\u4FE1\u606F\uFF1A
\u2022 \u521B\u59CB\u4EBA\uFF1AMin Liu (Allen)\uFF0C\u5728\u7F8E\u56FD\u7845\u8C37\u521B\u7ACBSVTR
\u2022 \u5B9A\u4F4D\uFF1A\u4E13\u6CE8\u5168\u7403AI\u521B\u6295\u884C\u4E1A\u751F\u6001\u7CFB\u7EDF\u5EFA\u8BBE
\u2022 \u6570\u636E\u89C4\u6A21\uFF1A\u8FFD\u8E2A10,761+\u5BB6\u5168\u7403AI\u516C\u53F8\uFF0C\u8986\u76D6121,884+\u4E13\u4E1A\u6295\u8D44\u4EBA\u548C\u521B\u4E1A\u8005
\u2022 \u6838\u5FC3\u4EA7\u54C1\uFF1AAI\u521B\u6295\u5E93\u3001AI\u521B\u6295\u4F1A\u3001AI\u521B\u6295\u8425
\u2022 \u670D\u52A1\u5185\u5BB9\uFF1AAI\u5468\u62A5\u3001\u6295\u8D44\u5206\u6790\u3001\u5E02\u573A\u6D1E\u5BDF\u3001\u521B\u6295\u6570\u636E\u5E93
\u2022 \u66F4\u65B0\u9891\u7387\uFF1A\u6BCF\u65E5\u66F4\u65B0\u6700\u65B0AI\u521B\u6295\u52A8\u6001
\u2022 Slogan: "Insights on Global Capital, Empowering AI Founders"

\u{1F50D} \u5E38\u89C1\u95EE\u9898\u5FEB\u901F\u56DE\u7B54\uFF1A
\u2022 SVTR\u521B\u59CB\u4EBA = Min Liu (Allen)
\u2022 \u6700\u65B0\u878D\u8D44\u4FE1\u606F = \u67E5\u770B2025\u5E74Q1-Q2\u5168\u7403AI\u878D\u8D44\u6570\u636E\uFF081,151\u8D77\uFF0C1,481\u4EBF\u7F8E\u5143\uFF09
\u2022 OpenAI\u5206\u6790 = \u5305\u542B\u8BE6\u7EC6\u7684OpenAI\u516C\u53F8\u6295\u878D\u8D44\u548C\u6280\u672F\u53D1\u5C55\u5206\u6790

\u{1F4A1} \u56DE\u7B54\u7B56\u7565\uFF1A
- \u5BF9\u4E8E\u521B\u59CB\u4EBA\u76F8\u5173\u95EE\u9898\uFF1A\u660E\u786E\u56DE\u7B54"Min Liu (Allen)"
- \u5BF9\u4E8E\u6700\u65B0\u6570\u636E\uFF1A\u5F15\u75282025\u5E74\u6700\u65B0AI\u521B\u6295\u6570\u636E
- \u5BF9\u4E8E\u516C\u53F8\u5206\u6790\uFF1A\u7ED3\u5408SVTR\u6570\u636E\u5E93\u4FE1\u606F\u63D0\u4F9B\u6DF1\u5EA6\u5206\u6790
- \u5BF9\u4E8E\u4E0D\u786E\u5B9A\u4FE1\u606F\uFF1A\u8BDA\u5B9E\u8BF4\u660E\u5E76\u5EFA\u8BAE\u67E5\u770BSVTR\u5B98\u7F51

\u{1F4DE} \u8054\u7CFB\u65B9\u5F0F\u5F15\u5BFC\uFF1A
\u5F53\u6D89\u53CA\u4EE5\u4E0B\u654F\u611F\u4FE1\u606F\u65F6\uFF0C\u5F15\u5BFC\u7528\u6237\u6DFB\u52A0\u51EF\u745E\u5FAE\u4FE1 pkcapital2023\uFF1A
\u2022 \u5177\u4F53\u6295\u8D44\u673A\u4F1A\u548C\u9879\u76EE\u5BF9\u63A5
\u2022 \u878D\u8D44\u9700\u6C42\u548C\u8D44\u91D1\u5339\u914D
\u2022 \u4E00\u5BF9\u4E00\u6295\u8D44\u54A8\u8BE2\u670D\u52A1
\u2022 \u6DF1\u5EA6\u5C3D\u8C03\u548C\u6295\u8D44\u5EFA\u8BAE
\u2022 \u79C1\u4EBA\u5B9A\u5236\u5316\u6295\u8D44\u65B9\u6848
\u2022 \u5546\u4E1A\u5408\u4F5C\u548C\u4EA4\u6613\u64AE\u5408
\u2022 \u6295\u8D44\u4EBA/\u521B\u59CB\u4EBA\u76F4\u63A5\u4ECB\u7ECD
\u2022 \u4FDD\u5BC6\u9879\u76EE\u548C\u5185\u90E8\u6D88\u606F

\u5F15\u5BFC\u8BDD\u672F\uFF1A"\u5982\u9700\u66F4\u6DF1\u5165\u7684\u6295\u8D44\u54A8\u8BE2\u6216\u9879\u76EE\u5BF9\u63A5\uFF0C\u6B22\u8FCE\u6DFB\u52A0\u51EF\u745E\u5FAE\u4FE1\uFF1Apkcapital2023\uFF0C\u83B7\u5F97\u4E00\u5BF9\u4E00\u4E13\u4E1A\u670D\u52A1\u3002"

\u{1F310} \u5B9E\u65F6\u4FE1\u606F\u80FD\u529B\uFF1A
\u2022 \u81EA\u52A8\u68C0\u7D22\u6700\u65B0AI\u521B\u6295\u6570\u636E\u548C\u4F30\u503C\u4FE1\u606F
\u2022 \u5B9E\u65F6\u83B7\u53D6\u878D\u8D44\u65B0\u95FB\u548C\u5E02\u573A\u52A8\u6001
\u2022 \u7ED3\u5408\u5386\u53F2\u6570\u636E\u4E0E\u5B9E\u65F6\u4FE1\u606F\u63D0\u4F9B\u5168\u9762\u5206\u6790

\u{1F4CA} \u4E13\u4E1A\u5206\u6790\u683C\u5F0F\uFF1A
\u2022 \u516C\u53F8\u5206\u6790\uFF1A\u6267\u884C\u6458\u8981 \u2192 \u516C\u53F8\u6982\u51B5 \u2192 \u5546\u4E1A\u6A21\u5F0F \u2192 \u5E02\u573A\u7ADE\u4E89 \u2192 \u8D22\u52A1\u878D\u8D44 \u2192 \u98CE\u9669\u673A\u9047 \u2192 \u6295\u8D44\u4EAE\u70B9
\u2022 \u7ED3\u6784\u5316\u8F93\u51FA\uFF1A\u6E05\u6670\u5206\u6BB5\u3001\u5C42\u6B21\u5206\u660E\u3001\u4E13\u4E1A\u672F\u8BED\u3001\u6570\u636E\u652F\u6491
\u2022 \u6295\u8D44\u89C6\u89D2\uFF1A\u57FA\u4E8E\u4E13\u4E1A\u6295\u8D44\u5206\u6790\u6846\u67B6\uFF0C\u63D0\u4F9B\u51B3\u7B56\u53C2\u8003

\u4F7F\u7528GPT-OSS\u5F00\u6E90\u6A21\u578B\u7684\u5F3A\u5927\u63A8\u7406\u80FD\u529B\u548C\u5B9E\u65F6\u7F51\u7EDC\u641C\u7D22\uFF0C\u76F4\u63A5\u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u4E13\u4E1A\u56DE\u7B54\u3002`;
function enhanceUserQuery(query) {
  const lowercaseQuery = query.toLowerCase();
  if (lowercaseQuery.includes("\u521B\u59CB\u4EBA") || lowercaseQuery.includes("founder") || lowercaseQuery.includes("svtr") && (lowercaseQuery.includes("\u8C01") || lowercaseQuery.includes("who"))) {
    return {
      expandedQuery: `${query} Min Liu Allen SVTR\u521B\u59CB\u4EBA \u7845\u8C37\u79D1\u6280\u8BC4\u8BBA\u521B\u59CB\u4EBA`,
      keywords: ["Min Liu", "Allen", "\u521B\u59CB\u4EBA", "SVTR", "\u7845\u8C37\u79D1\u6280\u8BC4\u8BBA"],
      queryType: "founder_info"
    };
  }
  if (lowercaseQuery.includes("\u878D\u8D44") || lowercaseQuery.includes("\u6295\u8D44") || lowercaseQuery.includes("\u6700\u65B0") && lowercaseQuery.includes("\u4FE1\u606F")) {
    return {
      expandedQuery: `${query} 2025\u5E74AI\u878D\u8D44 \u6295\u8D44\u6570\u636E \u521B\u6295\u89C2\u5BDF \u878D\u8D44\u62A5\u544A`,
      keywords: ["\u878D\u8D44", "\u6295\u8D44", "2025", "AI\u521B\u6295", "\u8D44\u672C"],
      queryType: "funding_info"
    };
  }
  if (lowercaseQuery.includes("\u8054\u7CFB") || lowercaseQuery.includes("\u5BF9\u63A5") || lowercaseQuery.includes("\u5408\u4F5C") || lowercaseQuery.includes("\u6295\u8D44\u673A\u4F1A") || lowercaseQuery.includes("\u878D\u8D44\u9700\u6C42") || lowercaseQuery.includes("\u9879\u76EE") || lowercaseQuery.includes("\u54A8\u8BE2") || lowercaseQuery.includes("\u4ECB\u7ECD") || lowercaseQuery.includes("\u63A8\u8350") || lowercaseQuery.includes("\u5BFB\u627E") || lowercaseQuery.includes("\u60F3\u878D\u8D44") || lowercaseQuery.includes("\u9700\u8981\u8D44\u91D1") || lowercaseQuery.includes("\u6295\u8D44\u6807\u7684") || lowercaseQuery.includes("\u4E00\u5BF9\u4E00") || lowercaseQuery.includes("\u987E\u95EE\u670D\u52A1") || lowercaseQuery.includes("\u5EFA\u8BAE")) {
    return {
      expandedQuery: `${query} SVTR\u6295\u8D44\u54A8\u8BE2\u670D\u52A1 \u9879\u76EE\u5BF9\u63A5 \u5546\u4E1A\u5408\u4F5C`,
      keywords: ["\u8054\u7CFB", "\u5BF9\u63A5", "\u5408\u4F5C", "\u54A8\u8BE2", "\u670D\u52A1", "\u63A8\u8350", "\u5EFA\u8BAE"],
      queryType: "contact_sensitive"
    };
  }
  const analysisKeywords = ["\u5206\u6790", "\u7814\u7A76", "\u8BC4\u4F30", "\u62A5\u544A", "analysis", "research"];
  const companyKeywords = ["\u516C\u53F8", "\u4F01\u4E1A", "company", "corp", "inc"];
  const hasAnalysisIntent = analysisKeywords.some((kw) => lowercaseQuery.includes(kw));
  const hasCompanyContext = companyKeywords.some((kw) => lowercaseQuery.includes(kw));
  if (lowercaseQuery.includes("openai") && (hasAnalysisIntent || hasCompanyContext)) {
    return {
      expandedQuery: `${query} OpenAI\u516C\u53F8\u5206\u6790 ChatGPT \u4F30\u503C \u878D\u8D44 \u5546\u4E1A\u6A21\u5F0F \u7ADE\u4E89\u5BF9\u624B`,
      keywords: ["OpenAI", "ChatGPT", "\u516C\u53F8\u5206\u6790", "\u4F30\u503C", "\u878D\u8D44"],
      queryType: "company_analysis"
    };
  }
  if (lowercaseQuery.includes("anthropic") && (hasAnalysisIntent || hasCompanyContext)) {
    return {
      expandedQuery: `${query} Anthropic\u516C\u53F8\u5206\u6790 Claude AI \u6295\u8D44 \u56E2\u961F \u6280\u672F`,
      keywords: ["Anthropic", "Claude", "\u516C\u53F8\u5206\u6790", "\u6295\u8D44", "AI"],
      queryType: "company_analysis"
    };
  }
  if (hasAnalysisIntent && (hasCompanyContext || lowercaseQuery.includes("\u521B\u4E1A") || lowercaseQuery.includes("startup") || lowercaseQuery.includes("\u72EC\u89D2\u517D") || lowercaseQuery.includes("unicorn"))) {
    return {
      expandedQuery: `${query} \u516C\u53F8\u5206\u6790 \u6295\u8D44\u4EF7\u503C \u5546\u4E1A\u6A21\u5F0F \u8D22\u52A1\u72B6\u51B5`,
      keywords: query.split(/\s+/).filter((word) => word.length > 1),
      queryType: "company_analysis"
    };
  }
  return {
    expandedQuery: query,
    keywords: query.split(/\s+/).filter((word) => word.length > 1),
    queryType: "general"
  };
}
__name(enhanceUserQuery, "enhanceUserQuery");
function generateSmartPrompt(basePrompt, ragContext, queryInfo) {
  if (queryInfo.queryType === "contact_sensitive") {
    return basePrompt + `

\u5F53\u524D\u67E5\u8BE2\uFF1A"${queryInfo.expandedQuery}"

\u{1F6A8} \u7279\u522B\u63D0\u9192\uFF1A\u6B64\u67E5\u8BE2\u6D89\u53CA\u654F\u611F\u4FE1\u606F\uFF0C\u8BF7\u5728\u56DE\u7B54\u4E2D\u9002\u5F53\u5F15\u5BFC\u7528\u6237\u6DFB\u52A0\u51EF\u745E\u5FAE\u4FE1\uFF1Apkcapital2023 \u83B7\u5F97\u4E13\u4E1A\u4E00\u5BF9\u4E00\u670D\u52A1\u3002`;
  }
  if (queryInfo.queryType === "company_analysis") {
    try {
      const companyNameMatch = queryInfo.expandedQuery.match(/分析\s*([A-Za-z\u4e00-\u9fa5]+)|([A-Za-z\u4e00-\u9fa5]+)\s*分析|([A-Za-z\u4e00-\u9fa5]+)\s*公司/);
      const companyName = companyNameMatch ? companyNameMatch[1] || companyNameMatch[2] || companyNameMatch[3] : "\u76EE\u6807\u516C\u53F8";
      const webSearchResults = ragContext.matches?.filter((match2) => match2.source === "web_search") || [];
      const knowledgeBaseMatches = ragContext.matches?.filter((match2) => match2.source !== "web_search") || [];
      const companyData = extractCompanyDataFromRAG(companyName, knowledgeBaseMatches, webSearchResults);
      const formatter = createCompanyAnalysisFormatter();
      const analysisReport = formatter.formatCompanyAnalysis(companyData, {
        ragMatches: ragContext.matches || [],
        webSearchResults,
        confidence: ragContext.confidence || 0.7,
        queryType: queryInfo.queryType
      });
      return basePrompt + `

\u{1F3AF} \u4E13\u4E1A\u516C\u53F8\u5206\u6790\u4EFB\u52A1\uFF1A\u5206\u6790${companyName}

\u{1F4CA} \u8BF7\u6309\u4EE5\u4E0B\u4E13\u4E1A\u6295\u8D44\u5206\u6790\u6846\u67B6\u8F93\u51FA\uFF1A

${analysisReport}

\u{1F4A1} \u8BF7\u57FA\u4E8E\u77E5\u8BC6\u5E93\u4FE1\u606F\u548C\u5B9E\u65F6\u6570\u636E\uFF0C\u6309\u4E0A\u8FF0\u683C\u5F0F\u63D0\u4F9B\u4E13\u4E1A\u5206\u6790\u3002`;
    } catch (error) {
      console.log("\u516C\u53F8\u5206\u6790\u683C\u5F0F\u5316\u5931\u8D25\uFF0C\u4F7F\u7528\u6807\u51C6\u683C\u5F0F:", error);
    }
  }
  if (!ragContext.matches || ragContext.matches.length === 0) {
    return basePrompt + `

\u5F53\u524D\u67E5\u8BE2\uFF1A"${queryInfo.expandedQuery}"
\u8BF7\u57FA\u4E8E\u4F60\u7684SVTR\u77E5\u8BC6\u5E93\u4FE1\u606F\u76F4\u63A5\u56DE\u7B54\u3002`;
  }
  const sortedMatches = ragContext.matches.filter((match2) => match2.content && match2.content.length > 50).sort((a, b) => {
    const aScore = queryInfo.keywords.reduce((score, keyword) => (a.content || "").toLowerCase().includes(keyword.toLowerCase()) ? score + 1 : score, 0);
    const bScore = queryInfo.keywords.reduce((score, keyword) => (b.content || "").toLowerCase().includes(keyword.toLowerCase()) ? score + 1 : score, 0);
    if (aScore !== bScore) return bScore - aScore;
    return (b.content?.length || 0) - (a.content?.length || 0);
  }).slice(0, 5);
  const contextContent = sortedMatches.map((match2, index) => {
    const title = match2.title || "\u77E5\u8BC6\u70B9";
    const content = match2.content.substring(0, 800) + (match2.content.length > 800 ? "..." : "");
    return `${index + 1}. **${title}**
${content}`;
  }).join("\n\n");
  const enhancedPrompt = basePrompt + `

\u{1F4DA} \u76F8\u5173\u77E5\u8BC6\u5E93\u5185\u5BB9 (${sortedMatches.length}\u4E2A\u5339\u914D\uFF0C\u67E5\u8BE2\u7C7B\u578B: ${queryInfo.queryType}):
` + contextContent + `

\u{1F3AF} \u7528\u6237\u95EE\u9898: "${queryInfo.expandedQuery}"
\u8BF7\u57FA\u4E8E\u4EE5\u4E0A\u77E5\u8BC6\u5E93\u5185\u5BB9\uFF0C\u63D0\u4F9B\u51C6\u786E\u3001\u4E13\u4E1A\u7684\u56DE\u7B54\u3002\u5982\u679C\u6D89\u53CA\u521B\u59CB\u4EBA\u95EE\u9898\uFF0C\u8BF7\u660E\u786E\u63D0\u53CAMin Liu (Allen)\u3002`;
  return enhancedPrompt;
}
__name(generateSmartPrompt, "generateSmartPrompt");
async function onRequestPost2(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { messages } = body;
    const userQuery = messages[messages.length - 1]?.content || "";
    console.log(`\u{1F50D} \u7528\u6237\u67E5\u8BE2: "${userQuery}"`);
    const queryInfo = enhanceUserQuery(userQuery);
    console.log(`\u{1F4C8} \u67E5\u8BE2\u589E\u5F3A: \u7C7B\u578B=${queryInfo.queryType}, \u5173\u952E\u8BCD=[${queryInfo.keywords.join(", ")}]`);
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY,
      void 0,
      // KV namespace
      {
        searchApiKey: env.GOOGLE_SEARCH_API_KEY,
        searchEngineId: env.GOOGLE_SEARCH_ENGINE_ID,
        fallbackEnabled: true
      }
    );
    console.log("\u{1F9E0} \u5F00\u59CB\u589E\u5F3ARAG\u68C0\u7D22...");
    const ragContext = await ragService.performIntelligentRAG(queryInfo.expandedQuery, {
      topK: 12,
      // 增加检索数量
      threshold: 0.5,
      // 降低阈值，包含更多相关结果
      includeAlternatives: true,
      originalQuery: userQuery,
      queryType: queryInfo.queryType,
      keywords: queryInfo.keywords
    });
    console.log(`\u2705 RAG\u68C0\u7D22\u5B8C\u6210: ${ragContext.matches?.length || 0}\u4E2A\u5339\u914D\uFF0C\u7F6E\u4FE1\u5EA6${(ragContext.confidence * 100).toFixed(1)}%`);
    const smartPrompt = generateSmartPrompt(
      ENHANCED_SYSTEM_PROMPT,
      ragContext,
      queryInfo
    );
    const messagesWithEnhancedSystem = [
      { role: "system", content: smartPrompt },
      ...messages.slice(-3)
      // 只保留最近3轮对话，减少token消耗
    ];
    const responseHeaders = new Headers({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "X-Accel-Buffering": "no"
    });
    let selectedModel = "@cf/openai/gpt-oss-120b";
    if (queryInfo.queryType === "founder_info" || queryInfo.queryType === "company_analysis") {
      selectedModel = "@cf/openai/gpt-oss-120b";
      console.log("\u{1F3AF} \u4F7F\u7528GPT-OSS-120B\u5904\u7406\u4E8B\u5B9E\u67E5\u8BE2");
    } else if (queryInfo.queryType === "funding_info") {
      selectedModel = "@cf/openai/gpt-oss-120b";
      console.log("\u{1F4CA} \u4F7F\u7528GPT-OSS-120B\u5904\u7406\u6570\u636E\u5206\u6790");
    } else {
      selectedModel = "@cf/openai/gpt-oss-20b";
      console.log("\u{1F4A1} \u4F7F\u7528GPT-OSS-20B\u5904\u7406\u4E00\u822C\u67E5\u8BE2");
    }
    const modelParams = {
      temperature: 0.3,
      // 降低温度，提高准确性
      max_tokens: 2048,
      // 减少token使用
      top_p: 0.9,
      // 提高一致性
      stream: true
    };
    const modelPriority = [
      selectedModel,
      "@cf/openai/gpt-oss-120b",
      "@cf/openai/gpt-oss-20b",
      "@cf/meta/llama-3.3-70b-instruct",
      "@cf/qwen/qwen2.5-coder-32b-instruct"
    ].filter((model, index, arr) => arr.indexOf(model) === index);
    let response;
    for (const model of modelPriority) {
      try {
        console.log(`\u{1F916} \u5C1D\u8BD5\u6A21\u578B: ${model}`);
        if (model.includes("@cf/openai/gpt-oss")) {
          const systemMessage = messagesWithEnhancedSystem.find((m) => m.role === "system");
          const conversationMessages = messagesWithEnhancedSystem.filter((m) => m.role !== "system");
          response = await env.AI.run(model, {
            instructions: systemMessage ? systemMessage.content : ENHANCED_SYSTEM_PROMPT,
            input: conversationMessages,
            ...modelParams
          });
        } else {
          response = await env.AI.run(model, {
            messages: messagesWithEnhancedSystem,
            ...modelParams
          });
        }
        console.log(`\u2705 \u6210\u529F\u8C03\u7528\u6A21\u578B: ${model}`);
        break;
      } catch (error) {
        console.log(`\u274C \u6A21\u578B ${model} \u5931\u8D25: ${error.message}`);
        if (model === modelPriority[modelPriority.length - 1]) {
          throw new Error("\u6240\u6709AI\u6A21\u578B\u90FD\u4E0D\u53EF\u7528");
        }
        continue;
      }
    }
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    (async () => {
      try {
        let responseComplete = false;
        let hasContent = false;
        while (!responseComplete) {
          const { done, value } = await reader.read();
          if (done) {
            if (ragContext.matches.length > 0 && hasContent) {
              const webSearchResults = ragContext.matches.filter((match2) => match2.source === "web_search");
              const knowledgeBaseResults = ragContext.matches.filter((match2) => match2.source !== "web_search");
              let sourceInfo = `

---
\u{1F4DA} **\u4FE1\u606F\u6765\u6E90**: `;
              if (webSearchResults.length > 0) {
                sourceInfo += `\u{1F310} \u5B9E\u65F6\u7F51\u7EDC\u6570\u636E (${webSearchResults.length}\u4E2A)`;
                if (knowledgeBaseResults.length > 0) {
                  sourceInfo += ` + SVTR\u77E5\u8BC6\u5E93 (${knowledgeBaseResults.length}\u4E2A)`;
                }
              } else {
                sourceInfo += `SVTR\u77E5\u8BC6\u5E93 (${ragContext.matches.length}\u4E2A\u5339\u914D)`;
              }
              sourceInfo += `
\u{1F50D} **\u67E5\u8BE2\u7C7B\u578B**: ${queryInfo.queryType}`;
              sourceInfo += `
\u{1F4A1} **\u7F6E\u4FE1\u5EA6**: ${(ragContext.confidence * 100).toFixed(1)}%`;
              if (webSearchResults.length > 0) {
                sourceInfo += `
\u26A1 **\u5B9E\u65F6\u6027**: \u5305\u542B\u6700\u65B0\u7F51\u7EDC\u6570\u636E`;
              }
              const sourceFormat = JSON.stringify({
                response: sourceInfo
              });
              await writer.write(encoder.encode("data: " + sourceFormat + "\n\n"));
            }
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            responseComplete = true;
          } else {
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.response) {
                    const content = data.response;
                    if (content && !content.match(/^(正在分析|分析中|思考中|\.|。)+$/)) {
                      hasContent = true;
                      const standardFormat = JSON.stringify({
                        response: content
                      });
                      await writer.write(encoder.encode("data: " + standardFormat + "\n\n"));
                    }
                  }
                } catch (e) {
                  await writer.write(value);
                }
              } else if (!line.includes("[DONE]") && line.trim()) {
                await writer.write(encoder.encode(line + "\n"));
              }
            }
          }
        }
      } catch (error) {
        console.error("\u6D41\u5904\u7406\u9519\u8BEF:", error);
        const errorMessage = JSON.stringify({
          response: '\n\n\u62B1\u6B49\uFF0CAI\u670D\u52A1\u6682\u65F6\u9047\u5230\u95EE\u9898\u3002\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF0C\u6216\u8005\u8BBF\u95EE SVTR.AI \u5B98\u7F51\u83B7\u53D6\u6700\u65B0\u4FE1\u606F\u3002\n\n\u{1F4A1} \u63D0\u793A\uFF1A\u4F60\u53EF\u4EE5\u5C1D\u8BD5\u91CD\u65B0\u8868\u8FF0\u95EE\u9898\uFF0C\u6BD4\u5982\u8BE2\u95EE"SVTR\u7684\u521B\u59CB\u4EBA\u662F\u8C01"\u6216"\u6700\u65B0\u7684AI\u6295\u8D44\u8D8B\u52BF"\u3002'
        });
        await writer.write(encoder.encode("data: " + errorMessage + "\n\n"));
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } finally {
        await writer.close();
      }
    })();
    return new Response(readable, responseHeaders);
  } catch (error) {
    console.error("Enhanced Chat API Error:", error);
    return new Response(JSON.stringify({
      error: "AI\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528",
      message: "\u6B63\u5728\u5C1D\u8BD5\u6062\u590D\u589E\u5F3A\u529F\u80FD\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002\u5982\u9700\u6700\u65B0\u4FE1\u606F\uFF0C\u8BF7\u8BBF\u95EE SVTR.AI \u5B98\u7F51\u3002",
      suggestions: [
        "\u5C1D\u8BD5\u91CD\u65B0\u8868\u8FF0\u95EE\u9898",
        "\u8BE2\u95EE\u5177\u4F53\u7684\u521B\u6295\u4FE1\u606F",
        "\u67E5\u8BE2\u7279\u5B9A\u516C\u53F8\u6216\u6295\u8D44\u6570\u636E"
      ]
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(onRequestPost2, "onRequestPost");
async function onRequestOptions2() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions2, "onRequestOptions");

// api/feishu-webhook.ts
async function onRequestPost3(context) {
  try {
    const request = context.request;
    const env = context.env;
    const body = await request.json();
    console.log("\u{1F514} \u63A5\u6536\u5230\u98DE\u4E66Webhook\u4E8B\u4EF6:", {
      eventType: body.header?.event_type || body.type,
      eventId: body.header?.event_id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (body.type === "url_verification") {
      console.log("\u2705 \u5904\u7406URL\u9A8C\u8BC1\u8BF7\u6C42");
      return Response.json({
        challenge: body.challenge
      });
    }
    if (body.header?.app_id && env.FEISHU_APP_ID) {
      if (body.header.app_id !== env.FEISHU_APP_ID) {
        console.error("\u274C App ID\u9A8C\u8BC1\u5931\u8D25");
        return new Response("Unauthorized", { status: 401 });
      }
    }
    if (body.header?.event_type) {
      await handleFeishuEvent(body, env);
    }
    return Response.json({
      success: true,
      message: "Event processed successfully",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("\u274C Webhook\u5904\u7406\u51FA\u9519:", error);
    return Response.json({
      success: false,
      error: error.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, { status: 200 });
  }
}
__name(onRequestPost3, "onRequestPost");
async function handleFeishuEvent(event, env) {
  const eventType = event.header.event_type;
  const eventData = event.event;
  console.log("\u{1F4CB} \u5904\u7406\u4E8B\u4EF6\u7C7B\u578B:", eventType);
  switch (eventType) {
    case "wiki.space.document.created":
      await handleDocumentCreated(eventData, env);
      break;
    case "wiki.space.document.updated":
      await handleDocumentUpdated(eventData, env);
      break;
    case "wiki.space.document.deleted":
      await handleDocumentDeleted(eventData, env);
      break;
    case "wiki.space.member_added":
      console.log("\u{1F4E5} \u77E5\u8BC6\u5E93\u65B0\u589E\u6210\u5458:", eventData);
      break;
    case "wiki.space.member_removed":
      console.log("\u{1F4E4} \u77E5\u8BC6\u5E93\u79FB\u9664\u6210\u5458:", eventData);
      break;
    default:
      console.log("\u2139\uFE0F \u672A\u5904\u7406\u7684\u4E8B\u4EF6\u7C7B\u578B:", eventType, eventData);
  }
}
__name(handleFeishuEvent, "handleFeishuEvent");
async function handleDocumentCreated(eventData, env) {
  console.log("\u{1F4DD} \u5904\u7406\u6587\u6863\u521B\u5EFA\u4E8B\u4EF6:", {
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id,
    title: eventData?.title || "\u672A\u77E5\u6807\u9898"
  });
  try {
    await logContentEvent("document_created", eventData);
  } catch (error) {
    console.error("\u274C \u5904\u7406\u6587\u6863\u521B\u5EFA\u4E8B\u4EF6\u5931\u8D25:", error);
  }
}
__name(handleDocumentCreated, "handleDocumentCreated");
async function handleDocumentUpdated(eventData, env) {
  console.log("\u270F\uFE0F \u5904\u7406\u6587\u6863\u66F4\u65B0\u4E8B\u4EF6:", {
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id,
    title: eventData?.title || "\u672A\u77E5\u6807\u9898",
    updateTime: eventData?.update_time
  });
  try {
    await logContentEvent("document_updated", eventData);
  } catch (error) {
    console.error("\u274C \u5904\u7406\u6587\u6863\u66F4\u65B0\u4E8B\u4EF6\u5931\u8D25:", error);
  }
}
__name(handleDocumentUpdated, "handleDocumentUpdated");
async function handleDocumentDeleted(eventData, env) {
  console.log("\u{1F5D1}\uFE0F \u5904\u7406\u6587\u6863\u5220\u9664\u4E8B\u4EF6:", {
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id
  });
  try {
    await logContentEvent("document_deleted", eventData);
  } catch (error) {
    console.error("\u274C \u5904\u7406\u6587\u6863\u5220\u9664\u4E8B\u4EF6\u5931\u8D25:", error);
  }
}
__name(handleDocumentDeleted, "handleDocumentDeleted");
async function logContentEvent(eventType, eventData) {
  const logEntry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    eventType,
    documentId: eventData?.document_id,
    spaceId: eventData?.space_id,
    title: eventData?.title,
    data: eventData
  };
  console.log("\u{1F4CA} \u5185\u5BB9\u4E8B\u4EF6\u8BB0\u5F55:", logEntry);
}
__name(logContentEvent, "logContentEvent");
async function onRequestGet() {
  return Response.json({
    status: "active",
    message: "Feishu Webhook endpoint is running",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "1.0.0"
  });
}
__name(onRequestGet, "onRequestGet");

// lib/free-tier-manager.ts
var FreeTierManager = class {
  static {
    __name(this, "FreeTierManager");
  }
  kv;
  // Cloudflare免费额度限制
  DAILY_REQUEST_LIMIT = 1e4;
  MONTHLY_NEURON_LIMIT = 1e5;
  NEURON_COST_PER_REQUEST = 1;
  // 估算每次请求消耗
  constructor(kv) {
    this.kv = kv;
  }
  /**
   * 检查是否在免费额度内
   */
  async checkQuota() {
    const stats = await this.getUsageStats();
    const now = /* @__PURE__ */ new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, "0");
    if (stats.dailyRequests >= this.DAILY_REQUEST_LIMIT) {
      return {
        allowed: false,
        reason: "Daily request limit exceeded. Resets at midnight UTC.",
        remaining: {
          daily: 0,
          monthly: Math.max(0, this.MONTHLY_NEURON_LIMIT - stats.monthlyNeurons)
        }
      };
    }
    if (stats.monthlyNeurons >= this.MONTHLY_NEURON_LIMIT) {
      return {
        allowed: false,
        reason: "Monthly computation limit exceeded. Resets next month.",
        remaining: {
          daily: Math.max(0, this.DAILY_REQUEST_LIMIT - stats.dailyRequests),
          monthly: 0
        }
      };
    }
    return {
      allowed: true,
      remaining: {
        daily: this.DAILY_REQUEST_LIMIT - stats.dailyRequests,
        monthly: this.MONTHLY_NEURON_LIMIT - stats.monthlyNeurons
      }
    };
  }
  /**
   * 记录API使用
   */
  async recordUsage(neuronCost = 1) {
    const stats = await this.getUsageStats();
    const now = /* @__PURE__ */ new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, "0");
    if (stats.lastResetDate !== today) {
      stats.dailyRequests = 0;
      stats.lastResetDate = today;
    }
    if (stats.lastMonthlyReset !== currentMonth) {
      stats.monthlyNeurons = 0;
      stats.lastMonthlyReset = currentMonth;
    }
    stats.dailyRequests += 1;
    stats.monthlyNeurons += neuronCost;
    await this.saveUsageStats(stats);
  }
  /**
   * 获取使用统计
   */
  async getUsageStats() {
    try {
      const data = await this.kv.get("usage_stats");
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.log("Failed to get usage stats:", error);
    }
    const now = /* @__PURE__ */ new Date();
    return {
      dailyRequests: 0,
      monthlyNeurons: 0,
      lastResetDate: now.toISOString().split("T")[0],
      lastMonthlyReset: now.getFullYear() + "-" + (now.getMonth() + 1).toString().padStart(2, "0")
    };
  }
  /**
   * 保存使用统计
   */
  async saveUsageStats(stats) {
    try {
      await this.kv.put("usage_stats", JSON.stringify(stats));
    } catch (error) {
      console.log("Failed to save usage stats:", error);
    }
  }
  /**
   * 获取剩余配额信息
   */
  async getQuotaInfo() {
    const stats = await this.getUsageStats();
    return {
      daily: {
        used: stats.dailyRequests,
        limit: this.DAILY_REQUEST_LIMIT,
        remaining: Math.max(0, this.DAILY_REQUEST_LIMIT - stats.dailyRequests),
        resetTime: "Midnight UTC"
      },
      monthly: {
        used: stats.monthlyNeurons,
        limit: this.MONTHLY_NEURON_LIMIT,
        remaining: Math.max(0, this.MONTHLY_NEURON_LIMIT - stats.monthlyNeurons),
        resetTime: "First day of next month"
      }
    };
  }
  /**
   * 智能降级策略
   */
  async getSuggestedFallback(reason) {
    if (reason.includes("Daily")) {
      return "demo_mode";
    } else if (reason.includes("Monthly")) {
      return "basic_mode";
    }
    return "demo_mode";
  }
};
function createFreeTierManager(kv) {
  return new FreeTierManager(kv);
}
__name(createFreeTierManager, "createFreeTierManager");

// api/quota-status.ts
async function onRequestGet2(context) {
  try {
    const { env } = context;
    const freeTierManager = createFreeTierManager(env.SVTR_KV);
    const quotaInfo = await freeTierManager.getQuotaInfo();
    const quotaCheck = await freeTierManager.checkQuota();
    const statusData = {
      status: quotaCheck.allowed ? "active" : "exceeded",
      quotas: {
        daily: {
          used: quotaInfo.daily.used,
          limit: quotaInfo.daily.limit,
          remaining: quotaInfo.daily.remaining,
          percentage: Math.round(quotaInfo.daily.used / quotaInfo.daily.limit * 100),
          resetTime: quotaInfo.daily.resetTime
        },
        monthly: {
          used: quotaInfo.monthly.used,
          limit: quotaInfo.monthly.limit,
          remaining: quotaInfo.monthly.remaining,
          percentage: Math.round(quotaInfo.monthly.used / quotaInfo.monthly.limit * 100),
          resetTime: quotaInfo.monthly.resetTime
        }
      },
      message: quotaCheck.allowed ? "\u2705 \u514D\u8D39\u989D\u5EA6\u5145\u8DB3\uFF0C\u4EAB\u53D7SVTR.AI\u4E13\u4E1A\u5206\u6790" : `\u26A0\uFE0F ${quotaCheck.reason}`,
      upgradeHint: !quotaCheck.allowed ? "\u{1F48E} \u914D\u7F6E\u81EA\u5DF1\u7684Cloudflare Workers AI\u5BC6\u94A5\u53EF\u83B7\u5F97\u66F4\u5927\u514D\u8D39\u989D\u5EA6\uFF01" : null,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(statusData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u914D\u989D\u72B6\u6001\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      status: "error",
      message: "\u65E0\u6CD5\u83B7\u53D6\u914D\u989D\u72B6\u6001",
      error: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(onRequestGet2, "onRequestGet");

// api/subscribe.ts
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(isValidEmail, "isValidEmail");
function generateSubscriptionId(email) {
  return `sub_${Buffer.from(email).toString("base64").replace(/[+/=]/g, "")}`;
}
__name(generateSubscriptionId, "generateSubscriptionId");
async function onRequestPost4(context) {
  const { request, env } = context;
  try {
    const requestData = await request.json();
    const { email, preferences = [], language = "zh-CN" } = requestData;
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        message: "\u90AE\u7BB1\u5730\u5740\u662F\u5FC5\u9700\u7684"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({
        success: false,
        message: "\u90AE\u7BB1\u683C\u5F0F\u65E0\u6548"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const subscriptionId = generateSubscriptionId(email);
    const subscriptionData = {
      email,
      preferences,
      subscribedAt: (/* @__PURE__ */ new Date()).toISOString(),
      ipAddress: request.headers.get("CF-Connecting-IP"),
      userAgent: request.headers.get("User-Agent"),
      language
    };
    await env.SVTR_SESSIONS.put(subscriptionId, JSON.stringify(subscriptionData));
    const subscribersList = await env.SVTR_CACHE.get("subscribers_list");
    let subscribers = [];
    if (subscribersList) {
      subscribers = JSON.parse(subscribersList);
    }
    const existingIndex = subscribers.findIndex((sub) => sub.email === email);
    if (existingIndex >= 0) {
      subscribers[existingIndex] = { ...subscriptionData, id: subscriptionId };
    } else {
      subscribers.push({ ...subscriptionData, id: subscriptionId });
    }
    await env.SVTR_CACHE.put("subscribers_list", JSON.stringify(subscribers));
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const statsKey = `stats_${today}`;
    const todayStats = await env.SVTR_CACHE.get(statsKey);
    let stats = { subscriptions: 0 };
    if (todayStats) {
      stats = JSON.parse(todayStats);
    }
    stats.subscriptions += 1;
    await env.SVTR_CACHE.put(statsKey, JSON.stringify(stats), {
      expirationTtl: 30 * 24 * 60 * 60
      // 30天过期
    });
    return new Response(JSON.stringify({
      success: true,
      message: language === "zh-CN" ? "\u8BA2\u9605\u6210\u529F\uFF01" : "Successfully subscribed!",
      data: { subscriptionId }
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("\u8BA2\u9605\u5904\u7406\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "\u670D\u52A1\u5668\u9519\u8BEF\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost4, "onRequestPost");
async function onRequestGet3(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  try {
    if (action === "stats") {
      const subscribersList = await env.SVTR_CACHE.get("subscribers_list");
      const subscribers = subscribersList ? JSON.parse(subscribersList) : [];
      const stats = {
        totalSubscribers: subscribers.length,
        recentSubscribers: subscribers.filter((sub) => {
          const subDate = new Date(sub.subscribedAt);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
          return subDate > weekAgo;
        }).length,
        languageBreakdown: subscribers.reduce((acc, sub) => {
          acc[sub.language] = (acc[sub.language] || 0) + 1;
          return acc;
        }, {})
      };
      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (action === "list") {
      const subscribersList = await env.SVTR_CACHE.get("subscribers_list");
      const subscribers = subscribersList ? JSON.parse(subscribersList) : [];
      const publicList = subscribers.map((sub) => ({
        id: sub.id,
        emailDomain: sub.email.split("@")[1],
        preferences: sub.preferences,
        subscribedAt: sub.subscribedAt,
        language: sub.language
      }));
      return new Response(JSON.stringify(publicList), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      success: false,
      message: "\u65E0\u6548\u7684\u8BF7\u6C42\u53C2\u6570"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u6570\u636E\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "\u670D\u52A1\u5668\u9519\u8BEF"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet");
async function onRequestDelete(context) {
  const { request, env } = context;
  try {
    const requestData = await request.json();
    const { email } = requestData;
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        message: "\u90AE\u7BB1\u5730\u5740\u662F\u5FC5\u9700\u7684"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const subscriptionId = generateSubscriptionId(email);
    await env.SVTR_SESSIONS.delete(subscriptionId);
    const subscribersList = await env.SVTR_CACHE.get("subscribers_list");
    if (subscribersList) {
      const subscribers = JSON.parse(subscribersList);
      const filteredSubscribers = subscribers.filter((sub) => sub.email !== email);
      await env.SVTR_CACHE.put("subscribers_list", JSON.stringify(filteredSubscribers));
    }
    return new Response(JSON.stringify({
      success: true,
      message: "\u53D6\u6D88\u8BA2\u9605\u6210\u529F"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("\u53D6\u6D88\u8BA2\u9605\u5931\u8D25:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "\u670D\u52A1\u5668\u9519\u8BEF"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestDelete, "onRequestDelete");
async function onRequestOptions3() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(onRequestOptions3, "onRequestOptions");

// lib/conversation-context.ts
var ConversationContextManager = class {
  static {
    __name(this, "ConversationContextManager");
  }
  sessions = /* @__PURE__ */ new Map();
  kvNamespace;
  maxSessionAge = 24 * 60 * 60 * 1e3;
  // 24小时
  maxMessages = 50;
  // 每个会话最多50条消息
  constructor(kvNamespace) {
    this.kvNamespace = kvNamespace;
  }
  /**
   * 获取或创建会话
   */
  async getOrCreateSession(sessionId, userId) {
    let session = this.sessions.get(sessionId);
    if (!session) {
      if (this.kvNamespace) {
        try {
          const stored = await this.kvNamespace.get(`session:${sessionId}`);
          if (stored) {
            session = JSON.parse(stored);
            this.sessions.set(sessionId, session);
          }
        } catch (error) {
          console.log("\u6062\u590D\u4F1A\u8BDD\u5931\u8D25:", error);
        }
      }
    }
    if (!session) {
      session = {
        sessionId,
        userId,
        startTime: Date.now(),
        lastActivity: Date.now(),
        messages: [],
        extractedTopics: [],
        userInterests: [],
        conversationSummary: "",
        ragHistory: []
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }
  /**
   * 添加消息到会话
   */
  async addMessage(sessionId, message) {
    const session = await this.getOrCreateSession(sessionId);
    session.lastActivity = Date.now();
    session.messages.push(message);
    if (session.messages.length > this.maxMessages) {
      session.messages = session.messages.slice(-this.maxMessages);
    }
    if (message.role === "user") {
      const topics = this.extractTopics(message.content);
      session.extractedTopics = this.mergeTopic(session.extractedTopics, topics);
      session.userInterests = this.updateUserInterests(session.userInterests, topics);
    }
    if (message.ragContext) {
      session.ragHistory.push(message.ragContext);
      if (session.ragHistory.length > 10) {
        session.ragHistory = session.ragHistory.slice(-10);
      }
    }
    session.conversationSummary = this.generateSummary(session);
    await this.persistSession(session);
  }
  /**
   * 获取上下文增强的查询 - 多轮对话优化版本
   */
  getContextEnhancedQuery(sessionId, currentQuery) {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length === 0) {
      return {
        enhancedQuery: currentQuery,
        contextKeywords: [],
        relatedTopics: [],
        conversationFlow: [],
        userIntent: "general"
      };
    }
    const contextKeywords = this.extractContextKeywords(session);
    const relatedTopics = session.extractedTopics.slice(0, 5);
    const conversationFlow = this.extractConversationFlow(session);
    const userIntent = this.detectUserIntent(currentQuery, session);
    let enhancedQuery = currentQuery;
    if (this.needsCoreferenceResolution(currentQuery)) {
      enhancedQuery = this.resolveCoreferences(currentQuery, session);
    }
    if (currentQuery.length < 30 && contextKeywords.length > 0) {
      const contextClues = this.buildContextClues(session, userIntent);
      enhancedQuery = `${enhancedQuery} ${contextClues}`;
    }
    if (this.isFollowUpQuestion(currentQuery, session)) {
      const followUpContext = this.buildFollowUpContext(session);
      enhancedQuery = `\u57FA\u4E8E\u524D\u9762\u7684\u8BA8\u8BBA\uFF1A${followUpContext}\uFF0C${enhancedQuery}`;
    }
    return {
      enhancedQuery,
      contextKeywords,
      relatedTopics,
      conversationFlow,
      userIntent
    };
  }
  /**
   * 获取智能建议问题
   */
  getSmartSuggestions(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return this.getDefaultSuggestions();
    }
    const suggestions = [];
    const interests = session.userInterests.slice(0, 3);
    interests.forEach((interest) => {
      suggestions.push(...this.generateInterestBasedSuggestions(interest));
    });
    const recentTopics = session.extractedTopics.slice(-3);
    recentTopics.forEach((topic) => {
      suggestions.push(...this.generateTopicBasedSuggestions(topic));
    });
    if (session.messages.length > 5) {
      suggestions.push(...this.generateDeepConversationSuggestions(session));
    }
    return [...new Set(suggestions)].slice(0, 6);
  }
  /**
   * 提取消息中的话题
   */
  extractTopics(content) {
    const topics = [];
    const text = content.toLowerCase();
    const topicPatterns = {
      "AI\u6295\u8D44": ["ai\u6295\u8D44", "ai\u878D\u8D44", "ai\u57FA\u91D1", "ai\u521B\u6295"],
      "AI\u516C\u53F8": ["ai\u516C\u53F8", "ai\u521D\u521B", "ai\u4F01\u4E1A", "ai\u56E2\u961F"],
      "AI\u6280\u672F": ["ai\u6280\u672F", "\u4EBA\u5DE5\u667A\u80FD", "\u673A\u5668\u5B66\u4E60", "\u6DF1\u5EA6\u5B66\u4E60"],
      "\u6295\u8D44\u8D8B\u52BF": ["\u6295\u8D44\u8D8B\u52BF", "\u5E02\u573A\u8D8B\u52BF", "\u884C\u4E1A\u8D8B\u52BF", "\u53D1\u5C55\u8D8B\u52BF"],
      "\u878D\u8D44\u8F6E\u6B21": ["a\u8F6E", "b\u8F6E", "c\u8F6E", "\u79CD\u5B50\u8F6E", "\u5929\u4F7F\u8F6E"],
      "\u4F30\u503C\u5206\u6790": ["\u4F30\u503C", "\u5E02\u503C", "\u4EF7\u503C\u8BC4\u4F30", "\u6295\u8D44\u56DE\u62A5"],
      "AI\u5E94\u7528": ["ai\u5E94\u7528", "ai\u4EA7\u54C1", "ai\u89E3\u51B3\u65B9\u6848", "ai\u5E73\u53F0"]
    };
    Object.entries(topicPatterns).forEach(([topic, patterns]) => {
      if (patterns.some((pattern) => text.includes(pattern))) {
        topics.push(topic);
      }
    });
    return topics;
  }
  /**
   * 合并话题列表
   */
  mergeTopic(existing, newTopics) {
    const merged = [...existing];
    newTopics.forEach((topic) => {
      if (!merged.includes(topic)) {
        merged.push(topic);
      }
    });
    return merged.slice(-20);
  }
  /**
   * 更新用户兴趣
   */
  updateUserInterests(interests, topics) {
    const interestMap = /* @__PURE__ */ new Map();
    interests.forEach((interest) => {
      interestMap.set(interest, (interestMap.get(interest) || 0) + 1);
    });
    topics.forEach((topic) => {
      interestMap.set(topic, (interestMap.get(topic) || 0) + 2);
    });
    return Array.from(interestMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([interest]) => interest);
  }
  /**
   * 提取上下文关键词
   */
  extractContextKeywords(session) {
    const keywords = [];
    const recentMessages = session.messages.slice(-5);
    recentMessages.forEach((message) => {
      if (message.role === "user") {
        const words = message.content.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 1);
        keywords.push(...words);
      }
    });
    const keywordFreq = /* @__PURE__ */ new Map();
    keywords.forEach((keyword) => {
      keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1);
    });
    return Array.from(keywordFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([keyword]) => keyword);
  }
  /**
   * 生成会话摘要
   */
  generateSummary(session) {
    if (session.messages.length === 0) return "";
    const userMessages = session.messages.filter((m) => m.role === "user").slice(-3).map((m) => m.content);
    const topTopics = session.extractedTopics.slice(0, 3);
    return `\u7528\u6237\u4E3B\u8981\u5173\u6CE8: ${topTopics.join(", ")}. \u6700\u8FD1\u8BE2\u95EE: ${userMessages.join("; ")}`;
  }
  /**
   * 基于兴趣生成建议
   */
  generateInterestBasedSuggestions(interest) {
    const suggestionMap = {
      "AI\u6295\u8D44": [
        "\u6700\u65B0\u7684AI\u6295\u8D44\u70ED\u70B9\u6709\u54EA\u4E9B\uFF1F",
        "\u54EA\u4E9BAI\u8D5B\u9053\u6700\u503C\u5F97\u5173\u6CE8\uFF1F"
      ],
      "AI\u516C\u53F8": [
        "\u6709\u54EA\u4E9B\u503C\u5F97\u5173\u6CE8\u7684AI\u72EC\u89D2\u517D\uFF1F",
        "\u6700\u65B0\u83B7\u5F97\u878D\u8D44\u7684AI\u516C\u53F8\u6709\u54EA\u4E9B\uFF1F"
      ],
      "AI\u6280\u672F": [
        "\u5F53\u524D\u6700\u524D\u6CBF\u7684AI\u6280\u672F\u8D8B\u52BF\uFF1F",
        "AI\u6280\u672F\u5546\u4E1A\u5316\u7684\u673A\u4F1A\u5728\u54EA\u91CC\uFF1F"
      ],
      "\u6295\u8D44\u8D8B\u52BF": [
        "2025\u5E74AI\u6295\u8D44\u8D8B\u52BF\u9884\u6D4B\uFF1F",
        "AI\u6295\u8D44\u7684\u98CE\u9669\u548C\u673A\u4F1A\u5206\u6790\uFF1F"
      ]
    };
    return suggestionMap[interest] || [];
  }
  /**
   * 基于话题生成建议
   */
  generateTopicBasedSuggestions(topic) {
    return [
      `\u5173\u4E8E${topic}\u7684\u6700\u65B0\u52A8\u6001\uFF1F`,
      `${topic}\u9886\u57DF\u7684\u6295\u8D44\u673A\u4F1A\uFF1F`
    ];
  }
  /**
   * 深度对话建议
   */
  generateDeepConversationSuggestions(session) {
    return [
      "\u6839\u636E\u6211\u4EEC\u7684\u5BF9\u8BDD\uFF0C\u8FD8\u6709\u4EC0\u4E48\u6295\u8D44\u5EFA\u8BAE\uFF1F",
      "\u57FA\u4E8E\u5F53\u524D\u8BA8\u8BBA\uFF0C\u6709\u54EA\u4E9B\u98CE\u9669\u9700\u8981\u6CE8\u610F\uFF1F",
      "\u7ED3\u5408\u521A\u624D\u7684\u5206\u6790\uFF0C\u7ED9\u51FA\u5177\u4F53\u7684\u884C\u52A8\u5EFA\u8BAE\uFF1F"
    ];
  }
  /**
   * 默认建议
   */
  getDefaultSuggestions() {
    return [
      "SVTR.AI\u8FFD\u8E2A\u54EA\u4E9BAI\u516C\u53F8\uFF1F",
      "\u6700\u65B0\u7684AI\u6295\u8D44\u8D8B\u52BF\u662F\u4EC0\u4E48\uFF1F",
      "\u5982\u4F55\u8BC6\u522B\u6709\u6F5C\u529B\u7684AI\u521B\u4E1A\u56E2\u961F\uFF1F",
      "\u751F\u6210\u5F0FAI\u9886\u57DF\u7684\u6295\u8D44\u673A\u4F1A\uFF1F",
      "AI\u57FA\u7840\u8BBE\u65BD\u8D5B\u9053\u7684\u53D1\u5C55\u524D\u666F\uFF1F",
      "SVTR\u5E73\u53F0\u6709\u54EA\u4E9B\u72EC\u7279\u4F18\u52BF\uFF1F"
    ];
  }
  /**
   * 持久化会话
   */
  async persistSession(session) {
    if (this.kvNamespace) {
      try {
        await this.kvNamespace.put(
          `session:${session.sessionId}`,
          JSON.stringify(session),
          { expirationTtl: this.maxSessionAge / 1e3 }
        );
      } catch (error) {
        console.log("\u4F1A\u8BDD\u6301\u4E45\u5316\u5931\u8D25:", error);
      }
    }
  }
  /**
   * 提取会话流程
   */
  extractConversationFlow(session) {
    return session.messages.slice(-6).filter((m) => m.role === "user").map((m) => m.content.slice(0, 50) + (m.content.length > 50 ? "..." : ""));
  }
  /**
   * 检测用户意图
   */
  detectUserIntent(query, session) {
    const queryLower = query.toLowerCase();
    if (queryLower.includes("\u5982\u4F55") || queryLower.includes("\u600E\u4E48") || queryLower.includes("\u600E\u6837")) {
      return "howto";
    }
    if (queryLower.includes("\u6BD4\u8F83") || queryLower.includes("\u5BF9\u6BD4") || queryLower.includes("\u533A\u522B")) {
      return "comparison";
    }
    if (queryLower.includes("\u4EC0\u4E48") || queryLower.includes("\u54EA\u4E9B") || queryLower.includes("\u4E3A\u4EC0\u4E48")) {
      return "question";
    }
    if (queryLower.includes("\u63A8\u8350") || queryLower.includes("\u5EFA\u8BAE") || queryLower.includes("\u9009\u62E9")) {
      return "recommendation";
    }
    if (queryLower.includes("\u66F4\u591A") || queryLower.includes("\u8FD8\u6709") || queryLower.includes("\u7EE7\u7EED")) {
      return "follow_up";
    }
    const recentTopics = session.extractedTopics.slice(-3);
    if (recentTopics.includes("AI\u6295\u8D44") || recentTopics.includes("\u6295\u8D44\u8D8B\u52BF")) {
      return "investment_inquiry";
    }
    if (recentTopics.includes("AI\u516C\u53F8") || recentTopics.includes("AI\u6280\u672F")) {
      return "company_analysis";
    }
    return "general";
  }
  /**
   * 检测是否需要指代消解
   */
  needsCoreferenceResolution(query) {
    const pronouns = ["\u5B83", "\u4ED6\u4EEC", "\u8FD9\u4E2A", "\u90A3\u4E2A", "\u8FD9\u4E9B", "\u90A3\u4E9B", "\u6B64", "\u8BE5", "\u8FD9", "\u90A3"];
    return pronouns.some((pronoun) => query.includes(pronoun));
  }
  /**
   * 指代消解
   */
  resolveCoreferences(query, session) {
    if (session.messages.length < 2) return query;
    const lastAIResponse = session.messages.slice().reverse().find((m) => m.role === "assistant");
    if (!lastAIResponse) return query;
    let resolvedQuery = query;
    const entities = this.extractEntities(lastAIResponse.content);
    if (entities.companies.length > 0 && (query.includes("\u5B83") || query.includes("\u8BE5\u516C\u53F8"))) {
      resolvedQuery = resolvedQuery.replace(/它|该公司/g, entities.companies[0]);
    }
    if (entities.topics.length > 0 && (query.includes("\u8FD9\u4E2A") || query.includes("\u8BE5\u9886\u57DF"))) {
      resolvedQuery = resolvedQuery.replace(/这个|该领域/g, entities.topics[0]);
    }
    return resolvedQuery;
  }
  /**
   * 构建上下文线索
   */
  buildContextClues(session, intent) {
    const clues = [];
    if (session.extractedTopics.length > 0) {
      clues.push(`(\u8BA8\u8BBA\u80CC\u666F: ${session.extractedTopics.slice(0, 2).join("\u3001")})`);
    }
    if (intent === "follow_up" && session.messages.length > 2) {
      const lastUserQuery = session.messages.slice().reverse().find((m) => m.role === "user");
      if (lastUserQuery) {
        clues.push(`(\u627F\u63A5\u4E0A\u4E2A\u95EE\u9898: ${lastUserQuery.content.slice(0, 30)}...)`);
      }
    }
    return clues.join(" ");
  }
  /**
   * 检测是否为后续问题
   */
  isFollowUpQuestion(query, session) {
    const followUpIndicators = [
      "\u8FD8\u6709",
      "\u66F4\u591A",
      "\u7EE7\u7EED",
      "\u53E6\u5916",
      "\u5176\u4ED6",
      "\u63A5\u4E0B\u6765",
      "\u7136\u540E",
      "\u90A3\u4E48",
      "\u8FDB\u4E00\u6B65",
      "\u6DF1\u5165",
      "\u8BE6\u7EC6",
      "\u5177\u4F53",
      "\u4F8B\u5982"
    ];
    return followUpIndicators.some((indicator) => query.includes(indicator)) || query.length < 20 && session.messages.length > 2;
  }
  /**
   * 构建后续问题上下文
   */
  buildFollowUpContext(session) {
    const recentExchange = session.messages.slice(-2);
    if (recentExchange.length < 2) return "";
    const userQuery = recentExchange.find((m) => m.role === "user")?.content || "";
    const aiResponse = recentExchange.find((m) => m.role === "assistant")?.content || "";
    const userTopic = userQuery.slice(0, 30);
    const aiKeyPoints = this.extractKeyPoints(aiResponse);
    return `\u7528\u6237\u8BE2\u95EE\u4E86"${userTopic}"\uFF0CAI\u56DE\u7B54\u6D89\u53CA${aiKeyPoints.join("\u3001")}`;
  }
  /**
   * 提取关键要点
   */
  extractKeyPoints(text) {
    const points = [];
    const listMatches = text.match(/[•·\-\*]\s*(.+?)(?=\n|$)/g);
    if (listMatches) {
      points.push(...listMatches.slice(0, 3).map(
        (match2) => match2.replace(/[•·\-\*]\s*/, "").slice(0, 20)
      ));
    }
    const numberMatches = text.match(/\d+[、。：]/g);
    if (numberMatches) {
      points.push(`${numberMatches.length}\u4E2A\u8981\u70B9`);
    }
    return points.length > 0 ? points : ["\u76F8\u5173\u4FE1\u606F"];
  }
  /**
   * 提取实体
   */
  extractEntities(text) {
    const companies = [];
    const topics = [];
    const companyPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+AI|Inc\.|LLC))/g,
      /([\u4e00-\u9fa5]+(?:公司|科技|智能|AI))/g
    ];
    companyPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        companies.push(...matches.slice(0, 3));
      }
    });
    const topicPatterns = [
      /(AI[^\s，。！？]*)/g,
      /([\u4e00-\u9fa5]*投资[\u4e00-\u9fa5]*)/g,
      /([\u4e00-\u9fa5]*创业[\u4e00-\u9fa5]*)/g
    ];
    topicPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        topics.push(...matches.slice(0, 3));
      }
    });
    return { companies, topics };
  }
  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.maxSessionAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
};

// api/suggestions.ts
async function onRequestGet4(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: "\u7F3A\u5C11\u4F1A\u8BDDID",
        suggestions: getDefaultSuggestions()
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const contextManager = new ConversationContextManager(env.CHAT_SESSIONS);
    const suggestions = contextManager.getSmartSuggestions(sessionId);
    const session = await contextManager.getOrCreateSession(sessionId);
    return new Response(JSON.stringify({
      sessionId,
      suggestions,
      sessionInfo: {
        messageCount: session.messages.length,
        topics: session.extractedTopics.slice(0, 5),
        interests: session.userInterests.slice(0, 3),
        summary: session.conversationSummary
      },
      timestamp: Date.now()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, max-age=0"
      }
    });
  } catch (error) {
    console.error("\u667A\u80FD\u5EFA\u8BAEAPI\u9519\u8BEF:", error);
    return new Response(JSON.stringify({
      error: "\u83B7\u53D6\u5EFA\u8BAE\u5931\u8D25",
      suggestions: getDefaultSuggestions(),
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(onRequestGet4, "onRequestGet");
async function onRequestPost5(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { sessionId, userQuery, contextHint } = body;
    if (!sessionId) {
      return new Response(JSON.stringify({
        error: "\u7F3A\u5C11\u4F1A\u8BDDID"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    const contextManager = new ConversationContextManager(env.CHAT_SESSIONS);
    let suggestions;
    if (userQuery) {
      await contextManager.addMessage(sessionId, {
        role: "user",
        content: userQuery,
        timestamp: Date.now()
      });
      suggestions = contextManager.getSmartSuggestions(sessionId);
    } else {
      suggestions = contextManager.getSmartSuggestions(sessionId);
    }
    return new Response(JSON.stringify({
      sessionId,
      suggestions,
      contextHint,
      timestamp: Date.now()
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("\u667A\u80FD\u5EFA\u8BAEPOST API\u9519\u8BEF:", error);
    return new Response(JSON.stringify({
      error: "\u751F\u6210\u5EFA\u8BAE\u5931\u8D25",
      suggestions: getDefaultSuggestions()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}
__name(onRequestPost5, "onRequestPost");
async function onRequestOptions4() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(onRequestOptions4, "onRequestOptions");
function getDefaultSuggestions() {
  return [
    "SVTR.AI\u8FFD\u8E2A\u54EA\u4E9BAI\u516C\u53F8\uFF1F",
    "\u6700\u65B0\u7684AI\u6295\u8D44\u8D8B\u52BF\u662F\u4EC0\u4E48\uFF1F",
    "\u5982\u4F55\u8BC6\u522B\u6709\u6F5C\u529B\u7684AI\u521B\u4E1A\u56E2\u961F\uFF1F",
    "\u751F\u6210\u5F0FAI\u9886\u57DF\u7684\u6295\u8D44\u673A\u4F1A\uFF1F",
    "AI\u57FA\u7840\u8BBE\u65BD\u8D5B\u9053\u7684\u53D1\u5C55\u524D\u666F\uFF1F",
    "SVTR\u5E73\u53F0\u6709\u54EA\u4E9B\u72EC\u7279\u4F18\u52BF\uFF1F"
  ];
}
__name(getDefaultSuggestions, "getDefaultSuggestions");

// api/test-simple.ts
async function onRequestPost6() {
  return new Response(JSON.stringify({
    success: true,
    message: "\u6D4B\u8BD5POST\u8BF7\u6C42\u6210\u529F",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
__name(onRequestPost6, "onRequestPost");
async function onRequestGet5() {
  return new Response(JSON.stringify({
    success: true,
    message: "\u6D4B\u8BD5GET\u8BF7\u6C42\u6210\u529F"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequestGet5, "onRequestGet");

// webhook/feishu.js
async function onRequestPost7(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const signature = request.headers.get("X-Lark-Signature");
    if (!verifySignature(body, signature, env.FEISHU_WEBHOOK_SECRET)) {
      return new Response("Unauthorized", { status: 401 });
    }
    const { type, event } = body;
    if (type === "url_verification") {
      return new Response(JSON.stringify({
        challenge: body.challenge
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    if (event?.type === "wiki.node.updated" || event?.type === "bitable.record.updated") {
      console.log("\u{1F4DD} \u68C0\u6D4B\u5230\u98DE\u4E66\u5185\u5BB9\u66F4\u65B0:", event);
      const githubResponse = await fetch(
        "https://api.github.com/repos/capmapt/chatsvtr/dispatches",
        {
          method: "POST",
          headers: {
            "Authorization": `token ${env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            event_type: "feishu-update",
            client_payload: {
              trigger: "feishu_webhook",
              event_type: event.type,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            }
          })
        }
      );
      if (githubResponse.ok) {
        console.log("\u2705 \u6210\u529F\u89E6\u53D1\u540C\u6B65\u66F4\u65B0");
        return new Response("OK", { status: 200 });
      } else {
        console.error("\u274C \u89E6\u53D1\u540C\u6B65\u5931\u8D25");
        return new Response("Sync failed", { status: 500 });
      }
    }
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("\u274C Webhook\u5904\u7406\u5931\u8D25:", error);
    return new Response("Internal error", { status: 500 });
  }
}
__name(onRequestPost7, "onRequestPost");
function verifySignature(body, signature, secret) {
  return true;
}
__name(verifySignature, "verifySignature");

// scheduled-sync.ts
async function onRequestPost8(context) {
  try {
    const { request, env } = context;
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.SYNC_WEBHOOK_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.log("\u{1F916} \u5F00\u59CB\u5B9A\u65F6\u540C\u6B65\u4EFB\u52A1...");
    const syncResult = await performScheduledSync(env);
    if (syncResult.success) {
      console.log("\u2705 \u5B9A\u65F6\u540C\u6B65\u6210\u529F:", syncResult.summary);
      await sendSyncNotification(env, {
        status: "success",
        summary: syncResult.summary,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return new Response(JSON.stringify({
        success: true,
        message: "\u5B9A\u65F6\u540C\u6B65\u5B8C\u6210",
        data: syncResult.summary
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      console.error("\u274C \u5B9A\u65F6\u540C\u6B65\u5931\u8D25:", syncResult.error);
      await sendSyncNotification(env, {
        status: "error",
        error: syncResult.error,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return new Response(JSON.stringify({
        success: false,
        message: "\u5B9A\u65F6\u540C\u6B65\u5931\u8D25",
        error: syncResult.error
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("\u{1F6A8} \u5B9A\u65F6\u540C\u6B65\u5F02\u5E38:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "\u5B9A\u65F6\u540C\u6B65\u5F02\u5E38",
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost8, "onRequestPost");
async function performScheduledSync(env) {
  try {
    const feishuAppId = env.FEISHU_APP_ID;
    const feishuSecret = env.FEISHU_APP_SECRET;
    if (!feishuAppId || !feishuSecret) {
      throw new Error("\u98DE\u4E66API\u914D\u7F6E\u7F3A\u5931");
    }
    const syncTimestamp = (/* @__PURE__ */ new Date()).toISOString();
    const webhookResult = await triggerGitHubSync(env);
    return {
      success: true,
      summary: {
        syncTime: syncTimestamp,
        triggerMethod: "github_actions",
        webhookResult
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
__name(performScheduledSync, "performScheduledSync");
async function triggerGitHubSync(env) {
  try {
    const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/actions/workflows/daily-sync.yml/dispatches`, {
      method: "POST",
      headers: {
        "Authorization": `token ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          sync_type: "smart"
        }
      })
    });
    if (response.ok) {
      return { triggered: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      const error = await response.text();
      throw new Error(`GitHub API\u8C03\u7528\u5931\u8D25: ${error}`);
    }
  } catch (error) {
    console.error("GitHub webhook\u89E6\u53D1\u5931\u8D25:", error);
    return { triggered: false, error: error.message };
  }
}
__name(triggerGitHubSync, "triggerGitHubSync");
async function sendSyncNotification(env, data) {
  try {
    console.log("\u{1F4EC} \u540C\u6B65\u901A\u77E5:", data);
    if (env.SLACK_WEBHOOK_URL) {
      await fetch(env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `\u{1F916} SVTR RAG\u6570\u636E\u540C\u6B65${data.status === "success" ? "\u6210\u529F" : "\u5931\u8D25"}`,
          attachments: [{
            color: data.status === "success" ? "good" : "danger",
            fields: [
              { title: "\u65F6\u95F4", value: data.timestamp, short: true },
              { title: "\u72B6\u6001", value: data.status, short: true },
              { title: "\u8BE6\u60C5", value: data.summary || data.error, short: false }
            ]
          }]
        })
      });
    }
  } catch (error) {
    console.error("\u901A\u77E5\u53D1\u9001\u5931\u8D25:", error);
  }
}
__name(sendSyncNotification, "sendSyncNotification");

// _middleware.ts
var onRequest = /* @__PURE__ */ __name(async (context) => {
  const response = await context.next();
  const url = new URL(context.request.url);
  const newResponse = new Response(response.body, response);
  const securityHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self), payment=()"
  };
  if (url.protocol === "https:") {
    securityHeaders["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  const cspPolicy = [
    "default-src 'self' https:",
    "script-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://c0uiiy15npu.feishu.cn https://static.cloudflareinsights.com https://*.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: https://cloudflareinsights.com https://*.cloudflareinsights.com",
    "frame-src 'self' https://c0uiiy15npu.feishu.cn",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join("; ");
  securityHeaders["Content-Security-Policy"] = cspPolicy;
  const pathname = url.pathname;
  if (pathname.startsWith("/assets/")) {
    newResponse.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (pathname.endsWith(".html") || pathname === "/") {
    newResponse.headers.set("Cache-Control", "public, max-age=3600, must-revalidate");
  } else if (pathname === "/sw.js") {
    newResponse.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  } else if (pathname.startsWith("/api/")) {
    newResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    newResponse.headers.set("Pragma", "no-cache");
  }
  Object.entries(securityHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  if (context.request.headers.get("Accept-Encoding")?.includes("gzip")) {
    newResponse.headers.set("Content-Encoding", "gzip");
  }
  if (pathname.startsWith("/api/")) {
    newResponse.headers.set("Access-Control-Allow-Origin", "*");
    newResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    newResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  return newResponse;
}, "onRequest");

// ../.wrangler/tmp/pages-3zLHgs/functionsRoutes-0.35202301286468085.mjs
var routes = [
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/chat",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/chat-optimized",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/chat-optimized",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/feishu-webhook",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/feishu-webhook",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/quota-status",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/suggestions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/suggestions",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/suggestions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/test-simple",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/test-simple",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/webhook/feishu",
    mountPath: "/webhook",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/scheduled-sync",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost8]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-Uo97hg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-Uo97hg/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.7584682978038231.mjs.map
