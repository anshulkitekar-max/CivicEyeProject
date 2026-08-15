import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, MapPin, Search, User } from "lucide-react";
import { fetchAdminData } from "@/lib/admin-data";
import { CATEGORIES, STATUSES, formatDate, shortId, type Report, type ReportStatus } from "@/lib/civic";
import { AppShell } from "@/components/civic/AppShell";
import { AdminReportDialog } from "@/components/civic/AdminReportDialog";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { ReportPhoto } from "@/components/civic/ReportPhoto";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  head: () => ({
    meta: [
      { title: "Manage Reports — CivicEye Admin" },
      {
        name: "description",
        content: "Search, filter and resolve citizen civic reports from the CivicEye admin console.",
      },
      { property: "og:title", content: "Manage Reports — CivicEye Admin" },
      { property: "og:description", content: "Search, filter, update and resolve civic reports." },
    ],
  }),
  component: ManageReports,
});

function ManageReports() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: fetchAdminData });
  const [selected, setSelected] = useState<Report | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportStatus | "All">("All");
  const [category, setCategory] = useState<string>("All");

  const reports = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.reports ?? []).filter((r) => {
      const reporter = data?.reporters[r.user_id];
      return (
        (status === "All" || r.status === status) &&
        (category === "All" || r.category === category) &&
        (!q ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          shortId(r.id).toLowerCase().includes(q) ||
          (reporter?.full_name ?? "").toLowerCase().includes(q) ||
          (reporter?.email ?? "").toLowerCase().includes(q))
      );
    });
  }, [data, query, status, category]);

  return (
    <AppShell variant="admin">
      <h1 className="text-2xl font-bold md:text-3xl">Manage reports</h1>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_180px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, category, description, citizen"
            className="h-11 pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus | "All")}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <div className="card-civic h-24 animate-pulse" />
          <div className="card-civic h-24 animate-pulse" />
        </div>
      ) : reports.length === 0 ? (
        <div className="card-civic mt-6 p-10 text-center">
          <ClipboardList className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">No reports match these filters</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((r) => {
            const reporter = data?.reporters[r.user_id];
            return (
              <div key={r.id} className="card-civic flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                <ReportPhoto
                  path={r.photo_url}
                  alt={r.category}
                  className="h-32 w-full shrink-0 rounded-lg sm:size-20"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs font-bold text-muted-foreground">
                    {shortId(r.id)} · {formatDate(r.created_at)}
                  </p>
                  <p className="font-semibold">{r.category}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3" /> {reporter?.full_name || "Citizen"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" /> {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <StatusBadge status={r.status} />
                  <Button size="sm" variant="secondary" onClick={() => setSelected(r)}>
                    Manage
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AdminReportDialog
        report={selected}
        reporter={selected ? data?.reporters[selected.user_id] : undefined}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </AppShell>
  );
}
