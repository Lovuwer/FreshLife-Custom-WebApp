import type { BillSummary, CouponValidation, CartItem } from '@/lib/types/cart';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function syncCart(
  items: { item_code: string; quantity: number }[]
): Promise<{ items: CartItem[]; subtotal: number; item_count: number }> {
  const res = await fetch('/api/cart/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return handleResponse(res);
}

export async function applyCoupon(
  couponCode: string,
  cartItems: { item_code: string; quantity: number }[]
): Promise<CouponValidation> {
  const res = await fetch('/api/cart/coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coupon_code: couponCode, cart_items: cartItems }),
  });
  return handleResponse<CouponValidation>(res);
}

export async function getBillSummary(params: {
  cart_items: { item_code: string; quantity: number }[];
  coupon_code?: string;
  delivery_slot?: string;
  is_store_pickup?: boolean;
  address?: string;
}): Promise<BillSummary> {
  const res = await fetch('/api/cart/bill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<BillSummary>(res);
}
