import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ChildPartTypeResponse {
  id: number
  typeName: string
  isActive: boolean
  createdAt: string
}

export interface CreateChildPartTypeRequest {
  typeName: string
  createdBy?: string
}

class ChildPartTypeService {
  private baseUrl = '/child-part-types'

  async getAll(): Promise<ChildPartTypeResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ChildPartTypeResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch child part types: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateChildPartTypeRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create child part type')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create child part type: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete child part type: ${error.message}`)
      }
      throw error
    }
  }
}

export const childPartTypeService = new ChildPartTypeService()
