# HappyTalk - Quick Start Guide

## 🚀 Quick Reference

```bash
# Install dependencies
npm install

# Development (frontend only)
npm start                    # http://localhost:4200

# Development (full stack)
npm run dev                  # http://localhost:3000

# Production build
npm run build:all

# Deploy to Azure
az webapp deploy --name HappyTalk --src-path . --type zip
```

**Super Admin:** Login as `naprikovsky@gmail.com` to access admin controls (edit/delete messages).

---

## 📦 Installation

```bash
git clone https://github.com/VladyslavNap/Chat-HappyTalk.git
cd Chat-HappyTalk
npm install
```

## 🔧 Prerequisites

- **Node.js 24.x LTS** or higher
- **npm 10.x** or higher
- Azure resources (for full functionality):
  - Azure SignalR Service
  - Azure Cosmos DB SQL API
  - Azure Blob Storage (for photo uploads)

## 🚀 Development

### Frontend only (no backend, mock data):
```bash
npm start
# App runs at http://localhost:4200
```

### Full stack (with Azure services):

**Step 1: Set up environment variables**

```powershell
# Copy the template
Copy-Item .env.example .env

# Edit .env and add your Azure credentials
notepad .env
```

**Required environment variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SIGNALR_CONNECTION_STRING` | Azure SignalR connection string | From Azure Portal → SignalR → Keys |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL | `https://cosmoskhreq3.documents.azure.com:443/` |
| `COSMOS_KEY` | Cosmos DB primary key | From Azure Portal → Cosmos DB → Keys |
| `COSMOS_DATABASE_NAME` | Database name | `khRequest` |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection string | From Azure Portal → Storage Account → Keys |
| `BLOB_CONTAINER_NAME` | Blob container for photos | `$web` |
| `BLOB_PUBLIC_URL` | Public URL for blob storage | `https://yourstorage.z1.web.core.windows.net/` |
| `PRIMARY_ADMIN_EMAIL` | Super admin email address | `naprikovsky@gmail.com` |
| `JWT_SECRET` | Secret key for JWT tokens | Any strong random string (min 32 chars) |

**Step 2: Build and run**

```bash
# The server automatically loads .env file
npm run dev

# App runs at http://localhost:3000
```

**Alternative: Use setup script (validates .env)**
```powershell
.\setup-dev.ps1
```

## 🏗️ Build

```bash
# Full production build (frontend + backend)
npm run build:all

# Output:
#   dist/happy-talk/browser/ (Angular)
#   dist/server/ (Fastify)
```

## 🧪 Test

```bash
# Run unit tests
npm test

# Run e2e tests
npm run e2e

# Lint code
npm run lint

# Check build
npm run build:all
```

## 🐛 Troubleshooting

### Build Issues

**Problem:** `npm install` fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**Problem:** Build fails with TypeScript errors
```bash
# Check Node.js version (must be 24.x+)
node --version

# Rebuild from scratch
npm run clean
npm run build:all
```

### Runtime Issues

**Problem:** Server won't start
- Check `.env` file exists and has all required variables
- Verify Azure connection strings are valid
- Check port 3000 is not already in use

**Problem:** Real-time messages not working
- Verify `AZURE_SIGNALR_CONNECTION_STRING` is set correctly
- Check SignalR service is running in Azure Portal
- Ensure WebSockets are enabled in Azure App Service

**Problem:** Photo uploads failing
- Verify `AZURE_STORAGE_CONNECTION_STRING` is correct
- Check blob container `$web` exists
- Verify CORS is configured on blob storage
- Check file size (max 5MB)

**Problem:** Admin controls not visible
- Login as user with email matching `PRIMARY_ADMIN_EMAIL`
- Clear browser cache and reload
- Check browser console for errors

### Database Issues

**Problem:** Can't connect to Cosmos DB
- Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` are correct
- Check database name is `khRequest`
- Ensure firewall allows your IP in Cosmos DB settings

**Problem:** Messages not persisting
- Check Cosmos DB containers exist: `messages`, `users`, `rooms`, `contacts`, `groups`
- Verify partition keys are configured correctly
- Check Cosmos DB logs for errors

## 🔒 Security Notes

### Authentication
- JWT tokens expire after 24 hours
- Passwords are hashed using bcrypt (10 rounds)
- Never commit `.env` file to Git

### Admin Access
- Only one super admin (set via `PRIMARY_ADMIN_EMAIL`)
- Admin API endpoints validate email on every request
- Client-side admin UI hidden, but backend always validates

### Photo Uploads
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, WebP
- Files stored in Azure Blob Storage with public access
- Consider adding malware scanning for production

## 🚀 Performance Tips

### Frontend
- Use production build: `npm run build`
- Enable gzip compression on server
- Implement lazy loading for routes
- Use Angular OnPush change detection

### Backend
- Enable Azure App Service "Always On"
- Use Azure CDN for static assets
- Configure Cosmos DB indexing properly
- Monitor and optimize RU consumption

### Caching
- Implement Redis for session storage (optional)
- Cache frequently accessed Cosmos DB queries
- Use browser caching for static assets

## 🌐 Deploy to Azure App Service

### 1. Set Application Settings

In Azure Portal → App Service → Configuration → Application Settings:

| Setting | Value | Description |
|---------|-------|-------------|
| `AZURE_SIGNALR_CONNECTION_STRING` | Your SignalR connection string | Real-time messaging |
| `COSMOS_ENDPOINT` | `https://cosmoskhreq3.documents.azure.com:443/` | Database endpoint |
| `COSMOS_KEY` | Your Cosmos DB key | Database authentication |
| `COSMOS_DATABASE_NAME` | `khRequest` | Database name |
| `AZURE_STORAGE_CONNECTION_STRING` | Your Storage connection string | Photo storage |
| `BLOB_CONTAINER_NAME` | `$web` | Container for uploads |
| `BLOB_PUBLIC_URL` | `https://happytalkstorage.z1.web.core.windows.net/` | Public storage URL |
| `PRIMARY_ADMIN_EMAIL` | `naprikovsky@gmail.com` | Super admin email |
| `JWT_SECRET` | Your strong secret key | Token signing |

### 2. Configure Azure Storage (for photo uploads)

1. Create a Storage Account in Azure Portal
2. Create a container named `$web` with public access
3. Enable CORS for blob service:
   - Allowed origins: `*` (or your domain)
   - Allowed methods: `GET, PUT, POST, DELETE, OPTIONS`
   - Allowed headers: `*`
   - Max age: `3600`

### 3. Configure Startup

- **Runtime**: Node.js 24 LTS
- **Startup command**: `node dist/server/server.js`
- **WebSockets**: Enabled (for SignalR)
- **Always On**: Enabled (recommended)

### 4. Deploy

**PowerShell (Windows):**
```powershell
npm run build:all
az webapp deploy --name HappyTalk --src-path . --type zip
```

**Bash (Linux/macOS):**
```bash
npm run build:all
az webapp deploy --name HappyTalk --src-path . --type zip
```

**Or use GitHub Actions** (recommended - see `.github/workflows/main_happytalk.yml`)

## ✨ Features

### Core Features
- ✅ **Real-time messaging** (Azure SignalR)
- ✅ **Persistent chat history** (Cosmos DB)
- ✅ **User authentication** (JWT-based)
- ✅ **Public & private chat rooms**
- ✅ **Direct messaging (DMs)**

### Contacts & Social
- ✅ **Contacts management** (add, remove, search)
- ✅ **Contact nicknames** (personalize contact names)
- ✅ **Favorite contacts** (star your favorites)
- ✅ **Real-time online/offline status**
- ✅ **User search** (find users by name/email)

### Groups
- ✅ **Private groups** (create groups with selected members)
- ✅ **Group management** (add/remove members)
- ✅ **Group photos** (upload group avatars)

### Media & Profile
- ✅ **Photo uploads** (drag & drop avatar photos)
- ✅ **Azure Blob Storage** integration
- ✅ **User profiles** (view and edit profile)
- ✅ **Display name editing**

### Admin Controls
- ✅ **Message editing** (super admin can edit any message)
- ✅ **Message deletion** (super admin can delete messages)
- ✅ **Edited badges** (shows when messages are edited)
- ✅ **Admin-only UI** (controls only visible to super admin)

### Technical
- ✅ **Progressive Web App** (installable on mobile/desktop)
- ✅ **Service Worker** (offline support)
- ✅ **Responsive design** (mobile, tablet, desktop)
- ✅ **Accessible** (WCAG AA compliant)
- ✅ **Co-hosted** (Angular + Fastify in one deployment)
- ✅ **TypeScript** (100% type-safe)

## 📱 User Roles

### Regular Users Can:
- Send and receive messages
- Create and join rooms
- Send direct messages
- Add contacts and manage favorites
- Create private groups
- Upload avatar photos
- Edit their profile

### Super Admin Can (in addition):
- Edit any message (shows ✏️ button)
- Delete any message (shows 🗑️ button)
- See edit history (via "Edited" badges)
- Moderate all content

**Super Admin Email:** Set via `PRIMARY_ADMIN_EMAIL` environment variable

## 🔧 Tech Stack

### Frontend
- **Angular 21.1.0** - Modern reactive framework with Signals
- **TypeScript 5.9.2** - Type-safe development
- **SCSS** - Advanced styling
- **Angular Signals** - Reactive state management
- **RxJS** - Reactive programming
- **Service Worker** - Offline support & PWA

### Backend
- **Fastify 5.x** - High-performance Node.js framework
- **TypeScript** - End-to-end type safety
- **JWT** - Secure authentication
- **Dotenv** - Environment configuration

### Azure Services
- **Azure SignalR Service** - Real-time WebSocket messaging
- **Azure Cosmos DB (SQL API)** - NoSQL database
- **Azure Blob Storage** - Photo/file storage
- **Azure App Service** - Hosting platform

### DevOps
- **GitHub Actions** - CI/CD pipeline
- **Azure CLI** - Deployment automation
- **npm scripts** - Build automation

## 📂 Project Structure

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
│   │   │   ├── chat/             # Main chat page
│   │   │   ├── login/            # Login page
│   │   │   └── profile/          # User profile page
│   │   ├── services/             # Angular services
│   │   │   ├── auth.service.ts   # Authentication
│   │   │   ├── contacts.service.ts  # Contacts management
│   │   │   ├── groups.service.ts    # Groups management
│   │   │   ├── signalr.service.ts   # Real-time messaging
│   │   │   └── upload.service.ts    # Photo uploads
│   │   ├── models/               # TypeScript interfaces
│   │   └── guards/               # Route guards
│   └── environments/             # Environment configs
├── server/                       # Fastify backend
│   ├── routes/                   # API routes
│   │   ├── api.ts               # Main API router
│   │   ├── contacts.ts          # Contacts endpoints
│   │   ├── groups.ts            # Groups endpoints
│   │   └── upload.ts            # Upload endpoints
│   ├── services/                 # Backend services
│   │   ├── auth.service.ts      # JWT & auth
│   │   ├── blob-storage.service.ts  # Azure Blob
│   │   ├── cosmos.service.ts    # Cosmos DB
│   │   └── signalr.service.ts   # SignalR integration
│   ├── models/                   # Data models
│   └── server.ts                 # Server entry point
├── public/                       # Static assets
├── dist/                         # Build output
└── docs/                         # Documentation
    ├── FEATURE_IMPLEMENTATION_STATUS.md
    ├── UI_COMPONENTS_README.md
    └── QUICK_START_GUIDE.md
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Messages
- `GET /api/messages/:roomid` - Get messages
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id` - Edit message (admin)
- `DELETE /api/messages/:id` - Delete message (admin)

### Contacts
- `GET /api/contacts` - List contacts
- `GET /api/contacts/search` - Search users
- `POST /api/contacts` - Add contact
- `PATCH /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Remove contact
- `POST /api/contacts/status` - Bulk status check

### Groups
- `GET /api/groups` - List user's groups
- `GET /api/groups/:id` - Get group details
- `POST /api/groups` - Create group
- `PATCH /api/groups/:id` - Update group
- `POST /api/groups/:id/members` - Add members
- `DELETE /api/groups/:id/members/:memberId` - Remove member
- `DELETE /api/groups/:id` - Delete group

### Uploads
- `POST /api/upload/avatar` - Upload user avatar
- `POST /api/upload/group/:id/photo` - Upload group photo
- `DELETE /api/upload/avatar` - Delete avatar

### Presence
- `POST /api/chat/connected` - User connected
- `POST /api/chat/disconnected` - User disconnected
- `GET /api/users/online` - Get online users

## 📚 Documentation

- **[FEATURE_IMPLEMENTATION_STATUS.md](./FEATURE_IMPLEMENTATION_STATUS.md)** - Complete backend API reference
- **[UI_COMPONENTS_README.md](./UI_COMPONENTS_README.md)** - Frontend components guide
- **[PROJECT_COMPLETE_SUMMARY.md](./PROJECT_COMPLETE_SUMMARY.md)** - Overall project summary
- **[QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)** - Integration guide with code examples
- **[AZURE_DEPLOYMENT.md](./AZURE_DEPLOYMENT.md)** - Azure deployment instructions

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes and commit:** `git commit -m 'Add amazing feature'`
4. **Push to your branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and test
npm run dev
npm test

# 3. Build to verify
npm run build:all

# 4. Commit and push
git add .
git commit -m "feat: add my feature"
git push origin feature/my-feature
```

### Code Style

- Follow existing TypeScript/Angular conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Write unit tests for new features
- Ensure accessibility (ARIA labels, keyboard navigation)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Azure Services** - SignalR, Cosmos DB, Blob Storage
- **Angular Team** - Amazing framework
- **Fastify Team** - Fast and efficient backend
- **Contributors** - Thank you to all who helped!

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/VladyslavNap/Chat-HappyTalk/issues)
- **Discussions:** [GitHub Discussions](https://github.com/VladyslavNap/Chat-HappyTalk/discussions)
- **Email:** Open an issue for support

## 🎯 Roadmap

### Planned Features
- [ ] Voice/video calls integration
- [ ] Message reactions (emojis)
- [ ] File attachments (documents, media)
- [ ] Message threading
- [ ] Rich text formatting
- [ ] Message search
- [ ] User blocking
- [ ] Notification system
- [ ] Mobile native apps (Ionic/Capacitor)
- [ ] End-to-end encryption

### Current Version: 1.0.0

**Status:** Production Ready ✅

---

**Built with ❤️ using Angular, Fastify, and Azure**
