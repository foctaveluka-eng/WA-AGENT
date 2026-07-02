import { Router } from "express";
import { db } from "@workspace/db";
import { agentProductsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router({ mergeParams: true });

// GET /agents/:agentId/products — get products assigned to an agent
router.get("/", async (req, res) => {
  const agentId = Number((req.params as { agentId?: string }).agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const rows = await db
    .select({ product: productsTable })
    .from(agentProductsTable)
    .innerJoin(productsTable, eq(agentProductsTable.productId, productsTable.id))
    .where(eq(agentProductsTable.agentId, agentId));

  return res.json(rows.map(r => ({
    ...r.product,
    price: Number(r.product.price),
    createdAt: r.product.createdAt.toISOString(),
  })));
});

// PUT /agents/:agentId/products — set agent's products (full replace)
router.put("/", async (req, res) => {
  const agentId = Number((req.params as { agentId?: string }).agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });

  const { productIds } = req.body as { productIds: number[] };
  if (!Array.isArray(productIds)) return res.status(400).json({ error: "productIds must be an array" });

  await db.delete(agentProductsTable).where(eq(agentProductsTable.agentId, agentId));

  if (productIds.length > 0) {
    await db.insert(agentProductsTable).values(
      productIds.map(productId => ({ agentId, productId }))
    );
  }

  return res.json({ agentId, productIds });
});

export default router;
