/**
 * Environment configuration for the application.
 * Values can be overridden at build time or runtime.
 */
export const environment = {
  production: false,
  apiUrl: '',  // Empty for same-origin, set for external API
  apiBaseUrl: '',  // Empty for same-origin, set for external API
  signalrHubName: 'chat',
  defaultroomid: 'public',
  // Admin email for super admin privileges
  // NOTE: This should be set via environment variable ADMIN_EMAIL during deployment
  // Default value is for development only
  adminEmail: 'admin@example.com',
};
