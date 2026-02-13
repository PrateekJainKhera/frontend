import { apiClient, ApiResponse } from './axios-config'
import { MachineModel, CreateMachineModelRequest, UpdateMachineModelRequest } from '@/types/machine-model'

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
    const payload = {
      ...request,
      createdBy: request.createdBy || 'User'
    }
    const response = await apiClient.post<ApiResponse<number>>(this.baseURL, payload)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create machine model')
    }
    return response.data.data || 0
  }

  async update(id: number, request: UpdateMachineModelRequest): Promise<boolean> {
    const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseURL}/${id}`, request)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update machine model')
    }
    return response.data.data || false
  }

  async delete(id: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseURL}/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete machine model')
    }
    return response.data.data || false
  }
}

export const machineModelService = new MachineModelService()
