import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { STATUSES, formatDate, shortId, type Report, type ReportStatus } from "@/lib/civic";
import { AppShell } from "@/components/civic/AppShell";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { ReportPhoto } from "@/components/civic/ReportPhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/my-reports/")({
  head: () => ({
    meta: [
      { title: "My Reports — CivicEye" },
      { name: "description", content: "All civic problems you reported and their current status." },
      { property: "og:title", content: "My Reports — CivicEye" },
      { property: "og:description", content: "Track the status of every report you submitted." },
    ],
  }),
  component: MyReports,
});

function MyReports() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportStatus | "All">("All");

  const { data, isLoading } = useQuery({
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

  const reports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (r) =>
        (status === "All" || r.status === status) &&
        (!q ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          shortId(r.id).toLowerCase().includes(q)),
    );
  }, [data, query, status]);

  return (
    <AppShell>
      <h1 className="text-2xl font-bold md:text-3xl">My reports</h1>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ID, category or description"
            className="h-11 pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["All", ...STATUSES] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={status === s ? "default" : "secondary"}
              onClick={() => setStatus(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="card-civic h-40 animate-pulse" />
          <div className="card-civic h-40 animate-pulse" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card-civic mt-6 p-10 text-center">
          <ClipboardList className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">Nothing to show here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.length ? "No reports match your filters." : "You haven't reported a problem yet."}
          </p>
          <Button asChild className="mt-4">
            <Link to="/report">Report a Problem</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reports.map((r) => (
            <Link
              key={r.id}
              to="/my-reports/$id"
              params={{ id: r.id }}
              className="card-civic overflow-hidden transition-shadow hover:shadow-lift"
            >
              <ReportPhoto path={r.photo_url} alt={r.category} className="h-40 w-full" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-xs font-bold text-muted-foreground">
                      {shortId(r.id)}
                    </p>
                    <p className="font-semibold">{r.category}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)} · {formatDate(r.created_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
