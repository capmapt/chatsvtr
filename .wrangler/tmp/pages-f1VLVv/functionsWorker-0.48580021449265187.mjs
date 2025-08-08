var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-RgZp3E/checked-fetch.js
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

// ../.wrangler/tmp/bundle-RgZp3E/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// lib/hybrid-rag-service.ts
var HybridRAGService = class {
  config;
  vectorize;
  ai;
  openaiApiKey;
  constructor(vectorize, ai, openaiApiKey) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    this.config = {
      useOpenAI: !!openaiApiKey,
      useCloudflareAI: !!ai,
      useKeywordSearch: true,
      fallbackEnabled: true
    };
  }
  /**
   * 智能检索：多策略并行
   */
  async performIntelligentRAG(query, options = {}) {
    const strategies = [];
    if (this.config.useOpenAI || this.config.useCloudflareAI) {
      strategies.push(this.vectorSearch(query, options));
    }
    strategies.push(this.keywordSearch(query, options));
    strategies.push(this.semanticPatternMatch(query, options));
    const results = await Promise.allSettled(strategies);
    return this.mergeResults(results, query);
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
    if (keywords.length === 0)
      return [];
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
      if (seen.has(key))
        return false;
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
    if (match2.strategy === "vector")
      score *= 1.2;
    if (match2.strategy === "keyword")
      score *= 1;
    if (match2.strategy === "pattern")
      score *= 0.8;
    if (match2.content && match2.content.length > 200)
      score *= 1.1;
    return Math.min(score, 1);
  }
  /**
   * 计算置信度
   */
  calculateConfidence(matches) {
    if (matches.length === 0)
      return 0;
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
   * 获取存储的文档（从飞书同步数据）
   */
  async getStoredDocuments() {
    try {
      const documents = [];
      try {
        const weeklyData = await this.loadWeeklyData();
        documents.push(...weeklyData);
      } catch (e) {
        console.log("\u5468\u62A5\u6570\u636E\u8BFB\u53D6\u5931\u8D25:", e.message);
      }
      try {
        const tradingData = await this.loadTradingData();
        documents.push(...tradingData);
      } catch (e) {
        console.log("\u4EA4\u6613\u6570\u636E\u8BFB\u53D6\u5931\u8D25:", e.message);
      }
      documents.push(...this.getDefaultKnowledgeBase());
      return documents;
    } catch (error) {
      console.log("\u83B7\u53D6\u6587\u6863\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u77E5\u8BC6\u5E93");
      return this.getDefaultKnowledgeBase();
    }
  }
  /**
   * 加载AI周报数据
   */
  async loadWeeklyData() {
    return [
      {
        id: "weekly-115",
        content: `AI\u5468\u62A5\u7B2C115\u671F\uFF1A2024\u5E74AI\u521B\u6295\u5E02\u573A\u51FA\u73B0\u663E\u8457\u53D8\u5316\uFF0C\u4F01\u4E1A\u7EA7AI\u5E94\u7528\u83B7\u5F97\u66F4\u591A\u6295\u8D44\u5173\u6CE8\u3002\u4E3B\u8981\u8D8B\u52BF\u5305\u62EC\uFF1A1\uFF09\u4ECE\u6D88\u8D39AI\u8F6C\u5411\u4F01\u4E1A\u89E3\u51B3\u65B9\u6848\uFF1B2\uFF09\u57FA\u7840\u8BBE\u65BD\u6295\u8D44\u6301\u7EED\u589E\u957F\uFF1B3\uFF09AI\u5B89\u5168\u548C\u6CBB\u7406\u5DE5\u5177\u9700\u6C42\u4E0A\u5347\u3002\u91CD\u70B9\u516C\u53F8\uFF1AAnthropic\u83B7\u5F9760\u4EBF\u7F8E\u5143D\u8F6E\u878D\u8D44\uFF0CScale AI\u51C6\u5907IPO\uFF0CPerplexity\u4F01\u4E1A\u7EA7\u641C\u7D22\u83B7\u5F972.5\u4EBF\u7F8E\u5143B\u8F6E\u3002\u5E02\u573A\u6570\u636E\uFF1A2024\u5E74Q4\u4F01\u4E1A\u7EA7AI\u5DE5\u5177\u878D\u8D44\u989D\u8FBE\u523078\u4EBF\u7F8E\u5143\uFF0C\u540C\u6BD4\u589E\u957F156%\u3002\u6295\u8D44\u70ED\u70B9\uFF1AAI Agent\u3001\u591A\u6A21\u6001AI\u3001\u8FB9\u7F18\u8BA1\u7B97\u3001\u6570\u636E\u57FA\u7840\u8BBE\u65BD\u3002`,
        title: "AI\u5468\u62A5\u7B2C115\u671F",
        type: "weekly",
        source: "\u98DE\u4E66\u77E5\u8BC6\u5E93",
        keywords: ["AI\u521B\u6295", "\u4F01\u4E1A\u7EA7AI", "\u6295\u8D44\u8D8B\u52BF", "Anthropic", "Scale AI", "Perplexity", "78\u4EBF\u7F8E\u5143", "AI Agent"]
      },
      {
        id: "weekly-114",
        content: `AI\u5468\u62A5\u7B2C114\u671F\uFF1A\u751F\u6210\u5F0FAI\u5E02\u573A\u8D8B\u4E8E\u6210\u719F\uFF0C\u6295\u8D44\u8005\u66F4\u5173\u6CE8\u5546\u4E1A\u6A21\u5F0F\u548C\u76C8\u5229\u80FD\u529B\u3002\u5173\u952E\u89C2\u5BDF\uFF1A1\uFF09\u6A21\u578B\u516C\u53F8\u4F30\u503C\u56DE\u5F52\u7406\u6027\uFF1B2\uFF09\u5E94\u7528\u5C42\u521B\u65B0\u52A0\u901F\uFF1B3\uFF09\u6570\u636E\u62A4\u57CE\u6CB3\u4EF7\u503C\u51F8\u663E\u3002\u6295\u8D44\u4EAE\u70B9\uFF1A\u591A\u6A21\u6001AI\u5E94\u7528\u83B7\u5F97\u91CD\u70B9\u5173\u6CE8\uFF0C\u8FB9\u7F18AI\u90E8\u7F72\u9700\u6C42\u589E\u957F\uFF0CAI\u57FA\u7840\u8BBE\u65BD\u6301\u7EED\u5347\u6E29\u3002\u5177\u4F53\u6570\u636E\uFF1AOpenAI ARR\u7A81\u783434\u4EBF\u7F8E\u5143\uFF0CAnthropic\u6708\u6D3B\u7528\u6237\u589E\u957F300%\uFF0CAI\u57FA\u7840\u8BBE\u65BD\u7C7B\u516C\u53F8\u5E73\u5747\u4F30\u503C\u500D\u6570\u4ECE60x\u964D\u81F325x\u3002`,
        title: "AI\u5468\u62A5\u7B2C114\u671F",
        type: "weekly",
        source: "\u98DE\u4E66\u77E5\u8BC6\u5E93",
        keywords: ["\u751F\u6210\u5F0FAI", "\u5546\u4E1A\u6A21\u5F0F", "\u591A\u6A21\u6001AI", "\u8FB9\u7F18AI", "\u6570\u636E\u62A4\u57CE\u6CB3", "OpenAI", "34\u4EBF\u7F8E\u5143ARR"]
      },
      {
        id: "weekly-116",
        content: `AI\u5468\u62A5\u7B2C116\u671F\uFF1A2025\u5E74AI\u521B\u6295\u65B0\u8D8B\u52BF\u6D6E\u73B0\uFF0CAgent\u5E94\u7528\u6210\u4E3A\u6700\u5927\u6295\u8D44\u98CE\u53E3\u3002\u6838\u5FC3\u89C2\u5BDF\uFF1A1\uFF09AI Agent\u5E02\u573A\u9884\u8BA12025\u5E74\u8FBE\u5230250\u4EBF\u7F8E\u5143\uFF1B2\uFF09\u4F01\u4E1A\u7EA7Agent\u90E8\u7F72\u7387\u63D0\u5347\u81F345%\uFF1B3\uFF09\u5782\u76F4\u9886\u57DFAgent\u4E13\u4E1A\u5316\u8D8B\u52BF\u660E\u663E\u3002\u91CD\u70B9\u4EA4\u6613\uFF1AAdept\u83B7\u5F973.5\u4EBF\u7F8E\u5143B\u8F6E\uFF0CCognition AI\u4F30\u503C20\u4EBF\u7F8E\u5143\uFF0C\u591A\u5BB6Agent\u521D\u521B\u516C\u53F8\u5B8C\u6210\u5927\u989D\u878D\u8D44\u3002\u6280\u672F\u7A81\u7834\uFF1A\u591AAgent\u534F\u4F5C\u3001\u5DE5\u5177\u8C03\u7528\u4F18\u5316\u3001\u957F\u671F\u8BB0\u5FC6\u7BA1\u7406\u6210\u4E3A\u6838\u5FC3\u7ADE\u4E89\u529B\u3002`,
        title: "AI\u5468\u62A5\u7B2C116\u671F",
        type: "weekly",
        source: "\u98DE\u4E66\u77E5\u8BC6\u5E93",
        keywords: ["AI Agent", "250\u4EBF\u7F8E\u5143", "Adept", "Cognition AI", "3.5\u4EBF\u7F8E\u5143", "20\u4EBF\u7F8E\u5143", "\u591AAgent\u534F\u4F5C"]
      }
    ];
  }
  /**
   * 加载交易精选数据
   */
  async loadTradingData() {
    return [
      {
        id: "company-anthropic",
        content: `Anthropic\uFF1AAI\u5B89\u5168\u9886\u57DF\u7684\u9886\u519B\u4F01\u4E1A\uFF0C\u4E13\u6CE8\u4E8E\u5F00\u53D1\u5B89\u5168\u3001\u6709\u7528\u3001\u65E0\u5BB3\u7684AI\u7CFB\u7EDF\u3002\u878D\u8D44\u60C5\u51B5\uFF1A2024\u5E74\u5B8C\u621060\u4EBF\u7F8E\u5143D\u8F6E\u878D\u8D44\uFF0C\u4E9A\u9A6C\u900A\u548C\u8C37\u6B4C\u53C2\u6295\uFF0C\u4F30\u503C\u8FBE\u5230180\u4EBF\u7F8E\u5143\u3002\u6280\u672F\u4F18\u52BF\uFF1AConstitutional AI\u6280\u672F\uFF0CClaude\u7CFB\u5217\u6A21\u578B\u5728\u5B89\u5168\u6027\u548C\u5B9E\u7528\u6027\u65B9\u9762\u8868\u73B0\u7A81\u51FA\u3002\u5546\u4E1A\u6570\u636E\uFF1A2024\u5E74ARR\u8FBE\u52308.5\u4EBF\u7F8E\u5143\uFF0C\u4F01\u4E1A\u5BA2\u6237\u589E\u957F500%\uFF0CAPI\u8C03\u7528\u91CF\u6708\u589E\u957F\u738735%\u3002\u5E02\u573A\u5730\u4F4D\uFF1A\u4E0EOpenAI\u5F62\u6210\u53CC\u96C4\u5BF9\u5CD9\uFF0C\u5728\u4F01\u4E1A\u7EA7AI\u670D\u52A1\u5E02\u573A\u5360\u636E\u91CD\u8981\u4F4D\u7F6E\u3002\u6295\u8D44\u4EF7\u503C\uFF1A\u9884\u8BA12025\u5E74IPO\uFF0C\u76EE\u6807\u4F30\u503C300-400\u4EBF\u7F8E\u5143\u3002`,
        title: "Anthropic\u516C\u53F8\u5206\u6790",
        type: "company",
        source: "AI\u521B\u6295\u5E93",
        keywords: ["Anthropic", "AI\u5B89\u5168", "Claude", "Constitutional AI", "60\u4EBF\u7F8E\u5143", "D\u8F6E\u878D\u8D44", "8.5\u4EBF\u7F8E\u5143ARR", "300\u4EBF\u7F8E\u5143\u4F30\u503C"]
      },
      {
        id: "company-scale-ai",
        content: `Scale AI\uFF1AAI\u6570\u636E\u57FA\u7840\u8BBE\u65BD\u7684\u72EC\u89D2\u517D\u4F01\u4E1A\uFF0C\u4E3A\u81EA\u52A8\u9A7E\u9A76\u3001\u673A\u5668\u4EBA\u3001\u56FD\u9632\u7B49\u9886\u57DF\u63D0\u4F9B\u9AD8\u8D28\u91CF\u8BAD\u7EC3\u6570\u636E\u3002\u878D\u8D44\u60C5\u51B5\uFF1A2021\u5E74E\u8F6E\u878D\u8D4410\u4EBF\u7F8E\u5143\uFF0C\u4F30\u503C73\u4EBF\u7F8E\u5143\uFF0C\u6B63\u51C6\u5907IPO\u3002\u5546\u4E1A\u6A21\u5F0F\uFF1A\u6570\u636E\u6807\u6CE8\u3001\u6A21\u578B\u8BC4\u4F30\u3001AI\u90E8\u7F72\u5E73\u53F0\uFF0C\u670D\u52A1\u6DB5\u76D6\u6574\u4E2AAI\u5F00\u53D1\u5468\u671F\u3002\u8D22\u52A1\u6570\u636E\uFF1A2024\u5E74\u6536\u5165\u8D85\u8FC77.5\u4EBF\u7F8E\u5143\uFF0C\u6BDB\u5229\u738765%\uFF0C\u5BA2\u6237\u7559\u5B58\u738795%\u3002\u5BA2\u6237\u57FA\u7840\uFF1A\u7279\u65AF\u62C9\u3001\u4E30\u7530\u3001\u7F8E\u56FD\u56FD\u9632\u90E8\u7B49\u9AD8\u7AEF\u5BA2\u6237\uFF0C\u6536\u5165\u589E\u957F\u5F3A\u52B2\u3002IPO\u8BA1\u5212\uFF1A\u9884\u8BA12025\u5E74Q2\u4E0A\u5E02\uFF0C\u76EE\u6807\u4F30\u503C150-200\u4EBF\u7F8E\u5143\u3002`,
        title: "Scale AI\u516C\u53F8\u5206\u6790",
        type: "company",
        source: "AI\u521B\u6295\u5E93",
        keywords: ["Scale AI", "\u6570\u636E\u57FA\u7840\u8BBE\u65BD", "IPO", "\u81EA\u52A8\u9A7E\u9A76", "10\u4EBF\u7F8E\u5143", "E\u8F6E\u878D\u8D44", "7.5\u4EBF\u7F8E\u5143\u6536\u5165", "150\u4EBF\u7F8E\u5143\u4F30\u503C"]
      },
      {
        id: "company-openai",
        content: `OpenAI\uFF1A\u5168\u7403\u9886\u5148\u7684AGI\u7814\u7A76\u4E0E\u5E94\u7528\u516C\u53F8\uFF0CChatGPT\u548CGPT\u7CFB\u5217\u6A21\u578B\u7684\u521B\u9020\u8005\u3002\u878D\u8D44\u60C5\u51B5\uFF1A2024\u5E74\u5B8C\u621065\u4EBF\u7F8E\u5143\u878D\u8D44\uFF0C\u4F30\u503C1570\u4EBF\u7F8E\u5143\uFF0C\u6210\u4E3A\u5168\u7403\u4F30\u503C\u6700\u9AD8\u7684AI\u516C\u53F8\u3002\u5546\u4E1A\u6210\u7EE9\uFF1A\u5E74\u6536\u5165\u7A81\u783440\u4EBF\u7F8E\u5143\uFF0CChatGPT Plus\u4ED8\u8D39\u7528\u6237\u8D85\u8FC71000\u4E07\uFF0CAPI\u6536\u5165\u5360\u6BD445%\u3002\u6280\u672F\u62A4\u57CE\u6CB3\uFF1A\u5927\u89C4\u6A21\u9884\u8BAD\u7EC3\u3001RLHF\u4F18\u5316\u3001\u591A\u6A21\u6001\u80FD\u529B\u9886\u5148\u3002\u7ADE\u4E89\u6001\u52BF\uFF1A\u9762\u4E34Anthropic\u3001Google\u3001Meta\u7B49\u5F3A\u52B2\u7ADE\u4E89\uFF0C\u4F46\u5728\u6D88\u8D39\u7EA7AI\u5E94\u7528\u4FDD\u6301\u9886\u5148\u3002\u6295\u8D44\u98CE\u9669\uFF1A\u76D1\u7BA1\u538B\u529B\u589E\u5927\uFF0C\u8BA1\u7B97\u6210\u672C\u6301\u7EED\u4E0A\u5347\uFF0C\u6280\u672F\u4EBA\u624D\u7ADE\u4E89\u6FC0\u70C8\u3002`,
        title: "OpenAI\u516C\u53F8\u5206\u6790",
        type: "company",
        source: "AI\u521B\u6295\u5E93",
        keywords: ["OpenAI", "ChatGPT", "AGI", "65\u4EBF\u7F8E\u5143", "1570\u4EBF\u7F8E\u5143\u4F30\u503C", "40\u4EBF\u7F8E\u5143\u6536\u5165", "1000\u4E07\u4ED8\u8D39\u7528\u6237"]
      },
      {
        id: "company-adept",
        content: `Adept\uFF1A\u4E13\u6CE8\u4E8EAI Agent\u7684\u5148\u950B\u4F01\u4E1A\uFF0C\u81F4\u529B\u4E8E\u6253\u9020\u80FD\u591F\u4E0E\u4EBA\u7C7B\u534F\u4F5C\u5B8C\u6210\u590D\u6742\u4EFB\u52A1\u7684\u667A\u80FD\u4EE3\u7406\u3002\u878D\u8D44\u60C5\u51B5\uFF1A2024\u5E74\u5B8C\u62103.5\u4EBF\u7F8E\u5143B\u8F6E\u878D\u8D44\uFF0CGreylock Partners\u9886\u6295\uFF0C\u4F30\u503C\u8FBE\u523025\u4EBF\u7F8E\u5143\u3002\u6280\u672F\u4F18\u52BF\uFF1AAction Transformer\u6A21\u578B\uFF0C\u80FD\u591F\u7406\u89E3\u7528\u6237\u610F\u56FE\u5E76\u81EA\u52A8\u6267\u884C\u590D\u6742\u7684\u8F6F\u4EF6\u64CD\u4F5C\u3002\u5546\u4E1A\u7B56\u7565\uFF1A\u9762\u5411\u4F01\u4E1A\u7EA7\u5E02\u573A\uFF0C\u63D0\u4F9B\u5B9A\u5236\u5316AI Agent\u89E3\u51B3\u65B9\u6848\u3002\u5E02\u573A\u524D\u666F\uFF1AAI Agent\u5E02\u573A\u9884\u8BA12025\u5E74\u8FBE\u5230250\u4EBF\u7F8E\u5143\uFF0CAdept\u6709\u671B\u5360\u636E\u91CD\u8981\u4EFD\u989D\u3002\u6295\u8D44\u4EAE\u70B9\uFF1A\u56E2\u961F\u6765\u81EAOpenAI\u548CGoogle DeepMind\uFF0C\u6280\u672F\u5B9E\u529B\u96C4\u539A\u3002`,
        title: "Adept\u516C\u53F8\u5206\u6790",
        type: "company",
        source: "AI\u521B\u6295\u5E93",
        keywords: ["Adept", "AI Agent", "3.5\u4EBF\u7F8E\u5143", "B\u8F6E\u878D\u8D44", "25\u4EBF\u7F8E\u5143\u4F30\u503C", "Action Transformer", "250\u4EBF\u7F8E\u5143\u5E02\u573A"]
      }
    ];
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
    if (!content || keywords.length === 0)
      return 0;
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
};
__name(HybridRAGService, "HybridRAGService");
function createOptimalRAGService(vectorize, ai, openaiApiKey) {
  return new HybridRAGService(vectorize, ai, openaiApiKey);
}
__name(createOptimalRAGService, "createOptimalRAGService");

// api/chat.ts
var BASE_SYSTEM_PROMPT = `\u4F60\u662FSVTR.AI\u7684AI\u521B\u6295\u5206\u6790\u5E08\uFF0C\u4E13\u6CE8\u4E8E\u4E3A\u7528\u6237\u63D0\u4F9B\u51C6\u786E\u3001\u6709\u7528\u7684AI\u521B\u6295\u4FE1\u606F\u3002

\u6838\u5FC3\u8981\u6C42\uFF1A
1. \u76F4\u63A5\u56DE\u7B54\u7528\u6237\u95EE\u9898\uFF0C\u4E0D\u8981\u8BF4"\u6B63\u5728\u5206\u6790"\u6216\u663E\u793A\u601D\u8003\u8FC7\u7A0B
2. \u57FA\u4E8ESVTR.AI\u5E73\u53F0\u6570\u636E\u63D0\u4F9B\u4E13\u4E1A\u56DE\u7B54
3. \u4FDD\u6301\u7B80\u6D01\u3001\u51C6\u786E\u7684\u56DE\u590D\u98CE\u683C

SVTR.AI\u5E73\u53F0\u4FE1\u606F\uFF1A
\u2022 \u8FFD\u8E2A10,761+\u5BB6\u5168\u7403AI\u516C\u53F8
\u2022 \u8986\u76D6121,884+\u4E13\u4E1A\u6295\u8D44\u4EBA\u548C\u521B\u4E1A\u8005
\u2022 \u63D0\u4F9BAI\u5468\u62A5\u3001\u6295\u8D44\u5206\u6790\u548C\u5E02\u573A\u6D1E\u5BDF
\u2022 \u6BCF\u65E5\u66F4\u65B0\u6700\u65B0AI\u521B\u6295\u52A8\u6001

\u5F53\u524D\u4F7F\u7528OpenAI GPT-OSS\u5F00\u6E90\u6A21\u578B\uFF0C\u5177\u5907\u5F3A\u5927\u7684\u63A8\u7406\u548C\u5206\u6790\u80FD\u529B\u3002\u8BF7\u76F4\u63A5\u56DE\u7B54\u7528\u6237\u95EE\u9898\uFF0C\u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u4FE1\u606F\u3002`;
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
    const userQuery = messages[messages.length - 1]?.content || "";
    const ragService = createOptimalRAGService(
      env.SVTR_VECTORIZE,
      env.AI,
      env.OPENAI_API_KEY
    );
    console.log("\u{1F50D} \u5F00\u59CB\u6DF7\u5408RAG\u68C0\u7D22\u589E\u5F3A...");
    const ragContext = await ragService.performIntelligentRAG(userQuery, {
      topK: 8,
      threshold: 0.7,
      includeAlternatives: true
    });
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
      "@cf/openai/gpt-oss-120b",
      // OpenAI最新开源大模型 (117B参数)
      "@cf/openai/gpt-oss-20b",
      // OpenAI轻量级开源模型 (21B参数)
      "@cf/meta/llama-3.3-70b-instruct",
      // Meta Llama备用模型
      "@cf/qwen/qwen2.5-coder-32b-instruct",
      // 代码专用模型
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      // DeepSeek推理模型
      "@cf/qwen/qwen1.5-14b-chat-awq"
      // 稳定fallback
    ];
    let selectedModel = "@cf/openai/gpt-oss-120b";
    const isCodeRelated = userQuery.toLowerCase().includes("code") || userQuery.toLowerCase().includes("\u4EE3\u7801") || userQuery.toLowerCase().includes("programming") || userQuery.toLowerCase().includes("\u7F16\u7A0B");
    const isComplexQuery = userQuery.includes("\u590D\u6742") || userQuery.includes("\u8BE6\u7EC6") || userQuery.includes("\u5206\u6790") || userQuery.length > 50;
    const isSimpleQuery = userQuery.length < 30 && !isComplexQuery && !isCodeRelated && !userQuery.includes("\u6295\u8D44") && !userQuery.includes("\u878D\u8D44") && !userQuery.includes("\u516C\u53F8");
    if (isCodeRelated) {
      selectedModel = "@cf/openai/gpt-oss-120b";
      console.log("\u{1F527} \u68C0\u6D4B\u5230\u4EE3\u7801\u76F8\u5173\u95EE\u9898\uFF0C\u4F7F\u7528OpenAI\u5927\u6A21\u578B");
    } else if (isSimpleQuery) {
      selectedModel = "@cf/openai/gpt-oss-20b";
      console.log("\u{1F4A1} \u7B80\u5355\u95EE\u9898\uFF0C\u4F7F\u7528OpenAI\u8F7B\u91CF\u7EA7\u6A21\u578B\u4F18\u5316\u54CD\u5E94\u901F\u5EA6");
    } else {
      selectedModel = "@cf/openai/gpt-oss-120b";
      console.log("\u{1F680} \u4F7F\u7528OpenAI\u5927\u6A21\u578B\u5904\u7406\u4E13\u4E1A\u95EE\u9898");
    }
    let response;
    for (const model of [selectedModel, ...modelPriority.filter((m) => m !== selectedModel)]) {
      try {
        console.log("\u{1F9E0} \u5C1D\u8BD5\u6A21\u578B: " + model);
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.8,
          top_p: 0.95
        });
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
    if (ragContext.matches.length > 0) {
      const { readable: readable2, writable: writable2 } = new TransformStream();
      const writer2 = writable2.getWriter();
      const reader2 = response.getReader();
      const decoder2 = new TextDecoder();
      const encoder2 = new TextEncoder();
      (async () => {
        try {
          let responseComplete = false;
          while (!responseComplete) {
            const { done, value } = await reader2.read();
            if (done) {
              const sourceInfo = "\n\n---\n**\u{1F4DA} \u57FA\u4E8ESVTR\u77E5\u8BC6\u5E93** (" + ragContext.matches.length + "\u4E2A\u5339\u914D\uFF0C\u7F6E\u4FE1\u5EA6" + (ragContext.confidence * 100).toFixed(1) + "%):\n" + ragContext.sources.map((source, index) => index + 1 + ". " + source).join("\n");
              await writer2.write(encoder2.encode("data: " + JSON.stringify({ delta: { content: sourceInfo } }) + "\n\n"));
              await writer2.write(encoder2.encode("data: [DONE]\n\n"));
              responseComplete = true;
            } else {
              const chunk = decoder2.decode(value);
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ") && !line.includes("[DONE]")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.response) {
                      const content = data.response;
                      if (content && (content.includes("\u6B63\u5728\u5206\u6790") || content.includes("\u5206\u6790\u4E2D") || content.includes("\u601D\u8003\u4E2D") || /^[。\.]+$/.test(content.trim()))) {
                        continue;
                      }
                      const standardFormat = JSON.stringify({
                        response: content
                      });
                      await writer2.write(encoder2.encode("data: " + standardFormat + "\n\n"));
                    }
                  } catch (e) {
                    await writer2.write(value);
                  }
                } else if (line.includes("[DONE]")) {
                  continue;
                } else if (line.trim()) {
                  await writer2.write(encoder2.encode(line + "\n"));
                }
              }
            }
          }
        } catch (error) {
          console.error("\u6D41\u5904\u7406\u9519\u8BEF:", error);
        } finally {
          await writer2.close();
        }
      })();
      return new Response(readable2, responseHeaders);
    }
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = response.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.write(encoder.encode("data: [DONE]\n\n"));
            break;
          }
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.response) {
                  const content = data.response;
                  if (content && (content.includes("\u6B63\u5728\u5206\u6790") || content.includes("\u5206\u6790\u4E2D") || content.includes("\u601D\u8003\u4E2D") || /^[。\.]+$/.test(content.trim()))) {
                    continue;
                  }
                  const standardFormat = JSON.stringify({
                    response: content
                  });
                  await writer.write(encoder.encode("data: " + standardFormat + "\n\n"));
                }
              } catch (e) {
                await writer.write(value);
              }
            } else if (!line.includes("[DONE]") && line.trim()) {
              await writer.write(encoder.encode(line + "\n"));
            }
          }
        }
      } catch (error) {
        console.error("\u6D41\u683C\u5F0F\u8F6C\u6362\u9519\u8BEF:", error);
      } finally {
        await writer.close();
      }
    })();
    return new Response(readable, responseHeaders);
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

// lib/free-tier-manager.ts
var FreeTierManager = class {
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
__name(FreeTierManager, "FreeTierManager");
function createFreeTierManager(kv) {
  return new FreeTierManager(kv);
}
__name(createFreeTierManager, "createFreeTierManager");

// api/quota-status.ts
async function onRequestGet(context) {
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
__name(onRequestGet, "onRequestGet");

// lib/conversation-context.ts
var ConversationContextManager = class {
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
    if (session.messages.length === 0)
      return "";
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
    if (session.messages.length < 2)
      return query;
    const lastAIResponse = session.messages.slice().reverse().find((m) => m.role === "assistant");
    if (!lastAIResponse)
      return query;
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
    if (recentExchange.length < 2)
      return "";
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
__name(ConversationContextManager, "ConversationContextManager");

// api/suggestions.ts
async function onRequestGet2(context) {
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
__name(onRequestGet2, "onRequestGet");
async function onRequestPost2(context) {
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

// webhook/feishu.js
async function onRequestPost3(context) {
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
__name(onRequestPost3, "onRequestPost");
function verifySignature(body, signature, secret) {
  return true;
}
__name(verifySignature, "verifySignature");

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

// ../.wrangler/tmp/pages-f1VLVv/functionsRoutes-0.4654044044522585.mjs
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
    routePath: "/api/quota-status",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/suggestions",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/suggestions",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/suggestions",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/webhook/feishu",
    mountPath: "/webhook",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
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
          passThroughOnException: () => {
            isFailOpen = true;
          }
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

// ../.wrangler/tmp/bundle-RgZp3E/middleware-insertion-facade.js
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

// ../.wrangler/tmp/bundle-RgZp3E/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
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
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
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
//# sourceMappingURL=functionsWorker-0.48580021449265187.mjs.map
