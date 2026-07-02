import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { agentsTable } from "./agents";
import { productsTable } from "./products";

export const agentProductsTable = pgTable("agent_products", {
  agentId: integer("agent_id").notNull().references(() => agentsTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.agentId, t.productId] }),
}));

export type AgentProduct = typeof agentProductsTable.$inferSelect;
