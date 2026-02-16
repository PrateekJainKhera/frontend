import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface RollerTypeResponse {
  id: number
  typeName: string
  isActive: boolean
  createdAt: string
}

export interface CreateRollerTypeRequest {
  typeName: string
  createdBy?: string
}

class RollerTypeService {
  private baseUrl = '/roller-types'

  async getAll(): Promise<RollerTypeResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<RollerTypeResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch roller types: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateRollerTypeRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create roller type')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create roller type: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete roller type: ${error.message}`)
      }
      throw error
    }
  }
}

export const rollerTypeService = new RollerTypeService()
