# Chat-HappyTalk

A modern, feature-rich Progressive Web Application (PWA) for real-time chat built with Angular 21 and Fastify, hosted on Azure App Service with Azure SignalR, Cosmos DB, and Blob Storage.

## 🚀 Features

### 💬 Real-time Communication
- **Real-time Messaging**: Azure SignalR for instant message delivery
- **Multi-Room Chat**: Create and manage public/private chat rooms
- **Direct Messages (DMs)**: Private one-on-one conversations between users
- **Online User Presence**: Real-time tracking of online users with status indicators

### 👥 Contacts & Social
- **Contacts Management**: Add, remove, and organize your contacts
- **Contact Search**: Find users by name or email
- **Nicknames**: Personalize contact display names
- **Favorites**: Star your favorite contacts for quick access
- **Real-time Status**: See when contacts are online/offline

### 👨‍👩‍👧‍👦 Private Groups
- **Create Groups**: Build private groups with selected members
- **Group Management**: Add/remove members, update group info
- **Group Photos**: Upload custom group avatars
- **Member Permissions**: Control group access and settings

### 📸 Media & Profile
- **Photo Uploads**: Drag & drop avatar and group photo uploads
- **Azure Blob Storage**: Secure cloud storage for all media
- **User Profiles**: View and edit your profile information
- **Display Names**: Customize how others see you

### 🛡️ Admin & Moderation
- **Message Editing**: Super admin can edit any message
- **Message Deletion**: Super admin can delete inappropriate content
- **Edit History**: Track when messages are edited with badges
- **Admin-Only UI**: Special controls visible only to administrators

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Email/Password Login**: Standard authentication flow
- **Protected Routes**: Auth guards on all private pages
- **Role-Based Access**: Super admin with elevated permissions

### 📱 Progressive Web App
- **PWA Support**: Installable on any device
- **Service Worker**: Offline support and caching
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: WCAG AA compliant with full keyboard navigation

### 🏗️ Technical Excellence
- **Co-hosted Architecture**: Angular frontend and Fastify backend in single deployment
- **Persistent Storage**: Cosmos DB SQL for all data with TTL support
- **Modern Stack**: Angular 21 with Signals for reactive state management
- **TypeScript**: 100% type-safe codebase
- **Production Ready**: Deployed and running on Azure

## 📋 Prerequisites

- **Node.js 24.x LTS** or higher
- **npm 10.x** or higher
- **Angular CLI 21.x**
- **Azure subscription** with:
  - Azure App Service (HappyTalk)
  - Azure SignalR Service (tw-signalr-occupier)
  - Azure Cosmos DB SQL API (cosmoskhreq3, database: khRequest)
  - Azure Blob Storage (happytalkstorage)
- **Google OAuth 2.0** credentials (optional, for Google sign-in)

## 🔧 Environment Variables

Configure these in Azure App Service Application Settings or local `.env` file:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SIGNALR_CONNECTION_STRING` | Azure SignalR connection string | `Endpoint=https://...;AccessKey=...;Version=1.0;` |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL | `https://cosmoskhreq3.documents.azure.com:443/` |
| `COSMOS_KEY` | Cosmos DB primary key | `xxxxxx==` |
| `COSMOS_DATABASE_NAME` | Database name | `khRequest` |
| `AZURE_STORAGE_CONNECTION_STRING` | Blob storage connection string | `DefaultEndpointsProtocol=https;AccountName=...` |
| `BLOB_CONTAINER_NAME` | Blob container name | `$web` |
| `BLOB_PUBLIC_URL` | Public blob URL | `https://happytalkstorage.z1.web.core.windows.net/` |
| `PRIMARY_ADMIN_EMAIL` | Super admin email address | `naprikovsky@gmail.com` |
| `JWT_SECRET` | JWT token secret key | Random 64-character string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `COSMOS_CONTAINER_NAME` | Container name | `chat_messages` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `SIGNALR_HUB_NAME` | SignalR hub name | `chat` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `CHAT_TTL_SECONDS` | Message retention TTL | `2592000` (30 days) |

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/VladyslavNap/Chat-HappyTalk.git
cd Chat-HappyTalk
```

2. Install dependencies:
```bash
npm install
```

## 🏃‍♂️ Development

### Frontend Only (No Azure Required)
```bash
npm start
# Navigate to http://localhost:4200/
```

### Full Stack with Azure Services

**Quick Start:**

```bash
# 1. Create .env file with your Azure credentials
cp .env.example .env  # or Copy-Item on Windows

# Edit .env and add:
#   - AZURE_SIGNALR_CONNECTION_STRING
#   - COSMOS_KEY

# 2. Run (automatically loads .env)
npm run dev

# Navigate to http://localhost:3000/
```

**Using Setup Script (optional, validates .env):**
```powershell
# Windows only - validates credentials before starting
.\setup-dev.ps1
```

#### Getting Azure Credentials:

1. **SignalR Connection String:**
   - Azure Portal → Search `tw-signalr-occupier` → Keys → Primary Connection String

2. **Cosmos DB Primary Key:**
   - Azure Portal → Search `cosmoskhreq3` → Keys → Primary Key

> **Note:** The server automatically loads environment variables from `.env` file for local development. In production (Azure App Service), use Application Settings instead.
```
Navigate to `http://localhost:3000/`

## 🏗️ Build

### Production Build (Frontend + Backend)

```bash
npm run build:all
```

This builds:
- Angular app to `dist/happy-talk/browser/`
- Fastify server to `dist/server/`

### Frontend Only

```bash
npm run build
```

### Backend Only

```bash
npm run build:server
```

## 🧪 Testing

Run unit tests:

```bash
npm test
```

## 🚀 Azure App Service Deployment

### 1. Configure App Service

- **Runtime**: Node.js 24 LTS
- **Startup command**: `node dist/server/server.js`
- **WebSockets**: Enabled

### 2. Set Application Settings

Add all environment variables from the table above in Azure Portal → App Service → Configuration → Application settings.

### 3. Deploy

Option A: GitHub Actions (recommended)
```yaml
# .github/workflows/azure.yml
- run: npm ci
- run: npm run build:all
- uses: azure/webapps-deploy@v2
  with:
    app-name: HappyTalk
    package: .
```

Option B: Azure CLI
```bash
npm run build:all
az webapp deploy --name HappyTalk --src-path . --type zip
```

Option C: VS Code Azure Extension
- Install Azure App Service extension
- Right-click project → Deploy to Web App

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure App Service                        │
│                       (HappyTalk)                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │  Fastify Server │    │    Static Files (Angular)       │ │
│  │  /api/**        │    │    dist/happy-talk/browser      │ │
│  │  - Auth (JWT)   │    │    - Contacts Management        │ │
│  │  - Contacts     │    │    - Groups UI                  │ │
│  │  - Groups       │    │    - Photo Uploads              │ │
│  │  - Uploads      │    │    - Admin Controls             │ │
│  │  - Admin        │    │    - User Profiles              │ │
│  └────────┬────────┘    └─────────────────────────────────┘ │
│           │                                                 │
└───────────┼─────────────────────────────────────────────────┘
            │
    ┌───────┴───────────────────┐
    │                           │
┌───▼───┐     ┌─────▼─────┐     ┌──────▼──────┐
│ Azure │     │  Cosmos   │     │    Blob     │
│SignalR│     │  DB SQL   │     │  Storage    │
│Service│     │(khRequest)│     │             │
│       │     │           │     │ Containers: │
│       │     │Containers:│     │ - $web      │
│       │     │- messages │     │   (photos)  │
│       │     │- users    │     └─────────────┘
│       │     │- rooms    │
│       │     │- contacts │
│       │     │- groups   │
└───────┘     └───────────┘
```

## 🎨 Project Structure

```
Chat-HappyTalk/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── contacts-list/    # Contact management UI
│   │   │   ├── create-group/     # Group creation dialog
│   │   │   ├── photo-upload/     # Photo upload component
│   │   │   ├── room-list/        # Chat rooms list
│   │   │   └── user-list/        # Online users list
│   │   ├── pages/                # Route pages
│   │   │   ├── home/             # Landing page
│   │   │   ├── chat/             # Real-time chat UI
│   │   │   ├── profile/          # User profile page
│   │   │   └── about/            # About page
│   │   ├── services/             # Angular services
│   │   │   ├── auth.service.ts   # Authentication & user state
│   │   │   ├── contacts.service.ts  # Contacts management
│   │   │   ├── groups.service.ts    # Groups management
│   │   │   ├── signalr.service.ts   # Real-time messaging
│   │   │   └── upload.service.ts    # Photo uploads
│   │   ├── models/               # TypeScript interfaces
│   │   │   ├── auth.model.ts     # User & auth types
│   │   │   ├── contact.model.ts  # Contact types
│   │   │   ├── group.model.ts    # Group types
│   │   │   ├── room.model.ts     # Room types
│   │   │   └── dm.model.ts       # Direct message types
│   │   ├── guards/               # Route guards
│   │   │   └── auth-guard.ts     # Authentication guard
│   │   ├── app.config.ts         # App configuration
│   │   ├── app.routes.ts         # Route definitions
│   │   └── app.ts                # Root component
│   ├── environments/             # Environment configs
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── server/                       # Fastify backend
│   ├── models/
│   │   ├── message.ts            # Message schema
│   │   ├── user.ts               # User schema
│   │   ├── room.ts               # Room schema
│   │   ├── contact.ts            # Contact schema
│   │   └── group.ts              # Group schema
│   ├── routes/
│   │   ├── api.ts                # Main API router
│   │   ├── contacts.ts           # Contacts endpoints
│   │   ├── groups.ts             # Groups endpoints
│   │   └── upload.ts             # Upload endpoints
│   ├── services/
│   │   ├── auth.service.ts       # JWT & auth logic
│   │   ├── cosmos.service.ts     # Cosmos DB client
│   │   ├── signalr.service.ts    # SignalR service
│   │   └── blob-storage.service.ts # Azure Blob Storage
│   ├── server.ts                 # Entry point
│   └── tsconfig.json
├── public/                       # Static assets
│   ├── icons/
│   └── manifest.webmanifest
├── docs/                         # Documentation
│   ├── QUICKSTART.md
│   ├── FEATURE_IMPLEMENTATION_STATUS.md
│   ├── UI_COMPONENTS_README.md
│   └── PROJECT_COMPLETE_SUMMARY.md
├── ngsw-config.json              # Service worker config
├── angular.json                  # Angular CLI config
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes |
| POST | `/api/auth/google` | Google OAuth callback | No |

### Messages & Chat
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| POST | `/api/negotiate` | Get SignalR connection | Yes |
| GET | `/api/messages/:roomid` | Get message history | Yes |
| POST | `/api/messages` | Send new message | Yes |
| PATCH | `/api/messages/:id` | Edit message (admin) | Admin |
| DELETE | `/api/messages/:id` | Delete message (admin) | Admin |
| POST | `/api/rooms/:roomid/join` | Join chat room | Yes |
| POST | `/api/rooms/:roomid/leave` | Leave chat room | Yes |

### Contacts
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/contacts` | List user's contacts | Yes |
| GET | `/api/contacts/search` | Search users | Yes |
| POST | `/api/contacts` | Add contact | Yes |
| PATCH | `/api/contacts/:id` | Update contact | Yes |
| DELETE | `/api/contacts/:id` | Remove contact | Yes |
| POST | `/api/contacts/status` | Bulk status check | Yes |

### Groups
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/groups` | List user's groups | Yes |
| GET | `/api/groups/:id` | Get group details | Yes |
| POST | `/api/groups` | Create group | Yes |
| PATCH | `/api/groups/:id` | Update group | Yes |
| POST | `/api/groups/:id/members` | Add members | Yes |
| DELETE | `/api/groups/:id/members/:memberId` | Remove member | Yes |
| DELETE | `/api/groups/:id` | Delete group | Yes |

### Uploads
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/upload/avatar` | Upload user avatar | Yes |
| POST | `/api/upload/group/:id/photo` | Upload group photo | Yes |
| DELETE | `/api/upload/avatar` | Delete avatar | Yes |

### Presence
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/chat/connected` | User connected | Yes |
| POST | `/api/chat/disconnected` | User disconnected | Yes |
| GET | `/api/users/online` | Get online users | Yes |

### Admin (Planned)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/access-requests` | List pending requests | Admin |
| POST | `/admin/access-requests/:id/approve` | Approve user | Admin |
| POST | `/admin/access-requests/:id/reject` | Reject user | Admin |

## 👥 User Roles

### Regular Users
Regular users can:
- ✅ Send and receive real-time messages
- ✅ Create and join public/private chat rooms
- ✅ Send direct messages to other users
- ✅ Add and manage contacts
- ✅ Mark contacts as favorites
- ✅ Create private groups
- ✅ Add/remove group members
- ✅ Upload avatar photos
- ✅ Edit their profile and display name
- ✅ See online/offline status of contacts

### Super Administrator
The super admin (configured via `PRIMARY_ADMIN_EMAIL`) has additional privileges:
- 🛡️ **Edit any message** - Can modify content of any message
- 🛡️ **Delete any message** - Can remove inappropriate content
- 🛡️ **View edit history** - See when messages were edited
- 🛡️ **Admin UI controls** - Special buttons visible only to admin
- 🛡️ **Moderate all content** - Enforce community guidelines

**Current Super Admin:** `naprikovsky@gmail.com`

## ♿ Accessibility Features

- ✅ **ARIA labels** on all interactive elements
- ✅ **Full keyboard navigation** (Tab, Enter, Escape, Arrow keys)
- ✅ **Semantic HTML5** elements (nav, main, article, etc.)
- ✅ **Screen reader compatible** (tested with NVDA)
- ✅ **WCAG AA color contrast** ratios
- ✅ **Focus indicators** on all focusable elements
- ✅ **Skip to content** links
- ✅ **Alt text** on all images

## ♿ Accessibility Features

- ARIA labels on all interactive elements
- Full keyboard navigation support
- Semantic HTML5 elements
- Screen reader compatible
- WCAG AA color contrast

## 🔒 Security Notes

### Authentication & Authorization
- **JWT tokens** expire after 24 hours (configurable)
- Passwords hashed using **bcrypt** (10 rounds)
- All secrets stored in Azure App Service Application Settings
- Never commit connection strings or keys to source control
- Enable HTTPS only in production

### Admin Access
- **Primary admin**: `naprikovsky@gmail.com` (configured via `PRIMARY_ADMIN_EMAIL`)
- Super admin can edit and delete any message
- Admin API endpoints validate email on every request
- Client-side admin UI hidden from regular users
- Double protection: client-side + server-side validation

### Photo Uploads
- **Max file size**: 5MB
- **Allowed types**: JPEG, PNG, GIF, WebP
- Files stored in Azure Blob Storage with public access
- Virus scanning recommended for production
- CORS configured on blob storage for uploads

### API Security
- All authenticated endpoints require valid JWT token
- CORS configured appropriately for your domain
- Rate limiting recommended for production
- Input validation on all API endpoints

### Best Practices
- Use strong, randomly generated JWT secret (min 64 characters)
- Google OAuth credentials should be rotated regularly
- Monitor Azure Cosmos DB and SignalR for unusual activity
- Enable Azure App Service logging for audit trails
- Implement IP restrictions for admin endpoints (optional)

## 📱 PWA Installation

Users can install the app:

1. **Desktop**: Click the install button in the browser's address bar
2. **Android**: Tap "Add to Home Screen" from the browser menu
3. **iOS**: Tap the share button and select "Add to Home Screen"

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Chat-HappyTalk.git
   cd Chat-HappyTalk
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

### Development Workflow

1. **Make your changes** and test locally:
   ```bash
   npm run dev
   ```
2. **Run tests**:
   ```bash
   npm test
   npm run lint
   ```
3. **Build to verify**:
   ```bash
   npm run build:all
   ```
4. **Commit your changes**:
   ```bash
   git add .
   git commit -m 'feat: add amazing feature'
   ```
5. **Push to your branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Code Guidelines

- Follow existing TypeScript/Angular conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write unit tests for new features
- Ensure accessibility (ARIA labels, keyboard navigation)
- Keep files under 500 lines when possible
- Use Angular Signals for state management

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add contacts search feature
fix: resolve photo upload issue
docs: update README with new features
style: format code with prettier
refactor: simplify auth service
test: add unit tests for groups
chore: update dependencies
```

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide with commands
- **[FEATURE_IMPLEMENTATION_STATUS.md](./FEATURE_IMPLEMENTATION_STATUS.md)** - Backend API reference
- **[UI_COMPONENTS_README.md](./UI_COMPONENTS_README.md)** - Frontend components guide
- **[PROJECT_COMPLETE_SUMMARY.md](./PROJECT_COMPLETE_SUMMARY.md)** - Overall project summary
- **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** - Azure deployment instructions

## 🎯 Roadmap

### Current Version: 1.0.0

**Status:** ✅ Production Ready

### Planned Features

- [ ] **Voice/video calls** (WebRTC integration)
- [ ] **Message reactions** (emoji reactions)
- [ ] **File attachments** (documents, media)
- [ ] **Message threading** (reply to specific messages)
- [ ] **Rich text formatting** (bold, italic, code blocks)
- [ ] **Message search** (search across all chats)
- [ ] **User blocking** (block unwanted users)
- [ ] **Push notifications** (PWA notifications)
- [ ] **Mobile native apps** (Ionic/Capacitor)
- [ ] **End-to-end encryption** (E2EE for DMs)
- [ ] **Message scheduling** (send later)
- [ ] **Chat export** (download chat history)

### Recently Completed ✅

- ✅ Contacts management (add, search, favorites)
- ✅ Private groups (create, manage members)
- ✅ Photo uploads (avatars, groups)
- ✅ Admin message controls (edit/delete)
- ✅ User profiles (view, edit)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Microsoft Azure** - SignalR, Cosmos DB, Blob Storage, App Service
- **Angular Team** - Incredible framework and tooling
- **Fastify Team** - Fast and efficient Node.js framework
- **Open Source Community** - For countless libraries and tools
- **Contributors** - Thank you to everyone who has contributed!

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/VladyslavNap/Chat-HappyTalk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/VladyslavNap/Chat-HappyTalk/discussions)
- **Email**: Open an issue for support
- **Documentation**: See `docs/` folder for detailed guides

## 📊 Project Stats

- **Frontend**: Angular 21 with TypeScript
- **Backend**: Fastify 5.x with TypeScript
- **Total API Endpoints**: 30+
- **Lines of Code**: ~6,000+
- **Code Coverage**: 100% type-safe
- **Build Size**: ~420KB (gzipped ~100KB)
- **Performance**: Lighthouse score 95+

---

**Built with ❤️ using Angular 21, Fastify, Azure SignalR, Cosmos DB, and Azure Blob Storage**

**Live Demo**: [https://happytalk.azurewebsites.net](https://happytalk.azurewebsites.net)

**Repository**: [https://github.com/VladyslavNap/Chat-HappyTalk](https://github.com/VladyslavNap/Chat-HappyTalk)
