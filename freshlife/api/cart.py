"""
FreshLife Cart API
Endpoints: sync_cart, apply_coupon, get_bill_summary
"""

import frappe
from frappe import _

from freshlife.utils.pricing import calculate_bill
from freshlife.utils.stock import get_stock_qty

MIN_ORDER_VALUE = 500.0


@frappe.whitelist()
def sync_cart(items: list) -> dict:
    """
    Full cart sync from client.
    - Validates all items exist and are in stock
    - Updates server-side Cart DocType
    - Returns validated cart with current prices and stock status
    Parameters: items = [{ "item_code": "X", "quantity": 2 }, ...]
    Returns: {
        "items": [...],
        "subtotal": float,
        "item_count": int
    }
    """
    if isinstance(items, str):
        import json
        items = json.loads(items)

    customer_name = _get_current_customer()

    # Validate and enrich items
    validated = []
    for entry in items:
        item_code = entry.get("item_code")
        quantity = int(entry.get("quantity", 1))
        if not item_code or quantity < 1:
            continue
        if not frappe.db.exists("Item", item_code):
            continue

        item_doc = frappe.get_doc("Item", item_code)
        stock_qty = get_stock_qty(item_code)
        in_stock = stock_qty > 0

        validated.append({
            "item_code": item_code,
            "item_name": item_doc.item_name,
            "quantity": quantity,
            "rate": item_doc.standard_rate,
            "image": item_doc.image or "",
            "in_stock": in_stock,
            "max_qty": int(stock_qty),
            "custom_unit_label": item_doc.get("custom_unit_label") or "",
        })

    # Persist to server-side Cart
    _upsert_cart(customer_name, validated)

    subtotal = sum(i["rate"] * i["quantity"] for i in validated)
    return {
        "items": validated,
        "subtotal": subtotal,
        "item_count": sum(i["quantity"] for i in validated),
    }


@frappe.whitelist()
def apply_coupon(coupon_code: str, cart_items: list) -> dict:
    """
    Validate and apply a coupon code against the current cart.
    Returns: {
        "valid": bool,
        "discount_amount": float,
        "message": str,
        "pricing_rule": str
    }
    """
    if isinstance(cart_items, str):
        import json
        cart_items = json.loads(cart_items)

    if not frappe.db.exists("Coupon Code", {"coupon_code": coupon_code}):
        return {"valid": False, "discount_amount": 0.0, "message": _("Invalid coupon code."), "pricing_rule": ""}

    coupon = frappe.get_doc("Coupon Code", {"coupon_code": coupon_code})

    if not coupon.valid_from or not coupon.valid_upto:
        pass  # No date restriction
    else:
        today = frappe.utils.today()
        if str(coupon.valid_from) > today or str(coupon.valid_upto) < today:
            return {"valid": False, "discount_amount": 0.0, "message": _("Coupon has expired."), "pricing_rule": ""}

    if coupon.maximum_use and coupon.used >= coupon.maximum_use:
        return {"valid": False, "discount_amount": 0.0, "message": _("Coupon usage limit reached."), "pricing_rule": ""}

    subtotal = sum(float(i.get("rate", 0)) * int(i.get("quantity", 1)) for i in cart_items)

    # Resolve discount from linked Pricing Rule
    discount_amount = 0.0
    pricing_rule_name = coupon.pricing_rule or ""
    if pricing_rule_name and frappe.db.exists("Pricing Rule", pricing_rule_name):
        pr = frappe.get_doc("Pricing Rule", pricing_rule_name)
        if pr.discount_percentage:
            discount_amount = round(subtotal * pr.discount_percentage / 100, 2)
        elif pr.discount_amount:
            discount_amount = min(float(pr.discount_amount), subtotal)

    return {
        "valid": True,
        "discount_amount": discount_amount,
        "message": _("Coupon applied successfully."),
        "pricing_rule": pricing_rule_name,
    }


@frappe.whitelist()
def get_bill_summary(
    cart_items: list,
    coupon_code: str = None,
    delivery_slot: str = None,
    is_store_pickup: bool = False,
    address: str = None,
) -> dict:
    """
    Complete bill calculation for the checkout page.
    Returns: {
        "subtotal": float,
        "delivery_fee": float,
        "tax_amount": float,
        "discount_amount": float,
        "grand_total": float,
        "savings": float,
        "min_order_met": bool,
        "min_order_value": float,
        "breakdown": [{ "label": str, "amount": float }]
    }
    """
    if isinstance(cart_items, str):
        import json
        cart_items = json.loads(cart_items)

    return calculate_bill(
        cart_items=cart_items,
        coupon_code=coupon_code,
        delivery_slot=delivery_slot,
        is_store_pickup=bool(is_store_pickup),
    )


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_current_customer() -> str:
    if frappe.session.user == "Guest":
        frappe.throw(_("Authentication required."), frappe.AuthenticationError)
    email = frappe.session.user
    customer_name = frappe.db.get_value("Customer", {"email_id": email}, "name")
    if not customer_name:
        phone = email.replace("fl_", "").replace("@freshlife.local", "")
        customer_name = frappe.db.get_value("Customer", {"custom_phone_number": phone}, "name")
    if not customer_name:
        frappe.throw(_("Customer record not found."), frappe.DoesNotExistError)
    return customer_name


def _upsert_cart(customer_name: str, items: list) -> None:
    """Create or update the server-side Cart document."""
    cart_name = frappe.db.get_value("Cart", {"customer": customer_name}, "name")
    if cart_name:
        cart = frappe.get_doc("Cart", cart_name)
        cart.items = []
    else:
        cart = frappe.new_doc("Cart")
        cart.customer = customer_name

    for item in items:
        row = cart.append("items", {})
        row.item_code = item["item_code"]
        row.item_name = item["item_name"]
        row.quantity = item["quantity"]
        row.rate = item["rate"]
        row.image = item.get("image", "")

    cart.last_synced = frappe.utils.now_datetime()
    cart.save(ignore_permissions=True)
    frappe.db.commit()
