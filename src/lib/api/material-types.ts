import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface MaterialTypeResponse {
  id: number
  name: string
  isActive: boolean
  createdAt: string
}

export interface CreateMaterialTypeRequest {
  name: string
}

class MaterialTypeService {
  private baseUrl = '/material-types'

  async getAll(): Promise<MaterialTypeResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialTypeResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material types: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateMaterialTypeRequest): Promise<MaterialTypeResponse> {
    try {
      const response = await apiClient.post<ApiResponse<MaterialTypeResponse>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create material type')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create material type: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete material type: ${error.message}`)
      }
      throw error
    }
  }
}

export const materialTypeService = new MaterialTypeService()
