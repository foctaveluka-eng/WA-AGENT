import { Router, Request } from "express";
import { db } from "@workspace/db";
import { profileTable, organizationTable, orgMembersTable, apiKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UpdateProfileBody, UpdateOrganizationBody, InviteMemberBody, CreateApiKeyBody, DeleteApiKeyParams } from "@workspace/api-zod";
import crypto from "crypto";

type Sess = { userId?: number; userName?: string; userEmail?: string };
const uid = (req: Request): number => (req.session as Sess).userId!;

const router = Router();

router.get("/profile", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const sess = req.session as Sess;
  let [profile] = await db.select().from(profileTable).where(eq(profileTable.userId, userId));
  if (!profile) {
    [profile] = await db.insert(profileTable).values({
      userId,
      name: sess.userName || "Mon Compte",
      email: sess.userEmail || "",
      plan: "Free",
      creditsUsed: 0,
      creditsTotal: 100,
      activeAgents: 0,
    }).returning();
  }
  return res.json({ ...profile, createdAt: profile.createdAt.toISOString() });
});

router.patch("/profile", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  let [profile] = await db.select().from(profileTable).where(eq(profileTable.userId, userId));
  if (!profile) return res.status(404).json({ error: "Not found" });
  const [updated] = await db.update(profileTable).set({
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.email !== undefined && { email: parsed.data.email }),
  }).where(and(eq(profileTable.id, profile.id), eq(profileTable.userId, userId))).returning();
  return res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.get("/organization", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  let [org] = await db.select().from(organizationTable).where(eq(organizationTable.userId, userId));
  if (!org) {
    [org] = await db.insert(organizationTable).values({ userId, name: "Mon Organisation", plan: "Free", memberCount: 1 }).returning();
  }
  return res.json(org);
});

router.patch("/organization", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const parsed = UpdateOrganizationBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  let [org] = await db.select().from(organizationTable).where(eq(organizationTable.userId, userId));
  if (!org) return res.status(404).json({ error: "Not found" });
  const [updated] = await db.update(organizationTable).set({
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.customDomain !== undefined && { customDomain: parsed.data.customDomain }),
  }).where(and(eq(organizationTable.id, org.id), eq(organizationTable.userId, userId))).returning();
  return res.json(updated);
});

router.get("/organization/members", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const members = await db.select().from(orgMembersTable)
    .where(eq(orgMembersTable.userId, userId))
    .orderBy(orgMembersTable.joinedAt);
  return res.json(members.map(m => ({ ...m, joinedAt: m.joinedAt.toISOString() })));
});

router.post("/organization/members", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const parsed = InviteMemberBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [member] = await db.insert(orgMembersTable).values({
    userId,
    name: parsed.data.email.split("@")[0],
    email: parsed.data.email,
    role: parsed.data.role,
  }).returning();
  return res.status(201).json({ ...member, joinedAt: member.joinedAt.toISOString() });
});

router.get("/api-keys", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const keys = await db.select().from(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .orderBy(apiKeysTable.createdAt);
  return res.json(keys.map(k => ({ id: k.id, name: k.name, keyPreview: k.keyPreview, fullKey: null, createdAt: k.createdAt.toISOString() })));
});

router.post("/api-keys", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const parsed = CreateApiKeyBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const rawKey = `wag_${crypto.randomBytes(24).toString("hex")}`;
  const preview = `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`;
  const [key] = await db.insert(apiKeysTable).values({ userId, name: parsed.data.name, keyPreview: preview, fullKey: rawKey }).returning();
  return res.status(201).json({ ...key, createdAt: key.createdAt.toISOString() });
});

router.delete("/api-keys/:id", async (req, res) => {
  const userId = uid(req);
  if (!userId) return res.status(401).json({ error: "Non authentifié" });
  const params = DeleteApiKeyParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(apiKeysTable).where(and(eq(apiKeysTable.id, params.data.id), eq(apiKeysTable.userId, userId)));
  return res.status(204).send();
});

export default router;
