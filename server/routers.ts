import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { listExtractions, setTaskCompleted } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  extractions: router({
    list: protectedProcedure.query(({ ctx }) => listExtractions(ctx.user.id)),
    toggleTask: protectedProcedure
      .input(z.object({ taskId: z.number(), completed: z.boolean() }))
      .mutation(({ input, ctx }) => setTaskCompleted(input.taskId, input.completed, ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
