import type { DeliverySlotsResponse, StorePickup } from '@/lib/types/delivery';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getDeliverySlots(
  warehouse: string,
  options?: { date?: string; daysAhead?: number }
): Promise<DeliverySlotsResponse> {
  const params = new URLSearchParams({ warehouse });
  if (options?.date) params.set('date', options.date);
  if (options?.daysAhead !== undefined) params.set('days_ahead', String(options.daysAhead));
  const res = await fetch(`/api/delivery/slots?${params}`);
  return handleResponse<DeliverySlotsResponse>(res);
}

export async function getStorePickup(warehouse: string): Promise<StorePickup> {
  const params = new URLSearchParams({ warehouse });
  const res = await fetch(`/api/delivery/pickup?${params}`);
  return handleResponse<StorePickup>(res);
}
