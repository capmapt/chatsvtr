var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-dAHeGK/checked-fetch.js
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

// ../.wrangler/tmp/bundle-dAHeGK/strip-cf-connecting-ip-header.js
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

// lib/query-expansion-service.ts
var QueryExpansionService = class {
  synonymMap;
  domainTerms;
  queryPatterns;
  constructor() {
    this.initializeMaps();
  }
  initializeMaps() {
    this.synonymMap = /* @__PURE__ */ new Map([
      ["ai", ["\u4EBA\u5DE5\u667A\u80FD", "artificial intelligence", "\u673A\u5668\u5B66\u4E60", "ml", "deep learning", "\u6DF1\u5EA6\u5B66\u4E60"]],
      ["\u6295\u8D44", ["funding", "investment", "\u878D\u8D44", "\u8D44\u91D1", "capital", "venture", "\u98CE\u6295"]],
      ["\u516C\u53F8", ["company", "startup", "\u521D\u521B\u4F01\u4E1A", "\u4F01\u4E1A", "firm", "\u56E2\u961F", "team"]],
      ["\u8D8B\u52BF", ["trend", "direction", "\u65B9\u5411", "\u53D1\u5C55", "\u8D70\u52BF", "outlook", "\u524D\u666F"]],
      ["\u4F30\u503C", ["valuation", "\u4EF7\u503C", "value", "\u5E02\u503C", "worth", "\u8BC4\u4F30"]],
      ["\u8F6E\u6B21", ["round", "\u9636\u6BB5", "stage", "series", "\u878D\u8D44\u8F6E"]],
      ["\u72EC\u89D2\u517D", ["unicorn", "\u5341\u4EBF\u7F8E\u5143", "billion-dollar", "\u9AD8\u4F30\u503C"]],
      ["\u8D5B\u9053", ["sector", "\u9886\u57DF", "domain", "field", "industry", "\u884C\u4E1A"]],
      ["\u5E73\u53F0", ["platform", "\u7CFB\u7EDF", "system", "\u670D\u52A1", "service"]]
    ]);
    this.domainTerms = /* @__PURE__ */ new Map([
      ["investment", ["pre-seed", "seed", "series-a", "series-b", "series-c", "ipo", "exit", "portfolio", "due-diligence"]],
      ["ai-technology", ["llm", "gpt", "transformer", "neural-network", "computer-vision", "nlp", "robotics", "autonomous"]],
      ["market-analysis", ["market-size", "competition", "moat", "growth-rate", "tam", "sam", "som", "market-share"]],
      ["startup-evaluation", ["product-market-fit", "mvp", "traction", "revenue", "burn-rate", "runway", "kpi", "metrics"]]
    ]);
    this.queryPatterns = /* @__PURE__ */ new Map([
      ["company_search" /* COMPANY_SEARCH */, [
        /(.+)公司|(.+)企业|(.+)团队/,
        /search.+company|find.+startup/i,
        /哪些公司|什么企业|哪家公司/
      ]],
      ["investment_analysis" /* INVESTMENT_ANALYSIS */, [
        /投资.+分析|投资.+趋势|投资.+机会/,
        /investment.+analysis|investment.+trend/i,
        /融资.+情况|融资.+数据/
      ]],
      ["market_trends" /* MARKET_TRENDS */, [
        /市场趋势|行业趋势|发展趋势/,
        /market.+trend|industry.+trend/i,
        /未来.+发展|前景.+如何/
      ]],
      ["technology_info" /* TECHNOLOGY_INFO */, [
        /技术.+介绍|技术.+分析|ai.+技术/,
        /technology|technical|ai.+capability/i,
        /算法|模型|架构/
      ]],
      ["funding_info" /* FUNDING_INFO */, [
        /融资.+轮次|融资.+金额|投资.+轮次/,
        /funding.+round|series.+[abc]/i,
        /获得.+投资|完成.+融资/
      ]],
      ["team_evaluation" /* TEAM_EVALUATION */, [
        /团队.+评估|如何.+识别|怎么.+判断/,
        /evaluate.+team|assess.+founder/i,
        /创始人|团队背景|管理层/
      ]]
    ]);
  }
  /**
   * 执行查询扩展
   */
  expandQuery(originalQuery, options = {}) {
    const {
      includeContext = true,
      maxExpansions = 10,
      confidenceThreshold = 0.3
    } = options;
    const queryType = this.detectQueryType(originalQuery);
    const keywords = this.extractKeywords(originalQuery);
    const synonyms = this.generateSynonyms(keywords);
    const relatedTerms = this.generateRelatedTerms(keywords, queryType);
    const domainContext = includeContext ? this.buildDomainContext(queryType, keywords) : [];
    const expandedQuery = this.buildExpandedQuery(
      originalQuery,
      synonyms,
      relatedTerms,
      domainContext,
      maxExpansions
    );
    const confidence = this.calculateExpansionConfidence(
      originalQuery,
      expandedQuery,
      synonyms.length,
      relatedTerms.length
    );
    return {
      originalQuery,
      expandedQuery,
      synonyms,
      relatedTerms,
      queryType,
      domainContext,
      confidence
    };
  }
  /**
   * 检测查询类型
   */
  detectQueryType(query) {
    const queryLower = query.toLowerCase();
    for (const [type, patterns] of this.queryPatterns.entries()) {
      for (const pattern of patterns) {
        if (pattern.test(queryLower)) {
          return type;
        }
      }
    }
    return "general" /* GENERAL */;
  }
  /**
   * 提取关键词
   */
  extractKeywords(query) {
    const cleanQuery = query.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g, " ").trim();
    const words = cleanQuery.split(/\s+/).filter((word) => word.length > 1);
    const stopWords = /* @__PURE__ */ new Set([
      "\u7684",
      "\u4E86",
      "\u5728",
      "\u662F",
      "\u6709",
      "\u548C",
      "\u4E0E",
      "\u6216",
      "\u5982\u4F55",
      "\u4EC0\u4E48",
      "\u54EA\u4E9B",
      "\u600E\u4E48",
      "\u4E3A\u4EC0\u4E48",
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "how",
      "what",
      "which",
      "where",
      "when",
      "who",
      "why"
    ]);
    return words.filter((word) => !stopWords.has(word) && word.length > 1);
  }
  /**
   * 生成同义词
   */
  generateSynonyms(keywords) {
    const synonyms = /* @__PURE__ */ new Set();
    keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      if (this.synonymMap.has(keywordLower)) {
        this.synonymMap.get(keywordLower).forEach((syn) => synonyms.add(syn));
      }
      for (const [term, syns] of this.synonymMap.entries()) {
        if (keywordLower.includes(term) || term.includes(keywordLower)) {
          syns.forEach((syn) => synonyms.add(syn));
        }
      }
    });
    return Array.from(synonyms);
  }
  /**
   * 生成相关术语
   */
  generateRelatedTerms(keywords, queryType) {
    const relatedTerms = /* @__PURE__ */ new Set();
    const typeMapping = {
      ["company_search" /* COMPANY_SEARCH */]: ["investment", "startup-evaluation"],
      ["investment_analysis" /* INVESTMENT_ANALYSIS */]: ["investment", "market-analysis"],
      ["market_trends" /* MARKET_TRENDS */]: ["market-analysis", "ai-technology"],
      ["technology_info" /* TECHNOLOGY_INFO */]: ["ai-technology", "startup-evaluation"],
      ["funding_info" /* FUNDING_INFO */]: ["investment", "startup-evaluation"],
      ["team_evaluation" /* TEAM_EVALUATION */]: ["startup-evaluation", "investment"],
      ["general" /* GENERAL */]: ["investment", "ai-technology"]
    };
    const domains = typeMapping[queryType] || ["investment"];
    domains.forEach((domain) => {
      const terms = this.domainTerms.get(domain) || [];
      terms.slice(0, 5).forEach((term) => relatedTerms.add(term));
    });
    keywords.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase();
      if (keywordLower.includes("ai") || keywordLower.includes("\u4EBA\u5DE5\u667A\u80FD")) {
        this.domainTerms.get("ai-technology")?.slice(0, 3).forEach((term) => relatedTerms.add(term));
      }
      if (keywordLower.includes("\u6295\u8D44") || keywordLower.includes("investment")) {
        this.domainTerms.get("investment")?.slice(0, 3).forEach((term) => relatedTerms.add(term));
      }
    });
    return Array.from(relatedTerms);
  }
  /**
   * 构建领域上下文
   */
  buildDomainContext(queryType, keywords) {
    const context = [];
    const contextMap = {
      ["company_search" /* COMPANY_SEARCH */]: ["AI\u521B\u6295\u751F\u6001\u7CFB\u7EDF", "\u521D\u521B\u4F01\u4E1A\u6570\u636E\u5E93", "\u6295\u8D44\u7EC4\u5408\u5206\u6790"],
      ["investment_analysis" /* INVESTMENT_ANALYSIS */]: ["\u6295\u8D44\u8D8B\u52BF\u5206\u6790", "\u5E02\u573A\u6570\u636E", "\u98CE\u9669\u8BC4\u4F30"],
      ["market_trends" /* MARKET_TRENDS */]: ["\u884C\u4E1A\u6D1E\u5BDF", "\u6280\u672F\u53D1\u5C55", "\u7ADE\u4E89\u5206\u6790"],
      ["technology_info" /* TECHNOLOGY_INFO */]: ["\u6280\u672F\u8BC4\u4F30", "AI\u80FD\u529B\u5206\u6790", "\u4EA7\u54C1\u6280\u672F\u6808"],
      ["funding_info" /* FUNDING_INFO */]: ["\u878D\u8D44\u6570\u636E", "\u6295\u8D44\u8F6E\u6B21", "\u4F30\u503C\u5206\u6790"],
      ["team_evaluation" /* TEAM_EVALUATION */]: ["\u56E2\u961F\u80CC\u666F", "\u521B\u59CB\u4EBA\u7ECF\u5386", "\u7BA1\u7406\u80FD\u529B"],
      ["general" /* GENERAL */]: ["AI\u521B\u6295\u77E5\u8BC6\u5E93", "SVTR\u5E73\u53F0\u6570\u636E"]
    };
    context.push(...contextMap[queryType] || contextMap["general" /* GENERAL */]);
    if (keywords.some((k) => k.includes("svtr") || k.includes("SVTR"))) {
      context.push("SVTR\u5E73\u53F0\u7279\u8272\u529F\u80FD", "AI\u521B\u6295\u6570\u636E\u8FFD\u8E2A");
    }
    return context.slice(0, 5);
  }
  /**
   * 构建扩展查询
   */
  buildExpandedQuery(originalQuery, synonyms, relatedTerms, domainContext, maxExpansions) {
    const expansions = [];
    synonyms.slice(0, Math.floor(maxExpansions * 0.4)).forEach((syn) => {
      expansions.push(syn);
    });
    relatedTerms.slice(0, Math.floor(maxExpansions * 0.4)).forEach((term) => {
      expansions.push(term);
    });
    domainContext.slice(0, Math.floor(maxExpansions * 0.2)).forEach((context) => {
      expansions.push(context);
    });
    if (expansions.length === 0) {
      return originalQuery;
    }
    const expandedQuery = originalQuery + " " + expansions.join(" ");
    const words = expandedQuery.split(/\s+/);
    const uniqueWords = [...new Set(words.filter((word) => word.trim().length > 0))];
    return uniqueWords.join(" ");
  }
  /**
   * 计算扩展置信度
   */
  calculateExpansionConfidence(originalQuery, expandedQuery, synonymCount, relatedTermsCount) {
    let confidence = 0.5;
    const expansionRatio = expandedQuery.length / originalQuery.length;
    if (expansionRatio > 1.2 && expansionRatio < 3) {
      confidence += 0.2;
    }
    if (synonymCount > 2)
      confidence += 0.2;
    if (relatedTermsCount > 3)
      confidence += 0.2;
    if (originalQuery.length < 20) {
      confidence += 0.1;
    }
    return Math.min(confidence, 1);
  }
  /**
   * 获取查询建议
   */
  generateQuerySuggestions(queryType, keywords) {
    const suggestions = [];
    const suggestionTemplates = {
      ["company_search" /* COMPANY_SEARCH */]: [
        "{keyword}\u9886\u57DF\u7684\u72EC\u89D2\u517D\u516C\u53F8\u6709\u54EA\u4E9B\uFF1F",
        "\u6700\u65B0\u83B7\u5F97\u878D\u8D44\u7684{keyword}\u516C\u53F8",
        "{keyword}\u8D5B\u9053\u7684\u5934\u90E8\u4F01\u4E1A\u5206\u6790"
      ],
      ["investment_analysis" /* INVESTMENT_ANALYSIS */]: [
        "2024\u5E74{keyword}\u6295\u8D44\u8D8B\u52BF\u5206\u6790",
        "{keyword}\u9886\u57DF\u7684\u6295\u8D44\u673A\u4F1A\u548C\u98CE\u9669",
        "{keyword}\u5E02\u573A\u7684\u8D44\u91D1\u6D41\u5411"
      ],
      ["market_trends" /* MARKET_TRENDS */]: [
        "{keyword}\u884C\u4E1A\u672A\u6765\u53D1\u5C55\u8D8B\u52BF",
        "{keyword}\u5E02\u573A\u7ADE\u4E89\u683C\u5C40\u5206\u6790",
        "{keyword}\u6280\u672F\u53D1\u5C55\u524D\u666F"
      ]
    };
    const templates = suggestionTemplates[queryType] || [];
    const topKeywords = keywords.slice(0, 2);
    templates.forEach((template) => {
      topKeywords.forEach((keyword) => {
        suggestions.push(template.replace("{keyword}", keyword));
      });
    });
    return suggestions.slice(0, 6);
  }
  /**
   * 分析查询复杂度
   */
  analyzeQueryComplexity(query) {
    const factors = [];
    let score = 0;
    if (query.length > 50) {
      factors.push("\u957F\u67E5\u8BE2");
      score += 2;
    }
    const questionMarks = (query.match(/[？?]/g) || []).length;
    if (questionMarks > 1) {
      factors.push("\u591A\u91CD\u95EE\u9898");
      score += questionMarks;
    }
    const professionalTerms = ["\u4F30\u503C", "\u8F6E\u6B21", "valuation", "series", "due diligence"];
    const termCount = professionalTerms.filter(
      (term) => query.toLowerCase().includes(term.toLowerCase())
    ).length;
    if (termCount > 1) {
      factors.push("\u4E13\u4E1A\u672F\u8BED");
      score += termCount;
    }
    if (query.includes("\u6BD4\u8F83") || query.includes("\u5BF9\u6BD4") || query.includes("vs")) {
      factors.push("\u6BD4\u8F83\u5206\u6790");
      score += 2;
    }
    if (/\d{4}年|\d+月|最近|未来|趋势/.test(query)) {
      factors.push("\u65F6\u95F4\u7EF4\u5EA6");
      score += 1;
    }
    let complexity = "simple";
    if (score >= 5)
      complexity = "complex";
    else if (score >= 2)
      complexity = "medium";
    return { complexity, factors, score };
  }
};
__name(QueryExpansionService, "QueryExpansionService");
function createQueryExpansionService() {
  return new QueryExpansionService();
}
__name(createQueryExpansionService, "createQueryExpansionService");

// lib/semantic-cache-service.ts
var SemanticCacheService = class {
  cache = /* @__PURE__ */ new Map();
  kvNamespace;
  maxCacheSize = 1e3;
  defaultTTL = 6 * 60 * 60 * 1e3;
  // 6小时
  semanticThreshold = 0.85;
  // 语义相似度阈值
  constructor(kvNamespace) {
    this.kvNamespace = kvNamespace;
  }
  /**
   * 生成缓存键
   */
  generateCacheKey(query, queryType) {
    const normalizedQuery = query.toLowerCase().trim();
    const hash = this.simpleHash(normalizedQuery + (queryType || ""));
    return `rag_cache_${hash}`;
  }
  /**
   * 简单哈希函数
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0)
      return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * 计算查询相似度
   */
  calculateQuerySimilarity(query1, query2) {
    const words1 = new Set(query1.toLowerCase().split(/\s+/));
    const words2 = new Set(query2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = /* @__PURE__ */ new Set([...words1, ...words2]);
    const jaccard = intersection.size / union.size;
    const lengthSim = 1 - Math.abs(query1.length - query2.length) / Math.max(query1.length, query2.length);
    return jaccard * 0.7 + lengthSim * 0.3;
  }
  /**
   * 检查缓存命中
   */
  async checkCache(query, queryType, options = {}) {
    const {
      useSemanticMatch = true,
      maxCandidates = 5
    } = options;
    try {
      const exactKey = this.generateCacheKey(query, queryType);
      const exactMatch = this.cache.get(exactKey);
      if (exactMatch && exactMatch.expiresAt > Date.now()) {
        exactMatch.metadata.hitCount++;
        console.log("\u2705 \u7F13\u5B58\u7CBE\u786E\u547D\u4E2D");
        return {
          entry: exactMatch,
          similarity: 1,
          isExact: true,
          confidence: 1
        };
      }
      if (useSemanticMatch) {
        const candidates = [];
        for (const [key, entry] of this.cache.entries()) {
          if (entry.expiresAt <= Date.now()) {
            this.cache.delete(key);
            continue;
          }
          if (queryType && entry.metadata.queryType !== queryType) {
            continue;
          }
          const similarity = this.calculateQuerySimilarity(query, entry.query);
          if (similarity >= this.semanticThreshold) {
            candidates.push({ entry, similarity });
          }
        }
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.similarity - a.similarity);
          const bestMatch = candidates[0];
          bestMatch.entry.metadata.hitCount++;
          console.log(`\u{1F3AF} \u8BED\u4E49\u7F13\u5B58\u547D\u4E2D: \u76F8\u4F3C\u5EA6=${(bestMatch.similarity * 100).toFixed(1)}%`);
          return {
            entry: bestMatch.entry,
            similarity: bestMatch.similarity,
            isExact: false,
            confidence: bestMatch.similarity
          };
        }
      }
      console.log("\u274C \u7F13\u5B58\u672A\u547D\u4E2D");
      return null;
    } catch (error) {
      console.error("\u7F13\u5B58\u68C0\u67E5\u5931\u8D25:", error);
      return null;
    }
  }
  /**
   * 存储到缓存
   */
  async storeInCache(query, results, metadata = {}, ttl) {
    try {
      const cacheKey = this.generateCacheKey(query, metadata.queryType);
      const expiresAt = Date.now() + (ttl || this.defaultTTL);
      const entry = {
        key: cacheKey,
        query: query.trim(),
        results,
        metadata: {
          timestamp: Date.now(),
          hitCount: 0,
          queryType: metadata.queryType || "general",
          confidence: metadata.confidence || 0.5,
          userAgent: metadata.userAgent
        },
        expiresAt
      };
      this.cache.set(cacheKey, entry);
      if (this.kvNamespace) {
        try {
          await this.kvNamespace.put(
            `cache:${cacheKey}`,
            JSON.stringify(entry),
            { expirationTtl: ttl ? Math.floor(ttl / 1e3) : Math.floor(this.defaultTTL / 1e3) }
          );
        } catch (kvError) {
          console.log("KV\u7F13\u5B58\u5199\u5165\u5931\u8D25:", kvError);
        }
      }
      await this.cleanupCache();
      console.log(`\u{1F4BE} \u67E5\u8BE2\u5DF2\u7F13\u5B58: ${cacheKey}`);
    } catch (error) {
      console.error("\u7F13\u5B58\u5B58\u50A8\u5931\u8D25:", error);
    }
  }
  /**
   * 清理过期和低价值缓存
   */
  async cleanupCache() {
    try {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt <= now) {
          this.cache.delete(key);
        }
      }
      if (this.cache.size > this.maxCacheSize) {
        const entries = Array.from(this.cache.entries());
        entries.sort((a, b) => {
          const scoreA = a[1].metadata.hitCount * 0.7 + (now - a[1].metadata.timestamp) * 0.3;
          const scoreB = b[1].metadata.hitCount * 0.7 + (now - b[1].metadata.timestamp) * 0.3;
          return scoreA - scoreB;
        });
        const toDelete = entries.slice(0, this.cache.size - this.maxCacheSize + 100);
        toDelete.forEach(([key]) => this.cache.delete(key));
        console.log(`\u{1F9F9} \u7F13\u5B58\u6E05\u7406\u5B8C\u6210\uFF0C\u5220\u9664${toDelete.length}\u4E2A\u6761\u76EE`);
      }
    } catch (error) {
      console.error("\u7F13\u5B58\u6E05\u7406\u5931\u8D25:", error);
    }
  }
  /**
   * 获取缓存统计
   */
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      totalHits: 0,
      avgConfidence: 0,
      typeDistribution: {},
      hitRateByType: {}
    };
    let totalConfidence = 0;
    for (const entry of this.cache.values()) {
      stats.totalHits += entry.metadata.hitCount;
      totalConfidence += entry.metadata.confidence;
      const type = entry.metadata.queryType;
      stats.typeDistribution[type] = (stats.typeDistribution[type] || 0) + 1;
      if (!stats.hitRateByType[type]) {
        stats.hitRateByType[type] = { hits: 0, queries: 0 };
      }
      stats.hitRateByType[type].hits += entry.metadata.hitCount;
      stats.hitRateByType[type].queries += 1;
    }
    stats.avgConfidence = stats.totalEntries > 0 ? totalConfidence / stats.totalEntries : 0;
    return stats;
  }
  /**
   * 预热缓存 - 使用常见查询
   */
  async warmupCache(commonQueries) {
    console.log(`\u{1F525} \u5F00\u59CB\u7F13\u5B58\u9884\u70ED\uFF0C${commonQueries.length} \u4E2A\u67E5\u8BE2`);
    for (const { query, queryType } of commonQueries) {
      const mockResults = {
        matches: [
          {
            id: `warmup_${Date.now()}`,
            content: `\u9884\u70ED\u7F13\u5B58\u7ED3\u679C: ${query}`,
            score: 0.8,
            source: "warmup"
          }
        ],
        confidence: 0.7,
        source: "warmup"
      };
      await this.storeInCache(query, mockResults, { queryType, confidence: 0.7 });
    }
    console.log("\u2705 \u7F13\u5B58\u9884\u70ED\u5B8C\u6210");
  }
  /**
   * 强制清除所有缓存
   */
  clearCache() {
    this.cache.clear();
    console.log("\u{1F5D1}\uFE0F \u7F13\u5B58\u5DF2\u6E05\u7A7A");
  }
  /**
   * 获取热门查询
   */
  getPopularQueries(limit = 10) {
    const entries = Array.from(this.cache.values()).filter((entry) => entry.metadata.hitCount > 0).sort((a, b) => b.metadata.hitCount - a.metadata.hitCount).slice(0, limit).map((entry) => ({
      query: entry.query,
      hitCount: entry.metadata.hitCount,
      queryType: entry.metadata.queryType
    }));
    return entries;
  }
  /**
   * 批量预加载缓存项
   */
  async batchPreload(entries) {
    console.log(`\u{1F4E6} \u6279\u91CF\u9884\u52A0\u8F7D${entries.length}\u4E2A\u7F13\u5B58\u9879`);
    for (const entry of entries) {
      await this.storeInCache(
        entry.query,
        entry.results,
        { queryType: entry.queryType, confidence: entry.confidence }
      );
    }
    console.log("\u2705 \u6279\u91CF\u9884\u52A0\u8F7D\u5B8C\u6210");
  }
  /**
   * 从KV存储恢复缓存
   */
  async restoreFromKV() {
    if (!this.kvNamespace)
      return 0;
    try {
      console.log("\u26A0\uFE0F KV\u7F13\u5B58\u6062\u590D\u529F\u80FD\u9700\u8981\u989D\u5916\u5B9E\u73B0");
      return 0;
    } catch (error) {
      console.error("KV\u7F13\u5B58\u6062\u590D\u5931\u8D25:", error);
      return 0;
    }
  }
};
__name(SemanticCacheService, "SemanticCacheService");
function createSemanticCacheService(kvNamespace) {
  return new SemanticCacheService(kvNamespace);
}
__name(createSemanticCacheService, "createSemanticCacheService");

// lib/hybrid-rag-service.ts
var HybridRAGService = class {
  config;
  vectorize;
  ai;
  openaiApiKey;
  queryExpansionService;
  cacheService;
  constructor(vectorize, ai, openaiApiKey, kvNamespace) {
    this.vectorize = vectorize;
    this.ai = ai;
    this.openaiApiKey = openaiApiKey;
    this.queryExpansionService = createQueryExpansionService();
    this.cacheService = createSemanticCacheService(kvNamespace);
    this.config = {
      useOpenAI: !!openaiApiKey,
      useCloudflareAI: !!ai,
      useKeywordSearch: true,
      fallbackEnabled: true
    };
  }
  /**
   * 智能检索：多策略并行 + 查询扩展增强 + 语义缓存
   */
  async performIntelligentRAG(query, options = {}) {
    const startTime = Date.now();
    console.log("\u{1F50D} \u5F00\u59CB\u667A\u80FDRAG\u68C0\u7D22 (\u589E\u5F3A\u7248 + \u7F13\u5B58)");
    const queryExpansion = this.queryExpansionService.expandQuery(query, {
      includeContext: true,
      maxExpansions: 8,
      confidenceThreshold: 0.4
    });
    console.log(`\u{1F4C8} \u67E5\u8BE2\u6269\u5C55\u5B8C\u6210: \u7C7B\u578B=${queryExpansion.queryType}, \u7F6E\u4FE1\u5EA6=${(queryExpansion.confidence * 100).toFixed(1)}%`);
    const cacheHit = await this.cacheService.checkCache(query, queryExpansion.queryType, {
      useSemanticMatch: true,
      maxCandidates: 5
    });
    if (cacheHit && cacheHit.confidence >= 0.8) {
      console.log(`\u26A1 \u7F13\u5B58\u547D\u4E2D (${cacheHit.isExact ? "\u7CBE\u786E" : "\u8BED\u4E49"}): ${(cacheHit.confidence * 100).toFixed(1)}%`);
      return {
        ...cacheHit.entry.results,
        queryExpansion,
        searchQuery: queryExpansion.expandedQuery,
        fromCache: true,
        cacheHit: {
          similarity: cacheHit.similarity,
          isExact: cacheHit.isExact,
          responseTime: Date.now() - startTime
        },
        enhancedFeatures: {
          queryExpansion: true,
          semanticCaching: true,
          cacheAccelerated: true
        }
      };
    }
    console.log("\u{1F4AB} \u6267\u884C\u5B8C\u6574RAG\u68C0\u7D22...");
    const searchQuery = queryExpansion.expandedQuery;
    const strategies = [];
    if (this.config.useOpenAI || this.config.useCloudflareAI) {
      strategies.push(this.vectorSearch(searchQuery, { ...options, originalQuery: query, expansion: queryExpansion }));
    }
    strategies.push(this.enhancedKeywordSearch(searchQuery, queryExpansion, options));
    strategies.push(this.semanticPatternMatch(searchQuery, { ...options, queryType: queryExpansion.queryType }));
    const results = await Promise.allSettled(strategies);
    const mergedResults = this.mergeResults(results, query);
    const finalResults = {
      ...mergedResults,
      queryExpansion,
      searchQuery,
      fromCache: false,
      responseTime: Date.now() - startTime,
      enhancedFeatures: {
        queryExpansion: true,
        semanticEnhancement: true,
        multiStrategyRetrieval: true,
        semanticCaching: true
      }
    };
    if (finalResults.confidence >= 0.6 && finalResults.matches?.length > 0) {
      await this.cacheService.storeInCache(
        query,
        finalResults,
        {
          queryType: queryExpansion.queryType,
          confidence: finalResults.confidence
        }
      );
    }
    return finalResults;
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
   * 增强关键词检索（使用查询扩展）
   */
  async enhancedKeywordSearch(expandedQuery, queryExpansion, options) {
    try {
      const originalKeywords = this.extractKeywords(queryExpansion.originalQuery);
      const expandedKeywords = this.extractKeywords(expandedQuery);
      const synonyms = queryExpansion.synonyms || [];
      const weightedKeywords = [
        ...originalKeywords.map((k) => ({ term: k, weight: 1, type: "original" })),
        ...expandedKeywords.filter((k) => !originalKeywords.includes(k)).map((k) => ({ term: k, weight: 0.8, type: "expanded" })),
        ...synonyms.slice(0, 5).map((k) => ({ term: k, weight: 0.6, type: "synonym" }))
      ];
      console.log(`\u{1F50D} \u589E\u5F3A\u5173\u952E\u8BCD\u68C0\u7D22: ${weightedKeywords.length} \u4E2A\u641C\u7D22\u8BCD`);
      const matches = await this.findWeightedKeywordMatches(weightedKeywords);
      const typeAdjustedMatches = this.adjustScoresByQueryType(matches, queryExpansion.queryType);
      return {
        matches: typeAdjustedMatches.map((match2) => ({
          ...match2,
          score: match2.keywordScore,
          source: "enhanced_keyword",
          matchDetails: match2.matchDetails
        })),
        source: "enhanced_keyword",
        searchTerms: weightedKeywords.length
      };
    } catch (error) {
      console.log("\u589E\u5F3A\u5173\u952E\u8BCD\u68C0\u7D22\u5931\u8D25\uFF0C\u56DE\u9000\u5230\u57FA\u7840\u68C0\u7D22");
      return this.keywordSearch(queryExpansion.originalQuery, options);
    }
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
   * 加载飞书知识库数据
   */
  async loadFeishuKnowledgeBase() {
    try {
      let response = await fetch("/assets/data/rag/real-feishu-content.json").catch(() => null);
      if (!response || !response.ok) {
        response = await fetch("/assets/data/rag/improved-feishu-knowledge-base.json");
      }
      if (!response.ok) {
        throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u98DE\u4E66\u77E5\u8BC6\u5E93\u6570\u636E");
      }
      const data = await response.json();
      const documents = [];
      if (data.documents && Array.isArray(data.documents) && data.summary?.syncMethod === "real_content_api") {
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
   * 加权关键词匹配
   */
  async findWeightedKeywordMatches(weightedKeywords) {
    const documents = await this.getStoredDocuments();
    const matches = [];
    documents.forEach((doc) => {
      const content = (doc.content || "").toLowerCase();
      const title = (doc.title || "").toLowerCase();
      let totalScore = 0;
      let matchedTerms = 0;
      const matchDetails = { original: 0, expanded: 0, synonym: 0 };
      weightedKeywords.forEach(({ term, weight, type }) => {
        const termLower = term.toLowerCase();
        const contentMatches = (content.match(new RegExp(termLower, "gi")) || []).length;
        const titleMatches = (title.match(new RegExp(termLower, "gi")) || []).length;
        if (contentMatches > 0 || titleMatches > 0) {
          matchedTerms++;
          matchDetails[type]++;
          const contentScore = contentMatches * 0.7 * weight;
          const titleScore = titleMatches * 1.2 * weight;
          totalScore += contentScore + titleScore;
        }
      });
      if (totalScore > 0) {
        matches.push({
          ...doc,
          keywordScore: Math.min(totalScore / weightedKeywords.length, 1),
          matchedTerms,
          matchDetails,
          type: "weighted_keyword_match"
        });
      }
    });
    return matches.sort((a, b) => b.keywordScore - a.keywordScore);
  }
  /**
   * 根据查询类型调整分数
   */
  adjustScoresByQueryType(matches, queryType) {
    const typeBoosts = {
      "company_search": { companyKeywords: 1.3, generalContent: 1 },
      "investment_analysis": { investmentKeywords: 1.3, marketData: 1.2 },
      "market_trends": { trendKeywords: 1.3, analysisContent: 1.1 },
      "technology_info": { techKeywords: 1.3, productInfo: 1.2 },
      "funding_info": { fundingKeywords: 1.4, financialData: 1.2 },
      "team_evaluation": { teamKeywords: 1.3, leadershipContent: 1.1 }
    };
    if (!typeBoosts[queryType])
      return matches;
    return matches.map((match2) => {
      let boost = 1;
      const content = (match2.content || "").toLowerCase();
      if (queryType === "company_search" && (content.includes("\u516C\u53F8") || content.includes("\u4F01\u4E1A") || content.includes("startup"))) {
        boost *= 1.3;
      }
      if (queryType === "investment_analysis" && (content.includes("\u6295\u8D44") || content.includes("\u878D\u8D44") || content.includes("investment"))) {
        boost *= 1.3;
      }
      if (queryType === "funding_info" && (content.includes("\u8F6E\u6B21") || content.includes("\u4F30\u503C") || content.includes("round"))) {
        boost *= 1.4;
      }
      return {
        ...match2,
        keywordScore: Math.min(match2.keywordScore * boost, 1),
        typeBoost: boost
      };
    });
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
function createOptimalRAGService(vectorize, ai, openaiApiKey, kvNamespace) {
  return new HybridRAGService(vectorize, ai, openaiApiKey, kvNamespace);
}
__name(createOptimalRAGService, "createOptimalRAGService");

// api/chat.ts
var BASE_SYSTEM_PROMPT = `\u4F60\u662F\u51EF\u745E(Kerry)\uFF0CSVTR.AI\u7684AI\u521B\u6295\u5206\u6790\u5E08\uFF0C\u4E13\u6CE8\u4E8E\u4E3A\u7528\u6237\u63D0\u4F9B\u51C6\u786E\u3001\u6709\u7528\u7684AI\u521B\u6295\u4FE1\u606F\u3002

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
        console.log("\u{1F4CB} \u8C03\u7528\u53C2\u6570\u51C6\u5907\u4E2D...");
        if (model.includes("@cf/openai/gpt-oss")) {
          console.log("\u{1F504} \u4F7F\u7528OpenAI\u4E13\u7528\u683C\u5F0F");
          const systemMessage = messagesWithEnhancedSystem.find((m) => m.role === "system");
          const conversationMessages = messagesWithEnhancedSystem.filter((m) => m.role !== "system");
          response = await env.AI.run(model, {
            instructions: systemMessage ? systemMessage.content : BASE_SYSTEM_PROMPT,
            input: conversationMessages,
            // 直接传递消息数组
            stream: true,
            max_tokens: 4096,
            temperature: 0.8
          });
          console.log("\u2705 OpenAI\u683C\u5F0F\u8C03\u7528\u5B8C\u6210");
        } else {
          console.log("\u{1F504} \u4F7F\u7528\u6807\u51C6messages\u683C\u5F0F");
          response = await env.AI.run(model, {
            messages: messagesWithEnhancedSystem,
            stream: true,
            max_tokens: 4096,
            temperature: 0.8,
            top_p: 0.95
          });
          console.log("\u2705 \u6807\u51C6\u683C\u5F0F\u8C03\u7528\u5B8C\u6210");
        }
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

// ../.wrangler/tmp/pages-CT1R91/functionsRoutes-0.9544266384638118.mjs
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

// ../.wrangler/tmp/bundle-dAHeGK/middleware-insertion-facade.js
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

// ../.wrangler/tmp/bundle-dAHeGK/middleware-loader.entry.ts
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
//# sourceMappingURL=functionsWorker-0.33177046038245317.mjs.map
