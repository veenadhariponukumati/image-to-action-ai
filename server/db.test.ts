import { describe, expect, it } from "vitest";
import {
  createPasswordResetToken,
  createUser,
  resetPasswordWithToken,
  saveExtraction,
  setTaskCompleted,
  verifyUserPassword,
} from "./db";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe("setTaskCompleted ownership check", () => {
  it("rejects toggling a task that belongs to a different user's extraction", async () => {
    const ownerEmail = uniqueEmail("owner");
    const intruderEmail = uniqueEmail("intruder");

    const owner = await createUser({ email: ownerEmail, password: "password123" });
    const intruder = await createUser({ email: intruderEmail, password: "password123" });
    if (!owner || !intruder) throw new Error("Database not available for this test");

    const extraction = await saveExtraction(owner.id, {
      summary: "Owner's extraction",
      extractedText: "",
      reminders: [],
      calendarEvents: [],
      tasks: [{ text: "Owner's task", priority: "medium" }],
    });
    const task = extraction.tasks[0];
    if (!task?.id) throw new Error("Expected a persisted task id");

    await expect(setTaskCompleted(task.id, true, intruder.id)).rejects.toThrow(/not found/i);

    // The owner themselves can still toggle it.
    await expect(setTaskCompleted(task.id, true, owner.id)).resolves.toBeUndefined();
  });
});

describe("password reset tokens", () => {
  it("resets the password with a valid token and the token can't be reused", async () => {
    const email = uniqueEmail("reset");
    const user = await createUser({ email, password: "original-password" });
    if (!user) throw new Error("Database not available for this test");

    const token = await createPasswordResetToken(user.id);

    const firstUse = await resetPasswordWithToken(token, "new-password-123");
    expect(firstUse).toBe(true);

    const loggedInWithNewPassword = await verifyUserPassword(email, "new-password-123");
    expect(loggedInWithNewPassword).not.toBeNull();

    const secondUse = await resetPasswordWithToken(token, "another-password-456");
    expect(secondUse).toBe(false);
  });

  it("rejects a made-up token", async () => {
    const result = await resetPasswordWithToken("not-a-real-token", "whatever-password");
    expect(result).toBe(false);
  });
});
