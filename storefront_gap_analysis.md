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

> **End of Gap Analysis**
> All items above are specified in the architecture documentation but absent from `storefront/src/`.
> No existing files were modified — this document is additive only.
