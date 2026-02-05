/**
 * Environment configuration for the application.
 * Values can be overridden at build time or runtime.
 */
export const environment = {
  production: false,
  // Base URL for API calls. Intentionally empty to use same-origin and Angular dev proxy (/api/*).
  apiUrl: '',
  // Base URL for building API endpoints; leave empty to avoid hardcoded hosts and rely on proxy configuration.
  apiBaseUrl: '',
  signalrHubName: 'chat',
  defaultroomid: 'public',
  // Admin email for super admin privileges
  // NOTE: This should be set via environment variable ADMIN_EMAIL during deployment
  // Default value is for development only
  adminEmail: 'admin@example.com',
};
