# Task 5: Backend & Database Architecture (ERPNext)
## [SKILL_TAG: SYSTEM_DESIGN, ARCHITECTURE_ADR, WEB_SEARCH]

> Generated: 2026-04-06
> Status: ✅ COMPLETE
> Backend: ERPNext v15/v16 (Headless) on Frappe Framework
> Custom App Name: `freshlife` (Frappe app)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 15)                         │
│              Custom React Storefront (App Router)                    │
└──────────────┬───────────────────────────────────┬───────────────────┘
               │ HTTPS REST API                    │ Webhooks (inbound)
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API LAYER (BFF)                           │
│  /api/auth/*  /api/cart/*  /api/orders/*  /api/payments/*            │
│  /api/magic-list/*  /api/products/*  /api/account/*                  │
└──────────────┬───────────────────────────────────┬───────────────────┘
               │ token auth                        │ webhook verify
               ▼                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     ERPNEXT v15/v16 (HEADLESS)                       │
│                                                                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  Native DocTypes │  │ Custom DocTypes   │  │ Custom APIs      │    │
│  │  Item, Customer  │  │ Delivery Slot     │  │ @frappe.whitelist│    │
│  │  Sales Order     │  │ Banner            │  │ OTP Auth         │    │
│  │  Address, Bin    │  │ Magic List Log    │  │ Cart Sync        │    │
│  │  Pricing Rule    │  │ Refund Tracker    │  │ Slot Checker     │    │
│  │  Coupon Code     │  │ Support Ticket    │  │ Magic List Match │    │
│  └─────────────────┘  │ Membership Plan   │  └──────────────────┘    │
│                        │ OTP Session       │                          │
│                        └──────────────────┘                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  ERPNext Webhooks (Outbound) → Next.js /api/webhook/erpnext │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
│                                                                      │
│  ┌─────────────┐  ┌─────────────────┐  ┌──────────────────────┐     │
│  │  Razorpay    │  │ Google Gemini    │  │ Google Maps/Places   │     │
│  │  Payments    │  │ 3 Flash Lite     │  │ Geocoding            │     │
│  │  Refunds     │  │ Vision + Text    │  │ Autocomplete         │     │
│  │  Webhooks    │  │ Magic List AI    │  │                      │     │
│  └─────────────┘  └─────────────────┘  └──────────────────────┘     │
│                                                                      │
│  ┌─────────────┐  ┌─────────────────┐                               │
│  │ SMS Gateway  │  │ Redis Cache     │                               │
│  │ (MSG91/2FA) │  │ (OTP + Sessions)│                               │
│  └─────────────┘  └─────────────────┘                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Native ERPNext DocTypes Used (No Modification)

These DocTypes are used as-is from stock ERPNext. No custom fields required on these.

| DocType | Classification | Purpose in Our App |
|---------|---------------|--------------------|
| `Item Group` | `[NATIVE]` | Product categories (Fruits, Dairy, Beverages, etc.) |
| `Item Price` | `[NATIVE]` | Price list entries per item |
| `Pricing Rule` | `[NATIVE]` | Dynamic discounts, buy-X-get-Y |
| `Coupon Code` | `[NATIVE]` | Coupon-code-based pricing rules |
| `Bin` | `[NATIVE]` | Real-time stock per item per warehouse |
| `Stock Ledger Entry` | `[NATIVE]` | Stock transaction history |
| `Warehouse` | `[NATIVE]` | Storage/dark store locations |
| `Sales Invoice` | `[NATIVE]` | Auto-generated invoices |
| `Delivery Note` | `[NATIVE]` | Dispatch/shipment tracking |
| `User` | `[NATIVE]` | System user for auth |
| `File` | `[NATIVE]` | Image/file storage |

---

## 3. Native DocTypes with Custom Fields

### 3.1 `Item` — Product Master `[CUSTOM_FIELD]`

Stock fields used: `item_code`, `item_name`, `item_group`, `description`, `standard_rate`, `image`, `has_variants`, `variant_of`

| Custom Field | Fieldtype | Description |
|-------------|-----------|-------------|
| `custom_brand_name` | Data | Brand display name |
| `custom_nutritional_info` | JSON | `{ calories, protein, fat, carbs, fiber }` |
| `custom_unit_label` | Data | Display unit (e.g., "500g", "1L", "6 pack") |
| `custom_is_featured` | Check | Show on homepage featured section |
| `custom_freshness_category` | Select | Options: `Produce`, `Dairy`, `Bakery`, `Frozen`, `Packaged`, `None` |
| `custom_search_keywords` | Small Text | Comma-separated synonyms for search (e.g., "tomato, tamatar") |
| `custom_website_images` | Table | Child table: `Item Website Image` (multiple high-res images) |
| `custom_sort_order` | Int | Display order within category |

### 3.2 `Website Item` — E-Commerce Product Display `[CUSTOM_FIELD]`

Stock fields used: `item_code`, `item_name`, `website_image`, `web_item_name`, `published`, `route`, `short_description`, `web_long_description`, `website_specifications`

| Custom Field | Fieldtype | Description |
|-------------|-----------|-------------|
| `custom_badge_text` | Data | Badge text (e.g., "Bestseller", "New") |
| `custom_badge_color` | Color | Badge color hex |
| `custom_is_available` | Check | Manual override for availability |

### 3.3 `Customer` — Customer Profile `[CUSTOM_FIELD]`

Stock fields used: `name`, `customer_name`, `customer_group`, `territory`, `mobile_no`, `email_id`

| Custom Field | Fieldtype | Description |
|-------------|-----------|-------------|
| `custom_phone_number` | Data | Primary phone (used for OTP login) |
| `custom_referral_code` | Data | Unique referral code |
| `custom_membership_plan` | Link | Link to `Membership Plan` DocType |
| `custom_membership_expiry` | Date | Membership expiration date |
| `custom_default_address` | Link | Link to `Address` default delivery address |
| `custom_razorpay_customer_id` | Data | Razorpay customer ID for tokenization |

### 3.4 `Address` — Customer Address `[CUSTOM_FIELD]`

Stock fields used: `address_title`, `address_line1`, `address_line2`, `city`, `state`, `pincode`, `country`, `phone`, `is_primary_address`

| Custom Field | Fieldtype | Description |
|-------------|-----------|-------------|
| `custom_latitude` | Float | GPS latitude from Google Maps |
| `custom_longitude` | Float | GPS longitude from Google Maps |
| `custom_google_place_id` | Data | Google Places API place_id |
| `custom_delivery_instructions` | Small Text | "Ring doorbell twice", etc. |
| `custom_address_label` | Select | Options: `Home`, `Work`, `Other` |

### 3.5 `Sales Order` — Order Record `[CUSTOM_FIELD]`

Stock fields used: `name`, `customer`, `transaction_date`, `items`, `grand_total`, `taxes`, `status`, `delivery_date`

| Custom Field | Fieldtype | Description |
|-------------|-----------|-------------|
| `custom_delivery_slot` | Link | Link to `Delivery Slot` |
| `custom_is_store_pickup` | Check | Store pickup vs. delivery |
| `custom_delivery_instructions` | Small Text | Per-order delivery notes |
| `custom_razorpay_order_id` | Data | Razorpay order reference |
| `custom_razorpay_payment_id` | Data | Razorpay payment reference |
| `custom_payment_status` | Select | `Pending`, `Authorized`, `Captured`, `Failed`, `Refunded` |
| `custom_coupon_code` | Link | Link to `Coupon Code` applied |
| `custom_delivery_fee` | Currency | Calculated delivery charge |
| `custom_source_channel` | Select | `Web`, `Android`, `iOS`, `POS` |
| `custom_magic_list_session_id` | Data | If order originated from Magic List |
| `custom_pickup_warehouse` | Link | Warehouse for store pickup |

---

## 4. Custom DocTypes (freshlife Frappe App)

### 4.1 `Delivery Slot` `[CUSTOM_DOCTYPE]`

> Purpose: Time windows for scheduled delivery

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `name` | (auto) | Auto-generated |
| `slot_date` | Date | Required |
| `start_time` | Time | e.g., `09:00` |
| `end_time` | Time | e.g., `11:00` |
| `warehouse` | Link | Warehouse |
| `max_orders` | Int | Capacity per slot |
| `current_orders` | Int | Default: 0 |
| `is_active` | Check | Default: 1 |
| `slot_type` | Select | `Express (10-15 min)`, `Scheduled`, `Same Day` |
| `delivery_fee` | Currency | Fee for this slot type |

**Business Logic:**
- `is_available` = computed: `current_orders < max_orders AND is_active`
- When Sales Order submitted with this slot → `current_orders += 1`
- When Sales Order cancelled → `current_orders -= 1`

---

### 4.2 `Banner` `[CUSTOM_DOCTYPE]`

> Purpose: Promotional banners for homepage carousel

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `title` | Data | Display title |
| `image` | Attach Image | Banner image |
| `image_mobile` | Attach Image | Mobile-specific image |
| `link_type` | Select | `Category`, `Product`, `URL`, `Offer` |
| `link_value` | Data | Target (Item Group name, Item code, URL) |
| `display_order` | Int | Sort priority |
| `is_active` | Check | Default: 1 |
| `valid_from` | Date | Start date |
| `valid_to` | Date | End date |
| `target_audience` | Select | `All`, `Members`, `New Users` |

---

### 4.3 `OTP Session` `[CUSTOM_DOCTYPE]`

> Purpose: Temporary storage for OTP verification (supplement to Redis cache)

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `phone_number` | Data | Required |
| `otp_hash` | Data | SHA256 hash of OTP (never store plaintext) |
| `expires_at` | Datetime | Expiry timestamp |
| `is_verified` | Check | Default: 0 |
| `attempt_count` | Int | Default: 0, max: 5 |
| `ip_address` | Data | Request IP for rate limiting |

**Note:** Primary OTP storage uses `frappe.cache()` (Redis) for speed. This DocType is the audit log.

---

### 4.4 `Magic List Log` `[CUSTOM_DOCTYPE]`

> Purpose: Track AI grocery list analysis sessions

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `customer` | Link | Customer |
| `input_type` | Select | `Text`, `Photo`, `Upload` |
| `raw_input_text` | Long Text | User's text input or AI-extracted text |
| `input_image` | Attach Image | Uploaded/captured image |
| `ai_model_used` | Data | e.g., `gemini-3.0-flash-lite` |
| `ai_response_raw` | JSON | Full AI response for debugging |
| `extracted_items` | Table | Child: `Magic List Item` |
| `matched_count` | Int | Items matched in inventory |
| `unmatched_count` | Int | Items NOT found |
| `total_items` | Int | Total extracted items |
| `processing_time_ms` | Int | AI processing duration |
| `items_added_to_cart` | Check | Did user add to cart? |
| `session_id` | Data | Unique session identifier |

#### Child Table: `Magic List Item` `[CUSTOM_DOCTYPE]`

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `extracted_name` | Data | Raw item name from AI |
| `extracted_quantity` | Data | Raw quantity from AI |
| `extracted_unit` | Data | Raw unit from AI |
| `matched_item` | Link | Item (if matched) |
| `match_confidence` | Percent | Match confidence score |
| `match_status` | Select | `Matched`, `Partial`, `Unmatched`, `Alternative` |
| `alternative_items` | JSON | Array of alternative Item codes if unmatched |

---

### 4.5 `Refund Tracker` `[CUSTOM_DOCTYPE]`

> Purpose: Track refund lifecycle independent of Razorpay

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `sales_order` | Link | Sales Order |
| `customer` | Link | Customer |
| `razorpay_payment_id` | Data | Original payment ID |
| `razorpay_refund_id` | Data | Razorpay refund ID |
| `refund_amount` | Currency | Amount refunded |
| `refund_type` | Select | `Full`, `Partial` |
| `reason` | Select | `Item Damaged`, `Item Missing`, `Wrong Item`, `Customer Request`, `Other` |
| `reason_detail` | Small Text | Additional details |
| `status` | Select | `Initiated`, `Processing`, `Completed`, `Failed` |
| `initiated_at` | Datetime | When refund was initiated |
| `completed_at` | Datetime | When refund completed |

---

### 4.6 `Support Ticket` `[CUSTOM_DOCTYPE]`

> Purpose: Customer support tracking

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `customer` | Link | Customer |
| `sales_order` | Link | Sales Order (optional) |
| `subject` | Data | Ticket subject |
| `description` | Text Editor | Detailed description |
| `category` | Select | `Order Issue`, `Refund`, `Delivery`, `Product Quality`, `App Issue`, `Other` |
| `priority` | Select | `Low`, `Medium`, `High`, `Urgent` |
| `status` | Select | `Open`, `In Progress`, `Resolved`, `Closed` |
| `assigned_to` | Link | User |
| `resolution_notes` | Text Editor | Resolution details |

---

### 4.7 `Membership Plan` `[CUSTOM_DOCTYPE]`

> Purpose: Swiggy One-style membership tiers

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `plan_name` | Data | e.g., "FreshLife Plus" |
| `duration_months` | Int | Subscription period |
| `price` | Currency | Membership price |
| `free_delivery_threshold` | Currency | Min order for free delivery (₹0 = always free) |
| `discount_percent` | Percent | Extra discount on all items |
| `is_active` | Check | Default: 1 |
| `max_free_deliveries` | Int | 0 = unlimited |
| `benefits_description` | Text Editor | Marketing description |

---

### 4.8 `Cart` `[CUSTOM_DOCTYPE]`

> Purpose: Server-side persistent cart (supplements client-side Zustand)

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `customer` | Link | Customer (unique) |
| `items` | Table | Child: `Cart Item` |
| `coupon_code` | Link | Coupon Code (if applied) |
| `last_synced` | Datetime | Last client sync timestamp |

#### Child Table: `Cart Item` `[CUSTOM_DOCTYPE]`

| Field | Fieldtype | Options/Default |
|-------|-----------|----------------|
| `item_code` | Link | Item |
| `item_name` | Data | Cached item name |
| `quantity` | Int | Min: 1 |
| `rate` | Currency | Unit price at time of add |
| `image` | Data | Item image URL |

---

## 5. Custom API Endpoints (freshlife Frappe App)

### Custom App Structure
```
freshlife/
├── freshlife/
│   ├── __init__.py
│   ├── hooks.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # OTP auth endpoints
│   │   ├── cart.py           # Cart management
│   │   ├── catalog.py        # Product browsing
│   │   ├── checkout.py       # Order creation & payment
│   │   ├── magic_list.py     # AI grocery list
│   │   ├── account.py        # Account management
│   │   ├── delivery.py       # Delivery slot management
│   │   └── webhooks.py       # Inbound webhooks handler
│   ├── custom_doctype/
│   │   ├── delivery_slot/
│   │   ├── banner/
│   │   ├── otp_session/
│   │   ├── magic_list_log/
│   │   ├── refund_tracker/
│   │   ├── support_ticket/
│   │   ├── membership_plan/
│   │   ├── cart/
│   │   └── cart_item/
│   └── utils/
│       ├── __init__.py
│       ├── stock.py          # Stock checking utilities
│       ├── pricing.py        # Price calculation
│       └── sms.py            # SMS gateway integration
```

### 5.1 Authentication APIs `[CUSTOM_API]`

```python
# freshlife/api/auth.py

@frappe.whitelist(allow_guest=True)
def send_otp(phone_number: str) -> dict:
    """
    Send OTP to phone number.
    - Rate limit: 3 requests per phone per 10 minutes
    - Generates 6-digit OTP
    - Stores hash in Redis cache with 5-min TTL
    - Sends SMS via configured gateway (MSG91/Twilio)
    - Creates OTP Session audit log
    Returns: { "message": "OTP sent", "expires_in": 300 }
    """

@frappe.whitelist(allow_guest=True)
def verify_otp(phone_number: str, otp: str) -> dict:
    """
    Verify OTP and create/return user session.
    - Validates OTP against Redis cache
    - If Customer exists with phone → login
    - If no Customer → create Customer + User, then login
    - Returns JWT-like session with customer details
    Returns: {
        "token": "api_key:api_secret",
        "customer": { "name", "customer_name", "phone", "email" },
        "is_new_user": bool
    }
    """

@frappe.whitelist()
def refresh_session() -> dict:
    """
    Validate current session and return fresh user data.
    Returns: { "customer": {...}, "cart_count": int }
    """
```

### 5.2 Catalog / Product APIs `[CUSTOM_API]`

```python
# freshlife/api/catalog.py

@frappe.whitelist(allow_guest=True)
def get_homepage_data(warehouse: str = None) -> dict:
    """
    Aggregated homepage data in single API call (reduces round trips).
    Returns: {
        "banners": [...],
        "categories": [...],   # Item Groups with images
        "featured_items": [...],
        "trending_items": [...],
        "fresh_arrivals": [...]
    }
    Internally calls:
        - GET /api/resource/Banner?filters=[["is_active","=",1]]
        - GET /api/resource/Item Group?filters=[["show_in_website","=",1]]
        - GET /api/resource/Website Item?filters=[["custom_is_featured","=",1]]
        - Bin stock checks for each item
    """

@frappe.whitelist(allow_guest=True)
def get_category_items(
    item_group: str,
    warehouse: str = None,
    page: int = 0,
    page_size: int = 20,
    sort_by: str = "custom_sort_order"
) -> dict:
    """
    Paginated items for a category with stock info.
    Returns: {
        "items": [{ item_code, item_name, rate, image, in_stock, stock_qty, unit_label, ... }],
        "total": int,
        "has_more": bool
    }
    """

@frappe.whitelist(allow_guest=True)
def get_product_detail(item_code: str, warehouse: str = None) -> dict:
    """
    Full product detail for PDP.
    Returns: {
        "item": { all item fields + custom fields },
        "images": [...],
        "variants": [{ item_code, unit_label, rate, in_stock }],
        "nutritional_info": {...},
        "related_items": [...],
        "stock_qty": float,
        "in_stock": bool
    }
    Internally: 
        - GET /api/resource/Item/{item_code}
        - GET /api/resource/Bin?filters=[["item_code","=",X]]
        - GET /api/resource/Website Item?filters=[["item_code","=",X]]
    """

@frappe.whitelist(allow_guest=True)
def search_items(query: str, warehouse: str = None, limit: int = 10) -> dict:
    """
    Instant search with fuzzy matching.
    Searches: item_name, custom_brand_name, custom_search_keywords
    Returns: { "results": [{ item_code, item_name, image, rate, in_stock }] }
    Internally: frappe.get_list("Item", or_filters=[...], fields=[...])
    """
```

### 5.3 Cart APIs `[CUSTOM_API]`

```python
# freshlife/api/cart.py

@frappe.whitelist()
def sync_cart(items: list) -> dict:
    """
    Full cart sync from client.
    - Validates all items exist and are in stock
    - Updates server-side Cart DocType
    - Returns validated cart with current prices/stock
    Parameters: items = [{ "item_code": "X", "quantity": 2 }, ...]
    Returns: {
        "items": [{ item_code, item_name, quantity, rate, image, in_stock, max_qty }],
        "subtotal": float,
        "item_count": int
    }
    """

@frappe.whitelist()
def apply_coupon(coupon_code: str, cart_items: list) -> dict:
    """
    Validate and apply coupon code.
    Internally: 
        - GET /api/resource/Coupon Code/{code}
        - Validate: is active, not expired, usage < max_use
        - Calculate discount via linked Pricing Rule
    Returns: {
        "valid": bool,
        "discount_amount": float,
        "message": "string",
        "pricing_rule": "string"
    }
    """

@frappe.whitelist()
def get_bill_summary(
    cart_items: list,
    coupon_code: str = None,
    delivery_slot: str = None,
    is_store_pickup: bool = False,
    address: str = None
) -> dict:
    """
    Complete bill calculation for checkout page.
    Returns: {
        "subtotal": float,
        "delivery_fee": float,
        "tax_amount": float,
        "discount_amount": float,
        "grand_total": float,
        "savings": float,
        "min_order_met": bool,        # ₹500 minimum check
        "min_order_value": 500.0,
        "breakdown": [{ "label": "...", "amount": float }]
    }
    """
```

### 5.4 Checkout / Order APIs `[CUSTOM_API]`

```python
# freshlife/api/checkout.py

@frappe.whitelist()
def create_order(
    cart_items: list,
    delivery_address: str,
    delivery_slot: str = None,
    is_store_pickup: bool = False,
    pickup_warehouse: str = None,
    coupon_code: str = None,
    delivery_instructions: str = None,
    razorpay_order_id: str = None
) -> dict:
    """
    Create Sales Order from validated cart.
    Flow:
        1. Validate all items in stock (atomic check)
        2. Create Sales Order (Draft)
        3. Apply coupon if provided
        4. Attach delivery slot (increment slot counter)
        5. Store Razorpay order reference
    Internally: POST /api/resource/Sales Order
    Returns: {
        "sales_order": "SO-00001",
        "grand_total": float,
        "razorpay_order_id": "order_xxx"
    }
    """

@frappe.whitelist()
def confirm_payment(
    sales_order: str,
    razorpay_payment_id: str,
    razorpay_order_id: str,
    razorpay_signature: str
) -> dict:
    """
    Verify Razorpay payment and submit Sales Order.
    Flow:
        1. Verify HMAC SHA256 signature
        2. Update Sales Order payment fields
        3. Submit Sales Order (Draft → Submitted)
        4. Create Sales Invoice (if auto-invoice enabled)
    Returns: { "status": "confirmed", "sales_order": "SO-00001" }
    """

@frappe.whitelist()
def get_order_history(page: int = 0, page_size: int = 10) -> dict:
    """
    Past orders for current customer.
    Internally: GET /api/resource/Sales Order?filters=[["customer","=",X]]&order_by=creation desc
    Returns: {
        "orders": [{
            "name", "creation", "grand_total", "status",
            "items": [{ item_name, quantity, rate, image }],
            "custom_payment_status", "custom_delivery_slot"
        }],
        "total": int,
        "has_more": bool
    }
    """

@frappe.whitelist()
def reorder(sales_order: str) -> dict:
    """
    Re-add items from a past order to cart.
    - Checks current stock for each item
    - Returns items with availability status
    Returns: {
        "cart_items": [{ item_code, item_name, quantity, rate, in_stock, image }],
        "unavailable_items": [{ item_code, item_name, reason }]
    }
    """
```

### 5.5 Magic List APIs `[CUSTOM_API]`

```python
# freshlife/api/magic_list.py

@frappe.whitelist()
def analyze_text(text: str) -> dict:
    """
    Process text grocery list through AI.
    Flow:
        1. Send text to Google Gemini 3 Flash Lite API with structured prompt
        2. Parse JSON response → extracted items list
        3. For each extracted item: fuzzy search against Item DocType
        4. Return matched + unmatched items
    Returns: {
        "session_id": "uuid",
        "extracted_items": [
            {
                "extracted_name": "Tomatoes",
                "quantity": "1",
                "unit": "kg",
                "matched_item": { item_code, item_name, rate, image, in_stock } | null,
                "alternatives": [{ item_code, item_name, rate }],
                "match_status": "Matched" | "Partial" | "Unmatched"
            }
        ],
        "summary": { "total": 10, "matched": 8, "unmatched": 2 }
    }
    """

@frappe.whitelist()
def analyze_image(image_base64: str, media_type: str = "image/jpeg") -> dict:
    """
    Process image of grocery list through AI Vision.
    Flow:
        1. Validate and resize image (max 1568px, < 5MB)
        2. Send to Google Gemini 3 Flash Lite Vision API (multimodal)
        3. Extract items from AI response
        4. Same matching logic as analyze_text
    Returns: same schema as analyze_text
    """

@frappe.whitelist()
def add_magic_list_to_cart(session_id: str, items: list) -> dict:
    """
    Add matched Magic List items to cart.
    Parameters: items = [{ "item_code": "X", "quantity": 1 }]
    Flow:
        1. Validate session_id exists
        2. Check stock for all items
        3. Add to Cart DocType
        4. Update Magic List Log → items_added_to_cart = True
    Returns: { "cart_count": int, "added": int, "unavailable": [...] }
    """
```

### 5.6 Delivery Slot APIs `[CUSTOM_API]`

```python
# freshlife/api/delivery.py

@frappe.whitelist(allow_guest=True)
def get_available_slots(
    warehouse: str,
    date: str = None,
    days_ahead: int = 3
) -> dict:
    """
    Available delivery time slots.
    Returns: {
        "slots": {
            "2026-04-06": [
                { "name": "DS-001", "start_time": "09:00", "end_time": "11:00", 
                  "slot_type": "Scheduled", "delivery_fee": 29.0, "available": true },
                ...
            ],
            "2026-04-07": [...],
        },
        "express_available": bool,
        "express_eta_minutes": 15,
        "express_fee": 49.0
    }
    """

@frappe.whitelist()
def check_store_pickup(warehouse: str) -> dict:
    """
    Store pickup availability.
    Returns: {
        "available": bool,
        "warehouse_name": "string",
        "address": "string",
        "pickup_hours": "9:00 AM - 9:00 PM",
        "estimated_ready_minutes": 30
    }
    """
```

### 5.7 Account APIs `[CUSTOM_API]`

```python
# freshlife/api/account.py

@frappe.whitelist()
def get_profile() -> dict:
    """Get customer profile data."""

@frappe.whitelist()
def update_profile(customer_name: str = None, email: str = None) -> dict:
    """Update customer profile."""

@frappe.whitelist()
def get_addresses() -> dict:
    """
    Get all saved addresses for current customer.
    Internally: GET /api/resource/Address?filters=[["link_name","=",customer_id]]
    """

@frappe.whitelist()
def add_address(
    address_title: str,
    address_line1: str,
    city: str,
    state: str,
    pincode: str,
    latitude: float = None,
    longitude: float = None,
    google_place_id: str = None,
    delivery_instructions: str = None,
    address_label: str = "Home"
) -> dict:
    """Create new address linked to customer."""

@frappe.whitelist()
def update_address(address_name: str, **kwargs) -> dict:
    """Update existing address."""

@frappe.whitelist()
def delete_address(address_name: str) -> dict:
    """Delete/unlink address."""

@frappe.whitelist()
def get_refund_status() -> dict:
    """
    Get all refunds for current customer.
    Internally: GET /api/resource/Refund Tracker?filters=[["customer","=",X]]
    """

@frappe.whitelist()
def create_support_ticket(
    subject: str,
    description: str,
    category: str,
    sales_order: str = None
) -> dict:
    """Create customer support ticket."""

@frappe.whitelist()
def get_smart_reorder_suggestions() -> dict:
    """
    AI-driven reorder suggestions based on:
    - Purchase frequency
    - Recency
    - Time-of-day patterns
    - Current item availability
    Returns: { "suggestions": [{ item_code, item_name, image, rate, 
               frequency_score, last_ordered }] }
    """
```

---

## 6. ERPNext Outbound Webhooks Configuration

### Webhook: Sales Order Status Change

| Setting | Value |
|---------|-------|
| DocType | `Sales Order` |
| Document Event | `on_update` |
| Request URL | `https://frontend.freshlife.app/api/webhook/erpnext` |
| Request Method | POST |
| Webhook Headers | `{ "X-Webhook-Secret": "..." }` |

### Webhook: Delivery Note Created

| Setting | Value |
|---------|-------|
| DocType | `Delivery Note` |
| Document Event | `after_insert` |
| Request URL | `https://frontend.freshlife.app/api/webhook/erpnext` |
| Request Method | POST |

---

## 7. Database Schema Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     Customer     │     │   Sales Order    │     │  Delivery Slot  │
│─────────────────│     │──────────────────│     │─────────────────│
│ name            │◄────│ customer         │     │ slot_date       │
│ customer_name   │     │ transaction_date │────►│ start_time      │
│ custom_phone    │     │ grand_total      │     │ end_time         │
│ custom_razorpay │     │ custom_rzp_order │     │ max_orders      │
│ custom_membersh │     │ custom_rzp_pay   │     │ current_orders  │
│ custom_default  │     │ custom_pay_status│     │ slot_type       │
│ _address        │     │ custom_coupon    │     │ delivery_fee    │
└────────┬────────┘     │ custom_del_slot  │     └─────────────────┘
         │              │ custom_is_pickup │
         │              │ custom_del_instr │
         │              │ custom_del_fee   │
         │              └────────┬─────────┘
         │                       │
         │              ┌────────┴─────────┐
┌────────┴────────┐     │ Sales Order Item  │     ┌─────────────────┐
│    Address      │     │──────────────────│     │      Item       │
│─────────────────│     │ item_code        │────►│─────────────────│
│ address_line1   │     │ item_name        │     │ item_code       │
│ city, pincode   │     │ qty              │     │ item_name       │
│ custom_lat      │     │ rate             │     │ item_group ─────┼──► Item Group
│ custom_lng      │     │ amount           │     │ standard_rate   │
│ custom_place_id │     └──────────────────┘     │ image           │
│ custom_label    │                               │ custom_brand    │
└─────────────────┘     ┌──────────────────┐     │ custom_nutrition│
                        │   Coupon Code    │     │ custom_unit     │
┌─────────────────┐     │──────────────────│     │ custom_keywords │
│  Refund Tracker │     │ coupon_name      │     └────────┬────────┘
│─────────────────│     │ pricing_rule ────┼──►           │
│ sales_order     │     │ valid_from/to    │   ┌──────────┴────────┐
│ customer        │     │ maximum_use      │   │       Bin          │
│ rzp_payment_id  │     │ used             │   │──────────────────│
│ rzp_refund_id   │     └──────────────────┘   │ item_code        │
│ refund_amount   │                             │ warehouse        │
│ status          │     ┌──────────────────┐   │ actual_qty       │
└─────────────────┘     │  Magic List Log  │   │ projected_qty    │
                        │──────────────────│   └──────────────────┘
┌─────────────────┐     │ customer         │
│ Support Ticket  │     │ input_type       │   ┌──────────────────┐
│─────────────────│     │ raw_input_text   │   │     Banner       │
│ customer        │     │ ai_model_used    │   │──────────────────│
│ sales_order     │     │ extracted_items──┼─► │ title            │
│ subject         │     │ matched_count    │   │ image            │
│ category        │     │ session_id       │   │ link_type        │
│ status          │     └──────────────────┘   │ display_order    │
└─────────────────┘                             │ is_active        │
                        ┌──────────────────┐   └──────────────────┘
                        │ Membership Plan  │
                        │──────────────────│   ┌──────────────────┐
                        │ plan_name        │   │      Cart        │
                        │ duration_months  │   │──────────────────│
                        │ price            │   │ customer         │
                        │ free_del_thresh  │   │ items ──────────┼─► Cart Item
                        │ discount_percent │   │ coupon_code      │
                        └──────────────────┘   │ last_synced      │
                                                └──────────────────┘
```

---

## 8. API Route Summary

### Native ERPNext Routes Used

| Route | Method | Purpose | Classification |
|-------|--------|---------|----------------|
| `/api/resource/Item` | GET | List/search items | `[NATIVE]` |
| `/api/resource/Item/{name}` | GET | Item detail | `[NATIVE]` |
| `/api/resource/Item Group` | GET | Categories | `[NATIVE]` |
| `/api/resource/Website Item` | GET | Published items | `[NATIVE]` |
| `/api/resource/Customer` | GET/POST/PUT | Customer CRUD | `[NATIVE]` |
| `/api/resource/Address` | GET/POST/PUT/DELETE | Address CRUD | `[NATIVE]` |
| `/api/resource/Sales Order` | GET/POST | Orders | `[NATIVE]` |
| `/api/resource/Coupon Code/{name}` | GET | Validate coupon | `[NATIVE]` |
| `/api/resource/Bin` | GET | Stock levels | `[NATIVE]` |
| `/api/method/erpnext.stock.utils.get_stock_balance` | GET | Stock balance | `[NATIVE]` |

### Custom API Routes (freshlife app)

| Route | Method | Purpose | Classification |
|-------|--------|---------|----------------|
| `/api/method/freshlife.api.auth.send_otp` | POST | Send OTP | `[CUSTOM_API]` |
| `/api/method/freshlife.api.auth.verify_otp` | POST | Verify OTP & login | `[CUSTOM_API]` |
| `/api/method/freshlife.api.auth.refresh_session` | GET | Refresh session | `[CUSTOM_API]` |
| `/api/method/freshlife.api.catalog.get_homepage_data` | GET | Homepage aggregate | `[CUSTOM_API]` |
| `/api/method/freshlife.api.catalog.get_category_items` | GET | Category products | `[CUSTOM_API]` |
| `/api/method/freshlife.api.catalog.get_product_detail` | GET | Product detail | `[CUSTOM_API]` |
| `/api/method/freshlife.api.catalog.search_items` | GET | Search | `[CUSTOM_API]` |
| `/api/method/freshlife.api.cart.sync_cart` | POST | Cart sync | `[CUSTOM_API]` |
| `/api/method/freshlife.api.cart.apply_coupon` | POST | Apply coupon | `[CUSTOM_API]` |
| `/api/method/freshlife.api.cart.get_bill_summary` | POST | Bill calculation | `[CUSTOM_API]` |
| `/api/method/freshlife.api.checkout.create_order` | POST | Create order | `[CUSTOM_API]` |
| `/api/method/freshlife.api.checkout.confirm_payment` | POST | Confirm payment | `[CUSTOM_API]` |
| `/api/method/freshlife.api.checkout.get_order_history` | GET | Order history | `[CUSTOM_API]` |
| `/api/method/freshlife.api.checkout.reorder` | POST | Reorder items | `[CUSTOM_API]` |
| `/api/method/freshlife.api.magic_list.analyze_text` | POST | Magic List (text) | `[CUSTOM_API]` |
| `/api/method/freshlife.api.magic_list.analyze_image` | POST | Magic List (image) | `[CUSTOM_API]` |
| `/api/method/freshlife.api.magic_list.add_magic_list_to_cart` | POST | Add ML to cart | `[CUSTOM_API]` |
| `/api/method/freshlife.api.delivery.get_available_slots` | GET | Delivery slots | `[CUSTOM_API]` |
| `/api/method/freshlife.api.delivery.check_store_pickup` | GET | Pickup availability | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.get_profile` | GET | Profile | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.update_profile` | POST | Update profile | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.get_addresses` | GET | Addresses | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.add_address` | POST | Add address | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.update_address` | POST | Update address | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.delete_address` | POST | Delete address | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.get_refund_status` | GET | Refund status | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.create_support_ticket` | POST | Support ticket | `[CUSTOM_API]` |
| `/api/method/freshlife.api.account.get_smart_reorder_suggestions` | GET | Smart reorder | `[CUSTOM_API]` |

---

## 9. Magic List — Inventory Matching Algorithm

```
┌──────────────────────────────────────────────────────┐
│              MAGIC LIST MATCHING PIPELINE              │
├──────────────────────────────────────────────────────┤
│                                                        │
│  INPUT (Text / AI-Extracted Items)                    │
│  ┌────────────────────────────────┐                   │
│  │ { "name": "Tomatoes",          │                   │
│  │   "quantity": "2",             │                   │
│  │   "unit": "kg" }              │                   │
│  └──────────────┬─────────────────┘                   │
│                  │                                     │
│  STEP 1: EXACT MATCH                                  │
│  ┌──────────────▼─────────────────┐                   │
│  │ frappe.get_list("Item",        │                   │
│  │   filters={"item_name":        │                   │
│  │     ["like", "%tomato%"]},     │                   │
│  │   fields=["item_code",         │                   │
│  │     "item_name", "image",      │                   │
│  │     "standard_rate"])          │                   │
│  └──────────────┬─────────────────┘                   │
│                  │                                     │
│            Found? ──── YES → Match (confidence: 95%)  │
│                  │                                     │
│                  NO                                    │
│                  │                                     │
│  STEP 2: KEYWORD SEARCH                              │
│  ┌──────────────▼─────────────────┐                   │
│  │ Search custom_search_keywords  │                   │
│  │ (includes synonyms like        │                   │
│  │  "tamatar" for "tomato")       │                   │
│  └──────────────┬─────────────────┘                   │
│                  │                                     │
│            Found? ──── YES → Match (confidence: 80%)  │
│                  │                                     │
│                  NO                                    │
│                  │                                     │
│  STEP 3: FUZZY / AI RE-MATCH                         │
│  ┌──────────────▼─────────────────┐                   │
│  │ Use Gemini 3 Flash Lite to map │                   │
│  │ unmatched item to closest      │                   │
│  │ items in our catalog           │                   │
│  │ (send top 50 item names +      │                   │
│  │  the unmatched term)           │                   │
│  └──────────────┬─────────────────┘                   │
│                  │                                     │
│            Found? ──── YES → Partial (confidence: 60%)│
│                  │                                     │
│                  NO → Unmatched (show alternatives)    │
│                                                        │
│  STEP 4: STOCK CHECK                                  │
│  For each matched item:                               │
│  GET Bin.actual_qty WHERE item_code=X AND warehouse=Y │
│  Mark as in_stock if qty > 0                          │
│                                                        │
└──────────────────────────────────────────────────────┘
```

---

## 10. Security & Performance Considerations

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `send_otp` | 3 requests | 10 minutes per phone |
| `verify_otp` | 5 attempts | per OTP session |
| `search_items` | 30 requests | per minute per user |
| `analyze_image` | 10 requests | per hour per user |
| `analyze_text` | 20 requests | per hour per user |

### Caching Strategy (Redis via frappe.cache)

| Key Pattern | TTL | Data |
|-------------|-----|------|
| `otp:{phone}` | 5 min | OTP hash |
| `homepage_data:{warehouse}` | 5 min | Aggregated homepage |
| `category:{group}:{page}` | 2 min | Category products |
| `product:{item_code}` | 1 min | Product detail |
| `stock:{item_code}:{warehouse}` | 30 sec | Stock level |
| `delivery_slots:{warehouse}:{date}` | 1 min | Available slots |

### Minimum Order Enforcement

```python
MIN_ORDER_VALUE = 500.0  # ₹500 minimum for delivery

def validate_minimum_order(cart_items, is_store_pickup):
    if is_store_pickup:
        return True  # No minimum for pickup
    subtotal = sum(item.rate * item.quantity for item in cart_items)
    return subtotal >= MIN_ORDER_VALUE
```

---

*Task 5 complete. Backend architecture fully documented with all DocTypes, APIs, and matching algorithms specified. Proceeding to Task 6.*
