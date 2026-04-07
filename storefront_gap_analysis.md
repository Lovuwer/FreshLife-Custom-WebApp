# Storefront Gap Analysis
## FreshLife — Missing Files vs. Architecture Specification

> **[SKILL_TAG: WRITING_PLANS, WRITE]**
> Generated: 2026-04-07
> Source: Full audit of `system_blueprint.md`, `frontend_fulfillment_architecture.md`, `ui_context.md`,
> `backend_database_architecture.md`, `railway_deployment_guide.md` vs. actual `storefront/src/` contents.
> Status: ⚠️ GAPS IDENTIFIED — 16 items missing, 1 naming deviation

---

## Summary

| Category | Spec Count | Present | Missing |
|----------|-----------|---------|---------|
| API Routes | 25 | 19 | **6** |
| Components | 48 | 40 | **6** |
| Hooks | 8 | 7 | **1** |
| Utils | 6 | 4 | **2** |
| Pages | 12 | 11 | **1** |
| **Total** | **99** | **81** | **16** |

---

## 1. Missing API Routes

All API routes live under `storefront/src/app/api/`.
The BFF pattern requires every route to call ERPNext via `lib/api/client.ts` — never exposing credentials to the client.

### 1.1 `api/orders/create/route.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`, `system_blueprint.md §5.1`

Creates a Sales Order in ERPNext before the Razorpay payment modal is opened.
This is the first of the two-step checkout flow referenced in `PlaceOrderButton.tsx`.

```typescript
// src/app/api/orders/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch, ERPNextError } from '@/lib/api/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('freshlife_auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = await erpnextFetch('/api/method/freshlife.api.checkout.create_order', {
      method: 'POST',
      body,
      userToken: token,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ERPNextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
```

---

### 1.2 `api/orders/confirm-payment/route.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`

Confirms payment in ERPNext after Razorpay signature verification succeeds.
Distinct from `/api/payments/verify` (which validates the Razorpay HMAC) — this route updates the Sales Order status in ERPNext.

```typescript
// src/app/api/orders/confirm-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch, ERPNextError } from '@/lib/api/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('freshlife_auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = await erpnextFetch('/api/method/freshlife.api.checkout.confirm_payment', {
      method: 'POST',
      body,
      userToken: token,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ERPNextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
```

---

### 1.3 `api/magic-list/analyze-text/route.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`, `system_blueprint.md §6.2`

The spec defines **two separate routes** — one for text input and one for image input.
Currently, only a single combined `api/magic-list/analyze/route.ts` exists.
The split is required because the Gemini API call differs: text uses `generateContent` with a text part; image uses a multimodal request with a base64 inline data part.

```typescript
// src/app/api/magic-list/analyze-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('freshlife_auth')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  const model = 'gemini-2.0-flash-lite';

  const prompt = `Extract grocery items from this list as JSON.
Return: { "items": [{ "name": string, "qty": number, "unit": string }] }
List: ${text}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  const geminiData = await geminiRes.json();
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"items":[]}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };

  return NextResponse.json(parsed);
}
```

---

### 1.4 `api/magic-list/analyze-image/route.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`, `system_blueprint.md §6.2`

Handles base64-encoded images (handwritten lists, printed lists, photos) via Gemini multimodal API.
Images should be resized to max 1568px and compressed to < 5MB before upload (handled by `lib/utils/imageOptimize.ts`).

```typescript
// src/app/api/magic-list/analyze-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!cookieStore.get('freshlife_auth')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { imageBase64, mimeType = 'image/jpeg' } = await request.json();
  if (!imageBase64) {
    return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY!;
  const model = 'gemini-2.0-flash-lite';

  const prompt = `This is a grocery shopping list (photo/scan).
Extract all visible items as JSON.
Return: { "items": [{ "name": string, "qty": number, "unit": string }] }
If qty or unit is unclear, use 1 and "piece".`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
      }),
    }
  );

  const geminiData = await geminiRes.json();
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{"items":[]}';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };

  return NextResponse.json(parsed);
}
```

---

### 1.5 `api/magic-list/add-to-cart/route.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`, `system_blueprint.md §6.2`

Takes matched items from a Magic List analysis session and bulk-syncs them to the ERPNext cart.
Calls `freshlife.api.magic_list.add_magic_list_to_cart`.

```typescript
// src/app/api/magic-list/add-to-cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { erpnextFetch, ERPNextError } from '@/lib/api/client';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('freshlife_auth')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const data = await erpnextFetch('/api/method/freshlife.api.magic_list.add_magic_list_to_cart', {
      method: 'POST',
      body,
      userToken: token,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ERPNextError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to add magic list to cart' }, { status: 500 });
  }
}
```

---

### 1.6 `api/webhook/erpnext/route.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`

Handles inbound webhooks from ERPNext (e.g. order status updates, stock alerts).
Complements the existing `api/webhook/razorpay/route.ts`.
Should verify an `X-Frappe-Webhook-Secret` header before processing.

```typescript
// src/app/api/webhook/erpnext/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = process.env.ERPNEXT_WEBHOOK_SECRET;
  const incoming = request.headers.get('x-frappe-webhook-secret');

  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const payload = await request.json();
  const { doctype, name, event } = payload;

  // Handle known events
  switch (`${doctype}:${event}`) {
    case 'Sales Order:on_submit':
      // e.g. trigger notification
      break;
    case 'Delivery Note:on_submit':
      // e.g. mark order as dispatched
      break;
    default:
      // Unknown event — log and acknowledge
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 2. Missing Components

### 2.1 `components/product/OutOfStockBadge.tsx`

**Spec source:** `frontend_fulfillment_architecture.md §2 Components → product`, `system_blueprint.md §5.2`

Displays an "Out of Stock" indicator on `ProductCard` when `Bin.actual_qty <= 0`.
Feature #7 in the Feature Matrix: real-time stock check via Bin DocType.

```tsx
// src/components/product/OutOfStockBadge.tsx
'use client';
import styles from './OutOfStockBadge.module.css';

interface OutOfStockBadgeProps {
  className?: string;
}

export function OutOfStockBadge({ className }: OutOfStockBadgeProps) {
  return (
    <span className={`${styles.badge} ${className ?? ''}`} aria-label="Out of stock">
      Out of Stock
    </span>
  );
}
```

```css
/* src/components/product/OutOfStockBadge.module.css */
.badge {
  display: inline-block;
  background: var(--color-error-container);
  color: var(--color-error);
  font: var(--text-label-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  pointer-events: none;
  user-select: none;
}
```

---

### 2.2 `components/magic-list/InputMethodSelector.tsx`

**Spec source:** `frontend_fulfillment_architecture.md §2 Components → magic-list`, `§6.3 Magic List Analyzer screen`

Three-tab selector (✍️ Write / 📷 Photo / 📤 Upload) at the top of the Magic List page.
Controls which input mode (`TextListInput`, `CameraCapture`, or file input) is shown.

```tsx
// src/components/magic-list/InputMethodSelector.tsx
'use client';
import styles from './InputMethodSelector.module.css';

export type InputMethod = 'text' | 'camera' | 'upload';

interface InputMethodSelectorProps {
  selected: InputMethod;
  onChange: (method: InputMethod) => void;
}

const METHODS: { id: InputMethod; label: string; emoji: string }[] = [
  { id: 'text',   label: 'Write',  emoji: '✍️' },
  { id: 'camera', label: 'Photo',  emoji: '📷' },
  { id: 'upload', label: 'Upload', emoji: '📤' },
];

export function InputMethodSelector({ selected, onChange }: InputMethodSelectorProps) {
  return (
    <div className={styles.wrapper} role="tablist" aria-label="Input method">
      {METHODS.map(m => (
        <button
          key={m.id}
          role="tab"
          aria-selected={selected === m.id}
          className={`${styles.tab} ${selected === m.id ? styles.active : ''}`}
          onClick={() => onChange(m.id)}
        >
          <span className={styles.emoji}>{m.emoji}</span>
          <span className={styles.label}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
```

```css
/* src/components/magic-list/InputMethodSelector.module.css */
.wrapper {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--color-surface-container-low);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out-expo);
}

.tab.active {
  background: var(--color-surface-container-lowest);
  box-shadow: var(--shadow-sm);
}

.emoji { font-size: 1.5rem; }

.label {
  font: var(--text-label-md);
  color: var(--color-on-background);
}
```

---

### 2.3 `components/magic-list/TextListInput.tsx`

**Spec source:** `frontend_fulfillment_architecture.md §2 Components → magic-list`, `§6.3`

Free-text textarea where users type their grocery list (one item per line or comma-separated).
Includes the "✨ Analyze My List" primary CTA button.

```tsx
// src/components/magic-list/TextListInput.tsx
'use client';
import { useState } from 'react';
import styles from './TextListInput.module.css';

interface TextListInputProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
}

export function TextListInput({ onAnalyze, isLoading }: TextListInputProps) {
  const [value, setValue] = useState('');

  return (
    <div className={styles.wrapper}>
      <textarea
        className={styles.textarea}
        placeholder={'Type your grocery list here...\n\nTomatoes 2kg\nMilk 1L\nRice 5kg'}
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={8}
        disabled={isLoading}
        aria-label="Grocery list input"
        id="magic-list-text-input"
      />
      <button
        className={`btn-primary ${styles.analyzeBtn}`}
        onClick={() => onAnalyze(value)}
        disabled={isLoading || value.trim().length < 3}
      >
        {isLoading ? 'Analyzing...' : '✨ Analyze My List'}
      </button>
    </div>
  );
}
```

```css
/* src/components/magic-list/TextListInput.module.css */
.wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
}

.textarea {
  width: 100%;
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-lowest);
  border: none;
  font: var(--text-body-md);
  color: var(--color-on-background);
  resize: vertical;
  box-shadow: var(--shadow-sm);
}

.textarea:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.analyzeBtn {
  width: 100%;
  padding: var(--space-md);
  font: var(--text-label-lg);
}
```

---

### 2.4 `components/magic-list/CameraCapture.tsx`

**Spec source:** `frontend_fulfillment_architecture.md §2 Components → magic-list`, `system_blueprint.md §6.2`

Camera capture component for photographing handwritten grocery lists.
Uses the browser's `<input type="file" capture="environment">` for mobile camera access.
Images are resized via `lib/utils/imageOptimize.ts` before being sent to `analyze-image` API.

```tsx
// src/components/magic-list/CameraCapture.tsx
'use client';
import { useRef } from 'react';
import styles from './CameraCapture.module.css';
import { optimizeImage } from '@/lib/utils/imageOptimize';

interface CameraCaptureProps {
  mode: 'camera' | 'upload';
  onCapture: (base64: string, mimeType: string) => void;
  isLoading: boolean;
}

export function CameraCapture({ mode, onCapture, isLoading }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const optimized = await optimizeImage(file, { maxWidth: 1568, maxSizeKB: 4096 });
    onCapture(optimized.base64, optimized.mimeType);
  };

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={mode === 'camera' ? 'environment' : undefined}
        className={styles.hiddenInput}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        id="camera-capture-input"
      />
      <button
        className={`btn-primary ${styles.captureBtn}`}
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
      >
        {mode === 'camera' ? '📷 Take Photo' : '📤 Choose Image'}
      </button>
      <p className={styles.hint}>
        {mode === 'camera'
          ? 'Photograph your handwritten grocery list'
          : 'Upload a photo or scan of your list'}
      </p>
    </div>
  );
}
```

```css
/* src/components/magic-list/CameraCapture.module.css */
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-xl) var(--space-md);
}

.hiddenInput {
  display: none;
}

.captureBtn {
  width: 100%;
  max-width: 320px;
  padding: var(--space-md) var(--space-lg);
  font: var(--text-label-lg);
}

.hint {
  font: var(--text-body-sm);
  color: var(--color-on-surface-variant);
  text-align: center;
}
```

---

### 2.5 `components/account/ProfileHeader.tsx`

**Spec source:** `frontend_fulfillment_architecture.md §2 Components → account`, `system_blueprint.md §5.2`

Displays customer name, phone number, and an edit profile link at the top of the `/account` page.
Reads from `useAuthStore`.

```tsx
// src/components/account/ProfileHeader.tsx
'use client';
import styles from './ProfileHeader.module.css';
import { useAuthStore } from '@/lib/stores/authStore';

export function ProfileHeader() {
  const customer = useAuthStore(s => s.customer);

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatar} aria-hidden="true">
        {customer?.customer_name?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{customer?.customer_name ?? 'Guest'}</p>
        <p className={styles.phone}>{customer?.phone ?? ''}</p>
      </div>
    </div>
  );
}
```

```css
/* src/components/account/ProfileHeader.module.css */
.wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-md);
  background: var(--color-surface-container-lowest);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--gradient-primary);
  color: var(--color-on-primary);
  font: var(--text-display-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.name {
  font: var(--text-headline-md);
  color: var(--color-on-background);
  margin: 0;
}

.phone {
  font: var(--text-body-md);
  color: var(--color-on-surface-variant);
  margin: 0;
}
```

---

### 2.6 `components/account/MenuSection.tsx`

**Spec source:** `frontend_fulfillment_architecture.md §2 Components → account`, `system_blueprint.md §5.2`

Account navigation menu listing Orders, Addresses, Refunds, Support, and Membership links.
Used on the `/account` hub page.

```tsx
// src/components/account/MenuSection.tsx
'use client';
import Link from 'next/link';
import styles from './MenuSection.module.css';

interface MenuItem {
  href: string;
  icon: string;
  label: string;
  description: string;
}

const MENU_ITEMS: MenuItem[] = [
  { href: '/account/orders',     icon: '📦', label: 'My Orders',     description: 'Track and reorder' },
  { href: '/account/addresses',  icon: '📍', label: 'Addresses',     description: 'Manage delivery locations' },
  { href: '/account/membership', icon: '⭐', label: 'Membership',    description: 'Free delivery & discounts' },
  { href: '/account/refunds',    icon: '↩️', label: 'Refunds',       description: 'Track refund status' },
  { href: '/account/support',    icon: '💬', label: 'Support',       description: 'Get help with orders' },
];

interface MenuSectionProps {
  title?: string;
  items?: MenuItem[];
}

export function MenuSection({ title = 'Account', items = MENU_ITEMS }: MenuSectionProps) {
  return (
    <section className={styles.section}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <ul className={styles.list} role="list">
        {items.map(item => (
          <li key={item.href}>
            <Link href={item.href} className={styles.item}>
              <span className={styles.icon} aria-hidden="true">{item.icon}</span>
              <span className={styles.text}>
                <span className={styles.label}>{item.label}</span>
                <span className={styles.description}>{item.description}</span>
              </span>
              <span className={styles.chevron} aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

```css
/* src/components/account/MenuSection.module.css */
.section {
  padding: var(--space-md);
}

.title {
  font: var(--text-label-lg);
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 var(--space-sm);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-surface-container-lowest);
  text-decoration: none;
  transition: background var(--duration-fast) var(--ease-out-expo);
}

.item:hover,
.item:focus-visible {
  background: var(--color-surface-container);
}

.icon { font-size: 1.25rem; flex-shrink: 0; }

.text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font: var(--text-label-lg);
  color: var(--color-on-background);
}

.description {
  font: var(--text-body-sm);
  color: var(--color-on-surface-variant);
}

.chevron {
  font-size: 1.25rem;
  color: var(--color-on-surface-variant);
}
```

---

## 3. Missing Hook

### 3.1 `lib/hooks/useLocation.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Hooks`

Wraps the browser's Geolocation API + `locationStore`. Used by `Header.tsx` to display the
current delivery location and by `AddressForm.tsx` to auto-fill coordinates.

```typescript
// src/lib/hooks/useLocation.ts
'use client';
import { useLocationStore } from '@/lib/stores/locationStore';

export function useLocation() {
  const { currentLocation, setLocation, clearLocation } = useLocationStore();

  const requestGeolocation = (): Promise<GeolocationCoordinates> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos.coords),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    });
  };

  return {
    currentLocation,
    setLocation,
    clearLocation,
    requestGeolocation,
    hasLocation: currentLocation !== null,
  };
}
```

---

## 4. Missing Utility Files

### 4.1 `lib/utils/deliveryFee.ts`

**Spec source:** `frontend_fulfillment_architecture.md §7 Delivery Window Calculation Logic`

Calculates delivery fee based on cart subtotal, slot type, and membership status.
Referenced by `BillBreakdown.tsx` and `DeliverySlotPicker.tsx`.

```typescript
// src/lib/utils/deliveryFee.ts

export type SlotType = 'Express' | 'Scheduled' | 'Same Day';

interface DeliveryFeeParams {
  subtotal: number;
  slotType: SlotType;
  isMember: boolean;
  isStorePickup: boolean;
}

const FEE_CONFIG: Record<SlotType, { base: number; memberFreeAbove: number; nonMemberFreeAbove: number }> = {
  Express:    { base: 49, memberFreeAbove: 999,      nonMemberFreeAbove: Infinity },
  Scheduled:  { base: 29, memberFreeAbove: 500,      nonMemberFreeAbove: Infinity },
  'Same Day': { base: 19, memberFreeAbove: 500,      nonMemberFreeAbove: Infinity },
};

const MIN_ORDER_VALUE = 500;

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
  const freeAbove = params.isMember ? config.memberFreeAbove : config.nonMemberFreeAbove;
  const fee = params.subtotal >= freeAbove ? 0 : config.base;
  const remainingForFree = freeAbove - params.subtotal;

  const freeDeliveryMessage =
    fee > 0 && Number.isFinite(remainingForFree) && remainingForFree > 0
      ? `Add ₹${remainingForFree} more for free delivery`
      : null;

  return { fee, freeDeliveryMessage, minOrderMet };
}
```

---

### 4.2 `lib/utils/deliverySlots.ts`

**Spec source:** `frontend_fulfillment_architecture.md §7 Delivery Slot Availability Logic`

Client-side filtering of server-returned delivery slots — removes past time windows for today,
enforces express availability window, and filters fully-booked slots.

```typescript
// src/lib/utils/deliverySlots.ts

export interface DeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  type: 'Express' | 'Scheduled' | 'Same Day';
  fee: number;
  available: boolean;
  remainingCapacity: number;
}

export interface SlotAvailability {
  date: string;
  slots: DeliverySlot[];
}

function formatDateYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseTime(timeStr: string, baseDate: Date): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Filters delivery slots based on current time:
 * 1. Express — available only if current time + 15 min prep window allows it
 * 2. Scheduled — hide past time windows for today
 * 3. Capacity — hide slots at max capacity (remainingCapacity === 0)
 * 4. Returns only days that still have available slots
 */
export function filterAvailableSlots(
  serverSlots: SlotAvailability[],
  currentTime: Date = new Date()
): SlotAvailability[] {
  const todayStr = formatDateYMD(currentTime);

  return serverSlots
    .map(day => ({
      ...day,
      slots: day.slots.filter(slot => {
        if (!slot.available || slot.remainingCapacity === 0) return false;
        if (day.date === todayStr) {
          const slotEnd = parseTime(slot.endTime, currentTime);
          return slotEnd > currentTime;
        }
        return true;
      }),
    }))
    .filter(day => day.slots.length > 0);
}
```

---

## 5. Missing Page

### 5.1 `app/account/membership/page.tsx`

**Spec source:** `system_blueprint.md §5.1 Route Structure`, `frontend_fulfillment_architecture.md §2 Project Structure`

Route: `/account/membership` — Membership plan page (🔒 Protected).
Feature #23 in the Feature Matrix: shows current plan tier, benefits, and upgrade CTA.
Backed by the `[CUSTOM_DOCTYPE]` Membership Plan DocType.

```tsx
// src/app/account/membership/page.tsx
import type { Metadata } from 'next';
import styles from './page.module.css';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Membership — FreshLife',
  description: 'View your FreshLife membership plan and benefits',
};

export default function MembershipPage() {
  return (
    <AuthGuard>
      <main className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Membership</h1>
        </header>

        <section className={styles.currentPlan}>
          <p className={styles.planLabel}>Your current plan</p>
          <h2 className={styles.planName}>Free</h2>
        </section>

        <section className={styles.plans}>
          <div className={styles.planCard}>
            <div className={styles.planBadge}>FreshLife Plus</div>
            <ul className={styles.benefits}>
              <li>Free delivery on orders above ₹500</li>
              <li>5% cashback on every order</li>
              <li>Priority customer support</li>
              <li>Early access to new products</li>
            </ul>
            <button className="btn-primary" style={{ width: '100%' }}>
              Upgrade — ₹199/month
            </button>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
```

```css
/* src/app/account/membership/page.module.css */
.page {
  min-height: 100vh;
  background: var(--color-surface);
  padding-bottom: calc(var(--bottom-nav-height) + var(--space-lg));
}

.header {
  padding: var(--space-lg) var(--space-md) var(--space-md);
  background: var(--color-surface-container-lowest);
}

.title {
  font: var(--text-display-sm);
  color: var(--color-on-background);
  margin: 0;
}

.currentPlan {
  padding: var(--space-lg) var(--space-md);
  background: var(--gradient-primary);
  color: var(--color-on-primary);
}

.planLabel {
  font: var(--text-body-md);
  margin: 0 0 var(--space-xs);
  opacity: 0.85;
}

.planName {
  font: var(--text-display-md);
  margin: 0;
}

.plans {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.planCard {
  background: var(--color-surface-container-lowest);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.planBadge {
  font: var(--text-headline-sm);
  color: var(--color-primary);
}

.benefits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.benefits li {
  font: var(--text-body-md);
  color: var(--color-on-background);
  padding-left: var(--space-md);
  position: relative;
}

.benefits li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: 700;
}
```

---

## 6. Naming Deviation (Not Blocking)

### 6.1 `lib/api/magicList.ts` vs spec `lib/api/magic-list.ts`

**Spec source:** `frontend_fulfillment_architecture.md §2 Project Structure`

The spec lists the file as `lib/api/magic-list.ts` (kebab-case, matching all other API files).
The actual file is `lib/api/magicList.ts` (camelCase).

**Impact:** Low — functionality is present. Imports in hooks and pages that reference
`@/lib/api/magicList` will work, but any new file following the spec will expect the kebab-case name.

**Recommended action:** Rename `magicList.ts` → `magic-list.ts` and update all imports,
or document this deviation as an accepted project convention.

---

## 7. Environment File

### 7.1 `.env.local.example`

**Spec source:** `frontend_fulfillment_architecture.md §12 Environment Variables`, `system_blueprint.md §10.2`

An `.env.local.example` file (committed to git, safe placeholder values) is missing from the
`storefront/` directory. It is required for onboarding new developers and for Railway deployment setup.

```env
# storefront/.env.local.example

# ── ERPNext Connection (server-side only — NEVER expose to client) ──
ERPNEXT_URL=https://erp.yoursite.app
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here

# ── Razorpay ──
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# ── Google Gemini AI (Magic List) ──
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Google Maps ──
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── MSG91 SMS OTP ──
MSG91_AUTH_KEY=xxxxxxxxxxxxxxxxxxxxxx
MSG91_TEMPLATE_ID=xxxxxxxxxxxxxxxxxxxxxx

# ── ERPNext Webhook (optional) ──
ERPNEXT_WEBHOOK_SECRET=your_erpnext_webhook_secret

# ── App Config ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MIN_ORDER_VALUE=500
```

---

## 8. Implementation Priority Order

Work through items in this order to preserve functional dependencies:

| # | File | Blocks |
|---|------|--------|
| 1 | `lib/utils/deliveryFee.ts` | `BillBreakdown.tsx`, `DeliverySlotPicker.tsx` |
| 2 | `lib/utils/deliverySlots.ts` | `DeliverySlotPicker.tsx` |
| 3 | `lib/hooks/useLocation.ts` | `Header.tsx`, `AddressForm.tsx` |
| 4 | `components/product/OutOfStockBadge.tsx` | `ProductCard.tsx` |
| 5 | `components/magic-list/TextListInput.tsx` | `magic-list/page.tsx` |
| 6 | `components/magic-list/CameraCapture.tsx` | `magic-list/page.tsx` |
| 7 | `components/magic-list/InputMethodSelector.tsx` | `magic-list/page.tsx` |
| 8 | `components/account/ProfileHeader.tsx` | `account/page.tsx` |
| 9 | `components/account/MenuSection.tsx` | `account/page.tsx` |
| 10 | `api/magic-list/analyze-text/route.ts` | `useMagicList.ts` |
| 11 | `api/magic-list/analyze-image/route.ts` | `useMagicList.ts` |
| 12 | `api/magic-list/add-to-cart/route.ts` | `AddAllToCart.tsx` |
| 13 | `api/orders/create/route.ts` | `PlaceOrderButton.tsx` |
| 14 | `api/orders/confirm-payment/route.ts` | `PlaceOrderButton.tsx` |
| 15 | `api/webhook/erpnext/route.ts` | ERPNext event handling |
| 16 | `app/account/membership/page.tsx` | `MenuSection.tsx` link |
| 17 | `storefront/.env.local.example` | Developer onboarding |

---

## 9. Documentation

The storefront has no developer-facing documentation beyond the default Next.js boilerplate `README.md`.
The items below cover every documentation artifact that should exist alongside the code, ordered from most critical to nice-to-have.

---

### 9.1 Storefront `README.md` (replace boilerplate)

**Current state:** `storefront/README.md` contains only the default `create-next-app` boilerplate.
**Required state:** Project-specific README that lets a new developer go from zero to running in under 10 minutes.

**Sections to include:**

```markdown
# FreshLife Storefront

Next.js 16 (App Router) storefront for the FreshLife omnichannel supermarket app.
Swiggy Instamart feature parity + AI Magic List.

## Tech stack
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19 + CSS Modules (Organic Brutalism design system)
- **State:** Zustand 5 (cart, auth, location, UI) + TanStack Query 5 (server state)
- **Payments:** Razorpay Standard Checkout
- **AI:** Google Gemini (Magic List text + image analysis)
- **Maps:** Google Maps JS API (address autocomplete + pin-drop)
- **Auth:** Phone + OTP via MSG91 → HTTP-only cookie `freshlife_auth`

## Prerequisites
- Node.js 20 LTS
- A running ERPNext v15/v16 instance with the `freshlife` custom app installed
- API keys: Razorpay, Google Gemini, Google Maps, MSG91

## Getting started

\`\`\`bash
cp .env.local.example .env.local
# Fill in all values in .env.local

npm install
npm run dev          # http://localhost:3000
\`\`\`

## Available commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript type-check |

## Project structure

\`\`\`
src/
├── app/           # Next.js App Router pages + API routes (BFF)
├── components/    # React components (layout / home / product / cart / auth / magic-list / account / ui)
├── lib/
│   ├── api/       # ERPNext fetch wrappers (server-side only)
│   ├── hooks/     # TanStack Query + custom hooks
│   ├── stores/    # Zustand stores (cart, auth, location, ui)
│   ├── types/     # Shared TypeScript types
│   └── utils/     # Pure utility functions
└── middleware.ts  # Route protection (auth guard)
\`\`\`

## Architecture

All ERPNext calls are made server-side through Next.js Route Handlers (`src/app/api/**`).
The client never touches ERPNext directly — only `/api/*` endpoints.
See `../system_blueprint.md` for the full architecture document.

## Deployment

See `../railway_deployment_guide.md` for Railway deployment instructions.
```

---

### 9.2 JSDoc for Utility Functions

All functions in `lib/utils/` are pure and reusable across multiple components. They need JSDoc so that
IDEs show inline documentation and future developers understand the business rules baked in.

**`lib/utils/formatCurrency.ts`** — add JSDoc:

```typescript
/**
 * Formats a number as Indian Rupee currency string.
 *
 * @param amount - The amount in rupees (not paise).
 * @param options - Optional Intl.NumberFormat options override.
 * @returns Formatted string, e.g. "₹1,23,456.00"
 *
 * @example
 * formatCurrency(1234.5)  // "₹1,234.50"
 * formatCurrency(0)       // "₹0.00"
 */
export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions): string { ... }
```

**`lib/utils/formatDate.ts`** — add JSDoc:

```typescript
/**
 * Formats a date string or Date object for display in the FreshLife UI.
 *
 * @param date - ISO 8601 string, Unix timestamp (ms), or Date object.
 * @param format - 'short' (e.g. "6 Apr") | 'long' (e.g. "6 April 2026") | 'time' (e.g. "9:00 AM")
 * @returns Human-readable date string in en-IN locale.
 */
export function formatDate(date: string | number | Date, format?: 'short' | 'long' | 'time'): string { ... }
```

**`lib/utils/imageOptimize.ts`** — add JSDoc:

```typescript
/**
 * Resizes and compresses an image File for the Magic List upload pipeline.
 * Gemini API limit: inline data must be < 5 MB.
 *
 * @param file - The raw File object from an <input type="file"> or camera capture.
 * @param options.maxWidth - Maximum dimension in px. Default: 1568 (Gemini recommended max).
 * @param options.maxSizeKB - Target max file size in KB. Default: 4096 (4 MB).
 * @returns Promise resolving to { base64: string, mimeType: string, widthPx: number, heightPx: number }
 *
 * @example
 * const { base64, mimeType } = await optimizeImage(file);
 * // base64 is ready to pass to POST /api/magic-list/analyze-image
 */
export async function optimizeImage(
  file: File,
  options?: { maxWidth?: number; maxSizeKB?: number }
): Promise<{ base64: string; mimeType: string; widthPx: number; heightPx: number }> { ... }
```

**`lib/utils/validators.ts`** — add JSDoc:

```typescript
/**
 * Validates an Indian mobile number.
 * Accepts 10-digit numbers with optional +91 or 0 prefix.
 *
 * @param phone - Raw phone string from the PhoneInput component.
 * @returns true if valid Indian mobile number.
 *
 * @example
 * isValidPhone('9876543210')   // true
 * isValidPhone('+919876543210') // true
 * isValidPhone('12345')         // false
 */
export function isValidPhone(phone: string): boolean { ... }

/**
 * Validates a 6-digit OTP string.
 *
 * @param otp - The OTP value from OTPInput (digits only).
 * @returns true if exactly 6 numeric digits.
 */
export function isValidOTP(otp: string): boolean { ... }
```

**`lib/utils/deliveryFee.ts`** (new file — see §4.1) — add JSDoc:

```typescript
/**
 * Calculates the delivery fee for an order.
 *
 * Business rules (per system_blueprint.md §7):
 * - Express (10 min):  ₹49, free above ₹999 for members
 * - Scheduled:         ₹29, free above ₹500 for members
 * - Same Day:          ₹19, free above ₹500 for members
 * - Store Pickup:      always ₹0
 * - Minimum order:     ₹500 required for delivery
 *
 * @param params.subtotal      - Cart subtotal in rupees (before fee/tax).
 * @param params.slotType      - Selected delivery slot type.
 * @param params.isMember      - Whether the customer has an active membership plan.
 * @param params.isStorePickup - Whether the customer chose store pickup.
 * @returns Object with fee (₹), optional freeDeliveryMessage, and minOrderMet flag.
 */
export function calculateDeliveryFee(params: DeliveryFeeParams): { ... } { ... }
```

---

### 9.3 JSDoc for Custom Hooks

Each hook in `lib/hooks/` should have a one-paragraph description, a `@returns` note, and at least one `@example` showing how it's consumed in a component.

**Pattern to follow for every hook:**

```typescript
/**
 * [One sentence: what the hook does and why it exists]
 *
 * Fetches data from `POST /api/<endpoint>` via TanStack Query.
 * All server state is cached for <N> minutes; set `staleTime` accordingly.
 *
 * @param [param] - [description, if the hook accepts arguments]
 * @returns {
 *   data:      [shape] — [description],
 *   isLoading: boolean — true during initial fetch,
 *   isError:   boolean — true if the request failed,
 *   [actions]: [description of mutation functions]
 * }
 *
 * @example
 * // Inside a Server or Client component:
 * const { data: products, isLoading } = useProducts({ category: 'fruits' });
 */
```

Hooks requiring documentation:

| Hook file | What to document |
|-----------|-----------------|
| `useAuth.ts` | OTP flow steps, `login()` / `logout()` return shapes, redirect behaviour |
| `useCart.ts` | Optimistic update pattern, debounced server sync, `syncWithServer` timing |
| `useProducts.ts` | TanStack Query key structure, `staleTime` value, search vs. category usage |
| `useOrders.ts` | `reorder()` stock-check behaviour, pagination shape |
| `useMagicList.ts` | State machine (`idle → analyzing → results_ready → adding_to_cart`), image size limit |
| `useDelivery.ts` | Slot availability caching strategy, Express cutoff logic |
| `useAddresses.ts` | Add / update / delete mutation patterns |
| `useLocation.ts` *(new)* | Geolocation permission flow, fallback when denied |

---

### 9.4 JSDoc for Zustand Stores

Zustand stores should have a top-level comment explaining ownership, and each action should have an inline comment explaining side-effects.

**`lib/stores/cartStore.ts`:**

```typescript
/**
 * Cart store — source of truth for all in-progress cart state.
 *
 * Persisted to localStorage under key `freshlife-cart`.
 * Persisted fields: items, couponCode.
 * Non-persisted fields: deliveryFee, lastSynced (reset on page load).
 *
 * Server sync: `syncWithServer()` is called with 500 ms debounce after
 * every addItem / updateQuantity / removeItem to keep ERPNext in sync.
 * Cart is the optimistic source — ERPNext is the canonical source.
 *
 * @see useMagicList — bulk adds items via addMagicListItems()
 * @see PlaceOrderButton — reads items + couponCode before order creation
 */
```

**`lib/stores/authStore.ts`:**

```typescript
/**
 * Auth store — tracks OTP flow state and authenticated customer session.
 *
 * Persisted to localStorage under key `freshlife-auth`.
 * Persisted fields: token, customer, isAuthenticated.
 * Non-persisted fields: otpSent, otpPhone, otpExpiresAt (reset on page load).
 *
 * The `token` field mirrors the value in the HTTP-only cookie `freshlife_auth`
 * set by `/api/auth/verify-otp`. The cookie is the authoritative auth signal
 * for server-side middleware; the store drives client-side UI state only.
 */
```

---

### 9.5 API Route Request / Response Contracts

Each `src/app/api/**/route.ts` file is missing an inline comment block describing its
HTTP contract. This is important because the BFF routes are the only API surface exposed
to client components.

**Standard header block to add to every route file:**

```typescript
/**
 * [METHOD] /api/[path]
 *
 * [One sentence description]
 *
 * Auth: [None | HTTP-only cookie `freshlife_auth` required]
 *
 * Request body / query params:
 *   [field]: [type] — [description]
 *
 * Response 200:
 *   [field]: [type] — [description]
 *
 * Response 4xx/5xx:
 *   { error: string }
 *
 * ERPNext method: [frappe.whitelist method path or native DocType endpoint]
 */
```

**Routes that need this contract header added (all 19 existing + 6 new):**

| Route | Method | Auth | Notes |
|-------|--------|------|-------|
| `auth/send-otp` | POST | None | Rate-limited: 3 req / 10 min per phone |
| `auth/verify-otp` | POST | None | Sets `freshlife_auth` HTTP-only cookie |
| `auth/session` | GET | Cookie | Returns current customer from cookie |
| `products/homepage` | GET | None | Cached 5 min (`s-maxage=300`) |
| `products/category` | GET | None | `?slug=&warehouse=` query params |
| `products/[itemCode]` | GET | None | `stale-while-revalidate=600` |
| `products/search` | GET | None | `?q=` — rate-limited 30 req/min |
| `cart/sync` | POST | Cookie | Optimistic — returns updated prices |
| `cart/coupon` | POST | Cookie | Validates + returns discount amount |
| `cart/bill` | POST | Cookie | Full bill summary including tax |
| `delivery/slots` | GET | Cookie | `?warehouse=&date=` |
| `delivery/pickup` | GET | Cookie | Store pickup availability |
| `orders/create` | POST | Cookie | Creates ERPNext Sales Order |
| `orders/confirm-payment` | POST | Cookie | Updates Sales Order payment status |
| `orders/history` | GET | Cookie | Paginated, `?page=&limit=` |
| `orders/reorder` | POST | Cookie | Stock-checks before re-adding to cart |
| `magic-list/analyze-text` | POST | Cookie | Rate-limited: 10 req/hr per user |
| `magic-list/analyze-image` | POST | Cookie | Max body size 5 MB; rate-limited 10/hr |
| `magic-list/add-to-cart` | POST | Cookie | Bulk cart sync |
| `payments/create-order` | POST | Cookie | Returns Razorpay `order_id` |
| `payments/verify` | POST | Cookie | HMAC SHA-256 signature check |
| `account/profile` | GET / PUT | Cookie | |
| `account/addresses` | GET / POST / DELETE | Cookie | |
| `account/refunds` | GET | Cookie | |
| `account/support` | GET / POST | Cookie | |
| `webhook/razorpay` | POST | None | Signature verified via `X-Razorpay-Signature` |
| `webhook/erpnext` | POST | None | Verified via `X-Frappe-Webhook-Secret` |
| `health` | GET | None | Returns `{ ok: true, timestamp }` |

---

### 9.6 Component Prop Documentation

Every exported React component prop interface should have JSDoc on each field so that
IDE tooltips surface usage guidance without opening the source file.

**Pattern:**

```typescript
interface ProductCardProps {
  /** ERPNext Item DocType `name` field — used as the unique cart key. */
  item_code: string;

  /** Display name for the product. Rendered with `--text-headline-sm`. */
  item_name: string;

  /**
   * Selling price in rupees (after all Pricing Rules applied).
   * Formatted with `formatCurrency()` in the PriceBlock sub-component.
   */
  rate: number;

  /**
   * MRP before discount. Shown as strikethrough when `rate < mrp`.
   * Pass `undefined` to hide the MRP/discount display entirely.
   */
  mrp?: number;

  /** CDN URL for the primary product image. Falls back to a placeholder SVG. */
  image?: string;

  /** When true, renders `<OutOfStockBadge>` and disables the Add button. */
  in_stock: boolean;

  /** `custom_freshness_category` value — if set, renders the `<FreshnessPulse>` chip. */
  freshness_category?: string;
}
```

**Components that require prop documentation added:**

| Component | Key props to document |
|-----------|----------------------|
| `ProductCard` | `item_code`, `rate`, `mrp`, `in_stock`, `freshness_category` |
| `ProductGallery` | `images[]`, `altText`, swipe behaviour note |
| `VariantSelector` | `variants[]`, `selectedCode`, `onChange` |
| `CartItemRow` | `item`, `onQuantityChange`, `onRemove` |
| `DeliverySlotPicker` | `slots`, `selectedId`, `onChange`, filtering note |
| `PlaceOrderButton` | `grandTotal`, `deliverySlot`, `isStorePickup` minimum order rule |
| `AuthGuard` | `children`, redirect behaviour when unauthenticated |
| `CameraCapture` | `mode` (`camera` vs `upload`), image size constraint |
| `Modal` | `isOpen`, `onClose`, glassmorphism overlay behaviour |
| `Toast` | `message`, `type`, auto-dismiss timing |
| `PullToRefresh` | `onRefresh`, threshold distance, disabled on desktop |

---

### 9.7 TypeScript Type Documentation

All types in `lib/types/` should have a top-level comment explaining what ERPNext DocType or
external API they map to, so developers know where the shape comes from.

**Pattern for each type file:**

```typescript
/**
 * Product types — mapped from ERPNext `Item` DocType.
 *
 * Native fields: item_code, item_name, description, stock_uom
 * Custom fields added by freshlife app: custom_brand_name, custom_nutritional_info,
 *   custom_freshness_category, custom_search_keywords, custom_website_images
 *
 * @see backend_database_architecture.md §3 — Item DocType custom fields
 * @see GET /api/products/[itemCode]
 */

/**
 * Cart types — client-side only (Zustand cartStore).
 * Not a 1:1 mapping to any ERPNext DocType;
 * synced to ERPNext via POST /api/cart/sync.
 */

/**
 * Order types — mapped from ERPNext `Sales Order` DocType.
 * Custom fields: custom_razorpay_order_id, custom_payment_status,
 *   custom_delivery_slot, custom_coupon_code, custom_delivery_fee
 */

/**
 * Auth types — returned by POST /api/auth/verify-otp.
 * The `token` is the ERPNext user API token stored in an HTTP-only cookie.
 */

/**
 * Delivery types — mapped from the `Delivery Slot` Custom DocType.
 * @see backend_database_architecture.md §4.2 — Delivery Slot DocType
 */

/**
 * Magic List types — shapes for the AI grocery-list analysis pipeline.
 * Input: user text or image → Gemini API → extracted items → ERPNext matching.
 * @see system_blueprint.md §6.2 — Magic List AI flow
 */

/**
 * Account types — mapped from ERPNext `Customer`, `Address`,
 * `Refund Tracker`, and `Support Ticket` DocTypes.
 */
```

---

### 9.8 Documentation Summary Table

| # | Artifact | Location | Status |
|---|----------|----------|--------|
| 9.1 | Storefront README | `storefront/README.md` | ❌ Boilerplate only |
| 9.2 | Utility JSDoc | `lib/utils/*.ts` | ❌ No comments |
| 9.3 | Hook JSDoc | `lib/hooks/*.ts` | ❌ No comments |
| 9.4 | Store JSDoc | `lib/stores/*.ts` | ❌ No comments |
| 9.5 | API route contracts | `app/api/**/route.ts` | ❌ No comments |
| 9.6 | Component prop JSDoc | `components/**/*.tsx` | ❌ No comments |
| 9.7 | Type file comments | `lib/types/*.ts` | ❌ No comments |

> **Writing order:** 9.1 → 9.5 → 9.7 → 9.2 → 9.3 → 9.4 → 9.6
> (README first so newcomers can onboard; API contracts before type docs so shapes are clear;
> implementation-level JSDoc last since it requires the final code to be stable.)

---

---

## 10. Railway Deployment Documentation

The FreshLife storefront is deployed on **Railway.app** — not Vercel.
This section documents everything that must be in place in the storefront codebase itself
to support a Railway deployment, and cross-references `railway_deployment_guide.md` for the
full platform-level setup.

> **Full platform guide:** `railway_deployment_guide.md`
> (covers MariaDB, Redis, ERPNext services, env variable references, troubleshooting, and pricing)

---

### 10.1 Required `next.config.ts` Changes

Railway builds the storefront as a standalone Node.js container using **Railpack** (zero-config).
Without `output: "standalone"`, the container will be oversized and may fail to start.

**Current state:** `storefront/next.config.ts` does not include `output: "standalone"`.
**Required state:**

```typescript
// storefront/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // ← REQUIRED: tells Next.js to bundle only the needed files
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'erp.freshlife.app',  // ERPNext image CDN
      },
    ],
  },
};

export default nextConfig;
```

> **Why standalone?** Railway runs Next.js as a plain Node process (`node server.js`), not via
> the Next.js dev server. The `standalone` output copies only the required dependencies into
> `.next/standalone/`, keeping the container under ~200 MB.

---

### 10.2 Health Check Endpoint

Railway performs HTTP health checks before marking a deployment as live.
Without a `200 OK` health endpoint, Railway will restart the container indefinitely.

**File:** `src/app/api/health/route.ts` *(missing — see §1)*

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
```

**Railway configuration (service → Settings → Health Check):**

| Setting | Value |
|---------|-------|
| Path | `/api/health` |
| Timeout | 30 s |
| Interval | 60 s |

---

### 10.3 Environment Variables

All secrets are set in the Railway dashboard (service → Variables tab).
**Never commit `.env.local` to the repository.**

The `.env.local.example` file (see §7) is the authoritative list of required variables.
Below is the Railway-specific variable configuration — note how inter-service URLs
use Railway's internal reference syntax (`${{service.VAR}}`) to avoid public internet hops.

#### Storefront Service Variables

| Variable | Value in Railway | Notes |
|----------|-----------------|-------|
| `ERPNEXT_URL` | `http://${{erpnext-app.RAILWAY_PRIVATE_DOMAIN}}:8000` | Internal network — free bandwidth, ~1 ms latency |
| `ERPNEXT_API_KEY` | *(manual)* | Generated in ERPNext Desk → User → API Access |
| `ERPNEXT_API_SECRET` | *(manual)* | Same as above |
| `RAZORPAY_KEY_ID` | *(manual)* | Server-side only |
| `RAZORPAY_KEY_SECRET` | *(manual)* | Server-side only |
| `RAZORPAY_WEBHOOK_SECRET` | *(manual)* | Used in `api/webhook/razorpay/route.ts` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | *(manual)* | Client-side — safe to expose (public key) |
| `GEMINI_API_KEY` | *(manual)* | Server-side only — Magic List AI |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | *(manual)* | Client-side — restrict to your domain in GCP Console |
| `MSG91_AUTH_KEY` | *(manual)* | Server-side only |
| `MSG91_TEMPLATE_ID` | *(manual)* | Server-side only |
| `NEXT_PUBLIC_APP_URL` | `https://www.freshlife.app` | Used for absolute URL generation |
| `NEXT_PUBLIC_MIN_ORDER_VALUE` | `500` | Minimum cart value in rupees |

> **Security note:** Variables without the `NEXT_PUBLIC_` prefix are server-side only and
> are never included in the client bundle. All ERPNext credentials and API secrets must
> omit the `NEXT_PUBLIC_` prefix. See `lib/api/client.ts` for the server-side fetch wrapper.

---

### 10.4 Custom Domain & Networking

| Item | Value | Where to configure |
|------|-------|--------------------|
| Primary domain | `www.freshlife.app` | Railway → service → Settings → Networking → Custom Domain |
| CNAME target | `<service-name>.railway.app` | DNS provider (Cloudflare/Route 53) |
| ERPNext domain | `erp.freshlife.app` | Railway → `erpnext-app` service → Custom Domain |
| Internal comms | `${{erpnext-app.RAILWAY_PRIVATE_DOMAIN}}` | Used in `ERPNEXT_URL` — bypasses public internet |

**DNS record (add at your DNS provider):**

```
Type   Name    Value
CNAME  www     <storefront-service>.railway.app
CNAME  erp     <erpnext-service>.railway.app
```

> Railway automatically provisions TLS certificates (Let's Encrypt) for custom domains.
> No manual certificate management is required.

---

### 10.5 Webhook Configuration

Two webhook routes must be reachable from external services post-deployment.

#### Razorpay → Storefront

Configure in **Razorpay Dashboard → Settings → Webhooks**:

| Setting | Value |
|---------|-------|
| URL | `https://www.freshlife.app/api/webhook/razorpay` |
| Secret | Same value as `RAZORPAY_WEBHOOK_SECRET` env variable |
| Events to subscribe | `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`, `order.paid` |

The handler at `src/app/api/webhook/razorpay/route.ts` verifies the `X-Razorpay-Signature`
header using HMAC SHA-256 before processing any event.

#### ERPNext → Storefront

Configure in **ERPNext Desk → Settings → Webhook**:

| Setting | Value |
|---------|-------|
| DocType | `Sales Order` |
| Webhook Event | `on_update` |
| URL | `https://www.freshlife.app/api/webhook/erpnext` |
| Header | `X-Frappe-Webhook-Secret: <ERPNEXT_WEBHOOK_SECRET>` |

The handler at `src/app/api/webhook/erpnext/route.ts` (missing — see §1.6) verifies this header.

---

### 10.6 Deployment Checklist

Use this checklist before every production deploy:

```
Pre-deploy
  [ ] next.config.ts has output: "standalone"
  [ ] All env variables set in Railway dashboard (no placeholder values)
  [ ] ERPNEXT_URL points to internal Railway domain (not the public erp.freshlife.app URL)
  [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY restricted to www.freshlife.app in GCP Console
  [ ] Razorpay keys are live keys (not test keys)

Code
  [ ] npm run build passes locally (cd storefront && npm run build)
  [ ] npx tsc --noEmit reports 0 errors
  [ ] api/health/route.ts exists and returns 200

Railway dashboard
  [ ] Health check path set to /api/health
  [ ] Custom domain www.freshlife.app attached with valid TLS
  [ ] ERPNext service has persistent volume on /home/frappe/frappe-bench/sites
  [ ] Razorpay webhook URL updated if domain changed

Post-deploy
  [ ] GET https://www.freshlife.app/api/health → { ok: true }
  [ ] Login flow (OTP) works end-to-end
  [ ] Add-to-cart and checkout flow works end-to-end
  [ ] Test Razorpay webhook: send a test event from Razorpay dashboard
```

---

### 10.7 CI/CD with GitHub Actions (optional)

Railway auto-deploys on every push to the connected GitHub branch.
To add a build + type-check gate before Railway picks up the commit, create
`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: storefront

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: storefront/package-lock.json

      - run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          # Provide dummy values so the build doesn't fail on missing env vars
          ERPNEXT_URL: http://localhost:8000
          ERPNEXT_API_KEY: ci
          ERPNEXT_API_SECRET: ci
          RAZORPAY_KEY_ID: rzp_test_ci
          RAZORPAY_KEY_SECRET: ci
          RAZORPAY_WEBHOOK_SECRET: ci
          NEXT_PUBLIC_RAZORPAY_KEY_ID: rzp_test_ci
          GEMINI_API_KEY: ci
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ci
          MSG91_AUTH_KEY: ci
          MSG91_TEMPLATE_ID: ci
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          NEXT_PUBLIC_MIN_ORDER_VALUE: "500"
```

> Railway will still auto-deploy after the workflow passes. If you want Railway to deploy
> **only** on CI success, enable **"Wait for CI"** in Railway → project → Settings → Deploy.

---

### 10.8 Railway Deployment Summary

| Item | Status | Action required |
|------|--------|----------------|
| `next.config.ts` `output: "standalone"` | ❌ Missing | Add to `storefront/next.config.ts` |
| `api/health/route.ts` | ❌ Missing | Create (see §10.2) |
| `.env.local.example` | ❌ Missing | Create (see §7) |
| Railway health check path | ❌ Not configured | Set `/api/health` in Railway dashboard |
| Razorpay webhook | ❌ Not configured | Set URL + events in Razorpay dashboard |
| ERPNext webhook | ❌ Not configured | Set URL + secret in ERPNext Desk |
| `api/webhook/erpnext/route.ts` | ❌ Missing | Create (see §1.6) |
| Custom domain DNS | ⚠️ Verify | Confirm CNAME records are live |
| GitHub Actions CI | ⚠️ Optional | Add `.github/workflows/ci.yml` |

> **Full Railway platform setup** (MariaDB, Redis, ERPNext services, volumes, pricing):
> see `railway_deployment_guide.md`

---

> **End of Gap Analysis**
> All items above are specified in the architecture documentation but absent from `storefront/src/`.
> No existing files were modified — this document is additive only.
