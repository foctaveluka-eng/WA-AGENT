import { useGetApiKeys, useCreateApiKey, useDeleteApiKey, getGetApiKeysQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Trash2, Copy, AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function ApiKeys() {
  const { data: keys, isLoading } = useGetApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    createKey.mutate({ data: { name: newKeyName } }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetApiKeysQueryKey() });
        if (res.fullKey) setCreatedKey(res.fullKey);
        setNewKeyName("");
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this API key? Integrations using it will fail.")) {
      deleteKey.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetApiKeysQueryKey() });
          toast({ title: "API key deleted" });
        }
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Manage secret keys for programmatic access to your agents.</p>
      </div>

      <Dialog open={!!createdKey} onOpenChange={(open) => !open && setCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store your new API key</DialogTitle>
            <DialogDescription className="text-destructive font-medium flex items-center gap-2 mt-2">
              <AlertTriangle className="w-4 h-4" />
              This key will only be shown once. Please store it securely.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-md font-mono text-sm border flex items-center justify-between mt-4">
            <span className="truncate mr-4">{createdKey}</span>
            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(createdKey!)}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)}>I have saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Create API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex items-end gap-4 max-w-md">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Key Name</label>
              <Input 
                placeholder="e.g. Production Webhook" 
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={!newKeyName.trim() || createKey.isPending}>
              Generate Key
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Secret Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : keys?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No API keys created yet.
                  </TableCell>
                </TableRow>
              ) : keys?.map(key => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{key.keyPreview}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(key.id)}>
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
  );
}
