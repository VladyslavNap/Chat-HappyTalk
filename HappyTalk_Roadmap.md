
# HappyTalk — Product & Technical Roadmap

**Last updated:** 2026-02-03 12:45 UTC  
**Hosting:** Azure App Service (single app hosts frontend + backend)  
**Backend:** Node.js 24 LTS (Fastify preferred)  
**Frontend:** Angular (latest) PWA (served by backend)  
**Realtime:** Azure SignalR Service  
**Data:** Azure Cosmos DB (API for SQL) — **Account:** `cosmoskhreq3`, **DB:** `khRequest`

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
- **App Insights** for logs/metrics/traces; **Key Vault** for secrets; **App Config/Feature Flags** for gradual rollout.  
- **CI/CD** via GitHub Actions or Azure DevOps; IaC via Bicep/Terraform.

---

## 3) Milestones & Deliverables

### M0 — Foundations (Week 0–1)
- Repo setup (monorepo or /frontend, /backend).  
- Angular PWA scaffold; Fastify + TypeScript API; App Service deploy (prod/stage).  
- Wire **Azure SignalR** (negotiate endpoint) and basic room broadcast.  
- Cosmos DB account `cosmoskhreq3` + database `khRequest`; seed minimal schema.  
- App Insights + dashboards; error budgets & SLO draft.

### M1 — MVP (Weeks 2–6)
- **Auth & Consent**: child profile + guardian email consent flow.  
- **Chat Core**: public rooms, 1:1 DMs, presence, typing indicators.  
- **Moderation v1**: profanity filter, blocked words, message TTL (e.g., 30 days).  
- **PWA**: app shell, offline cache, retry queue for sends when offline.  
- **Ops**: blue/green deploy, health probes, autoscale rules (CPU/RPS).  
- **Telemetry**: message send/receive latency, join/leave, error rates.

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
- **messages**: partition by `roomId`; schema: `id`, `roomId`, `senderId`, `text`, `ts`, `flags`, `moderation`  
- **rooms**: `id`, `name`, `type(public|private)`, `members[]`, `createdBy`, `ts`  
- **users**: `id`, `nickname`, `avatar`, `guardianId`, `ageBand`, `settings`  
- **guardians**: `id`, `email`, `consent`, `linkedUserIds[]`  
- **reports**: `id`, `messageId`, `reporterId`, `reason`, `status`  
- **events**: audit + analytics (short TTL).  
- **Policies**: selective indexing, TTL on `messages` & `events`, Change Feed for moderation/analytics.

---

## 5) API Surface (initial)
- `POST /auth/consent` (guardian)  
- `GET /rooms` / `POST /rooms` / `POST /rooms/<built-in function id>/join`  
- `GET /rooms/<built-in function id>/messages?since=...`  
- `POST /rooms/<built-in function id>/messages`  
- `POST /reports`  
- `GET /me` / `PATCH /me`  
- `POST /negotiate` (SignalR negotiation)

---

## 6) Realtime & PWA
- **SignalR**: server sends joins/leaves, presence, typing, message delivery/ack.  
- **Offline**: queue outbound messages; reconcile on reconnect; show delivery states.  
- **Caching**: SW precache app shell; runtime cache avatars/emoji with versioning.

---

## 7) Security & Safety
- Enforce nickname rules, word filters, and report thresholds.  
- Rate limit joins/messages; CAPTCHA challenges on abuse signals.  
- Secrets in **Key Vault**; Managed Identity for resource access.  
- Regular dependency scans; SAST/DAST in CI; content safety reviews.

---

## 8) DevOps & Environments
- **Envs**: dev, staging, prod (separate Cosmos DB DBs or containers).  
- **CI/CD**: lint/test/build; infra deploy (Bicep/Terraform); app deploy; smoke tests.  
- **App Service**: Linux, Node 24; build Angular → `/dist` into `/public`; Fastify serves static + API.  
- **Autoscale**: based on CPU, requests, or SignalR connections.

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

## 12) Resource Naming (initial)
- **App Service**: `HappyTalk`  
- **Cosmos**: `cosmoskhreq3` (DB: `khRequest`)  
- **SignalR**: `<region>-happytalk-signalr`

