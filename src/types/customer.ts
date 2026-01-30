export interface Customer {
  id: number
  customerCode: string
  customerName: string
  customerType: string // 'Direct', 'Agent', 'Dealer'
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  pinCode?: string
  gstNo?: string
  panNo?: string
  creditDays: number
  creditLimit: number
  paymentTerms?: string
  isActive: boolean
  createdAt: Date
  createdBy?: string
  updatedAt?: Date
  updatedBy?: string
}
