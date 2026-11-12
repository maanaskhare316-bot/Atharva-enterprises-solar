import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RotateCcw, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, clearSelection } = useAppContext();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const save = (patch: any) => {
    updateSettings(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDemo = () => {
    localStorage.clear();
    clearSelection();
    navigate('/');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Customize your CNG Navigator experience</p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            <span className="text-emerald-600 text-sm font-semibold">✓ Settings saved</span>
          </div>
        )}
      </div>

      <Section title="Display Preferences">
        <SettingRow label="Distance Unit" description="Unit for displaying distances">
          <div className="flex gap-2">
            {['km', 'miles'].map(u => (
              <button key={u} onClick={() => save({ distanceUnit: u })}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition ${settings.distanceUnit === u ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {u}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label="Theme" description="Visual appearance (Dark mode coming soon)">
          <span className="text-sm text-slate-400 italic">Light (default)</span>
        </SettingRow>
      </Section>

      <Section title="Trip Defaults">
        <SettingRow label="Default Vehicle Type" description="Pre-selected vehicle type in trip planner">
          <div className="flex gap-2 flex-wrap justify-end">
            {['car', 'auto', 'bus', 'truck'].map(v => (
              <button key={v} onClick={() => save({ defaultVehicleType: v })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition ${settings.defaultVehicleType === v ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {v}
              </button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label={`Max Detour Preference: ${settings.maxDetourKm} km`} description="Maximum acceptable route detour">
          <input type="range" min={1} max={15} value={settings.maxDetourKm}
            onChange={e => save({ maxDetourKm: Number(e.target.value) })}
            className="w-32 accent-emerald-600" />
        </SettingRow>
        <SettingRow label={`Station Search Radius: ${settings.searchRadiusKm} km`} description="Radius to search for CNG stations around route">
          <input type="range" min={1} max={20} value={settings.searchRadiusKm}
            onChange={e => save({ searchRadiusKm: Number(e.target.value) })}
            className="w-32 accent-emerald-600" />
        </SettingRow>
      </Section>

      <Section title="Simulation">
        <SettingRow label="Enable Live Simulation" description="Simulate real-time queue and pressure fluctuations">
          <Toggle checked={settings.simulationEnabled} onChange={v => save({ simulationEnabled: v })} />
        </SettingRow>
        <SettingRow label="Simulation Interval" description="How often the simulation updates">
          <span className="text-sm text-slate-500">Every 8 seconds</span>
        </SettingRow>
        <div className="pt-2 border-t border-slate-100">
          <button onClick={resetDemo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition">
            <RotateCcw size={14} /> Reset Demo Data
          </button>
          <p className="text-xs text-slate-400 mt-1.5">Clears local settings and returns to dashboard</p>
        </div>
      </Section>

      <Section title="About">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Application</span><span className="font-semibold text-slate-800">CNG Navigator v1.0.0</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Frontend</span><span className="font-semibold text-slate-800">React 18 + TypeScript + Vite</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Backend</span><span className="font-semibold text-slate-800">Spring Boot 3.3.5 + H2 DB</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Routing</span><span className="font-semibold text-slate-800">OSRM / Demo Fallback</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Maps</span><span className="font-semibold text-slate-800">OpenStreetMap + Leaflet</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Charts</span><span className="font-semibold text-slate-800">Recharts</span></div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2">
          <Info size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">This application is a demonstration. All station data, queue numbers, and pressure readings are simulated and do not represent actual CNG station conditions.</p>
        </div>
      </Section>
    </div>
  );
}
