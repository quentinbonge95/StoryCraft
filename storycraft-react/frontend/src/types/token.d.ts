declare module '@/utils/token' {
  export function getToken(): string | null;
  export function setToken(token: string): void;
  export function removeToken(): void;
  export function clearToken(): void;
  export function isTokenValid(): boolean;
  export function isAuthenticated(): boolean;
  export function getTokenPayload<T = any>(): T | null;
  export function getPayloadFromToken(token: string): any | null;
  export function isTokenExpired(): boolean;
}
