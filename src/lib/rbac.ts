export const USER_ROLES = ['hr', 'fleet-manager', 'driver', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CREATABLE_USER_ROLES = ['hr', 'fleet-manager', 'driver'] as const;
export type CreatableUserRole = (typeof CREATABLE_USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  hr: 'HR',
  'fleet-manager': 'Fleet Manager',
  driver: 'Driver',
  admin: 'Admin',
};

export type RoleStatus = 'idle' | 'loading' | 'ready' | 'missing';

const isUserRole = (value: string): value is UserRole =>
  (USER_ROLES as readonly string[]).includes(value);

export function parseUserRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  return isUserRole(value) ? value : null;
}

const PREFIXES: Record<UserRole, readonly string[]> = {
  hr: [
    '/',
    '/profile',
    '/banks',
    '/departments',
    '/designations',
    '/employees',
    '/esi-locations',
    '/sites',
    '/work-orders',
    '/clm',
    '/bank-payments',
    '/pf-esic',
    '/leave-bonus',
    '/arrear',
    '/full-and-final',
    '/attendance',
    '/wages',
    '/final-settlements',
  ],
  'fleet-manager': ['/profile', '/fleet-manager/'],
  driver: ['/profile', '/driver'],
  admin: ['/profile', '/admin/'],
} as const;

export function getAllowedPathPrefixes(role: UserRole): readonly string[] {
  return PREFIXES[role];
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  const path =
    pathname === ''
      ? '/'
      : pathname.endsWith('/') && pathname !== '/'
        ? pathname.slice(0, -1)
        : pathname;
  if (prefix === '/') return path === '/';
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  return path === base || path.startsWith(`${base}/`);
}

/** When the user has no valid Firestore role, only the dashboard is allowed. */
const MISSING_ROLE_ALLOWED_PREFIXES = ['/'] as const;

export function canAccessPath(
  role: UserRole | null,
  roleStatus: RoleStatus,
  pathname: string,
): boolean {
  const path = pathname === '' ? '/' : pathname;
  if (roleStatus === 'missing') {
    return MISSING_ROLE_ALLOWED_PREFIXES.some((p) => matchesPrefix(path, p));
  }
  if (roleStatus !== 'ready' || !role) return false;
  return getAllowedPathPrefixes(role).some((prefix) =>
    matchesPrefix(path, prefix),
  );
}

export function getDefaultRoute(
  role: UserRole | null,
  roleStatus: RoleStatus,
): string {
  if (roleStatus === 'missing' || !role) return '/';
  switch (role) {
    case 'hr':
      return '/';
    case 'fleet-manager':
      return '/fleet-manager';
    case 'driver':
      return '/driver';
    case 'admin':
      return '/admin';
  }
}

export function getUnauthorizedRedirectTarget(
  role: UserRole | null,
  roleStatus: RoleStatus,
): string {
  if (roleStatus === 'missing' || !role) return '/';
  if (canAccessPath(role, 'ready', '/')) return '/';
  return getDefaultRoute(role, 'ready');
}
