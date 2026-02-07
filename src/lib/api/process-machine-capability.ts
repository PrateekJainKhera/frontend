import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProcessMachineCapabilityResponse {
  id: number
  processId: number
  machineId: number
  processName?: string
  machineName?: string
  machineCode?: string
  setupTimeHours: number
  cycleTimePerPieceHours: number
  preferenceLevel: number
  efficiencyRating: number
  isPreferredMachine: boolean
  maxWorkpieceLength?: number
  maxWorkpieceDiameter?: number
  maxBatchSize?: number
  hourlyRate?: number
  estimatedCostPerPiece?: number
  isActive: boolean
  availableFrom?: string
  availableTo?: string
  remarks?: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface CreateProcessMachineCapabilityRequest {
  processId: number
  machineId: number
  setupTimeHours: number
  cycleTimePerPieceHours: number
  preferenceLevel?: number
  efficiencyRating?: number
  isPreferredMachine?: boolean
  maxWorkpieceLength?: number
  maxWorkpieceDiameter?: number
  maxBatchSize?: number
  hourlyRate?: number
  estimatedCostPerPiece?: number
  isActive?: boolean
  availableFrom?: string
  availableTo?: string
  remarks?: string
  createdBy?: string
}

export interface UpdateProcessMachineCapabilityRequest extends CreateProcessMachineCapabilityRequest {
  id: number
  updatedBy?: string
}

class ProcessMachineCapabilityService {
  private baseUrl = '/process-machine-capability'

  async getAll(): Promise<ProcessMachineCapabilityResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessMachineCapabilityResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch capabilities: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ProcessMachineCapabilityResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessMachineCapabilityResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Capability not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch capability: ${error.message}`)
      }
      throw error
    }
  }

  async getByProcessId(processId: number): Promise<ProcessMachineCapabilityResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessMachineCapabilityResponse[]>>(
        `${this.baseUrl}/process/${processId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch capabilities for process: ${error.message}`)
      }
      throw error
    }
  }

  async getByMachineId(machineId: number): Promise<ProcessMachineCapabilityResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessMachineCapabilityResponse[]>>(
        `${this.baseUrl}/machine/${machineId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch capabilities for machine: ${error.message}`)
      }
      throw error
    }
  }

  async getCapableMachinesForProcess(processId: number): Promise<ProcessMachineCapabilityResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessMachineCapabilityResponse[]>>(
        `${this.baseUrl}/process/${processId}/capable-machines`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || `Failed to fetch capable machines for process: ${error.message}`
        )
      }
      throw error
    }
  }

  async create(data: CreateProcessMachineCapabilityRequest): Promise<ProcessMachineCapabilityResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ProcessMachineCapabilityResponse>>(this.baseUrl, {
        ...data,
        preferenceLevel: data.preferenceLevel ?? 3,
        efficiencyRating: data.efficiencyRating ?? 100.0,
        isPreferredMachine: data.isPreferredMachine ?? false,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create capability')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create capability: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProcessMachineCapabilityRequest): Promise<ProcessMachineCapabilityResponse> {
    try {
      const response = await apiClient.put<ApiResponse<ProcessMachineCapabilityResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update capability')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update capability: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete capability: ${error.message}`)
      }
      throw error
    }
  }
}

export const processMachineCapabilityService = new ProcessMachineCapabilityService()
