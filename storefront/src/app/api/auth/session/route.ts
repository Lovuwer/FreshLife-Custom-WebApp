import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';
import type { Customer } from '@/lib/types/auth';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('freshlife_auth')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = await erpnextFetch<{ customer: Customer; cart_count: number }>(
      '/api/method/freshlife.api.auth.refresh_session',
      { userToken: token }
    );
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('freshlife_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
