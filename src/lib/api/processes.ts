import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateProcessRequest {
  processName: string
  category: string
  defaultMachine?: string | null
  standardSetupTimeMin?: number
  restTimeHours?: number
  description?: string | null
  isOutsourced?: boolean
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateProcessRequest extends CreateProcessRequest {
  id: number
  processCode: string
  updatedBy?: string | null
}

export interface ProcessResponse {
  id: number
  processCode: string
  processName: string
  category: string
  defaultMachine?: string | null
  standardSetupTimeMin: number
  restTimeHours?: number
  description?: string | null
  isOutsourced: boolean
  status?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

class ProcessService {
  private baseUrl = '/processes'

  async getAll(): Promise<ProcessResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch processes: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ProcessResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Process not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process: ${error.message}`)
      }
      throw error
    }
  }

  async getByProcessCode(processCode: string): Promise<ProcessResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse>>(
        `${this.baseUrl}/by-code/${processCode}`
      )
      if (!response.data.data) {
        throw new Error('Process not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process: ${error.message}`)
      }
      throw error
    }
  }

  async getActive(): Promise<ProcessResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active processes: ${error.message}`)
      }
      throw error
    }
  }

  async getByType(processType: string): Promise<ProcessResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse[]>>(
        `${this.baseUrl}/by-type/${processType}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch processes by type: ${error.message}`)
      }
      throw error
    }
  }

  async getByDepartment(department: string): Promise<ProcessResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse[]>>(
        `${this.baseUrl}/by-department/${department}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch processes by department: ${error.message}`)
      }
      throw error
    }
  }

  async getByMachineType(machineType: string): Promise<ProcessResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse[]>>(
        `${this.baseUrl}/by-machine-type/${machineType}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch processes by machine type: ${error.message}`)
      }
      throw error
    }
  }

  async getOutsourced(): Promise<ProcessResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessResponse[]>>(`${this.baseUrl}/outsourced`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch outsourced processes: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateProcessRequest): Promise<ProcessResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ProcessResponse>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create process')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create process: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProcessRequest): Promise<ProcessResponse> {
    try {
      const response = await apiClient.put<ApiResponse<ProcessResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update process')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update process: ${error.message}`)
      }
      throw error
    }
  }

  async activate(id: number): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${id}/activate`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to activate process: ${error.message}`)
      }
      throw error
    }
  }

  async deactivate(id: number): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${id}/deactivate`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to deactivate process: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete process: ${error.message}`)
      }
      throw error
    }
  }
}

export const processService = new ProcessService()
