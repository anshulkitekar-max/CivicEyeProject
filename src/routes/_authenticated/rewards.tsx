import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Crown, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/civic/AppShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards & Leaderboard — CivicEye" },
      {
        name: "description",
        content: "See your CivicEye reward points, how points are earned, and the citizen leaderboard.",
      },
      { property: "og:title", content: "Rewards & Leaderboard — CivicEye" },
      { property: "og:description", content: "Earn points for civic action and climb the leaderboard." },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  const { user, profile } = useAuth();

  const leaderboard = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, points")
        .order("points", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const myReports = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const rank =
    (leaderboard.data ?? []).findIndex((p) => p.id === user?.id) + 1 || null;

  return (
    <AppShell>
      <h1 className="text-2xl font-bold md:text-3xl">Rewards</h1>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-reward-gradient p-6 text-reward-foreground md:col-span-1">
          <Trophy className="size-6" />
          <p className="mt-3 font-display text-4xl font-bold">{profile?.points ?? 0}</p>
          <p className="text-sm font-medium">Total reward points</p>
        </div>
        <div className="card-civic p-6">
          <Award className="size-6 text-primary" />
          <p className="mt-3 font-display text-4xl font-bold">{myReports.data ?? 0}</p>
          <p className="text-sm font-medium text-muted-foreground">Reports submitted</p>
        </div>
        <div className="card-civic p-6">
          <Crown className="size-6 text-accent" />
          <p className="mt-3 font-display text-4xl font-bold">{rank ? `#${rank}` : "—"}</p>
          <p className="text-sm font-medium text-muted-foreground">Your city ranking</p>
        </div>
      </div>

      <div className="card-civic mt-6 p-5">
        <h2 className="text-lg font-semibold">How points are earned</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">+10</strong> — a valid report is submitted
          </li>
          <li>
            <strong className="text-foreground">+20</strong> — the city verifies your report and marks
            it In Progress
          </li>
          <li>
            <strong className="text-foreground">+10</strong> — bonus when the problem is Resolved
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Points are calculated automatically by the database. They cannot be edited manually by
          citizens or admins.
        </p>
      </div>

      <div className="card-civic mt-6 overflow-hidden">
        <h2 className="border-b border-border p-5 text-lg font-semibold">Citizen leaderboard</h2>
        <div className="divide-y divide-border">
          {(leaderboard.data ?? []).map((p, i) => (
            <div
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3",
                p.id === user?.id && "bg-accent/10",
              )}
            >
              <span className="w-8 font-display text-sm font-bold text-muted-foreground">
                #{i + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {p.full_name || "Citizen"}
                {p.id === user?.id ? " (you)" : ""}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold text-reward-foreground">
                <Trophy className="size-3.5" /> {p.points}
              </span>
            </div>
          ))}
          {(leaderboard.data ?? []).length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No citizens on the board yet.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
