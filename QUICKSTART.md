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
```bash
# Set environment variables
export AZURE_SIGNALR_CONNECTION_STRING="Endpoint=https://...;AccessKey=...;Version=1.0;"
export COSMOS_ENDPOINT="https://cosmoskhreq3.documents.azure.com:443/"
export COSMOS_KEY="your-cosmos-key"
export COSMOS_DATABASE_NAME="khRequest"

# Build and run
npm run build:all
npm run start:server
# App runs at http://localhost:3000
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

```bash
npm run build:all
az webapp deploy --name HappyTalk --src-path . --type zip
```

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
