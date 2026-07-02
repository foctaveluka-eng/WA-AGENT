import { Router, Request } from "express";
import { db } from "@workspace/db";
import { webhooksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

type Sess = { userId?: number };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

const toJson = (w: typeof webhooksTable.$inferSelect) => ({
  ...w,
  events: JSON.parse(w.events || "[]") as string[],
  createdAt: w.createdAt.toISOString(),
  lastPingedAt: w.lastPingedAt?.toISOString() ?? null,
});

router.get("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const items = await db.select().from(webhooksTable)
    .where(eq(webhooksTable.userId, userId))
    .orderBy(webhooksTable.createdAt);
  return res.json(items.map(toJson));
});

router.post("/", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const { url, events } = req.body as { url: string; events: string[] };
  if (!url) return res.status(400).json({ error: "url required" });
  const secret = "whsec_" + crypto.randomBytes(16).toString("hex");
  const [item] = await db.insert(webhooksTable).values({
    userId,
    url,
    events: JSON.stringify(events || []),
    active: true,
    secret,
    lastStatus: "pending",
  }).returning();
  return res.status(201).json(toJson(item));
});

router.patch("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "invalid id" });
  const { url, events, active } = req.body as { url?: string; events?: string[]; active?: boolean };
  const [item] = await db.update(webhooksTable)
    .set({
      ...(url && { url }),
      ...(events && { events: JSON.stringify(events) }),
      ...(active !== undefined && { active }),
    })
    .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)))
    .returning();
  if (!item) return res.status(404).json({ error: "not found" });
  return res.json(toJson(item));
});

router.post("/:id/ping", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "invalid id" });
  const [wh] = await db.select().from(webhooksTable)
    .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)));
  if (!wh) return res.status(404).json({ error: "not found" });

  const payload = { event: "ping", timestamp: new Date().toISOString(), webhookId: id };
  let status: "success" | "error" = "error";
  try {
    const signature = crypto.createHmac("sha256", wh.secret).update(JSON.stringify(payload)).digest("hex");
    const response = await fetch(wh.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Signature": `sha256=${signature}`, "X-Webhook-Event": "ping" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    status = response.ok ? "success" : "error";
  } catch { /* network error */ }

  const [updated] = await db.update(webhooksTable)
    .set({ lastStatus: status, lastPingedAt: new Date() })
    .where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)))
    .returning();
  return res.json({ success: status === "success", webhook: toJson(updated) });
});

router.delete("/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "invalid id" });
  await db.delete(webhooksTable).where(and(eq(webhooksTable.id, id), eq(webhooksTable.userId, userId)));
  return res.status(204).send();
});

export default router;
