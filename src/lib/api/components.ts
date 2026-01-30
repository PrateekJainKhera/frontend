import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateComponentRequest {
  componentName: string
  category: string
  manufacturer?: string | null
  supplierName?: string | null
  specifications?: string | null
  leadTimeDays: number
  unit: string
  notes?: string | null
  createdBy?: string | null
}

export interface UpdateComponentRequest extends CreateComponentRequest {
  id: number
  partNumber: string
  updatedBy?: string | null
}

export interface ComponentResponse {
  id: number
  partNumber: string
  componentName: string
  category: string
  manufacturer?: string | null
  supplierName?: string | null
  specifications?: string | null
  leadTimeDays: number
  unit: string
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

class ComponentService {
  private baseUrl = '/components'

  async getAll(): Promise<ComponentResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch components: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ComponentResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Component not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch component: ${error.message}`)
      }
      throw error
    }
  }

  async getByPartNumber(partNumber: string): Promise<ComponentResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentResponse>>(
        `${this.baseUrl}/by-part-number/${partNumber}`
      )
      if (!response.data.data) {
        throw new Error('Component not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch component: ${error.message}`)
      }
      throw error
    }
  }

  async getByCategory(category: string): Promise<ComponentResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentResponse[]>>(
        `${this.baseUrl}/by-category/${category}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch components by category: ${error.message}`)
      }
      throw error
    }
  }

  async search(searchTerm: string): Promise<ComponentResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentResponse[]>>(
        `${this.baseUrl}/search?searchTerm=${encodeURIComponent(searchTerm)}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to search components: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateComponentRequest): Promise<ComponentResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ComponentResponse>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create component')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create component: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateComponentRequest): Promise<ComponentResponse> {
    try {
      const response = await apiClient.put<ApiResponse<ComponentResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update component')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update component: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete component: ${error.message}`)
      }
      throw error
    }
  }
}

export const componentService = new ComponentService()
