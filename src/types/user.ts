import { UserRole, Department } from './enums'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  department: Department
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date | null
}
