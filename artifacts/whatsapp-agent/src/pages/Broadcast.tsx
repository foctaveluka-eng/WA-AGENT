import { useState } from "react";
import { useGetLeads, useGetAgents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Users, CheckCircle2, Send, Loader2, AlertTriangle, XCircle, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BroadcastResult {
  leadId: number;
  name: string;
  phone: string;
  status: "sent" | "failed";
  error?: string;
}

interface BroadcastResponse {
  sent: number;
  failed: number;
  total: number;
  results: BroadcastResult[];
}

export default function Broadcast() {
  const { data: leads = [] } = useGetLeads();
  const { data: agents = [] } = useGetAgents();
  const { toast } = useToast();

  const connectedAgents = agents.filter(a => a.whatsappConnected);

  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [agentId, setAgentId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResponse | null>(null);

  const filteredLeads = leads.filter(l =>
    statusFilter === "all" || l.status === statusFilter
  );

  const toggleAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const toggleLead = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({ title: "Saisissez un message", variant: "destructive" });
      return;
    }
    if (selectedIds.size === 0) {
      toast({ title: "Sélectionnez au moins un destinataire", variant: "destructive" });
      return;
    }
    if (!agentId) {
      toast({ title: "Sélectionnez un agent WhatsApp connecté", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: Number(agentId),
          message: message.trim(),
          leadIds: Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
        throw new Error(err.error ?? "Erreur lors de l'envoi");
      }

      const data: BroadcastResponse = await res.json();
      setResult(data);

      if (data.failed === 0) {
        toast({ title: `✅ ${data.sent} message(s) envoyé(s) avec succès !` });
      } else if (data.sent === 0) {
        toast({ title: `Tous les envois ont échoué (${data.failed})`, variant: "destructive" });
      } else {
        toast({ title: `${data.sent} envoyé(s), ${data.failed} échec(s)` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    new: "Nouveau", contacted: "Contacté", qualified: "Qualifié", converted: "Converti", lost: "Perdu"
  };

  if (result) {
    const pct = Math.round((result.sent / result.total) * 100);
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4 py-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${result.failed === 0 ? "bg-primary/10" : "bg-amber-50"}`}>
            {result.failed === 0
              ? <CheckCircle2 className="w-8 h-8 text-primary" />
              : <AlertTriangle className="w-8 h-8 text-amber-500" />}
          </div>
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold">Diffusion terminée</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              <span className="text-green-600 font-semibold">{result.sent} envoyé(s)</span>
              {result.failed > 0 && <span className="text-red-500 font-semibold"> · {result.failed} échec(s)</span>}
              {" · "}{result.total} au total
            </p>
          </div>
          <Progress value={pct} className="w-full max-w-xs h-2" />
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Détails par contact</CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            <div className="divide-y text-sm">
              {result.results.map(r => (
                <div key={r.leadId} className="flex items-center gap-3 px-4 py-2.5">
                  {r.status === "sent"
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.phone}</p>
                    {r.error && <p className="text-xs text-red-400 truncate">{r.error}</p>}
                  </div>
                  <Badge variant={r.status === "sent" ? "default" : "destructive"} className="text-xs shrink-0">
                    {r.status === "sent" ? "Envoyé" : "Échec"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => { setResult(null); setMessage(""); setSelectedIds(new Set()); setScheduledAt(""); }}>
          Nouvelle diffusion
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
          <Megaphone className="w-5 h-5 md:w-8 md:h-8 text-primary shrink-0" />
          Diffusion en masse
        </h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Envoyez un message WhatsApp à plusieurs contacts via un agent connecté.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-4">

          {/* Agent selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Agent expéditeur</CardTitle>
            </CardHeader>
            <CardContent>
              {connectedAgents.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-3">
                  <WifiOff className="w-4 h-4 shrink-0 text-red-400" />
                  Aucun agent WhatsApp connecté. Connectez un agent d'abord.
                </div>
              ) : (
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un agent connecté..." />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedAgents.map(a => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        <div className="flex items-center gap-2">
                          <Wifi className="w-3.5 h-3.5 text-green-500" />
                          {a.name}
                          {a.whatsappPhone && (
                            <span className="text-xs text-muted-foreground">· {a.whatsappPhone}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Message editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Composer le message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  rows={5}
                  placeholder={"Bonjour {{prénom}}, nous avons une offre spéciale pour vous..."}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Variables: {"{{prénom}}"}, {"{{numéro}}"}, {"{{email}}"}</span>
                  <span>{message.length}/4096</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Programmer l'envoi (optionnel)</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Laissez vide pour envoyer immédiatement.</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>WhatsApp limite les messages en masse. Un délai d'environ 1 seconde est appliqué entre chaque envoi pour éviter le blocage de votre numéro.</p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agent sélectionné</span>
                  <span className="font-medium">
                    {agentId ? connectedAgents.find(a => String(a.id) === agentId)?.name ?? "—" : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destinataires</span>
                  <span className="font-medium">{selectedIds.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durée estimée</span>
                  <span className="font-medium">
                    {selectedIds.size > 0 ? `~${Math.ceil(selectedIds.size * 1.2)}s` : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="gap-2"
            onClick={handleSend}
            disabled={sending || selectedIds.size === 0 || !message.trim() || !agentId || connectedAgents.length === 0}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending
              ? "Envoi en cours..."
              : `Envoyer à ${selectedIds.size} contact(s)`}
          </Button>

          {sending && (
            <p className="text-xs text-center text-muted-foreground">
              Envoi en cours — ne fermez pas cette page.
            </p>
          )}
        </div>

        {/* Contacts selector */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Destinataires
              </CardTitle>
              <Badge variant="secondary" className="text-xs">{selectedIds.size}/{filteredLeads.length}</Badge>
            </div>
            <div className="flex gap-2 mt-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={toggleAll} className="shrink-0 text-xs">
                {selectedIds.size === filteredLeads.length ? "Désélect." : "Tout sél."}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-80 lg:max-h-[480px] p-0">
            <div className="divide-y">
              {filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleLead(lead.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={() => toggleLead(lead.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">
                    {STATUS_LABELS[lead.status] || lead.status}
                  </Badge>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Aucun contact trouvé.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
