import { onRequestGet as __api_auth_github_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/auth/github.ts"
import { onRequestOptions as __api_auth_github_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/auth/github.ts"
import { onRequestGet as __api_auth_google_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/auth/google.ts"
import { onRequestOptions as __api_auth_google_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/auth/google.ts"
import { onRequestGet as __api_auth_linkedin_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/auth/linkedin.ts"
import { onRequestOptions as __api_auth_linkedin_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/auth/linkedin.ts"
import { onRequestGet as __api_auth_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/auth.ts"
import { onRequestOptions as __api_auth_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/auth.ts"
import { onRequestPost as __api_auth_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/auth.ts"
import { onRequestOptions as __api_chat_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/chat.ts"
import { onRequestPost as __api_chat_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/chat.ts"
import { onRequestOptions as __api_chat_optimized_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/chat-optimized.ts"
import { onRequestPost as __api_chat_optimized_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/chat-optimized.ts"
import { onRequestGet as __api_feishu_webhook_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/feishu-webhook.ts"
import { onRequestPost as __api_feishu_webhook_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/feishu-webhook.ts"
import { onRequestGet as __api_projects_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/projects.ts"
import { onRequestOptions as __api_projects_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/projects.ts"
import { onRequestPost as __api_projects_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/projects.ts"
import { onRequestPut as __api_projects_ts_onRequestPut } from "/home/lium/chatsvtr/functions/api/projects.ts"
import { onRequestGet as __api_quota_status_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/quota-status.ts"
import { onRequestDelete as __api_subscribe_ts_onRequestDelete } from "/home/lium/chatsvtr/functions/api/subscribe.ts"
import { onRequestGet as __api_subscribe_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/subscribe.ts"
import { onRequestOptions as __api_subscribe_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/subscribe.ts"
import { onRequestPost as __api_subscribe_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/subscribe.ts"
import { onRequestGet as __api_suggestions_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/suggestions.ts"
import { onRequestOptions as __api_suggestions_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/suggestions.ts"
import { onRequestPost as __api_suggestions_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/suggestions.ts"
import { onRequestGet as __api_users_ts_onRequestGet } from "/home/lium/chatsvtr/functions/api/users.ts"
import { onRequestOptions as __api_users_ts_onRequestOptions } from "/home/lium/chatsvtr/functions/api/users.ts"
import { onRequestPost as __api_users_ts_onRequestPost } from "/home/lium/chatsvtr/functions/api/users.ts"
import { onRequestPost as __webhook_feishu_js_onRequestPost } from "/home/lium/chatsvtr/functions/webhook/feishu.js"
import { onRequestPost as __scheduled_sync_ts_onRequestPost } from "/home/lium/chatsvtr/functions/scheduled-sync.ts"
import { onRequest as ___middleware_ts_onRequest } from "/home/lium/chatsvtr/functions/_middleware.ts"

export const routes = [
    {
      routePath: "/api/auth/github",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_github_ts_onRequestGet],
    },
  {
      routePath: "/api/auth/github",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_github_ts_onRequestOptions],
    },
  {
      routePath: "/api/auth/google",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_google_ts_onRequestGet],
    },
  {
      routePath: "/api/auth/google",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_google_ts_onRequestOptions],
    },
  {
      routePath: "/api/auth/linkedin",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_linkedin_ts_onRequestGet],
    },
  {
      routePath: "/api/auth/linkedin",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_linkedin_ts_onRequestOptions],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_ts_onRequestGet],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_ts_onRequestOptions],
    },
  {
      routePath: "/api/auth",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_ts_onRequestPost],
    },
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
      routePath: "/api/feishu-webhook",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_feishu_webhook_ts_onRequestGet],
    },
  {
      routePath: "/api/feishu-webhook",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_feishu_webhook_ts_onRequestPost],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_projects_ts_onRequestGet],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_projects_ts_onRequestOptions],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_projects_ts_onRequestPost],
    },
  {
      routePath: "/api/projects",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api_projects_ts_onRequestPut],
    },
  {
      routePath: "/api/quota-status",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_quota_status_ts_onRequestGet],
    },
  {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_subscribe_ts_onRequestDelete],
    },
  {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_subscribe_ts_onRequestGet],
    },
  {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_subscribe_ts_onRequestOptions],
    },
  {
      routePath: "/api/subscribe",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_subscribe_ts_onRequestPost],
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
      routePath: "/api/users",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_users_ts_onRequestGet],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_users_ts_onRequestOptions],
    },
  {
      routePath: "/api/users",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_users_ts_onRequestPost],
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