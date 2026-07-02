import { Router } from "express";
import { db } from "@workspace/db";
import { notificationSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const toJson = (n: typeof notificationSettingsTable.$inferSelect) => ({
  ...n,
  createdAt: n.createdAt.toISOString(),
  updatedAt: n.updatedAt.toISOString(),
});

router.get("/", async (req, res) => {
  const userId = (req.session as { userId?: number }).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  let [settings] = await db.select().from(notificationSettingsTable).where(eq(notificationSettingsTable.userId, userId));
  if (!settings) {
    const [created] = await db.insert(notificationSettingsTable).values({ userId }).returning();
    settings = created;
  }
  return res.json(toJson(settings));
});

router.patch("/", async (req, res) => {
  const userId = (req.session as { userId?: number }).userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const {
    email, frequency,
    newLead, newConversation, agentError, orderPlaced,
    weeklyReport, dailyDigest, handoffRequest, lowCredits,
    whatsappDisconnected, newOrder,
  } = req.body as Partial<typeof notificationSettingsTable.$inferSelect>;

  const [existing] = await db.select().from(notificationSettingsTable).where(eq(notificationSettingsTable.userId, userId));

  if (!existing) {
    const [created] = await db.insert(notificationSettingsTable)
      .values({ userId, email, frequency: frequency || "instant", newLead: newLead ?? true, newConversation: newConversation ?? true, agentError: agentError ?? true, orderPlaced: orderPlaced ?? false, weeklyReport: weeklyReport ?? true, dailyDigest: dailyDigest ?? false, handoffRequest: handoffRequest ?? true, lowCredits: lowCredits ?? true, whatsappDisconnected: whatsappDisconnected ?? true, newOrder: newOrder ?? false })
      .returning();
    return res.json(toJson(created));
  }

  const [updated] = await db.update(notificationSettingsTable)
    .set({
      ...(email !== undefined && { email }),
      ...(frequency !== undefined && { frequency }),
      ...(newLead !== undefined && { newLead }),
      ...(newConversation !== undefined && { newConversation }),
      ...(agentError !== undefined && { agentError }),
      ...(orderPlaced !== undefined && { orderPlaced }),
      ...(weeklyReport !== undefined && { weeklyReport }),
      ...(dailyDigest !== undefined && { dailyDigest }),
      ...(handoffRequest !== undefined && { handoffRequest }),
      ...(lowCredits !== undefined && { lowCredits }),
      ...(whatsappDisconnected !== undefined && { whatsappDisconnected }),
      ...(newOrder !== undefined && { newOrder }),
      updatedAt: new Date(),
    })
    .where(eq(notificationSettingsTable.userId, userId))
    .returning();
  return res.json(toJson(updated));
});

export default router;
