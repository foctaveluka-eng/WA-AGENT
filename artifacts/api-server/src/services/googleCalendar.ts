import { google } from "googleapis";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Calendar credentials manquants (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)");
  }

  // redirect_uri requis pour le refresh token généré via OAuth Playground
  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

export function getCalendarClient() {
  const auth = getOAuthClient();
  return google.calendar({ version: "v3", auth });
}

export async function isConnected(): Promise<boolean> {
  try {
    const calendar = getCalendarClient();
    await calendar.calendarList.list({ maxResults: 1 });
    return true;
  } catch {
    return false;
  }
}

export async function listUpcomingEvents(maxResults = 20) {
  const calendar = getCalendarClient();
  const now = new Date().toISOString();
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: now,
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });
  return (res.data.items ?? []).map(event => ({
    id: event.id ?? "",
    title: event.summary ?? "(Sans titre)",
    date: (event.start?.dateTime ?? event.start?.date ?? "").split("T")[0],
    time: event.start?.dateTime
      ? new Date(event.start.dateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "Toute la journée",
    endTime: event.end?.dateTime
      ? new Date(event.end.dateTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : null,
    duration: computeDuration(event.start?.dateTime, event.end?.dateTime),
    type: inferType(event.summary ?? ""),
    description: event.description ?? null,
    location: event.location ?? null,
    htmlLink: event.htmlLink ?? null,
  }));
}

export async function createEvent(data: {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
  description?: string;
  location?: string;
}) {
  const calendar = getCalendarClient();
  const startDateTime = new Date(`${data.date}T${data.time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + data.durationMinutes * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: data.title,
      description: data.description,
      location: data.location,
      start: { dateTime: startDateTime.toISOString(), timeZone: "Europe/Paris" },
      end: { dateTime: endDateTime.toISOString(), timeZone: "Europe/Paris" },
    },
  });
  return res.data;
}

export async function deleteEvent(eventId: string) {
  const calendar = getCalendarClient();
  await calendar.events.delete({ calendarId: "primary", eventId });
}

export async function getCalendarInfo() {
  const calendar = getCalendarClient();
  const res = await calendar.calendars.get({ calendarId: "primary" });
  return { email: res.data.id ?? "", summary: res.data.summary ?? "" };
}

function computeDuration(start?: string | null, end?: string | null): string {
  if (!start || !end) return "—";
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function inferType(title: string): "meeting" | "reminder" | "task" {
  const t = title.toLowerCase();
  if (t.includes("rappel") || t.includes("reminder") || t.includes("suivi")) return "reminder";
  if (t.includes("tâche") || t.includes("task") || t.includes("todo") || t.includes("envoi")) return "task";
  return "meeting";
}
