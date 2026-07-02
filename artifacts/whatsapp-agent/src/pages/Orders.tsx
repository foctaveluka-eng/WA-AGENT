import { useState } from "react";
import { useGetOrders, useGetOrdersStats, useUpdateOrder, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = { pending: "En attente", confirmed: "Confirmé", shipped: "Expédié", delivered: "Livré", cancelled: "Annulé" };
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-transparent",
  confirmed: "bg-blue-100 text-blue-800 border-transparent",
  shipped: "bg-indigo-100 text-indigo-800 border-transparent",
  delivered: "bg-green-100 text-green-800 border-transparent",
  cancelled: "bg-red-100 text-red-800 border-transparent",
};

export default function Orders() {
  const { data: orders, isLoading } = useGetOrders();
  const { data: stats, isLoading: statsLoading } = useGetOrdersStats();
  const updateOrder = useUpdateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<number | null>(null);

  const handleStatusChange = (id: number, status: string) => {
    setUpdating(id);
    updateOrder.mutate({ id, data: { status: status as "pending"|"confirmed"|"shipped"|"delivered"|"cancelled" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
        toast({ title: "Statut mis à jour" });
      },
      onError: () => toast({ title: "Erreur", variant: "destructive" }),
      onSettled: () => setUpdating(null),
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Commandes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Suivez les ventes issues de WhatsApp.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statsLoading ? (
          [1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)
        ) : stats ? (
          <>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">Aujourd'hui</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold">{stats.todayOrders}</div></CardContent></Card>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">CA Total</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-xl md:text-2xl font-bold">{stats.totalRevenue.toFixed(2)} €</div></CardContent></Card>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">CA Confirmé</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-xl md:text-2xl font-bold text-primary">{stats.confirmedRevenue.toFixed(2)} €</div></CardContent></Card>
            <Card><CardHeader className="pb-2 p-4"><CardTitle className="text-xs font-medium text-muted-foreground">En attente</CardTitle></CardHeader><CardContent className="p-4 pt-0"><div className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</div></CardContent></Card>
          </>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1,2,3].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32 mb-2" /><Skeleton className="h-3 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-foreground mb-1">Aucune commande</p>
                      <p className="text-sm">Les commandes apparaîtront ici quand vos agents en recevront.</p>
                    </TableCell>
                  </TableRow>
                ) : orders?.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{order.leadName}</div>
                      <div className="text-xs text-muted-foreground">{order.leadPhone}</div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[120px] truncate">{order.productName}</TableCell>
                    <TableCell className="font-medium text-sm whitespace-nowrap">{order.amount.toFixed(2)} €</TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={v => handleStatusChange(order.id, v)}
                        disabled={updating === order.id}
                      >
                        <SelectTrigger className={`h-7 text-xs w-32 border ${STATUS_STYLE[order.status] ?? ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
