import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateMachineRequest {
  machineName: string
  machineType: string
  location: string
  department?: string
  status?: string
  notes?: string
  dailyCapacityHours?: number
  maxLengthMM?: number
  processCategoryIds?: number[]
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
  dailyCapacityHours: number
  maxLengthMM: number | null
  processCategoryIds: number[]
  processCategoryNames: string[]
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export interface MachineUtilizationResponse {
  machineId: number
  machineCode: string
  machineName: string
  machineType: string | null
  machineStatus: string
  isCurrentlyBusy: boolean
  currentJobCardNo: string | null
  currentProcessName: string | null
  currentJobExpectedFreeAt: string | null
  utilizationPercentToday: number
  scheduledJobsToday: number
  completedJobsToday: number
}

export interface MachineScheduleJobResponse {
  scheduleId: number
  jobCardId: number
  jobCardNo: string
  orderNo: string | null
  itemSequence: string | null
  processName: string | null
  childPartName: string | null
  machineModelName: string | null
  quantity: number
  scheduledStartTime: string
  scheduledEndTime: string
  actualStartTime: string | null
  actualEndTime: string | null
  status: string
  finishedEarly: boolean
}

export interface MachineDailyScheduleResponse {
  machineId: number
  machineCode: string
  machineName: string
  machineType: string | null
  jobs: MachineScheduleJobResponse[]
}

class MachineService {
  private baseUrl = '/machines'

  async getDailySchedule(date?: string): Promise<MachineDailyScheduleResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineDailyScheduleResponse[]>>(
        `${this.baseUrl}/daily-schedule`,
        { params: date ? { date } : undefined }
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch daily schedule: ${error.message}`)
      }
      throw error
    }
  }

  async getUtilization(): Promise<MachineUtilizationResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineUtilizationResponse[]>>(`${this.baseUrl}/utilization`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch machine utilization: ${error.message}`)
      }
      throw error
    }
  }

  async getMachineJobs(machineId: number, date?: string): Promise<MachineScheduleJobResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineScheduleJobResponse[]>>(
        `${this.baseUrl}/${machineId}/jobs`,
        { params: date ? { date } : undefined }
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch machine jobs: ${error.message}`)
      }
      throw error
    }
  }

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

  async getById(id: number): Promise<MachineResponse> {
    try {
      const response = await apiClient.get<ApiResponse<MachineResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Machine not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch machine: ${error.message}`)
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
