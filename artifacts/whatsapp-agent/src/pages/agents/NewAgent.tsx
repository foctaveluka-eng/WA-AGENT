import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateAgent } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Bot, Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "vendeur",
    emoji: "🛍️",
    label: "Vendeur / E-commerce",
    desc: "Idéal pour présenter vos produits, répondre aux questions sur les prix, disponibilités et livraisons.",
    name: "Assistant Vente",
    style: "direct" as const,
    prompt: `Tu es un assistant commercial WhatsApp. Ton rôle est d'aider les clients à choisir et acheter nos produits.

Comportement :
- Accueille chaleureusement chaque client
- Présente les produits de façon claire avec les prix
- Réponds aux questions sur les délais de livraison, modes de paiement, et retours
- Si un client est intéressé, guide-le vers le passage à la commande
- Sois enthousiaste mais pas envahissant
- Réponds toujours en français
- Reste concis (2-4 phrases max par réponse)`,
  },
  {
    id: "marketing",
    emoji: "📱",
    label: "Marketing Digital",
    desc: "Qualifiez vos leads, répondez aux demandes de devis et automatisez vos campagnes.",
    name: "Assistant Marketing",
    style: "normal" as const,
    prompt: `Tu es un assistant marketing digital. Tu aides les prospects à en savoir plus sur nos services de marketing.

Comportement :
- Qualifie les besoins du prospect (budget, objectif, secteur)
- Présente nos offres de services (réseaux sociaux, SEO, publicité, contenu)
- Propose des cas concrets et des résultats
- Oriente vers une consultation gratuite si le prospect est qualifié
- Collecte les informations de contact pour un suivi
- Reste professionnel et axé résultats
- Réponds en français`,
  },
  {
    id: "restaurant",
    emoji: "🍽️",
    label: "Restaurant / Cuisine",
    desc: "Prenez les commandes, gérez les réservations et répondez aux questions sur le menu.",
    name: "Assistant Restaurant",
    style: "normal" as const,
    prompt: `Tu es l'assistant WhatsApp d'un restaurant. Tu aides les clients pour les commandes, réservations et informations.

Comportement :
- Accueille les clients et présente le menu à la demande
- Prends les commandes à emporter ou les réservations (nom, heure, nombre de personnes)
- Réponds aux questions sur les allergènes, plats végétariens, horaires d'ouverture
- Confirme les commandes avec un récapitulatif
- Communique les délais estimés
- Sois chaleureux et appétissant dans tes descriptions
- Réponds en français`,
  },
  {
    id: "salon",
    emoji: "💇",
    label: "Salon de Beauté / Spa",
    desc: "Gérez les prises de rendez-vous, rappels clients et promotions.",
    name: "Assistant Beauté",
    style: "normal" as const,
    prompt: `Tu es l'assistant WhatsApp d'un salon de beauté ou spa. Tu gères les réservations et informations clients.

Comportement :
- Présente nos services et tarifs à la demande
- Prends les rendez-vous (service souhaité, date/heure, nom)
- Informe sur les promotions en cours et forfaits
- Rappelle les préparations nécessaires avant certains soins
- Réponds aux questions sur les produits utilisés
- Sois attentionné et soucieux du bien-être du client
- Réponds en français`,
  },
  {
    id: "immobilier",
    emoji: "🏠",
    label: "Immobilier",
    desc: "Qualifiez les acheteurs/locataires, planifiez les visites et envoyez des annonces.",
    name: "Assistant Immobilier",
    style: "pedagogical" as const,
    prompt: `Tu es un assistant immobilier WhatsApp. Tu aides les prospects acheteurs et locataires.

Comportement :
- Qualifie le projet (achat/location, budget, surface, quartier souhaité)
- Présente les biens correspondants disponibles
- Planifie des visites (date, heure, adresse)
- Réponds aux questions sur les démarches, financement, copropriété
- Collecte les informations de contact pour un suivi personnalisé
- Sois professionnel et expert
- Réponds en français`,
  },
  {
    id: "coaching",
    emoji: "🎓",
    label: "Formation / Coaching",
    desc: "Présentez vos programmes, qualifiez les candidats et gérez les inscriptions.",
    name: "Assistant Formation",
    style: "pedagogical" as const,
    prompt: `Tu es un assistant pour un centre de formation ou de coaching. Tu aides les prospects à trouver la formation adaptée.

Comportement :
- Identifie les objectifs et besoins d'apprentissage du prospect
- Présente les programmes disponibles avec durée, contenu et tarifs
- Réponds aux questions sur les modalités (présentiel/distanciel, certification)
- Guide vers l'inscription ou une session d'information gratuite
- Sois encourageant et pédagogique
- Réponds en français`,
  },
  {
    id: "sav",
    emoji: "🔧",
    label: "SAV & Support",
    desc: "Traitez les réclamations, suivez les tickets et réduisez le temps d'attente.",
    name: "Agent Support",
    style: "direct" as const,
    prompt: `Tu es un agent de support client et SAV. Tu aides les clients à résoudre leurs problèmes rapidement.

Comportement :
- Accueille le client et recueille les informations sur son problème
- Vérifie la commande ou le produit concerné (numéro de commande, référence)
- Propose des solutions immédiates pour les problèmes courants
- Escalade vers un humain si le problème est complexe
- Collecte les informations pour créer un ticket de suivi
- Sois empathique, patient et orienté solutions
- Réponds en français`,
  },
  {
    id: "livraison",
    emoji: "📦",
    label: "Livraison & Logistique",
    desc: "Informez sur les statuts de commandes, délais et points de retrait.",
    name: "Assistant Livraison",
    style: "direct" as const,
    prompt: `Tu es un assistant logistique et livraison. Tu aides les clients à suivre leurs colis et commandes.

Comportement :
- Demande le numéro de commande ou de suivi
- Informe sur le statut de livraison et délais estimés
- Explique la procédure en cas de problème (colis perdu, endommagé, retard)
- Indique les points de retrait disponibles si nécessaire
- Gère les demandes de modification d'adresse ou de créneaux
- Sois précis, efficace et rassurant
- Réponds en français`,
  },
  {
    id: "fitness",
    emoji: "🏋️",
    label: "Fitness & Sport",
    desc: "Gérez les inscriptions, programmes d'entraînement et suivi clients.",
    name: "Coach Assistant",
    style: "normal" as const,
    prompt: `Tu es un assistant pour une salle de sport ou un coach fitness. Tu aides les clients avec leurs objectifs sportifs.

Comportement :
- Identifie les objectifs du client (perte de poids, musculation, endurance, bien-être)
- Présente les offres d'abonnement, cours collectifs et coaching personnalisé
- Réponds aux questions sur les horaires, équipements, cours disponibles
- Encourage et motive les clients dans leur parcours
- Propose des conseils nutritionnels de base
- Sois dynamique, positif et bienveillant
- Réponds en français`,
  },
  {
    id: "sante",
    emoji: "🏥",
    label: "Santé & Médical",
    desc: "Prenez les rendez-vous, répondez aux FAQ et orientez les patients.",
    name: "Assistant Médical",
    style: "pedagogical" as const,
    prompt: `Tu es un assistant administratif pour un cabinet médical ou une clinique. Tu aides les patients.

Comportement :
- Aide à prendre ou modifier des rendez-vous
- Donne des informations sur les spécialités, praticiens et horaires
- Réponds aux questions administratives (carte vitale, ordonnances, documents)
- Oriente vers le bon service ou spécialiste
- En cas d'urgence, redirige vers les services d'urgence (15, 18)
- Ne donne pas de conseils médicaux
- Sois rassurant, clair et professionnel
- Réponds en français`,
  },
  {
    id: "custom",
    emoji: "✨",
    label: "Agent personnalisé",
    desc: "Créez votre agent sur-mesure avec votre propre prompt et configuration.",
    name: "",
    style: "normal" as const,
    prompt: "",
  },
];

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  model: z.string().min(1, "Le modèle est requis"),
  communicationStyle: z.enum(["amical", "normal", "direct", "pedagogical"]),
  prompt: z.string().min(1, "Le prompt système est requis"),
  language: z.string().default("fr"),
  timezone: z.string().optional(),
  responseDelay: z.coerce.number().min(0).max(300).default(20),
  emojiReactions: z.boolean().default(false),
});

export default function NewAgent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createAgent = useCreateAgent();
  const [step, setStep] = useState<"template" | "config">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      model: "gpt-4o-mini",
      communicationStyle: "amical",
      prompt: "",
      language: "fr",
      timezone: "Africa/Abidjan",
      responseDelay: 20,
      emojiReactions: false,
    },
  });

  const handleTemplateSelect = (tpl: typeof TEMPLATES[0]) => {
    setSelectedTemplate(tpl.id);
    form.setValue("name", tpl.name);
    form.setValue("communicationStyle", tpl.style);
    form.setValue("prompt", tpl.prompt);
  };

  const handleContinue = () => {
    if (!selectedTemplate) return;
    setStep("config");
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createAgent.mutate({ data: values }, {
      onSuccess: (agent) => {
        toast({ title: "Agent créé avec succès !" });
        setLocation(`/agents/${agent.id}`);
      },
      onError: () => {
        toast({ title: "Erreur lors de la création", variant: "destructive" });
      }
    });
  };

  if (step === "template") {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/agents")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Retour
          </Button>
        </div>

        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mb-4">
            <Sparkles className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Quel type d'agent voulez-vous créer ?</h1>
          <p className="text-muted-foreground text-sm">Choisissez un template adapté à votre activité. Vous pourrez tout personnaliser ensuite.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map(tpl => (
            <div
              key={tpl.id}
              onClick={() => handleTemplateSelect(tpl)}
              className={cn(
                "cursor-pointer p-4 rounded-xl border-2 bg-card transition-all hover:shadow-sm",
                selectedTemplate === tpl.id
                  ? "border-green-500 bg-green-50"
                  : "border-border hover:border-muted-foreground/30"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{tpl.emoji}</span>
                {selectedTemplate === tpl.id && (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="font-semibold text-sm mb-1">{tpl.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{tpl.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className="gap-2 bg-green-500 hover:bg-green-600 px-8"
          >
            Continuer <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStep("template")} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
        <div className="text-sm text-muted-foreground">
          Template : <Badge variant="secondary">{TEMPLATES.find(t => t.id === selectedTemplate)?.label}</Badge>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurer votre agent</h1>
        <p className="text-muted-foreground mt-1 text-sm">Personnalisez les paramètres de votre agent IA.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4" />Identité de l'agent</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'agent *</FormLabel>
                  <FormControl><Input placeholder="Ex: Assistant Vente" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem>
                  <FormLabel>Modèle IA</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o mini — Rapide & économique</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o — Plus puissant</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="communicationStyle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Style de communication</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="amical">Amical — Chaleureux et sympa</SelectItem>
                      <SelectItem value="normal">Normal — Amical et utile</SelectItem>
                      <SelectItem value="direct">Direct — Concis et efficace</SelectItem>
                      <SelectItem value="pedagogical">Pédagogique — Explique étape par étape</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="responseDelay" render={({ field }) => (
                <FormItem>
                  <FormLabel>Délai de réponse (sec)</FormLabel>
                  <FormControl><Input type="number" min={0} max={60} {...field} /></FormControl>
                  <FormDescription className="text-xs">Simule le temps de frappe humain (0 = immédiat)</FormDescription>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Instructions système</CardTitle>
              <CardDescription className="text-xs">Définissez le comportement, la personnalité et les règles de votre agent.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField control={form.control} name="prompt" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Tu es un assistant WhatsApp pour..."
                      className="min-h-[180px] resize-y font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-xs mt-2">
                    Soyez précis : décrivez le rôle, le ton, les sujets à traiter et à éviter.
                  </FormDescription>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={() => setStep("template")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Retour
            </Button>
            <Button type="submit" disabled={createAgent.isPending} className="gap-2 bg-green-500 hover:bg-green-600">
              {createAgent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Créer l'agent
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
