import { useState } from "react";
import { useParams } from "wouter";
import { useGetKnowledgeDocs, useAddKnowledgeDoc, useDeleteKnowledgeDoc, getGetKnowledgeDocsQueryKey, useGetAgent, getGetAgentQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Trash2, UploadCloud, Plus, Loader2 } from "lucide-react";

export default function AgentKnowledge() {
  const { id } = useParams();
  const agentId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agent } = useGetAgent(agentId, { query: { enabled: !!agentId, queryKey: getGetAgentQueryKey(agentId) } });
  const { data: docs, isLoading } = useGetKnowledgeDocs(agentId, { query: { enabled: !!agentId, queryKey: getGetKnowledgeDocsQueryKey(agentId) } });

  const addDoc = useAddKnowledgeDoc();
  const deleteDoc = useDeleteKnowledgeDoc();

  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      addDoc.mutate({
        agentId,
        data: {
          name: file.name,
          type: file.type || "text/plain",
          size: file.size,
          content: text,
        }
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetKnowledgeDocsQueryKey(agentId) });
          toast({ title: "Document ajouté à la base de connaissance" });
          setUploading(false);
          e.target.value = "";
        },
        onError: () => {
          toast({ title: "Erreur lors de l'ajout du document", variant: "destructive" });
          setUploading(false);
        }
      });
    } catch {
      toast({ title: "Impossible de lire ce fichier", variant: "destructive" });
      setUploading(false);
    }
  };

  const handleManualSave = () => {
    if (!manualName.trim() || !manualContent.trim()) {
      toast({ title: "Nom et contenu requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    addDoc.mutate({
      agentId,
      data: {
        name: manualName,
        type: "text/plain",
        size: new Blob([manualContent]).size,
        content: manualContent,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetKnowledgeDocsQueryKey(agentId) });
        toast({ title: "Document ajouté" });
        setManualName("");
        setManualContent("");
        setDialogOpen(false);
        setSaving(false);
      },
      onError: () => {
        toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" });
        setSaving(false);
      }
    });
  };

  const handleDelete = (docId: number) => {
    if (confirm("Supprimer ce document de la base de connaissance ?")) {
      deleteDoc.mutate({ agentId, docId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetKnowledgeDocsQueryKey(agentId) });
          toast({ title: "Document supprimé" });
        }
      });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(2) + " Mo";
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Base de connaissance</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez des documents pour enrichir les connaissances de <strong>{agent?.name || "l'agent"}</strong>.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Ajouter manuellement
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Importer un fichier</CardTitle>
            <CardDescription>TXT, CSV et fichiers texte supportés.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors ${dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/10 hover:bg-muted/20"}`}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload({ target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
              }}
            >
              <UploadCloud className={`w-8 h-8 mb-3 ${dragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-1">{dragging ? "Relâchez pour importer" : "Cliquez ou glissez un fichier"}</p>
              <p className="text-xs text-muted-foreground">Max 10 Mo — TXT, CSV</p>
              <Input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                disabled={uploading}
                accept=".txt,.csv,.md"
              />
              {uploading && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
                  <span className="text-xs font-medium">Traitement en cours...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Documents indexés ({docs?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du document</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2].map(i => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : docs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p>Aucun document ajouté.</p>
                      <p className="text-xs mt-1">Importez un fichier ou saisissez du contenu manuellement.</p>
                    </TableCell>
                  </TableRow>
                ) : docs?.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-xs">{doc.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatSize(doc.size)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(doc.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter du contenu manuellement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nom du document *</Label>
              <Input
                placeholder="FAQ, Politique de retour, Guide produit..."
                value={manualName}
                onChange={e => setManualName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contenu *</Label>
              <Textarea
                rows={8}
                placeholder="Saisissez ici le texte que l'agent devra connaître..."
                value={manualContent}
                onChange={e => setManualContent(e.target.value)}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">{manualContent.length} caractères</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleManualSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
