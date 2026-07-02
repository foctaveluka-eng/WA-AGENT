import { useGetAgents } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, Phone, Wifi, WifiOff, ExternalLink, MessageSquare, AlertTriangle, ShoppingCart, UserCheck, Zap } from "lucide-react";
import { Link } from "wouter";

const NOTIFICATION_EVENTS = [
  { icon: MessageSquare, label: "Nouveau contact", desc: "Quand un inconnu envoie son premier message à l'agent", color: "text-blue-500" },
  { icon: ShoppingCart, label: "Nouvelle commande", desc: "Quand l'IA détecte et enregistre une commande", color: "text-green-500" },
  { icon: Bell, label: "Nouveau rendez-vous", desc: "Quand l'IA confirme et enregistre un rendez-vous", color: "text-purple-500" },
  { icon: UserCheck, label: "Prise en main humaine", desc: "Quand vous basculez une conversation en mode manuel", color: "text-orange-500" },
  { icon: AlertTriangle, label: "Erreur IA", desc: "Quand l'IA rencontre une erreur technique", color: "text-red-500" },
  { icon: Zap, label: "Déconnexion WhatsApp", desc: "Quand un agent perd sa connexion WhatsApp", color: "text-amber-500" },
];

export default function Notifications() {
  const { data: agents = [], isLoading } = useGetAgents();

  const agentsWithPhone = agents.filter(a => a.notificationPhone?.trim());
  const agentsWithoutPhone = agents.filter(a => !a.notificationPhone?.trim());

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight flex items-center gap-2 md:gap-3">
          <Bell className="w-5 h-5 md:w-8 md:h-8 text-primary shrink-0" />
          Notifications
        </h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">
          Toutes les alertes sont envoyées par <strong>WhatsApp</strong> au numéro administrateur configuré dans les paramètres avancés de chaque agent.
        </p>
      </div>

      {/* How it works */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Comment ça fonctionne
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Pour chaque agent, vous pouvez définir un <strong className="text-foreground">numéro de notification WhatsApp</strong> dans l'onglet <strong className="text-foreground">Avancé</strong> des paramètres de l'agent.</p>
          <p>Dès qu'un événement se produit (nouveau contact, commande, erreur…), l'agent envoie automatiquement un message WhatsApp à ce numéro.</p>
          <p className="text-xs">Le numéro peut être le vôtre, ou un numéro de groupe WhatsApp — il doit être joignable via WhatsApp.</p>
        </CardContent>
      </Card>

      {/* Events that trigger notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Événements déclencheurs</CardTitle>
          <CardDescription>Ces événements envoient automatiquement une notification WhatsApp.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {NOTIFICATION_EVENTS.map(ev => (
            <div key={ev.label} className="flex items-start gap-3 rounded-lg border p-3">
              <ev.icon className={`w-4 h-4 mt-0.5 shrink-0 ${ev.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{ev.label}</p>
                <p className="text-xs text-muted-foreground">{ev.desc}</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Agents status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Statut par agent</CardTitle>
          <CardDescription>Agents avec un numéro de notification configuré.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />)}
            </div>
          )}

          {!isLoading && agents.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              Aucun agent créé. <Link href="/agents"><span className="text-primary underline cursor-pointer">Créer un agent</span></Link>
            </div>
          )}

          {agentsWithPhone.map(agent => (
            <div key={agent.id} className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{agent.name}</p>
                <p className="text-xs text-green-700 font-mono">+{agent.notificationPhone?.replace(/\D/g, "")}</p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs shrink-0">Actif</Badge>
            </div>
          ))}

          {agentsWithoutPhone.map(agent => (
            <div key={agent.id} className="flex items-center gap-3 rounded-lg border border-dashed p-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-muted-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">Aucun numéro configuré</p>
              </div>
              <Link href={`/agents/${agent.id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0">
                  <ExternalLink className="w-3 h-3" />
                  Configurer
                </Button>
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
