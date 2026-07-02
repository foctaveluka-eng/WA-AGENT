import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldCheck, Users, Bot, MessageSquare, ShoppingBag, BarChart3, Trash2, Crown, UserX, Loader2, ShieldBan } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Redirect } from "wouter";

type AdminUser = { id: number; name: string; email: string; role: string; createdAt: string };
type AdminStats = { users: number; agents: number; conversations: number; messages: number; leads: number; orders: number };

function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users", { credentials: "include" });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
  });
}

function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const r = await fetch("/api/admin/stats", { credentials: "include" });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
  });
}

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading: loadingUsers } = useAdminUsers();
  const { data: stats } = useAdminStats();

  // Guard — only admin
  if (user && user.role !== "admin") return <Redirect to="/" />;

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const r = await fetch(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: (_, { role }) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: role === "admin" ? "Administrateur promu" : "Droits admin révoqués" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error("Erreur");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Compte supprimé" });
      setConfirmDelete(null);
    },
    onError: () => toast({ title: "Erreur lors de la suppression", variant: "destructive" }),
  });

  const statCards = [
    { label: "Utilisateurs", value: stats?.users ?? "—", icon: Users, color: "text-blue-500" },
    { label: "Agents IA", value: stats?.agents ?? "—", icon: Bot, color: "text-green-500" },
    { label: "Conversations", value: stats?.conversations ?? "—", icon: MessageSquare, color: "text-purple-500" },
    { label: "Messages", value: stats?.messages ?? "—", icon: BarChart3, color: "text-orange-500" },
    { label: "Leads", value: stats?.leads ?? "—", icon: Users, color: "text-pink-500" },
    { label: "Commandes", value: stats?.orders ?? "—", icon: ShoppingBag, color: "text-yellow-600" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Panneau Administrateur</h1>
          <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">Gestion complète de la plateforme WA Agent.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 border shrink-0 text-xs">
          <Crown className="w-3 h-3 mr-1" />
          <span className="hidden sm:inline">Admin : </span>{user?.email}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestion des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingUsers ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map(j => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-24" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              ) : users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      {u.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    {u.role === "admin" ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 border gap-1">
                        <Crown className="w-3 h-3" />Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Utilisateur</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.id !== user?.id && (
                        <>
                          {u.role !== "admin" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 h-7 text-xs"
                              onClick={() => roleMutation.mutate({ id: u.id, role: "admin" })}
                              disabled={roleMutation.isPending}
                            >
                              <Crown className="w-3 h-3" />
                              Promouvoir admin
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 h-7 text-xs text-muted-foreground"
                              onClick={() => roleMutation.mutate({ id: u.id, role: "user" })}
                              disabled={roleMutation.isPending}
                            >
                              <ShieldBan className="w-3 h-3" />
                              Révoquer admin
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmDelete(u)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {u.id === user?.id && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Vous</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserX className="w-5 h-5" />
              Supprimer le compte
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Voulez-vous vraiment supprimer le compte de <strong>{confirmDelete?.name}</strong> ({confirmDelete?.email}) ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
              className="gap-2"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
