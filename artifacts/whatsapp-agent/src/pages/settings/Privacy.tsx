import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Download, Trash2, ShieldCheck } from "lucide-react";

export default function Privacy() {
  return (
    <div className="p-4 md:p-8 max-w-3xl flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Privacy & Data</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Manage your data compliance and account deletion.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            GDPR Compliance
          </CardTitle>
          <CardDescription>We take data privacy seriously.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            As a data processor for your WhatsApp communications, WhatsApp Agent ensures all conversational data is stored securely and processed in accordance with European GDPR regulations.
          </p>
          <p>
            You have full control over the conversation logs and lead data collected by your AI agents. You can export this data at any time or request complete deletion.
          </p>
          <div className="pt-4 flex gap-4">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export All Data
            </Button>
            <Button variant="outline" className="gap-2">
              <ShieldAlert className="w-4 h-4" />
              View DPA Agreement
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible account actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h3 className="font-semibold text-destructive mb-1">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account, all agents, and conversation history. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" className="shrink-0 gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
