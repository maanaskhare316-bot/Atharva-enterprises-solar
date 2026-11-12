import type { StationSummaryDto } from '@/types';

/**
 * Offline fallback demo stations along the Delhi → Agra corridor.
 * Used when the backend is unavailable.
 */
export const DEMO_STATIONS: StationSummaryDto[] = [
  {
    id: 9001,
    name: 'CNG Demo Station A',
    operator: 'IGL',
    address: 'Yamuna Expressway, Near Jewar Toll',
    city: 'Jewar',
    state: 'Uttar Pradesh',
    latitude: 28.142,
    longitude: 77.562,

    verifiedOpen: true,
    verifiedPricePerKg: 82.5,
    dispenserCapacityPerHour: 120,
    activeDispensers: 4,
    operatingHours: '24x7',
    amenities: ['Restroom', 'Parking'],

    distanceFromRouteKm: 0.4,
    extraDetourKm: 0.8,
    estimatedDetourMinutes: 2,
    distanceFromStartKm: 42.0,

    vehiclesWaiting: 2,
    estimatedWaitMinutes: 4,
    queueDataSource: 'DEMO',
    queueUpdatedAt: new Date().toISOString(),
    queueFreshness: 'LIVE',
    isQueueLive: true,

    currentPressureBar: 180,
    minSafeLimitBar: 120,
    maxSafeLimitBar: 250,
    sensorStatus: 'SIMULATED',
    pressureDataSource: 'DEMO',
    pressureUpdatedAt: new Date().toISOString(),
    pressureFreshness: 'LIVE',
    isPressureLive: true,

    recommendationCategory: 'NEAREST_ON_ROUTE',
    recommendationReason: 'Closest station on the expressway',
    score: 88,
  },
  {
    id: 9002,
    name: 'CNG Demo Station B',
    operator: 'ATGL',
    address: 'NH-19, Near Mathura Bypass',
    city: 'Mathura',
    state: 'Uttar Pradesh',
    latitude: 27.521,
    longitude: 77.671,

    verifiedOpen: true,
    verifiedPricePerKg: 83.1,
    dispenserCapacityPerHour: 90,
    activeDispensers: 3,
    operatingHours: '06:00–22:00',
    amenities: ['Restroom', 'Food'],

    distanceFromRouteKm: 1.1,
    extraDetourKm: 2.2,
    estimatedDetourMinutes: 5,
    distanceFromStartKm: 118.0,

    vehiclesWaiting: 8,
    estimatedWaitMinutes: 16,
    queueDataSource: 'DEMO',
    queueUpdatedAt: new Date().toISOString(),
    queueFreshness: 'LIVE',
    isQueueLive: true,

    currentPressureBar: 200,
    minSafeLimitBar: 120,
    maxSafeLimitBar: 250,
    sensorStatus: 'SIMULATED',
    pressureDataSource: 'DEMO',
    pressureUpdatedAt: new Date().toISOString(),
    pressureFreshness: 'LIVE',
    isPressureLive: true,

    recommendationCategory: null,
    recommendationReason: null,
    score: 61,
  },
  {
    id: 9003,
    name: 'CNG Demo Station C',
    operator: 'ATGL',
    address: 'Fatehabad Road, Near Agra',
    city: 'Agra',
    state: 'Uttar Pradesh',
    latitude: 27.218,
    longitude: 77.938,

    verifiedOpen: true,
    verifiedPricePerKg: 82.8,
    dispenserCapacityPerHour: 100,
    activeDispensers: 4,
    operatingHours: '24x7',
    amenities: ['Restroom', 'Parking', 'ATM'],

    distanceFromRouteKm: 0.6,
    extraDetourKm: 1.2,
    estimatedDetourMinutes: 3,
    distanceFromStartKm: 195.0,

    vehiclesWaiting: 1,
    estimatedWaitMinutes: 2,
    queueDataSource: 'DEMO',
    queueUpdatedAt: new Date().toISOString(),
    queueFreshness: 'LIVE',
    isQueueLive: true,

    currentPressureBar: 170,
    minSafeLimitBar: 120,
    maxSafeLimitBar: 250,
    sensorStatus: 'SIMULATED',
    pressureDataSource: 'DEMO',
    pressureUpdatedAt: new Date().toISOString(),
    pressureFreshness: 'LIVE',
    isPressureLive: true,

    recommendationCategory: 'BEST_OVERALL',
    recommendationReason: 'Shortest queue with good pressure and least detour',
    score: 95,
  },
];
