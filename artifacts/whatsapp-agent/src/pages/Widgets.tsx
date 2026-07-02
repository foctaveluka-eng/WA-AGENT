import { useGetWidgets, useCreateWidget, useDeleteWidget, getGetWidgetsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Blocks, Trash2, Copy, Plus, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phoneNumber: z.string().min(1, "Le numéro de téléphone est requis"),
  welcomeText: z.string().min(1, "Le message d'accueil est requis"),
  buttonColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/i, "Couleur hexadécimale invalide"),
  buttonText: z.string().optional(),
  position: z.enum(["bottom-right", "bottom-left"]).default("bottom-right"),
});

export default function Widgets() {
  const { data: widgets, isLoading } = useGetWidgets();
  const createWidget = useCreateWidget();
  const deleteWidget = useDeleteWidget();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      welcomeText: "Bonjour ! Comment puis-je vous aider ?",
      buttonColor: "#25D366",
      buttonText: "Discuter sur WhatsApp",
      position: "bottom-right",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createWidget.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWidgetsQueryKey() });
        toast({ title: "Widget créé avec succès" });
        setOpen(false);
        form.reset();
      },
      onError: () => toast({ title: "Erreur lors de la création", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Supprimer ce widget ?")) {
      deleteWidget.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWidgetsQueryKey() });
          toast({ title: "Widget supprimé" });
        }
      });
    }
  };

  const getEmbedCode = (widgetId: number) => {
    const domain = window.location.origin;
    return `<script src="${domain}/widget.js" data-id="${widgetId}" async></script>`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Code copié dans le presse-papiers" });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight">Widgets WhatsApp</h1>
          <p className="text-muted-foreground mt-1 text-xs md:text-sm">Créez des boutons de chat intégrables pour votre site web.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1.5 shrink-0 text-sm">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Créer un widget</span>
              <span className="sm:hidden">Créer</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nouveau widget WhatsApp</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom interne</FormLabel>
                      <FormControl><Input placeholder="Ex: Page d'accueil" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro WhatsApp (avec indicatif pays)</FormLabel>
                      <FormControl><Input placeholder="+33612345678" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="welcomeText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message d'accueil popup</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buttonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texte du bouton</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buttonColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couleur (hex)</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-10 p-1 h-10" {...field} />
                            <Input className="flex-1 font-mono uppercase" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Position sur l'écran</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="bottom-right">Bas droite</SelectItem>
                          <SelectItem value="bottom-left">Bas gauche</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit" disabled={createWidget.isPending}>Créer</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-[250px] w-full" />)
        ) : widgets?.length === 0 ? (
          <div className="col-span-full py-16 text-center border rounded-lg bg-card text-muted-foreground">
            <Blocks className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">Aucun widget</h3>
            <p className="text-sm">Créez un widget pour intégrer WhatsApp sur votre site.</p>
          </div>
        ) : widgets?.map(widget => (
          <Card key={widget.id} className="flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{widget.name}</CardTitle>
                <Badge variant={widget.isActive ? 'default' : 'secondary'}>
                  {widget.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1">
                <span>{widget.phoneNumber}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Position :</span>
                <span className="font-medium">{widget.position === "bottom-right" ? "Bas droite" : "Bas gauche"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Couleur :</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border" style={{ backgroundColor: widget.buttonColor }} />
                  <span className="font-mono text-xs">{widget.buttonColor}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Message :</span>
                <span className="text-xs truncate max-w-[160px]">{widget.welcomeText}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t flex flex-col gap-3">
              <div className="w-full relative">
                <div className="text-xs font-semibold mb-1 text-muted-foreground">Code d'intégration</div>
                <div className="bg-muted p-2 rounded text-xs font-mono break-all pr-8 border">
                  {getEmbedCode(widget.id)}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 bottom-1 h-6 w-6 text-muted-foreground"
                  onClick={() => copyToClipboard(getEmbedCode(widget.id))}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-8 gap-1"
                  asChild
                >
                  <a
                    href={`https://wa.me/${widget.phoneNumber?.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Tester
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 text-xs h-8 gap-1"
                  onClick={() => handleDelete(widget.id)}
                >
                  <Trash2 className="w-3 h-3" />
                  Supprimer
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
