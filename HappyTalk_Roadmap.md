
# HappyTalk — Product & Technical Roadmap

**Last updated:** 2026-02-03 13:30 UTC  
**Hosting:** Azure App Service (single app hosts frontend + backend)  
**Backend:** Node.js 24 LTS (Fastify)  
**Frontend:** Angular 21 PWA (served by backend)  
**Realtime:** Azure SignalR Service (Web PubSub)  
**Data:** Azure Cosmos DB (API for SQL) — **Account:** `cosmoskhreq3`, **DB:** `khRequest`

---

## Current Status: M0 Complete ✅ | M1 In Progress 🔄

---

## 1) Vision & Principles
- **Kid‑safe by design:** parental consent, moderation, minimal data collection, COPPA‑aligned (non‑legal).  
- **Reliability:** offline-first PWA, graceful degradation, clear SLIs/SLOs.  
- **Performance:** sub‑200 ms p95 API where feasible; fast first load; small bundles.  
- **Security & Privacy:** AAD‑backed access where possible, secrets in Key Vault, least privilege.

---

## 2) Architecture Snapshot
- **App Service**: Node 24 runtime; serves Angular `/dist` and exposes REST + SignalR negotiate endpoint.  
- **Azure SignalR Service**: Default mode for scale‑out realtime messaging.  
- **Cosmos DB (SQL API)**: logical containers for `users`, `guardians`, `rooms`, `messages`, `reports`, `events`.  
- **Blob Storage**: `happytalkstorage` for user avatars, file uploads, static assets ($web container).  
- **Authentication**: Local credentials (email/password) + Google OAuth 2.0; admin approval workflow.  
- **Admin System**: Primary admin `naprikovsky@gmail.com`; access requests stored in Cosmos.  
- **App Insights** for logs/metrics/traces; **Key Vault** for secrets; **App Config/Feature Flags** for gradual rollout.  
- **CI/CD** via GitHub Actions or Azure DevOps; IaC via Bicep/Terraform.

---

## 3) Milestones & Deliverables

### M0 — Foundations (Week 0–1) ✅ COMPLETE
- ✅ Repo setup (monorepo: `/src` frontend, `/server` backend)
- ✅ Angular 21 PWA scaffold with service worker
- ✅ Fastify 5 + TypeScript API (`/server/server.ts`)
- ✅ App Service deploy via GitHub Actions (`main_happytalk.yml`)
- ✅ **Azure SignalR** wired (Web PubSub negotiate endpoint at `POST /api/negotiate`)
- ✅ Basic room broadcast (`/api/messages`, SignalR group messaging)
- ✅ Cosmos DB account `cosmoskhreq3` + database `khRequest` connected
- ✅ Message schema implemented (`/server/models/message.ts`)
- ⏳ App Insights + dashboards (not yet configured)
- ⏳ SLO draft (pending)

**Implemented Files:**
- `server/server.ts` — Fastify entry, serves Angular + API
- `server/services/cosmos.service.ts` — Cosmos DB repository
- `server/services/signalr.service.ts` — SignalR broadcast
- `server/routes/api.ts` — REST endpoints
- `src/app/services/signalr.service.ts` — Frontend SignalR client
- `src/app/pages/chat/chat.ts` — Real-time chat UI
- `.github/workflows/main_happytalk.yml` — CI/CD pipeline

### M1 — MVP (Weeks 2–6) 🔄 IN PROGRESS
- ✅ **Chat Core (basic)**: public room messaging works
- ✅ **PWA**: app shell cached, service worker active
- ✅ **Message persistence**: Cosmos DB stores messages
- ✅ **Real-time delivery**: SignalR broadcasts new messages
- ⏳ **Authentication**:
  - User registration with email/password
  - Google OAuth 2.0 sign-in
  - JWT token management
  - Admin approval system (primary: `naprikovsky@gmail.com`)
  - Access request workflow in Cosmos DB
- ⏳ **File Storage**: Azure Blob Storage integration for avatars and uploads
- ⏳ **Auth & Consent**: child profile + guardian email consent flow
- ⏳ **Chat Core (full)**: 1:1 DMs, presence indicators, typing indicators
- ⏳ **Moderation v1**: profanity filter, blocked words, message TTL
- ⏳ **Offline**: retry queue for sends when offline
- ⏳ **Ops**: blue/green deploy, autoscale rules
- ⏳ **Telemetry**: message latency, join/leave, error rates

### M2 — Beta (Weeks 7–12)
- **Parental Dashboard**: activity summary, mute/block, limited hours.  
- **Moderation v2**: user reports, shadow‑ban, quarantine room.  
- **Content Safety**: nickname rules, emoji/Sticker whitelist.  
- **Notifications**: Web Push (with consent); unread counts.  
- **Data**: Cosmos indexing policies, RU optimization, point‑in‑time restore config.  
- **Security**: Managed Identity for App Service → Cosmos (RBAC) where supported; rotate secrets via Key Vault.

### M3 — GA (Weeks 13–18)
- **Scalability**: shard rooms by partition key; backpressure; rate limits per IP/user.  
- **Resilience**: retry policies, circuit breakers, graceful SignalR reconnection.  
- **Compliance**: data retention by age group; export/delete account; legal/ToS/Privacy.  
- **Observability**: SLO 99.9% monthly; synthetic tests; alerts on p95 latency & disconnect spikes.  
- **Accessibility**: WCAG 2.2 AA; screen reader labels; reduced motion theme.

### M4 — Engagement (Weeks 19–26)
- **Rooms v2**: private groups with guardian approval; invite codes.  
- **Gamification**: badges for kindness, streaks (privacy‑preserving).  
- **Localization**: i18n + RTL; content filters per locale.  
- **Educator Mode** (optional): moderated classrooms, read‑only announcements.

### M5 — Scale & Platform (Weeks 27+)
- **Multi‑region DR**: secondary read region, failover runbook.  
- **Analytics**: privacy‑safe engagement metrics; cohort analysis.  
- **Extensibility**: plugins for quizzes/polls; remote config; A/B tests.

---

## 4) Data Model (Cosmos DB — khRequest)

### Implemented ✅
- **chat_messages** (container): partition by `roomid`
  ```typescript
  {
    id: string,           // GUID
    roomid: string,       // partition key (e.g., "public")
    text: string,         // message content
    senderName: string,   // display name
    senderId?: string,    // user ID
    createdAt: string,    // ISO 8601 timestamp
    clientId?: string,    // for deduplication
    ttl?: number          // optional retention
  }
  ```

### Planned (M1+)
- **users**: `id`, `email`, `passwordHash`, `displayName`, `avatar` (blob URL), `googleId?`, `isApproved`, `approvedBy`, `approvedAt`, `createdAt`
- **access_requests**: `id`, `userId`, `email`, `status` (pending/approved/rejected), `requestedAt`, `reviewedBy`, `reviewedAt`
- **rooms**: `id`, `name`, `type(public|private)`, `members[]`, `createdBy`, `ts`  
- **guardians**: `id`, `email`, `consent`, `linkedUserIds[]` (future child safety feature)  
- **reports**: `id`, `messageId`, `reporterId`, `reason`, `status`  
- **events**: audit + analytics (short TTL)

**Policies**: selective indexing, TTL on `messages` & `events`, Change Feed for moderation/analytics.

**Blob Storage ($web container):**
- User avatars: `avatars/{userId}.{ext}`
- File uploads: `uploads/{roomid}/{messageId}/{filename}`
- Static assets: served via `https://happytalkstorage.z1.web.core.windows.net/`

---

## 5) API Surface

### Implemented ✅
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/negotiate` | SignalR negotiation (returns WebSocket URL) |
| GET | `/api/messages/:roomid` | Get message history (supports pagination) |
| POST | `/api/messages` | Send new message (persists + broadcasts) |
| POST | `/api/rooms/:roomid/join` | Join SignalR group |
| POST | `/api/rooms/:roomid/leave` | Leave SignalR group |

### Planned (M1+)
- **Authentication:**
  - `POST /auth/register` — Email/password registration
  - `POST /auth/login` — Email/password login
  - `POST /auth/google` — Google OAuth callback
  - `POST /auth/request-access` — Request admin approval
  - `GET /auth/me` — Current user profile
  - `POST /auth/refresh` — Refresh JWT token
- **Admin:**
  - `GET /admin/access-requests` — List pending requests (admin only)
  - `POST /admin/access-requests/:id/approve` — Approve user (admin only)
  - `POST /admin/access-requests/:id/reject` — Reject user (admin only)
- **User Profile:**
  - `GET /me` / `PATCH /me` — User profile management
  - `POST /me/avatar` — Upload avatar to blob storage
- **Rooms:**
  - `GET /rooms` / `POST /rooms` — Room management
- **Moderation:**
  - `POST /reports` — Report message
  - `POST /auth/consent` — Guardian consent (future)

---

## 6) Realtime & PWA

### Implemented ✅
- **SignalR Client**: `@azure/web-pubsub-client` in Angular service
- **Connection**: negotiate → WebSocket → join group
- **Broadcast**: server sends messages to room group
- **SW Caching**: app shell prefetch, API freshness strategy

### Planned (M1+)
- **Presence**: joins/leaves, online status
- **Typing indicators**: ephemeral events
- **Offline queue**: queue outbound messages; reconcile on reconnect
- **Delivery states**: sent → delivered → read

---

## 7) Security & Safety
- Enforce nickname rules, word filters, and report thresholds.  
- Rate limit joins/messages; CAPTCHA challenges on abuse signals.  
- Secrets in **Key Vault**; Managed Identity for resource access.  
- Regular dependency scans; SAST/DAST in CI; content safety reviews.

---

## 8) DevOps & Environments

### Implemented ✅
- **GitHub Actions**: `main_happytalk.yml` — build + deploy on push to `main`
- **Build**: `npm run build:all` (Angular → `/dist/happy-talk/browser`, Fastify → `/dist/server`)
- **App Service**: Linux, Node 24; startup: `node dist/server/server.js`
- **Azure Login**: Federated identity (OIDC) — no publish profile secrets
- **Config**: `azure-appsettings.json` for import

### Planned (M1+)
- **Envs**: dev, staging, prod (separate Cosmos containers)
- **Infra as Code**: Bicep/Terraform
- **Smoke tests**: post-deploy health checks
- **Autoscale**: based on CPU, requests, or SignalR connections

---

## 9) KPIs & SLOs
- **Latency**: p95 API < 200 ms; **Uptime**: 99.9% monthly.  
- **Messaging**: delivery success > 99.95%; reconnect < 3 s p95.  
- **Safety**: < 0.2% messages flagged post‑factum.

---

## 10) Risks & Mitigations
- **Burst traffic** → autoscale + rate limits + backpressure queues.  
- **Cosmos RU waste** → partitioning, indexing tune, server‑side projections.  
- **Abuse** → moderation workflows, guardian controls, temp mutes.  
- **Vendor lock‑in** → abstract realtime & data layers; keep clean ports.

---

## 11) Open Questions
- Use **Redis** for ephemeral presence & rate limiting?  
- Do we need **image/file sharing** (implies extra moderation)?  
- Which **feature flag** service (App Configuration vs LaunchDarkly)?

---

## 12) Resource Naming
- **App Service**: `HappyTalk` ✅
- **Cosmos DB**: `cosmoskhreq3` (DB: `khRequest`, Containers: `chat_messages`, `users`, `access_requests`) ✅
- **SignalR**: `tw-signalr-occupier` ✅
- **Blob Storage**: `happytalkstorage` (Container: `$web`) ✅
  - Public URL: `https://happytalkstorage.z1.web.core.windows.net/`
- **Primary Admin**: `naprikovsky@gmail.com` ✅
- **GitHub Actions**: `main_happytalk.yml` ✅

