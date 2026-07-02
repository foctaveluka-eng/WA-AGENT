import { useState } from "react";
import { useGetLeads, useGetLeadsStats, useCreateLead, useUpdateLead, useDeleteLead, getGetLeadsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Plus, MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type LeadForm = { name: string; phone: string; email: string; status: string; source: string; notes: string };
const emptyLead: LeadForm = { name: "", phone: "", email: "", status: "new", source: "WhatsApp", notes: "" };

const STATUS_LABELS: Record<string, string> = { new: "Nouveau", contacted: "Contacté", qualified: "Qualifié", converted: "Converti", lost: "Perdu" };

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    new: "bg-blue-500 hover:bg-blue-600 text-white border-transparent",
    contacted: "bg-secondary text-secondary-foreground",
    qualified: "bg-green-500 hover:bg-green-600 text-white border-transparent",
    converted: "bg-primary text-primary-foreground",
    lost: "bg-destructive text-destructive-foreground",
  };
  return <Badge className={`capitalize text-xs ${variants[status] ?? ""}`}>{STATUS_LABELS[status] ?? status}</Badge>;
}

export default function Leads() {
  const { data: leads, isLoading } = useGetLeads();
  const { data: stats, isLoading: statsLoading } = useGetLeadsStats();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyLead);

  const openCreate = () => { setForm(emptyLead); setEditId(null); setDialogOpen(true); };
  const openEdit = (l: { id: number; name: string; phone: string; email?: string | null; status: string; source?: string | null; notes?: string | null }) => {
    setForm({ name: l.name, phone: l.phone, email: l.email || "", status: l.status, source: l.source || "WhatsApp", notes: l.notes || "" });
    setEditId(l.id);
    setDialogOpen(true);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });

  const handleSubmit = () => {
    if (!form.name || !form.phone) { toast({ title: "Nom et téléphone requis", variant: "destructive" }); return; }
    const data = { name: form.name, phone: form.phone, email: form.email || undefined, status: form.status as "new"|"contacted"|"qualified"|"converted"|"lost", source: form.source || "WhatsApp", notes: form.notes || undefined };
    if (editId) {
      updateLead.mutate({ id: editId, data }, { onSuccess: () => { invalidate(); toast({ title: "Lead mis à jour" }); setDialogOpen(false); }, onError: () => toast({ title: "Erreur", variant: "destructive" }) });
    } else {
      createLead.mutate({ data }, { onSuccess: () => { invalidate(); toast({ title: "Lead créé" }); setDialogOpen(false); }, onError: () => toast({ title: "Erreur", variant: "destructive" }) });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer ce lead ?")) return;
    deleteLead.mutate({ id }, { onSuccess: () => { invalidate(); toast({ title: "Lead supprimé" }); } });
  };

  const isPending = createLead.isPending || updateLead.isPending;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1 text-sm">Suivez et gérez vos clients potentiels.</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter un lead</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statsLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)
        ) : stats ? (
          <>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">Total Leads</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">Nouveaux</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-blue-500">{stats.new}</div></CardContent></Card>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">Qualifiés</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-green-500">{stats.qualified}</div></CardContent></Card>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">Convertis</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-primary">{stats.converted}</div></CardContent></Card>
          </>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Source</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1,2,3].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : leads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-foreground mb-1">Aucun lead</p>
                      <p className="text-sm">Ajoutez votre premier lead pour commencer.</p>
                    </TableCell>
                  </TableRow>
                ) : leads?.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.phone}{lead.email && <span className="hidden sm:inline"> • {lead.email}</span>}</div>
                    </TableCell>
                    <TableCell><StatusBadge status={lead.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{lead.source || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{new Date(lead.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(lead)}><Pencil className="w-4 h-4 mr-2" />Modifier</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 cursor-pointer" onClick={() => handleDelete(lead.id)}><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>{editId ? "Modifier le lead" : "Ajouter un lead"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input placeholder="Jean Dupont" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone *</Label>
                <Input placeholder="+33 6 00 00 00 00" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="jean@exemple.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input placeholder="WhatsApp, Site web..." value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Notes sur ce lead..." rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
