# ObserveAI SDK — Complete Reference

> Drop-in observability for every LLM call your app makes. Install once, see everything.

---

## Table of Contents

1. [What is the ObserveAI SDK?](#1-what-is-the-observeai-sdk)
2. [How It Works](#2-how-it-works)
3. [Installation & Setup](#3-installation--setup)
4. [Quick Start](#4-quick-start)
5. [What Gets Logged](#5-what-gets-logged)
6. [Tool Call Tracking](#6-tool-call-tracking)
7. [Batching & Ingestion](#7-batching--ingestion)
8. [Authentication & API Keys](#8-authentication--api-keys)
9. [Usage Limits & Error Handling](#9-usage-limits--error-handling)
10. [Plan Requirements](#10-plan-requirements)
11. [Backend Ingestion Endpoint](#11-backend-ingestion-endpoint)
12. [Full Field Reference](#12-full-field-reference)

---

## 1. What is the ObserveAI SDK?

The ObserveAI SDK is a lightweight TypeScript/JavaScript client library that wraps your existing LLM API calls (OpenAI, Anthropic, etc.) and automatically sends structured logs to the ObserveAI platform. Once integrated, every prompt, response, cost, latency, error, and tool call is captured and visible in your dashboard — with zero changes to your application logic.

**What you get without any extra code:**
- Full request/response logs with timestamps
- Per-request cost calculated from token usage
- Latency tracking (ms)
- Error detection and classification
- Tool/function call recording
- Session and user-level grouping

---

## 2. How It Works

```
Your App Code
     │
     │  Makes LLM call (OpenAI / Anthropic / etc.)
     ▼
┌─────────────────────┐
│   ObserveAI SDK     │  ← Wraps your LLM client
│                     │
│  1. Forwards call   │──────────────────────────► LLM Provider API
│     to real API     │                                   │
│                     │◄──────────────────────────────────┘
│  2. Receives result │
│  3. Calculates cost │
│  4. Records latency │
│  5. Batches log     │
│  6. Sends async     │──────────────────────────► ObserveAI Backend
└─────────────────────┘                           POST /api/sdk-log
                                                         │
                                                         ▼
                                                  PostgreSQL DB
                                                  (requests table)
                                                         │
                                                         ▼
                                              Your ObserveAI Dashboard
```

The SDK adds **zero latency** to your LLM calls — logs are sent asynchronously in the background after the response is returned to your application.

---

## 3. Installation & Setup

```bash
npm install observeai
# or
yarn add observeai
# or
pnpm add observeai
```

**Environment variable:**
```env
OBSERVEAI_API_KEY=oai_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

Get your API key from your ObserveAI dashboard → Project Settings → API Key.

---

## 4. Quick Start

### Minimal Integration

```typescript
import { ObserveAI } from 'observeai';
import OpenAI from 'openai';

const observe = new ObserveAI({
  apiKey: process.env.OBSERVEAI_API_KEY!,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Make your LLM call through the SDK wrapper
const response = await observe.wrap(async () => {
  return openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Explain quantum computing' }],
  });
}, {
  provider: 'openai',
  model: 'gpt-4o',
});
```

### With Full Context

```typescript
const response = await observe.wrap(async () => {
  return openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: userMessage }],
  });
}, {
  provider: 'openai',
  model: 'gpt-4o',
  userId: currentUser.id,       // Group logs by your app's user
  sessionId: conversationId,    // Group logs by conversation/session
  endpoint: '/api/chat',        // Which API endpoint triggered this call
  tags: ['production', 'chat'], // Custom tags for filtering
});
```

### Manual Log Entry (Advanced)

If you manage the LLM call yourself and just want to send structured data:

```typescript
await observe.log({
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  promptTokens: 1240,
  completionTokens: 380,
  totalCost: 0.0048,
  latencyMs: 1820,
  status: 'success',
  prompt: systemPrompt + userMessage,
  response: assistantReply,
  userId: 'user_abc123',
  sessionId: 'session_xyz',
  endpoint: '/api/summarize',
  tags: ['summarization'],
  toolCalls: [
    {
      toolName: 'search_database',
      toolInput: JSON.stringify({ query: 'quarterly revenue' }),
      toolOutput: JSON.stringify({ results: [...] }),
      latencyMs: 340,
      status: 'called',
    }
  ],
});
```

---

## 5. What Gets Logged

Every request sent to the ObserveAI backend captures the following data:

| Field | Type | Description |
|---|---|---|
| `provider` | string | LLM provider name — `"openai"`, `"anthropic"`, `"google"`, etc. |
| `model` | string | Exact model used — `"gpt-4o"`, `"claude-sonnet-4-6"`, etc. |
| `promptTokens` | number | Input tokens used |
| `completionTokens` | number | Output tokens generated |
| `totalTokens` | number | Auto-calculated if not provided |
| `totalCost` | number | Cost in USD (calculated from token pricing) |
| `latencyMs` | number | End-to-end response time in milliseconds |
| `status` | `"success"` \| `"error"` | Outcome of the call |
| `errorMessage` | string? | Error text if status is `"error"` |
| `errorType` | string? | Error classification — `"rate_limit"`, `"timeout"`, `"invalid_response"` |
| `prompt` | string? | Full prompt text (up to 100K chars) |
| `response` | string? | Full response text (up to 100K chars) |
| `userId` | string? | Your app's user identifier |
| `sessionId` | string? | Conversation or session identifier |
| `endpoint` | string? | Which endpoint in your app triggered this |
| `tags` | string[]? | Custom labels for filtering in dashboard |
| `timestamp` | ISO datetime? | When the call happened (defaults to now) |
| `toolCalls` | ToolCall[]? | Function/tool calls made during this request |

---

## 6. Tool Call Tracking

If your LLM uses function calling or tool use, the SDK captures each tool invocation separately.

```typescript
await observe.log({
  provider: 'openai',
  model: 'gpt-4o',
  // ... other fields ...
  toolCalls: [
    {
      toolName: 'get_weather',
      toolInput: JSON.stringify({ location: 'San Francisco', unit: 'celsius' }),
      toolOutput: JSON.stringify({ temp: 18, condition: 'cloudy' }),
      latencyMs: 210,
      status: 'called',         // 'called' | 'error'
      errorMessage: undefined,
    },
    {
      toolName: 'send_email',
      toolInput: JSON.stringify({ to: 'user@example.com', subject: 'Weather Update' }),
      toolOutput: JSON.stringify({ messageId: 'msg_123' }),
      latencyMs: 580,
      status: 'called',
    },
  ],
});
```

Tool calls are stored in the `tool_calls` table and visible in the **Tool Tracking** page of the dashboard (STARTER plan and above).

**Tool Call Fields:**

| Field | Type | Description |
|---|---|---|
| `toolName` | string | Name of the function/tool called |
| `toolInput` | string? | JSON-serialized input arguments |
| `toolOutput` | string? | JSON-serialized return value |
| `latencyMs` | number? | How long the tool took to execute |
| `status` | string | `"called"` (success) or `"error"` |
| `errorMessage` | string? | Error detail if tool failed |

---

## 7. Batching & Ingestion

The SDK sends logs in **batches** for efficiency. By default, logs are accumulated and flushed automatically:

- Every **2 seconds** (auto-flush interval)
- When the batch reaches **100 entries** (max batch size)
- When you call `observe.flush()` manually

```typescript
// Manual flush — useful at the end of a serverless function
await observe.flush();
```

### Batch Endpoint

The SDK sends batches as a single `POST` request:

```
POST https://api.observeai.com/api/sdk-log
Authorization: Bearer oai_live_xxxxxxxxx
Content-Type: application/json

{
  "requests": [
    { ...entry1 },
    { ...entry2 },
    ...up to 100 entries
  ]
}
```

The backend processes the entire batch in a **single database transaction**, ensuring atomicity. If any entry fails validation, the whole batch is rejected (fail-fast pattern).

**Success response:**
```json
{ "ingested": 5 }
```

**Limit exceeded response (HTTP 429):**
```json
{
  "error": "USAGE_LIMIT",
  "message": "Monthly request limit exceeded",
  "limit": 10000,
  "used": 10000,
  "remaining": 0
}
```

The SDK handles 429 responses gracefully by dropping the batch and continuing — your app never crashes due to observability limits.

---

## 8. Authentication & API Keys

Each **project** in ObserveAI has its own API key. The key format is:

```
oai_live_[random 32-char string]
```

The key is passed in the `Authorization` header as a Bearer token:

```
Authorization: Bearer oai_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How the backend validates it:**
1. Looks up the key in the `projects` table
2. Confirms the project `isActive = true`
3. Loads the project owner's user record (for usage limits)
4. If the project has team members, looks up the calling user from `project_members`
5. Attaches `req.project` and `req.projectUser` to the request

The API key never expires — rotate it from Project Settings if compromised.

---

## 9. Usage Limits & Error Handling

### Monthly Request Counter

Every time a batch is ingested:
1. The backend checks `monthlyRequestCount + batchSize > monthlyRequestLimit`
2. If over limit → returns `429 USAGE_LIMIT`, batch is dropped
3. If within limit → logs are written, counter incremented

The counter **auto-resets on the first of each month** (UTC). The reset is lazy — it happens on the next SDK call after the reset date, not on a fixed schedule.

### Limit Hit Tracking

When a user hits their limit, `freeLimitHitCount` is incremented on their account. This is visible in the admin dashboard and used to identify hot upgrade leads.

### SDK-Side Error Handling

The SDK never throws errors for observability failures — your LLM call always returns normally regardless of whether the log was sent successfully. Failed logs are silently dropped with a console warning in development.

```typescript
// Your app never breaks even if ObserveAI is down
const result = await observe.wrap(async () => {
  return openai.chat.completions.create({ ... });
}, { provider: 'openai', model: 'gpt-4o' });
// result is always the OpenAI response, regardless of SDK status
```

---

## 10. Plan Requirements

| Feature | FREE | STARTER | PRO | ENTERPRISE |
|---|---|---|---|---|
| Request logging | ✓ | ✓ | ✓ | ✓ |
| Cost tracking | ✓ | ✓ | ✓ | ✓ |
| Error monitoring | ✓ | ✓ | ✓ | ✓ |
| Tool call tracking | ✗ | ✓ | ✓ | ✓ |
| Monthly limit | 10K | 100K | 1M | Unlimited |
| Data retention | 7 days | 30 days | 90 days | 365 days |

**Plan names as shown in the app:**

| Internal name | Display name | Price |
|---|---|---|
| FREE | Free | $0/mo |
| STARTER | Pro | $19/mo |
| PRO | Pro Plus | $49/mo |
| ENTERPRISE | Enterprise | Custom |

---

## 11. Backend Ingestion Endpoint

### `POST /api/sdk-log`

**Headers:**
```
Authorization: Bearer <project-api-key>
Content-Type: application/json
```

**Request body schema (Zod):**
```typescript
z.object({
  requests: z.array(z.object({
    timestamp:        z.string().datetime().optional(),
    provider:         z.string(),
    model:            z.string(),
    promptTokens:     z.number().int().min(0).default(0),
    completionTokens: z.number().int().min(0).default(0),
    totalTokens:      z.number().int().min(0).optional(),
    totalCost:        z.number().min(0).default(0),
    latencyMs:        z.number().int().min(0).default(0),
    status:           z.enum(['success', 'error']).default('success'),
    errorMessage:     z.string().optional(),
    errorType:        z.string().optional(),
    prompt:           z.string().max(100000).optional(),
    response:         z.string().max(100000).optional(),
    userId:           z.string().optional(),
    sessionId:        z.string().optional(),
    endpoint:         z.string().optional(),
    tags:             z.array(z.string()).optional(),
    toolCalls:        z.array(toolCallSchema).optional(),
  })).min(1).max(100),
})
```

**Middleware chain for this endpoint:**
```
validateApiKey  →  usageLimiter  →  ingestLogs controller
```

1. **`validateApiKey`** — Looks up the API key, confirms project is active, loads project owner as `req.projectUser`
2. **`usageLimiter`** — Checks monthly counter, resets if month has rolled over, rejects if over limit
3. **`ingestLogs`** — Parses body with Zod, calls `sdkLog.service.ingestBatch()`, which runs the full batch in a Prisma transaction

**What `ingestBatch` does:**

```
For each log entry:
  1. Create row in requests table
  2. If toolCalls present → createMany rows in tool_calls table

After all entries:
  3. Fetch current user state
  4. Increment monthlyRequestCount, totalApiCallsLifetime, apiCallsThisMonth
  5. Update lastApiCallAt = now
  6. If first ever call → set firstApiCallAt, integrationCompletedAt, userStatus = 'active'
```

Everything in steps 1–6 runs inside a **single Prisma transaction** — either all entries are saved or none are.

---

## 12. Full Field Reference

### Log Entry

```typescript
interface LogEntry {
  // Required
  provider: string;          // 'openai' | 'anthropic' | 'google' | any string
  model: string;             // 'gpt-4o' | 'claude-sonnet-4-6' | any string

  // Token usage (at least one required for cost tracking)
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;      // Auto-computed if omitted

  // Cost & performance
  totalCost?: number;        // USD, e.g. 0.00245
  latencyMs?: number;        // Milliseconds

  // Outcome
  status?: 'success' | 'error';
  errorMessage?: string;
  errorType?: string;

  // Content (stored as text, max 100K chars each)
  prompt?: string;
  response?: string;

  // Context for grouping
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  tags?: string[];

  // Timing (defaults to server receive time if omitted)
  timestamp?: string;        // ISO 8601: "2026-02-21T14:30:00.000Z"

  // Tool calls
  toolCalls?: ToolCall[];
}
```

### Tool Call

```typescript
interface ToolCall {
  toolName: string;          // Function/tool name
  toolInput?: string;        // JSON-serialized arguments
  toolOutput?: string;       // JSON-serialized return value
  latencyMs?: number;        // Execution time in ms
  status?: string;           // 'called' | 'error'
  errorMessage?: string;     // Error detail if failed
}
```

---

## Architecture Notes

- The SDK endpoint is the **only unauthenticated-by-JWT route** in the system. It uses API key auth (`validateApiKey` middleware) instead of user JWT.
- Project API keys grant access scoped to a **single project**. A user with multiple projects has multiple API keys.
- Team members who are `ADMIN` or `VIEWER` on a project can also send logs to that project's endpoint — the `projectUser` is resolved from `ProjectMember` if the key's owner is not the requester.
- All cost figures stored in the database use `Decimal(10,6)` precision — never float arithmetic.
