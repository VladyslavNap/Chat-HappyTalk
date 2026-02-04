
# HappyTalk — Product & Technical Roadmap

**Last updated:** 2026-02-04 12:30 UTC  
**Status:** M0 Complete ✅ | M1 ~90% Complete 🎉  
**Hosting:** Azure App Service (single app hosts frontend + backend)  
**Backend:** Node.js 24 LTS (Fastify)  
**Frontend:** Angular 21 PWA with Signals (served by backend)  
**Realtime:** Azure SignalR Service (Web PubSub)  
**Data:** Azure Cosmos DB (API for SQL) — **Account:** `cosmoskhreq3`, **DB:** `khRequest`  
**Storage:** Azure Blob Storage — **Account:** `happytalkstorage`, **Container:** `$web`

---

## Current Status: M1 Almost Complete! 🚀

**Progress:**
- ✅ M0 - Foundations (100%)
- 🎉 M1 - MVP (~90% complete)
  - ✅ Core chat features
  - ✅ Authentication & admin approval
  - ✅ Contacts management
  - ✅ Private groups
  - ✅ Photo uploads
  - ✅ User profiles
  - ✅ Admin message controls
  - ⏳ Guardian consent flow
  - ⏳ Offline queue
  - ⏳ Full telemetry

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
- **Cosmos DB (SQL API)**: Logical containers for `users`, `contacts`, `groups`, `rooms`, `messages`.  
- **Blob Storage**: `happytalkstorage` for user avatars, group photos, file uploads ($web container).  
- **Authentication**: JWT-based with email/password; Google OAuth prepared; admin approval workflow.  
- **Admin System**: Primary admin `naprikovsky@gmail.com`; can edit/delete any message.  
- **App Insights** for logs/metrics/traces; **Key Vault** for secrets (ready); **App Config/Feature Flags** for gradual rollout.  
- **CI/CD** via GitHub Actions; IaC via Bicep/Terraform (planned).

---

## 2.5) What's Been Delivered (M0 + M1) 🎉

### Frontend (Angular 21 + TypeScript)
**8 Major Components:**
1. **ContactsListComponent** (618 lines) - Full contact management
2. **CreateGroupComponent** (503 lines) - Group creation with member selection
3. **PhotoUploadComponent** (440 lines) - Drag & drop photo uploads
4. **ProfileComponent** (488 lines) - User profile with avatar upload
5. **Chat Component** (450+ lines) - Real-time chat with admin controls
6. **UserList** - Online users with status indicators
7. **RoomList** - Chat rooms navigation
8. **Login** - Authentication UI

**7 Services:**
- `AuthService` - JWT auth, super admin checks
- `ContactsService` - Reactive contacts with Signals
- `GroupsService` - Reactive groups with Signals
- `UploadService` - Photo uploads to Blob Storage
- `SignalRService` - Real-time messaging
- `CosmosService` - Database operations (backend)
- `BlobStorageService` - File storage (backend)

**5 Models:**
- `auth.model.ts` - User, auth types
- `contact.model.ts` - Contact types
- `group.model.ts` - Group types
- `room.model.ts` - Room types
- `dm.model.ts` - Direct message types

**4 Routes:**
- `/` - Chat (home)
- `/login` - Login page
- `/contacts` - Contacts management
- `/profile` - User profile

### Backend (Fastify + TypeScript)
**30+ API Endpoints:**
- 6 Authentication endpoints
- 8 Messages & Chat endpoints
- 6 Contacts endpoints
- 7 Groups endpoints
- 3 Upload endpoints
- 3 Presence endpoints

**5 Cosmos DB Containers:**
- `chat_messages` - All messages with TTL
- `users` - User accounts
- `contacts` - User contacts
- `groups` - Private groups
- `rooms` - Chat rooms

**Blob Storage:**
- User avatars in `avatars/`
- Group photos in `groups/`
- Public access via CDN

### Features Delivered
✅ Real-time messaging (SignalR)  
✅ Persistent storage (Cosmos DB)  
✅ Authentication (JWT + bcrypt)  
✅ Contacts management (add, search, favorites)  
✅ Private groups (create, manage)  
✅ Photo uploads (avatars, groups)  
✅ User profiles (view, edit)  
✅ Admin controls (edit/delete messages)  
✅ Online/offline status  
✅ Progressive Web App  
✅ Responsive design  
✅ Accessibility (WCAG AA)

### Code Statistics
- **Total Lines**: ~6,000+
- **Type Safety**: 100% TypeScript
- **Build Size**: ~420KB (gzipped ~100KB)
- **API Coverage**: 30+ endpoints
- **Test Coverage**: Unit tests for core services

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

### M1 — MVP (Weeks 2–6) 🎉 ~90% COMPLETE
#### ✅ Completed Features
- ✅ **Chat Core (full)**: Public rooms, 1:1 DMs, presence indicators
- ✅ **PWA**: App shell cached, service worker active, installable
- ✅ **Message persistence**: Cosmos DB stores all messages with TTL
- ✅ **Real-time delivery**: SignalR broadcasts messages instantly
- ✅ **Authentication (complete)**:
  - ✅ User registration with email/password
  - ✅ JWT token management (24-hour expiry)
  - ✅ Secure password hashing (bcrypt, 10 rounds)
  - ✅ Admin approval system (primary: `naprikovsky@gmail.com`)
  - ✅ Access request workflow in Cosmos DB
  - ⏳ Google OAuth 2.0 sign-in (prepared, not deployed)
- ✅ **Contacts Management (NEW)**:
  - ✅ Add/remove contacts by email or username
  - ✅ Contact search functionality
  - ✅ Nickname customization
  - ✅ Favorite contacts (starred)
  - ✅ Real-time online/offline status
  - ✅ Contacts stored in Cosmos DB
- ✅ **Private Groups (NEW)**:
  - ✅ Create groups with selected members
  - ✅ Add/remove group members
  - ✅ Group photo uploads
  - ✅ Group management UI
  - ✅ Groups stored in Cosmos DB
- ✅ **User Profiles (NEW)**:
  - ✅ View and edit profile page
  - ✅ Display name editing
  - ✅ Avatar photo uploads
  - ✅ Profile navigation integration
- ✅ **Admin Controls (NEW)**:
  - ✅ Super admin can edit any message
  - ✅ Super admin can delete any message
  - ✅ Edited message badges
  - ✅ Admin-only UI controls
  - ✅ Confirmation dialogs
- ✅ **File Storage (complete)**:
  - ✅ Azure Blob Storage integration
  - ✅ Avatar uploads (drag & drop)
  - ✅ Group photo uploads
  - ✅ File validation (type, size)
  - ✅ Public URL access
  - ✅ Delete functionality
- ✅ **Moderation v1**: Message TTL (30 days default), profanity filter foundation

#### ⏳ Remaining M1 Tasks
- ⏳ **Auth & Consent**: Child profile + guardian email consent flow
- ⏳ **Offline**: Retry queue for sends when offline
- ⏳ **Ops**: Blue/green deploy, autoscale rules
- ⏳ **Telemetry**: Complete message latency tracking, join/leave analytics

#### 📊 M1 Metrics
- **API Endpoints**: 30+ implemented (from 6)
- **Frontend Components**: 8 major components
- **Services**: 7 services (auth, contacts, groups, upload, signalr, cosmos, blob)
- **Data Containers**: 5 containers (messages, users, rooms, contacts, groups)
- **Lines of Code**: ~6,000+
- **Type Safety**: 100% TypeScript

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
#### **chat_messages** (container)
Partition by `roomid`
```typescript
{
  id: string,           // GUID
  roomid: string,       // partition key (e.g., "public")
  text: string,         // message content
  senderName: string,   // display name
  senderId?: string,    // user ID
  createdAt: string,    // ISO 8601 timestamp
  editedAt?: string,    // when edited (admin only)
  isEdited?: boolean,   // edited flag
  clientId?: string,    // for deduplication
  ttl?: number          // optional retention (30 days default)
}
```

#### **users** (container) ✅
Partition by `id`
```typescript
{
  id: string,              // GUID
  email: string,           // unique, indexed
  username: string,        // unique, indexed
  passwordHash: string,    // bcrypt hash
  displayName: string,     // user's display name
  avatarUrl?: string,      // blob storage URL
  googleId?: string,       // OAuth ID
  isApproved: boolean,     // admin approval flag
  approvedBy?: string,     // admin who approved
  approvedAt?: string,     // approval timestamp
  createdAt: string,       // ISO 8601
  lastLoginAt?: string     // last login timestamp
}
```

#### **contacts** (container) ✅
Partition by `userId`
```typescript
{
  id: string,              // GUID
  userId: string,          // partition key (owner)
  contactUserId: string,   // contact's user ID
  nickname?: string,       // custom display name
  isFavorite: boolean,     // starred contact
  createdAt: string,       // ISO 8601
  updatedAt?: string       // last updated
}
```

#### **groups** (container) ✅
Partition by `id`
```typescript
{
  id: string,              // GUID (partition key)
  name: string,            // group name
  description?: string,    // group description
  photoUrl?: string,       // blob storage URL
  createdBy: string,       // creator user ID
  memberIds: string[],     // array of user IDs
  createdAt: string,       // ISO 8601
  updatedAt?: string       // last updated
}
```

#### **rooms** (container) ✅
Partition by `id`
```typescript
{
  id: string,              // GUID (partition key)
  name: string,            // room name
  type: string,            // "public" | "private" | "dm"
  members?: string[],      // user IDs (for private/dm)
  createdBy?: string,      // creator user ID
  createdAt: string,       // ISO 8601
  lastActivity?: string    // last message timestamp
}
```

### Planned (M2+)
- **access_requests**: `id`, `userId`, `email`, `status` (pending/approved/rejected), `requestedAt`, `reviewedBy`, `reviewedAt`
- **guardians**: `id`, `email`, `consent`, `linkedUserIds[]` (future child safety feature)  
- **reports**: `id`, `messageId`, `reporterId`, `reason`, `status`  
- **events**: audit + analytics (short TTL)

**Storage Policies:**
- Selective indexing on frequently queried fields
- TTL on `messages` (30 days) & `events` (7 days)
- Change Feed for moderation/analytics
- Partition strategies optimized for queries

**Blob Storage Structure ($web container):**
- **User avatars**: `avatars/{userId}.{ext}`
- **Group photos**: `groups/{groupId}.{ext}`
- **File uploads**: `uploads/{roomid}/{messageId}/{filename}` (future)
- **Static assets**: `https://happytalkstorage.z1.web.core.windows.net/`

---

## 5) API Surface

### Implemented ✅

#### **Authentication** (6 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Email/password registration | No |
| POST | `/api/auth/login` | Email/password login | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Current user profile | Yes |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes |
| POST | `/api/auth/google` | Google OAuth callback | No |

#### **Messages & Chat** (8 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| POST | `/api/negotiate` | SignalR negotiation (WebSocket URL) | Yes |
| GET | `/api/messages/:roomid` | Get message history (paginated) | Yes |
| POST | `/api/messages` | Send new message (persists + broadcasts) | Yes |
| PATCH | `/api/messages/:id` | Edit message (admin only) | Admin |
| DELETE | `/api/messages/:id` | Delete message (admin only) | Admin |
| POST | `/api/rooms/:roomid/join` | Join SignalR group | Yes |
| POST | `/api/rooms/:roomid/leave` | Leave SignalR group | Yes |

#### **Contacts** (6 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/contacts` | List user's contacts | Yes |
| GET | `/api/contacts/search` | Search users by email/username | Yes |
| POST | `/api/contacts` | Add new contact | Yes |
| PATCH | `/api/contacts/:id` | Update contact (nickname, favorite) | Yes |
| DELETE | `/api/contacts/:id` | Remove contact | Yes |
| POST | `/api/contacts/status` | Bulk status check (online/offline) | Yes |

#### **Groups** (7 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/groups` | List user's groups | Yes |
| GET | `/api/groups/:id` | Get group details | Yes |
| POST | `/api/groups` | Create new group | Yes |
| PATCH | `/api/groups/:id` | Update group info | Yes |
| POST | `/api/groups/:id/members` | Add members to group | Yes |
| DELETE | `/api/groups/:id/members/:memberId` | Remove member from group | Yes |
| DELETE | `/api/groups/:id` | Delete group | Yes |

#### **Uploads** (3 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/avatar` | Upload user avatar to blob storage | Yes |
| POST | `/api/upload/group/:id/photo` | Upload group photo to blob storage | Yes |
| DELETE | `/api/upload/avatar` | Delete user avatar | Yes |

#### **Presence** (3 endpoints)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat/connected` | User connected notification | Yes |
| POST | `/api/chat/disconnected` | User disconnected notification | Yes |
| GET | `/api/users/online` | Get list of online users | Yes |

**Total Implemented:** 30+ endpoints

### Planned (M2+)
- **Admin:**
  - `GET /admin/access-requests` — List pending requests (admin only)
  - `POST /admin/access-requests/:id/approve` — Approve user (admin only)
  - `POST /admin/access-requests/:id/reject` — Reject user (admin only)
- **Rooms:**
  - `GET /rooms` / `POST /rooms` — Room management
  - `PATCH /rooms/:id` — Update room info
- **Moderation:**
  - `POST /reports` — Report message
  - `POST /auth/consent` — Guardian consent (future)
  - `GET /admin/reports` — View reports (admin only)

---

## 6) Realtime & PWA

### Implemented ✅
- **SignalR Client**: `@azure/web-pubsub-client` in Angular service
- **Connection**: Negotiate → WebSocket → Join group
- **Broadcast**: Server sends messages to room groups
- **SW Caching**: App shell prefetch, API freshness strategy
- **Presence**: Join/leave events, online status tracking
- **Message Delivery**: Real-time broadcast on new messages
- **Admin Events**: Edit/delete message sync across clients
- **Reconnection**: Automatic reconnect on disconnect
- **Polling Fallback**: 2-second polling when WebSocket unavailable

### Planned (M2+)
- **Typing indicators**: Ephemeral events (not persisted)
- **Offline queue**: Queue outbound messages; reconcile on reconnect
- **Delivery states**: Sent → delivered → read receipts
- **Push notifications**: Web Push API integration
- **Background sync**: Service worker background sync

---

## 7) Security & Safety

### Implemented ✅
- **JWT Authentication**: 24-hour token expiry
- **Password Security**: bcrypt hashing (10 rounds)
- **Admin Authorization**: Email-based super admin (`naprikovsky@gmail.com`)
- **Message Moderation**: Admin can edit/delete any message
- **Route Guards**: Auth required for protected routes
- **CORS**: Configured for blob storage uploads
- **File Validation**: Type and size checks (max 5MB)
- **Secrets Management**: Azure Key Vault integration ready
- **HTTPS Only**: Enforced in production

### Planned (M2+)
- Enforce nickname rules and word filters
- Report thresholds and automated actions
- Rate limit joins/messages per user
- CAPTCHA challenges on abuse signals
- **Managed Identity** for resource access (no secrets in code)
- Regular dependency scans (SAST/DAST in CI)
- Content safety reviews and profanity filtering

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

## 12) Resource Naming & Configuration

### Implemented ✅
- **App Service**: `HappyTalk` ✅
  - Runtime: Node.js 24 LTS
  - Startup: `node dist/server/server.js`
  - WebSockets: Enabled
- **Cosmos DB**: `cosmoskhreq3` ✅
  - Database: `khRequest`
  - Containers: 
    - `chat_messages` (partition: `roomid`) ✅
    - `users` (partition: `id`) ✅
    - `contacts` (partition: `userId`) ✅
    - `groups` (partition: `id`) ✅
    - `rooms` (partition: `id`) ✅
- **SignalR**: `tw-signalr-occupier` ✅
  - Mode: Default (serverless)
  - Hub: `chat`
- **Blob Storage**: `happytalkstorage` ✅
  - Container: `$web` (public access)
  - Public URL: `https://happytalkstorage.z1.web.core.windows.net/`
  - CORS: Enabled for uploads
- **Primary Admin**: `naprikovsky@gmail.com` ✅
  - Can edit/delete any message
  - Configured via `PRIMARY_ADMIN_EMAIL` env variable
- **GitHub Actions**: `main_happytalk.yml` ✅
  - CI/CD pipeline: build + deploy on push to `main`
  - Federated identity (OIDC) authentication

### Environment Variables ✅
**Required:**
- `AZURE_SIGNALR_CONNECTION_STRING`
- `COSMOS_ENDPOINT`
- `COSMOS_KEY`
- `COSMOS_DATABASE_NAME` = `khRequest`
- `AZURE_STORAGE_CONNECTION_STRING`
- `BLOB_CONTAINER_NAME` = `$web`
- `BLOB_PUBLIC_URL`
- `PRIMARY_ADMIN_EMAIL` = `naprikovsky@gmail.com`
- `JWT_SECRET`

**Optional:**
- `PORT` (default: 3000)
- `LOG_LEVEL` (default: info)
- `CHAT_TTL_SECONDS` (default: 2592000 = 30 days)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

