/**
 * POST /api/orders/confirm-payment
 *
 * Confirms payment in ERPNext after Razorpay signature verification succeeds.
 * Updates the Sales Order payment status. Second step of the two-step checkout flow.
 *
 * Auth: HTTP-only cookie `freshlife_auth` required
 *
 * Request body:
 *   sales_order: string — Sales Order name
 *   razorpay_order_id: string — Razorpay order ID
 *   razorpay_payment_id: string — Razorpay payment ID
 *   razorpay_signature: string — Razorpay HMAC signature
 *
 * Response 200:
 *   { success: true, ... } — confirmation result
 *
 * Response 4xx/5xx:
 *   { error: string }
 *
 * ERPNext method: freshlife.api.checkout.confirm_payment
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
    const data = await erpnextFetch('/api/method/freshlife.api.checkout.confirm_payment', {
      method: 'POST',
      body,
      userToken: token,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ERPNextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
