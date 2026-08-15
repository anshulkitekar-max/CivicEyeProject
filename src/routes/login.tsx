import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — CivicEye Citizen Portal" },
      {
        name: "description",
        content: "Sign in to CivicEye to report civic problems and track their resolution status.",
      },
      { property: "og:title", content: "Login — CivicEye Citizen Portal" },
      {
        property: "og:description",
        content: "Sign in to CivicEye to report civic problems and track their resolution.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: isAdmin ? "/admin" : "/dashboard", replace: true });
    }
  }, [session, isAdmin, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    toast.success("Welcome back to CivicEye");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-hero bg-grid p-10 text-surface-foreground md:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
            <Eye className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">CivicEye</span>
        </Link>
        <div>
          <h2 className="max-w-sm text-3xl font-bold">
            Report civic problems. Track progress. Build a better city.
          </h2>
          <p className="mt-3 max-w-sm text-sm opacity-80">
            Every report you file is geo-tagged and routed straight to the municipal dashboard.
          </p>
        </div>
        <p className="text-xs opacity-60">Powered by citizens · OpenStreetMap</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="md:hidden">
            <Link to="/" className="mb-6 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Eye className="size-5" />
              </span>
              <span className="font-display text-lg font-bold">CivicEye</span>
            </Link>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Citizen login</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your CivicEye account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@city.in"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-12"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="h-12 w-full text-base" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Login
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link to="/register" className="font-semibold text-primary underline">
              Create an account
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Administrators sign in with the same form — accounts with the admin role land on the
            admin console.
          </p>
        </form>
      </div>
    </div>
  );
}
