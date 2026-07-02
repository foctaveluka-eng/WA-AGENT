import { Router } from "express";
import {
  listUpcomingEvents,
  createEvent,
  deleteEvent,
  getCalendarInfo,
  isConnected,
} from "../services/googleCalendar";

const router = Router();

router.get("/calendar/status", async (_req, res) => {
  try {
    const info = await getCalendarInfo();
    return res.json({ connected: true, email: info.email });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GoogleCalendar] status error:", msg);
    return res.json({ connected: false, email: null, error: msg });
  }
});

router.get("/calendar/events", async (req, res) => {
  try {
    const max = Number(req.query.max) || 20;
    const events = await listUpcomingEvents(max);
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.post("/calendar/events", async (req, res) => {
  try {
    const { title, date, time, durationMinutes, description, location } = req.body as {
      title?: string;
      date?: string;
      time?: string;
      durationMinutes?: number;
      description?: string;
      location?: string;
    };
    if (!title || !date || !time) {
      return res.status(400).json({ error: "title, date et time sont requis" });
    }
    const event = await createEvent({
      title,
      date,
      time,
      durationMinutes: durationMinutes ?? 60,
      description,
      location,
    });
    return res.status(201).json(event);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.delete("/calendar/events/:eventId", async (req, res) => {
  try {
    await deleteEvent(req.params.eventId);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
