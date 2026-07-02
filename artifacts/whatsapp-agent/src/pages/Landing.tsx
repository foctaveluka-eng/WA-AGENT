import { Link } from "wouter";
import { Bot, Zap, Calendar, ShoppingCart, Users, BarChart3, Shield, MessageSquare, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Bot,
    title: "Agents IA autonomes",
    desc: "Créez des agents WhatsApp qui répondent automatiquement à vos clients 24h/24, 7j/7.",
    color: "bg-green-100 text-green-700",
  },
  {
    icon: Calendar,
    title: "Prise de rendez-vous automatique",
    desc: "L'IA prend les rendez-vous, les confirme et les enregistre dans votre agenda en temps réel.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: ShoppingCart,
    title: "Commandes via WhatsApp",
    desc: "Vos clients commandent directement dans le chat. Chaque commande est notifiée et enregistrée.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: Users,
    title: "Prise en main humaine",
    desc: "Intervenez à tout moment pour reprendre la main sur une conversation, puis réactivez l'IA.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: BarChart3,
    title: "Tableau de bord complet",
    desc: "Suivez vos leads, commandes, rendez-vous et statistiques en temps réel depuis un seul endroit.",
    color: "bg-pink-100 text-pink-700",
  },
  {
    icon: Shield,
    title: "Base de connaissances privée",
    desc: "L'agent ne propose que vos produits et services. Aucune invention, aucune improvisation.",
    color: "bg-teal-100 text-teal-700",
  },
];

const highlights = [
  "Réponses automatiques en quelques secondes",
  "Gestion multi-agents et multi-numéros",
  "Notifications WhatsApp instantanées",
  "Connexion via QR code, sans API officielle",
  "Catalogue produits intégré à l'IA",
  "Interface entièrement en français",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">WA Agent</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Se connecter</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                Commencer gratuitement
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center bg-gradient-to-b from-green-50/60 to-background">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6 border border-green-200">
          <Zap className="w-3.5 h-3.5" />
          Plateforme IA WhatsApp tout-en-un
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-3xl mb-6 leading-tight">
          Automatisez votre
          <span className="text-green-600"> WhatsApp </span>
          avec l'IA
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Connectez votre numéro WhatsApp, définissez votre prompt, et laissez votre agent répondre à vos clients, prendre leurs rendez-vous et enregistrer leurs commandes — automatiquement.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-14">
          <Link href="/register">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white gap-2 px-8 h-12 text-base shadow-lg shadow-green-200">
              Créer mon compte gratuit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              J'ai déjà un compte
            </Button>
          </Link>
        </div>

        {/* Social proof / highlights */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl w-full">
          {highlights.map((h) => (
            <div key={h} className="flex items-start gap-2 text-left text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>{h}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Une plateforme complète pour automatiser votre relation client sur WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Opérationnel en 3 étapes
          </h2>
          <p className="text-muted-foreground text-lg mb-14">
            Pas de configuration complexe. Pas d'API officielle à configurer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Créez votre agent", desc: "Donnez un nom à votre agent et écrivez son prompt — définissez son comportement et ses réponses." },
              { step: "2", title: "Scannez le QR code", desc: "Connectez votre numéro WhatsApp en scannant le QR code depuis votre téléphone." },
              { step: "3", title: "C'est parti !", desc: "Votre agent répond automatiquement, prend des rendez-vous et enregistre les commandes." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-green-200">
                  {s.step}
                </div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="py-16 px-6 bg-green-600 text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à automatiser votre WhatsApp ?</h2>
        <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
          Rejoignez WA Agent et commencez à répondre à vos clients automatiquement dès aujourd'hui.
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 gap-2 px-10 h-12 text-base font-semibold shadow-xl">
            Créer mon compte gratuit
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-green-500 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-medium text-foreground">WA Agent</span>
        </div>
        <p>Plateforme d'agents WhatsApp IA — Tous droits réservés</p>
      </footer>
    </div>
  );
}
