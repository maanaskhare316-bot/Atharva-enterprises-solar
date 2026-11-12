import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StationSummaryDto } from '../../types';

// ─── Fix default Leaflet marker icons broken by bundlers ─────────────────────
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

interface StationMapProps {
  stations: StationSummaryDto[];
  routeGeometry?: [number, number][];
  startPoint?: LatLng;
  destPoint?: LatLng;
  selectedStationId?: number | null;
  onStationClick?: (station: StationSummaryDto) => void;
  height?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pressureColor(bar: number | null): string {
  if (bar === null) return '#94a3b8'; // slate – unknown
  if (bar >= 195) return '#10b981';   // emerald – great
  if (bar >= 175) return '#f59e0b';   // amber – ok
  return '#ef4444';                   // red – low
}

function divIcon(label: string, color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      color:#fff;
      width:28px;height:28px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:12px;
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.35);">
        <span style="transform:rotate(45deg)">${label}</span>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });
}

// ─── Auto-fit bounds sub-component ───────────────────────────────────────────

interface FitBoundsProps {
  stations: StationSummaryDto[];
  startPoint?: LatLng;
  destPoint?: LatLng;
}

function FitBounds({ stations, startPoint, destPoint }: FitBoundsProps) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    const points: [number, number][] = [];
    stations.forEach((s) => points.push([s.latitude, s.longitude]));
    if (startPoint) points.push([startPoint.lat, startPoint.lng]);
    if (destPoint) points.push([destPoint.lat, destPoint.lng]);

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    fitted.current = true;
  }, [map, stations, startPoint, destPoint]);

  return null;
}

// ─── Marker layer for start / dest ───────────────────────────────────────────

function EndpointMarkers({ startPoint, destPoint }: { startPoint?: LatLng; destPoint?: LatLng }) {
  const map = useMap();

  useEffect(() => {
    const markers: L.Marker[] = [];

    if (startPoint) {
      const m = L.marker([startPoint.lat, startPoint.lng], {
        icon: divIcon('A', '#10b981'),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('<b>Start</b>');
      markers.push(m);
    }

    if (destPoint) {
      const m = L.marker([destPoint.lat, destPoint.lng], {
        icon: divIcon('B', '#ef4444'),
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('<b>Destination</b>');
      markers.push(m);
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [map, startPoint, destPoint]);

  return null;
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function StationMap({
  stations,
  routeGeometry,
  startPoint,
  destPoint,
  selectedStationId,
  onStationClick,
  height = '400px',
}: StationMapProps) {
  return (
    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Route polyline */}
      {routeGeometry && routeGeometry.length > 1 && (
        <Polyline
          positions={routeGeometry}
          pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.75 }}
        />
      )}

      {/* Station circle markers */}
      {stations.map((station) => {
        const isSelected = station.id === selectedStationId;
        const color = pressureColor(station.currentPressureBar);
        return (
          <CircleMarker
            key={station.id}
            center={[station.latitude, station.longitude]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              color: isSelected ? '#fff' : color,
              fillColor: color,
              fillOpacity: 0.9,
              weight: isSelected ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onStationClick?.(station),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[180px]">
                <p className="font-semibold text-slate-800 leading-tight">{station.name}</p>
                <p className="text-slate-500 text-xs mb-2">{station.city}, {station.state}</p>
                <div className="flex gap-2 flex-wrap text-xs">
                  {station.currentPressureBar !== null && (
                    <span
                      className="px-1.5 py-0.5 rounded font-medium"
                      style={{ background: color + '22', color }}
                    >
                      {Math.round(station.currentPressureBar)} Bar
                    </span>
                  )}
                  {station.vehiclesWaiting !== null && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {station.vehiclesWaiting} waiting
                    </span>
                  )}
                  {station.verifiedPricePerKg !== null && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                      ₹{station.verifiedPricePerKg?.toFixed(2)}/kg
                    </span>
                  )}
                </div>
                {onStationClick && (
                  <button
                    onClick={() => onStationClick(station)}
                    className="mt-2 w-full text-xs bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-2 rounded transition-colors"
                  >
                    View Details
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Start / Dest markers */}
      <EndpointMarkers startPoint={startPoint} destPoint={destPoint} />

      {/* Fit map to all visible markers */}
      <FitBounds stations={stations} startPoint={startPoint} destPoint={destPoint} />
    </MapContainer>
  );
}
