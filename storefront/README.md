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

```bash
cp .env.local.example .env.local
# Fill in all values in .env.local

npm install
npm run dev          # http://localhost:3000
```

## Available commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npx tsc --noEmit` | TypeScript type-check |

## Project structure

```
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
```

## Architecture

All ERPNext calls are made server-side through Next.js Route Handlers (`src/app/api/**`).
The client never touches ERPNext directly — only `/api/*` endpoints.
See `../system_blueprint.md` for the full architecture document.

## Deployment

See `../railway_deployment_guide.md` for Railway deployment instructions.
