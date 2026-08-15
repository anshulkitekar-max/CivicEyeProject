import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, CheckCircle2, Crosshair, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CATEGORIES, validatePhoto } from "@/lib/civic";
import { AppShell } from "@/components/civic/AppShell";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/report")({
  head: () => ({
    meta: [
      { title: "Report a Problem — CivicEye" },
      {
        name: "description",
        content: "Submit a civic problem with a photo and your live GPS location on CivicEye.",
      },
      { property: "og:title", content: "Report a Problem — CivicEye" },
      {
        property: "og:description",
        content: "Photograph the issue, capture GPS, and send it to the municipal team.",
      },
    ],
  }),
  component: ReportPage,
});

const schema = z.object({
  category: z.string().min(1, "Select a problem category"),
  description: z
    .string()
    .trim()
    .min(10, "Please describe the problem in at least 10 characters")
    .max(1000, "Description must be under 1000 characters"),
});

type Coords = { lat: number; lng: number; accuracy: number };

function ReportPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = validatePhoto(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const getLocation = () => {
    setLocError(null);
    if (!("geolocation" in navigator)) {
      setLocError("This browser does not support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setLocating(false);
        toast.success("Location captured successfully");
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission is blocked. Tap the lock/location icon in your browser's address bar, set Location to \"Allow\" for this site, then press Get My Location again. On Android Chrome also enable Location in Settings → Site settings → Location; on iOS Safari enable Settings → Privacy → Location Services → Safari."
            : "Could not get your location. Move to an open area with GPS signal and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const validate = () => {
    const parsed = schema.safeParse({ category, description });
    if (!parsed.success) return parsed.error.issues[0]!.message;
    if (!photo) return "A photo of the problem is required.";
    if (!coords) return "Capture your live location before submitting.";
    return null;
  };

  const openConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    setError(problem);
    if (problem) return;
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (!user || !photo || !coords) return;
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const ext = photo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(path, photo, { contentType: photo.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from("reports")
        .insert({
          user_id: user.id,
          category,
          description: description.trim(),
          photo_url: path,
          latitude: coords.lat,
          longitude: coords.lng,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      await refreshProfile();
      toast.success("Your report has been submitted successfully. +10 points");
      navigate({ to: "/my-reports/$id", params: { id: data.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not submit the report.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <h1 className="text-2xl font-bold md:text-3xl">Report a civic problem</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Photo and live location are mandatory so the city team can act on your report.
      </p>

      <form onSubmit={openConfirm} className="mt-6 space-y-5 pb-6">
        <div className="card-civic space-y-2 p-5">
          <Label htmlFor="category">Problem category *</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="h-12">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="card-civic space-y-2 p-5">
          <Label htmlFor="description">Problem description *</Label>
          <Textarea
            id="description"
            rows={5}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem and provide any useful details..."
          />
          <p className="text-right text-xs text-muted-foreground">{description.length}/1000</p>
        </div>

        <div className="card-civic space-y-3 p-5">
          <Label>Problem photo *</Label>
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Selected problem photo preview" className="w-full rounded-xl" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => {
                  setPhoto(null);
                  setPreview(null);
                }}
                aria-label="Remove photo"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="button" className="h-14" onClick={() => cameraRef.current?.click()}>
                <Camera className="size-5" /> Take photo
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-14"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-5" /> Upload photo
              </Button>
            </div>
          )}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={pickPhoto}
          />
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          <p className="text-xs text-muted-foreground">JPG, PNG, WEBP or HEIC · max 5 MB</p>
        </div>

        <div className="card-civic space-y-3 p-5">
          <Label>Live location *</Label>
          <Button
            type="button"
            variant={coords ? "secondary" : "default"}
            className="h-14 w-full"
            onClick={getLocation}
            disabled={locating}
          >
            {locating ? <Loader2 className="size-5 animate-spin" /> : <Crosshair className="size-5" />}
            {coords ? "Update my location" : "Get My Location"}
          </Button>

          {coords ? (
            <>
              <p className="flex items-center gap-2 rounded-lg bg-resolved/20 px-3 py-2 text-sm font-semibold text-resolved-foreground">
                <CheckCircle2 className="size-4" /> Location captured successfully
              </p>
              <p className="text-xs text-muted-foreground">
                Lat {coords.lat.toFixed(6)} · Lng {coords.lng.toFixed(6)} · ±{coords.accuracy} m
              </p>
              <MapView
                markers={[{ id: "me", lat: coords.lat, lng: coords.lng, category }]}
                fit={false}
                className="h-56 w-full overflow-hidden rounded-lg border border-border"
              />
            </>
          ) : null}

          {locError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {locError}
            </p>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-14 w-full text-base" disabled={submitting}>
          {submitting ? <Loader2 className="size-5 animate-spin" /> : null}
          Submit Report
        </Button>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this report?</AlertDialogTitle>
            <AlertDialogDescription>
              Your photo and GPS coordinates will be sent to the municipal team. Please make sure
              the details are accurate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review again</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Yes, submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
