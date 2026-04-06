async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface CreateOrderResponse {
  razorpay_order_id: string;
  amount: number;
  currency: string;
  sales_order: string;
}

export interface VerifyPaymentResponse {
  status: string;
  sales_order: string;
}

export async function createPaymentOrder(params: {
  cart_items: { item_code: string; quantity: number }[];
  delivery_slot?: string;
  is_store_pickup?: boolean;
  address?: string;
  coupon_code?: string;
  delivery_instructions?: string;
}): Promise<CreateOrderResponse> {
  const res = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<CreateOrderResponse>(res);
}

export async function verifyPayment(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  sales_order: string;
}): Promise<VerifyPaymentResponse> {
  const res = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<VerifyPaymentResponse>(res);
}
