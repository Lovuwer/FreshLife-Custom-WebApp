import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { erpnextFetch } from '@/lib/api/client';

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      payload: {
        payment?: { entity: { id: string; order_id: string; status: string; amount: number } };
        refund?: { entity: { id: string; payment_id: string; amount: number; status: string } };
        order?: { entity: { id: string; status: string } };
      };
    };

    // Forward verified webhook to ERPNext for processing
    await erpnextFetch(
      '/api/method/freshlife.api.checkout.handle_razorpay_webhook',
      {
        method: 'POST',
        body: { event: event.event, payload: event.payload },
      }
    );

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    // Log for debugging — return 200 to Razorpay to prevent retries for processing errors
    console.error('[Razorpay Webhook] Processing error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ status: 'received' }, { status: 200 });
  }
}
