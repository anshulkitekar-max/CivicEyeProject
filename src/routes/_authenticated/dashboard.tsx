import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, ClipboardList, CheckCircle2, Clock, PlusCircle, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDate, shortId, type Report } from "@/lib/civic";
import { AppShell } from "@/components/civic/AppShell";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { ReportPhoto } from "@/components/civic/ReportPhoto";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CivicEye" },
      { name: "description", content: "Your CivicEye activity: reports, statuses and reward points." },
      { property: "og:title", content: "Dashboard — CivicEye" },
      { property: "og:description", content: "Track your civic reports and reward points." },
    ],
  }),
  component: Dashboard,
});

function StatCard({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "default" | "pending" | "resolved" | "reward";
}) {
  const tones = {
    default: "bg-primary/10 text-primary",
    pending: "bg-pending/25 text-pending-foreground",
    resolved: "bg-resolved/25 text-resolved-foreground",
    reward: "bg-reward/25 text-reward-foreground",
  } as const;
  return (
    <div className="card-civic p-4">
      <span className={`grid size-9 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const reportsQuery = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Report[];
    },
  });

  const notifQuery = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  // Live updates: status changes by admins arrive without a manual refresh.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("citizen-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["my-reports"] });
        void refreshProfile();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient, refreshProfile]);

  const reports = reportsQuery.data ?? [];
  const pending = reports.filter((r) => r.status === "Pending" || r.status === "In Progress").length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="text-2xl font-bold md:text-3xl">{profile?.full_name || "Citizen"}</h1>
        </div>
        <Button asChild size="lg" className="h-12">
          <Link to="/report">
            <PlusCircle className="size-4" /> Report a Problem
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total reports" value={reports.length} icon={<ClipboardList className="size-4" />} />
        <StatCard label="Pending / active" value={pending} icon={<Clock className="size-4" />} tone="pending" />
        <StatCard label="Resolved" value={resolved} icon={<CheckCircle2 className="size-4" />} tone="resolved" />
        <StatCard label="Reward points" value={profile?.points ?? 0} icon={<Trophy className="size-4" />} tone="reward" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent reports</h2>
            <Link to="/my-reports" className="text-sm font-semibold text-primary underline">
              View all
            </Link>
          </div>
          {reportsQuery.isLoading ? (
            <div className="card-civic h-32 animate-pulse" />
          ) : reports.length === 0 ? (
            <div className="card-civic p-8 text-center">
              <ClipboardList className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No reports yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Spotted a civic problem? File your first report and earn 10 points.
              </p>
              <Button asChild className="mt-4">
                <Link to="/report">Report a Problem</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  to="/my-reports/$id"
                  params={{ id: r.id }}
                  className="card-civic flex items-center gap-3 p-3 transition-shadow hover:shadow-lift"
                >
                  <ReportPhoto path={r.photo_url} alt={r.category} className="size-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.category}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {shortId(r.id)} · {formatDate(r.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Bell className="size-4 text-accent" /> Notifications
          </h2>
          <div className="card-civic divide-y divide-border">
            {(notifQuery.data ?? []).length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              (notifQuery.data ?? []).map((n) => (
                <div key={n.id} className="p-4">
                  <p className="text-sm">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
