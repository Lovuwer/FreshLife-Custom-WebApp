import { NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body as { phone: string };

    if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const data = await erpnextFetch<{ message: string; expires_in: number }>(
      '/api/method/freshlife.api.auth.send_otp',
      { method: 'POST', body: { phone_number: phone } }
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to send OTP. Please try again.' }, { status: 500 });
  }
}
