import { useEffect, type ReactNode } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { CATEGORY_ICON, STATUS_VAR, type ReportStatus } from "@/lib/civic";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  status?: ReportStatus;
  category?: string;
  popup?: ReactNode;
};

export type LeafletMapProps = {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  fit?: boolean;
  onMarkerClick?: (id: string) => void;
};

function markerIcon(status: ReportStatus | undefined, category: string | undefined) {
  const color = STATUS_VAR[status ?? "Pending"];
  const glyph = CATEGORY_ICON[category ?? "Other"] ?? "📍";
  return L.divIcon({
    className: "",
    html: `<div class="civic-marker" style="background:${color}"><span>${glyph}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

function Fitter({ markers, fit }: { markers: MapMarker[]; fit?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    if (fit && markers.length > 1) {
      map.fitBounds(
        L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number])).pad(0.25),
      );
    } else {
      map.setView([markers[0]!.lat, markers[0]!.lng], Math.max(map.getZoom(), 15));
    }
  }, [map, markers, fit]);
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function LeafletMap({
  markers,
  center = [20.5937, 78.9629],
  zoom = 5,
  fit = true,
  onMarkerClick,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={markers.length ? [markers[0]!.lat, markers[0]!.lng] : center}
      zoom={markers.length ? 14 : zoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Fitter markers={markers} fit={fit} />
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={markerIcon(m.status, m.category)}
          eventHandlers={{ click: () => onMarkerClick?.(m.id) }}
        >
          {m.popup ? <Popup>{m.popup}</Popup> : null}
        </Marker>
      ))}
    </MapContainer>
  );
}
