import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Loader2, MailCheck } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your CivicEye account" },
      {
        name: "description",
        content:
          "Register as a CivicEye citizen to report potholes, garbage, streetlights and more, and earn reward points.",
      },
      { property: "og:title", content: "Create your CivicEye account" },
      {
        property: "og:description",
        content: "Register to report civic problems in your city and earn reward points.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100),
    email: z.string().trim().email("Enter a valid email address").max(255),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function RegisterPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.fullName },
      },
    });
    setBusy(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    if (!data.session) setCheckEmail(true);
  };

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="card-civic max-w-sm p-8 text-center">
          <MailCheck className="mx-auto size-10 text-accent" />
          <h1 className="mt-4 text-xl font-bold">Confirm your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your
            CivicEye account, then sign in.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </div>
    );
  }

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
          <h2 className="max-w-sm text-3xl font-bold">Join thousands of active citizens</h2>
          <p className="mt-3 max-w-sm text-sm opacity-80">
            Earn 10 points for every valid report, 20 more when the city takes it up, and a 10 point
            bonus when it is resolved.
          </p>
        </div>
        <p className="text-xs opacity-60">Powered by citizens · OpenStreetMap</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Start reporting in under a minute.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="Aarav Sharma"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              placeholder="you@city.in"
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={set("confirm")}
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
            Register
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-primary underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
