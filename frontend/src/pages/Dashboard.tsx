import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fuel, CheckCircle, Clock, Gauge, ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from "../context/AppContext";
import { formatPressure, formatDuration, formatPrice } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tintClass: string;
  iconBg: string;
}

function StatCard({ icon, value, label, tintClass, iconBg }: StatCardProps) {
  return (
    <div className={`rounded-xl p-6 shadow-sm border border-white/60 ${tintClass} flex items-center gap-4`}>
      <div className={`${iconBg} rounded-xl p-3 flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Queue Distribution Bar ───────────────────────────────────────────────────

interface QueueBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
  bg: string;
}

function QueueBar({ label, count, total, color, bg }: QueueBarProps) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-600">{label}</span>
        <span className={`text-sm font-semibold ${color}`}>{count} stations</span>
      </div>
      <div className={`h-2.5 rounded-full ${bg} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace('text-', 'bg-')}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { stations, isLoading } = useAppContext();

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = stations.length;
    const available = stations.filter((s) => s.verifiedOpen === true).length;

    const withWait = stations.filter((s) => s.estimatedWaitMinutes !== null);
    const avgWait =
      withWait.length > 0
        ? Math.round(withWait.reduce((acc, s) => acc + (s.estimatedWaitMinutes ?? 0), 0) / withWait.length)
        : null;

    const withPressure = stations.filter((s) => s.currentPressureBar !== null);
    const bestPressure =
      withPressure.length > 0
        ? Math.max(...withPressure.map((s) => s.currentPressureBar ?? 0))
        : null;

    return { total, available, avgWait, bestPressure };
  }, [stations]);

  // ── Queue distribution ────────────────────────────────────────────────────
  const queueDist = useMemo(() => {
    const low = stations.filter((s) => s.vehiclesWaiting !== null && s.vehiclesWaiting <= 3).length;
    const moderate = stations.filter(
      (s) => s.vehiclesWaiting !== null && s.vehiclesWaiting >= 4 && s.vehiclesWaiting <= 8,
    ).length;
    const high = stations.filter((s) => s.vehiclesWaiting !== null && (s.vehiclesWaiting ?? 0) >= 9).length;
    return { low, moderate, high, total: low + moderate + high };
  }, [stations]);

  // ── Sidebar lists ─────────────────────────────────────────────────────────
  const recentStations = useMemo(
    () => [...stations].sort((a, b) => b.id - a.id).slice(0, 5),
    [stations],
  );

  const topStation = useMemo<StationSummaryDto | null>(
    () =>
      stations.find((s) => s.recommendationCategory === 'BEST_OVERALL') ?? stations[0] ?? null,
    [stations],
  );

  // ── Pressure badge colour ──────────────────────────────────────────────────
  function pressureChip(bar: number | null) {
    if (bar === null) return <span className="text-xs text-slate-400">—</span>;
    const color =
      bar >= 195 ? 'bg-emerald-100 text-emerald-700' : bar >= 175 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>{Math.round(bar)} Bar</span>;
  }

  // ── Map marker colour ──────────────────────────────────────────────────────
  function markerColor(s: StationSummaryDto) {
    return s.verifiedOpen ? '#10b981' : '#ef4444';
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-500">Loading stations…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* ── Hero / Welcome ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white px-6 py-10 md:px-10">
        <div className="max-w-6xl mx-auto">
          {/* Demo badge */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full px-3 py-1 mb-4">
            <Zap size={11} />
            DEMO MODE — Data Simulated
          </span>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Welcome to <span className="text-emerald-400">CNG Navigator</span>
          </h1>
          <p className="text-slate-300 mt-2 text-base">
            Bhopal, India &bull; Smart CNG Trip Planner
          </p>

          <button
            onClick={() => navigate('/plan')}
            className="mt-6 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-base px-6 py-3 rounded-xl shadow-lg transition-all duration-200 hover:shadow-emerald-500/30 hover:shadow-xl"
          >
            <Fuel size={18} />
            Find CNG Stations
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Fuel size={22} className="text-blue-600" />}
            value={stats.total}
            label="Total Stations"
            tintClass="bg-blue-50"
            iconBg="bg-blue-100"
          />
          <StatCard
            icon={<CheckCircle size={22} className="text-emerald-600" />}
            value={stats.available}
            label="Available Now"
            tintClass="bg-emerald-50"
            iconBg="bg-emerald-100"
          />
          <StatCard
            icon={<Clock size={22} className="text-amber-600" />}
            value={stats.avgWait !== null ? formatDuration(stats.avgWait) : '—'}
            label="Avg Wait Time"
            tintClass="bg-amber-50"
            iconBg="bg-amber-100"
          />
          <StatCard
            icon={<Gauge size={22} className="text-purple-600" />}
            value={stats.bestPressure !== null ? formatPressure(stats.bestPressure) : '—'}
            label="Best Pressure"
            tintClass="bg-purple-50"
            iconBg="bg-purple-100"
          />
        </div>

        {/* ── Two-column section ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left — Map (3/5) */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="font-semibold text-slate-700">Station Map</h2>
              <span className="ml-auto text-xs text-slate-400">{stations.length} stations</span>
            </div>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '400px', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {stations.map((s) => (
                <CircleMarker
                  key={s.id}
                  center={[s.latitude, s.longitude]}
                  radius={8}
                  pathOptions={{
                    color: markerColor(s),
                    fillColor: markerColor(s),
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[160px]">
                      <p className="font-semibold leading-tight">{s.name}</p>
                      <p className="text-slate-500 text-xs mb-1.5">{s.city}</p>
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        {s.currentPressureBar !== null && (
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                            {Math.round(s.currentPressureBar)} Bar
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.5 rounded ${s.verifiedOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}
                        >
                          {s.verifiedOpen ? 'Open' : 'Closed'}
                        </span>
                        {s.verifiedPricePerKg !== null && (
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {formatPrice(s.verifiedPricePerKg)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* Right — Sidebar (2/5) */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Recent stations */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex-1">
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                Recent Stations
              </h2>
              <ul className="divide-y divide-slate-50 space-y-0.5">
                {recentStations.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-slate-50 rounded-lg px-1 transition-colors"
                    onClick={() => navigate(`/station/${s.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.city}</p>
                    </div>
                    {pressureChip(s.currentPressureBar)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Top recommended */}
            {topStation && (
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-xl shadow-sm p-5">
                <p className="text-xs font-semibold tracking-wide text-emerald-100 mb-1">⭐ TOP RECOMMENDED</p>
                <p className="font-bold text-lg leading-tight">{topStation.name}</p>
                <p className="text-emerald-200 text-xs mb-3">{topStation.city}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-lg py-2">
                    <p className="text-base font-bold">{topStation.vehiclesWaiting ?? '—'}</p>
                    <p className="text-xs text-emerald-100">Queue</p>
                  </div>
                  <div className="bg-white/10 rounded-lg py-2">
                    <p className="text-base font-bold">
                      {topStation.currentPressureBar !== null ? Math.round(topStation.currentPressureBar) : '—'}
                    </p>
                    <p className="text-xs text-emerald-100">Bar</p>
                  </div>
                  <div className="bg-white/10 rounded-lg py-2">
                    <p className="text-base font-bold">
                      {topStation.extraDetourKm !== null ? `${topStation.extraDetourKm.toFixed(1)}` : '—'}
                    </p>
                    <p className="text-xs text-emerald-100">+km</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/plan')}
                  className="mt-3 w-full text-sm font-semibold bg-white/20 hover:bg-white/30 rounded-lg py-2 transition-colors"
                >
                  Plan Trip Here
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Queue Distribution ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="font-semibold text-slate-700 mb-5 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" />
            Station Availability Overview
          </h2>
          <div className="space-y-4">
            <QueueBar
              label="Low Queue (0–3 vehicles)"
              count={queueDist.low}
              total={queueDist.total}
              color="text-emerald-600"
              bg="bg-emerald-100"
            />
            <QueueBar
              label="Moderate Queue (4–8 vehicles)"
              count={queueDist.moderate}
              total={queueDist.total}
              color="text-amber-600"
              bg="bg-amber-100"
            />
            <QueueBar
              label="High Queue (9+ vehicles)"
              count={queueDist.high}
              total={queueDist.total}
              color="text-red-500"
              bg="bg-red-100"
            />
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Based on {queueDist.total} stations with live queue data.
          </p>
        </div>
      </div>
    </div>
  );
}
