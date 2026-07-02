import { Router, Request } from "express";
import { db } from "@workspace/db";
import { blacklistTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

type Sess = { userId?: number };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

const toJson = (b: typeof blacklistTable.$inferSelect) => ({
  ...b,
  createdAt: b.createdAt.toISOString(),
});

router.get("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const items = await db.select().from(blacklistTable)
    .where(eq(blacklistTable.userId, userId))
    .orderBy(blacklistTable.createdAt);
  return res.json(items.map(toJson));
});

router.post("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const { phone, reason } = req.body as { phone: string; reason?: string };
  if (!phone) return res.status(400).json({ error: "phone required" });
  try {
    const [item] = await db.insert(blacklistTable).values({
      userId,
      phone: phone.trim(),
      reason: reason || "Pas de raison spécifiée",
    }).returning();
    return res.status(201).json(toJson(item));
  } catch {
    return res.status(409).json({ error: "Ce numéro est déjà dans la liste noire" });
  }
});

router.post("/bulk", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const { phones, reason } = req.body as { phones: string[]; reason?: string };
  if (!phones?.length) return res.status(400).json({ error: "phones array required" });
  const results = [];
  for (const phone of phones) {
    try {
      const [item] = await db.insert(blacklistTable).values({
        userId,
        phone: phone.trim(),
        reason: reason || "Ajout en masse",
      }).returning();
      results.push(toJson(item));
    } catch { /* skip duplicates */ }
  }
  return res.status(201).json({ added: results.length, items: results });
});

router.delete("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "invalid id" });
  await db.delete(blacklistTable).where(and(eq(blacklistTable.id, id), eq(blacklistTable.userId, userId)));
  return res.status(204).send();
});

export default router;
