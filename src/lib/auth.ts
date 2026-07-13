'use client'

export interface SessionPermissions {
  [module: string]: {
    [action: string]: boolean
  }
}

export interface Session {
  sessionToken: string
  userId: number
  fullName: string
  username: string
  roleId: number | null
  roleName: string | null
  isAdmin: boolean
  permissions: SessionPermissions
}

const SESSION_KEY = 'erp_session'

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function isLoggedIn(): boolean {
  return getSession() !== null
}

/** Logged-in user's display name for audit fields (falls back to 'Admin'). */
export function getCurrentUserName(): string {
  const s = getSession()
  return s?.fullName || s?.username || 'Admin'
}

// ── Permission helpers ─────────────────────────────────────────────────────────

function checkPermission(module: string, action: string): boolean {
  const session = getSession()
  if (!session) return false
  if (session.isAdmin) return true
  return session.permissions?.[module]?.[action] === true
}

export const canView   = (module: string) => checkPermission(module, 'View')
export const canCreate = (module: string) => checkPermission(module, 'Create')
export const canEdit   = (module: string) => checkPermission(module, 'Edit')
export const canDelete = (module: string) => checkPermission(module, 'Delete')
export const canApprove = (module: string) => checkPermission(module, 'Approve')

/**
 * Submenu-aware permission check. `key` is a menu route (e.g. '/masters/customers').
 * If the role has an explicit row for that key, it wins. If the key is absent
 * entirely (a role that predates submenu permissions), we fall back to the
 * module-level permission so existing roles keep working.
 */
export function checkMenuPermission(
  key: string,
  action: string,
  fallbackModule?: string
): boolean {
  const session = getSession()
  if (!session) return false
  if (session.isAdmin) return true
  const entry = session.permissions?.[key]
  if (entry && Object.prototype.hasOwnProperty.call(entry, action)) {
    return entry[action] === true
  }
  if (fallbackModule) return session.permissions?.[fallbackModule]?.[action] === true
  return false
}

export const canViewMenu   = (key: string, mod?: string) => checkMenuPermission(key, 'View', mod)
export const canCreateMenu = (key: string, mod?: string) => checkMenuPermission(key, 'Create', mod)
export const canEditMenu   = (key: string, mod?: string) => checkMenuPermission(key, 'Edit', mod)
export const canDeleteMenu = (key: string, mod?: string) => checkMenuPermission(key, 'Delete', mod)
export const canApproveMenu = (key: string, mod?: string) => checkMenuPermission(key, 'Approve', mod)
