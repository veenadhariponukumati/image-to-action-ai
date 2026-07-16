import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookie } from "cookie";
import type { Request } from "express";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import { getUserByOpenId } from "../db";
import type { SessionUser } from "./context";

function getSecretKey() {
  if (!ENV.jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(ENV.jwtSecret);
}

export async function createSessionToken(openId: string): Promise<string> {
  return new SignJWT({ openId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecretKey());
}

export async function getSessionUser(req: Request): Promise<SessionUser | null> {
  const cookies = parseCookie(req.headers.cookie ?? "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.openId !== "string") return null;
    const user = await getUserByOpenId(payload.openId);
    return user ?? null;
  } catch {
    return null;
  }
}
