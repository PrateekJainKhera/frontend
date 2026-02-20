import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import { Shift, CreateShiftRequest } from '@/types/shift'

class ShiftService {
  private baseUrl = '/shifts'

  async getAll(): Promise<Shift[]> {
    try {
      const r = await apiClient.get<ApiResponse<Shift[]>>(this.baseUrl)
      return r.data.data || []
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async getActive(): Promise<Shift[]> {
    try {
      const r = await apiClient.get<ApiResponse<Shift[]>>(`${this.baseUrl}/active`)
      return r.data.data || []
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async create(data: CreateShiftRequest): Promise<number> {
    try {
      const r = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!r.data.success) throw new Error(r.data.message)
      return r.data.data!
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async update(id: number, data: CreateShiftRequest): Promise<boolean> {
    try {
      const r = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, data)
      if (!r.data.success) throw new Error(r.data.message)
      return true
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const r = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!r.data.success) throw new Error(r.data.message)
      return true
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }
}

export const shiftService = new ShiftService()
