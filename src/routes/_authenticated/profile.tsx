import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Trophy, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { adminExists, claimFirstAdmin } from "@/lib/admin.functions";
import { AppShell } from "@/components/civic/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CivicEye" },
      { name: "description", content: "Manage your CivicEye citizen profile details." },
      { property: "og:title", content: "Profile — CivicEye" },
      { property: "og:description", content: "Manage your CivicEye citizen profile." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({ fullName: z.string().trim().min(2, "Enter your full name").max(100) });

function ProfilePage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const checkAdmin = useServerFn(adminExists);
  const claim = useServerFn(claimFirstAdmin);
  const adminQuery = useQuery({ queryKey: ["admin-exists"], queryFn: () => checkAdmin({}) });

  const becomeAdmin = async () => {
    setClaiming(true);
    try {
      const result = await claim({});
      if (result.granted) {
        await refreshProfile();
        toast.success(result.reason);
        window.location.assign("/admin");
      } else {
        toast.error(result.reason);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not grant the admin role.");
    } finally {
      setClaiming(false);
      void adminQuery.refetch();
    }
  };



  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ fullName });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile updated");
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold md:text-3xl">Profile</h1>

      <div className="card-civic mt-5 flex items-center gap-4 p-5">
        <UserCircle2 className="size-14 text-primary" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{profile?.full_name || "Citizen"}</p>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-reward-foreground">
            <Trophy className="size-3.5" /> {profile?.points ?? 0} points
            <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {isAdmin ? "Administrator" : "Citizen"}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={save} className="card-civic mt-5 space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email ?? ""} disabled className="h-12" />
          <p className="text-xs text-muted-foreground">
            Email is managed by your login credentials and cannot be changed here.
          </p>
        </div>
        <Button type="submit" className="h-12" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </form>

      {!isAdmin && adminQuery.data && !adminQuery.data.exists ? (
        <div className="card-civic mt-5 p-5">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="size-5 text-accent" /> City administrator setup
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No administrator exists for this city yet. Claim the role once to unlock the admin
            console with the live report map and report management. After the first administrator is
            created this option disappears permanently — the role can never be self-granted again.
          </p>
          <Button className="mt-4 h-12" onClick={becomeAdmin} disabled={claiming}>
            {claiming ? <Loader2 className="size-4 animate-spin" /> : null}
            Become the city administrator
          </Button>
        </div>
      ) : null}

    </AppShell>
  );
}
