import { Customer } from '@/types/customer'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api'

export interface CreateCustomerRequest {
  customerName: string
  customerType: string
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
  createdBy?: string
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number
  customerCode: string
  updatedBy?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

class CustomerService {
  private baseUrl = `${API_BASE_URL}/customers`

  async getAll(): Promise<Customer[]> {
    const response = await fetch(this.baseUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch customers: ${response.statusText}`)
    }

    const result: ApiResponse<Customer[]> = await response.json()
    return result.data || []
  }

  async getById(id: number): Promise<Customer> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.statusText}`)
    }

    const result: ApiResponse<Customer> = await response.json()
    if (!result.data) {
      throw new Error('Customer not found')
    }
    return result.data
  }

  async getByCode(code: string): Promise<Customer> {
    const response = await fetch(`${this.baseUrl}/by-code/${code}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch customer: ${response.statusText}`)
    }

    const result: ApiResponse<Customer> = await response.json()
    if (!result.data) {
      throw new Error('Customer not found')
    }
    return result.data
  }

  async create(data: CreateCustomerRequest): Promise<Customer> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        createdBy: data.createdBy || 'Admin',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to create customer: ${response.statusText}`)
    }

    const result: ApiResponse<Customer> = await response.json()
    if (!result.data) {
      throw new Error('Failed to create customer')
    }
    return result.data
  }

  async update(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to update customer: ${response.statusText}`)
    }

    const result: ApiResponse<Customer> = await response.json()
    if (!result.data) {
      throw new Error('Failed to update customer')
    }
    return result.data
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || `Failed to delete customer: ${response.statusText}`)
    }
  }
}

export const customerService = new CustomerService()
