import type { Request } from "express";
import { ONE_YEAR_MS } from "@shared/const";

export function getSessionCookieOptions(req: Request) {
  const isHttps = req.protocol === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: ONE_YEAR_MS,
  };
}
