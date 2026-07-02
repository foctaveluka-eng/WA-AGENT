import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  url: text("url").notNull(),
  events: text("events").notNull().default("[]"),
  active: boolean("active").notNull().default(true),
  secret: text("secret").notNull(),
  lastStatus: text("last_status").default("pending"),
  lastPingedAt: timestamp("last_pinged_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWebhookSchema = createInsertSchema(webhooksTable).omit({ id: true, createdAt: true, lastPingedAt: true });
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooksTable.$inferSelect;
