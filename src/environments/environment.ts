/**
 * Environment configuration for the application.
 * Values can be overridden at build time or runtime.
 */
export const environment = {
  production: false,
  apiBaseUrl: '',  // Empty for same-origin, set for external API
  signalrHubName: 'chat',
  defaultRoomId: 'public',
};
