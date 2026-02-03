# Azure Deployment Guide - HappyTalk

## Prerequisites Checklist

- [ ] Azure subscription active
- [ ] Git repository pushed to GitHub
- [ ] Azure resources created:
  - App Service: **HappyTalk**
  - Azure SignalR: **tw-signalr-occupier**
  - Cosmos DB: **cosmoskhreq3** (database: **khRequest**)

## Step 1: Configure Azure App Service

### 1.1 Set Runtime Settings

Go to Azure Portal → App Service → **HappyTalk** → Configuration → General settings:

| Setting | Value |
|---------|-------|
| **Stack** | Node |
| **Node version** | 24 LTS |
| **Startup Command** | `node dist/server/server.js` |
| **Platform** | 64 Bit |

**Enable WebSockets:**
- Scroll down in General settings
- **Web sockets**: ON
- Click **Save**

### 1.2 Configure Application Settings

Go to Azure Portal → App Service → **HappyTalk** → Configuration → Application settings:

Click **+ New application setting** for each:

| Name | Value | Note |
|------|-------|------|
| `AZURE_SIGNALR_CONNECTION_STRING` | `Endpoint=https://tw-signalr-occupier.service.signalr.net;AccessKey=BJ6AZ9jmjaZ0bWmqfDTcZkLkhi4iyjHCLzjvQ5VVGm47M3rxAzyhJQQJ99BDAC1i4TkXJ3w3AAAAASRSrWaJ;Version=1.0;` | Get from SignalR Keys |
| `COSMOS_ENDPOINT` | `https://cosmoskhreq3.documents.azure.com:443/` | Get from Cosmos DB Keys |
| `COSMOS_KEY` | `<your-cosmos-primary-key>` | Get from Cosmos DB Keys |
| `COSMOS_DATABASE_NAME` | `khRequest` | Database name |
| `COSMOS_CONTAINER_NAME` | `chat_messages` | Optional, defaults to this |
| `SIGNALR_HUB_NAME` | `chat` | Optional, defaults to this |
| `PORT` | `8080` | Optional, Azure default |
| `LOG_LEVEL` | `info` | Optional |
| `CORS_ORIGIN` | `true` | Optional, or set specific domain |

**Important:** Click **Save** after adding all settings, then click **Continue** to restart the app.

---

## Step 2: Get Cosmos DB Connection Details

### 2.1 Get Cosmos DB Endpoint and Key

1. Go to Azure Portal → Cosmos DB → **cosmoskhreq3**
2. Click **Keys** in the left menu
3. Copy:
   - **URI** → Use as `COSMOS_ENDPOINT`
   - **PRIMARY KEY** → Use as `COSMOS_KEY`

### 2.2 Verify Database Name

1. In Cosmos DB → **cosmoskhreq3** → Data Explorer
2. Verify database **khRequest** exists (or create it)
3. Container **chat_messages** will be auto-created by the app on first run

---

## Step 3: Configure GitHub Actions

### 3.1 Get Publish Profile

1. Go to Azure Portal → App Service → **HappyTalk**
2. Click **Get publish profile** in the Overview page (top toolbar)
3. This downloads a `.PublishSettings` XML file
4. Open the file and copy **all contents**

### 3.2 Create GitHub Secret

1. Go to your GitHub repository: https://github.com/VladyslavNap/Chat-HappyTalk
2. Click **Settings** (repository settings, not your profile)
3. In the left menu, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Create secret:
   - **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - **Value**: Paste the entire publish profile XML content
6. Click **Add secret**

---

## Step 4: Verify Workflow File

The GitHub Actions workflow at `.github/workflows/azure-webapps-node.yml` is already configured:

✅ **AZURE_WEBAPP_NAME**: `HappyTalk`  
✅ **NODE_VERSION**: `24.x`  
✅ **Build command**: `npm run build:all` (builds both frontend + backend)

The workflow will:
1. Trigger on push to `main` branch or manual dispatch
2. Install dependencies
3. Build Angular frontend → `dist/happy-talk/browser/`
4. Build Fastify server → `dist/server/`
5. Deploy entire project to Azure

---

## Step 5: Deploy

### Option A: Push to Main Branch (Automatic)

```bash
git add .
git commit -m "Configure Azure deployment"
git push origin main
```

The workflow will trigger automatically.

### Option B: Manual Trigger

1. Go to GitHub → **Actions** tab
2. Select **Build and deploy Node.js app to Azure Web App - HappyTalk**
3. Click **Run workflow** → Select `main` branch → **Run workflow**

### 5.1 Monitor Deployment

1. Go to GitHub → **Actions** tab
2. Click on the running workflow
3. Watch the **build** and **deploy** jobs
4. Wait for both to complete (✅ green checkmarks)

---

## Step 6: Verify Deployment

### 6.1 Check App Service Logs

1. Go to Azure Portal → App Service → **HappyTalk**
2. Click **Log stream** in the left menu
3. You should see:
   ```
   Server listening on http://0.0.0.0:8080
   Cosmos DB service initialized
   SignalR service initialized
   ```

### 6.2 Test the Application

1. Open your app URL: **https://happytalk.azurewebsites.net**
2. You should see the HappyTalk home page
3. Navigate to the chat page
4. Enter your name when prompted
5. Send a test message
6. Open the app in another browser/tab to verify real-time messaging

### 6.3 Check Cosmos DB

1. Go to Azure Portal → Cosmos DB → **cosmoskhreq3** → Data Explorer
2. Expand **khRequest** → **chat_messages**
3. Click **Items** to see stored messages

---

## Troubleshooting

### Build fails with "Cannot find module"
- Ensure `package.json` includes all dependencies
- Check that `npm run build:all` works locally

### Server won't start - "COSMOS_ENDPOINT required"
- Verify all Application Settings are configured in Step 1.2
- Restart the App Service after saving settings

### Real-time messages not working
- Verify WebSockets are enabled (Step 1.1)
- Check `AZURE_SIGNALR_CONNECTION_STRING` is correct
- Check browser console for connection errors

### 404 on API calls
- Verify Startup Command is `node dist/server/server.js`
- Check Log stream for server startup errors
- Ensure both frontend and backend built successfully

### Database connection fails
- Verify Cosmos DB firewall allows Azure services
- Go to Cosmos DB → Networking → Allow access from Azure services: **Enabled**
- Check `COSMOS_KEY` is the PRIMARY KEY (not secondary)

---

## Post-Deployment Checklist

- [ ] App URL loads successfully
- [ ] Chat page displays with connection status
- [ ] Can send and receive messages in real-time
- [ ] Messages persist after page refresh
- [ ] Multiple browser tabs sync in real-time
- [ ] Cosmos DB shows message documents
- [ ] Log stream shows no errors

---

## Optional: Custom Domain & SSL

1. Go to App Service → **HappyTalk** → Custom domains
2. Add your custom domain
3. Azure provides free SSL certificate automatically

---

## Workflow Updates

The workflow at `.github/workflows/azure-webapps-node.yml` will automatically deploy on every push to `main`. To deploy manually:

```bash
# Make changes
git add .
git commit -m "Your changes"
git push origin main

# Or trigger manually via GitHub Actions UI
```

---

## Cost Optimization Tips

1. **App Service**: Use Free or Basic tier for testing (WebSockets available on Basic+)
2. **Cosmos DB**: Use serverless or provision minimum 400 RU/s
3. **SignalR**: Free tier includes 20 concurrent connections
4. **Set TTL**: Add `CHAT_TTL_SECONDS=2592000` (30 days) to auto-delete old messages

---

## Support Resources

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Cosmos DB Docs](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure SignalR Docs](https://docs.microsoft.com/azure/azure-signalr/)
