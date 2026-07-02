import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, CheckCircle2, Clock, Plus, Loader2, Trash2, RefreshCw, AlertCircle, MapPin, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string | null;
  duration: string;
  type: "meeting" | "reminder" | "task";
  description: string | null;
  location: string | null;
  htmlLink: string | null;
};

type CalendarStatus = {
  connected: boolean;
  email: string | null;
  error?: string;
};

const TYPE_STYLES = {
  meeting: "bg-blue-100 text-blue-700 border-blue-200",
  reminder: "bg-amber-100 text-amber-700 border-amber-200",
  task: "bg-green-100 text-green-700 border-green-200",
};

const TYPE_LABELS = { meeting: "Réunion", reminder: "Rappel", task: "Tâche" };

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  if (!res.ok && res.status !== 204) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export default function Calendar() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [aiScheduling, setAiScheduling] = useState(true);
  const [autoReminders, setAutoReminders] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState("30");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", date: "", time: "", durationMinutes: "60", description: "", location: "" });

  const statusQuery = useQuery<CalendarStatus>({
    queryKey: ["calendar-status"],
    queryFn: () => apiFetch("/calendar/status"),
    refetchInterval: 30000,
  });

  const eventsQuery = useQuery<CalendarEvent[]>({
    queryKey: ["calendar-events"],
    queryFn: () => apiFetch("/calendar/events?max=20"),
    enabled: statusQuery.data?.connected === true,
    refetchInterval: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => apiFetch(`/calendar/events/${eventId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      toast({ title: "Événement supprimé" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch("/calendar/events", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          durationMinutes: Number(data.durationMinutes),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
      setShowCreate(false);
      setForm({ title: "", date: "", time: "", durationMinutes: "60", description: "", location: "" });
      toast({ title: "Événement créé avec succès !" });
    },
    onError: (err: Error) => toast({ title: "Erreur", description: err.message, variant: "destructive" }),
  });

  const connected = statusQuery.data?.connected ?? false;
  const email = statusQuery.data?.email;

  const groupedEvents: Record<string, CalendarEvent[]> = {};
  for (const ev of eventsQuery.data ?? []) {
    if (!groupedEvents[ev.date]) groupedEvents[ev.date] = [];
    groupedEvents[ev.date].push(ev);
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
          <CalendarIcon className="w-5 h-5 md:w-8 md:h-8 text-primary shrink-0" />
          Google Calendar
        </h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">
          Vos événements réels Google Calendar — l'IA peut planifier des rendez-vous automatiquement.
        </p>
      </div>

      {/* Statut de connexion */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Google Calendar</CardTitle>
                <CardDescription>Synchronisé avec votre compte Google</CardDescription>
              </div>
            </div>
            {statusQuery.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : connected ? (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connecté
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                Non connecté
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {statusQuery.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Vérification de la connexion...
            </div>
          ) : connected ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Connecté en tant que : <span className="font-medium text-foreground">{email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => qc.invalidateQueries({ queryKey: ["calendar-events", "calendar-status"] })}
                className="gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Actualiser
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium">Configuration requise</p>
                <p className="text-xs mt-1">
                  {statusQuery.data?.error
                    ? `Erreur : ${statusQuery.data.error}`
                    : "Les secrets GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET et GOOGLE_REFRESH_TOKEN doivent être configurés."}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">L'IA pourra :</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Créer des rendez-vous quand un client en demande un</li>
                  <li>Vérifier vos disponibilités en temps réel</li>
                  <li>Envoyer des rappels automatiques par WhatsApp</li>
                  <li>Annuler ou reprogrammer sur demande du client</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {connected && (
        <>
          {/* Comportement IA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comportement de l'IA</CardTitle>
              <CardDescription>Comment l'agent utilise votre calendrier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Planification automatique</p>
                  <p className="text-xs text-muted-foreground">L'IA peut créer des rendez-vous sans votre confirmation</p>
                </div>
                <Switch checked={aiScheduling} onCheckedChange={setAiScheduling} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Rappels automatiques WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Envoyer un message de rappel avant chaque rendez-vous</p>
                </div>
                <Switch checked={autoReminders} onCheckedChange={setAutoReminders} />
              </div>
              {autoReminders && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label>Délai de rappel (minutes avant le RDV)</Label>
                  <Input
                    type="number"
                    value={reminderMinutes}
                    onChange={e => setReminderMinutes(e.target.value)}
                    className="w-32"
                    min="5"
                    max="1440"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Événements à venir */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Prochains événements
                  {eventsQuery.data && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({eventsQuery.data.length} événements)
                    </span>
                  )}
                </CardTitle>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowCreate(true)}>
                  <Plus className="w-3 h-3" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {eventsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Chargement des événements...
                </div>
              ) : eventsQuery.isError ? (
                <div className="text-sm text-destructive text-center py-4">
                  Erreur : {(eventsQuery.error as Error).message}
                </div>
              ) : !eventsQuery.data?.length ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun événement à venir dans votre Google Calendar
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedEvents).map(([date, evs]) => (
                    <div key={date}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                      </p>
                      <div className="space-y-2">
                        {evs.map(event => (
                          <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                            <div className="text-center min-w-[52px] pt-0.5">
                              <p className="text-sm font-bold">{event.time}</p>
                              {event.endTime && (
                                <p className="text-xs text-muted-foreground">{event.endTime}</p>
                              )}
                            </div>
                            <Separator orientation="vertical" className="h-10 self-center" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-muted-foreground">Durée : {event.duration}</span>
                                {event.location && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.location}
                                  </span>
                                )}
                                {event.description && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {event.description.slice(0, 40)}{event.description.length > 40 ? "…" : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`text-xs border ${TYPE_STYLES[event.type]}`}>
                                {TYPE_LABELS[event.type]}
                              </Badge>
                              {event.htmlLink && (
                                <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                                  <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-primary">
                                    <CalendarIcon className="w-3 h-3" />
                                  </Button>
                                </a>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-7 h-7 text-muted-foreground hover:text-destructive"
                                disabled={deleteMutation.isPending}
                                onClick={() => deleteMutation.mutate(event.id)}
                              >
                                {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal création d'événement */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input
                placeholder="Réunion client..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Heure *</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                min="5"
                max="480"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lieu</Label>
              <Input
                placeholder="Paris, France..."
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Notes sur l'événement..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.title || !form.date || !form.time}
              className="gap-2"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Créer l'événement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
