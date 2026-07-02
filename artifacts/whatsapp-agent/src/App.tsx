import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Agents from "@/pages/Agents";
import NewAgent from "@/pages/agents/NewAgent";
import EditAgent from "@/pages/agents/EditAgent";
import AgentKnowledge from "@/pages/agents/AgentKnowledge";
import Products from "@/pages/Products";
import Leads from "@/pages/Leads";
import Conversations from "@/pages/Conversations";
import Orders from "@/pages/Orders";
import Widgets from "@/pages/Widgets";
import Templates from "@/pages/Templates";
import Broadcast from "@/pages/Broadcast";
import Appointments from "@/pages/Appointments";
import Profile from "@/pages/settings/Profile";
import Organization from "@/pages/settings/Organization";
import Subscription from "@/pages/settings/Subscription";
import ApiKeys from "@/pages/settings/ApiKeys";
import Privacy from "@/pages/settings/Privacy";
import Notifications from "@/pages/settings/Notifications";
import Webhooks from "@/pages/settings/Webhooks";
import Blacklist from "@/pages/settings/Blacklist";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Landing from "@/pages/Landing";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if ((error as { status?: number }).status === 401) return false;
        return failureCount < 2;
      },
    },
  },
});

function ProtectedRouter() {
  const { user, loading, logout, refresh } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login onLogin={refresh} />}
      </Route>
      <Route path="/register">
        {user ? <Redirect to="/" /> : <Register onLogin={refresh} />}
      </Route>

      <Route>
        {!user ? (
          location === "/" ? <Landing /> : <Redirect to="/login" />
        ) : (
          <AppLayout onLogout={logout} user={user}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/agents" component={Agents} />
              <Route path="/agents/new" component={NewAgent} />
              <Route path="/agents/:id/knowledge" component={AgentKnowledge} />
              <Route path="/agents/:id" component={EditAgent} />
              <Route path="/products" component={Products} />
              <Route path="/leads" component={Leads} />
              <Route path="/conversations" component={Conversations} />
              <Route path="/orders" component={Orders} />
              <Route path="/widgets" component={Widgets} />
              <Route path="/templates" component={Templates} />
              <Route path="/broadcast" component={Broadcast} />
              <Route path="/appointments" component={Appointments} />
              <Route path="/settings/profile" component={Profile} />
              <Route path="/settings/organization" component={Organization} />
              <Route path="/settings/subscription" component={Subscription} />
              <Route path="/settings/api-keys" component={ApiKeys} />
              <Route path="/settings/privacy" component={Privacy} />
              <Route path="/settings/notifications" component={Notifications} />
              <Route path="/settings/webhooks" component={Webhooks} />
              <Route path="/settings/blacklist" component={Blacklist} />
              <Route path="/admin">
                {user.role === "admin" ? <Admin /> : <Redirect to="/" />}
              </Route>
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ProtectedRouter />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
