import { Router, Request } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, agentsTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { waManager } from "../services/whatsapp";

type Sess = { userId?: number };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

async function getUserAgentIds(userId: number): Promise<number[]> {
  const rows = await db.select({ id: agentsTable.id }).from(agentsTable).where(eq(agentsTable.userId, userId));
  return rows.map(r => r.id);
}

function convToJson(c: typeof conversationsTable.$inferSelect) {
  return {
    id: c.id,
    agentId: c.agentId,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    mode: c.mode,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    agentName: c.agentName,
    messageCount: c.messageCount,
    conversationSummary: c.conversationSummary ?? null,
  };
}

router.get("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const agentIds = await getUserAgentIds(userId);
  if (agentIds.length === 0) return res.json([]);
  const convos = await db.select().from(conversationsTable)
    .where(inArray(conversationsTable.agentId, agentIds))
    .orderBy(conversationsTable.lastMessageAt);
  return res.json(convos.map(convToJson));
});

router.get("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const agentIds = await getUserAgentIds(userId);
  const [convo] = await db.select().from(conversationsTable)
    .where(agentIds.length > 0
      ? and(eq(conversationsTable.id, id), inArray(conversationsTable.agentId, agentIds))
      : eq(conversationsTable.id, id));
  if (!convo) return res.status(404).json({ error: "Not found" });
  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  return res.json({
    id: convo.id,
    agentId: convo.agentId,
    contactName: convo.contactName,
    contactPhone: convo.contactPhone,
    mode: convo.mode,
    agentName: convo.agentName,
    conversationSummary: convo.conversationSummary ?? null,
    messages: messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
  });
});

router.patch("/:id/summary", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { conversationSummary } = req.body as { conversationSummary: string };
  const [convo] = await db.update(conversationsTable)
    .set({ conversationSummary: conversationSummary ?? null })
    .where(eq(conversationsTable.id, id))
    .returning();
  if (!convo) return res.status(404).json({ error: "Not found" });
  return res.json(convToJson(convo));
});

router.patch("/:id/mode", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { mode } = req.body as { mode: string };
  if (!mode) return res.status(400).json({ error: "mode required" });
  const [convo] = await db.update(conversationsTable).set({ mode }).where(eq(conversationsTable.id, id)).returning();
  if (!convo) return res.status(404).json({ error: "Not found" });

  // Notify admin when human takes over
  if (mode === "manual" && convo.agentId) {
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, convo.agentId));
    const notifPhone = agent?.notificationPhone?.trim();
    if (notifPhone) {
      const msg =
        `🙋 *Prise en main humaine*\n` +
        `👤 Contact : ${convo.contactName || convo.contactPhone}\n` +
        `📱 Tél : ${convo.contactPhone}\n` +
        `🤖 Agent : ${agent.personaName || agent.name}\n` +
        `ℹ️ L'IA est désactivée sur cette conversation.`;
      waManager.sendMessageToJid(convo.agentId, `${notifPhone.replace(/\D/g, "")}@s.whatsapp.net`, msg).catch(() => {});
    }
  }

  return res.json(convToJson(convo));
});

router.post("/:id/messages", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { content } = req.body as { content: string };
  if (!content) return res.status(400).json({ error: "content required" });
  const [message] = await db.insert(messagesTable).values({ conversationId: id, role: "user", content }).returning();
  await db.update(conversationsTable).set({ lastMessage: content, lastMessageAt: new Date() }).where(eq(conversationsTable.id, id));
  return res.status(201).json({ ...message, createdAt: message.createdAt.toISOString() });
});

router.post("/:id/send", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { content } = req.body as { content?: string };
  if (!content?.trim()) return res.status(400).json({ error: "content required" });

  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!convo) return res.status(404).json({ error: "Not found" });

  const updates: Partial<typeof conversationsTable.$inferInsert> = {
    lastMessage: content,
    lastMessageAt: new Date(),
    messageCount: (convo.messageCount ?? 0) + 1,
  };

  if (convo.agentId) {
    const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, convo.agentId));
    if (agent?.autoHandoff) {
      updates.mode = "manual";
    }
  }

  await db.update(conversationsTable).set(updates).where(eq(conversationsTable.id, id));

  const [message] = await db.insert(messagesTable).values({
    conversationId: id,
    role: "human",
    content,
  }).returning();

  if (convo.jid && convo.agentId) {
    const sent = await waManager.sendMessageToJid(convo.agentId, convo.jid, content);
    if (!sent) {
      console.warn(`[Conversations] Could not send via WhatsApp for conv ${id}`);
    }
  }

  return res.status(201).json({ ...message, createdAt: message.createdAt.toISOString() });
});

export default router;
