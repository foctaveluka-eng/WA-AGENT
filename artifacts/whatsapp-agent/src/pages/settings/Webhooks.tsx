import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Webhook, Trash2, CheckCircle2, AlertCircle, Copy, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = "/api";

const ALL_EVENTS = [
  "message.received", "message.sent", "lead.created", "lead.updated",
  "conversation.started", "conversation.closed", "order.created", "order.updated",
  "agent.error", "whatsapp.connected", "whatsapp.disconnected",
];

type WebhookItem = {
  id: number; url: string; events: string[]; active: boolean;
  secret: string; lastStatus: string | null; lastPingedAt: string | null; createdAt: string;
};

function useWebhooks() {
  return useQuery<WebhookItem[]>({
    queryKey: ["webhooks"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/webhooks`);
      if (!r.ok) throw new Error("Erreur de chargement");
      return r.json();
    },
  });
}

export default function Webhooks() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: webhooks = [], isLoading } = useWebhooks();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ url: "", events: [] as string[] });
  const [pingingId, setPingingId] = useState<number | null>(null);

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch(`${BASE}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhooks"] }); toast({ title: "Webhook créé" }); setDialogOpen(false); setForm({ url: "", events: [] }); },
    onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const r = await fetch(`${BASE}/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await fetch(`${BASE}/webhooks/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["webhooks"] }); toast({ title: "Webhook supprimé" }); },
  });

  const handlePing = async (id: number) => {
    setPingingId(id);
    try {
      const r = await fetch(`${BASE}/webhooks/${id}/ping`, { method: "POST" });
      const data = await r.json() as { success: boolean };
      if (data.success) toast({ title: "Ping envoyé avec succès ✓" });
      else toast({ title: "Le endpoint a répondu avec une erreur", variant: "destructive" });
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    } catch {
      toast({ title: "Impossible de contacter le endpoint", variant: "destructive" });
    } finally {
      setPingingId(null);
    }
  };

  const toggleEvent = (event: string) => {
    setForm(prev => ({
      ...prev,
      events: prev.events.includes(event) ? prev.events.filter(e => e !== event) : [...prev.events, event],
    }));
  };

  const copySecret = (secret: string) => { navigator.clipboard.writeText(secret); toast({ title: "Secret copié" }); };

  const handleCreate = () => {
    if (!form.url) { toast({ title: "URL requise", variant: "destructive" }); return; }
    if (!form.events.length) { toast({ title: "Sélectionnez au moins un événement", variant: "destructive" }); return; }
    createMutation.mutate(form);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3"><Webhook className="w-5 h-5 md:w-8 md:h-8 text-primary shrink-0" />Webhooks</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Recevez des notifications HTTP pour les événements de votre plateforme.</p>
        </div>
        <Button className="gap-1.5 shrink-0 text-sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter un webhook</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          Les webhooks envoient des requêtes <strong>POST</strong> signées avec HMAC-SHA256.
          Le header <code className="bg-muted px-1 rounded text-xs">X-Webhook-Signature</code> contient la signature pour vérifier l'authenticité.
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {webhooks.map(wh => (
            <Card key={wh.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-mono truncate">{wh.url}</CardTitle>
                      {wh.lastStatus === "success" && <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Succès</Badge>}
                      {wh.lastStatus === "error" && <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>}
                      {wh.lastStatus === "pending" && <Badge variant="secondary" className="text-xs">En attente</Badge>}
                      {wh.lastPingedAt && <span className="text-xs text-muted-foreground">Dernier ping: {new Date(wh.lastPingedAt).toLocaleString("fr-FR")}</span>}
                    </div>
                  </div>
                  <Switch
                    checked={wh.active}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: wh.id, active: v })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">{wh.secret}</code>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => copySecret(wh.secret)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {wh.events.map(e => <Badge key={e} variant="secondary" className="text-xs font-mono">{e}</Badge>)}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handlePing(wh.id)} disabled={pingingId === wh.id}>
                    {pingingId === wh.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Tester
                  </Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(wh.id)}>
                    <Trash2 className="w-3 h-3" />Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {webhooks.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border rounded-lg border-dashed">
              <Webhook className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucun webhook configuré.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Nouveau webhook</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>URL du endpoint</Label>
              <Input placeholder="https://votre-site.com/webhook" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Événements à écouter</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {ALL_EVENTS.map(event => (
                  <label key={event} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={form.events.includes(event)} onCheckedChange={() => toggleEvent(event)} />
                    <span className="text-xs font-mono">{event}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer le webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
