import { apiClient } from './axios-config'
import { Session } from '@/lib/auth'

export interface UserResponse {
  id: number
  fullName: string
  username: string
  roleId: number | null
  roleName: string | null
  isAdmin: boolean
  isActive: boolean
  createdAt: string
}

export interface RoleResponse {
  id: number
  roleName: string
  description: string | null
  userCount: number
  createdAt: string
}

export type PermissionMap = { [module: string]: { [action: string]: boolean } }

export const authService = {
  async login(username: string, password: string): Promise<Session> {
    const res = await apiClient.post('/auth/login', { username, password })
    return res.data
  },

  async logout(token: string): Promise<void> {
    await apiClient.post('/auth/logout', {}, {
      headers: { 'X-Session-Token': token },
    })
  },

  async getModules(): Promise<{ modules: string[]; actions: string[] }> {
    const res = await apiClient.get('/auth/modules')
    return res.data
  },
}

export const adminService = {
  // Users
  async getUsers(): Promise<UserResponse[]> {
    const res = await apiClient.get('/admin/users')
    return res.data
  },

  async createUser(data: { fullName: string; username: string; password: string; roleId: number | null }): Promise<UserResponse> {
    const res = await apiClient.post('/admin/users', data)
    return res.data
  },

  async updateUser(id: number, data: { fullName: string; roleId: number | null; isActive: boolean }): Promise<void> {
    await apiClient.put(`/admin/users/${id}`, data)
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    await apiClient.put(`/admin/users/${id}/reset-password`, { newPassword })
  },

  async deleteUser(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`)
  },

  // Roles
  async getRoles(): Promise<RoleResponse[]> {
    const res = await apiClient.get('/admin/roles')
    return res.data
  },

  async createRole(data: { roleName: string; description?: string }): Promise<RoleResponse> {
    const res = await apiClient.post('/admin/roles', data)
    return res.data
  },

  async updateRole(id: number, data: { roleName: string; description?: string }): Promise<void> {
    await apiClient.put(`/admin/roles/${id}`, data)
  },

  async deleteRole(id: number): Promise<void> {
    await apiClient.delete(`/admin/roles/${id}`)
  },

  // Permissions
  async getPermissions(roleId: number): Promise<PermissionMap> {
    const res = await apiClient.get(`/admin/roles/${roleId}/permissions`)
    return res.data
  },

  async savePermissions(roleId: number, permissions: { module: string; action: string; isAllowed: boolean }[]): Promise<void> {
    await apiClient.put(`/admin/roles/${roleId}/permissions`, { permissions })
  },
}
