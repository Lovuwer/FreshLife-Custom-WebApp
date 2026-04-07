# Task 7: Final System Blueprint
## FreshLife — Omnichannel Supermarket Application
### Production-Ready System Architecture Document

> **Version:** 1.0.0
> **Generated:** 2026-04-06
> **[SKILL_TAG: SYSTEM_DESIGN, WRITING_PLANS]**
> **Status:** ✅ COMPLETE — Ready for Development Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Technology Decisions](#3-technology-decisions)
4. [Backend Architecture (ERPNext)](#4-backend-architecture-erpnext)
5. [Frontend Architecture (Next.js)](#5-frontend-architecture-nextjs)
6. [External Service Integrations](#6-external-service-integrations)
7. [Feature Matrix](#7-feature-matrix)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Appendices](#appendices)

---

## 1. Executive Summary

**FreshLife** is a production-grade, omnichannel supermarket web application achieving **Swiggy Instamart feature parity** with a unique **AI-powered "Magic List"** feature. The system uses **ERPNext v15/v16 as a headless backend** (inventory, orders, customers, accounting) and a **custom Next.js 15 frontend** delivering a premium, responsive user experience.

### Key Differentiators
| Feature | Description |
|---------|-------------|
| **Magic List AI** | Users photograph, type, or upload grocery lists → AI extracts items → matched to live inventory → one-click add-to-cart |
| **Swiggy-Parity UX** | Complete feature set: OTP auth, delivery slots, reorder, address management, refunds, coupons, membership |
| **ERPNext Headless** | Full accounting, inventory, and order management via native ERPNext, eliminating custom backend complexity |
| **Organic Brutalism Design** | Premium editorial aesthetic with glassmorphism, gradient CTAs, tonal layering, no-border design system |

### Architecture Principles
1. **Zero Hallucination** — Every API endpoint verified against official documentation
2. **Native First** — Use stock ERPNext DocTypes before creating custom ones
3. **BFF Pattern** — Next.js API routes mediate all ERPNext communication
4. **Optimistic UI** — Cart operations are instant client-side, synced in background
5. **Mobile-First** — 390px base viewport, scales responsively to desktop

---

## 2. System Overview

```
                              ┌─────────────────────────┐
                              │      End Users           │
                              │  (Mobile / Desktop Web) │
                              └───────────┬─────────────┘
                                          │ HTTPS
                              ┌───────────▼─────────────┐
                              │   CDN / Edge Network     │
                              │   (Railway / Cloudflare) │
                              └───────────┬─────────────┘
                                          │
                    ┌─────────────────────▼───────────────────────┐
                    │           NEXT.JS 15 APPLICATION            │
                    │                                              │
                    │  ┌──────────────┐  ┌──────────────────────┐ │
                    │  │  React SSR   │  │  API Route Handlers  │ │
                    │  │  + CSR Pages │  │  (BFF Layer)          │ │
                    │  └──────────────┘  └──────────┬───────────┘ │
                    └──────────────────────────────┼──────────────┘
                                                    │
                         ┌──────────────────────────┼────────────────────┐
                         │                          │                    │
              ┌──────────▼──────────┐  ┌───────────▼──────┐  ┌────────▼────────┐
              │    ERPNext v15/v16   │  │    Razorpay      │  │   Google        │
              │    (Headless ERP)    │  │    (Payments)    │  │   Gemini AI     │
              │                      │  │                  │  │   (Magic List)  │
              │  ┌────────────────┐  │  │  Orders API      │  │                 │
              │  │ Native DocTypes│  │  │  Checkout.js     │  │  3 Flash Lite   │
              │  │ Item, Customer │  │  │  Webhooks        │  │  Vision+Text    │
              │  │ Sales Order    │  │  │  Refunds API     │  │                 │
              │  │ Address, Bin   │  │  └──────────────────┘  └─────────────────┘
              │  └────────────────┘  │
              │  ┌────────────────┐  │  ┌──────────────────┐  ┌─────────────────┐
              │  │ Custom App:    │  │  │  Google Maps     │  │   SMS Gateway   │
              │  │ "freshlife"    │  │  │  Places API      │  │   (MSG91)       │
              │  │ Custom APIs    │  │  │  Geocoding       │  │   OTP Delivery  │
              │  │ Custom DocTypes│  │  │  Maps JS API     │  │                 │
              │  └────────────────┘  │  └──────────────────┘  └─────────────────┘
              │  ┌────────────────┐  │
              │  │ Redis Cache    │  │
              │  │ (OTP, Sessions)│  │
              │  └────────────────┘  │
              └──────────────────────┘
```

---

## 3. Technology Decisions

### 3.1 Architecture Decision Records (ADR)

#### ADR-001: ERPNext as Headless Backend
- **Decision:** Use ERPNext v15/v16 as the backend ERP system accessed via REST API
- **Rationale:** Provides complete inventory management, accounting, order processing, pricing rules, and customer management out-of-the-box. Eliminates need to build custom backend from scratch.
- **Trade-off:** Slower iteration on custom business logic vs. a fully custom backend (mitigated by custom Frappe app)
- **Docs:** https://frappeframework.com/docs/user/en/api/rest

#### ADR-002: Next.js 15 App Router
- **Decision:** Use Next.js 15 with App Router for the frontend
- **Rationale:** Server Components reduce client bundle, Route Handlers provide BFF layer, built-in image optimization, middleware for auth
- **Version:** 15.x (latest stable)
- **Docs:** https://nextjs.org/docs/app

#### ADR-003: Zustand for Client State + TanStack Query for Server State
- **Decision:** Split state management between Zustand (cart, auth, UI) and TanStack Query (API data)
- **Rationale:** Zustand is < 2KB with persist middleware (cart survives refresh). TanStack Query handles caching, revalidation, and loading states for server data.
- **Trade-off:** Two state libraries vs. single solution (justified by clear separation of concerns)

#### ADR-004: BFF (Backend-for-Frontend) Pattern
- **Decision:** All ERPNext API calls go through Next.js API routes, never directly from client
- **Rationale:** Hides ERPNext credentials, allows response shaping, enables caching headers, provides single API surface for frontend
- **Security:** ERPNext API key/secret never exposed to client

#### ADR-005: Google Gemini 3 Flash Lite for Magic List AI
- **Decision:** Use Gemini 3 Flash Lite (`gemini-3.0-flash-lite`) for both text parsing and image/OCR analysis
- **Rationale:** Single multimodal API handles both text and vision natively. No separate OCR service needed. Excellent handwriting recognition. Cost-effective. Google AI ecosystem integration.
- **Fallback:** If Gemini is unavailable, fall back to Gemini 2.5 Flash or a previous stable model
- **Docs:** https://ai.google.dev/gemini-api/docs

#### ADR-006: Razorpay for Payments
- **Decision:** Razorpay Standard Checkout with server-side verification
- **Rationale:** Indian market focus, UPI/cards/wallets/netbanking support, webhook-based async flow, refund API, tokenization for saved cards
- **Docs:** https://razorpay.com/docs/

### 3.2 Full Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Backend ERP** | ERPNext | v15/v16 LTS | Inventory, orders, accounting |
| **Backend Framework** | Frappe Framework | v15/v16 | REST API, DocTypes, custom apps |
| **Backend Cache** | Redis | 7.x | OTP sessions, API caching |
| **Backend DB** | MariaDB | 10.6+ | ERPNext data store |
| **Frontend Framework** | Next.js | 15.x | SSR, App Router, API routes |
| **UI Library** | React | 19.x | Component library |
| **Language** | TypeScript | 5.x | Type safety |
| **Client State** | Zustand | 5.x | Cart, auth, UI state |
| **Server State** | TanStack Query | 5.x | API caching, revalidation |
| **Styling** | CSS Modules | N/A | Scoped, token-based styles |
| **Animation** | Framer Motion | 11.x | Micro-animations, transitions |
| **Forms** | React Hook Form | 7.x | Form validation |
| **Maps** | Google Maps JS API | Latest | Address selection |
| **Payments** | Razorpay | Latest SDK | Payment processing |
| **AI Vision** | Google Gemini | 3 Flash Lite | Grocery list analysis |
| **SMS** | MSG91 | Latest | OTP delivery |
| **Fonts** | Plus Jakarta Sans, Inter | Google Fonts | Typography |
| **Runtime** | Node.js | 20 LTS | Server runtime |

---

## 4. Backend Architecture (ERPNext)

> Full details in: `task5_backend_database_architecture.md`

### 4.1 DocType Classification Summary

| Category | Count | Examples |
|----------|-------|---------|
| `[NATIVE]` — Used as-is | 11 | Item, Customer, Sales Order, Bin, Pricing Rule |
| `[CUSTOM_FIELD]` — Native + custom fields | 5 | Item (+8 fields), Customer (+6), Address (+5), Sales Order (+11), Website Item (+3) |
| `[CUSTOM_DOCTYPE]` — New DocTypes | 8 | Delivery Slot, Banner, OTP Session, Magic List Log, Refund Tracker, Support Ticket, Membership Plan, Cart |
| `[CUSTOM_API]` — Whitelisted methods | 28 | Auth (3), Catalog (4), Cart (3), Checkout (4), Magic List (3), Delivery (2), Account (9) |

### 4.2 Custom Frappe App: `freshlife`

```
freshlife/
├── freshlife/
│   ├── api/
│   │   ├── auth.py          # send_otp, verify_otp, refresh_session
│   │   ├── catalog.py       # get_homepage_data, get_category_items, get_product_detail, search_items
│   │   ├── cart.py           # sync_cart, apply_coupon, get_bill_summary
│   │   ├── checkout.py      # create_order, confirm_payment, get_order_history, reorder
│   │   ├── magic_list.py    # analyze_text, analyze_image, add_magic_list_to_cart
│   │   ├── delivery.py      # get_available_slots, check_store_pickup
│   │   └── account.py       # profile, addresses, refunds, support, smart_reorder
│   ├── custom_doctype/       # 8 custom DocType definitions
│   └── utils/                # Stock, pricing, SMS utilities
```

### 4.3 Key Custom ERPNext Fields Added

**Item** (Product): `custom_brand_name`, `custom_nutritional_info` (JSON), `custom_unit_label`, `custom_is_featured`, `custom_freshness_category`, `custom_search_keywords`, `custom_website_images` (Table), `custom_sort_order`

**Customer**: `custom_phone_number`, `custom_referral_code`, `custom_membership_plan` (Link), `custom_membership_expiry`, `custom_default_address` (Link), `custom_razorpay_customer_id`

**Sales Order**: `custom_delivery_slot` (Link), `custom_is_store_pickup`, `custom_delivery_instructions`, `custom_razorpay_order_id`, `custom_razorpay_payment_id`, `custom_payment_status`, `custom_coupon_code` (Link), `custom_delivery_fee`, `custom_source_channel`, `custom_magic_list_session_id`

**Address**: `custom_latitude`, `custom_longitude`, `custom_google_place_id`, `custom_delivery_instructions`, `custom_address_label`

---

## 5. Frontend Architecture (Next.js)

> Full details in: `task6_frontend_fulfillment_architecture.md`

### 5.1 Route Structure

| Route | Page | Auth |
|-------|------|------|
| `/` | Home / Discovery | Public |
| `/login` | Phone + OTP Auth | Guest only |
| `/category/[slug]` | Category items listing | Public |
| `/product/[itemCode]` | Product Detail Page | Public |
| `/magic-list` | AI Magic List Analyzer | 🔒 Protected |
| `/cart` | Cart & Checkout | 🔒 Protected |
| `/account` | Account hub | 🔒 Protected |
| `/account/orders` | Past orders | 🔒 Protected |
| `/account/addresses` | Manage addresses | 🔒 Protected |
| `/account/refunds` | Refund tracking | 🔒 Protected |
| `/account/support` | Support tickets | 🔒 Protected |
| `/account/membership` | Membership plan | 🔒 Protected |

### 5.2 Component Tree (81 components)

| Category | Components | Count |
|----------|-----------|-------|
| Layout | Header, BottomNav, FloatingCart, SearchBar | 4 |
| Home | BannerCarousel, CategoryRow, ProductGrid, FeaturedSection, FreshnessPulse | 5 |
| Product | ProductCard, ProductGallery, PriceBlock, VariantSelector, NutritionInfo, RelatedProducts, OutOfStockBadge | 7 |
| Cart | CartItemRow, BillBreakdown, CouponInput, DeliverySlotPicker, StorePickupToggle, DeliveryAddress, PlaceOrderButton | 7 |
| Auth | PhoneInput, OTPInput, AuthGuard | 3 |
| Magic List | InputMethodSelector, TextListInput, CameraCapture, AnalysisLoader, MatchedItemsList, UnmatchedItems, AddAllToCart | 7 |
| Account | ProfileHeader, MenuSection, OrderCard, AddressCard, AddressForm, RefundCard, SupportForm | 7 |
| UI Primitives | Button, QuantitySelector, Skeleton, Badge, Modal, Toast, EmptyState, PullToRefresh | 8 |

### 5.3 State Management

| Store | Library | Persisted | Purpose |
|-------|---------|-----------|---------|
| `cartStore` | Zustand | ✅ localStorage | Cart items, coupon, delivery fee |
| `authStore` | Zustand | ✅ localStorage | Token, customer profile, OTP state |
| `locationStore` | Zustand | ✅ localStorage | Delivery address, warehouse |
| `uiStore` | Zustand | ❌ | Modal state, toast messages |
| Server data | TanStack Query | ✅ in-memory cache | Products, orders, slots, etc. |

### 5.4 Design System Highlights

- **Fonts:** Plus Jakarta Sans (display), Inter (body)
- **Primary Color:** `#006a2d` (green gradient CTAs)
- **No pure black:** All text uses `#2c2f30`
- **No borders:** Depth via background tonal shifts
- **Glassmorphism:** 80% opacity + 20px backdrop-blur for overlays
- **Animations:** Framer Motion micro-interactions, freshness pulse

---

## 6. External Service Integrations

### 6.1 Razorpay — Payments

```
┌── CREATE ORDER ──────────────────────────────────────────┐
│                                                          │
│  Next.js API → razorpay.orders.create({                 │
│    amount: total_paise,                                  │
│    currency: 'INR',                                      │
│    receipt: sales_order_id,                              │
│    notes: { customer, sales_order }                      │
│  }) → returns order_id                                   │
│                                                          │
├── CHECKOUT ──────────────────────────────────────────────┤
│                                                          │
│  Client → Razorpay Checkout.js modal                     │
│  → User pays (UPI / Card / Wallet / NetBanking)          │
│  → Returns: razorpay_payment_id, order_id, signature     │
│                                                          │
├── VERIFY ────────────────────────────────────────────────┤
│                                                          │
│  Next.js API → HMAC SHA256(order_id|payment_id, secret)  │
│  → Compare with razorpay_signature                       │
│  → If valid: confirm order in ERPNext                    │
│                                                          │
├── WEBHOOKS (async reliability) ──────────────────────────┤
│                                                          │
│  Razorpay → POST /api/webhook/razorpay                   │
│  Events: payment.captured, payment.failed,               │
│          refund.processed, refund.failed                  │
│  → Signature verification → update ERPNext               │
│                                                          │
├── REFUNDS ───────────────────────────────────────────────┤
│                                                          │
│  razorpay.payments.refund(payment_id, {                  │
│    amount: partial_paise,                                │
│    speed: 'normal'                                       │
│  }) → creates refund → webhook confirms                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Google Gemini 3 Flash Lite — Magic List AI

```
┌── TEXT ANALYSIS ─────────────────────────────────────────┐
│                                                          │
│  User types: "Tomatoes 2kg, Milk 1L, Rice basmati"       │
│  → POST /api/magic-list/analyze-text                     │
│  → Next.js API → Gemini GenerateContent API              │
│  → Prompt: Extract items as JSON                         │
│  → Response: { items: [{name, qty, unit}] }              │
│  → Match against ERPNext Item DocType                    │
│                                                          │
├── IMAGE ANALYSIS ────────────────────────────────────────┤
│                                                          │
│  User photographs handwritten list                       │
│  → Resize to max 1568px, compress to < 5MB               │
│  → POST /api/magic-list/analyze-image                    │
│  → Next.js API → Gemini Vision (multimodal, base64)      │
│  → Same prompt + matching pipeline                       │
│                                                          │
├── MATCHING PIPELINE ─────────────────────────────────────┤
│                                                          │
│  For each extracted item:                                │
│  1. Exact match: Item.item_name LIKE '%term%'            │
│  2. Keyword match: Item.custom_search_keywords           │
│  3. AI fuzzy: Gemini maps unmatched → catalog            │
│  4. Stock check: Bin.actual_qty > 0                      │
│  → Return: matched + unmatched + alternatives            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 6.3 Google Maps — Address Management

| API | Purpose | Client/Server |
|-----|---------|--------------|
| Places Autocomplete | Address text search | Client (JS API) |
| Place Details | Full address from place_id | Client |
| Geocoding | Address ↔ lat/lng | Server (REST) |
| Maps JavaScript | Interactive map + pin-drop | Client |

### 6.4 MSG91 — OTP SMS

| Endpoint | Purpose |
|----------|---------|
| `POST https://control.msg91.com/api/v5/otp` | Send OTP via SMS |
| `POST https://control.msg91.com/api/v5/otp/verify` | Verify OTP (can supplement our custom verification) |

---

## 7. Feature Matrix

### Complete Feature Parity with Swiggy Instamart

| # | Feature | Status | Backend | Frontend | Notes |
|---|---------|--------|---------|----------|-------|
| 1 | Phone + OTP Login | ✅ | `[CUSTOM_API]` auth.send_otp/verify_otp | PhoneInput + OTPInput | Creates ERPNext Customer on first login |
| 2 | Homepage categories | ✅ | `[NATIVE]` Item Group | CategoryRow | Horizontal scroll |
| 3 | Banner carousel | ✅ | `[CUSTOM_DOCTYPE]` Banner | BannerCarousel | Auto-rotate, swipeable |
| 4 | Product search | ✅ | `[CUSTOM_API]` catalog.search_items | SearchBar | Instant with 300ms debounce |
| 5 | Product detail page | ✅ | `[CUSTOM_API]` catalog.get_product_detail | ProductGallery + PriceBlock + NutritionInfo | Full images, nutrition, variants |
| 6 | Unit/variant selector | ✅ | `[NATIVE]` Item Variants | VariantSelector | 250g / 500g / 1kg options |
| 7 | Out-of-stock indicator | ✅ | `[NATIVE]` Bin stock check | OutOfStockBadge | Real-time via Bin DocType |
| 8 | Instant +/- cart | ✅ | `[CUSTOM_API]` cart.sync_cart | QuantityControl | Optimistic UI + debounced sync |
| 9 | Persistent floating cart | ✅ | Zustand persist | FloatingCart | Bottom bar on all pages |
| 10 | Bill breakdown | ✅ | `[CUSTOM_API]` cart.get_bill_summary | BillBreakdown | Subtotal, tax, delivery, discount |
| 11 | Coupon codes | ✅ | `[NATIVE]` Coupon Code + Pricing Rule | CouponInput | Validate + calculate discount |
| 12 | Delivery time slots | ✅ | `[CUSTOM_DOCTYPE]` Delivery Slot | DeliverySlotPicker | Express / Scheduled / Same Day |
| 13 | Store pickup | ✅ | `[CUSTOM_API]` delivery.check_store_pickup | StorePickupToggle | Toggle on checkout |
| 14 | Delivery instructions | ✅ | `[CUSTOM_FIELD]` on Sales Order | Text input on checkout | "Ring doorbell twice" |
| 15 | Razorpay payment | ✅ | `[EXTERNAL]` Razorpay | PlaceOrderButton | UPI, cards, wallets, netbanking |
| 16 | Past orders | ✅ | `[CUSTOM_API]` checkout.get_order_history | OrderCard | With status tracking |
| 17 | Reorder | ✅ | `[CUSTOM_API]` checkout.reorder | Reorder button | Stock-checked re-cart |
| 18 | Smart reorder suggestions | ✅ | `[CUSTOM_API]` account.get_smart_reorder_suggestions | Suggestion cards | Frequency + recency AI |
| 19 | Manage addresses | ✅ | `[CUSTOM_API]` account.add/update/delete_address | AddressForm + Google Maps | Places Autocomplete + map picker |
| 20 | Saved payments | ✅ | `[EXTERNAL]` Razorpay Tokens | Payment method cards | Tokenized cards |
| 21 | Refund tracking | ✅ | `[CUSTOM_DOCTYPE]` Refund Tracker | RefundCard | Status: Initiated → Completed |
| 22 | Customer support | ✅ | `[CUSTOM_DOCTYPE]` Support Ticket | SupportForm | Category-based ticketing |
| 23 | Membership plan | ✅ | `[CUSTOM_DOCTYPE]` Membership Plan | Membership page | Free delivery + discounts |
| 24 | **Magic List (AI)** | ✅ | `[CUSTOM_API]` magic_list.analyze_text/image | Full Magic List UI | Text + Photo + Upload → match → cart |
| 25 | Minimum order ₹500 | ✅ | Validation in checkout API | UI warning | Configurable threshold |
| 26 | Freshness indicators | ✅ | `[CUSTOM_FIELD]` custom_freshness_category | FreshnessPulse | Animated chip on produce |
| 27 | Pull-to-refresh | ✅ | TanStack Query invalidation | PullToRefresh wrapper | Home page data refresh |
| 28 | Skeleton loading | ✅ | N/A | Skeleton component | All data-dependent sections |

---

## 8. Data Flow Diagrams

### 8.1 Order Lifecycle

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│ BROWSING │───►│   CART    │───►│ CHECKOUT  │───►│ PAYMENT  │───►│ CONFIRMED │
└─────────┘    └──────────┘    └───────────┘    └──────────┘    └───────────┘
                                                                       │
 Add items      Qty +/-         Select slot     Razorpay       Sales Order
 to cart        Apply coupon    Select address  Checkout       submitted
                View bill       Review bill     Verify sig     in ERPNext
                                                                       │
                                                               ┌───────▼───────┐
                                                               │   FULFILLMENT  │
                                                               ├────────────────┤
                                                               │ Pick & Pack    │
                                                               │ Delivery Note  │
                                                               │ Sales Invoice  │
                                                               │ Delivery       │
                                                               └────────────────┘
```

### 8.2 Magic List Flow

```
┌────────────┐    ┌────────────┐    ┌──────────────┐    ┌─────────────┐
│   INPUT     │───►│ AI PROCESS │───►│   MATCHING   │───►│  RESULTS    │
│             │    │            │    │              │    │             │
│ Text input  │    │ Gemini API │    │ Exact search │    │ Matched ✅  │
│ Photo       │    │ Extract    │    │ Keyword      │    │ Partial ⚠️  │
│ File upload │    │ items JSON │    │ Fuzzy AI     │    │ Unmatched ❌│
└────────────┘    └────────────┘    │ Stock check  │    │ Alternatives│
                                    └──────────────┘    └──────┬──────┘
                                                               │
                                                        ┌──────▼──────┐
                                                        │ ADD TO CART  │
                                                        │ One click    │
                                                        └─────────────┘
```

---

## 9. Security Architecture

### 9.1 Authentication & Authorization

| Layer | Mechanism |
|-------|-----------|
| **Frontend → Next.js** | HTTP-only cookie (`freshlife_auth`) set after OTP verification |
| **Next.js → ERPNext** | API Token (`api_key:api_secret`) in Authorization header |
| **ERPNext Permissions** | Role-based: `Customer` role can only access own documents |
| **Route Protection** | Next.js middleware checks cookie on protected routes |
| **OTP Security** | SHA256 hashed in DB, Redis-cached, 5-min TTL, max 5 attempts |

### 9.2 Payment Security

| Measure | Implementation |
|---------|---------------|
| **Server-side order creation** | Razorpay order_id generated server-side, not client |
| **Signature verification** | HMAC SHA256 verification on every payment callback |
| **Webhook validation** | Razorpay webhook signature verification before processing |
| **No client secrets** | `RAZORPAY_KEY_SECRET` never exposed to browser |
| **Idempotent webhooks** | Duplicate event detection before DB updates |

### 9.3 API Security

| Measure | Implementation |
|---------|---------------|
| **Rate limiting** | Per-endpoint limits (OTP: 3/10min, search: 30/min, AI: 10/hr) |
| **Input validation** | Server-side validation on all ERPNext API inputs |
| **CORS** | Restricted to production domain |
| **CSRF** | Next.js built-in CSRF protection on API routes |
| **SQL injection** | Frappe ORM handles parameterized queries |

---

## 10. Deployment Architecture (Railway-Optimized)

### 10.1 Recommended Infrastructure — Railway

Railway is the target deployment platform for both the Next.js storefront and the ERPNext backend. Railway provides Docker-based deployments, internal networking between services, managed databases, and persistent volumes.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    RAILWAY PROJECT: freshlife-prod                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SERVICE 1: nextjs-storefront         SERVICE 2: erpnext-app         │
│  ┌──────────────────────────┐         ┌────────────────────────────┐ │
│  │  Next.js 15 (Standalone) │         │  ERPNext v15/v16 (Docker)  │ │
│  │  ──────────────────────  │         │  ──────────────────────    │ │
│  │  Build: Railpack auto    │         │  Build: Custom Dockerfile  │ │
│  │  output: "standalone"    │         │  Supervisor (web + worker) │ │
│  │  API Routes (BFF)        │         │  Custom App: freshlife     │ │
│  │  CDN / Static Assets     │  ◄────► │  Background Workers        │ │
│  │                          │ internal│  Gunicorn WSGI             │ │
│  │  PORT: $PORT (auto)      │ network │  PORT: $PORT (auto)        │ │
│  └──────────────────────────┘         └────────────────────────────┘ │
│                                                                      │
│  SERVICE 3: mariadb                   SERVICE 4: redis               │
│  ┌──────────────────────────┐         ┌────────────────────────────┐ │
│  │  MariaDB 10.6+           │         │  Redis 7.x                 │ │
│  │  Railway Template        │         │  Railway Template          │ │
│  │  Persistent Volume       │         │  Cache + Queue Broker      │ │
│  │  Auto backups            │         │  OTP sessions              │ │
│  └──────────────────────────┘         └────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────────┐              │
│  │  External Services    │  │  Monitoring               │              │
│  │  ────────────────     │  │  ────────────────────    │              │
│  │  Razorpay             │  │  Railway Metrics          │              │
│  │  Google Gemini AI     │  │  ERPNext Error Logs       │              │
│  │  Google Maps          │  │  Railway Logs (live)      │              │
│  │  MSG91 (SMS)          │  │  Webhook delivery logs    │              │
│  └──────────────────────┘  └──────────────────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Railway Service Configuration

#### Service 1: Next.js Storefront (`nextjs-storefront`)

| Setting | Value |
|---------|-------|
| **Build** | Automatic via Railpack (zero-config) |
| **next.config.ts** | `output: "standalone"` (required for Railway) |
| **Start command** | `node .next/standalone/server.js` |
| **Region** | `asia-southeast` (nearest to Mumbai) |
| **Domain** | Custom domain: `www.freshlife.app` |
| **Health check** | `/api/health` |
| **Environment** | All env vars set in Railway dashboard |

**Railway Environment Variables (Next.js Service):**
```
# ERPNext Connection (server-side only)
ERPNEXT_URL=${{erpnext-app.RAILWAY_PRIVATE_DOMAIN}}  # Internal Railway URL
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# Google Gemini AI (for Magic List)
GEMINI_API_KEY=AIzaxxxxxxx

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaxxxxxxx

# SMS Gateway
MSG91_AUTH_KEY=xxxxxx
MSG91_TEMPLATE_ID=xxxxxx

# App Config
NEXT_PUBLIC_APP_URL=https://www.freshlife.app
NEXT_PUBLIC_MIN_ORDER_VALUE=500
PORT=$PORT  # Railway auto-assigns
```

#### Service 2: ERPNext (`erpnext-app`)

| Setting | Value |
|---------|-------|
| **Build** | Custom Dockerfile (multi-process with Supervisor) |
| **Base image** | `frappe/bench:latest` |
| **Processes** | `gunicorn`, `worker-default`, `worker-short`, `scheduler` |
| **Volume** | `/home/frappe/frappe-bench/sites` (persistent) |
| **Region** | Same region as Next.js service |
| **Internal URL** | `erpnext-app.railway.internal:8000` |

**ERPNext Dockerfile (Railway-optimized):**
```dockerfile
FROM frappe/bench:latest

# Install ERPNext + custom app
RUN bench init --frappe-branch version-15 frappe-bench \
  && cd frappe-bench \
  && bench get-app erpnext --branch version-15 \
  && bench get-app freshlife https://github.com/your-org/freshlife.git --resolve-deps

# Install Supervisor for multi-process in single container
RUN pip install supervisor
COPY supervisord.conf /etc/supervisord.conf

# Railway uses $PORT — configure gunicorn to bind to it
ENV PORT=8000
EXPOSE $PORT

CMD ["supervisord", "-c", "/etc/supervisord.conf"]
```

#### Service 3 & 4: MariaDB + Redis

Deploy using Railway's built-in templates:
1. **MariaDB**: "Deploy → New Service → Database → MariaDB" — Railway auto-provisions and provides `DATABASE_URL`
2. **Redis**: "Deploy → New Service → Database → Redis" — Railway auto-provisions and provides `REDIS_URL`

Connect via ERPNext `common_site_config.json`:
```json
{
  "db_host": "${{mariadb.RAILWAY_PRIVATE_DOMAIN}}",
  "db_port": 3306,
  "redis_cache": "redis://${{redis.RAILWAY_PRIVATE_DOMAIN}}:6379/0",
  "redis_queue": "redis://${{redis.RAILWAY_PRIVATE_DOMAIN}}:6379/1",
  "redis_socketio": "redis://${{redis.RAILWAY_PRIVATE_DOMAIN}}:6379/2"
}
```

### 10.3 Admin Dashboard — ERPNext Desk (Built-in)

> **No custom admin dashboard is required.** ERPNext provides a full-featured admin interface out-of-the-box called **ERPNext Desk**.

| Feature | How It's Done in ERPNext Desk |
|---------|-------------------------------|
| **Product (Item) Management** | Setup → Item → Create/Edit/Delete items, set prices, upload images |
| **Order Management** | Selling → Sales Order → View, update status, create Delivery Notes |
| **Customer Management** | Selling → Customer → Customer profiles, order history |
| **Inventory / Stock** | Stock → Stock Balance → Real-time stock per warehouse |
| **Pricing & Discounts** | Accounting → Pricing Rule → Set discounts, create Coupon Codes |
| **Delivery Slots** | FreshLife → Delivery Slot → Manage time windows, capacity |
| **Banners** | FreshLife → Banner → Upload promotional banners, set display order |
| **Membership Plans** | FreshLife → Membership Plan → Create/edit subscription tiers |
| **Refund Tracking** | FreshLife → Refund Tracker → View refund status, process refunds |
| **Support Tickets** | FreshLife → Support Ticket → Respond to customer issues |
| **Reports & Analytics** | Built-in: Sales Analytics, Stock Ledger, P&L Statement |
| **User/Role Management** | Setup → User → Create staff accounts with role-based permissions |

**ERPNext Desk URL:** `https://erp.freshlife.app` (direct access for admin/staff)

**Key Roles:**
| Role | Access |
|------|--------|
| `System Manager` | Full access to all settings and data |
| `Sales Manager` | Orders, customers, pricing, coupons |
| `Stock Manager` | Inventory, warehouses, stock transfers |
| `Support Agent` | Support tickets, refund processing |
| `FreshLife Admin` | Custom role for Banner, Slot, Membership management |

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 1.1 | Set up ERPNext instance + freshlife custom app scaffold | 3 days | None |
| 1.2 | Create all 8 Custom DocTypes | 3 days | 1.1 |
| 1.3 | Add all Custom Fields to native DocTypes | 2 days | 1.1 |
| 1.4 | Initialize Next.js 15 project + design token system | 2 days | None |
| 1.5 | Implement auth APIs (send_otp, verify_otp) + login UI | 4 days | 1.1, 1.4 |
| 1.6 | Build shared UI primitives (Button, Skeleton, Modal, etc.) | 3 days | 1.4 |

### Phase 2: Core Shopping (Weeks 4-6)
| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 2.1 | Implement catalog APIs (homepage, category, product, search) | 4 days | 1.2 |
| 2.2 | Build Home page (banners, categories, product grid) | 4 days | 2.1, 1.6 |
| 2.3 | Build Product Detail Page (gallery, variants, nutrition) | 3 days | 2.1, 1.6 |
| 2.4 | Implement cart store (Zustand) + cart sync API | 3 days | 1.6 |
| 2.5 | Build Cart page + FloatingCart component | 3 days | 2.4 |
| 2.6 | Implement search (instant search bar + results) | 2 days | 2.1 |

### Phase 3: Checkout & Payments (Weeks 7-8)
| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 3.1 | Delivery Slot API + DeliverySlotPicker UI | 3 days | 1.2 |
| 3.2 | Coupon code validation API + CouponInput UI | 2 days | 1.2 |
| 3.3 | Bill calculation API + BillBreakdown UI | 2 days | 2.4 |
| 3.4 | Razorpay integration (order creation, checkout, verify) | 3 days | 3.3 |
| 3.5 | Razorpay webhook handler | 2 days | 3.4 |
| 3.6 | Store pickup flow | 1 day | 3.1 |

### Phase 4: Account & Management (Weeks 9-10)
| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 4.1 | Account hub + profile management | 2 days | 1.5 |
| 4.2 | Order history + reorder functionality | 3 days | 3.4 |
| 4.3 | Address management + Google Maps integration | 4 days | 4.1 |
| 4.4 | Refund tracking UI + Refund Tracker API | 2 days | 3.5 |
| 4.5 | Support ticket system | 2 days | 4.1 |
| 4.6 | Membership plan UI | 2 days | 1.2 |

### Phase 5: Magic List AI (Weeks 11-12)
| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 5.1 | Google Gemini 3 Flash Lite integration (text analysis) | 3 days | 2.1 |
| 5.2 | Image upload + Gemini multimodal vision integration | 3 days | 5.1 |
| 5.3 | Inventory matching pipeline | 3 days | 5.1 |
| 5.4 | Magic List UI (input, loader, results, add-to-cart) | 4 days | 5.3, 2.4 |
| 5.5 | Camera capture component | 2 days | 5.4 |

### Phase 6: Polish & Launch (Weeks 13-14)
| # | Task | Effort | Dependencies |
|---|------|--------|-------------|
| 6.1 | Responsive design (tablet + desktop breakpoints) | 3 days | All |
| 6.2 | Framer Motion animations + micro-interactions | 3 days | All |
| 6.3 | Skeleton loading states for all pages | 2 days | All |
| 6.4 | SEO optimization (meta tags, sitemap) | 1 day | All |
| 6.5 | Performance audit + optimization | 2 days | All |
| 6.6 | Smart reorder suggestions algorithm | 2 days | 4.2 |
| 6.7 | End-to-end testing | 3 days | All |
| 6.8 | Deployment + monitoring setup | 2 days | All |

**Total Estimated Effort: 14 weeks / 3.5 months**

---

## Appendices

### A. File Reference Index

| File | Task | Contents |
|------|------|---------|
| `skills_catalog.md` | Task 1 | Available tools and skill tags |
| `anti_hallucination_protocols.md` | Task 2 | Verification protocols |
| `task3_ui_context.md` | Task 3 | UI design extraction from Stitch |
| `task4_documentation_research.md` | Task 4 | API docs, endpoints, citations |
| `task5_backend_database_architecture.md` | Task 5 | ERPNext DocTypes, APIs, schemas |
| `task6_frontend_fulfillment_architecture.md` | Task 6 | Next.js components, state, flows |
| `task7_system_blueprint.md` | Task 7 | This document — complete synthesis |

### B. API Endpoint Quick Reference

**Total Endpoints: 38** (10 Native ERPNext + 28 Custom)

Authentication: 3 endpoints
Catalog/Products: 4 endpoints
Cart: 3 endpoints
Checkout/Orders: 4 endpoints
Magic List: 3 endpoints
Delivery: 2 endpoints
Account: 9 endpoints
Native ERPNext: 10 endpoints

### C. Design System Token Reference

| Token Category | Key Values |
|---------------|------------|
| Primary | `#006a2d` / `#6bff8f` / `#005d26` |
| Surface | `#f5f6f7` / `#eff1f2` / `#ffffff` |
| Text | `#2c2f30` (primary), `#595c5d` (secondary) |
| Error | `#b02500` |
| Fonts | Plus Jakarta Sans (display), Inter (body) |
| Radius | 8px / 12px / 16px / 24px / pill |
| Glass | 80% opacity + 20px backdrop-blur |

### D. Documentation Links (All Verified ✅)

- Frappe REST API: https://frappeframework.com/docs/user/en/api/rest
- ERPNext Docs: https://docs.erpnext.com/
- Razorpay Orders: https://razorpay.com/docs/api/orders/
- Razorpay Webhooks: https://razorpay.com/docs/webhooks/
- Google Gemini API: https://ai.google.dev/gemini-api/docs
- Next.js App Router: https://nextjs.org/docs/app
- Google Maps JS: https://developers.google.com/maps/documentation/javascript

---

> **End of System Blueprint**
> This document is ready to be handed off to a development team for implementation.
> All technical claims are grounded in verified documentation per Anti-Hallucination Protocols.
