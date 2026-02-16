# AI Observability Platform - Complete Setup Guide

## Table of Contents

- [Part 1: Local Development Setup](#part-1-local-development-setup)
- [Part 2: SDK Installation & Usage](#part-2-sdk-installation--usage)
- [Part 3: Production Deployment](#part-3-production-deployment)

---

# Part 1: Local Development Setup

## Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **PostgreSQL** 15+ (local or cloud - you already have Neon configured)
- **Git**
- **npm** (comes with Node.js)

## Step 1: Clone & Install

```bash
git clone <your-repo-url>
cd logs

# Install all workspace dependencies (backend, frontend, admin, sdk)
npm install
```

## Step 2: Database Setup

You have two options for PostgreSQL:

### Option A: Use Neon (Cloud - Already Configured)

Your `.env` already points to a Neon database. No additional setup needed.

### Option B: Use Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   psql -U postgres
   CREATE DATABASE observeai;
   \q
   ```
3. Update `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/observeai
   ```

## Step 3: Configure Environment Variables

Edit `backend/.env`:

```env
# Database (already set if using Neon)
DATABASE_URL=postgresql://neondb_owner:your_password@your-host.neon.tech/neondb?sslmode=require

# Auth - CHANGE THIS to a random 32+ char string
JWT_SECRET=dev-secret-change-in-production

# Server
PORT=3001

# Frontend URLs (defaults for local dev)
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5174

# Stripe (optional for local dev - leave empty to skip payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_STARTER=
STRIPE_PRICE_ID_PRO=
```

## Step 4: Run Database Migrations

```bash
# Generate the Prisma client
npm run db:generate

# Push the schema to your database (creates all tables)
cd backend
npx prisma db push
cd ..
```

To verify your database is set up correctly:
```bash
npm run db:studio
```
This opens Prisma Studio at `http://localhost:5555` where you can browse all tables.

## Step 5: Create an Admin User

After tables are created, you need an admin user. Run this one-time script:

```bash
cd backend
npx tsx -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@observeai.com',
      passwordHash: hash,
      name: 'Admin',
      isAdmin: true,
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'active',
      monthlyRequestLimit: 999999999,
      projectLimit: 999,
    }
  });
  console.log('Admin created:', user.email);
}
main().catch(console.error).finally(() => prisma.\$disconnect());
"
cd ..
```

If the above doesn't work due to ESM issues, create a temporary file `backend/seed.ts`:

```typescript
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@observeai.com',
      passwordHash: hash,
      name: 'Admin',
      isAdmin: true,
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'active',
      monthlyRequestLimit: 999999999,
      projectLimit: 999,
    },
  });
  console.log('Admin created:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
cd backend && npx tsx seed.ts && cd ..
```

Delete the file after running.

## Step 6: Start All Services

Open **3 separate terminals**:

```bash
# Terminal 1 - Backend API (port 3001)
npm run dev:backend

# Terminal 2 - Frontend Dashboard (port 5173)
npm run dev:frontend

# Terminal 3 - Admin Panel (port 5174)
npm run dev:admin
```

## Step 7: Verify Everything Works

| Service           | URL                         | Login                              |
|-------------------|-----------------------------|------------------------------------|
| Frontend          | http://localhost:5173       | Register a new account             |
| Admin Panel       | http://localhost:5174       | admin@observeai.com / admin123456  |
| Backend API       | http://localhost:3001/api   | -                                  |
| Prisma Studio     | http://localhost:5555       | `npm run db:studio`                |

### Quick test flow:
1. Open http://localhost:5173 and register a new user
2. Log in and go to Dashboard
3. Go to Settings -> Create a project -> Copy the API key
4. Use the SDK (see Part 2) to send test data
5. Go back to Dashboard and see your logs appear

---

# Part 2: SDK Installation & Usage

The SDK intercepts your OpenAI/Anthropic API calls and logs them automatically.

## For Local Development (linking the SDK)

Since the SDK is part of this monorepo, you can use it directly in any test project:

### Method 1: npm link (Recommended for testing)

```bash
# Step 1: Build the SDK
npm run build:sdk

# Step 2: Create a global link
cd sdk
npm link
cd ..

# Step 3: In your test project, link it
cd /path/to/your-ai-project
npm link observeai-sdk
```

### Method 2: Direct path install

```bash
# In your test project:
npm install /path/to/logs/sdk
```

### Method 3: File reference in package.json

In your test project's `package.json`:
```json
{
  "dependencies": {
    "observeai-sdk": "file:../logs/sdk"
  }
}
```

Then run `npm install`.

## SDK Usage with OpenAI

```typescript
import OpenAI from 'openai';
import { wrapOpenAI } from 'observeai-sdk';

// 1. Create your normal OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Wrap it with ObserveAI
const observedOpenAI = wrapOpenAI(openai, {
  apiKey: 'YOUR_PROJECT_API_KEY',           // From dashboard Settings
  baseUrl: 'http://localhost:3001/api',      // Your backend URL
  debug: true,                               // Enable console logs
  metadata: {
    userId: 'user-123',                      // Optional: track by user
    sessionId: 'session-abc',                // Optional: group requests
    endpoint: '/api/chat',                   // Optional: label the source
    tags: ['production', 'chatbot'],         // Optional: custom tags
  },
});

// 3. Use it exactly like normal OpenAI - logs are sent automatically
const response = await observedOpenAI.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [{ role: 'user', content: 'Hello, world!' }],
});

console.log(response.choices[0].message.content);

// 4. On app shutdown, flush remaining logs
await observedOpenAI._observeai.shutdown();
```

## SDK Usage with Anthropic

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { wrapAnthropic } from 'observeai-sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const observedAnthropic = wrapAnthropic(anthropic, {
  apiKey: 'YOUR_PROJECT_API_KEY',
  baseUrl: 'http://localhost:3001/api',
  debug: true,
});

const response = await observedAnthropic.messages.create({
  model: 'claude-3-haiku-20240307',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.content[0].text);

await observedAnthropic._observeai.shutdown();
```

## Complete Test Script

Create a file `test-sdk.ts` anywhere on your system:

```typescript
import OpenAI from 'openai';
import { wrapOpenAI } from 'observeai-sdk';

async function main() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const observed = wrapOpenAI(openai, {
    apiKey: 'PASTE_YOUR_PROJECT_API_KEY_HERE',
    baseUrl: 'http://localhost:3001/api',
    debug: true,
  });

  // Make a few test calls
  for (let i = 0; i < 3; i++) {
    const res = await observed.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Test message ${i + 1}` }],
    });
    console.log(`Response ${i + 1}:`, res.choices[0].message.content?.slice(0, 50));
  }

  // Flush remaining logs
  await observed._observeai.shutdown();
  console.log('Done! Check your dashboard at http://localhost:5173');
}

main().catch(console.error);
```

Run it:
```bash
npx tsx test-sdk.ts
```

## SDK Configuration Options

| Option          | Type     | Default                      | Description                          |
|-----------------|----------|------------------------------|--------------------------------------|
| `apiKey`        | string   | **required**                 | Your project API key from dashboard  |
| `baseUrl`       | string   | `http://localhost:3001/api`  | Backend API URL                      |
| `batchSize`     | number   | `10`                         | Logs to accumulate before sending    |
| `flushInterval` | number   | `5000`                       | Ms between automatic flushes         |
| `debug`         | boolean  | `false`                      | Log SDK activity to console          |
| `enabled`       | boolean  | `true`                       | Set `false` to disable all logging   |
| `metadata`      | object   | `undefined`                  | Default userId, sessionId, tags      |

---

# Part 3: Production Deployment

## Architecture Overview

```
                    Vercel (Frontend)
                    observeai.com
                         |
Users -----> Vercel (Admin Panel)      ----->  Railway/Render (Backend API)
             admin.observeai.com                api.observeai.com
                                                      |
                                               Neon/Supabase (PostgreSQL)
```

## Step 1: Prepare Environment Variables

### Generate a Strong JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output - this is your production `JWT_SECRET`.

### Production Environment Variables (Backend)

```env
DATABASE_URL=postgresql://user:password@your-db-host/observeai?sslmode=require
JWT_SECRET=<64-char-random-hex-from-above>
PORT=3001
FRONTEND_URL=https://observeai.com
ADMIN_URL=https://admin.observeai.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
NODE_ENV=production
```

## Step 2: Database (Neon - Recommended)

You already have Neon configured. For production:

1. Go to [neon.tech](https://neon.tech) -> Your project
2. Create a **production branch** (separate from dev)
3. Copy the production connection string
4. Run migrations against production:
   ```bash
   DATABASE_URL="your-production-url" npx prisma db push
   ```

### Important: Create admin user in production
```bash
DATABASE_URL="your-production-url" npx tsx backend/seed.ts
```
Then **change the admin password** immediately via the admin panel.

## Step 3: Deploy Backend (Railway - Recommended)

### Option A: Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"** -> **"Deploy from GitHub Repo"**
3. Select your repository
4. Railway auto-detects the monorepo. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `node dist/server.js`
5. Go to **Variables** tab and add all production env vars
6. Railway gives you a URL like `backend-production-xxxx.up.railway.app`
7. Add a custom domain: `api.observeai.com` (optional)

### Option B: Render

1. Go to [render.com](https://render.com) -> New **Web Service**
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `node dist/server.js`
4. Add environment variables in the **Environment** tab
5. You get a URL like `your-app.onrender.com`

### Verify Backend Deployment

```bash
curl https://api.observeai.com/api/health
# Should return: {"status":"ok"}
```

## Step 4: Deploy Frontend (Vercel - Recommended)

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set **Framework Preset**: Vite
3. Set **Root Directory**: `frontend`
4. Add **Environment Variable**:
   ```
   VITE_API_URL=https://api.observeai.com
   ```
5. Click **Deploy**

### Update Frontend Axios Base URL

Before deploying, update `frontend/src/lib/axios.ts` to use the env variable:

The frontend Vite config has a proxy for `/api` in dev mode. For production, you need the API calls to go to your deployed backend. Check that your axios instance uses:

```typescript
const API_URL = import.meta.env.VITE_API_URL || '';
```

If the axios instance already uses relative URLs (like `/api/...`) and you have a proxy configured, you'll need to change it for production. There are two approaches:

**Approach A: Environment variable in axios** (Recommended)

In `frontend/src/lib/axios.ts`, ensure the `baseURL` is:
```typescript
baseURL: import.meta.env.VITE_API_URL || '/api'
```

Then set `VITE_API_URL=https://api.observeai.com/api` in Vercel.

**Approach B: Vercel Rewrites**

Add `frontend/vercel.json`:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.observeai.com/api/:path*" }
  ]
}
```

This proxies `/api/*` requests to your backend, so no code changes needed.

## Step 5: Deploy Admin Panel (Vercel)

Same process as frontend:

1. Create another Vercel project for the admin panel
2. Set **Root Directory**: `admin`
3. Add **Environment Variable**:
   ```
   VITE_API_URL=https://api.observeai.com
   ```
4. Apply the same axios base URL changes as frontend
5. Optionally add `admin/vercel.json` with rewrites (same as frontend)
6. Deploy

## Step 6: Stripe Setup (For Paid Subscriptions)

### Create Stripe Account & Products

1. Go to [stripe.com](https://stripe.com) and create an account
2. Go to **Products** -> **Add Product**:
   - **Starter Plan**: $19/month, recurring
   - **Pro Plan**: $49/month, recurring
3. Copy each product's **Price ID** (starts with `price_`)
4. Go to **Developers** -> **API Keys** -> Copy your **Secret Key** (`sk_live_...`)

### Set Up Stripe Webhook

1. Go to **Developers** -> **Webhooks** -> **Add Endpoint**
2. Set URL: `https://api.observeai.com/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the **Webhook Signing Secret** (`whsec_...`)

### Update Backend Env Vars

```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
STRIPE_PRICE_ID_STARTER=price_xxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxx
```

## Step 7: DNS & Custom Domains

If using custom domains, add these DNS records:

| Subdomain           | Type  | Value                                    |
|---------------------|-------|------------------------------------------|
| observeai.com       | CNAME | cname.vercel-dns.com                     |
| admin.observeai.com | CNAME | cname.vercel-dns.com                     |
| api.observeai.com   | CNAME | your-railway-or-render-domain            |

Then configure custom domains in each platform's dashboard.

## Step 8: Update CORS for Production

Your backend CORS is configured via env vars. Make sure the production `FRONTEND_URL` and `ADMIN_URL` match your actual deployed domains:

```env
FRONTEND_URL=https://observeai.com
ADMIN_URL=https://admin.observeai.com
```

## Step 9: Publish SDK to npm (Optional)

When ready to distribute the SDK publicly:

1. Update `sdk/package.json`:
   ```json
   {
     "name": "observeai-sdk",
     "version": "0.1.0",
     "private": false,
     ...
   }
   ```

2. Add a README to `sdk/README.md` with usage examples

3. Build and publish:
   ```bash
   cd sdk
   npm run build
   npm login
   npm publish
   ```

4. Users can then install with:
   ```bash
   npm install observeai-sdk
   ```

For production SDK usage, users just change the `baseUrl`:
```typescript
wrapOpenAI(openai, {
  apiKey: 'their-project-api-key',
  baseUrl: 'https://api.observeai.com/api',
});
```

---

## Production Checklist

### Security
- [ ] Change `JWT_SECRET` to a strong random 64+ character string
- [ ] Change admin password from `admin123456`
- [ ] Ensure `.env` is in `.gitignore` (already done)
- [ ] Enable HTTPS on all services (automatic on Vercel/Railway/Render)
- [ ] Verify CORS allows only your domains

### Database
- [ ] Neon/Supabase production branch created
- [ ] Schema pushed (`npx prisma db push`)
- [ ] Admin user created
- [ ] Connection uses `sslmode=require`
- [ ] Set up automated backups (Neon does this automatically)

### Backend
- [ ] All environment variables set in Railway/Render
- [ ] Health endpoint responding (`/api/health`)
- [ ] Rate limiting is active
- [ ] Compression enabled

### Frontend & Admin
- [ ] `VITE_API_URL` environment variable set in Vercel
- [ ] API calls reaching the backend correctly
- [ ] Login/register flow working
- [ ] Dashboard loading data

### Stripe (if enabling payments)
- [ ] Products created (Starter $19, Pro $49)
- [ ] Webhook endpoint configured and verified
- [ ] Test a checkout flow with Stripe test mode first (`sk_test_...`)
- [ ] Switch to live keys when ready

### Monitoring
- [ ] Check Railway/Render logs for errors
- [ ] Verify SDK log ingestion is working
- [ ] Test the full flow: register -> create project -> SDK sends logs -> dashboard shows data

---

## Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` is correct
- For Neon: ensure `?sslmode=require` is in the URL
- Run `npx prisma db push` if tables don't exist

### "CORS error" in browser
- Check `FRONTEND_URL` and `ADMIN_URL` in backend env match your actual URLs exactly
- No trailing slash (use `https://observeai.com` not `https://observeai.com/`)

### SDK logs not appearing in dashboard
- Enable `debug: true` in SDK config to see console output
- Check the `apiKey` matches a project in your database
- Verify the `baseUrl` points to the correct backend
- Check backend logs for any 401/403/429 errors

### "Rate limit exceeded" (429)
- API: 100 requests per 15 minutes per IP
- SDK: 1000 requests per minute per API key
- Auth: 10 login attempts per minute per IP
- Free tier: 10,000 requests per month

### Build fails in CI/CD
- Ensure `npx prisma generate` runs before `tsc` or `vite build`
- The backend build needs Prisma client generated first
