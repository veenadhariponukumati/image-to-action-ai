import { publicProcedure, router } from "./trpc";

export const systemRouter = router({
  ping: publicProcedure.query(() => "ok" as const),
});
