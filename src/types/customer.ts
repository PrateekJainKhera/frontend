import { CustomerType } from './enums'

export interface Customer {
  id: string
  name: string
  code: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  isActive: boolean
  customerType: CustomerType
  commissionPercent?: number
  creditLimit?: number
  paymentTerms?: string
  isAgent: boolean
  createdAt: Date
  updatedAt: Date
}
