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
  wastageMM: number
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
  wastageMM?: number
  source?: string
  confirmedBy?: string
}

export interface JobCardResponse {
  id: number
  jobCardNo: string
  creationType: string

  orderId: number
  orderNo?: string | null
  orderItemId?: number | null
  itemSequence?: string | null
  machineModelName?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null

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
  productionStatus: string
  completedQty: number
  rejectedQty: number
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
  orderItemId?: number | null
  itemSequence?: string | null
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

export interface PagedJobCards {
  items: JobCardResponse[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface JobCardSummary {
  total: number
  pending: number
  scheduled: number
  inProgress: number
  completed: number
}

class JobCardService {
  private baseUrl = '/jobcards'

  // QC rejections register — job cards with rejected pieces
  async getRejections(): Promise<JobCardResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<JobCardResponse[]>>(`${this.baseUrl}/rejections`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch rejections: ${error.message}`)
      }
      throw error
    }
  }

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

  async getPaged(page: number, pageSize: number, search?: string, status?: string): Promise<PagedJobCards> {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search && search.trim()) params.append('search', search.trim())
      if (status && status !== 'all') params.append('status', status)
      const response = await apiClient.get<ApiResponse<PagedJobCards>>(`${this.baseUrl}/paged?${params.toString()}`)
      return response.data.data || { items: [], totalCount: 0, page, pageSize, totalPages: 0 }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch job cards: ${error.message}`)
      }
      throw error
    }
  }

  async getSummary(): Promise<JobCardSummary> {
    try {
      const response = await apiClient.get<ApiResponse<JobCardSummary>>(`${this.baseUrl}/summary`)
      return response.data.data || { total: 0, pending: 0, scheduled: 0, inProgress: 0, completed: 0 }
    } catch {
      return { total: 0, pending: 0, scheduled: 0, inProgress: 0, completed: 0 }
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

  async updateQuantity(id: number, newQuantity: number): Promise<void> {
    try {
      const response = await apiClient.patch<ApiResponse<boolean>>(
        `${this.baseUrl}/${id}/update-quantity`,
        { newQuantity, updatedBy: 'Admin' }
      )
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update quantity: ${error.message}`)
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
