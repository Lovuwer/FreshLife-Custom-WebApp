import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await erpnextFetch(
      '/api/method/freshlife.api.account.get_refund_status',
      { userToken: token }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
  }
}
