/**
 * POST /api/magic-list/add-to-cart
 *
 * Bulk-syncs matched Magic List items to the ERPNext cart.
 *
 * Auth: HTTP-only cookie `freshlife_auth` required
 *
 * Request body:
 *   items: Array<{ item_code: string, qty: number }> — matched items to add
 *
 * Response 200:
 *   ERPNext cart sync response
 *
 * Response 4xx/5xx:
 *   { error: string }
 *
 * ERPNext method: freshlife.api.magic_list.add_magic_list_to_cart
 */
import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch, ERPNextError } from '@/lib/api/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('freshlife_auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = await erpnextFetch('/api/method/freshlife.api.magic_list.add_magic_list_to_cart', {
      method: 'POST',
      body,
      userToken: token,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ERPNextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to add magic list to cart' }, { status: 500 });
  }
}
