import { NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';
import type { Customer } from '@/lib/types/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body as { phone: string; otp: string };

    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const data = await erpnextFetch<{ token: string; customer: Customer; is_new_user: boolean }>(
      '/api/method/freshlife.api.auth.verify_otp',
      { method: 'POST', body: { phone_number: phone, otp } }
    );

    const response = NextResponse.json({
      customer: data.customer,
      is_new_user: data.is_new_user,
    });

    response.cookies.set('freshlife_auth', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'OTP verification failed' }, { status: 500 });
  }
}
