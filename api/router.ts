import { createRouter, publicQuery } from "./middleware";
import { lookupRouter } from "./routers/lookup";
import { estimateRouter } from "./routers/estimate";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  lookup: lookupRouter,
  estimate: estimateRouter,
});

export type AppRouter = typeof appRouter;
