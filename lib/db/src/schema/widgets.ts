import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const widgetsTable = pgTable("widgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  welcomeText: text("welcome_text").notNull(),
  buttonColor: text("button_color").notNull().default("#25D366"),
  buttonText: text("button_text"),
  position: text("position").notNull().default("bottom-right"),
  isActive: boolean("is_active").notNull().default(true),
  embedCode: text("embed_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWidgetSchema = createInsertSchema(widgetsTable).omit({ id: true, createdAt: true });
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type Widget = typeof widgetsTable.$inferSelect;
