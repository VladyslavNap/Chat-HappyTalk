# Configuration Guide

## Environment Configuration

### Admin Email Configuration

The super admin email is configurable through environment variables for both the backend and frontend.

#### Backend (Server)

Set the `PRIMARY_ADMIN_EMAIL` environment variable:

```bash
# In .env file
PRIMARY_ADMIN_EMAIL=your-admin@example.com
```

Or in Azure App Service:
1. Go to Azure Portal → App Service → Configuration
2. Add Application Setting: `PRIMARY_ADMIN_EMAIL` = `your-admin@example.com`
3. Save and restart the app

#### Frontend (Angular)

For development, the default value in `src/environments/environment.ts` is `admin@example.com`.

For production deployment, you have two options:

**Option 1: File Replacement (Recommended)**

Create a custom environment file and use Angular's file replacement feature:

1. Create `src/environments/environment.prod.custom.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: '',
  apiBaseUrl: '',
  signalrHubName: 'chat',
  defaultroomid: 'public',
  adminEmail: 'your-admin@example.com',
};
```

2. Update `angular.json` to use this file in production builds.

**Option 2: Build-Time Replacement**

Use a build script to replace the placeholder value:

```bash
# In your CI/CD pipeline or build script
sed -i "s/REPLACE_WITH_ADMIN_EMAIL/$ADMIN_EMAIL/g" dist/happy-talk/browser/main-*.js
```

**Option 3: Runtime Environment Variable (Advanced)**

For containerized deployments, you can inject environment variables at runtime, but this requires additional setup with a configuration service.

### Security Best Practices

1. **Never commit real admin emails to version control**
2. **Use environment variables for all environments**
3. **Rotate admin credentials regularly**
4. **Use different admin emails for dev/staging/prod**
5. **Document the admin email securely** (e.g., in Azure Key Vault, not in code)

### Example Deployment Configuration

#### GitHub Actions

```yaml
- name: Build frontend
  run: npm run build
  env:
    ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}

- name: Replace admin email
  run: |
    sed -i "s/REPLACE_WITH_ADMIN_EMAIL/${{ secrets.ADMIN_EMAIL }}/g" dist/happy-talk/browser/main-*.js
```

#### Azure App Service

Set both backend and frontend environment variables:
- `PRIMARY_ADMIN_EMAIL` (backend)
- `ADMIN_EMAIL` (if using runtime replacement for frontend)

## Other Configuration

### API Configuration

- `apiUrl`: Set to external API URL if backend is hosted separately
- `apiBaseUrl`: Base URL for API calls
- `signalrHubName`: Azure SignalR hub name (default: 'chat')
- `defaultroomid`: Default chat room (default: 'public')

### Database Configuration

See `.env.example` for complete list of database and Azure service configurations.
