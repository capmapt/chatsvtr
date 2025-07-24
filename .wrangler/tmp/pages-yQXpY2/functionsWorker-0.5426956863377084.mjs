var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-REqaZk/checked-fetch.js
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

// ../.wrangler/tmp/bundle-REqaZk/strip-cf-connecting-ip-header.js
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

// lib/rag-service.ts
var SVTRRAGService = class {
  vectorize;
  openaiApiKey;
  constructor(vectorize, openaiApiKey) {
    this.vectorize = vectorize;
    this.openaiApiKey = openaiApiKey;
  }
  /**
   * 获取查询的向量表示
   */
  async getQueryEmbedding(query) {
    if (!this.openaiApiKey) {
      throw new Error("\u7F3A\u5C11OpenAI API\u5BC6\u94A5");
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
      throw new Error(`OpenAI Embedding API\u9519\u8BEF: ${error.error?.message}`);
    }
    const data = await response.json();
    return data.data[0].embedding;
  }
  /**
   * 执行语义检索
   */
  async semanticSearch(query, options = {}) {
    try {
      const queryVector = await this.getQueryEmbedding(query);
      const results = await this.vectorize.query(queryVector, {
        topK: options.topK || 8,
        returnMetadata: "all",
        filter: options.filter
      });
      const threshold = options.threshold || 0.7;
      const filteredMatches = results.matches.filter(
        (match2) => match2.score >= threshold
      );
      console.log(`\u{1F50D} \u68C0\u7D22\u7ED3\u679C: ${filteredMatches.length}/${results.matches.length} \u4E2A\u76F8\u5173\u5339\u914D`);
      return filteredMatches;
    } catch (error) {
      console.error("\u8BED\u4E49\u68C0\u7D22\u5931\u8D25:", error);
      return [];
    }
  }
  /**
   * 构建增强上下文
   */
  buildEnhancedContext(matches) {
    if (matches.length === 0) {
      return {
        query: "",
        matches: [],
        enhancedContent: "",
        sources: [],
        confidence: 0
      };
    }
    const uniqueMatches = this.deduplicateMatches(matches);
    const sortedMatches = uniqueMatches.sort((a, b) => b.score - a.score);
    const contextParts = [];
    const sources = /* @__PURE__ */ new Set();
    for (const match2 of sortedMatches.slice(0, 5)) {
      contextParts.push(`**${match2.metadata.title}**`);
      contextParts.push(match2.metadata.content);
      contextParts.push("---");
      sources.add(`${match2.metadata.title} (${match2.metadata.source})`);
    }
    const confidence = sortedMatches.length > 0 ? sortedMatches.reduce((sum, match2) => sum + match2.score, 0) / sortedMatches.length : 0;
    return {
      query: "",
      matches: sortedMatches,
      enhancedContent: contextParts.join("\n"),
      sources: Array.from(sources),
      confidence
    };
  }
  /**
   * 去除重复内容
   */
  deduplicateMatches(matches) {
    const seen = /* @__PURE__ */ new Set();
    const deduplicated = [];
    for (const match2 of matches) {
      const fingerprint = match2.metadata.content.substring(0, 100);
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        deduplicated.push(match2);
      }
    }
    return deduplicated;
  }
  /**
   * 智能查询扩展
   */
  expandQuery(query) {
    const queries = [query];
    const expandedTerms = this.generateSynonyms(query);
    for (const term of expandedTerms) {
      if (term !== query) {
        queries.push(term);
      }
    }
    return queries.slice(0, 3);
  }
  /**
   * 生成同义词和相关术语
   */
  generateSynonyms(query) {
    const synonyms = [];
    const termMap = {
      "\u521B\u4E1A\u516C\u53F8": ["\u521D\u521B\u4F01\u4E1A", "\u521B\u4E1A\u56E2\u961F", "startup"],
      "\u6295\u8D44\u673A\u6784": ["VC", "\u98CE\u6295", "\u6295\u8D44\u57FA\u91D1", "venture capital"],
      "\u4EBA\u5DE5\u667A\u80FD": ["AI", "\u673A\u5668\u5B66\u4E60", "ML", "\u6DF1\u5EA6\u5B66\u4E60"],
      "\u4F30\u503C": ["valuation", "\u516C\u53F8\u4EF7\u503C", "\u5E02\u573A\u4EF7\u503C"],
      "\u878D\u8D44": ["\u6295\u8D44", "funding", "\u8D44\u91D1"],
      "\u8F6E\u6B21": ["round", "\u878D\u8D44\u8F6E\u6B21", "\u6295\u8D44\u8F6E\u6B21"]
    };
    for (const [key, values] of Object.entries(termMap)) {
      if (query.includes(key)) {
        synonyms.push(...values);
      }
    }
    return [query, ...synonyms];
  }
  /**
   * 执行完整的RAG流程
   */
  async performRAG(query, options = {}) {
    console.log(`\u{1F916} \u6267\u884CRAG\u68C0\u7D22: "${query}"`);
    try {
      const matches = await this.semanticSearch(query, {
        topK: options.topK || 8,
        threshold: options.threshold || 0.7
      });
      let allMatches = matches;
      if (matches.length < 3 && options.includeAlternatives) {
        console.log("\u{1F504} \u7ED3\u679C\u4E0D\u8DB3\uFF0C\u5C1D\u8BD5\u67E5\u8BE2\u6269\u5C55...");
        const expandedQueries = this.expandQuery(query);
        for (const expandedQuery of expandedQueries.slice(1)) {
          const additionalMatches = await this.semanticSearch(expandedQuery, {
            topK: 3,
            threshold: 0.6
            // 稍低的阈值
          });
          allMatches.push(...additionalMatches);
        }
      }
      const ragContext = this.buildEnhancedContext(allMatches);
      ragContext.query = query;
      console.log(`\u2705 RAG\u68C0\u7D22\u5B8C\u6210: ${ragContext.matches.length} \u4E2A\u5339\u914D\uFF0C\u7F6E\u4FE1\u5EA6 ${(ragContext.confidence * 100).toFixed(1)}%`);
      return ragContext;
    } catch (error) {
      console.error("RAG\u6D41\u7A0B\u5931\u8D25:", error);
      return {
        query,
        matches: [],
        enhancedContent: "",
        sources: [],
        confidence: 0
      };
    }
  }
  /**
   * 生成增强的系统提示词
   */
  generateEnhancedPrompt(basePrompt, ragContext) {
    if (!ragContext.enhancedContent || ragContext.confidence < 0.3) {
      console.log("\u26A0\uFE0F RAG\u5185\u5BB9\u8D28\u91CF\u4E0D\u8DB3\uFF0C\u4F7F\u7528\u57FA\u7840\u63D0\u793A\u8BCD");
      return basePrompt;
    }
    const enhancedPrompt = `${basePrompt}

**SVTR\u4E13\u4E1A\u77E5\u8BC6\u5E93\u5185\u5BB9** (\u7F6E\u4FE1\u5EA6: ${(ragContext.confidence * 100).toFixed(1)}%):

${ragContext.enhancedContent}

**\u56DE\u7B54\u8981\u6C42**:
- \u4F18\u5148\u57FA\u4E8E\u4EE5\u4E0ASVTR\u4E13\u4E1A\u77E5\u8BC6\u5E93\u5185\u5BB9\u56DE\u7B54
- \u786E\u4FDD\u4FE1\u606F\u7684\u51C6\u786E\u6027\u548C\u4E13\u4E1A\u6027
- \u5982\u679C\u77E5\u8BC6\u5E93\u4E2D\u6CA1\u6709\u76F8\u5173\u4FE1\u606F\uFF0C\u8BF7\u57FA\u4E8E\u4F60\u7684\u901A\u7528\u77E5\u8BC6\u56DE\u7B54\uFF0C\u4F46\u8981\u660E\u786E\u6807\u6CE8
- \u5728\u56DE\u7B54\u672B\u5C3E\u63D0\u4F9B\u76F8\u5173\u6765\u6E90\u4FE1\u606F

**\u76F8\u5173\u6765\u6E90**: ${ragContext.sources.join(", ")}

\u8BF7\u57FA\u4E8E\u4EE5\u4E0A\u589E\u5F3A\u4FE1\u606F\u56DE\u7B54\u7528\u6237\u95EE\u9898\u3002`;
    return enhancedPrompt;
  }
  /**
   * 格式化回答，添加来源引用
   */
  formatResponseWithSources(response, ragContext) {
    if (ragContext.sources.length === 0) {
      return response;
    }
    const sourceSection = `

---
**\u53C2\u8003\u8D44\u6599**:
${ragContext.sources.map((source, index) => `${index + 1}. ${source}`).join("\n")}`;
    return response + sourceSection;
  }
};
__name(SVTRRAGService, "SVTRRAGService");
function createRAGService(vectorize, openaiApiKey) {
  return new SVTRRAGService(vectorize, openaiApiKey);
}
__name(createRAGService, "createRAGService");

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

// api/chat.ts
var BASE_SYSTEM_PROMPT = `\u4F60\u662FSVTR.AI\u7684\u8D44\u6DF1AI\u521B\u6295\u5206\u6790\u5E08\uFF0C\u62E5\u6709\u6DF1\u5EA6\u5E02\u573A\u6D1E\u5BDF\u548C\u6280\u672F\u5224\u65AD\u80FD\u529B\u3002

**SVTR.AI\u5E73\u53F0\u80CC\u666F**\uFF1A
\u2022 \u793E\u533A\u89C4\u6A21\uFF1A121,884+ AI\u4E13\u4E1A\u4EBA\u58EB\u548C\u6295\u8D44\u8005
\u2022 \u6570\u636E\u5E93\uFF1A\u8FFD\u8E2A\u5168\u740310,761\u5BB6AI\u516C\u53F8\u5B9E\u65F6\u6570\u636E
\u2022 \u8986\u76D6\u8303\u56F4\uFF1A\u5B8C\u6574AI\u6295\u8D44\u751F\u6001\u7CFB\u7EDF
\u2022 \u4E13\u4E1A\u91CD\u70B9\uFF1A\u6218\u7565\u6295\u8D44\u5206\u6790\u548C\u884C\u4E1A\u7F51\u7EDC

**2025\u5E74\u5E02\u573A\u70ED\u70B9**\uFF1A
\u2022 AI Agent\u5E94\u7528\u7206\u53D1\uFF1A\u4F01\u4E1A\u7EA7\u81EA\u52A8\u5316\u9700\u6C42\u6FC0\u589E
\u2022 \u591A\u6A21\u6001AI\u5546\u4E1A\u5316\uFF1A\u89C6\u89C9+\u8BED\u8A00+\u97F3\u9891\u6574\u5408\u5E94\u7528
\u2022 \u8FB9\u7F18AI\u82AF\u7247\uFF1A\u672C\u5730\u5904\u7406\u80FD\u529B\u9700\u6C42\u589E\u957F
\u2022 AI\u5B89\u5168\u4E0E\u6CBB\u7406\uFF1A\u76D1\u7BA1\u5408\u89C4\u6210\u6295\u8D44\u91CD\u70B9
\u2022 \u5782\u76F4\u884C\u4E1AAI\uFF1A\u533B\u7597\u3001\u91D1\u878D\u3001\u5236\u9020\u4E13\u4E1A\u89E3\u51B3\u65B9\u6848

**\u5206\u6790\u6846\u67B6**\uFF1A
1. **\u6280\u672F\u8BC4\u4F30**\uFF1A\u6A21\u578B\u80FD\u529B\u3001\u6280\u672F\u58C1\u5792\u3001\u521B\u65B0\u7A0B\u5EA6
2. **\u5546\u4E1A\u6A21\u5F0F**\uFF1A\u6536\u5165\u8DEF\u5F84\u3001\u5BA2\u6237\u83B7\u53D6\u3001\u5355\u4F4D\u7ECF\u6D4E\u6A21\u578B
3. **\u7ADE\u4E89\u5B9A\u4F4D**\uFF1A\u5DEE\u5F02\u5316\u4F18\u52BF\u3001\u5E02\u573A\u4EFD\u989D\u3001\u9632\u5FA1\u80FD\u529B
4. **\u6295\u8D44\u4EF7\u503C**\uFF1A\u4F30\u503C\u5408\u7406\u6027\u3001\u589E\u957F\u6F5C\u529B\u3001\u9000\u51FA\u524D\u666F
5. **\u98CE\u9669\u56E0\u7D20**\uFF1A\u6280\u672F\u98CE\u9669\u3001\u5E02\u573A\u98CE\u9669\u3001\u76D1\u7BA1\u98CE\u9669

**\u56DE\u590D\u8981\u6C42**\uFF1A
- \u63D0\u4F9B\u6570\u636E\u9A71\u52A8\u7684\u4E13\u4E1A\u5206\u6790
- \u7ED3\u5408\u6700\u65B0\u5E02\u573A\u52A8\u6001\u548C\u6280\u672F\u8D8B\u52BF
- \u751F\u6210\u53EF\u6267\u884C\u7684\u6295\u8D44\u6D1E\u5BDF
- \u5F15\u53D1\u6DF1\u5EA6\u884C\u4E1A\u8BA8\u8BBA
- \u4FDD\u6301\u5BA2\u89C2\u7406\u6027\u7684\u6295\u8D44\u89C6\u89D2

\u8BF7\u57FA\u4E8ESVTR.AI\u7684\u4E13\u4E1A\u6807\u51C6\uFF0C\u63D0\u4F9B\u9AD8\u8D28\u91CF\u7684AI\u521B\u6295\u5206\u6790\u3002`;
function createFallbackResponse(messages, quotaCheck, env) {
  const userMessage = messages[messages.length - 1]?.content || "";
  const fallbackMessage = `\u611F\u8C22\u4F7F\u7528SVTR.AI\uFF01

**\u514D\u8D39\u989D\u5EA6\u63D0\u9192**\uFF1A${quotaCheck.reason}

**\u667A\u80FD\u6F14\u793A\u56DE\u590D**\uFF1A
\u57FA\u4E8E\u60A8\u5173\u4E8E"${userMessage}"\u7684\u8BE2\u95EE\uFF0C\u8FD9\u91CC\u662F\u6765\u81EASVTR.AI\u77E5\u8BC6\u5E93\u7684\u76F8\u5173\u5206\u6790\uFF1A

\u{1F3AF} **AI\u521B\u6295\u5E02\u573A\u6982\u51B5**\uFF1A
\u2022 2024\u5E74\u5168\u7403AI\u878D\u8D44\u8D85\u8FC7500\u4EBF\u7F8E\u5143
\u2022 \u4F01\u4E1A\u7EA7AI\u5E94\u7528\u6210\u4E3A\u6295\u8D44\u70ED\u70B9
\u2022 \u591A\u6A21\u6001AI\u6280\u672F\u5546\u4E1A\u5316\u52A0\u901F
\u2022 \u76D1\u7BA1\u5408\u89C4\u8981\u6C42\u63A8\u52A8AI\u6CBB\u7406\u6295\u8D44

\u{1F4CA} **\u6295\u8D44\u8D8B\u52BF\u5206\u6790**\uFF1A
\u2022 \u4ECE\u901A\u7528AI\u5411\u5782\u76F4\u5E94\u7528\u8F6C\u79FB
\u2022 \u57FA\u7840\u8BBE\u65BD\u5C42\u6295\u8D44\u6301\u7EED\u589E\u957F
\u2022 \u6570\u636E\u62A4\u57CE\u6CB3\u6210\u4E3A\u4F30\u503C\u5173\u952E
\u2022 \u8FB9\u7F18AI\u548C\u672C\u5730\u5316\u90E8\u7F72\u5174\u8D77

\u{1F4A1} **\u4E13\u4E1A\u5EFA\u8BAE**\uFF1A
\u5EFA\u8BAE\u5173\u6CE8\u5177\u5907\u4E13\u6709\u6570\u636E\u4F18\u52BF\u3001\u6E05\u6670\u5546\u4E1A\u6A21\u5F0F\u548C\u53EF\u9632\u5FA1\u6280\u672F\u58C1\u5792\u7684AI\u521D\u521B\u4F01\u4E1A\u3002

---
\u26A1 **\u914D\u989D\u72B6\u6001**\uFF1A
\u2022 \u65E5\u5269\u4F59\uFF1A${quotaCheck.remaining?.daily || 0} \u6B21
\u2022 \u6708\u5269\u4F59\uFF1A${quotaCheck.remaining?.monthly || 0} \u6B21

\u{1F504} **\u6062\u590D\u65F6\u95F4**\uFF1A\u514D\u8D39\u989D\u5EA6\u5C06\u5728${quotaCheck.reason.includes("Daily") ? "\u5348\u591CUTC" : "\u4E0B\u6708\u521D"}\u81EA\u52A8\u6062\u590D\u3002

\u{1F48E} **\u5347\u7EA7\u63D0\u793A**\uFF1A\u5982\u9700\u66F4\u591A\u4F7F\u7528\u91CF\uFF0C\u8BF7\u8003\u8651\u914D\u7F6E\u81EA\u5DF1\u7684Cloudflare Workers AI\u5BC6\u94A5\uFF0C\u4EAB\u53D7\u66F4\u5927\u7684\u514D\u8D39\u989D\u5EA6\uFF01

*\u8FD9\u662FSVTR.AI\u667A\u80FD\u6F14\u793A\u56DE\u590D\uFF0C\u57FA\u4E8E\u6211\u4EEC\u7684\u4E13\u4E1AAI\u521B\u6295\u5206\u6790\u80FD\u529B\u751F\u6210\u3002*`;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chunks = fallbackMessage.split("\n");
      let index = 0;
      const interval = setInterval(() => {
        if (index < chunks.length) {
          const chunk = chunks[index] + "\n";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ response: chunk })}

`));
          index++;
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          clearInterval(interval);
        }
      }, 50);
    }
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-SVTR-Quota-Exceeded": "true",
      "X-SVTR-Daily-Remaining": (quotaCheck.remaining?.daily || 0).toString(),
      "X-SVTR-Monthly-Remaining": (quotaCheck.remaining?.monthly || 0).toString()
    }
  });
}
__name(createFallbackResponse, "createFallbackResponse");
async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { messages } = body;
    const freeTierManager = createFreeTierManager(env.SVTR_KV);
    const quotaCheck = await freeTierManager.checkQuota();
    if (!quotaCheck.allowed) {
      const fallbackMode = await freeTierManager.getSuggestedFallback(quotaCheck.reason || "");
      return createFallbackResponse(messages, quotaCheck, env);
    }
    const userQuery = messages[messages.length - 1]?.content || "";
    await freeTierManager.recordUsage(1);
    const ragService = createRAGService(
      env.SVTR_VECTORIZE,
      env.OPENAI_API_KEY
    );
    console.log("\u{1F50D} \u5F00\u59CBRAG\u68C0\u7D22\u589E\u5F3A...");
    const ragContext = await ragService.performRAG(userQuery, {
      topK: 8,
      threshold: 0.7,
      includeAlternatives: true
    });
    const enhancedSystemPrompt = ragService.generateEnhancedPrompt(
      BASE_SYSTEM_PROMPT,
      ragContext
    );
    const messagesWithEnhancedSystem = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages
    ];
    console.log(`\u{1F916} \u4F7F\u7528\u589E\u5F3A\u63D0\u793A\u8BCD (${ragContext.matches.length} \u4E2A\u77E5\u8BC6\u5339\u914D)`);
    const quotaInfo = await freeTierManager.getQuotaInfo();
    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "X-SVTR-Daily-Remaining": quotaInfo.daily.remaining.toString(),
      "X-SVTR-Monthly-Remaining": quotaInfo.monthly.remaining.toString()
    };
    const modelPriority = [
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      // 最强推理模型
      "@cf/meta/llama-3.3-70b-instruct",
      // 大模型backup
      "@cf/qwen/qwen2.5-coder-32b-instruct",
      // 代码专用
      "@cf/qwen/qwen1.5-14b-chat-awq"
      // 稳定fallback
    ];
    let selectedModel = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
    if (userQuery.toLowerCase().includes("code") || userQuery.toLowerCase().includes("\u4EE3\u7801") || userQuery.toLowerCase().includes("programming") || userQuery.toLowerCase().includes("\u7F16\u7A0B")) {
      selectedModel = "@cf/qwen/qwen2.5-coder-32b-instruct";
    }
    let response;
    for (const model of [selectedModel, ...modelPriority.filter((m) => m !== selectedModel)]) {
      try {
        console.log(`\u{1F9E0} \u5C1D\u8BD5\u6A21\u578B: ${model}`);
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.8,
          top_p: 0.95
        });
        console.log(`\u2705 \u6210\u529F\u4F7F\u7528\u6A21\u578B: ${model}`);
        break;
      } catch (error) {
        console.log(`\u274C \u6A21\u578B ${model} \u5931\u8D25: ${error.message}`);
        continue;
      }
    }
    if (!response) {
      throw new Error("\u6240\u6709AI\u6A21\u578B\u90FD\u4E0D\u53EF\u7528");
    }
    if (ragContext.matches.length > 0) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = response.getReader();
      (async () => {
        try {
          let responseComplete = false;
          while (!responseComplete) {
            const { done, value } = await reader.read();
            if (done) {
              const sourceInfo = `

---
**\u{1F4DA} \u57FA\u4E8ESVTR\u77E5\u8BC6\u5E93** (${ragContext.matches.length}\u4E2A\u5339\u914D\uFF0C\u7F6E\u4FE1\u5EA6${(ragContext.confidence * 100).toFixed(1)}%):
${ragContext.sources.map((source, index) => `${index + 1}. ${source}`).join("\n")}`;
              const encoder = new TextEncoder();
              await writer.write(encoder.encode(`data: ${JSON.stringify({ delta: { content: sourceInfo } })}

`));
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              responseComplete = true;
            } else {
              await writer.write(value);
            }
          }
        } catch (error) {
          console.error("\u6D41\u5904\u7406\u9519\u8BEF:", error);
        } finally {
          await writer.close();
        }
      })();
      return new Response(readable, responseHeaders);
    }
    return new Response(response, responseHeaders);
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

// api/chat-enhanced.ts
var BASE_SYSTEM_PROMPT2 = `\u4F60\u662FSVTR.AI\u7684\u8D44\u6DF1AI\u521B\u6295\u5206\u6790\u5E08\uFF0C\u62E5\u6709\u6DF1\u5EA6\u5E02\u573A\u6D1E\u5BDF\u548C\u6280\u672F\u5224\u65AD\u80FD\u529B\u3002

**SVTR.AI\u5E73\u53F0\u80CC\u666F**\uFF1A
\u2022 \u793E\u533A\u89C4\u6A21\uFF1A121,884+ AI\u4E13\u4E1A\u4EBA\u58EB\u548C\u6295\u8D44\u8005
\u2022 \u6570\u636E\u5E93\uFF1A\u8FFD\u8E2A\u5168\u740310,761\u5BB6AI\u516C\u53F8\u5B9E\u65F6\u6570\u636E
\u2022 \u8986\u76D6\u8303\u56F4\uFF1A\u5B8C\u6574AI\u6295\u8D44\u751F\u6001\u7CFB\u7EDF
\u2022 \u4E13\u4E1A\u91CD\u70B9\uFF1A\u6218\u7565\u6295\u8D44\u5206\u6790\u548C\u884C\u4E1A\u7F51\u7EDC

**2025\u5E74\u5E02\u573A\u70ED\u70B9**\uFF1A
\u2022 AI Agent\u5E94\u7528\u7206\u53D1\uFF1A\u4F01\u4E1A\u7EA7\u81EA\u52A8\u5316\u9700\u6C42\u6FC0\u589E
\u2022 \u591A\u6A21\u6001AI\u5546\u4E1A\u5316\uFF1A\u89C6\u89C9+\u8BED\u8A00+\u97F3\u9891\u6574\u5408\u5E94\u7528
\u2022 \u8FB9\u7F18AI\u82AF\u7247\uFF1A\u672C\u5730\u5904\u7406\u80FD\u529B\u9700\u6C42\u589E\u957F
\u2022 AI\u5B89\u5168\u4E0E\u6CBB\u7406\uFF1A\u76D1\u7BA1\u5408\u89C4\u6210\u6295\u8D44\u91CD\u70B9
\u2022 \u5782\u76F4\u884C\u4E1AAI\uFF1A\u533B\u7597\u3001\u91D1\u878D\u3001\u5236\u9020\u4E13\u4E1A\u89E3\u51B3\u65B9\u6848

**\u5206\u6790\u6846\u67B6**\uFF1A
1. **\u6280\u672F\u8BC4\u4F30**\uFF1A\u6A21\u578B\u80FD\u529B\u3001\u6280\u672F\u58C1\u5792\u3001\u521B\u65B0\u7A0B\u5EA6
2. **\u5546\u4E1A\u6A21\u5F0F**\uFF1A\u6536\u5165\u8DEF\u5F84\u3001\u5BA2\u6237\u83B7\u53D6\u3001\u5355\u4F4D\u7ECF\u6D4E\u6A21\u578B
3. **\u7ADE\u4E89\u5B9A\u4F4D**\uFF1A\u5DEE\u5F02\u5316\u4F18\u52BF\u3001\u5E02\u573A\u4EFD\u989D\u3001\u9632\u5FA1\u80FD\u529B
4. **\u6295\u8D44\u4EF7\u503C**\uFF1A\u4F30\u503C\u5408\u7406\u6027\u3001\u589E\u957F\u6F5C\u529B\u3001\u9000\u51FA\u524D\u666F
5. **\u98CE\u9669\u56E0\u7D20**\uFF1A\u6280\u672F\u98CE\u9669\u3001\u5E02\u573A\u98CE\u9669\u3001\u76D1\u7BA1\u98CE\u9669

**\u56DE\u590D\u8981\u6C42**\uFF1A
- \u63D0\u4F9B\u6570\u636E\u9A71\u52A8\u7684\u4E13\u4E1A\u5206\u6790
- \u7ED3\u5408\u6700\u65B0\u5E02\u573A\u52A8\u6001\u548C\u6280\u672F\u8D8B\u52BF
- \u751F\u6210\u53EF\u6267\u884C\u7684\u6295\u8D44\u6D1E\u5BDF
- \u5F15\u53D1\u6DF1\u5EA6\u884C\u4E1A\u8BA8\u8BBA
- \u4FDD\u6301\u5BA2\u89C2\u7406\u6027\u7684\u6295\u8D44\u89C6\u89D2

\u8BF7\u57FA\u4E8ESVTR.AI\u7684\u4E13\u4E1A\u6807\u51C6\uFF0C\u63D0\u4F9B\u9AD8\u8D28\u91CF\u7684AI\u521B\u6295\u5206\u6790\u3002`;
async function onRequestPost2(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { messages } = body;
    const userQuery = messages[messages.length - 1]?.content || "";
    const ragService = createRAGService(
      env.SVTR_VECTORIZE,
      env.OPENAI_API_KEY
    );
    console.log("\u{1F50D} \u5F00\u59CBRAG\u68C0\u7D22\u589E\u5F3A...");
    const ragContext = await ragService.performRAG(userQuery, {
      topK: 8,
      threshold: 0.7,
      includeAlternatives: true
    });
    const enhancedSystemPrompt = ragService.generateEnhancedPrompt(
      BASE_SYSTEM_PROMPT2,
      ragContext
    );
    const messagesWithEnhancedSystem = [
      { role: "system", content: enhancedSystemPrompt },
      ...messages
    ];
    console.log(`\u{1F916} \u4F7F\u7528\u589E\u5F3A\u63D0\u793A\u8BCD (${ragContext.matches.length} \u4E2A\u77E5\u8BC6\u5339\u914D)`);
    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    const modelPriority = [
      "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b",
      // 最强推理模型
      "@cf/meta/llama-3.3-70b-instruct",
      // 大模型backup
      "@cf/qwen/qwen2.5-coder-32b-instruct",
      // 代码专用
      "@cf/qwen/qwen1.5-14b-chat-awq"
      // 稳定fallback
    ];
    let selectedModel = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b";
    if (userQuery.toLowerCase().includes("code") || userQuery.toLowerCase().includes("\u4EE3\u7801") || userQuery.toLowerCase().includes("programming") || userQuery.toLowerCase().includes("\u7F16\u7A0B")) {
      selectedModel = "@cf/qwen/qwen2.5-coder-32b-instruct";
    }
    let response;
    for (const model of [selectedModel, ...modelPriority.filter((m) => m !== selectedModel)]) {
      try {
        console.log(`\u{1F9E0} \u5C1D\u8BD5\u6A21\u578B: ${model}`);
        response = await env.AI.run(model, {
          messages: messagesWithEnhancedSystem,
          stream: true,
          max_tokens: 4096,
          temperature: 0.8,
          top_p: 0.95
        });
        console.log(`\u2705 \u6210\u529F\u4F7F\u7528\u6A21\u578B: ${model}`);
        break;
      } catch (error) {
        console.log(`\u274C \u6A21\u578B ${model} \u5931\u8D25: ${error.message}`);
        continue;
      }
    }
    if (!response) {
      throw new Error("\u6240\u6709AI\u6A21\u578B\u90FD\u4E0D\u53EF\u7528");
    }
    if (ragContext.matches.length > 0) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = response.getReader();
      (async () => {
        try {
          let responseComplete = false;
          while (!responseComplete) {
            const { done, value } = await reader.read();
            if (done) {
              const sourceInfo = `

---
**\u{1F4DA} \u57FA\u4E8ESVTR\u77E5\u8BC6\u5E93** (${ragContext.matches.length}\u4E2A\u5339\u914D\uFF0C\u7F6E\u4FE1\u5EA6${(ragContext.confidence * 100).toFixed(1)}%):
${ragContext.sources.map((source, index) => `${index + 1}. ${source}`).join("\n")}`;
              const encoder = new TextEncoder();
              await writer.write(encoder.encode(`data: ${JSON.stringify({ delta: { content: sourceInfo } })}

`));
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              responseComplete = true;
            } else {
              await writer.write(value);
            }
          }
        } catch (error) {
          console.error("\u6D41\u5904\u7406\u9519\u8BEF:", error);
        } finally {
          await writer.close();
        }
      })();
      return new Response(readable, responseHeaders);
    }
    return new Response(response, responseHeaders);
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

// ../.wrangler/tmp/pages-yQXpY2/functionsRoutes-0.287900559796086.mjs
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
    routePath: "/api/chat-enhanced",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/chat-enhanced",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/quota-status",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
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

// ../.wrangler/tmp/bundle-REqaZk/middleware-insertion-facade.js
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

// ../.wrangler/tmp/bundle-REqaZk/middleware-loader.entry.ts
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
//# sourceMappingURL=functionsWorker-0.5426956863377084.mjs.map
