/**
 * DriveGuard AI — Auth State & Route Guard Utilities
 */
import { api, ApiUser } from '@/lib/api';
export { AuthProvider, useAuth } from '@/lib/authContext';
export type { ApiUser } from '@/lib/api';

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return api.hasToken();
}

export function getCurrentUser(): ApiUser | null {
  return api.getCurrentUser();
}

export function getUserRole(): 'driver' | 'admin' | null {
  const user = getCurrentUser();
  return user?.role || null;
}

export function requireAuth(targetRole?: 'driver' | 'admin'): { authorized: boolean; redirectUrl?: string } {
  if (typeof window === 'undefined') return { authorized: true };

  const loggedIn = isAuthenticated();
  if (!loggedIn) {
    return { authorized: false, redirectUrl: '/login' };
  }

  if (targetRole) {
    const role = getUserRole();
    if (role !== targetRole) {
      return { authorized: false, redirectUrl: role === 'admin' ? '/admin' : '/driver' };
    }
  }

  return { authorized: true };
}
