import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = pgTable("agents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  model: text("model").notNull().default("GPT-4o mini"),
  communicationStyle: text("communication_style").notNull().default("amical"),
  prompt: text("prompt").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  whatsappConnected: boolean("whatsapp_connected").notNull().default(false),
  whatsappPhone: text("whatsapp_phone"),
  timezone: text("timezone"),
  responseDelay: integer("response_delay").default(3),
  emojiReactions: boolean("emoji_reactions").notNull().default(false),
  emojiList: text("emoji_list"),
  language: text("language").default("fr"),
  greetingMessage: text("greeting_message"),
  fallbackMessage: text("fallback_message"),
  maxResponseLength: integer("max_response_length").default(500),
  personaName: text("persona_name"),
  workingHoursStart: text("working_hours_start").default("00:00"),
  workingHoursEnd: text("working_hours_end").default("23:59"),
  autoHandoff: boolean("auto_handoff").notNull().default(false),
  handoffMessage: text("handoff_message"),
  messageFrequencyLimit: integer("message_frequency_limit").default(60),
  resources: text("resources"),
  notificationPhone: text("notification_phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ id: true, createdAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
