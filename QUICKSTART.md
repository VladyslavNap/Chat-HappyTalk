# HappyTalk - Quick Start Guide

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
  - Cosmos DB SQL API

## 🚀 Development

### Frontend only (no backend):
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

You need to set:
- `AZURE_SIGNALR_CONNECTION_STRING` - From Azure Portal → `tw-signalr-occupier` → Keys
- `COSMOS_KEY` - From Azure Portal → `cosmoskhreq3` → Keys → Primary Key

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
npm test
```

## 🌐 Deploy to Azure App Service

### 1. Set Application Settings

In Azure Portal → App Service → Configuration:

| Setting | Value |
|---------|-------|
| `AZURE_SIGNALR_CONNECTION_STRING` | Your SignalR connection string |
| `COSMOS_ENDPOINT` | `https://cosmoskhreq3.documents.azure.com:443/` |
| `COSMOS_KEY` | Your Cosmos DB key |
| `COSMOS_DATABASE_NAME` | `khRequest` |

### 2. Configure Startup

- **Runtime**: Node.js 24 LTS
- **Startup command**: `node dist/server/server.js`
- **WebSockets**: Enabled

### 3. Deploy

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

- ✅ Real-time messaging (Azure SignalR)
- ✅ Persistent chat history (Cosmos DB)
- ✅ Progressive Web App (installable)
- ✅ Service Worker (offline support)
- ✅ Responsive design
- ✅ Accessible (WCAG compliant)
- ✅ Co-hosted Angular + Fastify

## 🔧 Tech Stack

- Angular 21.1.0
- Fastify 5.x
- Azure SignalR (Web PubSub)
- Azure Cosmos DB SQL
- TypeScript 5.9.2
- SCSS

## 📄 License

MIT
