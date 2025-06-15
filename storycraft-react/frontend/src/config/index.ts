/**
 * Application configuration
 * 
 * This file provides type-safe access to environment variables
 * and other configuration values used throughout the application.
 */

/**
 * Get the API base URL from environment variables
 */
export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL;
};

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
};

/**
 * Check if debug logging is enabled
 */
export const isDebugLoggingEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
};

/**
 * Get the token refresh interval in milliseconds
 */
export const getTokenRefreshInterval = (): number => {
  return parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL || '300000', 10);
};

/**
 * Get the default theme
 */
export const getDefaultTheme = (): 'light' | 'dark' => {
  return (import.meta.env.VITE_DEFAULT_THEME || 'light') as 'light' | 'dark';
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = (): boolean => {
  return import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false';
};

const config = {
  api: {
    baseUrl: getApiUrl(),
    endpoints: {
      auth: {
        login: '/auth/token',
        register: '/auth/register',
        logout: '/auth/logout',
        refresh: '/auth/refresh',
        me: '/users/me',
      },
      users: {
        base: '/users',
        me: '/users/me',
        changePassword: '/users/me/change-password',
      },
      stories: {
        base: '/stories',
        search: '/stories/search',
      },
    },
  },
  features: {
    analytics: isAnalyticsEnabled(),
    debug: isDebugLoggingEnabled(),
    notifications: areNotificationsEnabled(),
  },
  theme: {
    default: getDefaultTheme(),
  },
  tokens: {
    refreshInterval: getTokenRefreshInterval(),
  },
} as const;

export default config;
