// <define:__ROUTES__>
var define_ROUTES_default = {
  version: 1,
  include: [
    "/*"
  ],
  exclude: [
    "/assets/*",
    "/images/*",
    "/docs/*",
    "/scripts/*",
    "/components/*",
    "/database/*",
    "/superdesign/*",
    "/claude-code-mcp/*",
    "/pages/*"
  ]
};

// node_modules/wrangler/templates/pages-dev-pipeline.ts
import worker from "/home/lium/chatsvtr/.wrangler/tmp/pages-qv7jGR/functionsWorker-0.29531778118147045.mjs";
import { isRoutingRuleMatch } from "/home/lium/chatsvtr/node_modules/wrangler/templates/pages-dev-util.ts";
export * from "/home/lium/chatsvtr/.wrangler/tmp/pages-qv7jGR/functionsWorker-0.29531778118147045.mjs";
var routes = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = worker;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  pages_dev_pipeline_default as default
};
//# sourceMappingURL=x179b3olkgs.js.map
