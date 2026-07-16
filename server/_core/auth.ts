import type { Router, Request, Response } from "express";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { createSessionToken } from "./session";
import { sendPasswordResetEmail } from "./email";
import { createPasswordResetToken, createUser, getUserByOpenId, resetPasswordWithToken, verifyUserPassword } from "../db";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function registerAuthRoutes(app: Router) {
  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    try {
      const user = await createUser(parsed.data);
      if (!user) {
        res.status(500).json({ error: "Failed to create account" });
        return;
      }
      const token = await createSessionToken(user.openId);
      res.cookie(COOKIE_NAME, token, getSessionCookieOptions(req));
      res.json({ success: true });
    } catch (error: any) {
      res.status(409).json({ error: error?.message ?? "Failed to create account" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password" });
      return;
    }

    try {
      const user = await verifyUserPassword(parsed.data.email, parsed.data.password);
      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const token = await createSessionToken(user.openId);
      res.cookie(COOKIE_NAME, token, getSessionCookieOptions(req));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message ?? "Login failed" });
    }
  });

  app.post("/api/auth/forgot-password", authLimiter, async (req: Request, res: Response) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    // Always respond the same way whether or not the account exists, so this
    // endpoint can't be used to enumerate registered emails.
    const genericResponse = { success: true, message: "If an account exists for that email, a reset link has been sent." };

    try {
      const user = await getUserByOpenId(parsed.data.email.toLowerCase());
      if (user) {
        const token = await createPasswordResetToken(user.id);
        const resetUrl = `${ENV.appUrl}/reset-password?token=${token}`;
        await sendPasswordResetEmail(parsed.data.email, resetUrl);
      }
      res.json(genericResponse);
    } catch (error) {
      console.error("[Auth] forgot-password error:", error);
      res.json(genericResponse);
    }
  });

  app.post("/api/auth/reset-password", authLimiter, async (req: Request, res: Response) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    try {
      const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
      if (!ok) {
        res.status(400).json({ error: "This reset link is invalid or has expired" });
        return;
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message ?? "Failed to reset password" });
    }
  });
}
