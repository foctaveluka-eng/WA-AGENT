import { pgTable, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";

/**
 * Stores Baileys WhatsApp auth state keys in PostgreSQL.
 * Replaces /tmp/wa-sessions filesystem storage so sessions
 * survive Render restarts/deploys.
 *
 * key_name values:
 *   "creds"         → AuthenticationCreds JSON
 *   "{type}:{id}"   → Signal protocol keys (pre-keys, sender-keys, app-state…)
 */
export const whatsappSessionsTable = pgTable(
  "whatsapp_sessions",
  {
    agentId:   integer("agent_id").notNull(),
    keyName:   text("key_name").notNull(),
    keyData:   text("key_data").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.keyName] })],
);
