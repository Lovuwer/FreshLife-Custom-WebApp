import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('freshlife_auth')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      sales_order: string;
    };

    // Server-side signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Payment config error' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== body.razorpay_signature) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Confirm payment with ERPNext backend
    const data = await erpnextFetch<{ status: string; sales_order: string }>(
      '/api/method/freshlife.api.checkout.confirm_payment',
      {
        method: 'POST',
        body: {
          sales_order: body.sales_order,
          razorpay_order_id: body.razorpay_order_id,
          razorpay_payment_id: body.razorpay_payment_id,
          razorpay_signature: body.razorpay_signature,
        },
        userToken: token,
      }
    );

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
