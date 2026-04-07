"""
FreshLife Account API
Endpoints: get_profile, update_profile, get_addresses, add_address,
           update_address, delete_address, get_refund_status,
           create_support_ticket, get_smart_reorder_suggestions
"""

import frappe
from frappe import _

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
def get_profile() -> dict:
    """Get customer profile data."""
    customer_name = _get_current_customer()
    customer = frappe.get_doc("Customer", customer_name)
    return {
        "name": customer.name,
        "customer_name": customer.customer_name,
        "phone": customer.get("custom_phone_number") or "",
        "email": customer.email_id or "",
        "referral_code": customer.get("custom_referral_code") or "",
        "membership_plan": customer.get("custom_membership_plan") or "",
        "membership_expiry": str(customer.get("custom_membership_expiry") or ""),
    }


@frappe.whitelist()
def update_profile(customer_name_val: str = None, email: str = None) -> dict:
    """Update customer profile name and/or email."""
    name = _get_current_customer()
    customer = frappe.get_doc("Customer", name)
    if customer_name_val:
        customer.customer_name = customer_name_val
    if email:
        customer.email_id = email
    customer.save(ignore_permissions=True)
    frappe.db.commit()
    return {"success": True}


@frappe.whitelist()
def get_addresses() -> dict:
    """Get all saved addresses for the current customer."""
    customer_name = _get_current_customer()
    addresses = frappe.get_list(
        "Dynamic Link",
        filters={"link_doctype": "Customer", "link_name": customer_name, "parenttype": "Address"},
        fields=["parent"],
        ignore_permissions=True,
    )
    result = []
    for row in addresses:
        addr = frappe.get_doc("Address", row["parent"])
        result.append({
            "name": addr.name,
            "address_title": addr.address_title,
            "address_line1": addr.address_line1,
            "address_line2": addr.address_line2 or "",
            "city": addr.city,
            "state": addr.state,
            "pincode": addr.pincode,
            "country": addr.country,
            "phone": addr.phone or "",
            "is_primary": addr.is_primary_address,
            "address_label": addr.get("custom_address_label") or "Home",
            "latitude": addr.get("custom_latitude"),
            "longitude": addr.get("custom_longitude"),
            "google_place_id": addr.get("custom_google_place_id") or "",
            "delivery_instructions": addr.get("custom_delivery_instructions") or "",
        })
    return {"addresses": result}


@frappe.whitelist()
def add_address(
    address_title: str,
    address_line1: str,
    city: str,
    state: str,
    pincode: str,
    country: str = "India",
    phone: str = None,
    address_line2: str = None,
    latitude: float = None,
    longitude: float = None,
    google_place_id: str = None,
    delivery_instructions: str = None,
    address_label: str = "Home",
) -> dict:
    """Create a new address linked to the current customer."""
    customer_name = _get_current_customer()

    addr = frappe.new_doc("Address")
    addr.address_title = address_title
    addr.address_line1 = address_line1
    addr.address_line2 = address_line2 or ""
    addr.city = city
    addr.state = state
    addr.pincode = pincode
    addr.country = country
    addr.phone = phone or ""
    addr.custom_address_label = address_label
    if latitude is not None:
        addr.custom_latitude = float(latitude)
    if longitude is not None:
        addr.custom_longitude = float(longitude)
    addr.custom_google_place_id = google_place_id or ""
    addr.custom_delivery_instructions = delivery_instructions or ""
    addr.append("links", {"link_doctype": "Customer", "link_name": customer_name})
    addr.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"name": addr.name, "success": True}


@frappe.whitelist()
def update_address(address_name: str, **kwargs) -> dict:
    """Update fields on an existing address."""
    if not frappe.db.exists("Address", address_name):
        frappe.throw(_("Address not found."), frappe.DoesNotExistError)
    addr = frappe.get_doc("Address", address_name)
    allowed_fields = [
        "address_title", "address_line1", "address_line2", "city", "state",
        "pincode", "country", "phone", "custom_address_label",
        "custom_latitude", "custom_longitude", "custom_google_place_id",
        "custom_delivery_instructions",
    ]
    for field in allowed_fields:
        if field in kwargs:
            setattr(addr, field, kwargs[field])
    addr.save(ignore_permissions=True)
    frappe.db.commit()
    return {"success": True}


@frappe.whitelist()
def delete_address(address_name: str) -> dict:
    """Delete an address document."""
    if not frappe.db.exists("Address", address_name):
        frappe.throw(_("Address not found."), frappe.DoesNotExistError)
    frappe.delete_doc("Address", address_name, ignore_permissions=True)
    frappe.db.commit()
    return {"success": True}


@frappe.whitelist()
def get_refund_status() -> dict:
    """Get all refunds for the current customer."""
    customer_name = _get_current_customer()
    refunds = frappe.get_list(
        "Refund Tracker",
        filters={"customer": customer_name},
        fields=[
            "name", "sales_order", "razorpay_refund_id", "refund_amount",
            "refund_type", "reason", "status", "initiated_at", "completed_at",
        ],
        order_by="initiated_at desc",
        ignore_permissions=True,
    )
    return {"refunds": refunds}


@frappe.whitelist()
def create_support_ticket(
    subject: str,
    description: str,
    category: str,
    sales_order: str = None,
) -> dict:
    """Create a customer support ticket."""
    customer_name = _get_current_customer()
    ticket = frappe.new_doc("Support Ticket")
    ticket.customer = customer_name
    ticket.subject = subject
    ticket.description = description
    ticket.category = category
    ticket.priority = "Medium"
    ticket.status = "Open"
    if sales_order and frappe.db.exists("Sales Order", sales_order):
        ticket.sales_order = sales_order
    ticket.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"name": ticket.name, "success": True}


@frappe.whitelist()
def get_smart_reorder_suggestions() -> dict:
    """
    Reorder suggestions based on purchase frequency and recency.
    Returns: { "suggestions": [...] }
    """
    customer_name = _get_current_customer()

    # Aggregate items from past orders (last 90 days)
    cutoff = frappe.utils.add_days(frappe.utils.today(), -90)
    past_orders = frappe.get_list(
        "Sales Order",
        filters={
            "customer": customer_name,
            "transaction_date": [">=", cutoff],
            "docstatus": 1,
        },
        fields=["name"],
        ignore_permissions=True,
    )

    item_frequency: dict = {}
    item_last_ordered: dict = {}

    for order in past_orders:
        order_items = frappe.get_list(
            "Sales Order Item",
            filters={"parent": order["name"]},
            fields=["item_code", "item_name", "rate"],
            ignore_permissions=True,
        )
        order_date = frappe.db.get_value("Sales Order", order["name"], "transaction_date")
        for item in order_items:
            code = item["item_code"]
            item_frequency[code] = item_frequency.get(code, 0) + 1
            if code not in item_last_ordered or str(order_date) > str(item_last_ordered[code]["date"]):
                item_last_ordered[code] = {"date": order_date, "name": item["item_name"], "rate": item["rate"]}

    # Sort by frequency desc
    sorted_items = sorted(item_frequency.items(), key=lambda x: x[1], reverse=True)[:10]

    suggestions = []
    for item_code, freq in sorted_items:
        stock = get_stock_qty(item_code)
        if stock <= 0:
            continue
        item_doc = frappe.get_doc("Item", item_code)
        suggestions.append({
            "item_code": item_code,
            "item_name": item_doc.item_name,
            "image": item_doc.image or "",
            "rate": item_doc.standard_rate,
            "frequency_score": freq,
            "last_ordered": str(item_last_ordered[item_code]["date"]),
        })

    return {"suggestions": suggestions}
