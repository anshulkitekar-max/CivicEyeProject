import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, MapPin, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, shortId, type Report } from "@/lib/civic";
import { AppShell } from "@/components/civic/AppShell";
import { StatusBadge } from "@/components/civic/StatusBadge";
import { ReportPhoto } from "@/components/civic/ReportPhoto";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/my-reports/$id")({
  head: () => ({
    meta: [
      { title: "Report details — CivicEye" },
      { name: "description", content: "Full details and live status of your CivicEye report." },
      { property: "og:title", content: "Report details — CivicEye" },
      { property: "og:description", content: "Photo, location, status and notes for your report." },
    ],
  }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Report | null;
    },
  });

  if (isLoading)
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );

  if (!data)
    return (
      <AppShell>
        <div className="card-civic p-10 text-center">
          <p className="font-semibold">Report not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been removed, or it belongs to another account.
          </p>
          <Button asChild className="mt-4">
            <Link to="/my-reports">Back to My Reports</Link>
          </Button>
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <Link
        to="/my-reports"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="size-4" /> My reports
      </Link>

      <div className="card-civic overflow-hidden">
        <ReportPhoto path={data.photo_url} alt={data.category} className="h-64 w-full md:h-80" />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-sm font-bold text-muted-foreground">
                {shortId(data.id)}
              </p>
              <h1 className="text-2xl font-bold">{data.category}</h1>
            </div>
            <StatusBadge status={data.status} className="text-sm" />
          </div>

          <p className="text-sm leading-relaxed">{data.description}</p>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4" /> Reported {formatDate(data.created_at)}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" /> {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
            </p>
            {data.resolved_at ? (
              <p className="flex items-center gap-2 font-medium text-resolved-foreground">
                Resolved on {formatDate(data.resolved_at)}
              </p>
            ) : null}
          </div>

          {data.admin_note ? (
            <div className="rounded-xl bg-secondary p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="size-4" /> Note from the municipal team
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{data.admin_note}</p>
            </div>
          ) : null}

          <MapView
            markers={[
              {
                id: data.id,
                lat: data.latitude,
                lng: data.longitude,
                status: data.status,
                category: data.category,
              },
            ]}
            fit={false}
            className="h-64 w-full overflow-hidden rounded-lg border border-border"
          />
        </div>
      </div>
    </AppShell>
  );
}
