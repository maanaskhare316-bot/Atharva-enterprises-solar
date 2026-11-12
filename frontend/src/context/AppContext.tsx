import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { stationApi } from '../services/api';
import type { AppSettings, StationSummaryDto } from '../types/index';
import { DEMO_STATIONS } from '../data/demoStations';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SETTINGS_KEY = 'cng-navigator-settings';
const MAX_SELECTION = 3;

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  distanceUnit: 'km',
  defaultVehicleType: 'car',
  maxDetourKm: 5,
  searchRadiusKm: 10,
  simulationEnabled: true,
};

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
export interface AppContextValue {
  /** All stations fetched from the backend (or demo fallback). */
  stations: StationSummaryDto[];
  /** True while the initial stations fetch is in-flight. */
  isLoading: boolean;
  /** Error message from the last failed fetch, or null. */
  error: string | null;
  /** User-persisted application settings. */
  settings: AppSettings;
  /** Merge-update settings (persists to localStorage). */
  updateSettings: (patch: Partial<AppSettings>) => void;
  /** IDs of stations currently selected for comparison (max 3). */
  selectedStations: number[];
  /** Add or remove a station from the comparison selection. */
  toggleStationSelection: (id: number) => void;
  /** Clear all selected stations. */
  clearSelection: () => void;
  /** Re-fetch the stations list from the backend. */
  refreshStations: () => void;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------
const AppContext = createContext<AppContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    }
  } catch {
    // ignore malformed JSON
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors (e.g. private browsing quota)
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [stations, setStations] = useState<StationSummaryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [selectedStations, setSelectedStations] = useState<number[]>([]);

  // Track whether the component is still mounted to avoid state updates after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Fetch stations
  // -------------------------------------------------------------------------
  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stationApi.getAll();
      if (mountedRef.current) {
        setStations(data);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message =
        err instanceof Error ? err.message : 'Failed to load stations';
      console.warn('[AppContext] Backend unavailable, using demo stations.', message);
      setStations(DEMO_STATIONS);
      setError(null); // Don't surface error to UI; demo data serves as fallback.
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount.
  useEffect(() => {
    void fetchStations();
  }, [fetchStations]);

  // -------------------------------------------------------------------------
  // Settings
  // -------------------------------------------------------------------------
  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  // Apply theme class to <html> element.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // -------------------------------------------------------------------------
  // Station selection (comparison)
  // -------------------------------------------------------------------------
  const toggleStationSelection = useCallback((id: number) => {
    setSelectedStations((prev) => {
      if (prev.includes(id)) {
        return prev.filter((s) => s !== id);
      }
      if (prev.length >= MAX_SELECTION) {
        // Replace the oldest selection when cap is reached.
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedStations([]);
  }, []);

  // -------------------------------------------------------------------------
  // Context value (memoised to avoid unnecessary re-renders)
  // -------------------------------------------------------------------------
  const value = useMemo<AppContextValue>(
    () => ({
      stations,
      isLoading,
      error,
      settings,
      updateSettings,
      selectedStations,
      toggleStationSelection,
      clearSelection,
      refreshStations: fetchStations,
    }),
    [
      stations,
      isLoading,
      error,
      settings,
      updateSettings,
      selectedStations,
      toggleStationSelection,
      clearSelection,
      fetchStations,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook — throws if used outside provider (dev-time guard).
// ---------------------------------------------------------------------------
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside <AppProvider>');
  }
  return ctx;
}

export default AppContext;
