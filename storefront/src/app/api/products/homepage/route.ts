import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const warehouse = request.nextUrl.searchParams.get('warehouse');
    const params: Record<string, string> = {};
    if (warehouse) params.warehouse = warehouse;

    const data = await erpnextFetch(
      '/api/method/freshlife.api.catalog.get_homepage_data',
      { params }
    );

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 });
  }
}
