/**
 * Token utility functions for handling JWT tokens in the browser's localStorage.
 * Provides a type-safe way to store, retrieve, and clear authentication tokens.
 */

const TOKEN_KEY = 'auth_token';

/**
 * Get the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export const getToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Set the authentication token in localStorage
 * @param token The JWT token to store
 */
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const clearToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

/**
 * Check if the user is authenticated by verifying the presence of a token
 * @returns boolean indicating if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

/**
 * Get the token payload (decoded JWT)
 * Note: This does not verify the token signature, it only decodes it
 * @returns The decoded token payload or null if token is invalid or not found
 */
export const getTokenPayload = <T = any>(): T | null => {
  const token = getToken();
  if (!token) return null;

  try {
    // Split the token into its parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if the token is expired
 * @returns boolean indicating if the token is expired
 */
export const isTokenExpired = (): boolean => {
  const payload = getTokenPayload<{ exp?: number }>();
  if (!payload || !payload.exp) return true;

  // Convert expiration time from seconds to milliseconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
};
