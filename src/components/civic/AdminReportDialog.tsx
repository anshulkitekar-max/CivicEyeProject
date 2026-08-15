import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STATUSES, formatDate, shortId, type Report, type ReportStatus } from "@/lib/civic";
import { StatusBadge } from "./StatusBadge";
import { ReportPhoto } from "./ReportPhoto";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Reporter = { full_name: string; email: string | null };

export function AdminReportDialog({
  report,
  reporter,
  onOpenChange,
}: {
  report: Report | null;
  reporter?: Reporter | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ReportStatus>("Pending");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (report) {
      setStatus(report.status);
      setNote(report.admin_note ?? "");
    }
  }, [report]);

  const save = useMutation({
    mutationFn: async () => {
      if (!report) return;
      const { error } = await supabase
        .from("reports")
        .update({ status, admin_note: note.trim() ? note.trim().slice(0, 1000) : null })
        .eq("id", report.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report updated — the citizen has been notified");
      void queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      void queryClient.invalidateQueries({ queryKey: ["report"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!report} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {report ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {report.category}
                <StatusBadge status={report.status} />
              </DialogTitle>
              <DialogDescription>
                {shortId(report.id)} · reported {formatDate(report.created_at)}
              </DialogDescription>
            </DialogHeader>

            <ReportPhoto
              path={report.photo_url}
              alt={report.category}
              className="h-52 w-full rounded-xl"
            />

            <p className="text-sm leading-relaxed">{report.description}</p>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <User className="size-4" /> {reporter?.full_name || "Citizen"}
                {reporter?.email ? ` · ${reporter.email}` : ""}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4" /> {report.latitude.toFixed(6)},{" "}
                {report.longitude.toFixed(6)}
                <a
                  className="underline"
                  href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  open in OSM
                </a>
              </p>
              {report.resolved_at ? <p>Resolved {formatDate(report.resolved_at)}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ReportStatus)}>
                <SelectTrigger id="status" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Admin note (visible to the citizen)</Label>
              <Textarea
                id="note"
                rows={3}
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Crew assigned, expected completion in 3 days..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save changes
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setStatus("Resolved");
                  save.mutate();
                }}
                disabled={save.isPending}
              >
                Mark resolved
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setStatus("Rejected");
                  save.mutate();
                }}
                disabled={save.isPending}
              >
                Reject
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
