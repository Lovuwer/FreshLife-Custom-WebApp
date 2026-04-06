import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LocationData {
  address_name: string;
  address_title: string;
  address_line1: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  warehouse: string | null;
}

interface LocationState {
  currentLocation: LocationData | null;
  setLocation: (location: LocationData) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      currentLocation: null,

      setLocation: (location) => set({ currentLocation: location }),

      clearLocation: () => set({ currentLocation: null }),
    }),
    {
      name: 'freshlife-location',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
