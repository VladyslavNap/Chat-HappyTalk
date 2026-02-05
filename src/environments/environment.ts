/**
 * Environment configuration for the application.
 * Values can be overridden at build time or runtime.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',  // Backend server URL
  apiBaseUrl: 'http://localhost:3000',  // Backend server URL
  signalrHubName: 'chat',
  defaultroomid: 'public',
  // Admin email for super admin privileges
  // NOTE: This should be set via environment variable ADMIN_EMAIL during deployment
  // Default value is for development only
  adminEmail: 'admin@example.com',
};
