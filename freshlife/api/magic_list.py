"""
FreshLife Magic List API
Endpoints: analyze_text, analyze_image, add_magic_list_to_cart
"""

import json
import uuid

import frappe
from frappe import _

from freshlife.utils.stock import get_stock_qty

RATE_LIMIT_TEXT = 20   # requests per hour
RATE_LIMIT_IMAGE = 10  # requests per hour
RATE_WINDOW = 3600     # 1 hour in seconds
GEMINI_MODEL = "gemini-1.5-flash-latest"


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


def _check_rate_limit(customer_name: str, limit: int, key_prefix: str) -> None:
    key = f"{key_prefix}:{customer_name}"
    count = frappe.cache().get(key) or 0
    if int(count) >= limit:
        frappe.throw(
            _("Rate limit exceeded. Please try again later."),
            frappe.PermissionError,
        )
    pipe = frappe.cache().pipeline()
    pipe.incr(key)
    pipe.expire(key, RATE_WINDOW)
    pipe.execute()


def _call_gemini(prompt_parts: list) -> str:
    """Call Google Gemini API and return the text response."""
    api_key = frappe.conf.get("gemini_api_key", "")
    if not api_key:
        frappe.throw(_("Gemini API key not configured."), frappe.ConfigurationError)

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt_parts)
    return response.text


def _match_items(extracted_items: list, warehouse: str = None) -> list:
    """
    Three-step matching pipeline:
        1. Exact/LIKE match on item_name
        2. Keyword search via custom_search_keywords
        3. Unmatched → mark as Unmatched with alternatives
    """
    results = []
    for entry in extracted_items:
        name = entry.get("name", "")
        qty = entry.get("quantity")
        unit = entry.get("unit")

        matched_item = None
        match_status = "Unmatched"
        confidence = 0

        # Step 1: exact LIKE on item_name
        hits = frappe.get_list(
            "Item",
            filters={"item_name": ["like", f"%{name}%"], "disabled": 0},
            fields=["item_code", "item_name", "standard_rate", "image"],
            limit=1,
            ignore_permissions=True,
        )
        if hits:
            matched_item = hits[0]
            match_status = "Matched"
            confidence = 95

        # Step 2: keyword search
        if not matched_item:
            kw_hits = frappe.get_list(
                "Item",
                filters={"custom_search_keywords": ["like", f"%{name}%"], "disabled": 0},
                fields=["item_code", "item_name", "standard_rate", "image"],
                limit=1,
                ignore_permissions=True,
            )
            if kw_hits:
                matched_item = kw_hits[0]
                match_status = "Partial"
                confidence = 80

        # Enrich matched item with stock
        if matched_item:
            stock = get_stock_qty(matched_item["item_code"], warehouse)
            matched_item["in_stock"] = stock > 0

        # Alternatives for unmatched
        alternatives = []
        if not matched_item:
            alt_hits = frappe.get_list(
                "Item",
                filters={"disabled": 0},
                fields=["item_code", "item_name", "standard_rate"],
                limit=3,
                ignore_permissions=True,
            )
            alternatives = alt_hits

        results.append({
            "extracted_name": name,
            "quantity": qty,
            "unit": unit,
            "matched_item": matched_item,
            "alternatives": alternatives,
            "match_status": match_status,
            "match_confidence": confidence,
        })

    return results


@frappe.whitelist()
def analyze_text(text: str) -> dict:
    """
    Process a text grocery list through Gemini AI and match items to the catalog.
    Returns: {
        "session_id": str,
        "extracted_items": [...],
        "summary": { "total": int, "matched": int, "unmatched": int }
    }
    """
    customer_name = _get_current_customer()
    _check_rate_limit(customer_name, RATE_LIMIT_TEXT, "magic_list_text")

    import time
    start_ms = int(time.time() * 1000)

    prompt = (
        f"Parse the following grocery list text and extract items. "
        f"Return ONLY valid JSON: "
        f'{{ "items": [{{"name": "string", "quantity": "string|null", "unit": "string|null"}}] }}\n\n'
        f"Text: \"{text}\""
    )

    raw_response = _call_gemini([prompt])

    try:
        # Strip markdown code fences if present
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
        if cleaned.endswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[:-1])
        parsed = json.loads(cleaned)
        extracted = parsed.get("items", [])
    except (json.JSONDecodeError, AttributeError):
        extracted = []

    session_id = str(uuid.uuid4())
    matched_items = _match_items(extracted)
    matched_count = sum(1 for i in matched_items if i["match_status"] != "Unmatched")
    unmatched_count = len(matched_items) - matched_count

    processing_ms = int(time.time() * 1000) - start_ms

    # Audit log
    try:
        log = frappe.new_doc("Magic List Log")
        log.customer = customer_name
        log.input_type = "Text"
        log.raw_input_text = text
        log.ai_model_used = GEMINI_MODEL
        log.ai_response_raw = json.dumps({"raw": raw_response})
        log.matched_count = matched_count
        log.unmatched_count = unmatched_count
        log.total_items = len(matched_items)
        log.processing_time_ms = processing_ms
        log.session_id = session_id
        log.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception as e:
        frappe.log_error(str(e), "Magic List Log Error")

    return {
        "session_id": session_id,
        "extracted_items": matched_items,
        "summary": {
            "total": len(matched_items),
            "matched": matched_count,
            "unmatched": unmatched_count,
        },
    }


@frappe.whitelist()
def analyze_image(image_base64: str, media_type: str = "image/jpeg") -> dict:
    """
    Process an image of a grocery list through Gemini Vision and match items.
    Returns: same schema as analyze_text
    """
    customer_name = _get_current_customer()
    _check_rate_limit(customer_name, RATE_LIMIT_IMAGE, "magic_list_image")

    import time
    start_ms = int(time.time() * 1000)

    import google.generativeai as genai

    api_key = frappe.conf.get("gemini_api_key", "")
    if not api_key:
        frappe.throw(_("Gemini API key not configured."), frappe.ConfigurationError)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)

    import base64
    image_bytes = base64.b64decode(image_base64)

    prompt_text = (
        "Analyze this image of a grocery/shopping list. Extract every item mentioned. "
        'Return ONLY a valid JSON object: { "items": [{"name": "string", "quantity": "string|null", "unit": "string|null"}] }. '
        "Handle handwritten text. Ignore non-item notes or decorations."
    )

    response = model.generate_content([
        {"mime_type": media_type, "data": image_bytes},
        prompt_text,
    ])
    raw_response = response.text

    try:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[1:])
        if cleaned.endswith("```"):
            cleaned = "\n".join(cleaned.split("\n")[:-1])
        parsed = json.loads(cleaned)
        extracted = parsed.get("items", [])
    except (json.JSONDecodeError, AttributeError):
        extracted = []

    session_id = str(uuid.uuid4())
    matched_items = _match_items(extracted)
    matched_count = sum(1 for i in matched_items if i["match_status"] != "Unmatched")
    unmatched_count = len(matched_items) - matched_count
    processing_ms = int(time.time() * 1000) - start_ms

    try:
        log = frappe.new_doc("Magic List Log")
        log.customer = customer_name
        log.input_type = "Photo"
        log.ai_model_used = GEMINI_MODEL
        log.ai_response_raw = json.dumps({"raw": raw_response})
        log.matched_count = matched_count
        log.unmatched_count = unmatched_count
        log.total_items = len(matched_items)
        log.processing_time_ms = processing_ms
        log.session_id = session_id
        log.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception as e:
        frappe.log_error(str(e), "Magic List Log Error")

    return {
        "session_id": session_id,
        "extracted_items": matched_items,
        "summary": {
            "total": len(matched_items),
            "matched": matched_count,
            "unmatched": unmatched_count,
        },
    }


@frappe.whitelist()
def add_magic_list_to_cart(session_id: str, items: list) -> dict:
    """
    Add matched Magic List items to the server-side Cart.
    Parameters: items = [{ "item_code": "X", "quantity": 1 }, ...]
    Returns: { "cart_count": int, "added": int, "unavailable": [...] }
    """
    if isinstance(items, str):
        items = json.loads(items)

    customer_name = _get_current_customer()

    # Validate session
    if not frappe.db.exists("Magic List Log", {"session_id": session_id}):
        frappe.throw(_("Magic List session not found."), frappe.DoesNotExistError)

    # Import cart helper
    from freshlife.api.cart import _upsert_cart

    # Fetch existing cart items
    cart_name = frappe.db.get_value("Cart", {"customer": customer_name}, "name")
    existing_items = []
    if cart_name:
        cart_doc = frappe.get_doc("Cart", cart_name)
        for row in cart_doc.items:
            existing_items.append({
                "item_code": row.item_code,
                "item_name": row.item_name,
                "quantity": row.quantity,
                "rate": row.rate,
                "image": row.image or "",
            })

    added = 0
    unavailable = []
    for entry in items:
        item_code = entry.get("item_code")
        qty = int(entry.get("quantity", 1))
        if not item_code or not frappe.db.exists("Item", item_code):
            continue
        stock = get_stock_qty(item_code)
        if stock <= 0:
            unavailable.append({"item_code": item_code, "reason": "Out of stock"})
            continue
        item_doc = frappe.get_doc("Item", item_code)
        # Merge into existing items
        found = False
        for ei in existing_items:
            if ei["item_code"] == item_code:
                ei["quantity"] += qty
                found = True
                break
        if not found:
            existing_items.append({
                "item_code": item_code,
                "item_name": item_doc.item_name,
                "quantity": qty,
                "rate": item_doc.standard_rate,
                "image": item_doc.image or "",
            })
        added += 1

    _upsert_cart(customer_name, existing_items)

    # Mark log
    try:
        log = frappe.get_doc("Magic List Log", {"session_id": session_id})
        log.items_added_to_cart = 1
        log.save(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        pass

    cart_count = sum(i["quantity"] for i in existing_items)
    return {"cart_count": cart_count, "added": added, "unavailable": unavailable}
