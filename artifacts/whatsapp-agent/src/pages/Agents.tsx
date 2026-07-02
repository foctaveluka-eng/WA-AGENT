import { useGetAgents, useDeleteAgent, getGetAgentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Bot, Pencil, Trash2, BookOpen, Phone, PhoneOff, Zap, ZapOff } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Agents() {
  const { data: agents, isLoading } = useGetAgents();
  const deleteAgent = useDeleteAgent();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Supprimer l'agent "${name}" ? Cette action est irréversible.`)) {
      deleteAgent.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAgentsQueryKey() });
          toast({ title: "Agent supprimé" });
        }
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Agents IA</h1>
          <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">Vos assistants WhatsApp intelligents, disponibles 24h/24.</p>
        </div>
        <Link href="/agents/new">
          <Button className="gap-1.5 bg-green-500 hover:bg-green-600 shrink-0 text-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Créer un agent</span>
            <span className="sm:hidden">Créer</span>
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      ) : agents?.length === 0 ? (
        <div className="col-span-full py-20 text-center border rounded-xl bg-card">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Aucun agent créé</h3>
          <p className="text-sm text-muted-foreground mb-6">Créez votre premier agent IA pour répondre automatiquement sur WhatsApp.</p>
          <Link href="/agents/new">
            <Button className="gap-2 bg-green-500 hover:bg-green-600">
              <Plus className="w-4 h-4" /> Créer mon premier agent
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map(agent => (
            <Card key={agent.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold leading-tight">{agent.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.model}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge
                        className={agent.isActive
                          ? "bg-emerald-100 text-emerald-700 border-0 text-[10px]"
                          : "bg-gray-100 text-gray-500 border-0 text-[10px]"}
                      >
                        {agent.isActive ? <><Zap className="w-2.5 h-2.5 mr-1" />Actif</> : <><ZapOff className="w-2.5 h-2.5 mr-1" />Inactif</>}
                      </Badge>
                    </div>
                  </div>

                  {/* WhatsApp status */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                    agent.whatsappConnected
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-gray-50 text-gray-500 border border-gray-100"
                  }`}>
                    {agent.whatsappConnected
                      ? <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><Phone className="w-3 h-3" />{agent.whatsappPhone ? `+${agent.whatsappPhone}` : "WhatsApp connecté"}</>
                      : <><div className="w-2 h-2 rounded-full bg-gray-300" /><PhoneOff className="w-3 h-3" />WhatsApp non connecté</>}
                  </div>

                  {/* Prompt preview */}
                  {agent.prompt && (
                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                      {agent.prompt.slice(0, 100)}…
                    </p>
                  )}
                </div>

                {/* Footer actions */}
                <div className="border-t px-4 py-3 flex items-center gap-2 bg-muted/20">
                  <Link href={`/agents/${agent.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
                      <Pencil className="w-3 h-3" /> Configurer
                    </Button>
                  </Link>
                  <Link href={`/agents/${agent.id}/knowledge`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs px-2.5 gap-1">
                      <BookOpen className="w-3 h-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(agent.id, agent.name)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
