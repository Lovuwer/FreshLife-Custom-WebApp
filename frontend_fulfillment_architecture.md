# Task 6: Frontend & Fulfillment Logic Architecture
## [SKILL_TAG: SYSTEM_DESIGN, DESIGN_HANDOFF, CONTEXT7]

> Generated: 2026-04-06
> Status: ✅ COMPLETE
> Framework: Next.js 15 (App Router) + React 19
> State: Zustand + React Query (TanStack Query)
> Styling: Vanilla CSS Modules (per design system tokens)
> Source: Stitch UI Context (Task 3) + Design System tokens

---

## 1. Technology Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | Next.js | 15.x | App Router, RSC, Route Handlers |
| UI Library | React | 19.x | Latest stable with concurrent features |
| Language | TypeScript | 5.x | Type safety across stack |
| State (Client) | Zustand | 5.x | Lightweight, devtools, persist middleware |
| Server State | TanStack Query | 5.x | Caching, revalidation, optimistic updates |
| Styling | CSS Modules | N/A | Scoped styles, design token variables |
| Forms | React Hook Form | 7.x | Performant form handling |
| Maps | @react-google-maps/api | 2.x | Google Maps React integration |
| Places | use-places-autocomplete | 4.x | Address autocomplete hook |
| Payments | Razorpay Checkout.js | Latest | CDN-loaded client-side SDK |
| Animation | Framer Motion | 11.x | Micro-animations, page transitions |
| Linting | ESLint + Prettier | Latest | Code consistency |
| Node | Node.js | 20 LTS | Stable runtime |

---

## 2. Project Structure

```
freshlife-storefront/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, providers, nav)
│   ├── page.tsx                  # Home / Discovery page
│   ├── globals.css               # CSS custom properties (design tokens)
│   ├── loading.tsx               # Global loading skeleton
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # 404 page
│   │
│   ├── (auth)/                   # Auth route group (no layout chrome)
│   │   ├── login/
│   │   │   └── page.tsx          # Phone + OTP login
│   │   └── layout.tsx            # Auth-specific layout
│   │
│   ├── category/
│   │   └── [slug]/
│   │       └── page.tsx          # Category items listing
│   │
│   ├── product/
│   │   └── [itemCode]/
│   │       └── page.tsx          # Product Detail Page (PDP)
│   │
│   ├── magic-list/
│   │   └── page.tsx              # AI Magic List Analyzer
│   │
│   ├── cart/
│   │   └── page.tsx              # Cart & Checkout
│   │
│   ├── account/
│   │   ├── page.tsx              # Account hub
│   │   ├── orders/
│   │   │   └── page.tsx          # Past orders
│   │   ├── addresses/
│   │   │   └── page.tsx          # Manage addresses
│   │   ├── refunds/
│   │   │   └── page.tsx          # Refund tracking
│   │   ├── support/
│   │   │   └── page.tsx          # Support tickets
│   │   └── membership/
│   │       └── page.tsx          # Membership plan
│   │
│   └── api/                      # Next.js Route Handlers (BFF)
│       ├── auth/
│       │   ├── send-otp/route.ts
│       │   ├── verify-otp/route.ts
│       │   └── session/route.ts
│       ├── products/
│       │   ├── homepage/route.ts
│       │   ├── category/route.ts
│       │   ├── [itemCode]/route.ts
│       │   └── search/route.ts
│       ├── cart/
│       │   ├── sync/route.ts
│       │   ├── coupon/route.ts
│       │   └── bill/route.ts
│       ├── orders/
│       │   ├── create/route.ts
│       │   ├── confirm-payment/route.ts
│       │   ├── history/route.ts
│       │   └── reorder/route.ts
│       ├── magic-list/
│       │   ├── analyze-text/route.ts
│       │   ├── analyze-image/route.ts
│       │   └── add-to-cart/route.ts
│       ├── delivery/
│       │   ├── slots/route.ts
│       │   └── pickup/route.ts
│       ├── account/
│       │   ├── profile/route.ts
│       │   ├── addresses/route.ts
│       │   ├── refunds/route.ts
│       │   └── support/route.ts
│       ├── payments/
│       │   ├── create-order/route.ts    # Razorpay order
│       │   └── verify/route.ts          # Signature verify
│       └── webhook/
│           ├── razorpay/route.ts         # Razorpay webhooks
│           └── erpnext/route.ts          # ERPNext webhooks
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx            # Sticky header (location + search)
│   │   ├── BottomNav.tsx         # Bottom navigation bar
│   │   ├── FloatingCart.tsx      # Persistent floating cart summary
│   │   └── SearchBar.tsx         # Organic pill search
│   │
│   ├── home/
│   │   ├── BannerCarousel.tsx    # Promotional banner slider
│   │   ├── CategoryRow.tsx       # Horizontal scrollable categories
│   │   ├── ProductGrid.tsx       # Product card grid
│   │   ├── FeaturedSection.tsx   # Featured items section
│   │   └── FreshnessPulse.tsx    # Animated freshness chip
│   │
│   ├── product/
│   │   ├── ProductCard.tsx       # Card with instant +/- cart
│   │   ├── ProductGallery.tsx    # Image gallery (swipeable)
│   │   ├── PriceBlock.tsx        # MRP / discount / final price
│   │   ├── VariantSelector.tsx   # Unit/weight selector
│   │   ├── NutritionInfo.tsx     # Nutritional data display
│   │   ├── RelatedProducts.tsx   # Similar products scroll
│   │   └── OutOfStockBadge.tsx   # Out-of-stock indicator
│   │
│   ├── cart/
│   │   ├── CartItemRow.tsx       # Cart item with qty controls
│   │   ├── BillBreakdown.tsx     # Itemized bill summary
│   │   ├── CouponInput.tsx       # Coupon code input + apply
│   │   ├── DeliverySlotPicker.tsx# Time slot grid selector
│   │   ├── StorePickupToggle.tsx # Pickup vs delivery toggle
│   │   ├── DeliveryAddress.tsx   # Selected address display
│   │   └── PlaceOrderButton.tsx  # Gradient CTA → Razorpay
│   │
│   ├── auth/
│   │   ├── PhoneInput.tsx        # Phone number + country code
│   │   ├── OTPInput.tsx          # 6-digit OTP boxes
│   │   └── AuthGuard.tsx         # Protected route wrapper
│   │
│   ├── magic-list/
│   │   ├── InputMethodSelector.tsx # Text / Photo / Upload tabs
│   │   ├── TextListInput.tsx     # Free-text grocery input
│   │   ├── CameraCapture.tsx     # Camera / file upload
│   │   ├── AnalysisLoader.tsx    # Processing animation
│   │   ├── MatchedItemsList.tsx  # Matched products with controls
│   │   ├── UnmatchedItems.tsx    # Unmatched with alternatives
│   │   └── AddAllToCart.tsx      # "Add All" primary CTA
│   │
│   ├── account/
│   │   ├── ProfileHeader.tsx     # Name, phone, edit link
│   │   ├── MenuSection.tsx       # Account menu items
│   │   ├── OrderCard.tsx         # Past order with reorder btn
│   │   ├── AddressCard.tsx       # Address with edit/delete
│   │   ├── AddressForm.tsx       # Address form + Google Maps
│   │   ├── RefundCard.tsx        # Refund status card
│   │   └── SupportForm.tsx       # Support ticket form
│   │
│   └── ui/                       # Shared UI primitives
│       ├── Button.tsx            # Primary / Secondary / Ghost
│       ├── QuantitySelector.tsx  # Pill-shaped +/- control
│       ├── Skeleton.tsx          # Loading skeleton
│       ├── Badge.tsx             # Label badge
│       ├── Modal.tsx             # Glassmorphism overlay modal
│       ├── Toast.tsx             # Notification toast
│       ├── EmptyState.tsx        # Empty state illustration
│       └── PullToRefresh.tsx     # Pull-to-refresh wrapper
│
├── lib/
│   ├── api/
│   │   ├── client.ts             # ERPNext API client (fetch wrapper)
│   │   ├── auth.ts               # Auth API functions
│   │   ├── products.ts           # Product API functions
│   │   ├── cart.ts               # Cart API functions
│   │   ├── orders.ts             # Order API functions
│   │   ├── magic-list.ts         # Magic List API functions
│   │   ├── delivery.ts           # Delivery API functions
│   │   ├── account.ts            # Account API functions
│   │   └── payments.ts           # Razorpay API functions
│   │
│   ├── stores/
│   │   ├── cartStore.ts          # Zustand cart store
│   │   ├── authStore.ts          # Zustand auth store
│   │   ├── locationStore.ts      # Zustand location/address store
│   │   └── uiStore.ts            # Zustand UI state (modals, toasts)
│   │
│   ├── hooks/
│   │   ├── useCart.ts            # Cart operations hook
│   │   ├── useAuth.ts            # Auth state + operations
│   │   ├── useProducts.ts        # Product query hooks
│   │   ├── useOrders.ts          # Order query hooks
│   │   ├── useMagicList.ts       # Magic List operation hooks
│   │   ├── useDelivery.ts        # Delivery slot hooks
│   │   ├── useDebounce.ts        # Debounce utility hook
│   │   └── useLocation.ts        # Geolocation hook
│   │
│   ├── utils/
│   │   ├── formatCurrency.ts     # ₹ formatting
│   │   ├── formatDate.ts         # Date/time formatting
│   │   ├── imageOptimize.ts      # Image resize for Magic List upload
│   │   └── validators.ts         # Phone, OTP, address validation
│   │
│   └── types/
│       ├── product.ts            # Product types
│       ├── cart.ts               # Cart types
│       ├── order.ts              # Order types
│       ├── auth.ts               # Auth types
│       ├── delivery.ts           # Delivery types
│       ├── magicList.ts          # Magic List types
│       └── account.ts            # Account types
│
├── public/
│   ├── icons/                    # SVG icons
│   ├── images/                   # Static assets
│   └── fonts/                    # Plus Jakarta Sans, Inter (self-hosted)
│
├── middleware.ts                  # Auth middleware (protect routes)
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config
├── package.json                  # Dependencies
└── .env.local                    # Environment variables
```

---

## 3. Design Token System (CSS Custom Properties)

Based on Task 3 Design System extraction:

```css
/* app/globals.css */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

:root {
  /* ── Color Tokens (Material Design 3 Extended) ── */
  --color-primary: #006a2d;
  --color-primary-container: #6bff8f;
  --color-primary-dim: #005d26;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #00210b;

  --color-secondary: #525c6d;
  --color-secondary-container: #d3ddf2;
  --color-on-secondary: #ffffff;

  --color-tertiary: #006573;
  --color-tertiary-container: #9aefff;

  --color-surface: #f5f6f7;
  --color-surface-container-low: #eff1f2;
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-highest: #e0e2e3;

  --color-on-background: #2c2f30;
  --color-on-surface-variant: #595c5d;
  --color-outline: #757778;
  --color-outline-variant: rgba(171, 173, 174, 0.15);

  --color-error: #b02500;
  --color-error-container: #ffdad4;

  --color-success: #006a2d;
  --color-warning: #f59e0b;

  /* ── Typography ── */
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Display */
  --text-display-lg: 800 2rem/1.2 var(--font-display);
  --text-display-md: 700 1.75rem/1.25 var(--font-display);
  --text-display-sm: 700 1.5rem/1.3 var(--font-display);

  /* Headline */
  --text-headline-lg: 700 1.25rem/1.35 var(--font-display);
  --text-headline-md: 600 1.125rem/1.4 var(--font-display);
  --text-headline-sm: 600 1rem/1.4 var(--font-display);

  /* Body */
  --text-body-lg: 400 1rem/1.5 var(--font-body);
  --text-body-md: 400 0.875rem/1.5 var(--font-body);
  --text-body-sm: 400 0.75rem/1.5 var(--font-body);

  /* Label */
  --text-label-lg: 600 0.875rem/1.4 var(--font-body);
  --text-label-md: 500 0.75rem/1.4 var(--font-body);
  --text-label-sm: 500 0.6875rem/1.4 var(--font-body);

  /* ── Spacing ── */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */

  /* ── Border Radius ── */
  --radius-sm: 0.5rem;    /* 8px */
  --radius-md: 0.75rem;   /* 12px - primary elements */
  --radius-lg: 1rem;      /* 16px */
  --radius-xl: 1.5rem;    /* 24px - search bars */
  --radius-full: 9999px;  /* pill shape - qty selectors */

  /* ── Shadows (subtle — prefer tonal layering) ── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.08);

  /* ── Glassmorphism ── */
  --glass-bg: rgba(255, 255, 255, 0.80);
  --glass-blur: blur(20px);
  --glass-border: 1px solid rgba(255, 255, 255, 0.3);

  /* ── Gradients ── */
  --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-primary-dim));
  --gradient-surface: linear-gradient(180deg, var(--color-surface), var(--color-surface-container-low));

  /* ── Animations ── */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* ── Z-Indexes ── */
  --z-header: 100;
  --z-floating-cart: 90;
  --z-bottom-nav: 100;
  --z-modal: 200;
  --z-toast: 300;

  /* ── Layout ── */
  --header-height: 56px;
  --bottom-nav-height: 64px;
  --floating-cart-height: 56px;
  --max-content-width: 480px;  /* Mobile-first constraint */
}

/* ── Design Rules Enforcement ── */

/* Rule: No pure black text */
body { color: var(--color-on-background); }

/* Rule: No 1px borders → use tonal shifts */
/* Rule: Glassmorphism for overlays */
.glass-overlay {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
}

/* Rule: Primary CTAs use gradient */
.btn-primary {
  background: var(--gradient-primary);
  color: var(--color-on-primary);
  border: none;
  border-radius: var(--radius-md);
  font: var(--text-label-lg);
  padding: var(--space-sm) var(--space-lg);
  cursor: pointer;
  transition: transform var(--duration-fast) var(--ease-out-expo),
              box-shadow var(--duration-fast);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
.btn-primary:active {
  transform: translateY(0);
}
```

---

## 4. State Management Architecture

### 4.1 Cart Store (Zustand + Persist)

```typescript
// lib/stores/cartStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  item_code: string;
  item_name: string;
  quantity: number;
  rate: number;
  image: string;
  max_qty: number;
  in_stock: boolean;
}

interface CartStore {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  deliveryFee: number;
  lastSynced: Date | null;

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (itemCode: string) => void;
  updateQuantity: (itemCode: string, qty: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  syncWithServer: () => Promise<void>;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getGrandTotal: () => number;
  getItemQuantity: (itemCode: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      deliveryFee: 0,
      lastSynced: null,

      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.item_code === item.item_code);
        if (existing) {
          return {
            items: state.items.map(i =>
              i.item_code === item.item_code
                ? { ...i, quantity: Math.min(i.quantity + 1, i.max_qty) }
                : i
            )
          };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),

      removeItem: (itemCode) => set((state) => ({
        items: state.items.filter(i => i.item_code !== itemCode)
      })),

      updateQuantity: (itemCode, qty) => set((state) => ({
        items: qty <= 0
          ? state.items.filter(i => i.item_code !== itemCode)
          : state.items.map(i =>
              i.item_code === itemCode
                ? { ...i, quantity: Math.min(qty, i.max_qty) }
                : i
            )
      })),

      clearCart: () => set({
        items: [],
        couponCode: null,
        couponDiscount: 0
      }),

      applyCoupon: (code, discount) => set({
        couponCode: code,
        couponDiscount: discount
      }),

      removeCoupon: () => set({
        couponCode: null,
        couponDiscount: 0
      }),

      syncWithServer: async () => {
        const { items } = get();
        // Debounced POST to /api/cart/sync
        // Updates items with current prices & stock
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () => get().items.reduce((sum, i) => sum + (i.rate * i.quantity), 0),
      getGrandTotal: () => {
        const { getSubtotal, couponDiscount, deliveryFee } = get() as any;
        return getSubtotal() - couponDiscount + deliveryFee;
      },
      getItemQuantity: (itemCode) => {
        const item = get().items.find(i => i.item_code === itemCode);
        return item?.quantity ?? 0;
      }
    }),
    {
      name: 'freshlife-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        couponCode: state.couponCode,
      }),
    }
  )
);
```

### 4.2 Auth Store (Zustand + Persist)

```typescript
// lib/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Customer {
  name: string;
  customer_name: string;
  phone: string;
  email: string | null;
  membership_plan: string | null;
  default_address: string | null;
}

interface AuthStore {
  token: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;

  // Auth flow state
  otpSent: boolean;
  otpPhone: string | null;
  otpExpiresAt: Date | null;

  // Actions
  setOTPSent: (phone: string, expiresIn: number) => void;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
  updateCustomer: (updates: Partial<Customer>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      customer: null,
      isAuthenticated: false,
      otpSent: false,
      otpPhone: null,
      otpExpiresAt: null,

      setOTPSent: (phone, expiresIn) => set({
        otpSent: true,
        otpPhone: phone,
        otpExpiresAt: new Date(Date.now() + expiresIn * 1000),
      }),

      login: (token, customer) => set({
        token,
        customer,
        isAuthenticated: true,
        otpSent: false,
        otpPhone: null,
        otpExpiresAt: null,
      }),

      logout: () => set({
        token: null,
        customer: null,
        isAuthenticated: false,
      }),

      updateCustomer: (updates) => set((state) => ({
        customer: state.customer ? { ...state.customer, ...updates } : null,
      })),
    }),
    {
      name: 'freshlife-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        customer: state.customer,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 4.3 Location Store

```typescript
// lib/stores/locationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Location {
  address_name: string | null;
  address_title: string;
  address_line1: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  warehouse: string | null;  // Nearest warehouse determined by backend
}

interface LocationStore {
  currentLocation: Location | null;
  setLocation: (location: Location) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      currentLocation: null,
      setLocation: (location) => set({ currentLocation: location }),
      clearLocation: () => set({ currentLocation: null }),
    }),
    {
      name: 'freshlife-location',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## 5. API Client Layer (BFF Pattern)

### 5.1 ERPNext API Client

```typescript
// lib/api/client.ts

const ERPNEXT_URL = process.env.ERPNEXT_URL!;
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY!;
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET!;

interface ERPNextOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
  userToken?: string;  // For user-specific requests
}

export async function erpnextFetch<T>(
  path: string,
  options: ERPNextOptions = {}
): Promise<T> {
  const { method = 'GET', body, params, userToken } = options;

  const url = new URL(`${ERPNEXT_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': userToken
      ? `token ${userToken}`
      : `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 0 },  // No caching at Next.js level (ERPNext handles freshness)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ERPNextError(response.status, error);
  }

  const data = await response.json();
  return data.message ?? data.data ?? data;
}

export class ERPNextError extends Error {
  constructor(public status: number, public details: unknown) {
    super(`ERPNext API Error: ${status}`);
  }
}
```

### 5.2 Next.js Route Handler Pattern (BFF)

```typescript
// app/api/products/homepage/route.ts
import { NextResponse } from 'next/server';
import { erpnextFetch } from '@/lib/api/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouse = searchParams.get('warehouse') || 'Main Store';

    const data = await erpnextFetch('/api/method/freshlife.api.catalog.get_homepage_data', {
      params: { warehouse },
    });

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}
```

---

## 6. Component Architecture — Key Screens

### 6.1 Home / Discovery Page

```
┌─────────────────────────────────────────────┐
│  Header (sticky)                            │
│  ┌─────────────────────────────────────────┐│
│  │ 📍 Location Label      🔍 Search      ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  Banner Carousel                            │
│  ┌─────────────────────────────────────────┐│
│  │  [Banner Slide 1]  ← swipe →           ││
│  │  Dot indicators                         ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  Category Row (horizontal scroll)           │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
│  │🍎│ │🥛│ │🍞│ │🥩│ │🧴│ │🍫│  →       │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘          │
├─────────────────────────────────────────────┤
│  Featured Products                          │
│  "Picked for You"                           │
│  ┌────────┐ ┌────────┐ ┌────────┐         │
│  │ Image  │ │ Image  │ │ Image  │         │
│  │ Name   │ │ Name   │ │ Name   │         │
│  │ ₹Price │ │ ₹Price │ │ ₹Price │         │
│  │ [+/-]  │ │ [+/-]  │ │ [+/-]  │         │
│  └────────┘ └────────┘ └────────┘         │
├─────────────────────────────────────────────┤
│                                             │
│  ... More sections (Trending, Fresh, etc.)  │
│                                             │
├─────────────────────────────────────────────┤
│  Floating Cart Bar (if items in cart)       │
│  ┌─────────────────────────────────────────┐│
│  │ 🛒 3 items  │  ₹567  │  View Cart →   ││
│  └─────────────────────────────────────────┘│
├─────────────────────────────────────────────┤
│  Bottom Navigation                          │
│  ┌─────┬──────┬──────┬──────┬──────┐      │
│  │Home │Ctgry │Magic │ Cart │Acct  │      │
│  │ 🏠  │  📋  │  ✨  │  🛒  │  👤  │      │
│  └─────┴──────┴──────┴──────┴──────┘      │
└─────────────────────────────────────────────┘
```

**Data Flow:**
```
Page Mount → useQuery('homepage', getHomepageData)
  → TanStack Query caches for 5 min
  → Renders: BannerCarousel + CategoryRow + ProductGrid
  → Each ProductCard reads cart qty from useCartStore
  → +/- buttons → optimistic update → debounced syncWithServer()
```

### 6.2 Product Detail Page (PDP)

```
┌────────────────────────────────────────────┐
│  ← Back                                    │
├────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐│
│  │                                        ││
│  │        Product Image Gallery           ││
│  │        (swipe for more)                ││
│  │        • • ● •                         ││
│  │                                        ││
│  └────────────────────────────────────────┘│
├────────────────────────────────────────────┤
│  Organic Tomatoes — Farm Fresh             │
│  Brand Name                                │
│  ┌────────────────────────────────────┐    │
│  │ ₹45  ₹55̶  18% off                │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Variant Selector:                         │
│  ┌───────┐ ┌───────┐ ┌───────┐           │
│  │ 250g  │ │*500g* │ │  1kg  │           │
│  │  ₹25  │ │  ₹45  │ │  ₹85  │           │
│  └───────┘ └───────┘ └───────┘           │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │   ▓▓▓▓ Add to Cart ▓▓▓▓          │    │
│  └────────────────────────────────────┘    │
│                                            │
│  📋 Product Description                   │
│  Long text about freshness...              │
│                                            │
│  🥗 Nutritional Information               │
│  Calories: 22 | Protein: 1g | ...         │
│                                            │
│  Similar Products ───────────►             │
│  ┌──────┐ ┌──────┐ ┌──────┐              │
│  │      │ │      │ │      │              │
│  └──────┘ └──────┘ └──────┘              │
└────────────────────────────────────────────┘
```

**Data Flow:**
```
[itemCode] param → useQuery(['product', itemCode], getProductDetail)
  → Renders: gallery, price, variants, nutrition
  → Variant click → new query with variant item_code
  → Add to Cart → useCartStore.addItem() → optimistic UI
```

### 6.3 Magic List Analyzer

```
┌────────────────────────────────────────────┐
│  ← Magic List                              │
├────────────────────────────────────────────┤
│                                            │
│  Input Method Selector:                    │
│  ┌────────┐ ┌────────┐ ┌────────┐        │
│  │  ✍️   │ │  📷   │ │  📤   │        │
│  │ Write  │ │ Photo  │ │Upload  │        │
│  └────────┘ └────────┘ └────────┘        │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  Type your grocery list here...    │    │
│  │                                    │    │
│  │  Tomatoes 2kg                      │    │
│  │  Milk 1L                           │    │
│  │  Rice 5kg                          │    │
│  │  Onions                            │    │
│  │                                    │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │   ✨ Analyze My List               │    │
│  └────────────────────────────────────┘    │
│                                            │
│─── After Analysis ─────────────────────────│
│                                            │
│  ✅ Matched (8 of 10)                      │
│  ┌────────────────────────────────────┐    │
│  │ 🍅 Organic Tomatoes  ₹45  [+/-]  │    │
│  │ 🥛 Amul Milk 1L      ₹68  [+/-]  │    │
│  │ 🍚 India Gate Rice   ₹425 [+/-]  │    │
│  │ 🧅 Onions 1kg        ₹35  [+/-]  │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ❓ Not Found (2)                          │
│  ┌────────────────────────────────────┐    │
│  │ "Fancy cheese" → Did you mean:    │    │
│  │   Amul Cheese Slices ₹99          │    │
│  │   Britannia Cheese   ₹85          │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  🛒 Add All to Cart (₹1,245)      │    │
│  └────────────────────────────────────┘    │
└────────────────────────────────────────────┘
```

**State Machine:**
```
[idle] → user types / uploads → [input_ready]
  → click "Analyze" → [analyzing] (show loader animation)
  → API response → [results_ready]
  → user adjusts items → [results_modified]
  → click "Add All" → [adding_to_cart]
  → complete → redirect to /cart
```

### 6.4 Cart & Checkout

```
┌────────────────────────────────────────────┐
│  ← Cart                           Clear All│
├────────────────────────────────────────────┤
│                                            │
│  Cart Items:                               │
│  ┌────────────────────────────────────┐    │
│  │ [img] Organic Tomatoes 500g       │    │
│  │       ₹45 × 2 = ₹90    [-][2][+] │    │
│  │                            🗑️    │    │
│  ├────────────────────────────────────┤    │
│  │ [img] Amul Toned Milk 1L         │    │
│  │       ₹68 × 1 = ₹68    [-][1][+] │    │
│  │                            🗑️    │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Coupon Code:                              │
│  ┌──────────────────────┐ ┌──────────┐    │
│  │ Enter code...        │ │  Apply   │    │
│  └──────────────────────┘ └──────────┘    │
│  ✅ FRESH50 applied! -₹50                  │
│                                            │
│  Delivery Options:                         │
│  ┌────────────────────────────────────┐    │
│  │ 🚚 Delivery          🏪 Pickup   │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Delivery Slots (April 6):                 │
│  ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ ⚡10min│ │9-11 AM │ │11-1 PM │        │
│  │  ₹49   │ │  ₹29   │ │  ₹29   │        │
│  └────────┘ └────────┘ └────────┘        │
│                                            │
│  📍 Delivery Address:                      │
│  123 Green Park, New Delhi   [Change]      │
│                                            │
│  📝 Delivery Instructions:                 │
│  ┌────────────────────────────────────┐    │
│  │ Ring doorbell twice               │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Bill Details:                             │
│  ┌────────────────────────────────────┐    │
│  │ Subtotal            ₹1,245        │    │
│  │ Delivery Fee        ₹29           │    │
│  │ Tax (GST)           ₹62           │    │
│  │ Coupon (FRESH50)    -₹50          │    │
│  │ ─────────────────────────         │    │
│  │ Grand Total         ₹1,286        │    │
│  │ You save ₹155! 🎉                │    │
│  └────────────────────────────────────┘    │
│                                            │
│  ┌────────────────────────────────────┐    │
│  │  💳 Place Order — ₹1,286          │    │
│  └────────────────────────────────────┘    │
└────────────────────────────────────────────┘
```

---

## 7. Delivery Window Calculation Logic

### Fulfillment Types

| Type | ETA | Fee Logic | UI Display |
|------|-----|-----------|------------|
| **Express** | 10-15 min | ₹49 base, free above ₹999 for members | "⚡ 10 min" badge |
| **Scheduled** | Selected time window | ₹29 base, free above ₹500 for members | "9:00 AM - 11:00 AM" |
| **Same Day** | By end of day | ₹19 | "Today by 9 PM" |
| **Store Pickup** | 30 min to prepare | Free | "Ready in 30 min" |

### Delivery Fee Calculation

```typescript
// lib/utils/deliveryFee.ts

interface DeliveryFeeParams {
  subtotal: number;
  slotType: 'Express' | 'Scheduled' | 'Same Day';
  isMember: boolean;
  isStorePickup: boolean;
}

const FEE_CONFIG = {
  Express: { base: 49, memberFreeAbove: 999, nonMemberFreeAbove: Infinity },
  Scheduled: { base: 29, memberFreeAbove: 500, nonMemberFreeAbove: Infinity },
  'Same Day': { base: 19, memberFreeAbove: 500, nonMemberFreeAbove: Infinity },
};

const MIN_ORDER_VALUE = 500;  // ₹500 minimum for delivery

export function calculateDeliveryFee(params: DeliveryFeeParams): {
  fee: number;
  freeDeliveryMessage: string | null;
  minOrderMet: boolean;
} {
  if (params.isStorePickup) {
    return { fee: 0, freeDeliveryMessage: null, minOrderMet: true };
  }

  const minOrderMet = params.subtotal >= MIN_ORDER_VALUE;
  const config = FEE_CONFIG[params.slotType];
  const freeAbove = params.isMember
    ? config.memberFreeAbove
    : config.nonMemberFreeAbove;

  const fee = params.subtotal >= freeAbove ? 0 : config.base;
  const remainingForFree = freeAbove - params.subtotal;

  const freeDeliveryMessage = fee > 0 && remainingForFree > 0
    ? `Add ₹${remainingForFree} more for free delivery`
    : null;

  return { fee, freeDeliveryMessage, minOrderMet };
}
```

### Delivery Slot Availability Logic

```typescript
// lib/utils/deliverySlots.ts

interface SlotAvailability {
  date: string;
  slots: Array<{
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    type: 'Express' | 'Scheduled' | 'Same Day';
    fee: number;
    available: boolean;
    remainingCapacity: number;
  }>;
}

/**
 * Client-side slot filtering rules:
 * 1. Express: Available only if current time allows 15-min prep + delivery
 * 2. Scheduled: Hide past time windows for today
 * 3. Show 3 days ahead of today
 * 4. Disable slots at capacity (current_orders >= max_orders)
 */
export function filterAvailableSlots(
  serverSlots: SlotAvailability[],
  currentTime: Date
): SlotAvailability[] {
  return serverSlots.map(day => ({
    ...day,
    slots: day.slots.filter(slot => {
      if (day.date === formatDate(currentTime)) {
        // Today: remove past time windows
        const slotEnd = parseTime(slot.endTime);
        return slotEnd > currentTime && slot.available;
      }
      return slot.available;
    }),
  })).filter(day => day.slots.length > 0);
}
```

---

## 8. Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Login Page  │     │  Next.js API  │     │   ERPNext    │
└──────┬──────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       │ Enter Phone        │                     │
       ├───POST /api/auth/──►│                     │
       │    send-otp        │──POST freshlife.──►│
       │                    │  api.auth.send_otp  │
       │                    │◄── { ok } ─────────│
       │◄── { expires_in }──│                     │
       │                    │                     │
       │ Enter OTP          │                     │
       ├───POST /api/auth/──►│                     │
       │    verify-otp      │──POST freshlife.──►│
       │                    │  api.auth.verify_otp│
       │                    │◄── { token, cust }─│
       │◄── Set HTTP-only ──│                     │
       │    cookie + cust   │                     │
       │                    │                     │
       │ ──► Redirect to /  │                     │
       │                    │                     │
```

### Middleware (Route Protection)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/cart', '/account', '/magic-list'];
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('freshlife_auth')?.value;
  const { pathname } = request.nextUrl;

  // Protect authenticated routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/cart/:path*', '/account/:path*', '/magic-list/:path*', '/login'],
};
```

---

## 9. Razorpay Checkout Integration

```typescript
// components/cart/PlaceOrderButton.tsx
'use client';

import { useState } from 'react';
import Script from 'next/script';
import { useCartStore } from '@/lib/stores/cartStore';
import { useAuthStore } from '@/lib/stores/authStore';

interface PlaceOrderProps {
  grandTotal: number;
  deliverySlot: string | null;
  deliveryAddress: string;
  isStorePickup: boolean;
  deliveryInstructions: string;
}

export function PlaceOrderButton({
  grandTotal,
  deliverySlot,
  deliveryAddress,
  isStorePickup,
  deliveryInstructions,
}: PlaceOrderProps) {
  const [loading, setLoading] = useState(false);
  const { items, couponCode, clearCart } = useCartStore();
  const { customer, token } = useAuthStore();

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Step 1: Create Sales Order in ERPNext
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_items: items.map(i => ({ item_code: i.item_code, quantity: i.quantity })),
          delivery_address: deliveryAddress,
          delivery_slot: deliverySlot,
          is_store_pickup: isStorePickup,
          coupon_code: couponCode,
          delivery_instructions: deliveryInstructions,
        }),
      });
      const orderData = await orderRes.json();

      // Step 2: Create Razorpay Order
      const payRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          sales_order: orderData.sales_order,
        }),
      });
      const payData = await payRes.json();

      // Step 3: Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: grandTotal * 100,
        currency: 'INR',
        name: 'FreshLife',
        description: `Order ${orderData.sales_order}`,
        order_id: payData.orderId,
        prefill: {
          contact: customer?.phone,
          email: customer?.email || '',
        },
        theme: { color: '#006a2d' },
        handler: async (response: RazorpayResponse) => {
          // Step 4: Verify payment
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sales_order: orderData.sales_order,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            clearCart();
            window.location.href = `/account/orders?success=${orderData.sales_order}`;
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Order failed:', error);
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <button
        className="btn-primary place-order-btn"
        onClick={handlePlaceOrder}
        disabled={loading || grandTotal < 500}
        id="place-order-button"
      >
        {loading ? 'Processing...' : `💳 Place Order — ₹${grandTotal.toLocaleString('en-IN')}`}
      </button>
    </>
  );
}
```

---

## 10. Optimistic UI Pattern (Instant +/- Cart)

```typescript
// components/product/ProductCard.tsx — Quantity selector pattern
'use client';

import { useCartStore } from '@/lib/stores/cartStore';
import { useRef, useCallback } from 'react';

export function QuantityControl({ item }: { item: ProductItem }) {
  const { getItemQuantity, addItem, updateQuantity, removeItem } = useCartStore();
  const qty = getItemQuantity(item.item_code);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const debouncedSync = useCallback(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      // Sync with server after 500ms of inactivity
      useCartStore.getState().syncWithServer();
    }, 500);
  }, []);

  const handleIncrement = () => {
    if (qty === 0) {
      addItem({
        item_code: item.item_code,
        item_name: item.item_name,
        quantity: 1,
        rate: item.rate,
        image: item.image,
        max_qty: item.stock_qty,
        in_stock: true,
      });
    } else {
      updateQuantity(item.item_code, qty + 1);
    }
    debouncedSync();
  };

  const handleDecrement = () => {
    if (qty <= 1) {
      removeItem(item.item_code);
    } else {
      updateQuantity(item.item_code, qty - 1);
    }
    debouncedSync();
  };

  if (qty === 0) {
    return (
      <button className="add-btn" onClick={handleIncrement}>
        Add
      </button>
    );
  }

  return (
    <div className="qty-selector">
      <button onClick={handleDecrement} aria-label="Decrease quantity">−</button>
      <span>{qty}</span>
      <button onClick={handleIncrement} aria-label="Increase quantity">+</button>
    </div>
  );
}
```

---

## 11. Search Architecture

```typescript
// components/layout/SearchBar.tsx — Instant search with debounce

'use client';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    fetch(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => setResults(data.results))
      .catch(() => {});

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="search-wrapper">
      <input
        type="text"
        placeholder="Search for groceries..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        className="search-input"
        id="search-input"
      />
      {isOpen && results.length > 0 && (
        <div className="search-results glass-overlay">
          {results.map(item => (
            <SearchResultItem key={item.item_code} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 12. Environment Variables

```env
# .env.local

# ERPNext Connection (server-side only)
ERPNEXT_URL=https://erp.freshlife.app
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

# SMS Gateway (MSG91)
MSG91_AUTH_KEY=xxxxxx
MSG91_TEMPLATE_ID=xxxxxx

# App Config
NEXT_PUBLIC_APP_URL=https://www.freshlife.app
NEXT_PUBLIC_MIN_ORDER_VALUE=500
```

---

## 13. Performance Optimization Strategy

| Technique | Implementation |
|-----------|---------------|
| **Image Optimization** | Next.js `<Image>` with ERPNext CDN + WebP format |
| **Code Splitting** | Dynamic imports for Razorpay, Google Maps, Camera |
| **Skeleton Loading** | All data-fetching pages show skeleton components |
| **Stale-While-Revalidate** | TanStack Query with staleTime + background refetch |
| **Prefetching** | `<Link prefetch>` for category → product navigation |
| **Bundle Size** | Zustand (< 2KB) + CSS Modules (no runtime CSS-in-JS) |
| **Font Loading** | `next/font` preload for Plus Jakarta Sans + Inter |
| **Service Worker** | PWA-ready with offline cart access |
| **Lazy Components** | `React.lazy()` for below-fold sections |

---

## 14. Responsive Design Strategy

> **Mobile-first** (390px base → scales up)

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| Mobile (base) | 390px | Single column, bottom nav, full-width cards |
| Tablet | 768px | 2-column product grid, side cart panel |
| Desktop | 1024px | 3-column grid, persistent sidebar cart, top navigation |
| Wide | 1280px | 4-column grid, max-width container (1280px) |

---

*Task 6 complete. Frontend architecture fully documented with component tree, state management, auth flow, payment integration, and fulfillment logic. Proceeding to Task 7.*
