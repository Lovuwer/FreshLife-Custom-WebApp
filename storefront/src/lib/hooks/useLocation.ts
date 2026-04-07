/**
 * useLocation — wraps the browser Geolocation API + locationStore.
 *
 * Used by Header.tsx to display the current delivery location
 * and by AddressForm.tsx to auto-fill coordinates.
 *
 * @returns {
 *   currentLocation: LocationData | null — current stored location,
 *   setLocation: (loc) => void — persist a new location,
 *   clearLocation: () => void — remove stored location,
 *   requestGeolocation: () => Promise<GeolocationCoordinates> — prompt browser for GPS,
 *   hasLocation: boolean — convenience flag
 * }
 */
'use client';
import { useLocationStore } from '@/lib/stores/locationStore';

export function useLocation() {
  const { currentLocation, setLocation, clearLocation } = useLocationStore();

  const requestGeolocation = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    });
  };

  return {
    currentLocation,
    setLocation,
    clearLocation,
    requestGeolocation,
    hasLocation: currentLocation !== null,
  };
}
