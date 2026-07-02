import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const knowledgeDocsTable = pgTable("knowledge_docs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertKnowledgeDocSchema = createInsertSchema(knowledgeDocsTable).omit({ id: true, createdAt: true });
export type InsertKnowledgeDoc = z.infer<typeof insertKnowledgeDocSchema>;
export type KnowledgeDoc = typeof knowledgeDocsTable.$inferSelect;
