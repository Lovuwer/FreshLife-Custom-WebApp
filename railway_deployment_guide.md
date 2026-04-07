# FreshLife — Railway Deployment Guide
## Complete Setup & Deployment Documentation

> **Platform:** Railway.app
> **Services:** 4 (Next.js Storefront, ERPNext, MariaDB, Redis)
> **Target Region:** `asia-southeast` (closest to Mumbai/India)
> **Estimated Setup Time:** 2-3 hours

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Railway Project Setup](#2-railway-project-setup)
3. [Service 1: MariaDB Database](#3-service-1-mariadb-database)
4. [Service 2: Redis Cache](#4-service-2-redis-cache)
5. [Service 3: ERPNext Backend](#5-service-3-erpnext-backend)
6. [Service 4: Next.js Storefront](#6-service-4-nextjs-storefront)
7. [Post-Deployment Configuration](#7-post-deployment-configuration)
8. [Admin Dashboard Access](#8-admin-dashboard-access)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### Accounts Required
| Service | Signup URL | Purpose |
|---------|-----------|---------|
| **Railway** | https://railway.app | Hosting platform |
| **GitHub** | https://github.com | Code repository (Railway deploys from GitHub) |
| **Razorpay** | https://dashboard.razorpay.com | Payment processing |
| **Google Cloud** | https://console.cloud.google.com | Gemini API + Maps API |
| **MSG91** | https://msg91.com | SMS OTP delivery |

### API Keys to Obtain Before Starting
- [ ] **Razorpay:** `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (Settings → API Keys)
- [ ] **Google AI Studio:** `GEMINI_API_KEY` (https://aistudio.google.com/apikey)
- [ ] **Google Maps:** `GOOGLE_MAPS_API_KEY` (Google Cloud Console → APIs → Maps JS + Places + Geocoding)
- [ ] **MSG91:** `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` (Dashboard → Authkey/Templates)

### Local Tools
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

---

## 2. Railway Project Setup

### Step 1: Create Railway Project

1. Go to **https://railway.app/dashboard**
2. Click **"+ New Project"**
3. Select **"Empty Project"**
4. Name it: `freshlife-prod`

### Step 2: Set Project Region

1. In project settings, set region to **`asia-southeast`** (Singapore — closest Railway region to India)

> **Note:** Railway does not have a Mumbai region yet. Singapore provides the lowest latency for Indian users (~30ms vs ~200ms for US regions).

---

## 3. Service 1: MariaDB Database

### Deploy

1. In your Railway project, click **"+ New"** → **"Database"** → **"MariaDB"**
2. Railway auto-provisions the database and generates connection details

### Note The Connection Variables

Railway auto-creates these variables (used by ERPNext):
```
MYSQL_HOST=<auto>
MYSQL_PORT=3306
MYSQL_DATABASE=railway
MYSQL_USER=root
MYSQL_PASSWORD=<auto>
MARIADB_URL=mysql://root:<password>@<host>:<port>/railway
```

### Configure for ERPNext

After provisioning, enter the Railway shell for the MariaDB service and set the character set:
```sql
ALTER DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4. Service 2: Redis Cache

### Deploy

1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Railway auto-provisions Redis

### Note The Connection Variables

```
REDIS_HOST=<auto>
REDIS_PORT=6379
REDIS_PASSWORD=<auto>
REDIS_URL=redis://default:<password>@<host>:<port>
```

---

## 5. Service 3: ERPNext Backend

### Step 1: Prepare the GitHub Repository

Create a repo `freshlife-erpnext` with the following structure:

```
freshlife-erpnext/
├── Dockerfile
├── supervisord.conf
├── entrypoint.sh
└── README.md
```

### Step 2: Create the Dockerfile

```dockerfile
FROM frappe/bench:latest

USER frappe
WORKDIR /home/frappe

# Initialize bench with Frappe v15
RUN bench init --frappe-branch version-15 frappe-bench --skip-redis-config-generation

WORKDIR /home/frappe/frappe-bench

# Install ERPNext
RUN bench get-app erpnext --branch version-15

# Install custom FreshLife app
RUN bench get-app freshlife https://github.com/your-org/freshlife.git

# Install Supervisor for multi-process management
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

```ini
[supervisord]
nodaemon=true
logfile=/tmp/supervisord.log

[program:frappe-web]
command=bench serve --port %(ENV_PORT)s
directory=/home/frappe/frappe-bench
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:frappe-worker-default]
command=bench worker --queue default
directory=/home/frappe/frappe-bench
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:frappe-worker-short]
command=bench worker --queue short
directory=/home/frappe/frappe-bench
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0

[program:frappe-schedule]
command=bench schedule
directory=/home/frappe/frappe-bench
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
```

### Step 4: Create entrypoint.sh

```bash
#!/bin/bash
set -e

cd /home/frappe/frappe-bench

# Configure site to use Railway MariaDB and Redis
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

# Create site if it doesn't exist
if [ ! -d "sites/freshlife.app" ]; then
  bench new-site freshlife.app \
    --db-host $DB_HOST \
    --db-port $DB_PORT \
    --db-name $DB_NAME \
    --db-password $DB_PASSWORD \
    --admin-password $ADMIN_PASSWORD \
    --install-app erpnext \
    --install-app freshlife \
    --set-default
fi

# Run migrations
bench --site freshlife.app migrate

# Start Supervisor (manages web + workers)
exec supervisord -c /etc/supervisord.conf
```

### Step 5: Deploy to Railway

1. Push the repo to GitHub
2. In Railway project: **"+ New"** → **"GitHub Repo"** → Select `freshlife-erpnext`
3. Railway detects the Dockerfile and builds automatically

### Step 6: Configure ERPNext Service Variables

In Railway dashboard → `erpnext-app` service → **Variables** tab:

```
# Database (reference MariaDB service)
DB_HOST=${{mariadb.MYSQL_HOST}}
DB_PORT=${{mariadb.MYSQL_PORT}}
DB_NAME=${{mariadb.MYSQL_DATABASE}}
DB_PASSWORD=${{mariadb.MYSQL_PASSWORD}}

# Redis (reference Redis service)
REDIS_HOST=${{redis.REDIS_HOST}}
REDIS_PORT=${{redis.REDIS_PORT}}
REDIS_PASSWORD=${{redis.REDIS_PASSWORD}}

# Admin
ADMIN_PASSWORD=your_secure_admin_password

# Port
PORT=8000
```

### Step 7: Attach Persistent Volume

1. Go to ERPNext service → **Settings** → **Volume**
2. Mount path: `/home/frappe/frappe-bench/sites`
3. Size: 10 GB (expandable later)

### Step 8: Generate ERPNext API Keys

After deploy, use Railway CLI to access the shell:
```bash
railway shell -s erpnext-app

# Inside the container:
cd /home/frappe/frappe-bench
bench --site freshlife.app set-config api_key YOUR_CHOSEN_KEY
bench --site freshlife.app set-config api_secret YOUR_CHOSEN_SECRET
```

Or generate via ERPNext Desk:
1. Login to `https://erp.freshlife.app`
2. Go to **User** → Your admin user → **API Access** → **Generate Keys**
3. Copy `api_key` and `api_secret`

---

## 6. Service 4: Next.js Storefront

### Step 1: Configure next.config.ts

**Critical:** Add `output: "standalone"` for Railway compatibility:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',  // ← REQUIRED for Railway (reduces container size)
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

### Step 2: Add Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Step 3: Deploy to Railway

1. Push the Next.js repo to GitHub
2. In Railway project: **"+ New"** → **"GitHub Repo"** → Select `freshlife-storefront`
3. Railway auto-detects Next.js via Railpack (zero-config build)

### Step 4: Set Environment Variables

In Railway dashboard → `nextjs-storefront` service → **Variables**:

```
# ERPNext — use Railway internal URL for low-latency
ERPNEXT_URL=http://${{erpnext-app.RAILWAY_PRIVATE_DOMAIN}}:8000
ERPNEXT_API_KEY=<from Step 5.8>
ERPNEXT_API_SECRET=<from Step 5.8>

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=<your_secret>
RAZORPAY_WEBHOOK_SECRET=<your_webhook_secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# Google Gemini AI (Magic List)
GEMINI_API_KEY=<your_gemini_key>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your_maps_key>

# SMS Gateway
MSG91_AUTH_KEY=<your_auth_key>
MSG91_TEMPLATE_ID=<your_template_id>

# App Config
NEXT_PUBLIC_APP_URL=https://www.freshlife.app
NEXT_PUBLIC_MIN_ORDER_VALUE=500
```

### Step 5: Generate Public Domain

1. Go to `nextjs-storefront` service → **Settings** → **Networking**
2. Click **"Generate Domain"** for a `*.railway.app` URL
3. Optionally add **Custom Domain**: `www.freshlife.app`
   - Add CNAME record pointing to Railway's domain

---

## 7. Post-Deployment Configuration

### 7.1 Configure Razorpay Webhooks

In Razorpay Dashboard → **Settings** → **Webhooks**:

| Setting | Value |
|---------|-------|
| URL | `https://www.freshlife.app/api/webhook/razorpay` |
| Secret | Same as `RAZORPAY_WEBHOOK_SECRET` |
| Events | `payment.captured`, `payment.failed`, `refund.processed`, `refund.failed`, `order.paid` |

### 7.2 Configure ERPNext Outbound Webhooks

In ERPNext Desk → **Settings** → **Webhook**:

**Webhook 1: Sales Order Status Change**
| Setting | Value |
|---------|-------|
| DocType | Sales Order |
| Event | on_update |
| URL | `https://www.freshlife.app/api/webhook/erpnext` |
| Headers | `{ "X-Webhook-Secret": "your_secret" }` |

### 7.3 Seed Initial Data

Use Railway CLI:
```bash
railway shell -s erpnext-app

cd /home/frappe/frappe-bench

# Create warehouses
bench --site freshlife.app execute freshlife.setup.create_warehouses

# Create delivery slot templates
bench --site freshlife.app execute freshlife.setup.create_delivery_slots

# Import sample products (optional)
bench --site freshlife.app import-csv /path/to/products.csv --doctype Item
```

---

## 8. Admin Dashboard Access

### ERPNext Desk (Built-in Admin UI)

ERPNext provides a complete admin dashboard out-of-the-box — **no custom admin panel needed**.

| Action | URL / Path |
|--------|-----------|
| **Login** | `https://erp.freshlife.app` |
| **Manage Products** | Setup → Item → Item List |
| **Manage Orders** | Selling → Sales Order |
| **View Inventory** | Stock → Stock Balance |
| **Create Coupons** | Accounting → Coupon Code |
| **Manage Delivery Slots** | FreshLife → Delivery Slot |
| **Manage Banners** | FreshLife → Banner |
| **View Support Tickets** | FreshLife → Support Ticket |
| **Process Refunds** | FreshLife → Refund Tracker |
| **Sales Reports** | Selling → Sales Analytics |
| **Stock Reports** | Stock → Stock Ledger |

### Default Admin Credentials
- **Username:** `Administrator`
- **Password:** The `ADMIN_PASSWORD` you set during deployment
- **Change immediately** after first login

---

## 9. Environment Variables Reference

### Next.js Service (All Variables)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `ERPNEXT_URL` | Server | ✅ | Internal Railway URL to ERPNext |
| `ERPNEXT_API_KEY` | Server | ✅ | ERPNext API authentication key |
| `ERPNEXT_API_SECRET` | Server | ✅ | ERPNext API authentication secret |
| `RAZORPAY_KEY_ID` | Server | ✅ | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Server | ✅ | Razorpay secret |
| `RAZORPAY_WEBHOOK_SECRET` | Server | ✅ | Razorpay webhook signature secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client | ✅ | Public Razorpay key for Checkout.js |
| `GEMINI_API_KEY` | Server | ✅ | Google Gemini API key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | ✅ | Google Maps JS API key |
| `MSG91_AUTH_KEY` | Server | ✅ | MSG91 SMS gateway key |
| `MSG91_TEMPLATE_ID` | Server | ✅ | MSG91 OTP template ID |
| `NEXT_PUBLIC_APP_URL` | Client | ✅ | Public app URL |
| `NEXT_PUBLIC_MIN_ORDER_VALUE` | Client | ✅ | Minimum order value (₹500) |

### ERPNext Service (All Variables)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DB_HOST` | Server | ✅ | MariaDB host (Railway ref) |
| `DB_PORT` | Server | ✅ | MariaDB port |
| `DB_NAME` | Server | ✅ | Database name |
| `DB_PASSWORD` | Server | ✅ | Database password |
| `REDIS_HOST` | Server | ✅ | Redis host (Railway ref) |
| `REDIS_PORT` | Server | ✅ | Redis port |
| `REDIS_PASSWORD` | Server | ✅ | Redis password |
| `ADMIN_PASSWORD` | Server | ✅ | ERPNext admin password |
| `PORT` | Server | ✅ | Service port (Railway auto-assigns) |

---

## 10. Troubleshooting

### ERPNext Not Starting

```bash
# Check logs
railway logs -s erpnext-app

# Common fix: database migrations
railway shell -s erpnext-app
cd /home/frappe/frappe-bench
bench --site freshlife.app migrate
```

### Next.js Build Failing

Ensure `output: "standalone"` is in `next.config.ts`. Railway's Railpack builder requires this for Next.js apps.

### MariaDB Character Set Issues

```bash
railway shell -s mariadb
mysql -u root -p
ALTER DATABASE railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Internal Service Communication

Services communicate via Railway's private network. Use `${{service-name.RAILWAY_PRIVATE_DOMAIN}}` syntax in env variables. Do **not** use public URLs for inter-service communication — use internal URLs for lower latency and zero bandwidth cost.

### Volume Data Loss

Ensure the ERPNext service has a **persistent volume** attached to `/home/frappe/frappe-bench/sites`. Without this, all site data (including the database config and uploaded files) is lost on redeploy.

### Railway Pricing

| Plan | Cost | Details |
|------|------|---------|
| Hobby | $5/month | 512 MB RAM per service, 8GB disk, ideal for dev/staging |
| Pro | $20/month + usage | Autoscaling, custom domains, team access, production-ready |

**Estimated monthly cost (Pro plan):**
~$40-60/month for 4 services (Next.js + ERPNext + MariaDB + Redis)

---

> **Deployment complete!** Your FreshLife supermarket is live on Railway.
> - **Storefront:** `https://www.freshlife.app`
> - **Admin Dashboard:** `https://erp.freshlife.app` (ERPNext Desk)
> - **Railway Dashboard:** `https://railway.app/project/<project-id>`
