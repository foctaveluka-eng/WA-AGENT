import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Coffee, Heart } from "lucide-react";
import { useGetProfile } from "@workspace/api-client-react";

export default function Subscription() {
  const { data: profile } = useGetProfile();

  const planFeatures = [
    "Up to 3 AI Agents",
    "1,000 monthly messages",
    "Basic analytics",
    "Standard support",
    "WhatsApp Webhook integration"
  ];

  return (
    <div className="p-4 md:p-8 max-w-3xl flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Manage your billing and plan details.</p>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Current Plan</CardTitle>
              <CardDescription className="text-base mt-1">You are currently on the Free tier.</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">0€</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {planFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 pt-6 flex justify-between items-center border-t">
          <div className="text-sm text-muted-foreground">
            Messages used: <span className="font-medium text-foreground">{profile?.creditsUsed || 0} / 1000</span>
          </div>
          <Button variant="outline" disabled>Upgrade Plan (Coming Soon)</Button>
        </CardFooter>
      </Card>

      <Card className="bg-primary/5 border-primary/20 relative overflow-hidden mt-8">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
            <Coffee className="w-8 h-8 text-[#FFDD00]" />
          </div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            Support the Project <Heart className="w-5 h-5 text-destructive fill-destructive" />
          </h2>
          <p className="text-muted-foreground max-w-md mb-8">
            WhatsApp Agent is built and maintained by independent developers. If you find this tool valuable for your business, consider buying us a coffee to help cover server costs and fuel future development.
          </p>
          <a 
            href="https://buymeacoffee.com/whatsappagent" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[#FFDD00] px-8 text-sm font-semibold text-black shadow hover:bg-[#FFDD00]/90 transition-colors gap-2"
          >
            <Coffee className="w-4 h-4" />
            Buy me a coffee
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
