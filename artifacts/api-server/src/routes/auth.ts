import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

const ADMIN_EMAILS = ["foctaveluka@gmail.com", "octaveluka@gmail.com"];

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
}

function createSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nom, email et mot de passe requis" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
  }
  const normalizedEmail = email.toLowerCase();
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (existing) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email" });
  }
  const salt = createSalt();
  const passwordHash = `${salt}:${hashPassword(password, salt)}`;
  const role = ADMIN_EMAILS.includes(normalizedEmail) ? "admin" : "user";
  const [user] = await db.insert(usersTable).values({
    name,
    email: normalizedEmail,
    passwordHash,
    role,
  }).returning();
  const session = req.session as { userId?: number; userName?: string; userEmail?: string; userRole?: string };
  session.userId = user.id;
  session.userName = user.name;
  session.userEmail = user.email;
  session.userRole = user.role;
  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  const normalizedEmail = email.toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
  if (!user) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }
  const [salt, storedHash] = user.passwordHash.split(":");
  const inputHash = hashPassword(password, salt);
  if (inputHash !== storedHash) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }
  // Auto-upgrade to admin if in admin list and not already admin
  if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== "admin") {
    await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));
    user.role = "admin";
  }
  const session = req.session as { userId?: number; userName?: string; userEmail?: string; userRole?: string };
  session.userId = user.id;
  session.userName = user.name;
  session.userEmail = user.email;
  session.userRole = user.role;
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("wa.sid");
    return res.json({ ok: true });
  });
});

router.get("/me", async (req, res) => {
  const session = req.session as { userId?: number; userName?: string; userEmail?: string; userRole?: string };
  if (!session.userId) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  // Always return fresh role from DB
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user) {
    return res.status(401).json({ error: "Compte introuvable" });
  }
  session.userRole = user.role;
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
