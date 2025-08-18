import { onRequestOptions as __api_chat_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/chat.ts"
import { onRequestPost as __api_chat_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/chat.ts"
import { onRequestOptions as __api_chat_optimized_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/chat-optimized.ts"
import { onRequestPost as __api_chat_optimized_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/chat-optimized.ts"
import { onRequestGet as __api_quota_status_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/quota-status.ts"
import { onRequestGet as __api_suggestions_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/suggestions.ts"
import { onRequestOptions as __api_suggestions_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/suggestions.ts"
import { onRequestPost as __api_suggestions_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/suggestions.ts"
import { onRequestPost as __webhook_feishu_js_onRequestPost } from "/home/lium/chatsvtr/functions/webhook/feishu.js"
import { onRequestPost as __scheduled_sync_ts_onRequestPost } from "/home/lium/chatsvtr/functions/scheduled-sync.ts"
import { onRequest as ___middleware_ts_onRequest } from "/home/lium/chatsvtr/functions/_middleware.ts"

export const routes = [
    {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_chat_ts_onRequestOptions],
    },
  {
      routePath: "/api/chat",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_ts_onRequestPost],
    },
  {
      routePath: "/api/chat-optimized",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_chat_optimized_ts_onRequestOptions],
    },
  {
      routePath: "/api/chat-optimized",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_optimized_ts_onRequestPost],
    },
  {
      routePath: "/api/quota-status",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_quota_status_ts_onRequestGet],
    },
  {
      routePath: "/api/suggestions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_suggestions_ts_onRequestGet],
    },
  {
      routePath: "/api/suggestions",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_suggestions_ts_onRequestOptions],
    },
  {
      routePath: "/api/suggestions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_suggestions_ts_onRequestPost],
    },
  {
      routePath: "/webhook/feishu",
      mountPath: "/webhook",
      method: "POST",
      middlewares: [],
      modules: [__webhook_feishu_js_onRequestPost],
    },
  {
      routePath: "/scheduled-sync",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__scheduled_sync_ts_onRequestPost],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_ts_onRequest],
      modules: [],
    },
  ]