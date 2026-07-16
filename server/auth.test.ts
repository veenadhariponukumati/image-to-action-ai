import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./_core/app";

const app = createApp();

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe("POST /api/auth/signup", () => {
  it("creates a new account and sets a session cookie", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: uniqueEmail("signup"), password: "password123", name: "Test User" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a duplicate email", async () => {
    const email = uniqueEmail("dup");
    await request(app).post("/api/auth/signup").send({ email, password: "password123" });
    const res = await request(app).post("/api/auth/signup").send({ email, password: "password456" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ email: uniqueEmail("short"), password: "short" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    const email = uniqueEmail("login");
    await request(app).post("/api/auth/signup").send({ email, password: "password123" });

    const res = await request(app).post("/api/auth/login").send({ email, password: "password123" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects the wrong password", async () => {
    const email = uniqueEmail("wrongpw");
    await request(app).post("/api/auth/signup").send({ email, password: "password123" });

    const res = await request(app).post("/api/auth/login").send({ email, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  it("rejects a nonexistent account", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: uniqueEmail("nonexistent"), password: "password123" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("returns the same generic response for existing and nonexistent emails", async () => {
    const existingEmail = uniqueEmail("forgot-exists");
    await request(app).post("/api/auth/signup").send({ email: existingEmail, password: "password123" });

    const resExisting = await request(app).post("/api/auth/forgot-password").send({ email: existingEmail });
    const resMissing = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: uniqueEmail("forgot-missing") });

    expect(resExisting.status).toBe(200);
    expect(resMissing.status).toBe(200);
    expect(resExisting.body.message).toBe(resMissing.body.message);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("rejects a made-up token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "not-a-real-token", password: "newpassword123" });

    expect(res.status).toBe(400);
  });

  it("rejects a new password under 8 characters", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "irrelevant", password: "short" });

    expect(res.status).toBe(400);
  });
});
