import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the correct password against its own hash", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(verifyPassword("wrong password", hash)).toBe(false);
  });

  it("produces a different hash (different salt) for the same password each time", () => {
    const hashA = hashPassword("same password");
    const hashB = hashPassword("same password");
    expect(hashA).not.toBe(hashB);
    expect(verifyPassword("same password", hashA)).toBe(true);
    expect(verifyPassword("same password", hashB)).toBe(true);
  });

  it("rejects malformed stored hashes instead of throwing", () => {
    expect(verifyPassword("anything", "not-a-valid-hash")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});
