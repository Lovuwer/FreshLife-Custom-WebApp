"""
FreshLife Pricing Utilities
Bill calculation including delivery fees, tax, and coupon discounts.
"""

import frappe

MIN_ORDER_VALUE = 500.0
FREE_DELIVERY_THRESHOLD = 500.0
STANDARD_DELIVERY_FEE = 29.0
_DEFAULT_TAX_RATE = 0.05  # 5% GST fallback


def _get_tax_rate() -> float:
    """Return the configured tax rate, falling back to the default 5% GST."""
    return float(frappe.conf.get("freshlife_tax_rate", _DEFAULT_TAX_RATE))


def calculate_bill(
    cart_items: list,
    coupon_code: str = None,
    delivery_slot: str = None,
    is_store_pickup: bool = False,
) -> dict:
    """
    Calculate the full bill breakdown for a cart.
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
    subtotal = sum(
        float(item.get("rate", 0)) * int(item.get("quantity", 1))
        for item in cart_items
    )

    # Delivery fee
    delivery_fee = 0.0
    if not is_store_pickup:
        if delivery_slot and frappe.db.exists("Delivery Slot", delivery_slot):
            delivery_fee = float(
                frappe.db.get_value("Delivery Slot", delivery_slot, "delivery_fee") or 0
            )
        elif subtotal < FREE_DELIVERY_THRESHOLD:
            delivery_fee = STANDARD_DELIVERY_FEE

    # Coupon discount
    discount_amount = 0.0
    if coupon_code:
        coupon_name = frappe.db.get_value("Coupon Code", {"coupon_code": coupon_code}, "name")
        if coupon_name:
            coupon_doc = frappe.get_doc("Coupon Code", coupon_name)
            pr_name = coupon_doc.pricing_rule
            if pr_name and frappe.db.exists("Pricing Rule", pr_name):
                pr = frappe.get_doc("Pricing Rule", pr_name)
                if pr.discount_percentage:
                    discount_amount = round(subtotal * float(pr.discount_percentage) / 100, 2)
                elif pr.discount_amount:
                    discount_amount = min(float(pr.discount_amount), subtotal)

    taxable_amount = max(subtotal - discount_amount, 0)
    tax_amount = round(taxable_amount * _get_tax_rate(), 2)
    grand_total = round(taxable_amount + delivery_fee + tax_amount, 2)
    savings = round(discount_amount, 2)
    min_order_met = is_store_pickup or subtotal >= MIN_ORDER_VALUE

    breakdown = [
        {"label": "Subtotal", "amount": round(subtotal, 2)},
    ]
    if discount_amount:
        breakdown.append({"label": "Coupon Discount", "amount": -round(discount_amount, 2)})
    breakdown.append({"label": "GST (5%)", "amount": tax_amount})
    if delivery_fee:
        breakdown.append({"label": "Delivery Fee", "amount": delivery_fee})
    breakdown.append({"label": "Grand Total", "amount": grand_total})

    return {
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "tax_amount": tax_amount,
        "discount_amount": discount_amount,
        "grand_total": grand_total,
        "savings": savings,
        "min_order_met": min_order_met,
        "min_order_value": MIN_ORDER_VALUE,
        "breakdown": breakdown,
    }
