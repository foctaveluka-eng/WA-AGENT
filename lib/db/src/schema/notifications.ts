import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationSettingsTable = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  email: text("email"),
  frequency: text("frequency").notNull().default("instant"),
  newLead: boolean("new_lead").notNull().default(true),
  newConversation: boolean("new_conversation").notNull().default(true),
  agentError: boolean("agent_error").notNull().default(true),
  orderPlaced: boolean("order_placed").notNull().default(false),
  weeklyReport: boolean("weekly_report").notNull().default(true),
  dailyDigest: boolean("daily_digest").notNull().default(false),
  handoffRequest: boolean("handoff_request").notNull().default(true),
  lowCredits: boolean("low_credits").notNull().default(true),
  whatsappDisconnected: boolean("whatsapp_disconnected").notNull().default(true),
  newOrder: boolean("new_order").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettingsTable.$inferSelect;
