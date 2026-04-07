import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const warehouse = request.nextUrl.searchParams.get('warehouse');
    if (!warehouse) {
      return NextResponse.json({ error: 'warehouse is required' }, { status: 400 });
    }

    const data = await erpnextFetch(
      '/api/method/freshlife.api.delivery.check_store_pickup',
      { params: { warehouse } }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch store pickup info' }, { status: 500 });
  }
}
