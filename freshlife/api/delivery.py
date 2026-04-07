"""
FreshLife Delivery Slot API
Endpoints: get_available_slots, check_store_pickup
"""

import frappe
from frappe import _


@frappe.whitelist(allow_guest=True)
def get_available_slots(
    warehouse: str,
    date: str = None,
    days_ahead: int = 3,
) -> dict:
    """
    Available delivery time slots for the given warehouse.
    Returns: {
        "slots": { "YYYY-MM-DD": [...] },
        "express_available": bool,
        "express_eta_minutes": int,
        "express_fee": float
    }
    """
    days_ahead = int(days_ahead)
    base_date = frappe.utils.getdate(date) if date else frappe.utils.today()

    cache_key = f"delivery_slots:{warehouse}:{base_date}"
    cached = frappe.cache().get(cache_key)
    if cached:
        import json
        return json.loads(cached)

    slot_map = {}
    express_available = False
    express_fee = 49.0

    for i in range(days_ahead):
        check_date = frappe.utils.add_days(base_date, i)
        date_str = str(check_date)

        slots = frappe.get_list(
            "Delivery Slot",
            filters={
                "slot_date": check_date,
                "warehouse": warehouse,
                "is_active": 1,
            },
            fields=[
                "name", "start_time", "end_time", "slot_type",
                "delivery_fee", "max_orders", "current_orders",
            ],
            order_by="start_time asc",
            ignore_permissions=True,
        )

        day_slots = []
        for slot in slots:
            available = slot["current_orders"] < slot["max_orders"]
            is_express = slot["slot_type"] == "Express (10-15 min)"
            if is_express and available:
                express_available = True
                express_fee = slot["delivery_fee"]
            day_slots.append({
                "name": slot["name"],
                "start_time": str(slot["start_time"]),
                "end_time": str(slot["end_time"]),
                "slot_type": slot["slot_type"],
                "delivery_fee": slot["delivery_fee"],
                "available": available,
            })
        slot_map[date_str] = day_slots

    result = {
        "slots": slot_map,
        "express_available": express_available,
        "express_eta_minutes": 15,
        "express_fee": express_fee,
    }

    import json
    frappe.cache().setex(cache_key, 60, json.dumps(result, default=str))
    return result


@frappe.whitelist(allow_guest=True)
def check_store_pickup(warehouse: str) -> dict:
    """
    Store pickup availability and details.
    Returns: {
        "available": bool,
        "warehouse_name": str,
        "address": str,
        "pickup_hours": str,
        "estimated_ready_minutes": int
    }
    """
    if not frappe.db.exists("Warehouse", warehouse):
        return {"available": False, "warehouse_name": "", "address": "", "pickup_hours": "", "estimated_ready_minutes": 0}

    wh = frappe.get_doc("Warehouse", warehouse)
    return {
        "available": True,
        "warehouse_name": wh.warehouse_name,
        "address": wh.address_line_1 or "",
        "pickup_hours": "9:00 AM - 9:00 PM",
        "estimated_ready_minutes": 30,
    }
