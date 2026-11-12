import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, Star, MapPin, Zap, Clock, Gauge, Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDistance, formatDuration, formatPressure, formatPrice, getPressureStatus } from '../utils/formatters';
import type { RouteSearchResultDto, StationSummaryDto } from '../types';
import { DEMO_STATIONS } from '../data/demoStations';

function pressureColor(bar: number | null | undefined) {
  if (!bar) return '#94a3b8';
  if (bar >= 195) return '#10b981';
  if (bar >= 175) return '#f59e0b';
  return '#ef4444';
}

function MapFit({ geometry, stations }: { geometry: [number,number][], stations: StationSummaryDto[] }) {
  const map = useMap();
  React.useEffect(() => {
    const pts: [number,number][] = [...geometry, ...stations.map(s => [s.latitude, s.longitude] as [number,number])];
    if (pts.length > 0) {
      map.fitBounds(pts, { padding: [40, 40] });
    }
  }, []);
  return null;
}

function RecommendCard({ title, icon, station, colorClass }: { title: string; icon: string; station: StationSummaryDto; colorClass: string }) {
  const navigate = useNavigate();
  return (
    <div className={`rounded-xl border-2 ${colorClass} p-4 bg-white`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</span>
      </div>
      <p className="font-bold text-slate-900 text-sm">{station.name}</p>
      <p className="text-xs text-slate-500">{station.city}</p>
      <div className="flex gap-3 mt-2 text-xs text-slate-600">
        {station.extraDetourKm != null && <span>+{formatDistance(station.extraDetourKm)} detour</span>}
        {station.estimatedWaitMinutes != null && <span>~{station.estimatedWaitMinutes} min wait</span>}
      </div>
      <button onClick={() => navigate(`/stations/${station.id}`)}
        className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-800 transition">
        View Details →
      </button>
    </div>
  );
}

function StationRow({ station, rank }: { station: StationSummaryDto; rank: number }) {
  const navigate = useNavigate();
  const isBest = station.recommendationCategory === 'BEST_OVERALL';
  return (
    <div className={`rounded-xl p-4 border ${isBest ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'} mb-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">#{rank}</span>
            {isBest && <span className="text-xs bg-emerald-600 text-white rounded-full px-2 py-0.5 font-semibold">⭐ Best</span>}
            <span className="font-bold text-slate-900 text-sm truncate">{station.name}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{station.city}, {station.state}</p>
          {station.recommendationReason && (
            <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">{station.recommendationReason}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="text-center">
          <p className="text-xs text-slate-400">Detour</p>
          <p className="text-sm font-bold text-slate-800">{station.extraDetourKm != null ? formatDistance(station.extraDetourKm) : 'N/A'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Queue</p>
          <p className="text-sm font-bold text-slate-800">{station.vehiclesWaiting ?? 0} vehicles</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Pressure</p>
          <p className="text-sm font-bold" style={{ color: pressureColor(station.currentPressureBar) }}>
            {station.currentPressureBar ? formatPressure(station.currentPressureBar) : 'N/A'}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => navigate(`/stations/${station.id}`)}
          className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition">
          View Details
        </button>
        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`,'_blank')}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition">
          <Navigation size={12} className="inline mr-1"/>Directions
        </button>
      </div>
    </div>
  );
}

export default function RouteResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stations: contextStations } = useAppContext();
  const state = location.state as { result?: RouteSearchResultDto; startAddress?: string; destAddress?: string } | null;

  if (!state?.result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-5xl">🛣️</p>
        <h2 className="text-xl font-bold text-slate-700">No Route Searched Yet</h2>
        <p className="text-slate-500">Use the Trip Planner to find CNG stations on your route.</p>
        <Link to="/plan" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition">
          Plan a Trip
        </Link>
      </div>
    );
  }

  const { result, startAddress, destAddress } = state;
  const stations = result.stations?.length ? result.stations : (contextStations.length ? contextStations : DEMO_STATIONS);
  const sortedStations = [...stations].sort((a, b) => (a.score ?? 999) - (b.score ?? 999));
  const geometry = (result.routeGeometry ?? []).map(pt => [pt[0], pt[1]] as [number, number]);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT: Results Panel */}
      <div className="w-full lg:w-[420px] flex-shrink-0 overflow-y-auto bg-slate-50 border-r border-slate-200">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10">
          <button onClick={() => navigate('/plan')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-3 transition">
            <ArrowLeft size={14} /> Back to Planner
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700 truncate">{startAddress ?? 'Start'}</span>
            <span className="text-slate-400">→</span>
            <span className="font-semibold text-slate-700 truncate">{destAddress ?? 'Destination'}</span>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span>📏 {result.totalDistanceKm ? formatDistance(result.totalDistanceKm) : '—'}</span>
            <span>⏱️ {result.totalDurationMinutes ? formatDuration(result.totalDurationMinutes) : '—'}</span>
            {result.isDemoRoute && <span className="text-amber-600 font-semibold">DEMO ROUTE</span>}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Best Overall */}
          {result.bestOverall && (
            <div className="rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                <span className="font-black text-emerald-800 text-sm uppercase tracking-wide">Best CNG Stop For Your Journey</span>
              </div>
              <p className="font-bold text-slate-900 text-lg">{result.bestOverall.name}</p>
              <p className="text-sm text-slate-500">{result.bestOverall.city}, {result.bestOverall.state}</p>
              {result.bestOverall.recommendationReason && (
                <p className="text-xs text-slate-600 mt-2 italic">{result.bestOverall.recommendationReason}</p>
              )}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <p className="text-xs text-slate-400">Detour</p>
                  <p className="font-bold text-emerald-700">{result.bestOverall.extraDetourKm != null ? formatDistance(result.bestOverall.extraDetourKm) : 'N/A'}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <p className="text-xs text-slate-400">Wait</p>
                  <p className="font-bold text-emerald-700">{result.bestOverall.estimatedWaitMinutes != null ? `~${result.bestOverall.estimatedWaitMinutes} min` : 'N/A'}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center shadow-sm">
                  <p className="text-xs text-slate-400">Pressure</p>
                  <p className="font-bold text-emerald-700">{result.bestOverall.currentPressureBar ? formatPressure(result.bestOverall.currentPressureBar) : 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => navigate(`/stations/${result.bestOverall!.id}`)}
                className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
                Navigate to This Station →
              </button>
            </div>
          )}

          {/* Alternative picks */}
          <div className="grid grid-cols-2 gap-3">
            {result.nearestOnRoute && (
              <RecommendCard title="Nearest" icon="📍" station={result.nearestOnRoute} colorClass="border-blue-200" />
            )}
            {result.shortestQueue && (
              <RecommendCard title="Fastest Queue" icon="⚡" station={result.shortestQueue} colorClass="border-amber-200" />
            )}
          </div>

          {/* All stations */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <span>⛽</span> All Nearby Stations ({sortedStations.length})
            </h3>
            {sortedStations.map((s, i) => <StationRow key={s.id} station={s} rank={i + 1} />)}
          </div>

          <p className="text-xs text-amber-600 italic text-center pb-4">
            ⚠️ All queue and pressure values are simulated demo data. Not for real navigation.
          </p>
        </div>
      </div>

      {/* RIGHT: Map */}
      <div className="flex-1 relative min-h-[400px] lg:min-h-0">
        <MapContainer center={[22.9, 78.0]} zoom={5} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {geometry.length > 1 && <Polyline positions={geometry} color="#3b82f6" weight={4} opacity={0.8} />}
          {sortedStations.map(s => (
            <CircleMarker key={s.id} center={[s.latitude, s.longitude]}
              radius={s.recommendationCategory === 'BEST_OVERALL' ? 12 : 8}
              fillColor={pressureColor(s.currentPressureBar)} color="white" weight={2} fillOpacity={0.9}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-slate-500">{s.city}</p>
                  <p className="mt-1">Queue: {s.vehiclesWaiting ?? 0} vehicles</p>
                  <p>Pressure: {s.currentPressureBar ? formatPressure(s.currentPressureBar) : 'N/A'}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {geometry.length > 0 && <MapFit geometry={geometry} stations={sortedStations} />}
        </MapContainer>
      </div>
    </div>
  );
}
