import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface VendorResponse {
  id: number
  vendorCode: string
  vendorName: string
  vendorType: string
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country: string
  pinCode?: string | null
  gstNo?: string | null
  panNo?: string | null
  creditDays?: number | null
  creditLimit?: number | null
  paymentTerms: string
  isActive: boolean
  createdAt: string
  createdBy?: string | null
  updatedAt: string
  updatedBy?: string | null
}

export interface CreateVendorRequest {
  vendorName: string
  vendorType: string
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string
  pinCode?: string | null
  gstNo?: string | null
  panNo?: string | null
  creditDays?: number | null
  creditLimit?: number | null
  paymentTerms?: string
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateVendorRequest extends CreateVendorRequest {
  id: number
  vendorCode: string
  updatedBy?: string | null
}

class VendorService {
  private baseUrl = '/vendors'

  async getAll(): Promise<VendorResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<VendorResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch vendors')
      throw error
    }
  }

  async getActive(): Promise<VendorResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<VendorResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch vendors')
      throw error
    }
  }

  async getById(id: number): Promise<VendorResponse> {
    try {
      const response = await apiClient.get<ApiResponse<VendorResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Vendor not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch vendor')
      throw error
    }
  }

  async search(searchTerm: string): Promise<VendorResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<VendorResponse[]>>(
        `${this.baseUrl}/search?searchTerm=${encodeURIComponent(searchTerm)}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to search vendors')
      throw error
    }
  }

  async create(data: CreateVendorRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) throw new Error('Failed to create vendor')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to create vendor')
      throw error
    }
  }

  async update(id: number, data: UpdateVendorRequest): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}`, { ...data, updatedBy: data.updatedBy || 'Admin' })
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to update vendor')
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to delete vendor')
      throw error
    }
  }
}

export const vendorService = new VendorService()
