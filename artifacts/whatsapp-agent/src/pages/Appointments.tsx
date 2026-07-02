import { useState } from "react";
import { useGetAgents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CalendarClock, Pencil, Trash2, Loader2, Download, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type Agent = { id: number; name: string };
type Appointment = {
  id: number; agentId: number; clientName: string; clientPhone?: string | null;
  date: string; time: string; notes?: string | null; status: string; createdAt: string;
};

type ApptForm = {
  agentId: string; clientName: string; clientPhone: string;
  date: string; time: string; notes: string; status: string;
};
const emptyForm: ApptForm = { agentId: "", clientName: "", clientPhone: "", date: "", time: "", notes: "", status: "confirmed" };

function statusBadge(status: string) {
  if (status === "confirmed") return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs"><CheckCircle2 className="w-3 h-3" />Confirmé</Badge>;
  if (status === "cancelled") return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1 text-xs"><XCircle className="w-3 h-3" />Annulé</Badge>;
  return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 text-xs"><Clock className="w-3 h-3" />En attente</Badge>;
}

export default function Appointments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: agents } = useGetAgents();

  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ApptForm>(emptyForm);

  const queryKey = ["appointments", filterAgent];

  const { data: appointments, isLoading, refetch, isFetching } = useQuery<Appointment[]>({
    queryKey,
    queryFn: async () => {
      const url = filterAgent !== "all"
        ? `/api/appointments?agentId=${filterAgent}`
        : `/api/appointments`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur de chargement");
      return res.json();
    },
    refetchInterval: 12000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: object) => {
      const res = await fetch(`/api/appointments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Erreur de création");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); toast({ title: "Rendez-vous créé" }); setDialogOpen(false); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: object }) => {
      const res = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "include" });
      if (!res.ok) throw new Error("Erreur de mise à jour");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); toast({ title: "Rendez-vous mis à jour" }); setDialogOpen(false); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/appointments/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); toast({ title: "Rendez-vous supprimé" }); },
  });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (a: Appointment) => {
    setForm({ agentId: String(a.agentId), clientName: a.clientName, clientPhone: a.clientPhone || "", date: a.date, time: a.time, notes: a.notes || "", status: a.status });
    setEditId(a.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.agentId || !form.clientName || !form.date || !form.time) {
      toast({ title: "Agent, nom, date et heure requis", variant: "destructive" });
      return;
    }
    const data = { agentId: Number(form.agentId), clientName: form.clientName, clientPhone: form.clientPhone || undefined, date: form.date, time: form.time, notes: form.notes || undefined, status: form.status };
    if (editId) updateMutation.mutate({ id: editId, data });
    else createMutation.mutate(data);
  };

  const downloadExcel = () => {
    const url = filterAgent !== "all"
      ? `/api/appointments/excel?agentId=${filterAgent}`
      : `/api/appointments/excel`;
    window.open(url, "_blank");
  };

  const list = appointments ?? [];
  const stats = {
    total: list.length,
    confirmed: list.filter(a => a.status === "confirmed").length,
    pending: list.filter(a => a.status === "pending").length,
    cancelled: list.filter(a => a.status === "cancelled").length,
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rendez-vous</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm hidden sm:block">Gérez les rendez-vous pris par vos agents IA.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} title="Actualiser" className="h-9 w-9">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadExcel}>
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter Excel</span>
            <span className="sm:hidden">Excel</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Confirmés", value: stats.confirmed, color: "text-green-600" },
          { label: "En attente", value: stats.pending, color: "text-amber-600" },
          { label: "Annulés", value: stats.cancelled, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tous les agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les agents</SelectItem>
            {(agents as Agent[] ?? []).map(a => (
              <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Heure</TableHead>
                  <TableHead className="hidden md:table-cell">Agent</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : list.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <CalendarClock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-foreground mb-1">Aucun rendez-vous</p>
                    <p className="text-sm">Les rendez-vous confirmés par vos agents IA apparaîtront ici.</p>
                  </TableCell></TableRow>
                ) : list.map(appt => {
                  const agent = (agents as Agent[] ?? []).find(a => a.id === appt.agentId);
                  return (
                    <TableRow key={appt.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{appt.clientName}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{appt.date} à {appt.time}</div>
                        <div className="text-xs text-muted-foreground">{appt.clientPhone || ""}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{appt.date}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{appt.time}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{agent?.name || `#${appt.agentId}`}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-xs truncate">{appt.notes || "—"}</TableCell>
                      <TableCell>{statusBadge(appt.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(appt)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm("Supprimer ce rendez-vous ?")) deleteMutation.mutate(appt.id); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader><DialogTitle>{editId ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Agent IA *</Label>
              <Select value={form.agentId} onValueChange={v => setForm(f => ({ ...f, agentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Choisir un agent" /></SelectTrigger>
                <SelectContent>
                  {(agents as Agent[] ?? []).map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom du client *</Label>
                <Input placeholder="Jean Dupont" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input placeholder="+33 6 00 00 00 00" value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Heure *</Label>
                <Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Motif du rendez-vous..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
