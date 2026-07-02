import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldBan, Plus, Trash2, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = "/api";

type BlockedEntry = { id: number; phone: string; reason: string | null; createdAt: string };

function useBlacklist() {
  return useQuery<BlockedEntry[]>({
    queryKey: ["blacklist"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/blacklist`);
      if (!r.ok) throw new Error("Erreur de chargement");
      return r.json();
    },
  });
}

export default function Blacklist() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: blocked = [], isLoading } = useBlacklist();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ phone: "", reason: "" });
  const [bulkText, setBulkText] = useState("");
  const [bulkMode, setBulkMode] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (data: { phone: string; reason: string }) => {
      const r = await fetch(`${BASE}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (r.status === 409) throw new Error("Ce numéro est déjà bloqué");
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["blacklist"] }); toast({ title: "Numéro bloqué" }); setDialogOpen(false); setForm({ phone: "", reason: "" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const bulkMutation = useMutation({
    mutationFn: async (phones: string[]) => {
      const r = await fetch(`${BASE}/blacklist/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones }),
      });
      if (!r.ok) throw new Error("Erreur");
      return r.json() as Promise<{ added: number }>;
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["blacklist"] }); toast({ title: `${data.added} numéro(s) bloqué(s)` }); setDialogOpen(false); setBulkText(""); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await fetch(`${BASE}/blacklist/${id}`, { method: "DELETE" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["blacklist"] }); toast({ title: "Numéro débloqué" }); },
  });

  const filtered = blocked.filter(b => b.phone.includes(search) || (b.reason || "").toLowerCase().includes(search.toLowerCase()));

  const handleAdd = () => {
    if (!form.phone) { toast({ title: "Numéro requis", variant: "destructive" }); return; }
    addMutation.mutate(form);
  };

  const handleBulkAdd = () => {
    const phones = bulkText.split("\n").map(s => s.trim()).filter(Boolean);
    if (!phones.length) { toast({ title: "Saisissez des numéros", variant: "destructive" }); return; }
    bulkMutation.mutate(phones);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
            <ShieldBan className="w-5 h-5 md:w-8 md:h-8 text-primary shrink-0" />
            Liste noire
          </h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Les numéros bloqués ne recevront aucune réponse de vos agents.</p>
        </div>
        <Button className="gap-1.5 shrink-0 text-sm" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Bloquer un numéro</span>
          <span className="sm:hidden">Bloquer</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">{blocked.length}</p><p className="text-sm text-muted-foreground">Numéros bloqués</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold text-green-600">100%</p><p className="text-sm text-muted-foreground">Messages bloqués</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-2xl font-bold">0</p><p className="text-sm text-muted-foreground">Tentatives aujourd'hui</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher un numéro..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Bloqué le</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-medium">{b.phone}</TableCell>
                    <TableCell><Badge variant="destructive" className="text-xs">{b.reason || "—"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(b.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1" onClick={() => deleteMutation.mutate(b.id)}>
                        <Trash2 className="w-3 h-3" />Débloquer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun numéro bloqué.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Bloquer un numéro</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Button variant={!bulkMode ? "default" : "outline"} size="sm" onClick={() => setBulkMode(false)}>Un numéro</Button>
              <Button variant={bulkMode ? "default" : "outline"} size="sm" onClick={() => setBulkMode(true)}>Ajout en masse</Button>
            </div>
            {!bulkMode ? (
              <>
                <div className="space-y-2"><Label>Numéro de téléphone</Label><Input placeholder="+33 6 12 34 56 78" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Raison (optionnel)</Label><Input placeholder="Ex: Spam, harcèlement..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} /></div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Numéros (un par ligne)</Label>
                <Textarea rows={6} placeholder={"+33 6 12 34 56 78\n+221 77 000 00 01"} value={bulkText} onChange={e => setBulkText(e.target.value)} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={bulkMode ? handleBulkAdd : handleAdd} disabled={addMutation.isPending || bulkMutation.isPending}>
              {(addMutation.isPending || bulkMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <ShieldBan className="w-4 h-4 mr-2" />Bloquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
