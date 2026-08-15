import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const CATEGORIES = [
  "Pothole / Damaged Road",
  "Garbage / Waste",
  "Broken Streetlight",
  "Water Leakage",
  "Drainage / Sewerage",
  "Traffic / Road Sign",
  "Damaged Public Property",
  "Illegal Dumping",
  "Tree / Greenery Problem",
  "Other",
] as const;

export const STATUSES: ReportStatus[] = ["Pending", "In Progress", "Resolved", "Rejected"];

export const STATUS_STYLES: Record<ReportStatus, string> = {
  Pending: "bg-pending text-pending-foreground",
  "In Progress": "bg-progress text-progress-foreground",
  Resolved: "bg-resolved text-resolved-foreground",
  Rejected: "bg-rejected text-rejected-foreground",
};

/** Marker fill colors read from the design tokens at runtime (client only). */
export const STATUS_VAR: Record<ReportStatus, string> = {
  Pending: "var(--pending)",
  "In Progress": "var(--progress)",
  Resolved: "var(--resolved)",
  Rejected: "var(--rejected)",
};

export const CATEGORY_ICON: Record<string, string> = {
  "Pothole / Damaged Road": "🕳️",
  "Garbage / Waste": "🗑️",
  "Broken Streetlight": "💡",
  "Water Leakage": "💧",
  "Drainage / Sewerage": "🚱",
  "Traffic / Road Sign": "🚧",
  "Damaged Public Property": "🏚️",
  "Illegal Dumping": "⚠️",
  "Tree / Greenery Problem": "🌳",
  Other: "📍",
};

export const shortId = (id: string) => `CE-${id.slice(0, 8).toUpperCase()}`;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"];

export function validatePhoto(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase()))
    return "Only JPG, PNG, WEBP or HEIC images are allowed.";
  if (file.size > MAX_PHOTO_BYTES) return "Image must be smaller than 5 MB.";
  return null;
}

const urlCache = new Map<string, string>();

/** Photos live in a private bucket; read access is granted through signed URLs. */
export async function getPhotoUrl(path: string): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cached = urlCache.get(path);
  if (cached) return cached;
  const { data } = await supabase.storage.from("report-photos").createSignedUrl(path, 3600);
  if (data?.signedUrl) {
    urlCache.set(path, data.signedUrl);
    return data.signedUrl;
  }
  return null;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
