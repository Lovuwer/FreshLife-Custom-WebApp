import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    const body = await request.json() as { items: { item_code: string; quantity: number }[] };

    const data = await erpnextFetch(
      '/api/method/freshlife.api.cart.sync_cart',
      { method: 'POST', body: { items: body.items }, userToken: token }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Cart sync failed' }, { status: 500 });
  }
}
