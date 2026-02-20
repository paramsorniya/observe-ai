# Team Collaboration — Implementation Deep Dive

> How multi-user project access works end-to-end, from the database to the dashboard.

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Who Can Use It](#2-who-can-use-it)
3. [Role System](#3-role-system)
4. [The Invitation Flow](#4-the-invitation-flow)
5. [Database Schema](#5-database-schema)
6. [Backend Implementation](#6-backend-implementation)
7. [Frontend Implementation](#7-frontend-implementation)
8. [Admin Panel Visibility](#8-admin-panel-visibility)
9. [Downgrade Handling](#9-downgrade-handling)
10. [Permission Matrix](#10-permission-matrix)
11. [Full Data Flow Diagram](#11-full-data-flow-diagram)

---

## 1. Feature Overview

Team collaboration allows a project **owner** to invite other ObserveAI users to access their project's dashboard — request logs, cost analytics, error monitoring, and optimization insights — without sharing credentials.

Each collaborator gets their own login. They see the shared project alongside their own projects. The project owner's subscription tier governs everything: limits, available features, and how many members can be invited.

**What a team member can do depends on their role** (ADMIN vs VIEWER — explained below). The project owner always has full control.

---

## 2. Who Can Use It

Team collaboration is a **PRO (Pro Plus) and ENTERPRISE** plan feature.

| Plan | Team Collaboration | Max Team Members |
|---|---|---|
| Free ($0) | Not available | 1 (owner only) |
| Pro / STARTER ($19) | Not available | 3 (owner + 2) |
| Pro Plus / PRO ($49) | Available | 10 (owner + 9) |
| Enterprise (custom) | Available | Unlimited |

> Note: The `STARTER` plan has a `teamMembers: 3` limit in `TIER_LIMITS` but `team_collaboration` is only enabled for `PRO` and `ENTERPRISE` in `FEATURE_MATRIX`. This means STARTER users cannot invite anyone even though the slot count says 3 — the feature gate blocks the invite action before the limit is even checked.

---

## 3. Role System

Three roles exist in the system, defined in the `ProjectMemberRole` Prisma enum:

```
OWNER  →  ADMIN  →  VIEWER
```

| Action | OWNER | ADMIN | VIEWER |
|---|---|---|---|
| View all dashboard pages | ✓ | ✓ | ✓ |
| View request logs | ✓ | ✓ | ✓ |
| View cost analytics | ✓ | ✓ | ✓ |
| View errors & optimization | ✓ | ✓ | ✓ |
| Invite new members | ✓ | ✓ | ✗ |
| Revoke pending invitations | ✓ | ✓ | ✗ |
| Remove VIEWER members | ✓ | ✓ | ✗ |
| Remove ADMIN members | ✓ | ✗ | ✗ |
| Change member roles | ✓ | ✗ | ✗ |
| Delete the project | ✓ | ✗ | ✗ |
| Access billing/settings | ✓ | ✗ | ✗ |

**Key rules:**
- The OWNER row never appears in `project_members` — ownership is stored on the `project.userId` field
- OWNERs are always injected at the top of the team list by the backend at query time
- ADMINs can manage VIEWERs but not each other or the owner
- Only the OWNER can change roles or remove ADMINs

---

## 4. The Invitation Flow

```
OWNER/ADMIN sends invite
         │
         │  POST /api/projects/:id/team/invitations
         │  { email: "colleague@example.com", role: "VIEWER" }
         ▼
  Backend validates:
  ① Requester has OWNER or ADMIN access
  ② Owner's tier has team_collaboration enabled
  ③ Member count < tier limit
  ④ Email is not already a member or owner
  ⑤ Cancel any existing PENDING invite for same email
         │
         ▼
  Creates ProjectInvitation row:
  {
    id: cuid(),
    projectId: "proj_xxx",
    invitedEmail: "colleague@example.com",
    invitedById: "user_yyy",
    role: "VIEWER",
    token: cuid(),           ← unique, hard-to-guess URL token
    status: "PENDING",
    expiresAt: now + 7 days
  }
         │
         ▼
  Returns invitation record
  (frontend shows token or sends invitation email)
         │
         ▼
  Invitee visits: /invite?token=<token>
         │
         ▼
  Frontend fetches GET /api/invitations/:token/preview
  Shows: project name, who invited them, role, expiry
         │
         ▼
  Invitee logs in (or registers)
         │
         ▼
  POST /api/invitations/:token/accept
         │
  Backend validates:
  ① Token exists and is PENDING
  ② Not expired (expiresAt > now)
  ③ Logged-in user's email matches invitedEmail (strict)
  ④ User is not already a member
         │
  Prisma transaction:
  ① Create (or update) ProjectMember row
  ② Update invitation: status = ACCEPTED, acceptedAt = now
         │
         ▼
  Invitee is now a team member.
  The shared project appears in their project switcher.
```

**Token security:** Tokens are `cuid()` values — 25-character, collision-resistant, URL-safe. They are not guessable. The `invitation.token` has a `@unique` database constraint and a dedicated index.

**Email enforcement:** The accepting user's email must exactly match `invitedEmail` (case-insensitive). This prevents one user from accepting another person's invitation by sharing the link.

**Re-invitation:** If a new invitation is sent to the same email that already has a PENDING one, the old invitation is automatically REVOKED before the new one is created. This avoids confusion from multiple valid tokens for the same email.

---

## 5. Database Schema

Two new tables were added to support team collaboration:

### `project_members`

```prisma
model ProjectMember {
  id        String            @id @default(cuid())
  projectId String
  project   Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      ProjectMemberRole @default(VIEWER)  // OWNER | ADMIN | VIEWER
  joinedAt  DateTime          @default(now())

  @@unique([projectId, userId])   // one row per user per project
}
```

**Important:** OWNER is never stored here. The `project.userId` field is the authoritative owner reference. If a user is listed in `project_members`, they are a collaborator, not the owner.

### `project_invitations`

```prisma
model ProjectInvitation {
  id           String           @id @default(cuid())
  projectId    String
  project      Project          @relation(...)
  invitedEmail String
  invitedById  String
  invitedBy    User             @relation("SentInvitations", ...)
  role         ProjectMemberRole @default(VIEWER)
  token        String           @unique @default(cuid())
  status       InvitationStatus @default(PENDING)  // PENDING | ACCEPTED | EXPIRED | REVOKED
  expiresAt    DateTime
  acceptedAt   DateTime?
  createdAt    DateTime         @default(now())
}
```

### Enums

```prisma
enum ProjectMemberRole {
  OWNER
  ADMIN
  VIEWER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}
```

### User model additions

```prisma
model User {
  // ... existing fields ...
  projectMemberships  ProjectMember[]
  sentInvitations     ProjectInvitation[] @relation("SentInvitations")
}
```

---

## 6. Backend Implementation

### File Structure

```
backend/src/
├── services/
│   └── team.service.ts        ← All business logic
├── controllers/
│   └── team.controller.ts     ← HTTP handlers
├── routes/
│   └── team.routes.ts         ← Route definitions
└── utils/
    └── projectAccess.ts       ← Shared access check helper
```

### `team.service.ts` — Service Functions

| Function | Description |
|---|---|
| `getTeam(projectId, requesterId)` | Returns full team: owner + members + pending invitations. Accessible by owner or any member. |
| `inviteMember(projectId, requesterId, { email, role })` | Creates a PENDING invitation. Checks feature gate, member limit, duplicate detection. |
| `revokeInvitation(projectId, invitationId, requesterId)` | Sets invitation status to REVOKED. Requires OWNER or ADMIN. |
| `removeMember(projectId, memberUserId, requesterId)` | Deletes a `ProjectMember` row. ADMINs can only remove VIEWERs. |
| `changeRole(projectId, memberUserId, requesterId, { role })` | Updates a member's role. OWNER only. |
| `acceptInvitation(token, acceptingUserId)` | Validates token, enforces email match, creates member row in a transaction. |
| `getInvitationPreview(token)` | Returns project name, inviter, role, expiry — no auth required (for preview before login). |

### Access Control Helpers

```typescript
// requireManageAccess — used by invite, revoke, remove
// Passes if: requester === project.userId (owner)
// OR: requester is a ProjectMember with role ADMIN
async function requireManageAccess(projectId, requesterId) { ... }

// requireOwnerAccess — used by changeRole only
// Passes ONLY if: requester === project.userId
async function requireOwnerAccess(projectId, requesterId) { ... }
```

### `team.routes.ts` — API Endpoints

```
GET    /api/projects/:projectId/team                              → getTeam
POST   /api/projects/:projectId/team/invitations                  → inviteMember
DELETE /api/projects/:projectId/team/invitations/:invitationId    → revokeInvitation
DELETE /api/projects/:projectId/team/members/:memberId            → removeMember
PATCH  /api/projects/:projectId/team/members/:memberId            → changeRole

GET    /api/invitations/:token/preview                            → getInvitationPreview
POST   /api/invitations/:token/accept                             → acceptInvitation
```

All routes require `authenticate` middleware (JWT). The preview endpoint is hit before login but the accept endpoint requires a logged-in user.

### Feature & Limit Checking (inside `inviteMember`)

```typescript
// 1. Feature gate
if (!canAccessFeature(requester.subscriptionTier, 'team_collaboration')) {
  throw new AppError('Team collaboration requires a Pro Plus plan or higher', 403, 'FEATURE_LOCKED');
}

// 2. Member count check
const memberCount = await prisma.projectMember.count({ where: { projectId } });
const limit = TIER_LIMITS[requester.subscriptionTier].teamMembers;
// +1 for owner (not in project_members table)
if (memberCount + 1 >= limit) {
  throw new AppError(`Team member limit reached (${limit} on ${tier} plan)`, 403, 'TEAM_LIMIT');
}
```

---

## 7. Frontend Implementation

### Pages & Components

```
frontend/src/
├── pages/private/
│   └── TeamPage.tsx           ← /dashboard/team  (main team management UI)
├── components/layout/
│   └── Sidebar.tsx            ← "Team" nav item (locked for FREE/STARTER)
└── components/layout/
    └── Header.tsx             ← Project switcher shows shared projects separately
```

### TeamPage.tsx

The Team page lives at `/dashboard/team` and has two sections:

**Members table** — Shows all team members with their role, join date, and remove/role-change actions based on the current user's permissions.

**Pending Invitations** — Shows active invitations (PENDING + not expired). OWNER/ADMIN can revoke them.

**Invite form** — Email input + role selector (ADMIN/VIEWER). Only shown to OWNER and ADMIN users. Locked with an upgrade prompt for FREE/STARTER users.

### Project Switcher in Header

When a user is a member of shared projects, the project dropdown groups them:

```
[ My Projects ]
  ● My App                  ← owned projects
  ● Side Project

[ Shared with me ]
  👥 Team Alpha             ← projects where user is ADMIN/VIEWER
  👥 Client Dashboard
```

A blue banner appears below the header when viewing a shared project:
> "You're viewing a shared project — **Team Alpha**. Your subscription, settings, and own projects are separate from this collaboration."

### Sidebar Behaviour

- The "Team" nav item is always visible in the sidebar
- For FREE/STARTER users: a lock icon appears, clicking the item shows a feature gate screen
- For PRO/ENTERPRISE users: full access to the Team page
- **Shared project members** (ADMIN/VIEWER) can also access the Team page even if their own personal tier is FREE — because the shared project's owner has PRO/ENTERPRISE

This is implemented with `SHARED_UNLOCKED` logic in `Sidebar.tsx`:
```typescript
const SHARED_UNLOCKED = ['team_collaboration', 'cost_optimization', 'tool_tracking'];
const locked =
  item.feature != null &&
  !canAccessFeature(tier, item.feature) &&
  !(isSharedProject && SHARED_UNLOCKED.includes(item.feature));
```

---

## 8. Admin Panel Visibility

The admin panel has full read-only visibility into all team collaboration data across the platform.

### New Admin Pages

#### `/teams` — TeamsPage

Two-tab layout:

**Projects tab** — Lists all collaborative projects (projects with at least one non-owner member or a pending invitation).

| Column | Description |
|---|---|
| Project | Project name |
| Owner | Name, email, tier badge |
| Members | Count + breakdown (N Admin, N Viewer) |
| Pending | Yellow if any pending invitations |
| Last Joined | Most recent member join date |
| Created | Project creation date |
| View | Links to `/teams/:projectId` |

Filters: search (project name / owner email), owner tier, "pending invites only" checkbox.

**Invitations tab** — Global log of every invitation ever sent.

| Column | Description |
|---|---|
| Invited Email | Who was invited |
| Role | ADMIN / VIEWER badge |
| Status | PENDING / ACCEPTED / EXPIRED / REVOKED badge |
| Project | Project name + owner email |
| Sent By | Which user sent the invite |
| Sent | Date sent |
| Expires | Expiry date |
| Accepted | Date accepted (if applicable) |

Filters: search, status, role, date range (from/to).

**4 stat cards** always visible at top:
- Collaborative Projects (total projects with any collaboration)
- Active Members (total non-owner members across all projects)
- Pending Invites (count of PENDING invitations)
- Acceptance Rate (% of sent invitations that were accepted)

#### `/teams/:projectId` — TeamProjectDetailPage

Full roster for a single project:

- Header: project name + owner info + tier badge
- **Members table**: Email, Name, Tier badge, Role badge, Join date. Each row is clickable → `/users/:id`
- **Invitations table**: Invited Email, Role badge, Status badge, Expires, Accepted, Sent By

### Admin Dashboard Additions

A "Team Collaboration" section was added at the bottom of the existing dashboard:

3 compact stat cards (only rendered once data loads — no loading state):
- Collaborative Projects
- Active Members
- Acceptance Rate

Clicking any card navigates to `/teams`.

### User Detail Page Additions

Two new sections appear at the bottom of each user's detail page:

**Project Memberships** — Projects this user joined as a collaborator (non-owner). Always rendered (shows empty state if none). Columns: Project, Owner, Role, Joined.

**Sent Invitations** — Last 10 invitations this user sent. Only rendered if count > 0. Columns: Invited, Project, Role, Status, Sent.

### Backend: Admin Service Functions

Four new functions were added to `admin.service.ts`:

```typescript
getCollaborationStats()
// Returns: totalCollaborativeProjects, totalActiveMembers,
//          totalInvitationsSent, pendingInvitations,
//          invitationAcceptanceRate, topCollaboratingTier

getCollaborationProjects(query)
// Paginated list with filters: search, ownerTier, hasPendingInvites

getCollaborationProjectDetail(projectId)
// Full project roster: owner, members[], invitations[]
// Throws NotFoundError if project doesn't exist

getCollaborationInvitations(query)
// Global paginated invitation log with filters:
// search, status, role, from date, to date
```

### Admin API Endpoints

```
GET /admin/collaboration/stats
GET /admin/collaboration/projects
GET /admin/collaboration/projects/:projectId
GET /admin/collaboration/invitations
```

All routes sit behind `authenticate + requireAdmin` middleware.

### `getUserDetail` Extension

The existing admin user detail function was extended to include:

```typescript
// Added to Prisma include:
projectMemberships: {
  where: { role: { not: 'OWNER' } },
  include: { project: { select: { id, name, user: { email } } } },
  orderBy: { joinedAt: 'desc' },
}
sentInvitations: {
  take: 10,
  orderBy: { createdAt: 'desc' },
  include: { project: { select: { name } } },
}

// Added to return value:
memberships: user.projectMemberships.map(m => ({
  projectId, projectName, ownerEmail, role, joinedAt
}))
sentInvitations: user.sentInvitations.map(inv => ({
  invitedEmail, projectName, role, status, createdAt
}))
```

---

## 9. Downgrade Handling

When a project owner's subscription is downgraded to a tier that doesn't support team collaboration (FREE or STARTER), all collaboration data is **immediately cleaned up**:

```typescript
// In admin.service.ts overrideSubscription()
if (!canAccessFeature(tier, 'team_collaboration')) {
  await prisma.$transaction([
    // Remove all non-owner members from all owned projects
    prisma.projectMember.deleteMany({
      where: { project: { userId } },
    }),
    // Revoke all pending invitations for owned projects
    prisma.projectInvitation.updateMany({
      where: { project: { userId }, status: 'PENDING' },
      data: { status: 'REVOKED' },
    }),
  ]);
}
```

This same cleanup runs for:
- Admin-initiated subscription override (downgrade via admin panel)
- Stripe webhook-triggered downgrade (payment failure → FREE)
- Scheduled downgrade job (user-requested downgrade at end of billing period)

**From the member's perspective:** If the project owner downgrades, the shared project disappears from the member's project switcher. The member's own account and data are unaffected.

---

## 10. Permission Matrix

Full breakdown of what each role can do across the system:

### Project-level Actions

| Action | OWNER | ADMIN | VIEWER |
|---|---|---|---|
| View Dashboard | ✓ | ✓ | ✓ |
| View Requests | ✓ | ✓ | ✓ |
| View Costs | ✓ | ✓ | ✓ |
| View Errors | ✓ | ✓ | ✓ |
| View Optimization | ✓* | ✓* | ✓* |
| View Tool Tracking | ✓* | ✓* | ✓* |
| View Team page | ✓ | ✓ | ✓ |
| Invite members | ✓ | ✓ | ✗ |
| Revoke invitations | ✓ | ✓ | ✗ |
| Remove VIEWERs | ✓ | ✓ | ✗ |
| Remove ADMINs | ✓ | ✗ | ✗ |
| Change member roles | ✓ | ✗ | ✗ |
| Project settings | ✓ | ✗ | ✗ |
| Delete project | ✓ | ✗ | ✗ |
| Billing / Upgrade | ✓ | ✗ | ✗ |

> *Optimization and Tool Tracking are unlocked for shared project members regardless of their personal subscription tier — because the project owner's tier governs access.

### Invitation-level Access

| Who can see invitation details? |
|---|
| Owner always |
| ADMINs (for invitations they sent or can revoke) |
| The invited user themselves (via preview token) |

---

## 11. Full Data Flow Diagram

```
                        OWNER / ADMIN
                             │
                    invite colleague@example.com
                             │
                             ▼
          POST /api/projects/proj_abc/team/invitations
                             │
              ┌──────────────▼──────────────┐
              │    team.service.inviteMember │
              │                             │
              │  ① requireManageAccess      │
              │  ② canAccessFeature check   │
              │  ③ member count check       │
              │  ④ duplicate check          │
              │  ⑤ revoke old PENDING       │
              │  ⑥ create invitation        │
              └──────────────┬──────────────┘
                             │
                    invitation.token = "abc123xyz"
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Email sent with invite link  │
              │  /invite?token=abc123xyz      │
              └──────────────┬───────────────┘
                             │
                    Invitee clicks link
                             │
                             ▼
              GET /api/invitations/abc123xyz/preview
              ┌──────────────────────────────┐
              │  { projectName, invitedBy,   │
              │    role, invitedEmail,        │
              │    expiresAt }               │
              └──────────────┬───────────────┘
                             │
                  Invitee logs in / registers
                             │
                             ▼
              POST /api/invitations/abc123xyz/accept
                             │
              ┌──────────────▼──────────────┐
              │  team.service.acceptInvitation│
              │                             │
              │  ① Find invitation by token  │
              │  ② Check status = PENDING   │
              │  ③ Check not expired        │
              │  ④ Check email matches user  │
              │  ⑤ Check not already member  │
              │                             │
              │  Prisma transaction:         │
              │  ⑥ Create ProjectMember row  │
              │  ⑦ Set invitation ACCEPTED   │
              └──────────────┬──────────────┘
                             │
                             ▼
              Invitee is now a VIEWER on proj_abc
                             │
              ┌──────────────▼──────────────┐
              │  Project appears in their   │
              │  "Shared with me" section   │
              │  in the project switcher    │
              └─────────────────────────────┘
                             │
                   Admin Panel sees all of this:
                             │
              ┌──────────────▼──────────────┐
              │  /teams → TeamsPage         │
              │  /teams/proj_abc → Detail   │
              │  /users/user_id → Memberships│
              │  /dashboard → Collab stats  │
              └─────────────────────────────┘
```
