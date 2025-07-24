import { onRequestOptions as __api_chat_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/chat.ts"
import { onRequestPost as __api_chat_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/chat.ts"
import { onRequestOptions as __api_chat_enhanced_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/chat-enhanced.ts"
import { onRequestPost as __api_chat_enhanced_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/chat-enhanced.ts"
import { onRequestGet as __api_quota_status_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/quota-status.ts"

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
      routePath: "/api/chat-enhanced",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_chat_enhanced_ts_onRequestOptions],
    },
  {
      routePath: "/api/chat-enhanced",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_chat_enhanced_ts_onRequestPost],
    },
  {
      routePath: "/api/quota-status",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_quota_status_ts_onRequestGet],
    },
  ]