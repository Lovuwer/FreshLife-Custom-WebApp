/**
 * POST /api/orders/create
 *
 * Creates a Sales Order in ERPNext before the Razorpay payment modal is opened.
 * First step of the two-step checkout flow.
 *
 * Auth: HTTP-only cookie `freshlife_auth` required
 *
 * Request body:
 *   items: Array<{ item_code: string, qty: number }> — cart items
 *   delivery_slot?: string — Delivery Slot DocType name
 *   is_store_pickup?: boolean — store pickup flag
 *   delivery_instructions?: string — optional delivery notes
 *   coupon_code?: string — applied coupon code
 *   address_name?: string — Address DocType name
 *
 * Response 200:
 *   { name: string, grand_total: number, ... } — created Sales Order
 *
 * Response 4xx/5xx:
 *   { error: string }
 *
 * ERPNext method: freshlife.api.checkout.create_order
 */
import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch, ERPNextError } from '@/lib/api/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('freshlife_auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = await erpnextFetch('/api/method/freshlife.api.checkout.create_order', {
      method: 'POST',
      body,
      userToken: token,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ERPNextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
