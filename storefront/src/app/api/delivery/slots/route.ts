import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const warehouse = sp.get('warehouse');
    if (!warehouse) {
      return NextResponse.json({ error: 'warehouse is required' }, { status: 400 });
    }

    const params: Record<string, string> = { warehouse };
    const date = sp.get('date');
    const days_ahead = sp.get('days_ahead');
    if (date) params.date = date;
    if (days_ahead) params.days_ahead = days_ahead;

    const data = await erpnextFetch(
      '/api/method/freshlife.api.delivery.get_available_slots',
      { params }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch delivery slots' }, { status: 500 });
  }
}
