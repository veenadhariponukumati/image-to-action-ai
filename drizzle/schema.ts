import { boolean, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 320 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").notNull().default("user"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type ExtractionReminder = { text: string; time: string };
export type ExtractionCalendarEvent = { title: string; date: string; time: string; duration: string };

export const extractions = pgTable("extractions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  summary: text("summary").notNull(),
  extractedText: text("extractedText").notNull(),
  reminders: jsonb("reminders").notNull().$type<ExtractionReminder[]>(),
  calendarEvents: jsonb("calendarEvents").notNull().$type<ExtractionCalendarEvent[]>(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type Extraction = typeof extractions.$inferSelect;
export type InsertExtraction = typeof extractions.$inferInsert;

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  extractionId: integer("extractionId").notNull(),
  text: varchar("text", { length: 500 }).notNull(),
  priority: priorityEnum("priority").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
