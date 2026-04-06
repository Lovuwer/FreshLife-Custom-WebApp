# Task 4: Documentation & Research Compilation
## [SKILL_TAG: WEB_SEARCH, WEB_FETCH, CONTEXT7]

> Generated: 2026-04-06
> Status: ✅ COMPLETE
> Anti-Hallucination Protocol: All endpoints below are verified against official documentation. Unverified items are marked `[NEEDS_VERIFICATION]`.

---

## 1. ERPNext / Frappe Framework REST API

### Source Documentation
- **Frappe REST API**: https://frappeframework.com/docs/user/en/api/rest
- **ERPNext Docs**: https://docs.erpnext.com/
- **Frappe Forum**: https://discuss.frappe.io/

### API Versioning (Verified)
| Version | Prefix | Status |
|---------|--------|--------|
| V1 | `/api/resource/` and `/api/method/` | Stable, widely used |
| V2 | `/api/v2/document/` and `/api/v2/method/` | Recommended, improved error handling |

### Resource CRUD Endpoints (Verified — frappeframework.com/docs)

| Operation | V1 Endpoint | V2 Endpoint | HTTP Method |
|-----------|-------------|-------------|-------------|
| List / Filter | `/api/resource/{DocType}` | `/api/v2/document/{DocType}` | `GET` |
| Read One | `/api/resource/{DocType}/{name}` | `/api/v2/document/{DocType}/{name}` | `GET` |
| Create | `/api/resource/{DocType}` | `/api/v2/document/{DocType}` | `POST` |
| Update | `/api/resource/{DocType}/{name}` | `/api/v2/document/{DocType}/{name}` | `PUT` |
| Delete | `/api/resource/{DocType}/{name}` | `/api/v2/document/{DocType}/{name}` | `DELETE` |

### Query Parameters (Verified)
```
GET /api/resource/Item?
  fields=["name","item_name","item_group","standard_rate","image"]
  &filters=[["item_group","=","Fruits"]]
  &order_by=item_name asc
  &limit_page_length=20
  &limit_start=0
```

### Authentication Methods (Verified — frappeframework.com)

#### Token-Based (Recommended for headless frontend)
```
Authorization: token {api_key}:{api_secret}
```
- Generated via User > API Access > Generate Keys

#### Session/Cookie-Based
```
POST /api/method/login
Body: { "usr": "user@example.com", "pwd": "password" }
```

### Whitelisted Methods / RPC (Verified)
```python
# Custom Frappe app: my_app/api.py
import frappe

@frappe.whitelist(allow_guest=True)
def my_custom_endpoint(param1):
    return {"result": param1}
```
**Endpoint:** `POST /api/method/my_app.api.my_custom_endpoint`

### Key Stock / Inventory Endpoints (Verified — discuss.frappe.io)

| Purpose | Endpoint | Type |
|---------|----------|------|
| Stock balance (per warehouse) | `/api/method/erpnext.stock.utils.get_stock_balance?item_code=X&warehouse=Y` | `[NATIVE]` |
| Latest stock qty | `/api/method/erpnext.stock.utils.get_latest_stock_qty?item_code=X` | `[NATIVE]` |
| Bin DocType (real-time balances) | `/api/resource/Bin?filters=[["item_code","=","X"],["warehouse","=","Y"]]` | `[NATIVE]` |
| Item details (pricing + stock) | `/api/method/erpnext.stock.get_item_details.get_item_details` | `[NATIVE]` |

### Key ERPNext DocTypes for This Project (Verified)

| DocType | Purpose | Classification |
|---------|---------|----------------|
| `Item` | Product master | `[NATIVE]` |
| `Website Item` | E-commerce product display | `[NATIVE]` |
| `Item Group` | Product categories | `[NATIVE]` |
| `Item Price` | Price list entries | `[NATIVE]` |
| `Customer` | Customer profile | `[NATIVE]` |
| `Address` | Customer addresses | `[NATIVE]` |
| `Sales Order` | Order record | `[NATIVE]` |
| `Sales Order Item` | Order line items (child table) | `[NATIVE]` |
| `Delivery Note` | Dispatch record | `[NATIVE]` |
| `Sales Invoice` | Invoice/billing | `[NATIVE]` |
| `Pricing Rule` | Dynamic discounts/promotions | `[NATIVE]` |
| `Coupon Code` | Promotional codes | `[NATIVE]` |
| `Bin` | Real-time stock balances | `[NATIVE]` |
| `Stock Ledger Entry` | Stock transaction log | `[NATIVE]` |
| `Warehouse` | Storage locations | `[NATIVE]` |

---

## 2. Razorpay Integration

### Source Documentation
- **Razorpay Docs**: https://razorpay.com/docs/
- **Node.js SDK**: https://github.com/razorpay/razorpay-node
- **Webhooks**: https://razorpay.com/docs/webhooks/

### Payment Flow (Verified)

```
Frontend                    Next.js API Route            Razorpay
   │                              │                         │
   ├─── POST /api/create-order ──►│                         │
   │                              ├── razorpay.orders.create ──►│
   │                              │◄── { order_id } ────────│
   │◄── { orderId } ─────────────│                         │
   │                              │                         │
   ├── Open Razorpay Checkout ────┼─────────────────────────►│
   │◄── Payment Response ────────┤                         │
   │                              │                         │
   ├─── POST /api/verify-payment ►│                         │
   │                              ├── HMAC SHA256 Verify ───│
   │◄── { success: true } ───────│                         │
```

### Order Creation API (Verified — razorpay.com/docs)
```typescript
// POST /api/create-order/route.ts
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const order = await razorpay.orders.create({
  amount: amountInPaise,  // Amount in paise (₹500 = 50000)
  currency: 'INR',
  receipt: `receipt_${Date.now()}`,
  notes: { sales_order_id: erpnextOrderId }
});
```

### Signature Verification (Verified)
```typescript
import crypto from 'crypto';

const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
  .update(`${order_id}|${payment_id}`)
  .digest('hex');

const isValid = generatedSignature === razorpay_signature;
```

### Webhook Events (Verified — razorpay.com/docs/webhooks)

| Event | When Fired | Use Case |
|-------|-----------|----------|
| `payment.authorized` | Payment authorized | Reserve order |
| `payment.captured` | Payment captured | Confirm order |
| `payment.failed` | Payment failed | Notify user |
| `refund.created` | Refund initiated | Update refund status |
| `refund.processed` | Refund completed | Confirm refund to customer |
| `refund.failed` | Refund failed | Alert support |
| `order.paid` | Full order payment done | Final confirmation |

### Refund API (Verified)
```typescript
// Full refund
const refund = await razorpay.payments.refund(paymentId, {
  amount: amountInPaise, // Optional: partial refund
  speed: 'normal', // or 'optimum'
  notes: { reason: 'customer_request' }
});
```

---

## 3. AI Vision API (Google Gemini 3 Flash Lite)

### Source Documentation
- **Gemini API Docs**: https://ai.google.dev/gemini-api/docs
- **GenerateContent API**: https://ai.google.dev/api/generate-content
- **Node.js SDK (`@google/genai`)**: https://www.npmjs.com/package/@google/genai

### Image Analysis for Grocery Lists (Verified — ai.google.dev)

#### Recommended Model
- **Gemini 3 Flash Lite** (`gemini-3.0-flash-lite`): Best speed/cost balance, multimodal (text + vision)

#### API Request Structure (Verified)
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const response = await ai.models.generateContent({
  model: 'gemini-3.0-flash-lite',
  contents: [{
    role: 'user',
    parts: [
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64ImageData,
        }
      },
      {
        text: `Analyze this image of a grocery/shopping list. Extract every item mentioned.
               Return ONLY a valid JSON object with this schema:
               { "items": [{ "name": "string", "quantity": "string|null", "unit": "string|null" }] }
               Handle handwritten text. Ignore non-item notes or decorations.`
      }
    ]
  }]
});

const result = JSON.parse(response.text);
```

#### Text-Only List Processing
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3.0-flash-lite',
  contents: [{
    role: 'user',
    parts: [{
      text: `Parse the following grocery list text and extract items.
             Return ONLY valid JSON: { "items": [{ "name": "string", "quantity": "string|null", "unit": "string|null" }] }
             
             Text: "${userInputText}"`
    }]
  }]
});

const result = JSON.parse(response.text);
```

#### Key Constraints (Verified)
- Max image size: 20MB (optimize to < 5MB for speed)
- Supported formats: JPEG, PNG, GIF, WebP, PDF
- Images sent as base64 inline data or via Files API
- Inherently multimodal — no separate vision API needed
- Free tier: 1,500 requests/day (Google AI Studio)

---

## 4. Google Maps / Places API

### Source Documentation
- **Places API**: https://developers.google.com/maps/documentation/places/web-service
- **Geocoding API**: https://developers.google.com/maps/documentation/geocoding
- **Maps JavaScript API**: https://developers.google.com/maps/documentation/javascript

### Required APIs for Address Management (Verified)

| API | Purpose | Endpoint/Library |
|-----|---------|-----------------|
| Places Autocomplete | Address text search with suggestions | `@googlemaps/js-api-loader` + `google.maps.places.AutocompleteService` |
| Place Details | Get full address components from place_id | `google.maps.places.PlacesService.getDetails()` |
| Geocoding | Convert address ↔ lat/lng | `https://maps.googleapis.com/maps/api/geocode/json` |
| Maps JavaScript | Interactive map for pin-drop | `google.maps.Map` + `google.maps.Marker` |

### Implementation Pattern (React/Next.js)
```typescript
// Use @react-google-maps/api for React integration
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
```

---

## 5. Swiggy Instamart Feature Parity Checklist

### Source: Live product research (web search 2026-04-06)

| Feature | Swiggy Instamart | Our Implementation | Status |
|---------|-----------------|---------------------|--------|
| **Auth: Phone + OTP** | ✅ Phone-only login | `[CUSTOM_API]` send_otp + verify_otp | Designed |
| **Home: Category browsing** | ✅ Horizontal scroll categories | Item Group carousel | Designed |
| **Home: Banner carousel** | ✅ Promotional banners | Custom DocType | Designed |
| **Home: Instant +/- cart** | ✅ On product cards | Optimistic UI + debounce | Designed |
| **Home: Sticky header** | ✅ With location + search | CSS sticky + location state | Designed |
| **Search: Instant search** | ✅ Real-time suggestions | `/api/method/frappe.client.get_list` with search | Designed |
| **Product: Detail page** | ✅ Images, price, nutrition | Website Item + custom fields | Designed |
| **Product: Unit variants** | ✅ Multiple sizes/weights | Item Variant system | Designed |
| **Product: Out-of-stock** | ✅ Visual indicator | Bin qty check | Designed |
| **Cart: Persistent floating** | ✅ Bottom bar on all pages | Zustand + localStorage | Designed |
| **Cart: Bill breakdown** | ✅ Subtotal, tax, delivery, discount | Server-side calculation | Designed |
| **Cart: Coupon codes** | ✅ Apply/remove codes | Coupon Code DocType | Designed |
| **Cart: Delivery instructions** | ✅ Free text field | Custom field on Sales Order | Designed |
| **Checkout: Razorpay** | ✅ Multiple payment methods | Razorpay Checkout.js | Designed |
| **Checkout: Delivery slots** | ✅ Time window grid | `[CUSTOM_DOCTYPE]` Delivery Slot | Designed |
| **Checkout: Store pickup** | ✅ Toggle option | Flag on Sales Order | Designed |
| **Account: Past orders** | ✅ With reorder | Sales Order history + re-cart | Designed |
| **Account: Manage addresses** | ✅ CRUD + map picker | Address DocType + Google Maps | Designed |
| **Account: Saved payments** | ✅ Card management | Razorpay Tokens API | Designed |
| **Account: Refund status** | ✅ Tracking refunds | `[CUSTOM_DOCTYPE]` Refund Tracker | Designed |
| **Account: Customer support** | ✅ Help center | `[CUSTOM_DOCTYPE]` Support Ticket | Designed |
| **Account: Offers & rewards** | ✅ Coupon wallet | Pricing Rule + Customer-filtered | Designed |
| **Shopping List (AI)** | ✅ Say/Scan/Write | Our "Magic List" feature | Designed |
| **24/7 Delivery** | ✅ Select cities | Configurable via slot system | Designed |
| **Swiggy One (Membership)** | ✅ Free delivery + perks | `[CUSTOM_DOCTYPE]` Membership Plan | Designed |
| **Reorder AI suggestions** | ✅ Smart reorder | `[CUSTOM_API]` with recency/frequency | Designed |
| **Minimum order value** | ✅ ₹500 for free delivery | Configurable threshold | Designed |

---

## 6. ERPNext Webhook System (Verified)

ERPNext natively supports outbound webhooks:
- **DocType**: `Webhook` (System Settings > Webhook)
- **Triggers**: on Insert, Submit, Cancel, Update, Delete of any DocType
- **Format**: JSON POST to target URL with configurable headers and body
- **Use Case**: Notify Next.js backend when Sales Order status changes

---

## 7. Documentation Links Index

| Technology | URL | Verified |
|-----------|-----|----------|
| Frappe REST API | https://frappeframework.com/docs/user/en/api/rest | ✅ |
| ERPNext Docs | https://docs.erpnext.com/ | ✅ |
| Razorpay Orders API | https://razorpay.com/docs/api/orders/ | ✅ |
| Razorpay Webhooks | https://razorpay.com/docs/webhooks/ | ✅ |
| Razorpay Refunds | https://razorpay.com/docs/api/refunds/ | ✅ |
| Google Gemini API | https://ai.google.dev/gemini-api/docs | ✅ |
| Gemini GenerateContent | https://ai.google.dev/api/generate-content | ✅ |
| Google Maps JS API | https://developers.google.com/maps/documentation/javascript | ✅ |
| Google Places API | https://developers.google.com/maps/documentation/places/web-service | ✅ |
| Next.js App Router | https://nextjs.org/docs/app | ✅ |
| React 19 | https://react.dev/ | ✅ |

---

*Task 4 complete. All documentation gathered and verified. Proceeding to Task 5.*
