import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const profileTable = pgTable("profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  plan: text("plan").notNull().default("Free"),
  creditsUsed: integer("credits_used").notNull().default(0),
  creditsTotal: integer("credits_total").notNull().default(100),
  activeAgents: integer("active_agents").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const organizationTable = pgTable("organization", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("Free"),
  memberCount: integer("member_count").notNull().default(1),
  customDomain: text("custom_domain"),
});

export const orgMembersTable = pgTable("org_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  keyPreview: text("key_preview").notNull(),
  fullKey: text("full_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profileTable).omit({ id: true, createdAt: true });
export const insertOrgMemberSchema = createInsertSchema(orgMembersTable).omit({ id: true, joinedAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeysTable).omit({ id: true, createdAt: true });

export type Profile = typeof profileTable.$inferSelect;
export type Organization = typeof organizationTable.$inferSelect;
export type OrgMember = typeof orgMembersTable.$inferSelect;
export type ApiKey = typeof apiKeysTable.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type InsertOrgMember = z.infer<typeof insertOrgMemberSchema>;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
