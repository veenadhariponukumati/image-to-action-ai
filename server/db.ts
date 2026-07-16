import { createHash, randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  extractions,
  passwordResetTokens,
  tasks as tasksTable,
  users,
  type ExtractionCalendarEvent,
  type ExtractionReminder,
} from "../drizzle/schema";
import { hashPassword, verifyPassword } from "./_core/password";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(input: { email: string; password: string; name?: string | null }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const openId = input.email.toLowerCase();
  const existing = await getUserByOpenId(openId);
  if (existing) {
    throw new Error("An account with that email already exists");
  }

  await db.insert(users).values({
    openId,
    email: input.email,
    name: input.name ?? null,
    loginMethod: "email",
    passwordHash: hashPassword(input.password),
    lastSignedIn: new Date(),
  });

  return getUserByOpenId(openId);
}

export async function verifyUserPassword(email: string, password: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const user = await getUserByOpenId(email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  return user;
}

// Returns the raw token to email to the user (only its hash is stored).
export async function createPasswordResetToken(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const rawToken = randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  return rawToken;
}

// Returns true if the token was valid and the password was updated.
export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tokenHash = hashResetToken(rawToken);
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return false;
  }

  await db.update(users).set({ passwordHash: hashPassword(newPassword) }).where(eq(users.id, record.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, record.id));

  return true;
}

export type ExtractionInput = {
  summary: string;
  extractedText: string;
  reminders: ExtractionReminder[];
  calendarEvents: ExtractionCalendarEvent[];
  tasks: { text: string; priority: "high" | "medium" | "low" }[];
};

// Persists an extraction + its tasks. Falls back to an unpersisted in-memory
// shape (null id) when no DATABASE_URL is configured, so the feature still
// works end-to-end without a DB — it just won't survive a page reload.
export async function saveExtraction(userId: number, input: ExtractionInput) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot save extraction: database not available");
    return {
      id: null as number | null,
      summary: input.summary,
      extractedText: input.extractedText,
      reminders: input.reminders,
      calendarEvents: input.calendarEvents,
      createdAt: new Date(),
      tasks: input.tasks.map(t => ({ id: null as number | null, extractionId: null, completed: false, ...t })),
    };
  }

  const [insertResult] = await db
    .insert(extractions)
    .values({
      userId,
      summary: input.summary,
      extractedText: input.extractedText,
      reminders: input.reminders,
      calendarEvents: input.calendarEvents,
    })
    .returning({ id: extractions.id });
  const extractionId = insertResult.id;

  if (input.tasks.length > 0) {
    await db.insert(tasksTable).values(
      input.tasks.map(t => ({ extractionId, text: t.text, priority: t.priority }))
    );
  }

  const savedTasks = await db.select().from(tasksTable).where(eq(tasksTable.extractionId, extractionId));
  const [saved] = await db.select().from(extractions).where(eq(extractions.id, extractionId)).limit(1);

  return { ...saved, tasks: savedTasks };
}

export async function listExtractions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const allExtractions = await db
    .select()
    .from(extractions)
    .where(eq(extractions.userId, userId))
    .orderBy(desc(extractions.createdAt));
  const allTasks = await db.select().from(tasksTable);

  return allExtractions.map(extraction => ({
    ...extraction,
    tasks: allTasks.filter(t => t.extractionId === extraction.id),
  }));
}

export async function setTaskCompleted(taskId: number, completed: boolean, userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [owningExtraction] = await db
    .select({ id: extractions.id })
    .from(tasksTable)
    .innerJoin(extractions, eq(tasksTable.extractionId, extractions.id))
    .where(and(eq(tasksTable.id, taskId), eq(extractions.userId, userId)))
    .limit(1);

  if (!owningExtraction) {
    throw new Error("Task not found");
  }

  await db.update(tasksTable).set({ completed }).where(eq(tasksTable.id, taskId));
}
