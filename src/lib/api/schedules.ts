import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import {
  MachineSchedule,
  MachineSuggestion,
  CreateScheduleRequest,
  UpdateStatusRequest,
  RescheduleRequest,
  OrderSchedulingTree
} from '@/types/schedule'

class ScheduleService {
  private baseUrl = '/schedules'

  /**
   * Get all schedules
   */
  async getAll(): Promise<MachineSchedule[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineSchedule[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch schedules: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get schedule by ID
   */
  async getById(id: number): Promise<MachineSchedule> {
    try {
      const response = await apiClient.get<ApiResponse<MachineSchedule>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Schedule not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch schedule: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get schedules by machine ID
   */
  async getByMachine(machineId: number): Promise<MachineSchedule[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineSchedule[]>>(
        `${this.baseUrl}/by-machine/${machineId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch schedules for machine: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get schedules by job card ID
   */
  async getByJobCard(jobCardId: number): Promise<MachineSchedule[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineSchedule[]>>(
        `${this.baseUrl}/by-jobcard/${jobCardId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch schedules for job card: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get schedules by date range
   */
  async getByDateRange(startDate: Date, endDate: Date): Promise<MachineSchedule[]> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      const response = await apiClient.get<ApiResponse<MachineSchedule[]>>(
        `${this.baseUrl}/by-date-range?${params}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch schedules by date range: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * SEMI-AUTOMATIC SCHEDULING: Get intelligent machine suggestions for a job card
   * This is the key method for semi-automatic scheduling
   */
  async getMachineSuggestions(jobCardId: number): Promise<MachineSuggestion[]> {
    try {
      const response = await apiClient.get<ApiResponse<MachineSuggestion[]>>(
        `${this.baseUrl}/suggestions/${jobCardId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch machine suggestions: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Get full scheduling tree for an order: Order → ChildPart groups → Process steps
   */
  async getOrderSchedulingTree(orderId: number): Promise<OrderSchedulingTree> {
    try {
      const response = await apiClient.get<ApiResponse<OrderSchedulingTree>>(
        `${this.baseUrl}/order/${orderId}/tree`
      )
      if (!response.data.data) throw new Error('Scheduling tree not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch scheduling tree: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Create a new schedule
   */
  async create(data: CreateScheduleRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create schedule: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Update an existing schedule
   */
  async update(id: number, data: CreateScheduleRequest): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, data)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update schedule: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Delete a schedule
   */
  async delete(id: number): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete schedule: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Update schedule status
   */
  async updateStatus(id: number, data: UpdateStatusRequest): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/${id}/status`,
        data
      )
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update schedule status: ${error.message}`)
      }
      throw error
    }
  }

  /**
   * Reschedule an existing schedule
   */
  async reschedule(id: number, data: RescheduleRequest): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/${id}/reschedule`,
        data
      )
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to reschedule: ${error.message}`)
      }
      throw error
    }
  }
}

export const scheduleService = new ScheduleService()
