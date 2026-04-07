/**
 * POST /api/webhook/erpnext
 *
 * Handles inbound webhooks from ERPNext (e.g. order status updates, stock alerts).
 * Verifies `X-Frappe-Webhook-Secret` header before processing.
 *
 * Auth: None (verified via webhook secret header)
 *
 * Request body:
 *   doctype: string — ERPNext DocType (e.g. "Sales Order")
 *   name: string — Document name
 *   event: string — Webhook event (e.g. "on_submit", "on_update")
 *   ... additional payload fields
 *
 * Response 200:
 *   { received: true }
 *
 * Response 401:
 *   { error: 'Invalid signature' }
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = process.env.ERPNEXT_WEBHOOK_SECRET;
  const incoming = request.headers.get('x-frappe-webhook-secret');

  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = await request.json();
  const { doctype, event } = payload;

  // Handle known events
  switch (`${doctype}:${event}`) {
    case 'Sales Order:on_submit':
      // e.g. trigger notification
      break;
    case 'Delivery Note:on_submit':
      // e.g. mark order as dispatched
      break;
    default:
      // Unknown event — log and acknowledge
      break;
  }

  return NextResponse.json({ received: true });
}
