import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface JobCardMaterialRequirementResponse {
  id: number
  jobCardId: number
  jobCardNo?: string | null
  rawMaterialId?: number | null
  rawMaterialName: string
  materialGrade: string
  requiredQuantity: number
  unit: string
  wastagePercent: number
  totalQuantityWithWastage: number
  source: string
  confirmedBy: string
  confirmedAt: string
  createdAt: string
  createdBy?: string | null
}

export interface JobCardMaterialRequirementRequest {
  rawMaterialId?: number | null
  rawMaterialName: string
  materialGrade?: string
  requiredQuantity: number
  unit: string
  wastagePercent?: number
  source?: string
  confirmedBy?: string
}

export interface JobCardResponse {
  id: number
  jobCardNo: string
  creationType: string

  orderId: number
  orderNo?: string | null

  drawingId?: number | null
  drawingNumber?: string | null
  drawingRevision?: string | null
  drawingName?: string | null
  drawingSelectionType: string

  childPartId?: number | null
  childPartName?: string | null
  childPartTemplateId?: number | null

  processId: number
  processName?: string | null
  processCode?: string | null
  stepNo?: number | null
  processTemplateId?: number | null

  workInstructions?: string | null
  qualityCheckpoints?: string | null
  specialNotes?: string | null

  quantity: number
  status: string
  priority: string

  manufacturingDimensions?: string | null

  createdAt: string
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  version: number

  materialRequirements?: JobCardMaterialRequirementResponse[]
}

export interface CreateJobCardPayload {
  jobCardNo: string
  creationType?: string
  orderId: number
  orderNo?: string
  drawingId?: number | null
  drawingNumber?: string | null
  drawingRevision?: string | null
  drawingName?: string | null
  drawingSelectionType?: string
  childPartId?: number | null
  childPartName?: string | null
  childPartTemplateId?: number | null
  processId: number
  processName?: string | null
  processCode?: string | null
  stepNo?: number | null
  processTemplateId?: number | null
  workInstructions?: string | null
  qualityCheckpoints?: string | null
  specialNotes?: string | null
  quantity: number
  priority?: string
  manufacturingDimensions?: string | null
  createdBy?: string | null
  prerequisiteJobCardIds?: number[]
  materialRequirements?: JobCardMaterialRequirementRequest[]
}

export interface UpdateJobCardStatusPayload {
  status: string
  updatedBy?: string
}

class JobCardService {
  private baseUrl = '/jobcards'

  async getAll(): Promise<JobCardResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch job cards: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<JobCardResponse> {
    try {
      const response = await apiClient.get<ApiResponse<JobCardResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Job card not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch job card: ${error.message}`)
      }
      throw error
    }
  }

  async getByOrderId(orderId: number): Promise<JobCardResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(`${this.baseUrl}/by-order/${orderId}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch job cards for order: ${error.message}`)
      }
      throw error
    }
  }

  async getByStatus(status: string): Promise<JobCardResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(`${this.baseUrl}/by-status/${status}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch job cards by status: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateJobCardPayload): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create job card: ${error.message}`)
      }
      throw error
    }
  }

  async updateStatus(id: number, data: UpdateJobCardStatusPayload): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(`${this.baseUrl}/${id}/status`, data)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update job card status: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete job card: ${error.message}`)
      }
      throw error
    }
  }
}

export const jobCardService = new JobCardService()
