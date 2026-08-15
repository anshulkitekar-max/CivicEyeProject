import { supabase } from "@/integrations/supabase/client";
import type { Report } from "./civic";
import type { Reporter } from "@/components/civic/AdminReportDialog";

export type AdminData = {
  reports: Report[];
  reporters: Record<string, Reporter>;
};

/** Admin read: RLS lets admins select every report, plus reporter names for context. */
export async function fetchAdminData(): Promise<AdminData> {
  const { data: reports, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = [...new Set((reports ?? []).map((r) => r.user_id))];
  const reporters: Record<string, Reporter> = {};
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids);
    for (const p of profiles ?? []) reporters[p.id] = { full_name: p.full_name, email: p.email };
  }
  return { reports: (reports ?? []) as Report[], reporters };
}
