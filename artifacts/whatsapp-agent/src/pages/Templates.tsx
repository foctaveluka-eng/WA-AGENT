import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Copy, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BASE = "/api";
const CATEGORIES = ["Accueil", "Support", "Commercial", "Livraison", "Paiement", "Autre"];

type Template = { id: number; title: string; content: string; category: string; shortcut: string | null; createdAt: string };

function useTemplates() {
  return useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const r = await fetch(`${BASE}/templates`);
      if (!r.ok) throw new Error("Erreur de chargement");
      return r.json();
    },
  });
}

export default function Templates() {
  const qc = useQueryClient();
  const { data: templates = [], isLoading } = useTemplates();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "Accueil", shortcut: "" });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await fetch(`${BASE}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast({ title: "Modèle créé" }); setDialogOpen(false); },
    onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof form }) => {
      const r = await fetch(`${BASE}/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast({ title: "Modèle mis à jour" }); setDialogOpen(false); },
    onError: () => toast({ title: "Erreur lors de la mise à jour", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${BASE}/templates/${id}`, { method: "DELETE" });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["templates"] }); toast({ title: "Modèle supprimé" }); },
  });

  const filtered = templates.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setForm({ title: "", content: "", category: "Accueil", shortcut: "" });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setForm({ title: t.title, content: t.content, category: t.category, shortcut: t.shortcut || "" });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.title || !form.content) { toast({ title: "Titre et contenu requis", variant: "destructive" }); return; }
    if (editingId) updateMutation.mutate({ id: editingId, data: form });
    else createMutation.mutate(form);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer ce modèle ?")) return;
    deleteMutation.mutate(id);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copié dans le presse-papier" });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Modèles de messages</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Réponses rapides prêtes à l'emploi pour vos agents.</p>
        </div>
        <Button className="gap-1.5 shrink-0 text-sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau modèle</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{t.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                      {t.shortcut && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{t.shortcut}</span>}
                    </div>
                  </div>
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3">
                <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{t.content}</p>
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="ghost" className="gap-1 flex-1" onClick={() => handleCopy(t.content)}><Copy className="w-3 h-3" />Copier</Button>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => openEdit(t)}><Pencil className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" className="gap-1 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucun modèle trouvé.</p>
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Modifier le modèle" : "Nouveau modèle"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Message de bienvenue" />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Raccourci (ex: /bienvenue)</Label>
              <Input value={form.shortcut} onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))} placeholder="/mon-raccourci" />
            </div>
            <div className="space-y-2">
              <Label>Contenu du message</Label>
              <Textarea rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Utilisez {{variable}} pour les variables dynamiques..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
