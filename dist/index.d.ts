/**
 * Cloudflare Workers API for SVTR.AI Chat
 * 硅谷科技评论 AI创投专业聊天服务
 */
export interface Env {
    AI: any;
    AI_GATEWAY_API_TOKEN?: string;
}
declare const _default: {
    fetch(request: Request, env: Env): Promise<Response>;
};
export default _default;
//# sourceMappingURL=index.d.ts.map