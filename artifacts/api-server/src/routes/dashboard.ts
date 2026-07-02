import { Router, Request } from "express";
import { db } from "@workspace/db";
import { agentsTable, leadsTable, conversationsTable, ordersTable } from "@workspace/db";
import { sql, gt, eq, inArray, and } from "drizzle-orm";

type Sess = { userId?: number };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

router.get("/stats", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });

  const [agentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(agentsTable).where(eq(agentsTable.userId, userId));
  const [recentAgent] = await db.select({ name: agentsTable.name })
    .from(agentsTable)
    .where(eq(agentsTable.userId, userId))
    .orderBy(agentsTable.createdAt)
    .limit(1);

  const [totalLeads] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(eq(leadsTable.userId, userId));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const [leadsLast7] = await db.select({ count: sql<number>`count(*)::int` })
    .from(leadsTable)
    .where(and(eq(leadsTable.userId, userId), gt(leadsTable.createdAt, sevenDaysAgo)));

  const userAgentRows = await db.select({ id: agentsTable.id }).from(agentsTable).where(eq(agentsTable.userId, userId));
  const agentIds = userAgentRows.map(r => r.id);

  const [totalConvos] = agentIds.length > 0
    ? await db.select({ count: sql<number>`count(*)::int` }).from(conversationsTable).where(inArray(conversationsTable.agentId, agentIds))
    : [{ count: 0 }];

  const [totalOrders] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.userId, userId));

  return res.json({
    totalAgents: agentCount.count,
    recentAgent: recentAgent?.name ?? null,
    totalLeads: totalLeads.count,
    leadsLast7Days: leadsLast7.count,
    totalConversations: totalConvos.count,
    totalOrders: totalOrders.count,
  });
});

router.get("/leads-chart", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const chart = await Promise.all(days.map(async (day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(leadsTable)
      .where(and(eq(leadsTable.userId, userId), sql`${leadsTable.createdAt} >= ${day} AND ${leadsTable.createdAt} < ${next}`));
    return {
      date: day.toLocaleDateString("fr-FR", { month: "short", day: "numeric" }),
      leads: result.count,
    };
  }));

  return res.json(chart);
});

export default router;
