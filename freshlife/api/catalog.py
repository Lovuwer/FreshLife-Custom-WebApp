"""
FreshLife Catalog API
Endpoints: get_homepage_data, get_category_items, get_product_detail, search_items
"""

import frappe
from frappe import _

from freshlife.utils.stock import get_stock_qty


@frappe.whitelist(allow_guest=True)
def get_homepage_data(warehouse: str = None) -> dict:
    """
    Aggregated homepage data in a single API call to reduce round trips.
    Returns: {
        "banners": [...],
        "categories": [...],
        "featured_items": [...],
        "trending_items": [...],
        "fresh_arrivals": [...]
    }
    """
    cache_key = f"homepage_data:{warehouse or 'all'}"
    cached = frappe.cache().get(cache_key)
    if cached:
        import json
        return json.loads(cached)

    # Banners
    banners = frappe.get_list(
        "Banner",
        filters={"is_active": 1},
        fields=["name", "title", "image", "image_mobile", "link_type", "link_value", "display_order"],
        order_by="display_order asc",
        ignore_permissions=True,
    )

    # Categories (Item Groups shown on website)
    categories = frappe.get_list(
        "Item Group",
        filters={"show_in_website": 1, "is_group": 0},
        fields=["name", "item_group_name", "image"],
        order_by="name asc",
        ignore_permissions=True,
    )

    item_fields = [
        "name", "item_code", "item_name", "item_group", "standard_rate",
        "image", "custom_brand_name", "custom_unit_label", "custom_is_featured",
    ]

    # Featured items
    featured_items = _enrich_items(
        frappe.get_list(
            "Item",
            filters={"custom_is_featured": 1, "disabled": 0},
            fields=item_fields,
            limit=20,
            ignore_permissions=True,
        ),
        warehouse,
    )

    # Fresh arrivals (last 30 days)
    fresh_arrivals = _enrich_items(
        frappe.get_list(
            "Item",
            filters={"disabled": 0, "creation": [">", frappe.utils.add_days(frappe.utils.today(), -30)]},
            fields=item_fields,
            order_by="creation desc",
            limit=20,
            ignore_permissions=True,
        ),
        warehouse,
    )

    result = {
        "banners": banners,
        "categories": categories,
        "featured_items": featured_items,
        "trending_items": featured_items[:10],  # Placeholder: same as featured
        "fresh_arrivals": fresh_arrivals,
    }

    import json
    frappe.cache().setex(cache_key, 300, json.dumps(result, default=str))
    return result


@frappe.whitelist(allow_guest=True)
def get_category_items(
    item_group: str,
    warehouse: str = None,
    page: int = 0,
    page_size: int = 20,
    sort_by: str = "custom_sort_order",
) -> dict:
    """
    Paginated items for a category with live stock info.
    Returns: {
        "items": [...],
        "total": int,
        "has_more": bool
    }
    """
    page = int(page)
    page_size = int(page_size)

    cache_key = f"category:{item_group}:{page}"
    cached = frappe.cache().get(cache_key)
    if cached:
        import json
        return json.loads(cached)

    filters = {"item_group": item_group, "disabled": 0}
    item_fields = [
        "name", "item_code", "item_name", "item_group", "standard_rate",
        "image", "custom_brand_name", "custom_unit_label", "custom_sort_order",
    ]

    total = frappe.db.count("Item", filters)
    items = frappe.get_list(
        "Item",
        filters=filters,
        fields=item_fields,
        order_by=f"{sort_by} asc",
        limit=page_size,
        limit_start=page * page_size,
        ignore_permissions=True,
    )
    enriched = _enrich_items(items, warehouse)

    result = {
        "items": enriched,
        "total": total,
        "has_more": (page + 1) * page_size < total,
    }

    import json
    frappe.cache().setex(cache_key, 120, json.dumps(result, default=str))
    return result


@frappe.whitelist(allow_guest=True)
def get_product_detail(item_code: str, warehouse: str = None) -> dict:
    """
    Full product detail for the Product Detail Page (PDP).
    Returns: {
        "item": {...},
        "images": [...],
        "variants": [...],
        "nutritional_info": {...},
        "related_items": [...],
        "stock_qty": float,
        "in_stock": bool
    }
    """
    cache_key = f"product:{item_code}"
    cached = frappe.cache().get(cache_key)
    if cached:
        import json
        return json.loads(cached)

    if not frappe.db.exists("Item", item_code):
        frappe.throw(_("Item not found."), frappe.DoesNotExistError)

    item = frappe.get_doc("Item", item_code)

    stock_qty = get_stock_qty(item_code, warehouse)

    # Variants
    variants = []
    if item.has_variants:
        variant_list = frappe.get_list(
            "Item",
            filters={"variant_of": item_code, "disabled": 0},
            fields=["item_code", "item_name", "standard_rate", "image", "custom_unit_label"],
            ignore_permissions=True,
        )
        for v in variant_list:
            v["in_stock"] = get_stock_qty(v["item_code"], warehouse) > 0
        variants = variant_list

    # Website item for badge info
    web_item = frappe.db.get_value(
        "Website Item",
        {"item_code": item_code},
        ["custom_badge_text", "custom_badge_color", "custom_is_available"],
        as_dict=True,
    ) or {}

    # Related items (same group, excluding self)
    related_items = frappe.get_list(
        "Item",
        filters={"item_group": item.item_group, "item_code": ["!=", item_code], "disabled": 0},
        fields=["item_code", "item_name", "standard_rate", "image", "custom_unit_label"],
        limit=10,
        ignore_permissions=True,
    )

    result = {
        "item": {
            "item_code": item.item_code,
            "item_name": item.item_name,
            "item_group": item.item_group,
            "description": item.description,
            "standard_rate": item.standard_rate,
            "image": item.image,
            "custom_brand_name": item.get("custom_brand_name"),
            "custom_unit_label": item.get("custom_unit_label"),
            "custom_freshness_category": item.get("custom_freshness_category"),
            "badge_text": web_item.get("custom_badge_text"),
            "badge_color": web_item.get("custom_badge_color"),
        },
        "images": [item.image] if item.image else [],
        "variants": variants,
        "nutritional_info": item.get("custom_nutritional_info") or {},
        "related_items": related_items,
        "stock_qty": stock_qty,
        "in_stock": stock_qty > 0,
    }

    import json
    frappe.cache().setex(cache_key, 60, json.dumps(result, default=str))
    return result


@frappe.whitelist(allow_guest=True)
def search_items(query: str, warehouse: str = None, limit: int = 10) -> dict:
    """
    Instant search with multi-field matching.
    Searches: item_name, custom_brand_name, custom_search_keywords
    Returns: { "results": [...] }
    """
    if not query or len(query.strip()) < 2:
        return {"results": []}

    limit = min(int(limit), 50)
    q = f"%{query.strip()}%"

    items = frappe.get_list(
        "Item",
        or_filters={
            "item_name": ["like", q],
            "custom_brand_name": ["like", q],
            "custom_search_keywords": ["like", q],
        },
        filters={"disabled": 0},
        fields=["item_code", "item_name", "standard_rate", "image", "custom_unit_label"],
        limit=limit,
        ignore_permissions=True,
    )

    for item in items:
        item["in_stock"] = get_stock_qty(item["item_code"], warehouse) > 0

    return {"results": items}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _enrich_items(items: list, warehouse: str = None) -> list:
    """Add in_stock and stock_qty fields to each item in the list."""
    for item in items:
        qty = get_stock_qty(item.get("item_code") or item.get("name"), warehouse)
        item["stock_qty"] = qty
        item["in_stock"] = qty > 0
    return items
