import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import type { LeafletMapProps } from "./LeafletMap";

// Leaflet touches window/document, so the whole module is loaded after hydration.
const LeafletMap = lazy(() => import("./LeafletMap"));

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function MapView({ className, ...props }: LeafletMapProps & { className?: string }) {
  return (
    <div className={className ?? "h-64 w-full overflow-hidden rounded-lg border border-border"}>
      <ClientOnly fallback={<MapSkeleton />}>
        <Suspense fallback={<MapSkeleton />}>
          <LeafletMap {...props} />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
