import type { Request, Response } from "express";
import type { InferSelectModel } from "drizzle-orm";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { users } from "../../drizzle/schema";
import { getSessionUser } from "./session";

export type SessionUser = InferSelectModel<typeof users>;

export interface TrpcContext {
  user: SessionUser | null;
  req: Request;
  res: Response;
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TrpcContext> {
  const user = await getSessionUser(req);
  return { user, req, res };
}
