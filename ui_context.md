# Task 3: UI Context Ingestion Report
## [SKILL_TAG: STITCH_PROJECT, STITCH_SCREEN, DESIGN_HANDOFF, DESIGN_CRITIQUE]

> Source: Stitch Project "Remix of Smart Grocery Delivery" (ID: 1392489899897908649)
> Device: Mobile-first (390px viewport, @2x rendering at 780px)
> Design Philosophy: "Organic Brutalism" — High-End Editorial meets grocery delivery

---

## 1. Design System Summary

### Creative Direction: "The Organic Curator"
- Rejects "warehouse" grocery app feel in favor of editorial experience
- **Organic Brutalism**: High-contrast bold typography + soft layered surfaces
- Intentional asymmetry — product imagery "breaks the frame"
- Tonal depth instead of structural lines for information hierarchy

### Color Tokens (Material Design 3 Extended)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#006a2d` | CTAs, brand actions, gradient start |
| `primary_container` | `#6bff8f` | Scheduling CTAs, highlights |
| `primary_dim` | `#005d26` | Gradient end for CTAs |
| `surface` | `#f5f6f7` | Base background |
| `surface_container_low` | `#eff1f2` | Section backgrounds |
| `surface_container_lowest` | `#ffffff` | Interactive cards (max pop) |
| `on_background` | `#2c2f30` | Primary text (never use pure black) |
| `on_surface_variant` | `#595c5d` | Secondary text |
| `outline` | `#757778` | Borders (rare — prefer tonal shifts) |
| `outline_variant` | `#abadae` | Ghost borders at 15% opacity only |
| `error` | `#b02500` | Critical errors only |
| `tertiary` | `#006573` | Reliability features (tracking, history) |
| `secondary` | `#525c6d` | Secondary actions |
| `secondary_container` | `#d3ddf2` | Quantity selectors, utility controls |

### Typography System

| Role | Font | Usage |
|------|------|-------|
| Display/Headlines | Plus Jakarta Sans | Hero moments, category headers, editorial feel |
| Body/Labels | Inter | Product descriptions, technical data, delivery times |

### Critical Design Rules

1. **No-Line Rule**: No 1px solid borders for sectioning. Use background color shifts only.
2. **Glass & Gradient Rule**: Floating nav/overlays use 80% opacity + 20px backdrop-blur. Primary CTAs use linear gradient `primary → primary_dim`.
3. **Tonal Layering**: Depth via background shifts, not drop shadows. Cards: `surface_container_lowest` on `surface_container_low`.
4. **Anti-Divider**: Lists separated by 16px whitespace or alternating tones, never divider lines.
5. **No Pure Black**: All text uses `on_background` (#2c2f30).
6. **Roundness**: `ROUND_EIGHT` (0.75rem) for most elements. Search bars: `xl` (1.5rem). Quantity selectors: `full` (pill shape).

### Component Signatures

| Component | Style | Tokens |
|-----------|-------|--------|
| Primary Button | Rounded md, gradient fill | `primary → primary_dim`, text: `on_primary` |
| Secondary Button | Ghost, no fill | `outline` at 20%, text: `primary` |
| Scheduling CTA | Highlighted utility | `primary_container` bg, `on_primary_container` text |
| Product Card | No borders, image bleeds to top | `surface_container_lowest` bg |
| Search Bar | Organic pill shape | `xl` rounded, `surface_container_highest` bg |
| Quantity Selector | Pill shape | `full` rounded, `secondary_container` bg |
| Freshness Pulse | Animated chip on produce | `primary_fixed_dim` bg, subtle pulse animation |

---

## 2. Screen Inventory

### Screen 1: Home / Discovery
- **ID**: `041b73fa53d94775a814de23f2bbefdd`
- **Dimensions**: 780 x 5330px (mobile @2x, very tall — heavy scroll)
- **Key Sections** (inferred from height + design system):
  - Sticky header with location selector + search bar
  - Banner carousel (promotional)
  - Category grid/horizontal scroll
  - "Shop by Category" section
  - Product cards with instant +/- cart buttons
  - Featured/trending items section
  - "Freshness Pulse" chips on produce items
  - Bottom navigation bar (Home, Categories, Magic List, Cart, Account)

### Screen 2: Product Details
- **ID**: `77c981fe7b15480189bc69965faff617`
- **Dimensions**: 780 x 3540px
- **Key Sections**:
  - Product image gallery (image bleeds to edge per design rules)
  - Brand name + product title (Plus Jakarta Sans display)
  - Price block (MRP, discount, final price)
  - Unit/variant selector (weight options)
  - Add to Cart button (primary gradient CTA)
  - Product description
  - Nutritional information / brand details
  - "Similar Products" horizontal scroll
  - "Freshness Pulse" indicator if applicable

### Screen 3: AI Magic List Analyzer
- **ID**: `63562ed1012343d0a632f077c5fdf3be`
- **Dimensions**: 780 x 2624px
- **Key Sections**:
  - Header with back navigation
  - Input method selector (Text / Photo / Upload)
  - Text input area for typing grocery list
  - Camera/upload button for handwritten list photos
  - "Analyze" primary CTA button
  - Processing state (animation/loader)
  - Results list: matched products with images, names, prices
  - Unmatched items section with alternatives
  - "Add All to Cart" primary CTA
  - Individual item add/remove controls

### Screen 4: Cart & Checkout
- **ID**: `f21f67081ea145deb58958367a5512a9`
- **Dimensions**: 780 x 2908px
- **Key Sections**:
  - Cart items list with quantity +/- controls
  - Remove item button per row
  - Coupon code input + "Apply" button
  - Delivery instructions text field
  - Delivery slot selector (time slots grid)
  - Store Pickup toggle option
  - Bill breakdown (subtotal, delivery fee, taxes, discount, total)
  - Delivery address display with "Change" link
  - Payment method selector
  - "Place Order" primary gradient CTA (Razorpay)

### Screen 5: Authentication / Signup
- **ID**: `bc1b6ba20b104e87bb1f9dd674c03fc9`
- **Dimensions**: 780 x 1768px (shortest screen — focused flow)
- **Key Sections**:
  - App logo/branding
  - Phone number input with country code
  - "Send OTP" primary CTA
  - OTP input (4-6 digit boxes)
  - "Verify" button
  - Resend OTP timer/link
  - Terms & Conditions link
  - Auto-create ERPNext Customer on first login

### Screen 6: Account Options
- **ID**: `7ab342f4db4d47faa32afb1f7f743414`
- **Dimensions**: 780 x 3312px (comprehensive account hub)
- **Key Sections**:
  - Profile header (name, phone, edit profile link)
  - **Past Orders** — with reorder button (tertiary color per design rules)
  - **Manage Addresses** — list + add/edit via Google Maps Places API
  - **Saved Payments** — payment method management
  - **Refunds** — refund status tracking
  - **Customer Support** — help center / chat
  - **Offers & Rewards** — coupon wallet
  - **Settings** — notifications, language
  - **Logout** button

### Screen 7: Design System Reference
- **ID**: `assets-460104ae904e46dbb445eb287513f504-1775478759016`
- **Type**: Design System Instance (asset, not a screen)
- **Dimensions**: 960 x 540px
- **Content**: Visual reference card showing design tokens in action

---

## 3. Data Requirements Extracted from UI

### Per-Screen Data Dependencies

| Screen | Required Data from Backend |
|--------|---------------------------|
| Home / Discovery | Categories (Item Group), Featured Items, Banner content, User location, Cart state |
| Product Details | Item (full detail), Item Price, Stock levels, Related Items, Reviews |
| AI Magic List | User input (text/image), AI extraction results, Item search results, Stock availability |
| Cart & Checkout | Cart items + quantities, Pricing Rules, Coupon validation, Delivery slots, Addresses, Tax calculation |
| Auth / Signup | Phone verification, Customer creation/lookup, JWT tokens |
| Account Options | Customer profile, Sales Orders (history), Addresses, Payment methods, Refund status |

### Shared State Requirements
- **Persistent Cart**: Must survive page refreshes, accessible across all screens
- **Auth State**: JWT token, Customer ID, logged-in status
- **Location**: Delivery address / pincode for stock and delivery slot calculations
- **Real-time Stock**: Items must reflect current availability

---

## 4. Interaction Patterns Summary

| Pattern | Implementation |
|---------|---------------|
| Instant Cart +/- | Optimistic UI update, debounced API sync |
| OTP Flow | 2-step: phone → OTP → verify → JWT |
| Magic List Upload | Multi-modal: text input / camera capture / file upload |
| Delivery Slot Selection | Grid of time windows, disabled for past/full slots |
| Coupon Application | Inline validation against ERPNext Pricing Rules |
| Glassmorphism Overlays | Scheduling modals, floating cart summary |
| Pull-to-Refresh | Home screen product freshness |
| Skeleton Loading | All data-dependent sections |

---

*This document will be enriched with detailed component trees from HTML analysis when background agents complete.*
