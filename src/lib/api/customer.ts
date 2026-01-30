import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import { Customer } from '@/types/customer'

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

class CustomerService {
  private baseUrl = '/customers'

  async getAll(): Promise<Customer[]> {
    try {
      const response = await apiClient.get<ApiResponse<Customer[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch customers: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<Customer> {
    try {
      const response = await apiClient.get<ApiResponse<Customer>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Customer not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch customer: ${error.message}`)
      }
      throw error
    }
  }

  async getByCode(code: string): Promise<Customer> {
    try {
      const response = await apiClient.get<ApiResponse<Customer>>(`${this.baseUrl}/by-code/${code}`)
      if (!response.data.data) {
        throw new Error('Customer not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch customer: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await apiClient.post<ApiResponse<Customer>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create customer')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create customer: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    try {
      const response = await apiClient.put<ApiResponse<Customer>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update customer')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update customer: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete customer: ${error.message}`)
      }
      throw error
    }
  }
}

export const customerService = new CustomerService()
