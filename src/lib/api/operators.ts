import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface OperatorResponse {
  id: number
  operatorCode: string
  operatorName: string
  email?: string | null
  phone?: string | null
  mobile?: string | null
  employeeId?: string | null
  joiningDate?: string | null
  designation?: string | null
  department?: string | null
  shopFloor?: string | null
  skillLevel?: string | null
  specialization?: string | null
  shift?: string | null
  workingHours?: string | null
  isActive: boolean
  status?: string | null
  isAvailable: boolean
  remarks?: string | null
  createdAt?: string | null
}

export interface SaveOperatorRequest {
  operatorCode: string
  operatorName: string
  email?: string
  phone?: string
  mobile?: string
  employeeId?: string
  designation?: string
  department?: string
  skillLevel?: string
  specialization?: string
  shift?: string
  remarks?: string
}

class OperatorService {
  private baseUrl = '/operators'

  private fail(error: unknown, msg: string): never {
    if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `${msg}: ${error.message}`)
    throw error
  }

  async getAll(): Promise<OperatorResponse[]> {
    try {
      const res = await apiClient.get<ApiResponse<OperatorResponse[]>>(this.baseUrl)
      return res.data.data || []
    } catch (e) { this.fail(e, 'Failed to load operators') }
  }

  async create(data: SaveOperatorRequest): Promise<number> {
    try {
      const res = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!res.data.success) throw new Error(res.data.message || 'Failed to create operator')
      return res.data.data ?? 0
    } catch (e) { this.fail(e, 'Failed to create operator') }
  }

  async update(id: number, data: SaveOperatorRequest): Promise<void> {
    try {
      const res = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, { id, ...data })
      if (!res.data.success) throw new Error(res.data.message || 'Failed to update operator')
    } catch (e) { this.fail(e, 'Failed to update operator') }
  }

  async delete(id: number): Promise<void> {
    try {
      const res = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!res.data.success) throw new Error(res.data.message || 'Failed to delete operator')
    } catch (e) { this.fail(e, 'Failed to delete operator') }
  }
}

export const operatorService = new OperatorService()
