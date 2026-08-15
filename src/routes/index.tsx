import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera,
  ClipboardCheck,
  Eye,
  Gauge,
  MapPin,
  ShieldCheck,
  Trophy,
  Bell,
  ArrowRight,
} from "lucide-react";
import heroImg from "@/assets/civic-hero.jpg";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CATEGORY_ICON } from "@/lib/civic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicEye — Report Civic Problems, Track Progress" },
      {
        name: "description",
        content:
          "CivicEye lets citizens report potholes, garbage, broken streetlights and other civic problems with a photo and GPS location, then track resolution on a live city map.",
      },
      { property: "og:title", content: "CivicEye — Smart City Civic Reporting" },
      {
        property: "og:description",
        content:
          "Report civic problems with photo and GPS. Municipal teams resolve them from a live map. Citizens earn reward points.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: <Camera className="size-5" />,
    title: "Photo evidence",
    body: "Snap the problem with your phone camera. Photos are stored securely and shown to the city team.",
  },
  {
    icon: <MapPin className="size-5" />,
    title: "Real GPS tagging",
    body: "Your browser's location is captured so crews know exactly where to go — no vague addresses.",
  },
  {
    icon: <Gauge className="size-5" />,
    title: "Live status tracking",
    body: "Pending, In Progress, Resolved or Rejected — every change is visible in My Reports instantly.",
  },
  {
    icon: <Bell className="size-5" />,
    title: "Notifications",
    body: "Get notified the moment the municipal team picks up or resolves your complaint.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Secure by design",
    body: "Row level security means you only ever see your own reports; only admins manage the city queue.",
  },
  {
    icon: <ClipboardCheck className="size-5" />,
    title: "Admin city map",
    body: "Administrators see every report as a marker on an interactive OpenStreetMap dashboard.",
  },
];

const STEPS = [
  { n: "01", t: "Spot the problem", d: "Pothole, garbage pile, dead streetlight — anything civic." },
  { n: "02", t: "Capture photo + location", d: "One tap for the camera, one tap for GPS." },
  { n: "03", t: "Submit the report", d: "Pick a category, describe it, submit. You get a report ID." },
  { n: "04", t: "City resolves it", d: "Admins update status; you get points and notifications." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Eye className="size-5" />
            </span>
            <span className="font-display text-lg font-bold">CivicEye</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-hero bg-grid text-surface-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:px-8 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
              <MapPin className="size-3.5" /> Smart city civic platform
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
              Report civic problems.
              <br />
              Track progress.
              <br />
              <span className="text-accent">Build a better city.</span>
            </h1>
            <p className="mt-5 max-w-md text-base opacity-85">
              CivicEye connects citizens directly to the municipal team. Photograph the problem,
              capture your live location, and watch it get resolved on the city map.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/report">
                  Report a Problem <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-surface-foreground/30 bg-transparent text-surface-foreground hover:bg-surface-foreground/10"
              >
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <img
            src={heroImg}
            alt="Isometric smart city map with civic report markers"
            width={1600}
            height={1104}
            className="rounded-2xl border border-surface-foreground/10 shadow-lift"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-bold md:text-3xl">How CivicEye works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="card-civic p-5">
              <span className="font-display text-sm font-bold text-accent">{s.n}</span>
              <h3 className="mt-2 text-base font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/60 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-2xl font-bold md:text-3xl">Everything a civic platform needs</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-civic p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  {f.icon}
                </span>
                <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-2xl font-bold md:text-3xl">What you can report</h2>
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium"
            >
              <span className="mr-1">{CATEGORY_ICON[c]}</span>
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
        <div className="overflow-hidden rounded-2xl bg-reward-gradient p-8 text-reward-foreground md:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-reward-foreground/10 px-3 py-1 text-xs font-bold">
            <Trophy className="size-3.5" /> Reward points
          </span>
          <h2 className="mt-4 text-2xl font-bold md:text-3xl">Civic action, rewarded</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { p: "+10", t: "Valid report submitted" },
              { p: "+20", t: "Report verified & taken up by the city" },
              { p: "+10", t: "Bonus when the problem is resolved" },
            ].map((r) => (
              <div key={r.t} className="rounded-xl bg-reward-foreground/10 p-4">
                <p className="font-display text-3xl font-bold">{r.p}</p>
                <p className="mt-1 text-sm font-medium">{r.t}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-xl text-sm">
            Points are awarded automatically by the backend — never editable by hand — and rank you
            on the citizen leaderboard.
          </p>
          <Button asChild className="mt-6 h-12 bg-surface text-surface-foreground hover:bg-surface/90">
            <Link to="/register">Start earning points</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground md:flex-row md:px-8">
          <p className="flex items-center gap-2">
            <Eye className="size-4" /> CivicEye — civic reporting for smarter cities
          </p>
          <p>Maps © OpenStreetMap contributors</p>
        </div>
      </footer>
    </div>
  );
}
