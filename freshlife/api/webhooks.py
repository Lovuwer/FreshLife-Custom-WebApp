"""
FreshLife Inbound Webhooks Handler
Handles inbound webhooks from Razorpay and ERPNext.
"""

import hashlib
import hmac
import json

import frappe
from frappe import _


def _verify_razorpay_webhook(body: bytes, signature: str) -> bool:
    webhook_secret = frappe.conf.get("razorpay_webhook_secret", "")
    if not webhook_secret:
        return False
    expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@frappe.whitelist(allow_guest=True)
def razorpay() -> dict:
    """
    Handle inbound Razorpay webhook events.
    Supported events: payment.captured, payment.failed, refund.processed
    """
    request = frappe.local.request
    body = request.get_data()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if not _verify_razorpay_webhook(body, signature):
        frappe.throw(_("Webhook signature verification failed."), frappe.AuthenticationError)

    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        frappe.throw(_("Invalid webhook payload."), frappe.ValidationError)

    event = payload.get("event")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})

    if event == "payment.captured":
        _handle_payment_captured(entity)
    elif event == "payment.failed":
        _handle_payment_failed(entity)
    elif event == "refund.processed":
        refund_entity = payload.get("payload", {}).get("refund", {}).get("entity", {})
        _handle_refund_processed(refund_entity)

    return {"status": "ok"}


@frappe.whitelist(allow_guest=True)
def erpnext() -> dict:
    """
    Handle inbound ERPNext webhooks (e.g., Sales Order status changes).
    Validates via X-Webhook-Secret header.
    """
    request = frappe.local.request
    secret = request.headers.get("X-Webhook-Secret", "")
    expected_secret = frappe.conf.get("erpnext_webhook_secret", "")

    if expected_secret and not hmac.compare_digest(secret, expected_secret):
        frappe.throw(_("Webhook secret verification failed."), frappe.AuthenticationError)

    try:
        payload = json.loads(request.get_data())
    except json.JSONDecodeError:
        frappe.throw(_("Invalid webhook payload."), frappe.ValidationError)

    # Handle Sales Order updates, Delivery Note creation, etc.
    frappe.log_error(json.dumps(payload), "ERPNext Webhook Received")

    return {"status": "ok"}


# ─── Event Handlers ───────────────────────────────────────────────────────────

def _handle_payment_captured(entity: dict) -> None:
    order_id = entity.get("order_id")
    payment_id = entity.get("id")
    if not order_id:
        return
    sales_order = frappe.db.get_value("Sales Order", {"custom_razorpay_order_id": order_id}, "name")
    if not sales_order:
        return
    frappe.db.set_value("Sales Order", sales_order, {
        "custom_razorpay_payment_id": payment_id,
        "custom_payment_status": "Captured",
    })
    frappe.db.commit()


def _handle_payment_failed(entity: dict) -> None:
    order_id = entity.get("order_id")
    if not order_id:
        return
    sales_order = frappe.db.get_value("Sales Order", {"custom_razorpay_order_id": order_id}, "name")
    if not sales_order:
        return
    frappe.db.set_value("Sales Order", sales_order, "custom_payment_status", "Failed")
    frappe.db.commit()


def _handle_refund_processed(entity: dict) -> None:
    refund_id = entity.get("id")
    payment_id = entity.get("payment_id")
    if not refund_id:
        return
    refund_tracker = frappe.db.get_value(
        "Refund Tracker",
        {"razorpay_refund_id": refund_id},
        "name",
    )
    if refund_tracker:
        frappe.db.set_value("Refund Tracker", refund_tracker, {
            "status": "Completed",
            "completed_at": frappe.utils.now_datetime(),
        })
        frappe.db.commit()
