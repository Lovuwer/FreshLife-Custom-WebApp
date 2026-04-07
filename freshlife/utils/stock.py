"""
FreshLife Stock Utilities
Helpers for checking real-time stock levels from ERPNext Bin.
"""

import frappe

DEFAULT_WAREHOUSE = None  # Set to your warehouse name, or None to sum all


def get_stock_qty(item_code: str, warehouse: str = None) -> float:
    """
    Return the actual stock quantity for an item.
    Uses the Bin DocType for real-time balances.
    Caches result for 30 seconds to reduce DB load.
    """
    if not item_code:
        return 0.0

    cache_key = f"stock:{item_code}:{warehouse or 'all'}"
    cached = frappe.cache().get(cache_key)
    if cached is not None:
        return float(cached)

    filters = {"item_code": item_code}
    if warehouse:
        filters["warehouse"] = warehouse
    elif DEFAULT_WAREHOUSE:
        filters["warehouse"] = DEFAULT_WAREHOUSE

    bins = frappe.get_list(
        "Bin",
        filters=filters,
        fields=["actual_qty"],
        ignore_permissions=True,
    )
    qty = sum(float(b.get("actual_qty") or 0) for b in bins)

    frappe.cache().setex(cache_key, 30, qty)
    return qty
