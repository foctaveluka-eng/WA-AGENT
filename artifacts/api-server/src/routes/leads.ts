import { Router, Request } from "express";
import { db } from "@workspace/db";
import { leadsTable } from "@workspace/db";
import { eq, sql, and } from "drizzle-orm";
import { CreateLeadBody, UpdateLeadParams, UpdateLeadBody, DeleteLeadParams } from "@workspace/api-zod";

type Sess = { userId?: number };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

router.get("/stats", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const [total] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(eq(leadsTable.userId, userId));
  const [newCount] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(and(eq(leadsTable.userId, userId), eq(leadsTable.status, "new")));
  const [qualified] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(and(eq(leadsTable.userId, userId), eq(leadsTable.status, "qualified")));
  const [converted] = await db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(and(eq(leadsTable.userId, userId), eq(leadsTable.status, "converted")));
  return res.json({ total: total.count, new: newCount.count, qualified: qualified.count, converted: converted.count });
});

router.get("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const leads = await db.select().from(leadsTable)
    .where(eq(leadsTable.userId, userId))
    .orderBy(leadsTable.createdAt);
  return res.json(leads.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

router.post("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const parsed = CreateLeadBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [lead] = await db.insert(leadsTable).values({
    userId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email,
    status: parsed.data.status,
    source: parsed.data.source,
    notes: parsed.data.notes,
  }).returning();
  return res.status(201).json({ ...lead, createdAt: lead.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const params = UpdateLeadParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  const parsed = UpdateLeadBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [lead] = await db.update(leadsTable).set({
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
    ...(parsed.data.email !== undefined && { email: parsed.data.email }),
    ...(parsed.data.status !== undefined && { status: parsed.data.status }),
    ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
  }).where(and(eq(leadsTable.id, params.data.id), eq(leadsTable.userId, userId))).returning();
  if (!lead) return res.status(404).json({ error: "Not found" });
  return res.json({ ...lead, createdAt: lead.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const params = DeleteLeadParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(leadsTable).where(and(eq(leadsTable.id, params.data.id), eq(leadsTable.userId, userId)));
  return res.status(204).send();
});

export default router;
