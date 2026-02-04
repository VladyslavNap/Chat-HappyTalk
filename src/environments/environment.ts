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
  adminEmail: 'naprikovsky@gmail.com',  // Super admin email
};
