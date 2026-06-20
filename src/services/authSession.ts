import type { User } from '@/src/types';

export interface AuthSessionBridge {
  getToken: () => string | null;
  getIsAuthenticated: () => boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  login: (token: string, user: User) => Promise<void>;
}

let bridge: AuthSessionBridge | null = null;

export function bindAuthSession(next: AuthSessionBridge): void {
  bridge = next;
}

export function getAuthToken(): string | null {
  return bridge?.getToken() ?? null;
}

export function getIsAuthenticated(): boolean {
  return bridge?.getIsAuthenticated() ?? false;
}

export async function logoutAuthSession(): Promise<void> {
  if (bridge) await bridge.logout();
}

export function setAuthUser(user: User | null): void {
  bridge?.setUser(user);
}

export async function loginAuthSession(token: string, user: User): Promise<void> {
  if (bridge) await bridge.login(token, user);
}
