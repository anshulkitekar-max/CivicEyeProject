import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CalendarClock, CheckCircle2, Clock, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAdminData } from "@/lib/admin-data";
import { STATUSES, shortId, type Report } from "@/lib/civic";
import { AppShell } from "@/components/civic/AppShell";
import { AdminReportDialog } from "@/components/civic/AdminReportDialog";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { MapView } from "@/components/map/MapView";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin City Map — CivicEye" },
      {
        name: "description",
        content: "Municipal dashboard: every citizen report plotted on a live OpenStreetMap view.",
      },
      { property: "og:title", content: "Admin City Map — CivicEye" },
      { property: "og:description", content: "Live map and statistics of all civic reports." },
    ],
  }),
  component: AdminDashboard,
});

const STATUS_COLORS: Record<string, string> = {
  Pending: "var(--pending)",
  "In Progress": "var(--progress)",
  Resolved: "var(--resolved)",
  Rejected: "var(--rejected)",
};

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="card-civic p-4">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Report | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: fetchAdminData });

  useEffect(() => {
    const channel = supabase
      .channel("admin-reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const reports = data?.reports ?? [];

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: reports.length,
      pending: reports.filter((r) => r.status === "Pending").length,
      progress: reports.filter((r) => r.status === "In Progress").length,
      resolved: reports.filter((r) => r.status === "Resolved").length,
      today: reports.filter((r) => new Date(r.created_at).toDateString() === today).length,
    };
  }, [reports]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reports) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return [...map.entries()]
      .map(([name, value]) => ({ name: name.split(" / ")[0]!, value }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  const byStatus = useMemo(
    () =>
      STATUSES.map((s) => ({ name: s, value: reports.filter((r) => r.status === s).length })).filter(
        (d) => d.value > 0,
      ),
    [reports],
  );

  return (
    <AppShell variant="admin">
      <h1 className="text-2xl font-bold md:text-3xl">City operations dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every marker is a real citizen report, placed at its captured GPS coordinates.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Total reports" value={stats.total} icon={<ClipboardList className="size-4" />} />
        <Stat label="Pending" value={stats.pending} icon={<Clock className="size-4" />} />
        <Stat label="In progress" value={stats.progress} icon={<Activity className="size-4" />} />
        <Stat label="Resolved" value={stats.resolved} icon={<CheckCircle2 className="size-4" />} />
        <Stat label="Reports today" value={stats.today} icon={<CalendarClock className="size-4" />} />
      </div>

      <div className="card-civic mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-semibold">Live report map</h2>
          <span className="text-xs text-muted-foreground">
            {reports.length} marker{reports.length === 1 ? "" : "s"} · click a marker for details
          </span>
        </div>
        {isLoading ? (
          <div className="h-[420px] animate-pulse bg-muted" />
        ) : reports.length === 0 ? (
          <div className="grid h-[420px] place-items-center p-6 text-center">
            <div>
              <ClipboardList className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-semibold">No reports submitted yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Markers appear here as soon as citizens file reports.
              </p>
            </div>
          </div>
        ) : (
          <MapView
            className="h-[420px] w-full md:h-[520px]"
            markers={reports.map((r) => ({
              id: r.id,
              lat: r.latitude,
              lng: r.longitude,
              status: r.status,
              category: r.category,
              popup: (
                <div className="w-44">
                  <p className="font-display text-[11px] font-bold text-muted-foreground">
                    {shortId(r.id)}
                  </p>
                  <p className="text-sm font-semibold">{r.category}</p>
                  <p className="mt-1 line-clamp-3 text-xs">{r.description}</p>
                  <div className="mt-2">
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ),
            }))}
            onMarkerClick={(id) => setSelected(reports.find((r) => r.id === id) ?? null)}
          />
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-civic p-5">
          <h2 className="font-semibold">Reports by category</h2>
          <div className="mt-4 h-64">
            {byCategory.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} dy={10} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </div>
        </div>
        <div className="card-civic p-5">
          <h2 className="font-semibold">Reports by status</h2>
          <div className="mt-4 h-64">
            {byStatus.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                    {byStatus.map((d) => (
                      <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      <AdminReportDialog
        report={selected}
        reporter={selected ? data?.reporters[selected.user_id] : undefined}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </AppShell>
  );
}
