import type { Corridor } from '@/types';

export const CORRIDORS: Corridor[] = [
  {
    id: 'delhi-agra',
    label: 'Delhi → Agra',
    emoji: '🏯',
    startAddress: 'Connaught Place, New Delhi',
    startLat: 28.6315,
    startLng: 77.2167,
    destAddress: 'Taj Mahal, Agra',
    destLat: 27.1751,
    destLng: 78.0421,
  },
  {
    id: 'delhi-jaipur',
    label: 'Delhi → Jaipur',
    emoji: '🏰',
    startAddress: 'Delhi',
    startLat: 28.6517,
    startLng: 77.2219,
    destAddress: 'Jaipur',
    destLat: 26.9124,
    destLng: 75.7873,
  },
  {
    id: 'mumbai-pune',
    label: 'Mumbai → Pune',
    emoji: '🌊',
    startAddress: 'Dadar, Mumbai',
    startLat: 19.0176,
    startLng: 72.8562,
    destAddress: 'Shivajinagar, Pune',
    destLat: 18.5308,
    destLng: 73.8474,
  },
];

export const DEFAULT_CORRIDOR: Corridor = CORRIDORS[0];
