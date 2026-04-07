import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      cart_items: { item_code: string; quantity: number }[];
      delivery_slot?: string;
      is_store_pickup?: boolean;
      address?: string;
      coupon_code?: string;
      delivery_instructions?: string;
    };

    const data = await erpnextFetch<{
      razorpay_order_id: string;
      amount: number;
      currency: string;
      sales_order: string;
    }>(
      '/api/method/freshlife.api.checkout.create_order',
      { method: 'POST', body, userToken: token }
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
