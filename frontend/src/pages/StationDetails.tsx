import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowLeft, Phone, Clock, Zap, Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { telemetryApi } from '../services/api';
import { formatPressure, formatPrice, formatTimestamp } from '../utils/formatters';
import type { StationSummaryDto, PressureReading, QueueObservation } from '../types';

function PressureGauge({ value, max = 220, min = 160 }: { value: number | null | undefined; max?: number; min?: number }) {
  const v = value ?? 0;
  const pct = Math.min(1, Math.max(0, (v - min) / (max - min)));
  const angle = -90 + pct * 180;
  const color = v >= 195 ? '#10b981' : v >= 175 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" width="160" height="96">
        {/* Background arc */}
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
        {/* Value arc */}
        {v > 0 && (
          <path d={`M 10 60 A 50 50 0 0 1 ${60 + 50 * Math.cos(Math.PI - pct * Math.PI)} ${60 - 50 * Math.sin(pct * Math.PI)}`}
            fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
        )}
        {/* Needle */}
        <line x1="60" y1="60" x2={60 + 38 * Math.cos(Math.PI - pct * Math.PI)} y2={60 - 38 * Math.sin(pct * Math.PI)}
          stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="60" r="4" fill="#0f172a" />
      </svg>
      <div className="text-center -mt-2">
        <p className="text-2xl font-black" style={{ color }}>{v > 0 ? `${Math.round(v)}` : '—'}</p>
        <p className="text-xs text-slate-500">Bar</p>
        <p className="text-xs text-slate-400 mt-0.5">{min} — {max} Bar range</p>
      </div>
    </div>
  );
}

function QueueVis({ vehicles, dispensers }: { vehicles: number; dispensers: number }) {
  const cars = Math.min(vehicles, 8);
  const statusCls = vehicles <= 3 ? 'bg-emerald-100 text-emerald-700' : vehicles <= 8 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  const statusTxt = vehicles <= 3 ? 'Low' : vehicles <= 8 ? 'Moderate' : 'High';
  return (
    <div>
      <div className="flex items-center gap-1 flex-wrap mb-2">
        {Array.from({ length: cars }).map((_, i) => <span key={i} className="text-2xl">🚗</span>)}
        {vehicles > 8 && <span className="text-sm text-slate-500">+{vehicles - 8} more</span>}
        <span className="text-slate-300 mx-1">→</span>
        {Array.from({ length: Math.min(dispensers, 4) }).map((_, i) => <span key={i} className="text-2xl">⛽</span>)}
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${statusCls}`}>{statusTxt} Queue</span>
        <span className="text-xs text-slate-400">{vehicles} vehicle{vehicles !== 1 ? 's' : ''} waiting</span>
      </div>
    </div>
  );
}

export default function StationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { stations, selectedStations, toggleStationSelection } = useAppContext();
  const [pressureHistory, setPressureHistory] = useState<PressureReading[]>([]);
  const [queueHistory, setQueueHistory] = useState<QueueObservation[]>([]);
  const [loading, setLoading] = useState(true);

  const station = stations.find(s => String(s.id) === id);

  useEffect(() => {
    if (!id) return;
    const nId = Number(id);
    setLoading(true);
    Promise.all([
      telemetryApi.getPressureHistory(nId).catch(() => []),
      telemetryApi.getQueueHistory(nId).catch(() => []),
    ]).then(([ph, qh]) => {
      setPressureHistory(ph);
      setQueueHistory(qh);
      setLoading(false);
    });
  }, [id]);

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-4xl">⛽</p>
        <p className="text-xl font-bold text-slate-700">Station not found</p>
        <button onClick={() => navigate('/stations')} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition">Back to Stations</button>
      </div>
    );
  }

  const isSelected = selectedStations.includes(Number(station.id));
  const pData = pressureHistory.map(p => ({ time: formatTimestamp(p.createdAt), bar: Math.round(p.pressureBar) }));
  const qData = queueHistory.map(q => ({ time: formatTimestamp(q.createdAt), vehicles: q.vehiclesWaiting }));
  const pColor = (station.currentPressureBar ?? 0) >= 195 ? '#10b981' : (station.currentPressureBar ?? 0) >= 175 ? '#f59e0b' : '#ef4444';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6 transition">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Station header card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-slate-900">{station.name}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{station.operator}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><span>📍</span>{station.address}, {station.city}</p>
              </div>
              <span className={`flex-shrink-0 text-sm font-bold rounded-full px-3 py-1 ${station.verifiedOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {station.verifiedOpen ? '● Open' : '● Closed'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              {[
                { label: 'CNG Price', value: formatPrice(station.verifiedPricePerKg ?? null) },
                { label: 'Active Dispensers', value: `${station.activeDispensers ?? 0}` },
                { label: 'Operating Hours', value: station.operatingHours ?? '24x7' },
                { label: 'Capacity', value: `${station.dispenserCapacityPerHour ?? 0}/hr` },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="font-bold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            {station.amenities && <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><span>🏪</span>{station.amenities}</p>}
          </div>

          {/* Live stats */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Zap size={16} className="text-amber-500" />Live Status <span className="text-xs text-amber-600 font-normal">(SIMULATED)</span></h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">Vehicles Waiting</p>
                <p className="text-3xl font-black text-slate-900">{station.vehiclesWaiting ?? 0}</p>
                <p className="text-xs text-slate-500">~{station.estimatedWaitMinutes ?? 0} min wait</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Queue Visualization</p>
                <QueueVis vehicles={station.vehiclesWaiting ?? 0} dispensers={station.activeDispensers ?? 2} />
              </div>
            </div>
          </div>

          {/* Pressure gauge */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span>🔵</span> Current Pressure <span className="text-xs text-amber-600 font-normal ml-1">(SIMULATED)</span>
            </h2>
            <div className="flex items-center justify-around">
              <PressureGauge value={station.currentPressureBar} />
              <div className="text-sm space-y-2">
                <div><span className="text-slate-400">Status:</span> <span className="font-semibold" style={{ color: pColor }}>{station.sensorStatus ?? 'SIMULATED'}</span></div>
                <div><span className="text-slate-400">Source:</span> <span className="font-medium text-slate-700">{station.pressureDataSource ?? 'Demo'}</span></div>
                <div><span className="text-slate-400">Min safe:</span> <span className="font-medium text-slate-700">{station.minSafeLimitBar ?? 180} Bar</span></div>
                <div><span className="text-slate-400">Max safe:</span> <span className="font-medium text-slate-700">{station.maxSafeLimitBar ?? 220} Bar</span></div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={() => toggleStationSelection(Number(station.id))}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border transition ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
              {isSelected ? '✓ Added to Compare' : '+ Compare'}
            </button>
            <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank')}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition flex items-center justify-center gap-2">
              <Navigation size={14} /> Get Directions
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">
          {/* Map */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm" style={{ height: 240 }}>
            <MapContainer center={[station.latitude, station.longitude]} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
              <CircleMarker center={[station.latitude, station.longitude]} radius={14} fillColor={pColor} color="white" weight={3} fillOpacity={0.9}>
                <Popup><b>{station.name}</b><br/>{station.city}</Popup>
              </CircleMarker>
            </MapContainer>
          </div>

          {/* Pressure history chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Pressure History (Last 2h) <span className="text-xs font-normal text-amber-600">— SIMULATED</span></h3>
            {pData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={pData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => [`${v} Bar`, 'Pressure']} />
                  <Line type="monotone" dataKey="bar" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-400 text-center py-8">No pressure history available</p>}
          </div>

          {/* Queue history chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Queue History <span className="text-xs font-normal text-amber-600">— SIMULATED</span></h3>
            {qData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={qData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: any) => [v, 'Vehicles']} />
                  <Bar dataKey="vehicles" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-400 text-center py-8">No queue history available</p>}
          </div>

          <p className="text-xs text-amber-600 italic text-center">⚠️ All values shown are simulated demo data. Not actual station readings.</p>
        </div>
      </div>
    </div>
  );
}
