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
