"""
FreshLife Checkout API
Endpoints: create_order, confirm_payment, get_order_history, reorder
"""

import hashlib
import hmac

import frappe
from frappe import _

from freshlife.utils.pricing import calculate_bill
from freshlife.utils.stock import get_stock_qty


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


@frappe.whitelist()
def create_order(
    cart_items: list,
    delivery_address: str,
    delivery_slot: str = None,
    is_store_pickup: bool = False,
    pickup_warehouse: str = None,
    coupon_code: str = None,
    delivery_instructions: str = None,
    razorpay_order_id: str = None,
) -> dict:
    """
    Create a Sales Order from a validated cart.
    Flow:
        1. Validate all items are in stock (atomic check)
        2. Create Sales Order (Draft)
        3. Apply coupon if provided
        4. Attach delivery slot (increment slot counter)
        5. Store Razorpay order reference
    Returns: {
        "sales_order": "SO-00001",
        "grand_total": float,
        "razorpay_order_id": str
    }
    """
    if isinstance(cart_items, str):
        import json
        cart_items = json.loads(cart_items)

    customer_name = _get_current_customer()

    # Atomic stock validation
    for entry in cart_items:
        item_code = entry.get("item_code")
        qty_requested = int(entry.get("quantity", 1))
        available = get_stock_qty(item_code)
        if available < qty_requested:
            frappe.throw(
                _(f"Insufficient stock for item {item_code}. Available: {available}"),
                frappe.ValidationError,
            )

    # Bill calculation
    bill = calculate_bill(cart_items, coupon_code, delivery_slot, bool(is_store_pickup))

    # Create Sales Order
    so = frappe.new_doc("Sales Order")
    so.customer = customer_name
    so.transaction_date = frappe.utils.today()
    so.delivery_date = frappe.utils.today()
    so.order_type = "Shopping Cart"
    so.custom_is_store_pickup = bool(is_store_pickup)
    so.custom_delivery_instructions = delivery_instructions or ""
    so.custom_razorpay_order_id = razorpay_order_id or ""
    so.custom_payment_status = "Pending"
    so.custom_delivery_fee = bill.get("delivery_fee", 0)
    so.custom_source_channel = "Web"

    if delivery_slot:
        so.custom_delivery_slot = delivery_slot
    if pickup_warehouse:
        so.custom_pickup_warehouse = pickup_warehouse
    if coupon_code:
        coupon_name = frappe.db.get_value("Coupon Code", {"coupon_code": coupon_code}, "name")
        if coupon_name:
            so.custom_coupon_code = coupon_name

    for entry in cart_items:
        item_doc = frappe.get_doc("Item", entry["item_code"])
        so.append("items", {
            "item_code": entry["item_code"],
            "item_name": item_doc.item_name,
            "qty": int(entry.get("quantity", 1)),
            "rate": item_doc.standard_rate,
            "uom": item_doc.stock_uom,
            "delivery_date": frappe.utils.today(),
        })

    so.insert(ignore_permissions=True)
    frappe.db.commit()

    # Increment delivery slot counter
    if delivery_slot and frappe.db.exists("Delivery Slot", delivery_slot):
        frappe.db.set_value(
            "Delivery Slot",
            delivery_slot,
            "current_orders",
            frappe.db.get_value("Delivery Slot", delivery_slot, "current_orders") + 1,
        )
        frappe.db.commit()

    return {
        "sales_order": so.name,
        "grand_total": so.grand_total,
        "razorpay_order_id": razorpay_order_id or "",
    }


@frappe.whitelist()
def confirm_payment(
    sales_order: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str,
) -> dict:
    """
    Verify Razorpay payment signature and submit the Sales Order.
    Flow:
        1. Verify HMAC SHA256 signature
        2. Update Sales Order payment fields
        3. Submit Sales Order (Draft → Submitted)
    Returns: { "status": "confirmed", "sales_order": str }
    """
    # Verify signature
    key_secret = frappe.conf.get("razorpay_key_secret", "")
    if not key_secret:
        frappe.throw(_("Razorpay key secret not configured."), frappe.ConfigurationError)

    expected = hmac.new(
        key_secret.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, razorpay_signature):
        frappe.throw(_("Payment verification failed: invalid signature."), frappe.AuthenticationError)

    if not frappe.db.exists("Sales Order", sales_order):
        frappe.throw(_("Sales Order not found."), frappe.DoesNotExistError)

    so = frappe.get_doc("Sales Order", sales_order)
    so.custom_razorpay_payment_id = razorpay_payment_id
    so.custom_razorpay_order_id = razorpay_order_id
    so.custom_payment_status = "Captured"
    so.save(ignore_permissions=True)
    so.submit()
    frappe.db.commit()

    return {"status": "confirmed", "sales_order": sales_order}


@frappe.whitelist()
def get_order_history(page: int = 0, page_size: int = 10) -> dict:
    """
    Past orders for the currently authenticated customer.
    Returns: {
        "orders": [...],
        "total": int,
        "has_more": bool
    }
    """
    page = int(page)
    page_size = int(page_size)
    customer_name = _get_current_customer()

    filters = {"customer": customer_name, "docstatus": ["!=", 2]}
    total = frappe.db.count("Sales Order", filters)

    orders = frappe.get_list(
        "Sales Order",
        filters=filters,
        fields=[
            "name", "creation", "grand_total", "status",
            "custom_payment_status", "custom_delivery_slot",
            "custom_is_store_pickup",
        ],
        order_by="creation desc",
        limit=page_size,
        limit_start=page * page_size,
        ignore_permissions=True,
    )

    for order in orders:
        order["items"] = frappe.get_list(
            "Sales Order Item",
            filters={"parent": order["name"]},
            fields=["item_code", "item_name", "qty", "rate", "image"],
            ignore_permissions=True,
        )

    return {
        "orders": orders,
        "total": total,
        "has_more": (page + 1) * page_size < total,
    }


@frappe.whitelist()
def reorder(sales_order: str) -> dict:
    """
    Re-add items from a past order to the cart, checking current stock.
    Returns: {
        "cart_items": [...],
        "unavailable_items": [...]
    }
    """
    if not frappe.db.exists("Sales Order", sales_order):
        frappe.throw(_("Sales Order not found."), frappe.DoesNotExistError)

    so_items = frappe.get_list(
        "Sales Order Item",
        filters={"parent": sales_order},
        fields=["item_code", "item_name", "qty", "rate", "image"],
        ignore_permissions=True,
    )

    available = []
    unavailable = []
    for item in so_items:
        stock = get_stock_qty(item["item_code"])
        if stock > 0:
            item_doc = frappe.get_doc("Item", item["item_code"])
            available.append({
                "item_code": item["item_code"],
                "item_name": item["item_name"],
                "quantity": item["qty"],
                "rate": item_doc.standard_rate,
                "in_stock": True,
                "image": item_doc.image or "",
            })
        else:
            unavailable.append({
                "item_code": item["item_code"],
                "item_name": item["item_name"],
                "reason": "Out of stock",
            })

    return {"cart_items": available, "unavailable_items": unavailable}
