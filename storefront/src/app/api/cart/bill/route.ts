import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    const body = await request.json();

    const data = await erpnextFetch(
      '/api/method/freshlife.api.cart.get_bill_summary',
      { method: 'POST', body, userToken: token }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to calculate bill' }, { status: 500 });
  }
}
