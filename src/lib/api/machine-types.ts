import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface MachineTypeResponse {
  id: number
  name: string
  isActive: boolean
  createdAt: string
}

export interface CreateMachineTypeRequest {
  name: string
  createdBy?: string
}

class MachineTypeService {
  private baseUrl = '/machine-types'

  async getAll(): Promise<MachineTypeResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineTypeResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch machine types: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateMachineTypeRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create machine type')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create machine type: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete machine type: ${error.message}`)
      }
      throw error
    }
  }
}

export const machineTypeService = new MachineTypeService()
