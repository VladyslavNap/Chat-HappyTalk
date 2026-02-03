# Chat-HappyTalk

A modern Progressive Web Application (PWA) for real-time chat built with Angular 21 and Fastify, hosted on Azure App Service with Azure SignalR and Cosmos DB.

## 🚀 Features

- **Progressive Web App (PWA)**: Installable on any device, works offline
- **Real-time Messaging**: Azure SignalR for instant message delivery
- **Authentication**: Email/password registration + Google OAuth 2.0 sign-in
- **Admin Approval System**: Access requests reviewed by administrators
- **Persistent Chat History**: Cosmos DB SQL for message storage
- **File Storage**: Azure Blob Storage for avatars and file uploads
- **Co-hosted Architecture**: Angular frontend and Fastify backend in single Azure App Service
- **Service Worker**: Caches assets and optimizes API calls
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility First**: WCAG compliant with ARIA labels, keyboard navigation, and semantic HTML

## 📋 Prerequisites

- Node.js 24.x LTS or higher
- npm 10.x or higher
- Angular CLI 21.x
- Azure subscription with:
  - App Service (HappyTalk)
  - Azure SignalR Service (tw-signalr-occupier)
  - Cosmos DB SQL API (cosmoskhreq3, database: khRequest)
  - Azure Blob Storage (happytalkstorage)
- Google OAuth 2.0 credentials (optional, for Google sign-in)

## 🔧 Environment Variables

Configure these in Azure App Service Application Settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_SIGNALR_CONNECTION_STRING` | Azure SignalR connection string | `Endpoint=https://...;AccessKey=...;Version=1.0;` |
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL | `https://cosmoskhreq3.documents.azure.com:443/` |
| `COSMOS_KEY` | Cosmos DB primary key | `xxxxxx==` |
| `COSMOS_DATABASE_NAME` | Database name | `khRequest` |
| `COSMOS_CONTAINER_NAME` | Container name (optional) | `chat_messages` || `AZURE_STORAGE_CONNECTION_STRING` | Blob storage connection string | `DefaultEndpointsProtocol=https;AccountName=...` |
| `BLOB_CONTAINER_NAME` | Blob container name | `$web` |
| `BLOB_PUBLIC_URL` | Public blob URL | `https://happytalkstorage.z1.web.core.windows.net/` |
| `PRIMARY_ADMIN_EMAIL` | Primary administrator email | `naprikovsky@gmail.com` |
| `JWT_SECRET` | JWT token secret key | Random 64-character string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) | `GOCSPX-xxxxx` || `SIGNALR_HUB_NAME` | SignalR hub name (optional) | `chat` |
| `PORT` | Server port (optional) | `3000` (default) |
| `LOG_LEVEL` | Logging level (optional) | `info` |
| `CHAT_TTL_SECONDS` | Message retention TTL (optional) | `2592000` (30 days) |

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

### Frontend only (Angular dev server):
```bash
npm start
```
Navigate to `http://localhost:4200/`

### Full stack (with backend):
```bash
# Set environment variables
export AZURE_SIGNALR_CONNECTION_STRING="..."
export COSMOS_ENDPOINT="..."
export COSMOS_KEY="..."
export COSMOS_DATABASE_NAME="khRequest"

# Build and run
npm run build:all
npm run start:server
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
│  │  - Auth (JWT)   │    │                                 │ │
│  │  - Google OAuth │    │                                 │ │
│  └────────┬────────┘    └─────────────────────────────────┘ │
│           │                                                 │
└───────────┼─────────────────────────────────────────────────┘
            │
    ┌───────┴───────────┐
    │                   │
┌───▼───┐     ┌─────▼─────┐     ┌──────▼──────┐
│ Azure │     │  Cosmos   │     │    Blob     │
│SignalR│     │  DB SQL   │     │  Storage    │
│Service│     │(khRequest)│     │(avatars/    │
│       │     │- messages │     │ uploads)    │
│       │     │- users    │     └─────────────┘
│       │     │- requests │
└───────┘     └───────────┘
```

## 🎨 Project Structure

```
Chat-HappyTalk/
├── src/                          # Angular frontend
│   ├── app/
│   │   ├── guards/               # Route guards
│   │   ├── pages/                # Page components
│   │   │   ├── home/
│   │   │   ├── chat/             # Real-time chat UI
│   │   │   └── about/
│   │   ├── services/
│   │   │   └── signalr.service.ts  # SignalR client
│   │   ├── app.config.ts
│   │   ├── app.routes.ts
│   │   └── app.ts
│   ├── environments/             # Environment configs
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── server/                       # Fastify backend
│   ├── models/
│   │   └── message.ts            # Message schema
│   ├── routes/
│   │   └── api.ts                # API endpoints
│   ├── services/
│   │   ├── cosmos.service.ts     # Cosmos DB client
│   │   └── signalr.service.ts    # SignalR service
│   ├── server.ts                 # Entry point
│   └── tsconfig.json
├── public/                       # Static assets
│   ├── icons/
│   └── manifest.webmanifest
├── ngsw-config.json              # Service worker config
├── angular.json                  # Angular CLI config
├── package.json
└── tsconfig.json
```

## 🔌 API Endpoints

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/negotiate` | Get SignalR connection URL |
| GET | `/api/messages/:roomid` | Get message history |
| POST | `/api/messages` | Send a new message |
| POST | `/api/rooms/:roomid/join` | Join a chat room |
| POST | `/api/rooms/:roomid/leave` | Leave a chat room |

### Authentication (Planned)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register with email/password |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/google` | Google OAuth callback |
| POST | `/auth/request-access` | Request admin approval |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/refresh` | Refresh JWT token |

### Admin (Planned)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/access-requests` | List pending access requests |
| POST | `/admin/access-requests/:id/approve` | Approve user access |
| POST | `/admin/access-requests/:id/reject` | Reject user access |

## ♿ Accessibility Features

- ARIA labels on all interactive elements
- Full keyboard navigation support
- Semantic HTML5 elements
- Screen reader compatible
- WCAG AA color contrast

## 🔒 Security Notes

- Store all secrets in Azure App Service Application Settings
- Never commit connection strings or keys to source control
- Enable HTTPS only in production
- Configure CORS appropriately for your domain
- **JWT tokens** expire after 24 hours (configurable)
- **Admin approval required** for all new user registrations
- **Primary admin**: `naprikovsky@gmail.com` (configured in settings)
- Use strong, randomly generated JWT secret (min 64 characters)
- Google OAuth credentials should be kept secure and rotated regularly

## 📱 PWA Installation

Users can install the app:

1. **Desktop**: Click the install button in the browser's address bar
2. **Android**: Tap "Add to Home Screen" from the browser menu
3. **iOS**: Tap the share button and select "Add to Home Screen"

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ using Angular 21, Fastify, Azure SignalR, Cosmos DB, and Azure Blob Storage
