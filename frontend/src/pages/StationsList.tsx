import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Navigation, BarChart2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDistance, formatPressure, formatPrice, formatDuration } from '../utils/formatters';
import type { StationSummaryDto } from '../types';

function pressureColor(bar: number | null | undefined) {
  if (!bar) return 'text-slate-400';
  if (bar >= 195) return 'text-emerald-600';
  if (bar >= 175) return 'text-amber-500';
  return 'text-red-500';
}

function queueLabel(v: number | null | undefined) {
  const n = v ?? 0;
  if (n <= 3) return { text: 'Low', cls: 'bg-emerald-100 text-emerald-700' };
  if (n <= 8) return { text: 'Moderate', cls: 'bg-amber-100 text-amber-700' };
  return { text: 'High', cls: 'bg-red-100 text-red-700' };
}

function StationCard({ station }: { station: StationSummaryDto }) {
  const navigate = useNavigate();
  const { selectedStations, toggleStationSelection } = useAppContext();
  const isSelected = selectedStations.includes(Number(station.id));
  const q = queueLabel(station.vehiclesWaiting);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${station.recommendationCategory === 'BEST_OVERALL' ? 'border-emerald-300' : 'border-slate-200'} p-5 flex flex-col gap-3 hover:shadow-md transition`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {station.recommendationCategory === 'BEST_OVERALL' && (
            <span className="inline-block text-xs bg-emerald-600 text-white rounded-full px-2 py-0.5 font-semibold mb-1">⭐ Best Overall</span>
          )}
          <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">{station.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{station.operator}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <span>📍</span> {station.city}, {station.state}
          </p>
        </div>
        <span className={`flex-shrink-0 text-xs font-semibold rounded-full px-2 py-0.5 ${station.verifiedOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
          {station.verifiedOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400">Queue</p>
          <p className="font-bold text-slate-800 text-sm">{station.vehiclesWaiting ?? 0}</p>
          <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${q.cls}`}>{q.text}</span>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400">Pressure</p>
          <p className={`font-bold text-sm ${pressureColor(station.currentPressureBar)}`}>
            {station.currentPressureBar ? `${Math.round(station.currentPressureBar)}` : '—'} <span className="text-xs font-normal">Bar</span>
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400">Price</p>
          <p className="font-bold text-slate-800 text-sm">{formatPrice(station.verifiedPricePerKg ?? null)}</p>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="flex gap-3 text-xs text-slate-500">
        <span>⏱️ ~{station.estimatedWaitMinutes ?? 0} min wait</span>
        <span>⛽ {station.activeDispensers ?? 0} dispensers</span>
        <span>🕐 {station.operatingHours ?? '24x7'}</span>
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-slate-400 italic">{station.queueFreshness ?? 'SIMULATED'}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button onClick={() => navigate(`/stations/${station.id}`)}
          className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition">
          View Details
        </button>
        <button onClick={() => toggleStationSelection(Number(station.id))}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <BarChart2 size={12} className="inline mr-1" />{isSelected ? '✓ Added' : 'Compare'}
        </button>
        <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank')}
          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition">
          <Navigation size={12} />
        </button>
      </div>
    </div>
  );
}

type SortKey = 'name' | 'queue' | 'pressure' | 'price';
type FilterKey = 'all' | 'available' | 'busy' | 'lowPressure';

export default function StationsList() {
  const { stations, isLoading, selectedStations } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('name');

  const filtered = useMemo(() => {
    let list = [...stations];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.operator?.toLowerCase().includes(q));
    }
    if (filter === 'available') list = list.filter(s => s.verifiedOpen);
    if (filter === 'busy') list = list.filter(s => (s.vehiclesWaiting ?? 0) > 5);
    if (filter === 'lowPressure') list = list.filter(s => s.currentPressureBar != null && s.currentPressureBar < 180);
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'queue') list.sort((a, b) => (a.vehiclesWaiting ?? 0) - (b.vehiclesWaiting ?? 0));
    if (sort === 'pressure') list.sort((a, b) => (b.currentPressureBar ?? 0) - (a.currentPressureBar ?? 0));
    if (sort === 'price') list.sort((a, b) => (a.verifiedPricePerKg ?? 999) - (b.verifiedPricePerKg ?? 999));
    return list;
  }, [stations, search, filter, sort]);

  const filters: { id: FilterKey; label: string }[] = [
    { id: 'all', label: 'All' }, { id: 'available', label: '✅ Available' }, { id: 'busy', label: '🔴 Busy' }, { id: 'lowPressure', label: '⚠️ Low Pressure' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">CNG Stations</h1>
        <p className="text-slate-500 text-sm mt-1">{filtered.length} of {stations.length} stations</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stations, cities, operators..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${filter === f.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 bg-white focus:outline-none focus:border-emerald-400 transition">
          <option value="name">Sort: Name</option>
          <option value="queue">Sort: Queue ↑</option>
          <option value="pressure">Sort: Pressure ↓</option>
          <option value="price">Sort: Price ↑</option>
        </select>
      </div>

      {/* Compare bar */}
      {selectedStations.length > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span className="text-sm font-semibold text-emerald-800">{selectedStations.length} station{selectedStations.length > 1 ? 's' : ''} selected</span>
          <button onClick={() => navigate('/compare')}
            className="ml-auto bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
            Compare Now →
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-64">
              <div className="h-4 bg-slate-200 rounded mb-3 w-3/4" />
              <div className="h-3 bg-slate-100 rounded mb-2 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <p className="text-4xl mb-3">⛽</p>
          <p className="font-semibold">No stations match your filter</p>
          <button onClick={() => { setSearch(''); setFilter('all'); }} className="mt-3 text-emerald-600 text-sm hover:underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => <StationCard key={s.id} station={s} />)}
        </div>
      )}
    </div>
  );
}
