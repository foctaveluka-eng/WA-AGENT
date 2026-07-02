import { db } from "@workspace/db";
import { agentsTable, appointmentsTable, ordersTable, conversationsTable } from "@workspace/db";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { waManager } from "./whatsapp";

// Track which agents have already received the summary today (key: agentId, value: "YYYY-MM-DD")
const lastSentDate = new Map<number, string>();

// Get local date string "YYYY-MM-DD" in a given timezone
function localDateStr(tz: string): string {
  return new Date().toLocaleDateString("fr-CA", { timeZone: tz }); // fr-CA gives YYYY-MM-DD
}

// Get local hour (0-23) in a given timezone
function localHour(tz: string): number {
  return parseInt(
    new Date().toLocaleString("fr-FR", { timeZone: tz, hour: "2-digit", hour12: false }),
    10
  );
}

// Format a date string "YYYY-MM-DD" to a readable French date
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const months = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

// Build and send the daily summary for one agent
async function sendDailySummaryForAgent(agentId: number): Promise<void> {
  const [agent] = await db.select().from(agentsTable).where(eq(agentsTable.id, agentId));
  if (!agent?.notificationPhone?.trim()) return;

  const tz = agent.timezone || "UTC";
  const today = localDateStr(tz);
  const agentLabel = agent.personaName || agent.name;

  // Yesterday's date string
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString("fr-CA", { timeZone: tz });
  })();

  // ── Appointments created yesterday ─────────────────────────────────────────
  const [apptYesterdayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.agentId, agentId),
        gte(appointmentsTable.createdAt, new Date(`${yesterday}T00:00:00`)),
        lt(appointmentsTable.createdAt, new Date(`${today}T00:00:00`))
      )
    );
  const apptYesterdayCount = apptYesterdayResult?.count ?? 0;

  // ── Appointments scheduled for TODAY (by date field, not createdAt) ────────
  const apptToday = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.agentId, agentId),
        eq(appointmentsTable.date, today),
        eq(appointmentsTable.status, "confirmed")
      )
    )
    .orderBy(appointmentsTable.time);
  const apptTodayCount = apptToday.length;

  // ── Orders created yesterday ───────────────────────────────────────────────
  const [ordersYesterdayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(
      and(
        gte(ordersTable.createdAt, new Date(`${yesterday}T00:00:00`)),
        lt(ordersTable.createdAt, new Date(`${today}T00:00:00`))
      )
    );
  const ordersYesterdayCount = ordersYesterdayResult?.count ?? 0;

  // ── New conversations (contacts) created yesterday ─────────────────────────
  const [newContactsResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(
      and(
        eq(conversationsTable.agentId, agentId),
        gte(conversationsTable.createdAt, new Date(`${yesterday}T00:00:00`)),
        lt(conversationsTable.createdAt, new Date(`${today}T00:00:00`))
      )
    );
  const newContactsCount = newContactsResult?.count ?? 0;

  // ── Active conversations (ever sent at least 2 messages) ──────────────────
  const [activeConvResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(conversationsTable)
    .where(eq(conversationsTable.agentId, agentId));
  const totalConvCount = activeConvResult?.count ?? 0;

  // ── Build message ──────────────────────────────────────────────────────────
  const lines: string[] = [];
  lines.push(`📊 *Récapitulatif du ${formatDate(today)}*`);
  lines.push(`🤖 Agent : ${agentLabel}`);
  lines.push("");

  lines.push(`📅 *Hier (${formatDate(yesterday)})*`);
  lines.push(`   🗓 Rendez-vous confirmés : ${apptYesterdayCount}`);
  lines.push(`   🛒 Commandes reçues : ${ordersYesterdayCount}`);
  lines.push(`   👤 Nouveaux contacts : ${newContactsCount}`);
  lines.push("");

  lines.push(`📌 *Aujourd'hui (${formatDate(today)})*`);
  if (apptTodayCount === 0) {
    lines.push(`   🗓 Aucun rendez-vous prévu`);
  } else {
    lines.push(`   🗓 ${apptTodayCount} rendez-vous prévu${apptTodayCount > 1 ? "s" : ""} :`);
    for (const appt of apptToday) {
      lines.push(`      • ${appt.time} — ${appt.clientName}${appt.notes ? ` (${appt.notes.slice(0, 40)})` : ""}`);
    }
  }
  lines.push("");

  lines.push(`💬 *Total conversations* : ${totalConvCount}`);
  lines.push("");
  lines.push(`_Bonne journée ! 🚀_`);

  const message = lines.join("\n");

  console.log(`[DAILY] 📤 Envoi récapitulatif agent ${agentId} (${agentLabel}) → ${agent.notificationPhone.trim()}`);
  await waManager.sendAdminNotif(agentId, agent.notificationPhone.trim(), message);
}

// Run daily summary check — called every minute by the scheduler
async function runDailySummaryCheck(): Promise<void> {
  try {
    const agents = await db
      .select({
        id: agentsTable.id,
        timezone: agentsTable.timezone,
        notificationPhone: agentsTable.notificationPhone,
        whatsappConnected: agentsTable.whatsappConnected,
      })
      .from(agentsTable)
      .where(eq(agentsTable.isActive, true));

    for (const agent of agents) {
      if (!agent.notificationPhone?.trim()) continue;
      if (!agent.whatsappConnected) continue;

      const tz = agent.timezone || "UTC";
      const hour = localHour(tz);
      const today = localDateStr(tz);

      // Send at 8:00 AM (hour === 8), once per day
      if (hour !== 8) continue;
      if (lastSentDate.get(agent.id) === today) continue;

      lastSentDate.set(agent.id, today);
      sendDailySummaryForAgent(agent.id).catch(err => {
        console.error(`[DAILY] ❌ Erreur récapitulatif agent ${agent.id}:`, err);
        // Remove from sent map so it retries next minute if it failed
        if (lastSentDate.get(agent.id) === today) lastSentDate.delete(agent.id);
      });
    }
  } catch (err) {
    console.error(`[DAILY] ❌ Erreur vérification quotidienne:`, err);
  }
}

let schedulerInterval: NodeJS.Timeout | null = null;

// Start the daily summary scheduler (checks every minute)
export function startDailySummaryScheduler(): void {
  if (schedulerInterval) return;
  console.log(`[DAILY] ✅ Scheduler récapitulatif journalier démarré (vérification toutes les minutes, envoi à 8h00)`);
  schedulerInterval = setInterval(() => {
    runDailySummaryCheck().catch(err => console.error(`[DAILY] ❌ Scheduler error:`, err));
  }, 60_000);
  // Run once immediately at startup (will only send if it's 8:00 AM)
  runDailySummaryCheck().catch(err => console.error(`[DAILY] ❌ Startup check error:`, err));
}

export function stopDailySummaryScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log(`[DAILY] Scheduler arrêté`);
  }
}
