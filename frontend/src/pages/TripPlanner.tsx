import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, ArrowUpDown, ChevronDown, ChevronUp,
  Loader2, AlertCircle, Car, Bus, Truck
} from 'lucide-react';
import { nominatimSearch } from '../services/api';
import { useRouteSearch } from '../hooks/useRouteSearch';
import { CORRIDORS, DEFAULT_CORRIDOR } from '../data/corridors';
import type { Corridor } from '../types';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function MapUpdater({ start, dest }: { start: [number, number] | null; dest: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (start && dest) {
      map.fitBounds([start, dest], { padding: [60, 60] });
    } else if (start) {
      map.setView(start, 10);
    }
  }, [start, dest, map]);
  return null;
}

interface LocationState {
  address: string;
  lat: number | null;
  lng: number | null;
}

function AutocompleteInput({ label, icon, value, onChange, placeholder, colorClass = 'text-emerald-600' }:
  { label: string; icon: React.ReactNode; value: LocationState; onChange: (v: LocationState) => void; placeholder: string; colorClass?: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onChange({ address: q, lat: null, lng: null });
    if (timer.current) clearTimeout(timer.current);
    if (q.length > 2) {
      timer.current = setTimeout(async () => {
        const res = await nominatimSearch(q);
        setSuggestions(res.slice(0, 5));
        setOpen(true);
      }, 350);
    } else { setSuggestions([]); setOpen(false); }
  };

  const select = (s: any) => {
    onChange({ address: s.display_name.split(',').slice(0, 3).join(','), lat: parseFloat(s.lat), lng: parseFloat(s.lon) });
    setSuggestions([]); setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
      <div className="relative flex items-center">
        <span className={`absolute left-3 ${colorClass}`}>{icon}</span>
        <input type="text" value={value.address} onChange={handleChange} onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition" />
        {value.address && (
          <button onClick={() => { onChange({ address: '', lat: null, lng: null }); setSuggestions([]); setOpen(false); }}
            className="absolute right-3 text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
        )}
        {value.lat && <span className="absolute right-8 text-emerald-500 text-xs">✓</span>}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button key={i} onMouseDown={() => select(s)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border-b border-slate-50 last:border-0 transition">
              <span className="font-medium">{s.display_name.split(',')[0]}</span>
              <span className="text-xs text-slate-400 ml-1">{s.display_name.split(',').slice(1, 3).join(',')}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const { search, isLoading, error, result } = useRouteSearch();
  const [activeCorridorId, setActiveCorridorId] = useState(DEFAULT_CORRIDOR.id);
  const [showOptions, setShowOptions] = useState(false);
  const [vehicleType, setVehicleType] = useState('car');
  const [maxDetour, setMaxDetour] = useState(5);
  const [start, setStart] = useState<LocationState>({ address: DEFAULT_CORRIDOR.startAddress, lat: DEFAULT_CORRIDOR.startLat, lng: DEFAULT_CORRIDOR.startLng });
  const [dest, setDest] = useState<LocationState>({ address: DEFAULT_CORRIDOR.destAddress, lat: DEFAULT_CORRIDOR.destLat, lng: DEFAULT_CORRIDOR.destLng });

  useEffect(() => {
    if (result) navigate('/results', { state: { result, startAddress: start.address, destAddress: dest.address } });
  }, [result, navigate, start.address, dest.address]);

  const loadCorridor = (c: Corridor) => {
    setActiveCorridorId(c.id);
    setStart({ address: c.startAddress, lat: c.startLat, lng: c.startLng });
    setDest({ address: c.destAddress, lat: c.destLat, lng: c.destLng });
  };

  const swap = () => { const tmp = start; setStart(dest); setDest(tmp); };

  const handleFind = async () => {
    if (!start.lat || !dest.lat) return;
    await search({ startLat: start.lat!, startLng: start.lng!, startAddress: start.address, destLat: dest.lat!, destLng: dest.lng!, destAddress: dest.address, maxDetourKm: maxDetour });
  };

  const canSearch = !!(start.lat && dest.lat && !isLoading);
  const startPos = start.lat ? [start.lat, start.lng!] as [number, number] : null;
  const destPos = dest.lat ? [dest.lat, dest.lng!] as [number, number] : null;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 overflow-hidden">
      <div className="w-full lg:w-[400px] flex-shrink-0 bg-white border-r border-slate-100 overflow-y-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plan Your Journey</h1>
          <p className="text-sm text-slate-500 mt-1">Find the best CNG station on your route</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Popular Routes</p>
          <div className="flex flex-col gap-2">
            {CORRIDORS.map(c => (
              <button key={c.id} onClick={() => loadCorridor(c)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium border transition ${activeCorridorId === c.id ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <AutocompleteInput label="Starting Location (A)" icon={<MapPin size={16} />} value={start} onChange={setStart} placeholder="Starting point..." colorClass="text-emerald-600" />
          <div className="flex justify-center">
            <button onClick={swap} className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-medium transition">
              <ArrowUpDown size={12} /> Swap
            </button>
          </div>
          <AutocompleteInput label="Destination (B)" icon={<Navigation size={16} />} value={dest} onChange={setDest} placeholder="Destination..." colorClass="text-red-500" />
        </div>
        <div>
          <button onClick={() => setShowOptions(v => !v)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition">
            {showOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Trip Options
          </button>
          {showOptions && (
            <div className="mt-3 space-y-4 p-4 bg-slate-50 rounded-xl">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle Type</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['car','auto','bus','truck'].map(v => (
                    <button key={v} onClick={() => setVehicleType(v)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize ${vehicleType === v ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-white'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Max Detour: <span className="text-emerald-600">{maxDetour} km</span></label>
                <input type="range" min={1} max={15} value={maxDetour} onChange={e => setMaxDetour(+e.target.value)} className="w-full mt-2 accent-emerald-600" />
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        <button onClick={handleFind} disabled={!canSearch}
          className={`w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 transition shadow-lg ${canSearch ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-slate-300 cursor-not-allowed'}`}>
          {isLoading ? <><Loader2 size={18} className="animate-spin" /> Searching...</> : '⛽ FIND CNG STATIONS'}
        </button>
      </div>
      <div className="flex-1 relative min-h-[400px] lg:min-h-0">
        <MapContainer center={[22.9, 78.0]} zoom={5} style={{ height: '100%', width: '100%', minHeight: '400px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          <MapUpdater start={startPos} dest={destPos} />
          {startPos && <Marker position={startPos} icon={startIcon}><Popup><b>Start:</b> {start.address}</Popup></Marker>}
          {destPos && <Marker position={destPos} icon={destIcon}><Popup><b>Destination:</b> {dest.address}</Popup></Marker>}
        </MapContainer>
      </div>
    </div>
  );
}
