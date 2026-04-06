import type { OrderHistory } from '@/lib/types/order';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getOrderHistory(page = 0, pageSize = 10): Promise<OrderHistory> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  const res = await fetch(`/api/orders/history?${params}`);
  return handleResponse<OrderHistory>(res);
}

export async function reorderItems(salesOrder: string): Promise<{ items: { item_code: string; item_name: string; quantity: number; rate: number }[] }> {
  const res = await fetch('/api/orders/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sales_order: salesOrder }),
  });
  return handleResponse(res);
}
