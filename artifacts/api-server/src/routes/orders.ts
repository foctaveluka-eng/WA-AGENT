import { Router, Request } from "express";
import { db } from "@workspace/db";
import { ordersTable } from "@workspace/db";
import { eq, sql, gt, and } from "drizzle-orm";
import { UpdateOrderParams, UpdateOrderBody } from "@workspace/api-zod";

type Sess = { userId?: number };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

router.get("/stats", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayOrders] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(and(eq(ordersTable.userId, userId), gt(ordersTable.createdAt, today)));
  const [totalRevenue] = await db.select({ sum: sql<number>`coalesce(sum(amount::numeric), 0)` }).from(ordersTable).where(eq(ordersTable.userId, userId));
  const [confirmedRevenue] = await db.select({ sum: sql<number>`coalesce(sum(amount::numeric), 0)` }).from(ordersTable).where(and(eq(ordersTable.userId, userId), eq(ordersTable.status, "confirmed")));
  const [pendingOrders] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(and(eq(ordersTable.userId, userId), eq(ordersTable.status, "pending")));
  return res.json({
    todayOrders: todayOrders.count,
    totalRevenue: Number(totalRevenue.sum),
    confirmedRevenue: Number(confirmedRevenue.sum),
    pendingOrders: pendingOrders.count,
  });
});

router.get("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(ordersTable.createdAt);
  return res.json(orders.map(o => ({ ...o, amount: Number(o.amount), createdAt: o.createdAt.toISOString() })));
});

router.patch("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const params = UpdateOrderParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [order] = await db.update(ordersTable).set({ status: parsed.data.status })
    .where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.userId, userId)))
    .returning();
  if (!order) return res.status(404).json({ error: "Not found" });
  return res.json({ ...order, amount: Number(order.amount), createdAt: order.createdAt.toISOString() });
});

export default router;
