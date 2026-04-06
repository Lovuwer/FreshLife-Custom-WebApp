import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemCode: string }> }
) {
  try {
    const { itemCode } = await params;
    const warehouse = request.nextUrl.searchParams.get('warehouse');
    const queryParams: Record<string, string> = { item_code: itemCode };
    if (warehouse) queryParams.warehouse = warehouse;

    const data = await erpnextFetch(
      '/api/method/freshlife.api.catalog.get_product_detail',
      { params: queryParams }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product detail' }, { status: 500 });
  }
}
