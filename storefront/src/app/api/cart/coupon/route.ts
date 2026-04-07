import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    const body = await request.json() as {
      coupon_code: string;
      cart_items: { item_code: string; quantity: number }[];
    };

    const data = await erpnextFetch(
      '/api/method/freshlife.api.cart.apply_coupon',
      { method: 'POST', body, userToken: token }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Coupon validation failed' }, { status: 500 });
  }
}
