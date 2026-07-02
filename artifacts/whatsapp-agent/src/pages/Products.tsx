import { useState, useRef } from "react";
import { useGetProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, getGetProductsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Package, Pencil, Trash2, Loader2, ExternalLink, Image as ImageIcon, Search, LayoutGrid, LayoutList, Upload, ShoppingBag, Wrench } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

type ProductForm = {
  name: string; description: string; category: string; price: string;
  status: string; imageUrl: string; link: string; itemType: string;
};
const empty: ProductForm = { name: "", description: "", category: "", price: "", status: "active", imageUrl: "", link: "", itemType: "product" };

type Product = {
  id: number; name: string; description?: string | null; category?: string | null;
  price: number; status: string; imageUrl?: string | null; link?: string | null; createdAt: string; itemType?: string;
};

export default function Products() {
  const { data: products, isLoading } = useGetProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(empty);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [activeItemType, setActiveItemType] = useState<"product" | "service">("product");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/products/upload-image`, { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error();
      const { url } = await res.json() as { url: string };
      setForm(f => ({ ...f, imageUrl: url }));
      toast({ title: "Image téléchargée" });
    } catch {
      toast({ title: "Erreur de téléchargement", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openCreate = () => { setForm({ ...empty, itemType: activeItemType }); setEditId(null); setDialogOpen(true); };
  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || "", category: p.category || "",
      price: String(p.price), status: p.status, imageUrl: p.imageUrl || "", link: p.link || "", itemType: p.itemType || "product" });
    setEditId(p.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const price = parseFloat(form.price);
    if (!form.name || isNaN(price)) { toast({ title: "Nom et prix requis", variant: "destructive" }); return; }
    const data = {
      name: form.name, description: form.description || undefined, category: form.category || "",
      price, status: form.status as "active" | "inactive" | "draft",
      imageUrl: form.imageUrl || undefined, link: form.link || undefined,
      itemType: form.itemType || "product",
    } as Parameters<typeof createProduct.mutate>[0]["data"] & { itemType: string };
    if (editId) {
      updateProduct.mutate({ id: editId, data }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }); toast({ title: form.itemType === "service" ? "Service mis à jour" : "Produit mis à jour" }); setDialogOpen(false); },
        onError: () => toast({ title: "Erreur de mise à jour", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: data as Parameters<typeof createProduct.mutate>[0]["data"] }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }); toast({ title: form.itemType === "service" ? "Service créé" : "Produit créé" }); setDialogOpen(false); },
        onError: () => toast({ title: "Erreur de création", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer ce produit définitivement ?")) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() }); toast({ title: "Produit supprimé" }); },
    });
  };

  const isPending = createProduct.isPending || updateProduct.isPending;
  const list = (products as Product[] ?? []);
  const productsOnly = list.filter(p => !p.itemType || p.itemType === "product");
  const servicesOnly = list.filter(p => p.itemType === "service");
  const activeList = activeItemType === "product" ? productsOnly : servicesOnly;
  const filtered = activeList.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });
  const stats = {
    total: activeList.length, active: activeList.filter(p => p.status === "active").length,
    draft: activeList.filter(p => p.status === "draft").length,
    totalValue: activeList.filter(p => p.status === "active").reduce((s, p) => s + p.price, 0),
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Produits & Services</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Gérez votre catalogue proposé via WhatsApp.</p>
        </div>
        <Button className="gap-1.5 shrink-0 text-sm" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{activeItemType === "service" ? "Ajouter un service" : "Ajouter un produit"}</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Tab switcher products / services */}
      <div className="flex border-b gap-6">
        <button
          onClick={() => setActiveItemType("product")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${activeItemType === "product" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingBag className="w-4 h-4" />
          Produits
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-normal">{productsOnly.length}</span>
        </button>
        <button
          onClick={() => setActiveItemType("service")}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-colors ${activeItemType === "service" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Wrench className="w-4 h-4" />
          Services
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-normal">{servicesOnly.length}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total produits", value: stats.total, color: "text-foreground" },
          { label: "Actifs", value: stats.active, color: "text-green-600" },
          { label: "Brouillons", value: stats.draft, color: "text-amber-600" },
          { label: "Valeur catalogue", value: `${stats.totalValue.toFixed(2)} €`, color: "text-primary" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tous les statuts" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex border rounded-md overflow-hidden">
          <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode("table")}><LayoutList className="w-4 h-4" /></Button>
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <Card><CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Image</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Lien</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? [1,2,3].map(i => (
                <TableRow key={i}>
                  {[1,2,3,4,5,6,7].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              )) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium text-foreground mb-1">Aucun produit trouvé</p>
                  <p className="text-sm">Ajoutez des produits ou modifiez votre recherche.</p>
                </TableCell></TableRow>
              ) : filtered.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-md object-cover border"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</div>}
                  </TableCell>
                  <TableCell>{product.category ? <Badge variant="outline" className="text-xs">{product.category}</Badge> : "—"}</TableCell>
                  <TableCell className="font-semibold">{product.price.toFixed(2)} €</TableCell>
                  <TableCell>
                    {product.link ? (
                      <a href={product.link} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs text-primary"><ExternalLink className="w-3 h-3" />Voir</Button>
                      </a>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={product.status === "active" ? "bg-green-100 text-green-700 border-green-200" : ""} variant={product.status === "active" ? "default" : "secondary"}>
                      {product.status === "active" ? "Actif" : product.status === "draft" ? "Brouillon" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent></Card>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? [1,2,3,4].map(i => (
            <Card key={i}><CardContent className="p-0">
              <Skeleton className="h-48 rounded-t-lg w-full" />
              <div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-5 w-1/3" /></div>
            </CardContent></Card>
          )) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium text-foreground mb-1">Aucun produit trouvé</p>
            </div>
          ) : filtered.map(product => (
            <Card key={product.id} className="overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="relative h-48 bg-muted overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground/30" /></div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge className={product.status === "active" ? "bg-green-100 text-green-700 border-green-200" : "bg-muted text-muted-foreground"}>
                      {product.status === "active" ? "Actif" : product.status === "draft" ? "Brouillon" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div>
                    <p className="font-semibold truncate">{product.name}</p>
                    {product.category && <Badge variant="outline" className="text-xs mt-1">{product.category}</Badge>}
                    {product.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>}
                  </div>
                  <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} €</p>
                  <div className="flex items-center gap-2 pt-1">
                    {product.link && (
                      <a href={product.link} target="_blank" rel="noopener noreferrer" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs h-8"><ExternalLink className="w-3 h-3" />Voir le produit</Button>
                      </a>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(product)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? (form.itemType === "service" ? "Modifier le service" : "Modifier le produit") : (form.itemType === "service" ? "Ajouter un service" : "Ajouter un produit")}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input placeholder="Pack Starter, Formation IA..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Décrivez votre produit..." rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Input placeholder="Service, Abonnement..." value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Prix (€) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="49.99" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" />Image (optionnel)</Label>
              <div className="flex gap-2">
                <Input placeholder="https://exemple.com/image.jpg" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} className="flex-1" />
                <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Télécharger une image">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <p className="text-xs text-muted-foreground">Entrez une URL ou téléchargez une image (max 5 Mo).</p>
              {form.imageUrl && (
                <div className="mt-1 rounded-lg overflow-hidden border h-32 bg-muted">
                  <img src={form.imageUrl} alt="Aperçu" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2"><ExternalLink className="w-4 h-4" />Lien du produit <span className="text-muted-foreground font-normal text-xs">(optionnel)</span></Label>
              <Input placeholder="https://monsite.com/produit" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {editId ? "Enregistrer" : form.itemType === "service" ? "Créer le service" : "Créer le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
