import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Bot,
  Package,
  Users,
  MessageSquare,
  ShoppingCart,
  Blocks,
  User,
  Building,
  Key,
  ShieldAlert,
  LogOut,
  FileText,
  Megaphone,
  CalendarClock,
  Bell,
  Webhook,
  ShieldBan,
  Crown,
  Menu,
  X,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/context/AuthContext";

const SUPPORT_URL = "https://lgckygmt.mychariow.shop/prd_6ou47pd5";

const mainNav = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Agents IA", href: "/agents", icon: Bot },
  { title: "Produits", href: "/products", icon: Package },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Conversations", href: "/conversations", icon: MessageSquare },
  { title: "Commandes", href: "/orders", icon: ShoppingCart },
  { title: "Rendez-vous", href: "/appointments", icon: CalendarClock },
  { title: "Widgets", href: "/widgets", icon: Blocks },
];

const toolsNav = [
  { title: "Modèles", href: "/templates", icon: FileText },
  { title: "Diffusion", href: "/broadcast", icon: Megaphone },
];

const settingsNav = [
  { title: "Profil", href: "/settings/profile", icon: User },
  { title: "Organisation", href: "/settings/organization", icon: Building },
  { title: "Notifications", href: "/settings/notifications", icon: Bell },
  { title: "Webhooks", href: "/settings/webhooks", icon: Webhook },
  { title: "Liste noire", href: "/settings/blacklist", icon: ShieldBan },
  { title: "Clés API", href: "/settings/api-keys", icon: Key },
  { title: "Confidentialité", href: "/settings/privacy", icon: ShieldAlert },
];

function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: { title: string; href: string; icon: React.ElementType };
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link href={item.href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {item.title}
      </div>
    </Link>
  );
}

function SidebarContent({
  location,
  isAdmin,
  user,
  onLogout,
  onNavClick,
}: {
  location: string;
  isAdmin: boolean;
  user?: AuthUser | null;
  onLogout?: () => Promise<void>;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="WA Agent" className="h-10 w-10 rounded-lg object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-sidebar-primary font-bold text-base tracking-tight">WA Agent</span>
            <span className="text-sidebar-foreground/40 text-[10px]">IA & Lead Automatique</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
            Plateforme
          </div>
          {mainNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={location === item.href || (item.href !== "/" && location.startsWith(item.href))}
              onClick={onNavClick}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
            Outils
          </div>
          {toolsNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={location === item.href || location.startsWith(item.href)}
              onClick={onNavClick}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1">
            Paramètres
          </div>
          {settingsNav.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={location === item.href || location.startsWith(item.href)}
              onClick={onNavClick}
            />
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-col gap-1">
            <div className="px-3 text-xs font-semibold text-amber-500/80 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Crown className="w-3 h-3" />
              Administration
            </div>
            <Link href="/admin">
              <div
                onClick={onNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
                  location === "/admin"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    : "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                )}
              >
                <Crown className="w-4 h-4 shrink-0" />
                Panneau Admin
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Support button */}
      <div className="px-3 pb-2 shrink-0">
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors w-full shadow-sm"
        >
          <Coffee className="w-4 h-4 text-amber-600" />
          ☕ Soutenir WA Agent
        </a>
      </div>

      {/* User footer */}
      {user && (
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2 px-3 hover:bg-sidebar-accent"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 relative">
                  <span className="text-primary font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-medium truncate w-full flex items-center gap-1.5">
                    {user.name}
                    {isAdmin && <Badge className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700 border-amber-200 border">Admin</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <Link href="/settings/profile">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Mon profil
                </DropdownMenuItem>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <DropdownMenuItem className="cursor-pointer text-amber-700">
                    <Crown className="w-4 h-4 mr-2" />
                    Panneau Admin
                  </DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 cursor-pointer"
                onClick={() => onLogout?.()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
}

export function AppLayout({
  children,
  onLogout,
  user,
}: {
  children: ReactNode;
  onLogout?: () => Promise<void>;
  user?: AuthUser | null;
}) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-in drawer */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar flex flex-col transition-transform duration-200",
          "md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <SidebarContent
          location={location}
          isAdmin={isAdmin}
          user={user}
          onLogout={onLogout}
          onNavClick={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-background sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="WA Agent" className="h-7 w-7 rounded-md object-contain" />
            <span className="font-bold text-sm">WA Agent</span>
          </div>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
            aria-label="Soutenir"
          >
            <Coffee className="w-5 h-5" />
          </a>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
