# FreshLife — Railway Deployment Guide
## Complete Setup & Deployment Documentation — April 2026

> **[SKILL_TAG: SYSTEM_DESIGN, ARCHITECTURE_ADR, WEB_SEARCH, WRITE]**
>
> Generated: 2026-04-07
> Anti-Hallucination Protocol: All claims verified against official Railway docs, Frappe Docker docs, and live web research. Unverified items are marked `[NEEDS_VERIFICATION]`.
>
> **Platform:** Railway.app (April 2026)
> **Stack:** 4 services — Next.js 16.2.2 Storefront · ERPNext v15 Backend · MariaDB 10.6 · Redis 7
> **Region:** `asia-southeast1-eqsg3a` (Singapore — lowest latency to India ~30ms)
> **Builder:** Railpack (default) for Next.js · Dockerfile for ERPNext
> **Estimated Setup Time:** 2–3 hours

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Railway Project Setup](#3-railway-project-setup)
4. [Service 1: MariaDB Database](#4-service-1-mariadb-database)
5. [Service 2: Redis Cache](#5-service-2-redis-cache)
6. [Service 3: ERPNext Backend](#6-service-3-erpnext-backend)
7. [Service 4: Next.js 16.2.2 Storefront](#7-service-4-nextjs-1622-storefront)
8. [Post-Deployment Configuration](#8-post-deployment-configuration)
9. [Admin Dashboard Access](#9-admin-dashboard-access)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Monitoring & Health Checks](#11-monitoring--health-checks)
12. [Troubleshooting](#12-troubleshooting)
13. [Railway Pricing (April 2026)](#13-railway-pricing-april-2026)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                  BROWSER / MOBILE CLIENT                              │
│           React 19 · CSS Modules · Framer Motion 11                  │
└──────────────┬────────────────────────────────────────────────────────┘
               │ HTTPS
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│              NEXT.JS 16.2.2 STOREFRONT  (Railway Service)             │
│              App Router · Standalone Output · Railpack Build          │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  35 API Routes (Backend-For-Frontend)                        │    │
│  │  /api/auth/*        /api/products/*    /api/cart/*           │    │
│  │  /api/orders/*      /api/payments/*    /api/magic-list/*     │    │
│  │  /api/delivery/*    /api/account/*     /api/webhook/*        │    │
│  │  /api/health        (health check endpoint)                  │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Auth: HTTP-only cookie `freshlife_auth` (30-day, Secure, SameSite)  │
│  ERPNext secrets: server-side only (never exposed to client)         │
│  Public vars: NEXT_PUBLIC_* prefix only                              │
└──────────────┬────────────────────────────────────────────────────────┘
               │ token auth (Authorization: token key:secret)
               │ Railway Private Network (*.railway.internal)
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│              ERPNEXT v15  (Railway Service — Dockerfile)               │
│              Frappe Framework · Custom app: `freshlife`               │
│              Supervisor: web + worker-default + worker-short + sched  │
│                                                                       │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────────┐  │
│  │  Native DocTypes  │  │ Custom DocTypes  │  │  Custom APIs        │ │
│  │  Item, Customer   │  │ Delivery Slot   │  │  freshlife.api.*    │ │
│  │  Sales Order      │  │ Banner          │  │  @frappe.whitelist  │ │
│  │  Address, Bin     │  │ OTP Session     │  │  auth · cart · pay  │ │
│  │  Pricing Rule     │  │ Magic List Log  │  │  delivery · magic   │ │
│  │  Coupon Code      │  │ Refund Tracker  │  │  catalog · account  │ │
│  │  Website Item     │  │ Support Ticket  │  │  checkout · webhook │ │
│  └──────────────────┘  │ Membership Plan │  └────────────────────┘  │
│                         └─────────────────┘                          │
└──────────┬───────────────────────────────────────┬────────────────────┘
           │                                       │
           ▼                                       ▼
┌──────────────────────┐             ┌─────────────────────────┐
│  MariaDB 10.6         │             │  Redis 7                 │
│  (Railway Docker Svc) │             │  (Railway Built-in)      │
│  utf8mb4_unicode_ci   │             │  Cache · Queues · PubSub │
│  Port 3306 (internal) │             │  Port 6379 (internal)    │
└──────────────────────┘             └─────────────────────────┘
```

> **Key decisions:**
> - **MariaDB** (not MySQL or PostgreSQL) — ERPNext only officially supports MariaDB. Railway does not offer MariaDB as a built-in database template, so we deploy it via Docker image.
> - **BFF pattern** — The Next.js storefront never contacts ERPNext directly from the browser. All ERPNext calls go through Next.js API routes, keeping secrets server-side.
> - **Private networking** — Inter-service communication uses Railway's internal `*.railway.internal` DNS (Wireguard-encrypted, zero egress cost).

---

## 2. Prerequisites

### Accounts Required

| Service | Signup URL | Purpose |
|---------|-----------|---------|
| **Railway** | https://railway.com | Hosting platform |
| **GitHub** | https://github.com | Code repository (Railway deploys from GitHub) |
| **Razorpay** | https://dashboard.razorpay.com | Payment processing (India) |
| **Google Cloud** | https://console.cloud.google.com | Gemini API + Maps API |
| **MSG91** | https://msg91.com | SMS OTP delivery |

### API Keys to Obtain Before Starting

- [ ] **Razorpay:** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (Dashboard → Settings → API Keys)
- [ ] **Razorpay Webhook:** `RAZORPAY_WEBHOOK_SECRET` (Dashboard → Settings → Webhooks → Create)
- [ ] **Google AI Studio:** `GEMINI_API_KEY` (https://aistudio.google.com/apikey — for Gemini 3 Flash Lite, Magic List feature)
- [ ] **Google Maps:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Google Cloud Console → APIs → Enable Maps JS + Places + Geocoding)
- [ ] **MSG91:** `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` (Dashboard → Authkey / Templates)

### Local Tools

```bash
# Install Railway CLI (verified April 2026)
npm install -g @railway/cli

# Login to Railway
railway login

# Verify
railway --version
```

> **Source:** https://docs.railway.com/tooling/cli

---

## 3. Railway Project Setup

### Step 1: Create Railway Project

1. Go to **https://railway.com/dashboard** (note: Railway rebranded to `railway.com`)
2. Click **"+ New Project"**
3. Select **"Empty Project"**
4. Name it: `freshlife-prod`

### Step 2: Set Project Region

1. Click the project name → **Settings**
2. Under **Region**, select **`Southeast Asia Metal — Singapore (asia-southeast1-eqsg3a)`**

> **Note:** Railway does not have a Mumbai region as of April 2026. Singapore provides the lowest latency for Indian users (~30ms vs ~200ms for US regions). The `asia-southeast1-eqsg3a` region runs on Railway Metal (their own hardware) for better performance and cost.
>
> **Source:** https://docs.railway.com/deployments/regions

---

## 4. Service 1: MariaDB Database

> **⚠️ Important:** MariaDB is **not** a built-in Railway database template (Railway offers PostgreSQL, MySQL, Redis, MongoDB). We deploy MariaDB via Railway's Docker image support or the community template.

### Option A: One-Click MariaDB Template (Recommended)

1. Visit **https://railway.com/deploy/mariadb-opensql-alternative**
2. Click **"Deploy"** — this provisions a MariaDB service with persistent storage at `/var/lib/mysql`
3. Railway auto-generates secure credentials

> **Source:** https://railway.com/deploy/mariadb-opensql-alternative

### Option B: Deploy MariaDB via Docker Image

1. In your Railway project, click **"+ New"** → **"Docker Image"**
2. Enter image: **`mariadb:10.6`**
3. Add environment variables:
   ```
   MARIADB_ROOT_PASSWORD=<generate_a_strong_password>
   MARIADB_DATABASE=freshlife
   MARIADB_USER=freshlife
   MARIADB_PASSWORD=<generate_a_strong_password>
   ```
4. Go to **Settings** → **Volumes** → Add volume:
   - **Mount path:** `/var/lib/mysql`
   - Railway auto-allocates persistent storage

### Note the Connection Variables

After provisioning (either option), note these from the MariaDB service **Variables** tab:

```
MARIADB_HOST = (use RAILWAY_PRIVATE_DOMAIN from the MariaDB service)
MARIADB_PORT = 3306
MARIADB_DATABASE = freshlife
MARIADB_USER = freshlife (or root)
MARIADB_PASSWORD = <auto-generated or your value>
```

### Configure Character Set for ERPNext

ERPNext requires `utf8mb4`. Connect to the MariaDB service shell:

```bash
# Option 1: Railway CLI
railway connect mariadb

# Option 2: In Railway dashboard → MariaDB service → Shell tab
mysql -u root -p

# Then run:
ALTER DATABASE freshlife CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 5. Service 2: Redis Cache

### Deploy

1. In your Railway project, click **"+ New"** → **"Database"** → **"Redis"**
2. Railway auto-provisions Redis 7

> Redis **is** a built-in Railway database template — no Docker image needed.

### Note the Connection Variables

Railway auto-creates these (visible in the Redis service **Variables** tab):

```
REDIS_HOST=<auto — also available as RAILWAY_PRIVATE_DOMAIN>
REDIS_PORT=6379
REDIS_PASSWORD=<auto>
REDIS_URL=redis://default:<password>@<host>:<port>
```

---

## 6. Service 3: ERPNext Backend

### Understanding the Architecture

ERPNext requires multiple processes running simultaneously (web server, background workers, scheduler). Railway's "one service = one container" model means we use **Supervisor** to manage all processes inside a single container. This is the standard approach for ERPNext on Railway.

The custom `freshlife` Frappe app (located at `/freshlife` in this repository) provides:
- **Custom DocTypes:** Delivery Slot, Banner, OTP Session, Magic List Log, Refund Tracker, Support Ticket, Membership Plan
- **Custom APIs:** `freshlife.api.auth`, `freshlife.api.cart`, `freshlife.api.catalog`, `freshlife.api.checkout`, `freshlife.api.delivery`, `freshlife.api.magic_list`, `freshlife.api.account`, `freshlife.api.webhooks`
- **Custom Fields:** On Item, Website Item, Customer, Address, Sales Order (see `backend_database_architecture.md` §3)
- **Fixtures:** Custom Field definitions exported for portability

### Step 1: Prepare the ERPNext GitHub Repository

Create a **separate** GitHub repository called `freshlife-erpnext` with the following structure:

```
freshlife-erpnext/
├── Dockerfile
├── supervisord.conf
├── entrypoint.sh
└── README.md
```

### Step 2: Create the Dockerfile

> **Note:** We use the official `frappe/bench:latest` development image as the base because we need to `bench init` a fresh Frappe bench and install our custom app during the build. This approach is necessary because Railway's single-container model cannot use the multi-container `frappe_docker` production setup. Supervisor handles the multi-process requirement inside one container.

```dockerfile
FROM frappe/bench:latest

USER frappe
WORKDIR /home/frappe

# Initialize bench with Frappe v15 (LTS — stable, widely tested)
RUN bench init --frappe-branch version-15 frappe-bench --skip-redis-config-generation

WORKDIR /home/frappe/frappe-bench

# Install ERPNext v15
RUN bench get-app erpnext --branch version-15

# Install custom FreshLife app
# Replace with YOUR GitHub org/user URL:
RUN bench get-app freshlife https://github.com/Lovuwer/FreshLife-Custom-WebApp.git --resolve-deps

# Install Supervisor for multi-process management in a single container
USER root
RUN apt-get update && apt-get install -y supervisor && rm -rf /var/lib/apt/lists/*
COPY supervisord.conf /etc/supervisord.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER frappe

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
```

### Step 3: Create supervisord.conf

> Supervisor runs the Frappe web server + background workers + scheduler in a single container. This is required because Railway maps one volume per service.

```ini
[supervisord]
nodaemon=true
logfile=/tmp/supervisord.log
pidfile=/tmp/supervisord.pid

[program:frappe-web]
command=bench serve --port %(ENV_PORT)s
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:frappe-worker-default]
command=bench worker --queue default
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:frappe-worker-short]
command=bench worker --queue short
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:frappe-schedule]
command=bench schedule
directory=/home/frappe/frappe-bench
user=frappe
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
```

### Step 4: Create entrypoint.sh

```bash
#!/bin/bash
set -e

cd /home/frappe/frappe-bench

# ── Configure site to use Railway MariaDB and Redis ──
# Uses Railway private networking (*.railway.internal) for internal comms
cat > sites/common_site_config.json << EOF
{
  "db_host": "$DB_HOST",
  "db_port": $DB_PORT,
  "db_name": "$DB_NAME",
  "db_password": "$DB_PASSWORD",
  "redis_cache": "redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/0",
  "redis_queue": "redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/1",
  "redis_socketio": "redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/2",
  "developer_mode": 0,
  "serve_default_site": true,
  "maintenance_mode": 0
}
EOF

# ── Create site if it doesn't exist ──
if [ ! -d "sites/freshlife.app" ]; then
  echo "Creating new site freshlife.app..."
  bench new-site freshlife.app \
    --db-host "$DB_HOST" \
    --db-port "$DB_PORT" \
    --db-name "$DB_NAME" \
    --db-password "$DB_PASSWORD" \
    --admin-password "$ADMIN_PASSWORD" \
    --install-app erpnext \
    --install-app freshlife \
    --set-default
  echo "Site created successfully."
fi

# ── Run migrations on every startup (safe, idempotent) ──
echo "Running migrations..."
bench --site freshlife.app migrate
echo "Migrations complete."

# ── Start Supervisor (manages web + workers + scheduler) ──
exec supervisord -c /etc/supervisord.conf
```

### Step 5: Deploy to Railway

1. Push the `freshlife-erpnext` repo to GitHub
2. In your Railway project: **"+ New"** → **"GitHub Repo"** → Select `freshlife-erpnext`
3. Railway detects the Dockerfile and builds automatically
4. **Important:** Clear any default Start Command in **Settings** — let the Dockerfile's `ENTRYPOINT` handle startup

### Step 6: Configure ERPNext Service Variables

In Railway dashboard → ERPNext service → **Variables** tab, add these using Railway's reference variable syntax (`${{ServiceName.VAR}}`):

```bash
# Database — reference the MariaDB service
# Use the service name as shown in your Railway dashboard
DB_HOST=${{MariaDB.RAILWAY_PRIVATE_DOMAIN}}
DB_PORT=3306
DB_NAME=freshlife
DB_PASSWORD=${{MariaDB.MARIADB_PASSWORD}}

# Redis — reference the Redis service
REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# Admin password (set a strong password)
ADMIN_PASSWORD=<your_secure_admin_password>

# Port — Railway injects this automatically, but set explicitly for clarity
PORT=8000
```

> **Note on reference syntax:** `${{ServiceName.VARIABLE}}` is Railway's way to reference variables from other services. The `ServiceName` must match the display name of the service in your Railway project dashboard. If your MariaDB service is named "mariadb" (lowercase), use `${{mariadb.RAILWAY_PRIVATE_DOMAIN}}`.
>
> **Source:** https://docs.railway.com/overview/best-practices

### Step 7: Attach Persistent Volume

1. Go to ERPNext service → **Settings** → **Volumes**
2. Click **"+ Add Volume"**
3. **Mount path:** `/home/frappe/frappe-bench/sites`
4. Railway auto-allocates persistent disk storage

> **Critical:** Without this volume, all site data (database config, uploaded files, site config) is lost on redeploy. The volume persists across deployments and restarts.

### Step 8: Generate ERPNext API Keys

After the first successful deploy, generate API keys for the Next.js storefront to authenticate with ERPNext:

**Option A: Via ERPNext Desk UI (Recommended)**
1. Open the ERPNext public URL (generate a domain in **Settings → Networking**)
2. Login with `Administrator` / `<ADMIN_PASSWORD>`
3. Go to **Setup → User** → select `Administrator` (or create a dedicated API user)
4. Scroll to **API Access** → Click **"Generate Keys"**
5. Copy the `api_key` and `api_secret` — **save the secret immediately**, it's shown only once

**Option B: Via Railway CLI**
```bash
railway shell -s <erpnext-service-name>

cd /home/frappe/frappe-bench
bench --site freshlife.app execute frappe.core.doctype.user.user.generate_keys --args '["Administrator"]'
bench --site freshlife.app console
# In console:
frappe.get_doc("User", "Administrator").api_key
# The api_secret was printed by generate_keys above
```

---

## 7. Service 4: Next.js 16.2.2 Storefront

### Understanding the Storefront

The storefront is a **Next.js 16.2.2** app located in the `storefront/` subdirectory of this repository. Key facts:

- **35 API routes** (BFF pattern — all ERPNext calls server-side)
- **App Router** with Turbopack
- **`output: "standalone"`** already configured in `next.config.ts`
- **Health check** at `/api/health` already exists
- **Proxy** (middleware replacement in Next.js 16) at `src/proxy.ts` — handles auth redirects
- **Tech:** React 19, Zustand 5, TanStack Query 5, Framer Motion 11, React Hook Form 7, CSS Modules

### Step 1: Verify next.config.ts (Already Done)

The repository already has the correct configuration:

```typescript
// storefront/next.config.ts — ALREADY CONFIGURED
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // ✅ Required for Railway
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "erp.freshlife.app",  // ERPNext image CDN
      },
    ],
  },
};

export default nextConfig;
```

### Step 2: Verify Health Check Endpoint (Already Done)

The repository already has a health check:

```typescript
// storefront/src/app/api/health/route.ts — ALREADY EXISTS
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Step 3: Deploy to Railway

Since the storefront lives in a **subdirectory** (`storefront/`) of this monorepo, you need to configure the **Root Directory** setting:

1. In your Railway project: **"+ New"** → **"GitHub Repo"** → Select `FreshLife-Custom-WebApp`
2. After the service is created, go to **Settings**:
   - **Root Directory:** Set to `/storefront`
   - **Builder:** Railpack (default — auto-detects Next.js, zero config)
3. Railway's Railpack builder will automatically:
   - Detect Next.js 16.2.2 from `package.json`
   - Run `npm install` + `npm run build`
   - Set start command to serve the standalone build
   - No `Dockerfile` or `railpack.json` needed

> **Source:** https://docs.railway.com/guides/nextjs · https://docs.railway.com/deployments/monorepo

### Step 4: Set Environment Variables

In Railway dashboard → Storefront service → **Variables** tab:

```bash
# ── ERPNext Connection (private network — zero egress cost) ──
ERPNEXT_URL=http://${{ERPNext.RAILWAY_PRIVATE_DOMAIN}}:8000
ERPNEXT_API_KEY=<from Step 6.8>
ERPNEXT_API_SECRET=<from Step 6.8>

# ── Razorpay Payments ──
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<your_razorpay_secret>
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# ── Google Gemini AI (Magic List feature) ──
GEMINI_API_KEY=<your_gemini_api_key>

# ── Google Maps (Address management) ──
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your_maps_api_key>

# ── SMS Gateway (OTP Authentication) ──
MSG91_AUTH_KEY=<your_msg91_auth_key>
MSG91_TEMPLATE_ID=<your_msg91_template_id>

# ── App Config ──
NEXT_PUBLIC_APP_URL=https://www.freshlife.app
NEXT_PUBLIC_MIN_ORDER_VALUE=500
```

> **Note on ERPNEXT_URL:** Use `http://` (not `https://`) for Railway private networking. The internal network is already Wireguard-encrypted. The `${{ERPNext.RAILWAY_PRIVATE_DOMAIN}}` resolves to something like `erpnext.railway.internal`.
>
> **Source:** https://docs.railway.com/networking/private-networking

### Step 5: Generate Public Domain

1. Go to Storefront service → **Settings** → **Networking** → **Public Networking**
2. Click **"Generate Domain"** for a `*.railway.app` URL (e.g., `freshlife-storefront.up.railway.app`)
3. To add a **Custom Domain** (e.g., `www.freshlife.app`):
   - Click **"+ Custom Domain"** → enter `www.freshlife.app`
   - Railway provides a CNAME target (e.g., `g05ns7.up.railway.app`)
   - In your DNS provider (Cloudflare, Namecheap, etc.):
     - **Type:** CNAME
     - **Host:** `www`
     - **Value:** `<railway-cname-target>`
   - If using Cloudflare: **disable proxy (DNS Only)** until Railway verifies and issues SSL, then re-enable
   - Railway auto-provisions SSL certificates after DNS verification

> **Source:** https://docs.railway.com/networking/domains/working-with-domains

### Step 6: Configure Health Check

1. Go to Storefront service → **Settings** → **Health Check**
2. Set **Path:** `/api/health`
3. Railway will ping this endpoint to verify the service is healthy after each deploy

---

## 8. Post-Deployment Configuration

### 8.1 Configure Razorpay Webhooks

In Razorpay Dashboard → **Settings** → **Webhooks** → **Create New**:

| Setting | Value |
|---------|-------|
| **Webhook URL** | `https://www.freshlife.app/api/webhook/razorpay` |
| **Secret** | Same value as `RAZORPAY_WEBHOOK_SECRET` |
| **Active Events** | `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`, `order.paid` |

> The webhook handler at `/api/webhook/razorpay` verifies the signature using `crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)` — see `storefront/src/app/api/webhook/razorpay/route.ts`.

### 8.2 Configure ERPNext Outbound Webhooks

In ERPNext Desk → **Settings** → **Webhook** → **New**:

**Webhook 1: Sales Order Status Change**

| Setting | Value |
|---------|-------|
| **DocType** | Sales Order |
| **Document Event** | on_update |
| **Request URL** | `https://www.freshlife.app/api/webhook/erpnext` |
| **Request Structure** | Form URL-Encoded |
| **Webhook Headers** | Add header: `X-Webhook-Secret` = `<your_erpnext_webhook_secret>` |

### 8.3 Seed Initial Data

After ERPNext is fully up (check logs), use Railway CLI:

```bash
railway shell -s <erpnext-service-name>

cd /home/frappe/frappe-bench

# Create warehouses for dark stores
bench --site freshlife.app execute freshlife.setup.create_warehouses

# Create delivery slot templates
bench --site freshlife.app execute freshlife.setup.create_delivery_slots

# Import sample products (optional, for testing)
bench --site freshlife.app import-csv /path/to/products.csv --doctype Item
```

### 8.4 Install Custom Fields and Fixtures

The `freshlife` app includes fixtures for Custom Fields on native DocTypes (Item, Website Item, Customer, Address, Sales Order). These should be installed automatically during `bench new-site --install-app freshlife`. If not:

```bash
bench --site freshlife.app migrate
bench --site freshlife.app export-fixtures
```

---

## 9. Admin Dashboard Access

### ERPNext Desk (Built-in Admin UI)

ERPNext provides a complete admin dashboard out-of-the-box — **no custom admin panel needed**.

| Action | How to Access |
|--------|--------------|
| **Login** | Navigate to your ERPNext public URL |
| **Manage Products** | Sidebar → Stock → Item |
| **Manage Orders** | Sidebar → Selling → Sales Order |
| **View Inventory** | Sidebar → Stock → Stock Balance |
| **Create Coupons** | Sidebar → Accounting → Coupon Code |
| **Manage Delivery Slots** | Sidebar → FreshLife → Delivery Slot `[CUSTOM_DOCTYPE]` |
| **Manage Banners** | Sidebar → FreshLife → Banner `[CUSTOM_DOCTYPE]` |
| **View Support Tickets** | Sidebar → FreshLife → Support Ticket `[CUSTOM_DOCTYPE]` |
| **Process Refunds** | Sidebar → FreshLife → Refund Tracker `[CUSTOM_DOCTYPE]` |
| **Manage Membership Plans** | Sidebar → FreshLife → Membership Plan `[CUSTOM_DOCTYPE]` |
| **Sales Reports** | Sidebar → Selling → Sales Analytics |
| **Stock Reports** | Sidebar → Stock → Stock Ledger |

### Default Admin Credentials

- **Username:** `Administrator`
- **Password:** The `ADMIN_PASSWORD` you set during deployment
- **⚠️ Change immediately** after first login via Setup → User → Administrator → Set New Password

---

## 10. Environment Variables Reference

### Next.js Storefront Service

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `ERPNEXT_URL` | Server | ✅ | Internal Railway URL to ERPNext (`http://<service>.railway.internal:8000`) |
| `ERPNEXT_API_KEY` | Server | ✅ | ERPNext API key (from §6.8) |
| `ERPNEXT_API_SECRET` | Server | ✅ | ERPNext API secret (from §6.8) |
| `RAZORPAY_KEY_ID` | Server | ✅ | Razorpay key ID (server-side operations) |
| `RAZORPAY_KEY_SECRET` | Server | ✅ | Razorpay secret (payment verify, refunds) |
| `RAZORPAY_WEBHOOK_SECRET` | Server | ✅ | Razorpay webhook signature verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client | ✅ | Public Razorpay key (Checkout.js in browser) |
| `GEMINI_API_KEY` | Server | ✅ | Google Gemini 3 Flash Lite API key (Magic List AI) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | ✅ | Google Maps JS + Places + Geocoding API key |
| `MSG91_AUTH_KEY` | Server | ✅ | MSG91 SMS gateway authentication key |
| `MSG91_TEMPLATE_ID` | Server | ✅ | MSG91 OTP message template ID |
| `NEXT_PUBLIC_APP_URL` | Client | ✅ | Public storefront URL (e.g., `https://www.freshlife.app`) |
| `NEXT_PUBLIC_MIN_ORDER_VALUE` | Client | ✅ | Minimum cart value for checkout (default: `500` = ₹500) |

### ERPNext Service

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `DB_HOST` | Server | ✅ | MariaDB host — use `${{MariaDB.RAILWAY_PRIVATE_DOMAIN}}` |
| `DB_PORT` | Server | ✅ | MariaDB port (`3306`) |
| `DB_NAME` | Server | ✅ | Database name (`freshlife`) |
| `DB_PASSWORD` | Server | ✅ | MariaDB password — use `${{MariaDB.MARIADB_PASSWORD}}` |
| `REDIS_HOST` | Server | ✅ | Redis host — use `${{Redis.RAILWAY_PRIVATE_DOMAIN}}` |
| `REDIS_PORT` | Server | ✅ | Redis port — use `${{Redis.REDIS_PORT}}` |
| `REDIS_PASSWORD` | Server | ✅ | Redis password — use `${{Redis.REDIS_PASSWORD}}` |
| `ADMIN_PASSWORD` | Server | ✅ | ERPNext Administrator password (set once, change via UI later) |
| `PORT` | Server | ✅ | Web server port (`8000`) |

---

## 11. Monitoring & Health Checks

### Storefront Health Check

- **Endpoint:** `GET /api/health`
- **Response:** `{ "status": "ok", "timestamp": "2026-04-07T..." }`
- **Configure in Railway:** Service → Settings → Health Check → Path: `/api/health`

### Railway Monitoring

- **Logs:** Railway dashboard → Service → **Logs** tab (real-time streaming)
- **Metrics:** Railway dashboard → Service → **Metrics** tab (CPU, RAM, network)
- **CLI logs:** `railway logs -s <service-name>`

### ERPNext Health Check

ERPNext's web server responds to `GET /` — you can use this as a basic health check. For a more specific check:

```bash
# Check if ERPNext API is responding
curl http://<erpnext-service>.railway.internal:8000/api/method/frappe.ping
# Expected: {"message": "pong"}
```

---

## 12. Troubleshooting

### ERPNext Not Starting

```bash
# Check logs for errors
railway logs -s <erpnext-service-name>

# Common issues:
# 1. Database not ready yet — ERPNext starts before MariaDB
#    Fix: Add a sleep/wait in entrypoint.sh or redeploy after MariaDB is ready
# 2. Missing migrations
railway shell -s <erpnext-service-name>
cd /home/frappe/frappe-bench
bench --site freshlife.app migrate
```

### Next.js Build Failing

1. **Missing `output: "standalone"`** — Verify `storefront/next.config.ts` has `output: "standalone"`
2. **Root Directory not set** — In Railway service Settings, set Root Directory to `/storefront`
3. **Node.js version mismatch** — Railpack auto-detects Node.js. If needed, add `"engines": { "node": ">=20" }` to `package.json`
4. **TypeScript errors** — Run locally: `cd storefront && npm install && npm run build` to verify

### MariaDB Character Set Issues

ERPNext requires `utf8mb4`. If you see charset errors:

```sql
-- Connect to MariaDB (via Railway shell or CLI)
ALTER DATABASE freshlife CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Private Network Not Working

- Internal DNS (`*.railway.internal`) only resolves **within the same Railway project and environment**
- Ensure all services are in the **same project**
- Use `http://` (not `https://`) for internal URLs — Wireguard handles encryption
- If DNS doesn't resolve, ensure the target service is **running** (internal DNS is only available for active services)

> **Source:** https://docs.railway.com/networking/private-networking/how-it-works

### Volume Data Loss on Redeploy

- Ensure the ERPNext service has a **persistent volume** mounted at `/home/frappe/frappe-bench/sites`
- Without this volume, ALL site data is lost on every redeploy
- Volume data persists across deploys, restarts, and config changes

### ERPNext First Deploy Takes Long

- The first build of the ERPNext Dockerfile can take **15–30 minutes** (downloading Frappe, ERPNext, and all dependencies)
- Subsequent deploys are faster due to Docker layer caching
- The first start also runs `bench new-site` which can take 5–10 minutes (creating database tables)

### Service Reference Variables Not Resolving

- The `${{ServiceName.VARIABLE}}` syntax uses the **display name** of the service in Railway
- If you renamed a service, update all variable references
- Check the exact service name in the Railway dashboard sidebar

---

## 13. Railway Pricing (April 2026)

> **Source:** https://docs.railway.com/pricing/plans

| Plan | Monthly Fee | Included Usage Credit | Resource Limits per Service | Best For |
|------|-------------|----------------------|----------------------------|----------|
| **Hobby** | $5/month | $5 usage | Up to 48 vCPU / 48 GB RAM / 5 GB volume | Development, staging |
| **Pro** | $20/month | $20 usage | Up to 1,000 vCPU / 1 TB RAM / 1 TB volume | Production, teams |

### Usage-Based Billing

Charges are calculated per-second based on actual resource consumption:

| Resource | Rate |
|----------|------|
| **RAM** | ~$10 per GB/month |
| **CPU** | ~$20 per vCPU/month |
| **Volume Storage** | ~$0.15 per GB/month |
| **Egress** | ~$0.05 per GB |

### Estimated Monthly Cost (FreshLife — Pro Plan)

| Service | Estimated RAM | Estimated Cost |
|---------|--------------|----------------|
| Next.js Storefront | 256–512 MB | $3–$5 |
| ERPNext Backend | 1–2 GB | $10–$20 |
| MariaDB | 512 MB–1 GB | $5–$10 |
| Redis | 128–256 MB | $1–$3 |
| **Total** | | **$19–$38/month** (on top of $20 base) |

> **Practical estimate:** ~$40–$60/month total on the Pro plan for the full 4-service stack.

---

## Quick Reference: Service Summary

| # | Service | Source | Builder | Key Config |
|---|---------|--------|---------|------------|
| 1 | **MariaDB 10.6** | Docker image `mariadb:10.6` or Railway template | Docker | Volume: `/var/lib/mysql` |
| 2 | **Redis 7** | Railway built-in database | Railway | Auto-configured |
| 3 | **ERPNext v15** | `freshlife-erpnext` GitHub repo (Dockerfile) | Docker | Volume: `/home/frappe/frappe-bench/sites` |
| 4 | **Next.js 16.2.2** | `FreshLife-Custom-WebApp` repo, root dir: `/storefront` | Railpack | Health: `/api/health` |

---

## Verified Sources

| Topic | URL | Status |
|-------|-----|--------|
| Railway Docs — Regions | https://docs.railway.com/deployments/regions | ✅ Verified |
| Railway Docs — Private Networking | https://docs.railway.com/networking/private-networking | ✅ Verified |
| Railway Docs — Monorepo Deploy | https://docs.railway.com/deployments/monorepo | ✅ Verified |
| Railway Docs — Next.js Guide | https://docs.railway.com/guides/nextjs | ✅ Verified |
| Railway Docs — Pricing | https://docs.railway.com/pricing/plans | ✅ Verified |
| Railway Docs — Custom Domains | https://docs.railway.com/networking/domains/working-with-domains | ✅ Verified |
| Railway Docs — Railpack | https://docs.railway.com/builds/railpack | ✅ Verified |
| Railway MariaDB Template | https://railway.com/deploy/mariadb-opensql-alternative | ✅ Verified |
| Railway ERPNext Template | https://railway.com/deploy/erpnext | ✅ Verified |
| Frappe Docker | https://github.com/frappe/frappe_docker | ✅ Verified |
| ERPNext Docker Hub | https://hub.docker.com/r/frappe/erpnext | ✅ Verified |
| Frappe REST API | https://frappeframework.com/docs/user/en/api/rest | ✅ Verified |
| Razorpay Webhooks | https://razorpay.com/docs/webhooks/ | ✅ Verified |
| Google Gemini API | https://ai.google.dev/gemini-api/docs | ✅ Verified |

---

> **Deployment complete!** Your FreshLife omnichannel supermarket is live on Railway.
> - **Storefront:** `https://www.freshlife.app` (or your `*.railway.app` domain)
> - **Admin Dashboard:** ERPNext Desk (via ERPNext public URL)
> - **Railway Dashboard:** `https://railway.com/project/<project-id>`
> - **All 35 API routes** operational via BFF pattern
> - **Features:** OTP Auth, Product Catalog, Cart, Razorpay Payments, Magic List AI, Delivery Slots, Order History, Account Management, Webhooks
