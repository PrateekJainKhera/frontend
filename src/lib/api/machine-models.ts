import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import { MachineModel, CreateMachineModelRequest, UpdateMachineModelRequest } from '@/types/machine-model'

// Surface the backend's real message (e.g. "Another model with this name already
// exists") instead of axios's generic "Request failed with status code 400".
function apiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(error.response?.data?.message || error.message || fallback)
  }
  return error instanceof Error ? error : new Error(fallback)
}

class MachineModelService {
  private baseURL = '/masters/MachineModels'

  async getAll(): Promise<MachineModel[]> {
    const response = await apiClient.get<ApiResponse<MachineModel[]>>(this.baseURL)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch machine models')
    }
    return response.data.data || []
  }

  async getById(id: number): Promise<MachineModel> {
    const response = await apiClient.get<ApiResponse<MachineModel>>(`${this.baseURL}/${id}`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch machine model')
    }
    return response.data.data
  }

  async create(request: CreateMachineModelRequest): Promise<number> {
    try {
      const payload = { ...request, createdBy: request.createdBy || 'User' }
      const response = await apiClient.post<ApiResponse<number>>(this.baseURL, payload)
      if (!response.data.success) throw new Error(response.data.message || 'Failed to create machine model')
      return response.data.data || 0
    } catch (error) { throw apiError(error, 'Failed to create machine model') }
  }

  async update(id: number, request: UpdateMachineModelRequest): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseURL}/${id}`, request)
      if (!response.data.success) throw new Error(response.data.message || 'Failed to update machine model')
      return response.data.data || false
    } catch (error) { throw apiError(error, 'Failed to update machine model') }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseURL}/${id}`)
      if (!response.data.success) throw new Error(response.data.message || 'Failed to delete machine model')
      return response.data.data || false
    } catch (error) { throw apiError(error, 'Failed to delete machine model') }
  }
}

export const machineModelService = new MachineModelService()
