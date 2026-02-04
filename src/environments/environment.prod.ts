/**
 * Production environment configuration.
 * IMPORTANT: Environment-specific values should be set via build-time replacements or runtime configuration.
 * Do not commit actual production credentials to this file.
 */
export const environment = {
  production: true,
  apiUrl: '',  // Same-origin API in production
  apiBaseUrl: '',  // Same-origin API in production
  signalrHubName: 'chat',
  defaultroomid: 'public',
  // Admin email for super admin privileges
  // NOTE: This MUST be replaced during deployment via build-time file replacement
  // See CONFIGURATION.md for deployment instructions
  // Use sed or similar tool to replace this placeholder: sed -i "s/REPLACE_WITH_ADMIN_EMAIL/actual-email/g" dist/...
  adminEmail: 'REPLACE_WITH_ADMIN_EMAIL',
};
