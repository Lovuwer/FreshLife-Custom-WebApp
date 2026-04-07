import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { sales_order: string };

    const data = await erpnextFetch(
      '/api/method/freshlife.api.checkout.reorder',
      { method: 'POST', body, userToken: token }
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Reorder failed' }, { status: 500 });
  }
}
