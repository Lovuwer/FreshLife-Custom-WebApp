import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = sp.get('q');
    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const params: Record<string, string> = { query };
    const warehouse = sp.get('warehouse');
    const limit = sp.get('limit');
    if (warehouse) params.warehouse = warehouse;
    if (limit) params.limit = limit;

    const data = await erpnextFetch(
      '/api/method/freshlife.api.catalog.search_items',
      { params }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
