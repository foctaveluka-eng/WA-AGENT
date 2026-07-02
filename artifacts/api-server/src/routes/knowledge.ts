import { Router } from "express";
import { db } from "@workspace/db";
import { knowledgeDocsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router({ mergeParams: true });

router.get("/", async (req, res) => {
  const agentId = Number((req.params as { agentId: string }).agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });
  const docs = await db.select().from(knowledgeDocsTable).where(eq(knowledgeDocsTable.agentId, agentId));
  return res.json(docs.map(d => ({ ...d, createdAt: d.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const agentId = Number((req.params as { agentId: string }).agentId);
  if (isNaN(agentId)) return res.status(400).json({ error: "Invalid agentId" });
  const { name, type, size, content } = req.body as { name: string; type: string; size: number; content?: string };
  if (!name || !type || !size) return res.status(400).json({ error: "Missing required fields" });
  const [doc] = await db.insert(knowledgeDocsTable).values({ agentId, name, type, size, content }).returning();
  return res.status(201).json({ ...doc, createdAt: doc.createdAt.toISOString() });
});

router.delete("/:docId", async (req, res) => {
  const agentId = Number((req.params as { agentId: string; docId: string }).agentId);
  const docId = Number((req.params as { agentId: string; docId: string }).docId);
  if (isNaN(agentId) || isNaN(docId)) return res.status(400).json({ error: "Invalid params" });
  await db.delete(knowledgeDocsTable).where(and(eq(knowledgeDocsTable.id, docId), eq(knowledgeDocsTable.agentId, agentId)));
  return res.status(204).send();
});

export default router;
