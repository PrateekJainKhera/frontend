import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateMachineRequest {
  machineName: string
  machineType: string
  location: string
  department?: string
  status?: string
  notes?: string
}

export interface UpdateMachineRequest extends CreateMachineRequest {
  id: number
  isActive: boolean
}

export interface MachineResponse {
  id: number
  machineCode: string
  machineName: string
  machineType: string | null
  location: string | null
  department: string | null
  status: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

class MachineService {
  private baseUrl = '/machines'

  async getAll(): Promise<MachineResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch machines: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateMachineRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create machine')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create machine: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateMachineRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, { ...data, id })
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update machine')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update machine: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete machine')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete machine: ${error.message}`)
      }
      throw error
    }
  }
}

export const machineService = new MachineService()
