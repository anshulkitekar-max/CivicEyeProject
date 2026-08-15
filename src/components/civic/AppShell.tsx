import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  LayoutDashboard,
  LogOut,
  MapPin,
  PlusCircle,
  Trophy,
  User as UserIcon,
  ClipboardList,
  Map as MapIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: ReactNode };

const CITIZEN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="size-4" /> },
  { to: "/report", label: "Report", icon: <PlusCircle className="size-4" /> },
  { to: "/my-reports", label: "My Reports", icon: <ClipboardList className="size-4" /> },
  { to: "/rewards", label: "Rewards", icon: <Trophy className="size-4" /> },
  { to: "/profile", label: "Profile", icon: <UserIcon className="size-4" /> },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "City Map", icon: <MapIcon className="size-4" /> },
  { to: "/admin/reports", label: "Manage Reports", icon: <ClipboardList className="size-4" /> },
];

export function AppShell({
  children,
  variant = "citizen",
  title,
}: {
  children: ReactNode;
  variant?: "citizen" | "admin";
  title?: string;
}) {
  const nav = variant === "admin" ? ADMIN_NAV : CITIZEN_NAV;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-surface p-5 text-surface-foreground md:flex">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Eye className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">CivicEye</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-80 transition-colors hover:bg-accent/15 hover:opacity-100",
                pathname === item.to && "bg-accent/20 opacity-100",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          {isAdmin && variant === "citizen" ? (
            <Link
              to="/admin"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-80 hover:bg-accent/15"
            >
              <MapIcon className="size-4" /> Admin Console
            </Link>
          ) : null}
          {variant === "admin" ? (
            <Link
              to="/dashboard"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium opacity-80 hover:bg-accent/15"
            >
              <LayoutDashboard className="size-4" /> Citizen View
            </Link>
          ) : null}
        </nav>
        <div className="mt-6 rounded-xl bg-accent/10 p-3">
          <p className="truncate text-sm font-semibold">{profile?.full_name || "Citizen"}</p>
          <p className="truncate text-xs opacity-70">{profile?.email}</p>
          {variant === "citizen" ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-reward">
              <Trophy className="size-3.5" /> {profile?.points ?? 0} points
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold text-accent">Administrator</p>
          )}
          <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={signOut}>
            <LogOut className="size-4" /> Logout
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-4 py-3 text-surface-foreground md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Eye className="size-4" />
          </span>
          <span className="font-display font-bold">CivicEye</span>
        </Link>
        <div className="flex items-center gap-2">
          {variant === "citizen" ? (
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-reward">
              <Trophy className="size-3.5" /> {profile?.points ?? 0}
            </span>
          ) : null}
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-10">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
          {title ? (
            <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <MapPin className="size-6 text-accent" />
              {title}
            </h1>
          ) : null}
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border bg-card md:hidden">
        {nav.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground",
              pathname === item.to && "text-accent",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
