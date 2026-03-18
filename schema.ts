import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Job listings table for storing product management jobs in mental health industry
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Job identifiers
  externalId: varchar("externalId", { length: 255 }).unique(), // ID from external API
  
  // Basic info
  title: varchar("title", { length: 500 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  locationType: varchar("locationType", { length: 100 }),
  
  // Posting details
  posted: timestamp("posted"),
  postedAgo: varchar("postedAgo", { length: 100 }),
  
  // Salary
  salaryMin: bigint("salaryMin", { mode: "number" }),
  salaryMax: bigint("salaryMax", { mode: "number" }),
  salaryCurrency: varchar("salaryCurrency", { length: 10 }).default("USD"),
  salaryPeriod: varchar("salaryPeriod", { length: 50 }).default("year"),
  
  // Classification
  industry: varchar("industry", { length: 255 }),
  category: varchar("category", { length: 255 }),
  employmentType: varchar("employmentType", { length: 100 }),
  experienceLevel: varchar("experienceLevel", { length: 100 }),
  experienceYears: varchar("experienceYears", { length: 50 }),
  
  // Details (stored as JSON)
  description: text("description"),
  keyResponsibilities: json("keyResponsibilities").$type<string[]>(),
  requirements: json("requirements").$type<string[]>(),
  benefits: json("benefits").$type<string[]>(),
  
  // Source
  url: text("url").notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = archived
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;