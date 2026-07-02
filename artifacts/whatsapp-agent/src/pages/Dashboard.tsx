import { useGetDashboardStats, useGetLeadsChart, useGetAgents, useGetConversations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Users, MessageSquare, ShoppingCart, TrendingUp, TrendingDown, Plus, ArrowRight, Zap, Phone, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";

function StatCard({ title, value, icon: Icon, colorClass, trend, trendLabel, loading }: {
  title: string; value: string | number; icon: React.ElementType;
  colorClass: string; trend?: number; trendLabel?: string; loading?: boolean;
}) {
  if (loading) return <Card><CardContent className="p-4 md:p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs md:text-sm font-medium text-muted-foreground">{title}</span>
          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${colorClass}`}>
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
        </div>
        <div className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{value}</div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend >= 0 ? "+" : ""}{trend} {trendLabel}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const USE_CASES = [
  { emoji: "🛍️", label: "Vendeurs", desc: "Présentez vos produits, répondez aux questions prix et livraison 24h/24" },
  { emoji: "📱", label: "Marketing Digital", desc: "Qualifiez vos leads, suivez vos campagnes, automatisez vos follow-ups" },
  { emoji: "🍽️", label: "Restaurants", desc: "Prenez les commandes, réservations et FAQ menu automatiquement" },
  { emoji: "💇", label: "Salons & Spas", desc: "Gérez les réservations, rappels et promotions sans effort" },
  { emoji: "🏠", label: "Immobilier", desc: "Qualifiez les acheteurs, planifiez les visites, envoyez les annonces" },
  { emoji: "🔧", label: "SAV & Support", desc: "Traitez les réclamations, suivez les tickets, réduisez l'attente" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useGetLeadsChart();
  const { data: agents } = useGetAgents();
  const { data: conversations } = useGetConversations();

  const connectedAgents = agents?.filter(a => a.whatsappConnected) ?? [];
  const activeConvs = conversations?.filter(c => c.mode === "automatic") ?? [];
  const manualConvs = conversations?.filter(c => c.mode === "manual") ?? [];

  const firstName = user?.name?.split(" ")[0] ?? "là";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">{greeting}, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-0.5 text-xs md:text-sm">Voici ce qui se passe sur votre plateforme aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/agents/new">
            <Button size="sm" className="gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nouvel agent</span>
              <span className="sm:hidden">Agent</span>
            </Button>
          </Link>
          <Link href="/conversations">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs hidden sm:flex">
              <MessageSquare className="w-3.5 h-3.5" /> Conversations
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Agents IA" value={stats?.totalAgents ?? 0} icon={Bot} colorClass="bg-violet-100 text-violet-600" loading={statsLoading} />
        <StatCard title="Leads générés" value={stats?.totalLeads ?? 0} icon={Users} colorClass="bg-blue-100 text-blue-600" trend={stats?.leadsLast7Days} trendLabel="cette semaine" loading={statsLoading} />
        <StatCard title="Conversations" value={stats?.totalConversations ?? 0} icon={MessageSquare} colorClass="bg-emerald-100 text-emerald-600" loading={statsLoading} />
        <StatCard title="Commandes" value={stats?.totalOrders ?? 0} icon={ShoppingCart} colorClass="bg-orange-100 text-orange-600" loading={statsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Leads — 7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartLoading ? <Skeleton className="h-[180px] md:h-[220px] w-full" /> : (
              <div className="h-[180px] md:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData ?? []}>
                    <defs>
                      <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} fill="url(#leadsGrad)" dot={{ fill: "#22c55e", r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Statut en direct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span>Agents connectés</span></div>
                <span className="font-bold">{connectedAgents.length}/{agents?.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><Bot className="w-3.5 h-3.5 text-violet-500" /><span>IA active</span></div>
                <span className="font-bold">{activeConvs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-orange-500" /><span>Mode manuel</span></div>
                <span className="font-bold">{manualConvs.length}</span>
              </div>
              <div className="pt-2 border-t">
                {connectedAgents.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />Système opérationnel</div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 font-medium"><AlertCircle className="w-3.5 h-3.5" />Aucun agent connecté</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm md:text-base flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" />Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/agents/new", icon: Bot, label: "Créer un agent" },
                { href: "/products", icon: ShoppingCart, label: "Ajouter un produit" },
                { href: "/leads", icon: Users, label: "Voir les leads" },
                { href: "/templates", icon: MessageSquare, label: "Modèles de messages" },
              ].map(item => (
                <Link key={item.href} href={item.href}>
                  <Button variant="outline" size="sm" className="w-full justify-between mb-0 text-xs">
                    <span className="flex items-center gap-2"><item.icon className="w-3.5 h-3.5" />{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Use cases (only if no agents yet) */}
      {(!agents || agents.length === 0) && (
        <Card className="border-dashed bg-muted/20">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Commencez par votre secteur d'activité</CardTitle>
            <p className="text-xs md:text-sm text-muted-foreground">Des templates prêts à l'emploi — démarrez en 2 minutes</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {USE_CASES.map(uc => (
                <Link key={uc.label} href="/agents/new">
                  <div className="cursor-pointer p-3 md:p-4 rounded-xl border bg-card hover:border-green-400 hover:shadow-sm transition-all">
                    <div className="text-xl md:text-2xl mb-2">{uc.emoji}</div>
                    <div className="font-semibold text-xs md:text-sm mb-1">{uc.label}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed hidden sm:block">{uc.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents list */}
      {agents && agents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm md:text-base flex items-center gap-2"><Bot className="w-4 h-4 text-violet-500" />Mes agents</CardTitle>
              <Link href="/agents"><Button variant="ghost" size="sm" className="gap-1 text-xs h-7">Tous <ArrowRight className="w-3 h-3" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {agents.slice(0, 5).map(agent => (
                <div key={agent.id} className="flex items-center justify-between py-3 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{agent.name}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{agent.model}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {agent.whatsappConnected
                      ? <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] hidden sm:flex"><Phone className="w-2.5 h-2.5 mr-1" />Connecté</Badge>
                      : <Badge variant="secondary" className="text-[10px] hidden sm:flex">Non connecté</Badge>}
                    <Link href={`/agents/${agent.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Config.</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
