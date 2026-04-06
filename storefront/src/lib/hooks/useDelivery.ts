'use client';
import { useQuery } from '@tanstack/react-query';
import { getDeliverySlots, getStorePickup } from '@/lib/api/delivery';

export function useDeliverySlots(warehouse: string | null) {
  return useQuery({
    queryKey: ['delivery-slots', warehouse],
    queryFn: () => getDeliverySlots(warehouse!, { daysAhead: 3 }),
    enabled: !!warehouse,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStorePickup(warehouse: string | null) {
  return useQuery({
    queryKey: ['store-pickup', warehouse],
    queryFn: () => getStorePickup(warehouse!),
    enabled: !!warehouse,
    staleTime: 5 * 60 * 1000,
  });
}
