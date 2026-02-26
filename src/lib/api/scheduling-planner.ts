import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import {
  SchedulableOrderV2,
  ChildPartJobGroup,
  CategoryMachineSuggestion,
  BatchScheduleV2Result,
  CreateScheduleV2Request,
  BatchRescheduleRequest,
} from '@/types/scheduling-planner'

class SchedulingPlannerService {
  private base = '/scheduling-planner'

  async getSchedulableOrders(): Promise<SchedulableOrderV2[]> {
    try {
      const r = await apiClient.get<ApiResponse<SchedulableOrderV2[]>>(`${this.base}/orders`)
      return r.data.data || []
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async getJobCardsForOrders(orderIds: number[], orderItemIds?: number[]): Promise<ChildPartJobGroup[]> {
    try {
      const r = await apiClient.post<ApiResponse<ChildPartJobGroup[]>>(`${this.base}/job-cards`, { orderIds, orderItemIds })
      return r.data.data || []
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async getCategoryMachineSuggestions(jobCardIds: number[], targetDate: string): Promise<CategoryMachineSuggestion[]> {
    try {
      const r = await apiClient.post<ApiResponse<CategoryMachineSuggestion[]>>(
        `${this.base}/category-machines`,
        { jobCardIds, targetDate: new Date(targetDate).toISOString() }
      )
      return r.data.data || []
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async batchCreate(schedules: CreateScheduleV2Request[]): Promise<BatchScheduleV2Result[]> {
    try {
      const r = await apiClient.post<ApiResponse<BatchScheduleV2Result[]>>(
        `${this.base}/batch`,
        { schedules }
      )
      return r.data.data || []
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async batchReschedule(request: BatchRescheduleRequest): Promise<boolean> {
    try {
      const r = await apiClient.post<ApiResponse<boolean>>(`${this.base}/batch-reschedule`, request)
      if (!r.data.success) throw new Error(r.data.message)
      return true
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }

  async createRework(parentJobCardId: number, reworkQty: number, notes?: string): Promise<number> {
    try {
      const r = await apiClient.post<ApiResponse<number>>(
        `${this.base}/rework/${parentJobCardId}`,
        { reworkQty, notes }
      )
      if (!r.data.success) throw new Error(r.data.message)
      return r.data.data!
    } catch (e) {
      if (axios.isAxiosError(e)) throw new Error(e.response?.data?.message || e.message)
      throw e
    }
  }
}

export const schedulingPlannerService = new SchedulingPlannerService()
