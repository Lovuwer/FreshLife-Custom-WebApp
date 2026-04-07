import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const item_group = sp.get('item_group');
    if (!item_group) {
      return NextResponse.json({ error: 'item_group is required' }, { status: 400 });
    }

    const params: Record<string, string> = { item_group };
    const warehouse = sp.get('warehouse');
    const page = sp.get('page');
    const page_size = sp.get('page_size');
    const sort_by = sp.get('sort_by');
    if (warehouse) params.warehouse = warehouse;
    if (page) params.page = page;
    if (page_size) params.page_size = page_size;
    if (sort_by) params.sort_by = sort_by;

    const data = await erpnextFetch(
      '/api/method/freshlife.api.catalog.get_category_items',
      { params }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch category items' }, { status: 500 });
  }
}
